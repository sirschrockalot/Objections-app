import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { signToken, signRefreshToken } from '@/lib/jwt';
import { createRateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter';
import { validatePassword } from '@/lib/passwordValidation';
import { sanitizeEmail } from '@/lib/inputValidation';
import { getSafeErrorMessage, logError } from '@/lib/errorHandler';

const registerRateLimit = createRateLimitMiddleware(RATE_LIMITS.auth);

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await registerRateLimit(request);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    await connectDB();

    const body = await request.json();
    const { username, password, email } = body;

    // Sanitize and validate username (email)
    const sanitizedUsername = sanitizeEmail(username);
    if (!sanitizedUsername) {
      return NextResponse.json(
        { error: 'Username must be a valid email address' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Check if username (email) already exists
    const existingUser = await User.findOne({ username: sanitizedUsername });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Sanitize optional email field
    const sanitizedEmail = email ? sanitizeEmail(email) : sanitizedUsername;

    // Create user - username is the email, also store in email field for backwards compatibility
    const user = await User.create({
      username: sanitizedUsername,
      email: sanitizedEmail || sanitizedUsername,
      passwordHash,
      createdAt: new Date(),
      isActive: true,
    });

    // Generate JWT access token (short-lived) and refresh token (long-lived)
    const token = signToken({
      userId: user._id.toString(),
      isAdmin: false,
      email: user.username,
    });

    const refreshToken = signRefreshToken({
      userId: user._id.toString(),
      isAdmin: false,
      email: user.username,
    });

    // Return user without password hash and include tokens
    const userObj = user.toObject();
    const { passwordHash: _, ...userWithoutPassword } = userObj;

    const response = NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
          lastLoginAt: user.lastLoginAt?.toISOString(),
          isActive: user.isActive,
        },
        token,
        refreshToken,
      },
      { status: 201 }
    );

    // Add rate limit headers
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());

    return response;
  } catch (error: any) {
    logError('Registration', error);
    return NextResponse.json(
      { error: getSafeErrorMessage(error, 'Registration failed. Please try again later.') },
      { status: 500 }
    );
  }
}

