import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserActivity from '@/lib/models/UserActivity';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    const activities = await UserActivity.find({ userId })
      .sort({ timestamp: -1 })
      .lean();

    const logins = activities.filter((a) => a.action === 'login');
    const sessions = new Set(
      activities.map((a) => a.timestamp.toISOString().split('T')[0])
    ).size;

    const actionsByType: Record<string, number> = {};
    activities.forEach((a) => {
      actionsByType[a.action] = (actionsByType[a.action] || 0) + 1;
    });

    return NextResponse.json({
      totalLogins: logins.length,
      lastLoginAt: logins.length > 0 ? logins[0].timestamp.toISOString() : null,
      totalSessions: sessions,
      actionsByType,
    });
  } catch (error: any) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get stats' },
      { status: 500 }
    );
  }
}

