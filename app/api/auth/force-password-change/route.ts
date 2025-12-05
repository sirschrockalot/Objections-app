import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import UserActivity from '@/lib/models/UserActivity';
import bcrypt from 'bcryptjs';

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
    const { newPassword } = body;

    if (!newPassword) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only allow forced password change if mustChangePassword is true
    if (!user.mustChangePassword) {
      return NextResponse.json(
        { error: 'Password change not required. Use the regular password change feature.' },
        { status: 400 }
      );
    }

    // Update password and clear mustChangePassword flag
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;
    await user.save();

    // Track password change activity
    await UserActivity.create({
      userId: user._id.toString(),
      action: 'password_change_forced',
      metadata: {},
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent') || undefined,
      url: request.headers.get('referer') || undefined,
    });

    return NextResponse.json({ 
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString(),
        isActive: user.isActive,
        isAdmin: user.isAdmin || false,
        mustChangePassword: false,
      },
    });
  } catch (error: any) {
    console.error('Force password change error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to change password' },
      { status: 500 }
    );
  }
}

