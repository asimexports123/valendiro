import { NextRequest, NextResponse } from 'next/server';
import { publishTopicControlled, PublishTopicRequest } from '@/services/controlledPublishing/controlledPublisher';

export async function POST(request: NextRequest) {
  try {
    const body: PublishTopicRequest = await request.json();

    // Validate required fields
    if (!body.topicId || !body.languageCode || !body.title || !body.content) {
      return NextResponse.json(
        { error: 'Missing required fields: topicId, languageCode, title, content' },
        { status: 400 }
      );
    }

    const result = await publishTopicControlled(body);

    if (result.success) {
      return NextResponse.json({ success: true, topicId: result.topicId });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
