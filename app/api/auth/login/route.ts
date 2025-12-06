import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import UserActivity from '@/lib/models/UserActivity';
import { signToken, signRefreshToken } from '@/lib/jwt';
import { createRateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter';
import { recordFailedAttempt, clearFailedAttempts, isAccountLocked } from '@/lib/accountLockout';
import { sanitizeEmail } from '@/lib/inputValidation';
import { getSafeErrorMessage, logError } from '@/lib/errorHandler';

const authRateLimit = createRateLimitMiddleware(RATE_LIMITS.auth);

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await authRateLimit(request);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    await connectDB();

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Sanitize username (email)
    const sanitizedUsername = sanitizeEmail(username);
    if (!sanitizedUsername) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check account lockout status
    const lockoutStatus = isAccountLocked(sanitizedUsername);
    if (lockoutStatus.locked) {
      const minutesRemaining = Math.ceil(
        (lockoutStatus.lockedUntil!.getTime() - Date.now()) / 60000
      );
      return NextResponse.json(
        { 
          error: `Account temporarily locked due to too many failed login attempts. Please try again in ${minutesRemaining} minute(s).` 
        },
        { status: 423 } // 423 Locked
      );
    }

    // Find user
    const user = await User.findOne({ username: sanitizedUsername, isActive: true });
    if (!user) {
      // Record failed attempt even if user doesn't exist (prevents user enumeration)
      recordFailedAttempt(sanitizedUsername);
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      // Record failed attempt
      const lockoutResult = recordFailedAttempt(sanitizedUsername);
      if (lockoutResult.locked) {
        const minutesRemaining = Math.ceil(
          (lockoutResult.lockedUntil!.getTime() - Date.now()) / 60000
        );
        return NextResponse.json(
          { 
            error: `Account temporarily locked due to too many failed login attempts. Please try again in ${minutesRemaining} minute(s).` 
          },
          { status: 423 } // 423 Locked
        );
      }
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(sanitizedUsername);

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Track login activity
    await UserActivity.create({
      userId: user._id.toString(),
      action: 'login',
      metadata: { username: user.username },
      timestamp: new Date(),
      userAgent: request.headers.get('user-agent') || undefined,
      url: request.headers.get('referer') || undefined,
    });

    // Generate JWT access token (short-lived) and refresh token (long-lived)
    const token = signToken({
      userId: user._id.toString(),
      isAdmin: user.isAdmin || false,
      email: user.username,
    });

    const refreshToken = signRefreshToken({
      userId: user._id.toString(),
      isAdmin: user.isAdmin || false,
      email: user.username,
    });

    // Return user without password hash and include tokens
    const response = NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt.toISOString(),
        isActive: user.isActive,
        isAdmin: user.isAdmin || false,
        mustChangePassword: user.mustChangePassword || false,
      },
      token,
      refreshToken,
    });

    // Add rate limit headers
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());

    return response;
  } catch (error: any) {
    logError('Login', error);
    return NextResponse.json(
      { error: getSafeErrorMessage(error, 'Login failed. Please try again later.') },
      { status: 500 }
    );
  }
}

