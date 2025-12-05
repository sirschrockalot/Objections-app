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

export async function GET(request: NextRequest) {
  try {
    const { isAdmin } = await checkAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
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

    return NextResponse.json({ users: usersList });
  } catch (error: any) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get users' },
      { status: 500 }
    );
  }
}

// Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const { isAdmin } = await checkAdmin(request);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
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

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
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
    const passwordHash = await bcrypt.hash(password, 10);

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

    return NextResponse.json(
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
  } catch (error: any) {
    console.error('Create user error:', error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}

