import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomResponse from '@/lib/models/CustomResponse';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const objectionId = searchParams.get('objectionId');

    const query: any = { userId };
    if (objectionId) {
      query.objectionId = objectionId;
    }

    const responses = await CustomResponse.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      responses: responses.map((r) => ({
        id: r.responseId,
        objectionId: r.objectionId, // Include objectionId so client can group responses
        text: r.text,
        isCustom: r.isCustom,
        createdAt: r.createdAt.toISOString(),
        createdBy: r.createdBy,
        upvotes: r.upvotes,
        upvotedBy: r.upvotedBy,
      })),
    });
  } catch (error: any) {
    console.error('Get custom responses error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get responses' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { objectionId, response } = body;

    if (!objectionId || !response || !response.id || !response.text) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const customResponse = await CustomResponse.create({
      userId,
      objectionId,
      responseId: response.id,
      text: response.text,
      isCustom: response.isCustom ?? true,
      createdAt: new Date(response.createdAt || Date.now()),
      createdBy: response.createdBy,
      upvotes: response.upvotes || 0,
      upvotedBy: response.upvotedBy || [],
    });

    return NextResponse.json({
      response: {
        id: customResponse.responseId,
        text: customResponse.text,
        isCustom: customResponse.isCustom,
        createdAt: customResponse.createdAt.toISOString(),
        createdBy: customResponse.createdBy,
        upvotes: customResponse.upvotes,
        upvotedBy: customResponse.upvotedBy,
      },
    });
  } catch (error: any) {
    console.error('Save custom response error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save response' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { objectionId, responseId } = body;

    if (!objectionId || !responseId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const response = await CustomResponse.findOne({ userId, objectionId, responseId });
    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    // Toggle upvote
    const index = response.upvotedBy.indexOf(userId);
    if (index > -1) {
      response.upvotedBy.splice(index, 1);
      response.upvotes = Math.max(0, response.upvotes - 1);
    } else {
      response.upvotedBy.push(userId);
      response.upvotes = (response.upvotes || 0) + 1;
    }

    await response.save();

    return NextResponse.json({
      response: {
        id: response.responseId,
        upvotes: response.upvotes,
        upvotedBy: response.upvotedBy,
      },
    });
  } catch (error: any) {
    console.error('Upvote response error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upvote' }, { status: 500 });
  }
}

