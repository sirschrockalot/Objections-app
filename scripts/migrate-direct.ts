/**
 * Direct MongoDB migration script
 * This script connects directly to MongoDB and migrates data
 * Run with: npm run migrate <exported-file.json> [userId]
 * 
 * Make sure MONGODB_URI is set in .env.local
 */

// Load environment variables FIRST using require (runs synchronously before imports)
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

// Now import MongoDB connection after env vars are loaded
import connectDB from '../lib/mongodb';
import CustomResponse from '../lib/models/CustomResponse';
import ConfidenceRating from '../lib/models/ConfidenceRating';
import PracticeSession from '../lib/models/PracticeSession';
import ObjectionNote from '../lib/models/ObjectionNote';
import ResponseTemplate from '../lib/models/ResponseTemplate';
import PracticeHistory from '../lib/models/PracticeHistory';
import Points from '../lib/models/Points';
import ReviewSchedule from '../lib/models/ReviewSchedule';
import LearningPathProgress from '../lib/models/LearningPathProgress';
import VoiceSession from '../lib/models/VoiceSession';
import { readFileSync, existsSync } from 'fs';

interface MigrationData {
  customResponses?: Array<{ objectionId: string; response: any }>;
  confidenceRatings?: any[];
  practiceSessions?: any[];
  notes?: any[];
  responseTemplates?: any[];
  practiceHistory?: any[];
  points?: { total: number; history: any[] };
  reviewSchedules?: any[];
  learningPathProgress?: any[];
  voiceSessions?: any[];
  userId?: string; // May be included in exported data
}

async function migrateToMongoDB(data: MigrationData, userId: string) {
  await connectDB();
  console.log('Connected to MongoDB');

  const results: Record<string, number> = {};

  // Migrate custom responses
  if (data.customResponses && Array.isArray(data.customResponses)) {
    console.log(`Migrating ${data.customResponses.length} custom responses...`);
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
    console.log(`Migrating ${data.confidenceRatings.length} confidence ratings...`);
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
    console.log(`Migrating ${data.practiceSessions.length} practice sessions...`);
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
    console.log(`Migrating ${data.notes.length} notes...`);
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
    console.log(`Migrating ${data.responseTemplates.length} templates...`);
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
    console.log(`Migrating ${data.practiceHistory.length} practice history entries...`);
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
    console.log(`Migrating ${data.points.history.length} points entries...`);
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
    console.log(`Migrating ${data.reviewSchedules.length} review schedules...`);
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
    console.log(`Migrating ${data.learningPathProgress.length} learning path progress entries...`);
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
    console.log(`Migrating ${data.voiceSessions.length} voice sessions...`);
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

  console.log('\n✅ Migration completed!');
  console.log('Results:');
  Object.entries(results).forEach(([key, count]) => {
    console.log(`  - ${key}: ${count}`);
  });

  process.exit(0);
}

// Get command line arguments
const args = process.argv.slice(2);
const filePath = args[0];
let userId = args[1];

if (!filePath) {
  console.log('Usage: npm run migrate <exported-data-file.json> [userId]');
  console.log('\nExample:');
  console.log('  npm run migrate ./localStorage-export-2024-01-01.json');
  console.log('  npm run migrate ./localStorage-export-2024-01-01.json user123');
  console.log('\nNote: If userId is not provided, the script will try to extract it from the exported file.');
  console.log('      To find your user ID, run: npm run list-users');
  console.log('\nTo export localStorage data:');
  console.log('  1. Open your browser console on the app');
  console.log('  2. Copy and paste the contents of scripts/export-localStorage.js');
  console.log('  3. A JSON file will be downloaded');
  process.exit(1);
}

if (!existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

const fileContent = readFileSync(filePath, 'utf-8');
let migrationData: MigrationData;

try {
  const parsed = JSON.parse(fileContent);
  // Handle both direct data and wrapped export format
  if (parsed.customResponses || parsed.confidenceRatings) {
    migrationData = parsed;
  } else if (parsed.customResponses !== undefined) {
    migrationData = parsed;
  } else {
    console.error('Invalid data format. Expected export data structure.');
    process.exit(1);
  }
  
  // Extract userId from exported data if not provided
  if (!userId && migrationData.userId) {
    userId = migrationData.userId;
    console.log(`Found userId in exported data: ${userId}`);
  }
} catch (error) {
  console.error('Error parsing JSON file:', error);
  process.exit(1);
}

if (!userId) {
  console.error('Error: userId is required but not found in exported data or command line arguments.');
  console.log('\nTo find your user ID, run: npm run list-users');
  process.exit(1);
}

console.log('Starting direct MongoDB migration...');
console.log('Data to migrate:');
console.log(`- Custom Responses: ${migrationData.customResponses?.length || 0}`);
console.log(`- Confidence Ratings: ${migrationData.confidenceRatings?.length || 0}`);
console.log(`- Practice Sessions: ${migrationData.practiceSessions?.length || 0}`);
console.log(`- Notes: ${migrationData.notes?.length || 0}`);
console.log(`- Templates: ${migrationData.responseTemplates?.length || 0}`);
console.log(`- Practice History: ${migrationData.practiceHistory?.length || 0}`);
console.log(`- Points: ${migrationData.points?.history?.length || 0}`);
console.log(`- Review Schedules: ${migrationData.reviewSchedules?.length || 0}`);
console.log(`- Learning Path Progress: ${migrationData.learningPathProgress?.length || 0}`);
console.log(`- Voice Sessions: ${migrationData.voiceSessions?.length || 0}`);
console.log(`\nMigrating for user: ${userId}\n`);

migrateToMongoDB(migrationData, userId).catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});

