import { NextRequest, NextResponse } from 'next/server';
import { userListSnippetsRedis } from '../../../../../utils/redis-clients';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; listId: string }> }
) {
  try {
    const { userId, listId } = await params;
    
    if (!userId || !listId) {
      return NextResponse.json(
        { error: 'userId and listId are required' },
        { status: 400 }
      );
    }
    
    // Get the progress data from Redis
    const snippetKey = `userListSnippet:${userId}:${listId}`;
    const snippetData = await userListSnippetsRedis.hgetall(snippetKey) as Record<string, string>;
    
    if (!snippetData || Object.keys(snippetData).length === 0) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }
    
    // Calculate overall progress percentage
    const totalEmails = parseInt(snippetData.totalEmails as string || '0');
    const processedEmails = parseInt(snippetData.validCount as string || '0') + 
                            parseInt(snippetData.catchAllCount as string || '0') +
                            parseInt(snippetData.invalidCount as string || '0') + 
                            parseInt(snippetData.unknownCount as string || '0');
    
    const overallProgress = totalEmails > 0 ? Math.round((processedEmails / totalEmails) * 100) : 0;
    
    return NextResponse.json({
      userId,
      listId,
      listName: snippetData.listName,
      status: snippetData.status, // 'in_progress' or 'completed'
      uploadTimestamp: snippetData.uploadTimestamp,
      dateValidated: snippetData.dateValidated || null,
      totalEmails,
      processedEmails,
      overallProgress,
      results: {
        validCount: parseInt(snippetData.validCount as string || '0'),
        catchAllCount: parseInt(snippetData.catchAllCount as string || '0'),
        unknownCount: parseInt(snippetData.unknownCount as string || '0'),
        invalidCount: parseInt(snippetData.invalidCount as string || '0'),
        percentValid: parseFloat(snippetData.percentValid as string || '0'),
        percentCatchAll: parseFloat(snippetData.percentCatchAll as string || '0'),
        percentUnknown: parseFloat(snippetData.percentUnknown as string || '0'),
        percentInvalid: parseFloat(snippetData.percentInvalid as string || '0')
      },
      additionalMetadata: snippetData.additionalMetadata ? 
        JSON.parse(snippetData.additionalMetadata as string) : null
    });
    
  } catch (error) {
    console.error('Progress check error:', error);
    return NextResponse.json(
      { error: 'Failed to check progress' },
      { status: 500 }
    );
  }
} 