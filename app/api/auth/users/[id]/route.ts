import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { requireAdmin, createAuthErrorResponse } from '@/lib/authMiddleware';
import { createRateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter';
import { validatePassword } from '@/lib/passwordValidation';
import { error as logError } from '@/lib/logger';

const apiRateLimit = createRateLimitMiddleware(RATE_LIMITS.api);

// Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const currentUserId = auth.userId!;

    await connectDB();

    const userId = id;
    const body = await request.json();
    const { username, email, password, isActive, isAdmin: setAdmin } = body;

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent admin from removing their own admin status
    if (user._id.toString() === currentUserId && setAdmin === false) {
      return NextResponse.json(
        { error: 'Cannot remove your own admin status' },
        { status: 400 }
      );
    }

    // Update fields
    if (username !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(username)) {
        return NextResponse.json(
          { error: 'Username must be a valid email address' },
          { status: 400 }
        );
      }
      // Check if new username already exists
      const existingUser = await User.findOne({ username: username.toLowerCase() });
      if (existingUser && existingUser._id.toString() !== userId) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 400 }
        );
      }
      user.username = username.toLowerCase();
    }

    if (email !== undefined) {
      user.email = email.toLowerCase();
    }

    if (password !== undefined && password.trim() !== '') {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return NextResponse.json(
          { error: passwordValidation.error },
          { status: 400 }
        );
      }
      user.passwordHash = await bcrypt.hash(password, 12);
    }

    if (isActive !== undefined) {
      user.isActive = isActive;
    }

    if (setAdmin !== undefined) {
      user.isAdmin = setAdmin;
    }

    await user.save();

    const userObj = user.toObject();
    const { passwordHash: _, ...userWithoutPassword } = userObj;

    const response = NextResponse.json({
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
    });
    
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    return response;
  } catch (error: any) {
    logError('Failed to update user', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

    const currentUserId = auth.userId!;

    await connectDB();

    const userId = id;

    // Prevent admin from deleting themselves
    if (userId === currentUserId) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Soft delete by setting isActive to false, or hard delete
    // For now, we'll do a soft delete
    user.isActive = false;
    await user.save();

    const response = NextResponse.json({ success: true, message: 'User deactivated' });
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    return response;
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

