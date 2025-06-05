import { serve } from '@upstash/workflow/nextjs';
import { 
  userListSnippetsRedis, 
  userListsDataRedis, 
  userValidationJobResponsesRedis,
  type WorkflowInputs,
  type UserListData,
  type ValidationResult
} from '../../../../utils/redis-clients';

export const { POST } = serve<WorkflowInputs['verify250Emails']>(
  async (context) => {
    // Check for QStash callback interference first
    const payload = context.requestPayload as WorkflowInputs['verify250Emails'];
    
    // Check if this looks like a QStash callback
    if ('sourceMessageId' in payload || 'workflowRunId' in payload || 'url' in payload || 'messageId' in payload) {
      console.log(`🚫 Ignoring QStash callback in verify-250-emails`);
      return { success: false, message: 'QStash callback ignored' };
    }
    
    // Check if this is an invalid callback without proper structure
    if (!payload || typeof payload !== 'object') {
      console.log(`🚫 Invalid payload structure in verify-250-emails`);
      return { success: false, message: 'Invalid payload structure' };
    }
    
    const { userId, listId, startIndex, chunkSize, attempt } = context.requestPayload;
    
    // Validate required inputs
    if (!userId || !listId || startIndex === undefined || !chunkSize || !attempt) {
      throw new Error('Missing required parameters for email verification');
    }
    
    console.log(`🔄 Verify 250 Emails - userId: ${userId}, listId: ${listId}, startIndex: ${startIndex}, attempt: ${attempt}`);
    
    // Step 1: Fetch the raw data from userListData
    const userData = await context.run(`fetch-data-${listId}-${startIndex}`, async () => {
      const dataKey = `userListData:${userId}:${listId}`;
      const rawData = await userListsDataRedis.get(dataKey);
      
      if (!rawData) {
        throw new Error(`User list data not found for key: ${dataKey}`);
      }
      
      const parsedData: UserListData = JSON.parse(rawData);
      return parsedData;
    });
    
    // Step 2: Extract emails for this chunk (startIndex to startIndex + chunkSize)
    const emailsToValidate = await context.run(`extract-emails-${listId}-${startIndex}`, async () => {
      const endIndex = Math.min(startIndex + chunkSize, userData.rows.length);
      const chunk = userData.rows.slice(startIndex, endIndex);
      
      const emails: string[] = [];
      
      for (const row of chunk) {
        // Find email field in the row (flexible field detection)
        const emailField = Object.keys(row).find(key => 
          key.toLowerCase().includes('email') && 
          typeof row[key] === 'string' && 
          row[key].includes('@')
        );
        
        if (emailField && row[emailField]) {
          emails.push(String(row[emailField]).trim());
        }
      }
      
      console.log(`📧 Processing ${emails.length} emails from index ${startIndex}`);
      return emails;
    });
    
    // Step 3: Call the validation API (with retry logic)
    const validationResults = await context.run(`validate-emails-${listId}-${startIndex}-attempt-${attempt}`, async () => {
      if (emailsToValidate.length === 0) {
        return [];
      }
      
      const validationUrl = process.env.HTTP_VALIDATION_URL || 'https://http-standard-server-production.up.railway.app/email_verification';
      
      try {
        const startTime = Date.now();
        
        // Log the request details for debugging
        console.log(`📤 Sending validation request to: ${validationUrl}`);
        console.log(`📤 Request payload: ${JSON.stringify({ emails: emailsToValidate.slice(0, 3) })}... (showing first 3 emails)`);
        console.log(`📤 Total emails in request: ${emailsToValidate.length}`);
        
        const response = await fetch(validationUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            emails: emailsToValidate
          }),
          // 5 minute timeout for validation
          signal: AbortSignal.timeout(300000)
        });
        
        if (!response.ok) {
          throw new Error(`Validation API returned ${response.status}: ${response.statusText}`);
        }
        
        console.log(`📨 Response: ${response.status} (${Date.now() - startTime}ms)`);
        
        // Check content type before parsing
        const contentType = response.headers.get('content-type');
        console.log(`📋 Content-Type: ${contentType}`);
        
        // Get response as text first, then try to parse as JSON
        const responseText = await response.text();
        console.log(`📋 Response text sample:`, responseText.substring(0, 200));
        
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error(`Validation API returned non-JSON response. Content-Type: ${contentType}. Response: ${responseText.substring(0, 200)}`);
        }
        
        let validationData;
        try {
          validationData = JSON.parse(responseText);
        } catch (parseError) {
          throw new Error(`Failed to parse JSON response from validation API. Parse error: ${parseError instanceof Error ? parseError.message : 'Unknown'}. Response: ${responseText.substring(0, 200)}`);
        }
        
        // Log the actual response for debugging
        console.log(`📋 API Response type: ${typeof validationData}, length: ${Array.isArray(validationData) ? validationData.length : 'N/A'}`);
        console.log(`📋 API Response sample:`, JSON.stringify(validationData).substring(0, 200));
        
        // Handle the correct API response format
        let results: unknown[];
        if (Array.isArray(validationData)) {
          // Direct array format
          results = validationData;
        } else if (validationData && typeof validationData === 'object' && Array.isArray(validationData.results)) {
          // Object with results property format
          results = validationData.results;
          console.log(`📋 Extracted results array with ${results.length} items`);
        } else {
          // Check if it's a common API error response format
          if (validationData && typeof validationData === 'object') {
            if (validationData.error || validationData.message || validationData.detail) {
              const errorMsg = validationData.error || validationData.message || validationData.detail;
              throw new Error(`Validation API returned error: ${errorMsg}`);
            }
            if (validationData.status && validationData.status !== 'success') {
              throw new Error(`Validation API returned status: ${validationData.status}. Response: ${JSON.stringify(validationData).substring(0, 200)}`);
            }
          }
          throw new Error(`Invalid response format from validation API. Expected array or object with results property, got: ${typeof validationData}. Response: ${JSON.stringify(validationData).substring(0, 200)}`);
        }
        
        if (results.length === 0) {
          throw new Error('Validation API returned empty results array');
        }
        
        // Process and standardize validation results
        const processedResults: ValidationResult[] = results.map((result: unknown) => {
          // Cast to expected format and validate basic structure
          const validationResult = result as ValidationResult;
          
          // Basic validation that required properties exist
          if (!validationResult || typeof validationResult !== 'object') {
            throw new Error('Invalid validation result format');
          }
          
          // Helper function to determine proper category
          function getProperCategory(validationResult: ValidationResult): 'Good' | 'Catch all' | 'Risky' | 'Bad' {
            const isValid = validationResult.valid === 'Valid';
            const isInvalid = validationResult.valid === 'Invalid';
            const isCatchAll = validationResult.catch_all === 'Yes';
            
            // Updated 4-category system to match Flask server logic:
            // 1. Good: Valid emails that are not catch-all
            // 2. Catch all: Catch-all emails (regardless of valid status)
            // 3. Risky: Emails with errors or unknown status (but not invalid, not catch-all)
            // 4. Bad: Invalid emails
            
            if (isCatchAll) {
              return 'Catch all'; // Catch-all emails (regardless of valid status)
            } else if (isInvalid) {
              return 'Bad'; // Invalid emails
            } else if (isValid && !isCatchAll) {
              return 'Good'; // Valid emails (non catch-all)
            } else {
              return 'Risky'; // Unknown emails, errors, or other risky cases
            }
          }
          
          return {
            email: validationResult.email,
            valid: validationResult.valid,
            catch_all: validationResult.catch_all,
            category: getProperCategory(validationResult),
            error: validationResult.error
          };
        });
        
        console.log(`✅ Validation completed: ${processedResults.length} results`);
        return processedResults;
        
      } catch (error) {
        console.error(`❌ Validation failed (attempt ${attempt}):`, error);
        
        // Retry logic: up to 4 attempts with exponential backoff
        if (attempt < 4) {
          const backoffDelay = Math.pow(2, attempt - 1) * 5000; // 5s, 10s, 20s delays
          console.log(`⏳ Retrying in ${backoffDelay}ms (attempt ${attempt + 1}/4)`);
          
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
          
          // Recursive retry by calling the workflow again
          const retryResult = await context.call(`retry-validation-${listId}-${startIndex}-${attempt + 1}`, {
            url: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/workflows/verify-250-emails`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {
              userId,
              listId,
              startIndex,
              chunkSize,
              attempt: attempt + 1
            }
          });
          
          // Return the retry result
          return retryResult;
        }
        
        // All retries failed, return error results
        console.error(`💥 All retry attempts failed for chunk ${startIndex}-${startIndex + chunkSize}`);
        
        // Mark the job as failed in Redis instead of creating error results
        const snippetKey = `userListSnippet:${userId}:${listId}`;
        await userListSnippetsRedis.hset(snippetKey, {
          status: 'failed'
        });
        
        console.log(`❌ Job marked as failed due to validation API failures`);
        
        // Return early to prevent further processing
        return {
          success: false,
          listId,
          startIndex,
          processed: 0,
          message: `Validation failed after ${attempt} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
    }) as ValidationResult[] | { success: false; listId: string; startIndex: number; processed: number; message: string };

    // Check if validation completely failed (not an array of results)
    if (!Array.isArray(validationResults)) {
      // Job was marked as failed, return the failure response
      return validationResults;
    }
    
    // Step 4: Save validation results to Redis
    await context.run(`save-validation-results-${listId}-${startIndex}`, async () => {
      if (validationResults && validationResults.length > 0) {
        console.log(`✅ Proceeding with ${validationResults.length} validation results`);
        
        const responsesKey = `validationJobResponses:${userId}:${listId}`;
        await userValidationJobResponsesRedis.rpush(responsesKey, JSON.stringify(validationResults));
        console.log(`💾 Persisted ${validationResults.length} results to Redis`);
      }
    });
    
    // Step 5: Update progress in userListSnippets
    await context.run(`update-progress-${listId}-${startIndex}`, async () => {
      if (!validationResults || validationResults.length === 0) {
        return;
      }
      
      // Count categories for progress tracking
      let goodCount = 0;
      let catchAllCount = 0;
      let riskyCount = 0;
      let badCount = 0;
      
      for (const result of validationResults) {
        switch (result.category) {
          case 'Good':
            goodCount++;
            break;
          case 'Catch all':
            catchAllCount++;
            break;
          case 'Risky':
            riskyCount++;
            break;
          case 'Bad':
            badCount++;
            break;
        }
      }
      
      // Get current counts from Redis and add new counts
      const snippetKey = `userListSnippet:${userId}:${listId}`;
      const currentSnippet = await userListSnippetsRedis.hgetall(snippetKey) as Record<string, string>;
      
      const currentGood = parseInt(currentSnippet.validCount || '0');
      const currentCatchAll = parseInt(currentSnippet.catchAllCount || '0');
      const currentRisky = parseInt(currentSnippet.unknownCount || '0');
      const currentBad = parseInt(currentSnippet.invalidCount || '0');
      const totalEmails = parseInt(currentSnippet.totalEmails || '0');
      
      const newGood = currentGood + goodCount;
      const newCatchAll = currentCatchAll + catchAllCount;
      const newRisky = currentRisky + riskyCount;
      const newBad = currentBad + badCount;
      
      const processedEmails = newGood + newCatchAll + newRisky + newBad;
      const overallProgress = totalEmails > 0 ? Math.round((processedEmails / totalEmails) * 100) : 0;
      
      const percentGood = totalEmails > 0 ? (newGood / totalEmails) * 100 : 0;
      const percentCatchAll = totalEmails > 0 ? (newCatchAll / totalEmails) * 100 : 0;
      const percentRisky = totalEmails > 0 ? (newRisky / totalEmails) * 100 : 0;
      const percentBad = totalEmails > 0 ? (newBad / totalEmails) * 100 : 0;
      
      await userListSnippetsRedis.hset(snippetKey, {
        validCount: newGood.toString(),
        catchAllCount: newCatchAll.toString(),
        unknownCount: newRisky.toString(),
        invalidCount: newBad.toString(),
        percentValid: percentGood.toFixed(2),
        percentCatchAll: percentCatchAll.toFixed(2),
        percentUnknown: percentRisky.toFixed(2),
        percentInvalid: percentBad.toFixed(2)
      });
      
      console.log(`📊 Progress: ${processedEmails}/${totalEmails} (${overallProgress}%) - G:${newGood} C:${newCatchAll} R:${newRisky} B:${newBad}`);
    });
    
    // Step 6: Handle next step (continue processing or complete)
    const nextStepResult = await context.run(`handle-next-step-${listId}-${startIndex}`, async () => {
      const totalRows = userData.rows.length;
      const nextStartIndex = startIndex + chunkSize;
      
      console.log(`🔄 HandleNextStep: processed ${startIndex}-${startIndex + chunkSize}, totalRows: ${totalRows}, nextStart: ${nextStartIndex}`);
      
      if (nextStartIndex >= totalRows) {
        // All chunks processed - return completion signal
        console.log(`🎯 All chunks processed, ready to trigger completion workflow`);
        return { completed: true };
      } else {
        // More chunks to process - return next chunk info
        console.log(`➡️ Ready to process next chunk: ${nextStartIndex}-${Math.min(nextStartIndex + chunkSize, totalRows)}`);
        return { completed: false, nextStartIndex };
      }
    });

    // Step 7: Execute next action based on the result (outside of context.run to avoid nesting)
    if (nextStepResult.completed) {
      // Trigger completion workflow
      await context.call(`complete-validation-${listId}`, {
        url: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/workflows/complete-list-job`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          userId,
          listId
        }
      });
    } else if (nextStepResult.nextStartIndex !== undefined) {
      // Process next chunk
      await context.call(`process-next-chunk-${nextStepResult.nextStartIndex}`, {
        url: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/workflows/verify-250-emails`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          userId,
          listId,
          startIndex: nextStepResult.nextStartIndex,
          chunkSize,
          attempt: 1
        }
      });
    }
    
    return {
      success: true,
      listId,
      startIndex,
      processed: validationResults ? validationResults.length : 0,
      nextStepResult,
      message: `Successfully processed chunk ${startIndex}-${startIndex + (validationResults ? validationResults.length : 0)}`
    };
  }
); 