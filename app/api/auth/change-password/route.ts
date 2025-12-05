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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
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

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Update password
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    // Clear mustChangePassword flag when password is changed
    user.mustChangePassword = false;
    await user.save();

    // Track password change activity
    await UserActivity.create({
      userId: user._id.toString(),
      action: 'password_change',
      metadata: {},
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent') || undefined,
      url: request.headers.get('referer') || undefined,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to change password' },
      { status: 500 }
    );
  }
}

