import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

// Helper to check if user is admin
async function checkAdmin(request: NextRequest): Promise<{ isAdmin: boolean; userId: string | null }> {
  const userId = request.headers.get('x-user-id');
  if (!userId) {
    return { isAdmin: false, userId: null };
  }

  try {
    await connectDB();
    const user = await User.findById(userId).lean();
    return { isAdmin: user?.isAdmin === true, userId };
  } catch (error) {
    return { isAdmin: false, userId };
  }
}

// Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const { isAdmin, userId: currentUserId } = await checkAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

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
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }
      user.passwordHash = await bcrypt.hash(password, 10);
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

    return NextResponse.json({
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
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
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
    const { isAdmin, userId: currentUserId } = await checkAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

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

    return NextResponse.json({ success: true, message: 'User deactivated' });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}

