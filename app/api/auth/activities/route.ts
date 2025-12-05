import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserActivity from '@/lib/models/UserActivity';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let query: any = {};
    if (userId) {
      query.userId = userId;
    }

    const activities = await UserActivity.find(query)
      .sort({ timestamp: -1 })
      .limit(1000)
      .lean();

    const activitiesList = activities.map((activity) => ({
      userId: activity.userId,
      action: activity.action,
      timestamp: activity.timestamp.toISOString(),
      metadata: activity.metadata,
      userAgent: activity.userAgent,
      url: activity.url,
    }));

    return NextResponse.json({ activities: activitiesList });
  } catch (error: any) {
    console.error('Get activities error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get activities' },
      { status: 500 }
    );
  }
}

