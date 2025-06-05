import { NextRequest, NextResponse } from 'next/server';
import { 
  userListsDataRedis,
  type UserListData
} from '../../../../../utils/redis-clients';

interface Params {
  userId: string;
  listId: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    console.log('✅ Using Railway Redis databases');
    
    const { userId, listId } = await params;
    
    if (!userId || !listId) {
      return NextResponse.json(
        { error: 'User ID and List ID are required' },
        { status: 400 }
      );
    }

    // Fetch the full list data from userListsDataRedis
    const dataKey = `userListData:${userId}:${listId}`;
    const rawData = await userListsDataRedis.get(dataKey);
    
    if (!rawData) {
      return NextResponse.json(
        { error: 'List data not found or has expired' },
        { status: 404 }
      );
    }

    try {
      const listData = JSON.parse(rawData as string) as UserListData;
      
      console.log(`📋 Retrieved list details for ${userId}:${listId} - ${listData.rows.length} rows`);
      
      return NextResponse.json({
        success: true,
        ...listData, // Return the full UserListData structure
        userId,
        listId
      });
      
    } catch (parseError) {
      console.error('Error parsing list data:', parseError);
      return NextResponse.json(
        { error: 'Invalid list data format' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error fetching list details:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch list details',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 