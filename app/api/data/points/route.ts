import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Points from '@/lib/models/Points';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

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
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

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

