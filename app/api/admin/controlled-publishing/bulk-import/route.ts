import { NextRequest, NextResponse } from 'next/server';
import { bulkImportTopics, TopicImportRow, importTopicsFromCSV } from '@/services/controlledPublishing/bulkTopicImport';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let result;

    if (body.csv) {
      // Import from CSV string
      result = await importTopicsFromCSV(body.csv);
    } else if (body.rows && Array.isArray(body.rows)) {
      // Import from array
      result = await bulkImportTopics(body.rows as TopicImportRow[]);
    } else {
      return NextResponse.json(
        { error: 'Missing required field: csv or rows' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
