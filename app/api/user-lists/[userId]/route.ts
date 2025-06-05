import { NextRequest, NextResponse } from 'next/server';
import { 
  userListSnippetsRedis,
  type UserListSnippet
} from '../../../../utils/redis-clients';

interface Params {
  userId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    console.log('✅ Using Railway Redis databases');
    
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Scan for all user list snippets for this user
    const pattern = `userListSnippet:${userId}:*`;
    const keys = await userListSnippetsRedis.keys(pattern);
    
    console.log(`📋 Found ${keys.length} lists for user ${userId}`);
    
    const lists: UserListSnippet[] = [];
    
    // Fetch all user list snippets
    for (const key of keys) {
      try {
        const listData = await userListSnippetsRedis.hgetall(key);
        
        if (listData && Object.keys(listData).length > 0) {
          lists.push(listData as UserListSnippet);
        }
      } catch (err) {
        console.error(`Error fetching list data for key ${key}:`, err);
        // Continue with other lists even if one fails
      }
    }
    
    // Sort by upload timestamp (newest first)
    lists.sort((a, b) => {
      const dateA = new Date(a.uploadTimestamp).getTime();
      const dateB = new Date(b.uploadTimestamp).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({
      success: true,
      lists,
      count: lists.length,
      userId
    });

  } catch (error) {
    console.error('Error fetching user lists:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch user validation lists',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 