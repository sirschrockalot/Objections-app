import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CustomResponse from '@/lib/models/CustomResponse';
import ConfidenceRating from '@/lib/models/ConfidenceRating';
import PracticeSession from '@/lib/models/PracticeSession';
import ObjectionNote from '@/lib/models/ObjectionNote';
import ResponseTemplate from '@/lib/models/ResponseTemplate';
import PracticeHistory from '@/lib/models/PracticeHistory';
import Points from '@/lib/models/Points';
import ReviewSchedule from '@/lib/models/ReviewSchedule';
import LearningPathProgress from '@/lib/models/LearningPathProgress';
import VoiceSession from '@/lib/models/VoiceSession';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { data } = body;

    if (!data) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    const results: Record<string, number> = {};

    // Migrate custom responses
    if (data.customResponses && Array.isArray(data.customResponses)) {
      for (const item of data.customResponses) {
        try {
          await CustomResponse.findOneAndUpdate(
            { userId, objectionId: item.objectionId, responseId: item.response.id },
            {
              userId,
              objectionId: item.objectionId,
              responseId: item.response.id,
              text: item.response.text,
              isCustom: item.response.isCustom ?? true,
              createdAt: new Date(item.response.createdAt || Date.now()),
              createdBy: item.response.createdBy,
              upvotes: item.response.upvotes || 0,
              upvotedBy: item.response.upvotedBy || [],
            },
            { upsert: true }
          );
          results.customResponses = (results.customResponses || 0) + 1;
        } catch (error) {
          console.error('Error migrating custom response:', error);
        }
      }
    }

    // Migrate confidence ratings
    if (data.confidenceRatings && Array.isArray(data.confidenceRatings)) {
      for (const rating of data.confidenceRatings) {
        try {
          await ConfidenceRating.create({
            userId,
            objectionId: rating.objectionId,
            rating: rating.rating,
            date: new Date(rating.date),
          });
          results.confidenceRatings = (results.confidenceRatings || 0) + 1;
        } catch (error) {
          console.error('Error migrating confidence rating:', error);
        }
      }
    }

    // Migrate practice sessions
    if (data.practiceSessions && Array.isArray(data.practiceSessions)) {
      for (const session of data.practiceSessions) {
        try {
          await PracticeSession.findOneAndUpdate(
            { userId, sessionId: session.id },
            {
              userId,
              sessionId: session.id,
              date: new Date(session.date),
              objectionsPracticed: session.objectionsPracticed || [],
              duration: session.duration || 0,
              challengeMode: session.challengeMode,
              timeLimit: session.timeLimit,
              goal: session.goal,
            },
            { upsert: true }
          );
          results.practiceSessions = (results.practiceSessions || 0) + 1;
        } catch (error) {
          console.error('Error migrating practice session:', error);
        }
      }
    }

    // Migrate notes
    if (data.notes && Array.isArray(data.notes)) {
      for (const note of data.notes) {
        try {
          await ObjectionNote.findOneAndUpdate(
            { userId, objectionId: note.objectionId },
            {
              userId,
              objectionId: note.objectionId,
              note: note.note,
              createdAt: new Date(note.createdAt),
              updatedAt: new Date(note.updatedAt || note.createdAt),
            },
            { upsert: true }
          );
          results.notes = (results.notes || 0) + 1;
        } catch (error) {
          console.error('Error migrating note:', error);
        }
      }
    }

    // Migrate templates
    if (data.responseTemplates && Array.isArray(data.responseTemplates)) {
      for (const template of data.responseTemplates) {
        try {
          await ResponseTemplate.findOneAndUpdate(
            { userId, templateId: template.id },
            {
              userId,
              templateId: template.id,
              name: template.name,
              acknowledge: template.acknowledge,
              reframe: template.reframe,
              value: template.value,
              nextStep: template.nextStep,
              createdAt: new Date(template.createdAt),
            },
            { upsert: true }
          );
          results.templates = (results.templates || 0) + 1;
        } catch (error) {
          console.error('Error migrating template:', error);
        }
      }
    }

    // Migrate practice history
    if (data.practiceHistory && Array.isArray(data.practiceHistory)) {
      for (const entry of data.practiceHistory) {
        try {
          await PracticeHistory.findOneAndUpdate(
            { userId, objectionId: entry.objectionId, date: entry.date },
            {
              userId,
              objectionId: entry.objectionId,
              date: entry.date,
              sessionId: entry.sessionId,
              confidenceRating: entry.confidenceRating,
              timesPracticed: entry.timesPracticed,
            },
            { upsert: true }
          );
          results.practiceHistory = (results.practiceHistory || 0) + 1;
        } catch (error) {
          console.error('Error migrating practice history:', error);
        }
      }
    }

    // Migrate points
    if (data.points && data.points.history && Array.isArray(data.points.history)) {
      for (const entry of data.points.history) {
        try {
          await Points.findOneAndUpdate(
            { userId, pointsId: entry.id },
            {
              userId,
              pointsId: entry.id,
              points: entry.points,
              reason: entry.reason,
              date: new Date(entry.date),
              metadata: entry.metadata || {},
            },
            { upsert: true }
          );
          results.points = (results.points || 0) + 1;
        } catch (error) {
          console.error('Error migrating points:', error);
        }
      }
    }

    // Migrate review schedules
    if (data.reviewSchedules && Array.isArray(data.reviewSchedules)) {
      for (const schedule of data.reviewSchedules) {
        try {
          await ReviewSchedule.findOneAndUpdate(
            { userId, objectionId: schedule.objectionId },
            {
              userId,
              objectionId: schedule.objectionId,
              nextReviewDate: schedule.nextReviewDate,
              interval: schedule.interval,
              easeFactor: schedule.easeFactor,
              repetitions: schedule.repetitions,
              lastReviewDate: schedule.lastReviewDate,
              isDue: schedule.isDue,
            },
            { upsert: true }
          );
          results.reviewSchedules = (results.reviewSchedules || 0) + 1;
        } catch (error) {
          console.error('Error migrating review schedule:', error);
        }
      }
    }

    // Migrate learning path progress
    if (data.learningPathProgress && Array.isArray(data.learningPathProgress)) {
      for (const progress of data.learningPathProgress) {
        try {
          await LearningPathProgress.findOneAndUpdate(
            { userId, pathId: progress.pathId },
            {
              userId,
              pathId: progress.pathId,
              currentStep: progress.currentStep,
              completedSteps: Array.isArray(progress.completedSteps)
                ? progress.completedSteps
                : Array.from(progress.completedSteps || []),
              startedAt: new Date(progress.startedAt),
              completedAt: progress.completedAt ? new Date(progress.completedAt) : undefined,
              lastPracticedAt: progress.lastPracticedAt ? new Date(progress.lastPracticedAt) : undefined,
            },
            { upsert: true }
          );
          results.learningPathProgress = (results.learningPathProgress || 0) + 1;
        } catch (error) {
          console.error('Error migrating learning path progress:', error);
        }
      }
    }

    // Migrate voice sessions
    if (data.voiceSessions && Array.isArray(data.voiceSessions)) {
      for (const session of data.voiceSessions) {
        try {
          await VoiceSession.findOneAndUpdate(
            { userId, sessionId: session.id },
            {
              userId,
              sessionId: session.id,
              startTime: session.startTime,
              endTime: session.endTime,
              messages: session.messages || [],
              objectionsPresented: session.objectionsPresented || [],
              userResponses: session.userResponses || [],
              metrics: session.metrics,
              status: session.status,
              lastSavedAt: session.lastSavedAt,
              recoveryData: session.recoveryData,
            },
            { upsert: true }
          );
          results.voiceSessions = (results.voiceSessions || 0) + 1;
        } catch (error) {
          console.error('Error migrating voice session:', error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      migrated: results,
      message: 'Migration completed successfully',
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error.message || 'Migration failed' },
      { status: 500 }
    );
  }
}

