import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/models/User';
import UserActivity from '@/lib/models/UserActivity';
import bcrypt from 'bcryptjs';
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';
import { validatePassword } from '@/lib/passwordValidation';

export const POST = createApiHandler({
  rateLimit: RATE_LIMITS.auth,
  requireAuth: true,
  errorContext: 'Change password',
  handler: async (req, { userId }) => {
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
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
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    // Clear mustChangePassword flag when password is changed
    user.mustChangePassword = false;
    await user.save();

    // Track password change activity
    await UserActivity.create({
      userId: user._id.toString(),
      action: 'password_change',
      metadata: {},
      timestamp: new Date(),
      userAgent: req.headers.get('user-agent') || undefined,
      url: req.headers.get('referer') || undefined,
    });

    return { success: true };
  },
});

