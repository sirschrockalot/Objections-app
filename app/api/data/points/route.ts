import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Points from '@/lib/models/Points';
import { requireAuth, createAuthErrorResponse } from '@/lib/authMiddleware';
import { createRateLimitMiddleware, RATE_LIMITS } from '@/lib/rateLimiter';

const apiRateLimit = createRateLimitMiddleware(RATE_LIMITS.read);

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Require authentication
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return createAuthErrorResponse(auth);
    }

    await connectDB();
    const userId = auth.userId!;

    const pointsEntries = await Points.find({ userId }).sort({ date: -1 }).lean();

    const total = pointsEntries.reduce((sum, entry) => sum + entry.points, 0);

    return NextResponse.json({
      total,
      history: pointsEntries.map((p) => ({
        id: p.pointsId,
        points: p.points,
        reason: p.reason,
        date: p.date.toISOString(),
        metadata: p.metadata,
      })),
    });
  } catch (error: any) {
    console.error('Get points error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get points' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Require authentication
    const auth = await requireAuth(request);
    if (!auth.authenticated) {
      return createAuthErrorResponse(auth);
    }

    await connectDB();
    const userId = auth.userId!;

    const body = await request.json();
    const { points, reason, metadata, pointsId } = body;

    if (!points || !reason) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const pointsEntry = await Points.create({
      userId,
      pointsId: pointsId || `points-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      points,
      reason,
      date: new Date(),
      metadata: metadata || {},
    });

    return NextResponse.json({
      entry: {
        id: pointsEntry.pointsId,
        points: pointsEntry.points,
        reason: pointsEntry.reason,
        date: pointsEntry.date.toISOString(),
        metadata: pointsEntry.metadata,
      },
    });
  } catch (error: any) {
    console.error('Add points error:', error);
    return NextResponse.json({ error: error.message || 'Failed to add points' }, { status: 500 });
  }
}

