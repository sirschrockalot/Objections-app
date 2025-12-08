import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/models/User';
import UserActivity from '@/lib/models/UserActivity';
import bcrypt from 'bcryptjs';
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';
import { validatePassword } from '@/lib/passwordValidation';
import { formatUser } from '@/lib/api/responseFormatters';

export const POST = createApiHandler({
  rateLimit: RATE_LIMITS.auth,
  requireAuth: true,
  errorContext: 'Force password change',
  handler: async (req, { userId }) => {
    const body = await req.json();
    const { newPassword } = body;

    if (!newPassword) {
      return NextResponse.json(
        { error: 'New password is required' },
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

    // Only allow forced password change if mustChangePassword is true
    if (!user.mustChangePassword) {
      return NextResponse.json(
        { error: 'Password change not required. Use the regular password change feature.' },
        { status: 400 }
      );
    }

    // Update password and clear mustChangePassword flag
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    await user.save();

    // Track password change activity
    await UserActivity.create({
      userId: user._id.toString(),
      action: 'password_change_forced',
      metadata: {},
      timestamp: new Date(),
      userAgent: req.headers.get('user-agent') || undefined,
      url: req.headers.get('referer') || undefined,
    });

    return {
      success: true,
      user: { ...formatUser(user), mustChangePassword: false },
    };
  },
});

