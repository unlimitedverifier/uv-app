import { serve } from '@upstash/workflow/nextjs';
import { 
  userListSnippetsRedis, 
  userListsDataRedis, 
  userValidationJobResponsesRedis,
  type WorkflowInputs,
  type UserListData,
  type ValidationResult
} from '../../../../utils/redis-clients';

export const { POST } = serve<WorkflowInputs['completeListJob']>(
  async (context) => {
    // Check for QStash callback interference first
    const payload = context.requestPayload as WorkflowInputs['completeListJob'];
    console.log(`🎯 Complete List Job - userId: ${payload.userId}, listId: ${payload.listId}`);
    
    const { userId, listId } = payload;
    
    // Validate parameters
    if (!userId || !listId) {
      throw new Error('Missing required parameters: userId and listId are required');
    }

    // Step 1: Retrieve all validation results from Redis
    const validationResults = await context.run(`get-validation-results-${listId}`, async () => {
      const responsesKey = `validationJobResponses:${userId}:${listId}`;
      const responses = await userValidationJobResponsesRedis.lrange(responsesKey, 0, -1);
      
      const allResults: ValidationResult[] = [];
      
      for (const response of responses) {
        try {
          const chunkResults: ValidationResult[] = JSON.parse(response);
          allResults.push(...chunkResults);
        } catch (err) {
          console.warn('Failed to parse validation chunk:', err);
        }
      }
      
      console.log(`📋 Retrieved ${allResults.length} validation results`);
      return allResults;
    });

    // Step 2: Retrieve and merge with original data
    const mergedData = await context.run(`merge-validation-data-${listId}`, async () => {
      const dataKey = `userListData:${userId}:${listId}`;
      const rawData = await userListsDataRedis.get(dataKey);
      
      if (!rawData) {
        throw new Error('Original list data not found');
      }
      
      const listData: UserListData = JSON.parse(rawData);
      
      // Create a map of email to validation result for quick lookup
      const validationMap = new Map<string, ValidationResult>();
      for (const result of validationResults) {
        validationMap.set(result.email.toLowerCase(), result);
      }
      
      // Merge validation results with original rows
      const updatedRows = listData.rows.map((row) => {
        // Find email column (case-insensitive search)
        let emailValue = '';
        for (const [key, value] of Object.entries(row)) {
          if (key.toLowerCase().includes('email') && typeof value === 'string' && value.includes('@')) {
            emailValue = value.toLowerCase();
            break;
          }
        }
        
        const validation = validationMap.get(emailValue);
        if (validation) {
          return {
            ...row,
            validStatus: validation.valid,
            catchAll: validation.catch_all,
            category: validation.category,
            errorMessage: validation.error
          };
        }
        
        // No validation result found, mark as unknown
        return {
          ...row,
          validStatus: 'Unknown',
          catchAll: 'Unknown', 
          category: 'Risky',
          errorMessage: 'No validation result'
        };
      });
      
      console.log(`🔗 Merged validation results into ${updatedRows.length} rows`);
      return { ...listData, rows: updatedRows };
    });

    // Step 3: Save merged data back to Redis
    await context.run(`save-merged-data-${listId}`, async () => {
      const dataKey = `userListData:${userId}:${listId}`;
      const completedData = {
        ...mergedData,
        metadata: {
          ...mergedData.metadata,
          dateValidated: new Date().toISOString()
        }
      };
      
      await userListsDataRedis.set(dataKey, JSON.stringify(completedData));
      console.log(`💾 Saved merged data with ${mergedData.rows.length} rows`);
    });

    // Step 4: Calculate and update final statistics
    const finalStats = await context.run(`calculate-final-stats-${listId}`, async () => {
      // Count categories in the merged data
      let goodCount = 0;
      let catchAllCount = 0;
      let riskyCount = 0;
      let badCount = 0;

      for (const row of mergedData.rows) {
        const category = row.category;
        switch (category) {
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

      const totalEmails = mergedData.rows.length;
      const percentGood = totalEmails > 0 ? (goodCount / totalEmails) * 100 : 0;
      const percentCatchAll = totalEmails > 0 ? (catchAllCount / totalEmails) * 100 : 0;
      const percentRisky = totalEmails > 0 ? (riskyCount / totalEmails) * 100 : 0;
      const percentBad = totalEmails > 0 ? (badCount / totalEmails) * 100 : 0;

      console.log(`✅ Final results: ${goodCount} good, ${catchAllCount} catch-all, ${riskyCount} risky, ${badCount} bad`);

      return {
        goodCount,
        catchAllCount,
        riskyCount,
        badCount,
        percentGood,
        percentCatchAll,
        percentRisky,
        percentBad
      };
    });

    // Step 5: Update snippet with completion status
    await context.run(`update-snippet-completion-${listId}`, async () => {
      const snippetKey = `userListSnippet:${userId}:${listId}`;
      
      await userListSnippetsRedis.hset(snippetKey, {
        validCount: finalStats.goodCount.toString(),
        catchAllCount: finalStats.catchAllCount.toString(),
        unknownCount: finalStats.riskyCount.toString(),
        invalidCount: finalStats.badCount.toString(),
        percentValid: finalStats.percentGood.toFixed(2),
        percentCatchAll: finalStats.percentCatchAll.toFixed(2),
        percentUnknown: finalStats.percentRisky.toFixed(2),
        percentInvalid: finalStats.percentBad.toFixed(2),
        status: 'completed',
        dateValidated: new Date().toISOString()
      });
    });

    // Step 6: Send completion notification (placeholder)
    await context.run(`send-completion-notification-${listId}`, async () => {
      // TODO: Implement email/webhook notification system
      console.log(`📧 TODO: Send completion notification for list ${listId}`);
    });

    // Step 7: Log completion
    await context.run(`log-completion-${listId}`, async () => {
      console.log(`🎉 Complete List Job finished successfully for ${userId}:${listId}`);
    });

    return {
      success: true,
      listId,
      totalEmails: mergedData.rows.length,
      results: finalStats,
      message: 'Email validation completed successfully'
    };
  }
); 