import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/models/User';
import UserActivity from '@/lib/models/UserActivity';
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';
import { formatUser } from '@/lib/api/responseFormatters';

export const PUT = createApiHandler({
  rateLimit: RATE_LIMITS.api,
  requireAuth: true,
  errorContext: 'Update email',
  handler: async (req, { userId }) => {
    const body = await req.json();
    const { email } = body;

    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Update email
    user.email = email?.trim().toLowerCase() || undefined;
    await user.save();

    // Track email update activity
    await UserActivity.create({
      userId: user._id.toString(),
      action: 'email_update',
      metadata: {},
      timestamp: new Date(),
      userAgent: req.headers.get('user-agent') || undefined,
      url: req.headers.get('referer') || undefined,
    });

    return { user: formatUser(user) };
  },
});

