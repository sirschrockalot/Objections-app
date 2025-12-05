import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import UserActivity from '@/lib/models/UserActivity';
import PracticeSession from '@/lib/models/PracticeSession';

// Helper to check if user is admin
async function checkAdmin(request: NextRequest): Promise<boolean> {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return false;
  }

  try {
    await connectDB();
    const user = await User.findById(userId).lean();
    return user?.isAdmin === true;
  } catch (error) {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const isAdmin = await checkAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all users
    const users = await User.find({ isActive: true })
      .select('username email createdAt lastLoginAt')
      .lean();

    // Get all activities within date range
    const activities = await UserActivity.find({
      timestamp: { $gte: startDate },
    })
      .sort({ timestamp: -1 })
      .lean();

    // Get all practice sessions
    const sessions = await PracticeSession.find({
      date: { $gte: startDate.toISOString().split('T')[0] },
    }).lean();

    // Calculate user activity metrics
    const userMetrics = users.map((user) => {
      const userActivities = activities.filter((a) => a.userId === user._id.toString());
      const userSessions = sessions.filter((s) => s.userId === user._id.toString());

      // Calculate session duration (sum of all session durations)
      const totalSessionTime = userSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
      const averageSessionTime = userSessions.length > 0 
        ? Math.round(totalSessionTime / userSessions.length) 
        : 0;

      // Count logins
      const logins = userActivities.filter((a) => a.action === 'login').length;

      // Calculate active days (unique days with activity)
      const activeDays = new Set(
        userActivities.map((a) => 
          new Date(a.timestamp).toISOString().split('T')[0]
        )
      ).size;

      // Calculate total activities
      const totalActivities = userActivities.length;

      // Get last activity
      const lastActivity = userActivities.length > 0
        ? userActivities[0].timestamp
        : null;

      // Calculate engagement score (combination of factors)
      const engagementScore = Math.round(
        (logins * 10) +
        (activeDays * 5) +
        (totalActivities * 1) +
        (totalSessionTime / 60) // minutes of practice
      );

      return {
        userId: user._id.toString(),
        username: user.username,
        email: user.email || user.username,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        metrics: {
          totalLogins: logins,
          totalSessions: userSessions.length,
          totalActivities: totalActivities,
          activeDays: activeDays,
          totalSessionTime: totalSessionTime, // in seconds
          averageSessionTime: averageSessionTime, // in seconds
          totalSessionTimeMinutes: Math.round(totalSessionTime / 60),
          averageSessionTimeMinutes: Math.round(averageSessionTime / 60),
          engagementScore,
          lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null,
        },
      };
    });

    // Sort by engagement score (most active first)
    userMetrics.sort((a, b) => b.metrics.engagementScore - a.metrics.engagementScore);

    // Calculate aggregate statistics
    const totalUsers = users.length;
    const activeUsers = userMetrics.filter((u) => u.metrics.totalActivities > 0).length;
    const totalLogins = userMetrics.reduce((sum, u) => sum + u.metrics.totalLogins, 0);
    const totalSessions = userMetrics.reduce((sum, u) => sum + u.metrics.totalSessions, 0);
    const totalSessionTime = userMetrics.reduce((sum, u) => sum + u.metrics.totalSessionTime, 0);
    const averageSessionTime = totalSessions > 0 
      ? Math.round(totalSessionTime / totalSessions) 
      : 0;

    // Calculate activity over time (daily breakdown)
    const dailyActivity: Record<string, number> = {};
    activities.forEach((activity) => {
      const date = new Date(activity.timestamp).toISOString().split('T')[0];
      dailyActivity[date] = (dailyActivity[date] || 0) + 1;
    });

    // Calculate activity by hour (peak usage times)
    const hourlyActivity: Record<number, number> = {};
    activities.forEach((activity) => {
      const hour = new Date(activity.timestamp).getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });

    // Calculate activity by action type
    const activityByType: Record<string, number> = {};
    activities.forEach((activity) => {
      activityByType[activity.action] = (activityByType[activity.action] || 0) + 1;
    });

    // Calculate most active users (top 10)
    const topUsers = userMetrics.slice(0, 10);

    return NextResponse.json({
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      summary: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalLogins,
        totalSessions,
        totalSessionTimeMinutes: Math.round(totalSessionTime / 60),
        totalSessionTimeHours: Math.round(totalSessionTime / 3600 * 10) / 10,
        averageSessionTimeMinutes: Math.round(averageSessionTime / 60),
        averageSessionTimeSeconds: averageSessionTime,
      },
      topUsers,
      allUsers: userMetrics,
      trends: {
        dailyActivity,
        hourlyActivity,
        activityByType,
      },
    });
  } catch (error: any) {
    console.error('Get analytics error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get analytics' },
      { status: 500 }
    );
  }
}

