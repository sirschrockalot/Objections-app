import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { username, password, email } = body;

    // Username must be an email address
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

    // Check if username (email) already exists
    const existingUser = await User.findOne({ username: username.trim().toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user - username is the email, also store in email field for backwards compatibility
    const emailLower = username.trim().toLowerCase();
    const user = await User.create({
      username: emailLower,
      email: email?.trim().toLowerCase() || emailLower, // Use provided email or username
      passwordHash,
      createdAt: new Date(),
      isActive: true,
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
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 500 }
    );
  }
}

