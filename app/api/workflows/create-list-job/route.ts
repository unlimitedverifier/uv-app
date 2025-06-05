import { serve } from '@upstash/workflow/nextjs';
import { 
  userListSnippetsRedis, 
  userListsDataRedis, 
  userValidationJobResponsesRedis,
  THIRTY_DAYS_TTL,
  setTTL,
  generateListId,
  extractEmailsFromRows,
  type WorkflowInputs,
  type UserListSnippet,
  type UserListData
} from '../../../../utils/redis-clients';

export const { POST } = serve<WorkflowInputs['createListJob']>(
  async (context) => {
    // Check for QStash callback interference first
    const payload = context.requestPayload as WorkflowInputs['createListJob'];
    console.log(`📥 Create List Job received request`);
    
    const { userId, originalFileName, filePayload, selectedColumn, listId: providedListId, revalidate } = context.requestPayload;
    
    // Check if this looks like a QStash callback (wrong endpoint)
    if ('sourceMessageId' in payload || 'workflowRunId' in payload || 'url' in payload || 'messageId' in payload) {
      console.log(`🚫 Ignoring QStash callback sent to wrong endpoint`);
      return { success: false, message: 'QStash callback sent to wrong endpoint - ignoring' };
    }
    
    // Check if this is an invalid callback without proper structure
    if (!payload || typeof payload !== 'object') {
      console.log(`🚫 Invalid payload structure in create-list-job`);
      return { success: false, message: 'Invalid payload structure' };
    }
    
    // Enhanced callback detection for malformed requests
    if (!userId && !originalFileName && !filePayload && !revalidate) {
      console.log(`🚫 Malformed callback detected - returning success to prevent retries`);
      return { success: true, message: 'Malformed callback ignored' };
    }
    
    // Handle revalidation case
    if (revalidate && providedListId) {
      console.log(`🔄 Revalidating existing list: ${providedListId}`);
      
      // Reset snippet status to in_progress and clear previous results
      const snippetKey = `userListSnippet:${userId}:${providedListId}`;
      await userListSnippetsRedis.hset(snippetKey, {
        validCount: '0',
        catchAllCount: '0',
        unknownCount: '0',
        invalidCount: '0',
        percentValid: '0',
        percentCatchAll: '0',
        percentUnknown: '0',
        percentInvalid: '0',
        status: 'in_progress',
        dateValidated: ''
      });
      
      // Clear previous validation results
      const responsesKey = `validationJobResponses:${userId}:${providedListId}`;
      await userValidationJobResponsesRedis.del(responsesKey);
      
      // Get the total emails from the existing snippet
      const snippetData = await userListSnippetsRedis.hgetall(snippetKey) as Record<string, string>;
      const totalEmails = parseInt(snippetData.totalEmails || '0');
      
      if (totalEmails > 0) {
        // Start validation for the revalidated list
        await context.call('verify-first-chunk', {
          url: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/workflows/verify-250-emails`,
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: {
            userId,
            listId: providedListId,
            startIndex: 0,
            chunkSize: 250,
            attempt: 1
          }
        });
      }
      
      return {
        success: true,
        listId: providedListId,
        totalEmails,
        message: 'Email validation restarted successfully'
      };
    }
    
    // Original validation logic for new lists
    if (!userId || !originalFileName) {
      console.error(`❌ Missing parameters: userId=${userId}, originalFileName=${originalFileName}`);
      throw new Error('Missing required parameters: userId and originalFileName are required');
    }

    if (!filePayload || !Array.isArray(filePayload) || filePayload.length === 0) {
      console.error(`❌ Invalid filePayload: ${typeof filePayload}, length: ${Array.isArray(filePayload) ? filePayload.length : 'N/A'}`);
      throw new Error('filePayload must be a non-empty array of row objects');
    }
    
    // Use provided listId or generate a new one
    const listId = providedListId || generateListId();
    const uploadTimestamp = new Date().toISOString();
    
    console.log(`🚀 Create List Job - userId: ${userId}, listId: ${listId}, rows: ${filePayload.length}, selectedColumn: ${selectedColumn}`);
    
    // Extract emails and validate constraints
    const emailRows = extractEmailsFromRows(filePayload, selectedColumn);
    const totalEmails = emailRows.length;
    
    console.log(`📧 Extracted ${totalEmails} emails from selected column: ${selectedColumn}`);
    
    // Validate constraints (up to 100,000 emails or 9.9 MB of data)
    if (totalEmails > 100000) {
      throw new Error('Too many emails: maximum 100,000 emails allowed');
    }
    
    const dataSize = JSON.stringify(filePayload).length;
    const maxSizeBytes = 9.9 * 1024 * 1024; // 9.9 MB
    if (dataSize > maxSizeBytes) {
      throw new Error('File too large: maximum 9.9 MB allowed');
    }

    // Extract all column names from the first row
    const columns = filePayload.length > 0 ? Object.keys(filePayload[0]) : [];
    
    // Step 1: Write to User List Snippets Redis (metadata and progress tracking)
    await context.run(`save-snippet-${listId}`, async () => {
      const userListSnippet: UserListSnippet = {
        userId,
        listId,
        listName: originalFileName,
        uploadTimestamp,
        dateValidated: '', // Will be filled when complete
        totalEmails: totalEmails.toString(),
        validCount: '0',
        catchAllCount: '0',
        unknownCount: '0',
        invalidCount: '0',
        percentValid: '0',
        percentCatchAll: '0',
        percentUnknown: '0',
        percentInvalid: '0',
        status: 'in_progress',
        additionalMetadata: JSON.stringify({
          fileSizeBytes: dataSize,
          uploadedAt: uploadTimestamp
        })
      };
      
      const snippetKey = `userListSnippet:${userId}:${listId}`;
      await userListSnippetsRedis.hset(snippetKey, userListSnippet);
      await setTTL(userListSnippetsRedis, snippetKey, THIRTY_DAYS_TTL);
    });
    
    // Step 2: Write to User List Data Redis (full data storage)
    await context.run(`save-list-data-${listId}`, async () => {
      const userListData: UserListData = {
        metadata: {
          userId,
          listId,
          listName: originalFileName,
          columns,
          uploadTimestamp,
          dateValidated: '', // Will be filled when complete
          expiryDays: 30
        },
        rows: filePayload
      };
      
      const dataKey = `userListData:${userId}:${listId}`;
      await userListsDataRedis.set(dataKey, JSON.stringify(userListData));
      await setTTL(userListsDataRedis, dataKey, THIRTY_DAYS_TTL);
    });
    
    // Step 3: Initialize User Validation Job Responses Redis
    await context.run(`init-responses-${listId}`, async () => {
      const responsesKey = `validationJobResponses:${userId}:${listId}`;
      await userValidationJobResponsesRedis.del(responsesKey); // Ensure clean start
      await setTTL(userValidationJobResponsesRedis, responsesKey, THIRTY_DAYS_TTL);
    });
    
    // Step 4: Enqueue the first "Verify 250 Emails" task (if there are emails to validate)
    if (totalEmails > 0) {
      await context.call('verify-first-chunk', {
        url: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/workflows/verify-250-emails`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          userId,
          listId,
          startIndex: 0,
          chunkSize: 250,
          attempt: 1
        }
      });
    } else {
      // No emails to validate, mark as complete immediately
      await context.call('complete-immediately', {
        url: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/workflows/complete-list-job`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          userId,
          listId
        }
      });
    }
    
    return {
      success: true,
      listId,
      totalEmails,
      message: 'Email validation job created successfully'
    };
  }
); 