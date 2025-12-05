import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ConfidenceRating from '@/lib/models/ConfidenceRating';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

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
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

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

