import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { requireAdmin, createAuthErrorResponse } from '@/lib/authMiddleware';
import { createRateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter';
import { validatePassword } from '@/lib/passwordValidation';
import { error as logError } from '@/lib/logger';

const apiRateLimit = createRateLimitMiddleware(RATE_LIMITS.api);

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Require admin authentication
    const auth = await requireAdmin(request);
    if (!auth.authenticated) {
      return createAuthErrorResponse(auth);
    }

    await connectDB();

    const users = await User.find({})
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();

    const usersList = users.map((user) => ({
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString(),
      isActive: user.isActive,
      isAdmin: user.isAdmin || false,
      mustChangePassword: user.mustChangePassword || false,
    }));

    const response = NextResponse.json({ users: usersList });
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    return response;
  } catch (error: any) {
    logError('Failed to get users', error);
    return NextResponse.json(
      { error: 'Failed to get users' },
      { status: 500 }
    );
  }
}

// Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Require admin authentication
    const auth = await requireAdmin(request);
    if (!auth.authenticated) {
      return createAuthErrorResponse(auth);
    }

    await connectDB();

    const body = await request.json();
    const { username, password, email, isAdmin: setAdmin } = body;

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!username || !emailRegex.test(username)) {
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

    // Check if user already exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      username: username.trim().toLowerCase(),
      email: email?.trim().toLowerCase() || username.trim().toLowerCase(),
      passwordHash,
      isAdmin: setAdmin || false,
      isActive: true,
      mustChangePassword: true, // Require password change on first login
      createdAt: new Date(),
    });

    // Return user without password hash
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
          isAdmin: user.isAdmin,
          mustChangePassword: user.mustChangePassword || false,
        },
      },
      { status: 201 }
    );
    
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    return response;
  } catch (error: any) {
    logError('Failed to create user', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

