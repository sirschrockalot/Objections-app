import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PracticeHistory from '@/lib/models/PracticeHistory';

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

    const history = await PracticeHistory.find(query).sort({ date: 1 }).lean();

    return NextResponse.json({
      history: history.map((h) => ({
        objectionId: h.objectionId,
        date: h.date,
        sessionId: h.sessionId,
        confidenceRating: h.confidenceRating,
        timesPracticed: h.timesPracticed,
      })),
    });
  } catch (error: any) {
    console.error('Get practice history error:', error);
    return NextResponse.json({ error: error.message || 'Failed to get history' }, { status: 500 });
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
    const { objectionId, sessionId, confidenceRating } = body;

    if (!objectionId || !sessionId) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];
    const existing = await PracticeHistory.findOne({ userId, objectionId, date: today });

    if (existing) {
      existing.timesPracticed += 1;
      if (confidenceRating) {
        existing.confidenceRating = confidenceRating;
      }
      await existing.save();
      return NextResponse.json({
        entry: {
          objectionId: existing.objectionId,
          date: existing.date,
          sessionId: existing.sessionId,
          confidenceRating: existing.confidenceRating,
          timesPracticed: existing.timesPracticed,
        },
      });
    } else {
      // Count existing entries for this objection
      const allHistoryForObjection = await PracticeHistory.find({ userId, objectionId });
      const newEntry = await PracticeHistory.create({
        userId,
        objectionId,
        date: today,
        sessionId,
        confidenceRating,
        timesPracticed: allHistoryForObjection.length + 1,
      });

      return NextResponse.json({
        entry: {
          objectionId: newEntry.objectionId,
          date: newEntry.date,
          sessionId: newEntry.sessionId,
          confidenceRating: newEntry.confidenceRating,
          timesPracticed: newEntry.timesPracticed,
        },
      });
    }
  } catch (error: any) {
    console.error('Record practice history error:', error);
    return NextResponse.json({ error: error.message || 'Failed to record history' }, { status: 500 });
  }
}

