import { NextRequest, NextResponse } from 'next/server';
import { userListsDataRedis, userListSnippetsRedis, type UserListData } from '../../../../../utils/redis-clients';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; listId: string }> }
) {
  try {
    const { userId, listId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // 'json' or 'csv'
    
    if (!userId || !listId) {
      return NextResponse.json(
        { error: 'userId and listId are required' },
        { status: 400 }
      );
    }
    
    // Check if the job is completed
    const snippetKey = `userListSnippet:${userId}:${listId}`;
    const snippetData = await userListSnippetsRedis.hgetall(snippetKey) as Record<string, string>;
    
    if (!snippetData || Object.keys(snippetData).length === 0) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      );
    }
    
    if (snippetData.status !== 'completed') {
      return NextResponse.json(
        { error: 'Validation not yet completed' },
        { status: 400 }
      );
    }
    
    // Get the validated data
    const dataKey = `userListData:${userId}:${listId}`;
    const rawData = await userListsDataRedis.get(dataKey);
    
    if (!rawData) {
      return NextResponse.json(
        { error: 'Validated data not found' },
        { status: 404 }
      );
    }
    
    const userData: UserListData = JSON.parse(rawData as string);
    
    if (format === 'csv') {
      // Return data as CSV
      const headers = userData.metadata.columns.concat([
        'validStatus',
        'catchAll', 
        'category',
        'errorMessage'
      ]);
      
      let csvContent = headers.join(',') + '\n';
      
      userData.rows.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) {
            return '';
          }
          // Escape commas and quotes in CSV
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        csvContent += values.join(',') + '\n';
      });
      
      const fileName = `${userData.metadata.listName.replace(/\.[^/.]+$/, "")}_validated.csv`;
      
      return new Response(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fileName}"`
        }
      });
      
    } else {
      // Return data as JSON
      return NextResponse.json({
        metadata: {
          ...userData.metadata,
          downloadedAt: new Date().toISOString(),
          totalRows: userData.rows.length
        },
        results: {
          validCount: parseInt(snippetData.validCount as string || '0'),
          invalidCount: parseInt(snippetData.invalidCount as string || '0'),
          unknownCount: parseInt(snippetData.unknownCount as string || '0'),
          percentValid: parseFloat(snippetData.percentValid as string || '0'),
          percentInvalid: parseFloat(snippetData.percentInvalid as string || '0'),
          percentUnknown: parseFloat(snippetData.percentUnknown as string || '0')
        },
        data: userData.rows
      });
    }
    
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download data' },
      { status: 500 }
    );
  }
} 