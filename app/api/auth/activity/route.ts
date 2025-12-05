import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserActivity from '@/lib/models/UserActivity';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, metadata } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    await UserActivity.create({
      userId,
      action,
      metadata: metadata || {},
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent') || undefined,
      url: request.headers.get('referer') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Track activity error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to track activity' },
      { status: 500 }
    );
  }
}

