import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ConfidenceRating from '@/lib/models/ConfidenceRating';
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

    const { searchParams } = new URL(request.url);
    const objectionId = searchParams.get('objectionId');

    const query: any = { userId };
    if (objectionId) {
      query.objectionId = objectionId;
    }

    const ratings = await ConfidenceRating.find(query).sort({ date: -1 }).lean();

    return NextResponse.json({
      ratings: ratings.map((r) => ({
        objectionId: r.objectionId,
        rating: r.rating,
        date: r.date.toISOString(),
      })),
    });
  } catch (error: any) {
    console.error('Get confidence ratings error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get ratings' }, { status: 500 });
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
    const { objectionId, rating } = body;

    if (!objectionId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const confidenceRating = await ConfidenceRating.create({
      userId,
      objectionId,
      rating,
      date: new Date(),
    });

    return NextResponse.json({
      rating: {
        objectionId: confidenceRating.objectionId,
        rating: confidenceRating.rating,
        date: confidenceRating.date.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Save confidence rating error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save rating' }, { status: 500 });
  }
}

