import { NextRequest, NextResponse } from 'next/server';
import { 
  userListSnippetsRedis, 
  userListsDataRedis, 
  userValidationJobResponsesRedis
} from '../../../../../utils/redis-clients';

export async function DELETE(
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
    
    console.log(`🗑️ Deleting list data for userId: ${userId}, listId: ${listId}`);
    
    // Delete from all three Redis databases
    const snippetKey = `userListSnippet:${userId}:${listId}`;
    const dataKey = `userListData:${userId}:${listId}`;
    const responsesKey = `validationJobResponses:${userId}:${listId}`;
    
    await Promise.all([
      userListSnippetsRedis.del(snippetKey),
      userListsDataRedis.del(dataKey),
      userValidationJobResponsesRedis.del(responsesKey)
    ]);
    
    console.log(`✅ Successfully deleted all data for list ${listId}`);
    
    return NextResponse.json({
      success: true,
      message: 'List data deleted successfully',
      listId
    });
    
  } catch (error) {
    console.error('Delete list error:', error);
    return NextResponse.json(
      { error: 'Failed to delete list data' },
      { status: 500 }
    );
  }
} 