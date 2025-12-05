/**
 * Migration utility to move localStorage data to MongoDB
 * Run this once after logging in to migrate existing data
 */

import { apiPost } from './apiClient';
import { getCurrentUserId } from './auth';

export async function migrateLocalStorageToMongo(): Promise<{
  success: boolean;
  migrated: Record<string, number>;
  error?: string;
}> {
  if (typeof window === 'undefined') {
    return { success: false, migrated: {}, error: 'Must run in browser' };
  }

  const userId = getCurrentUserId();
  if (!userId) {
    return { success: false, migrated: {}, error: 'Must be logged in to migrate' };
  }

  try {
    // Collect all localStorage data
    const migrationData: any = {};

    // Custom responses
    const storedObjections = localStorage.getItem('objections-app-data');
    if (storedObjections) {
      try {
        const objections: any[] = JSON.parse(storedObjections);
        migrationData.customResponses = objections.flatMap((obj: any) =>
          (obj.customResponses || []).map((response: any) => ({
            objectionId: obj.id,
            response,
          }))
        );
      } catch (error) {
        console.error('Error parsing custom responses:', error);
      }
    }

    // Confidence ratings
    const ratings = localStorage.getItem('objections-app-confidence-ratings');
    if (ratings) {
      try {
        migrationData.confidenceRatings = JSON.parse(ratings);
      } catch (error) {
        console.error('Error parsing confidence ratings:', error);
      }
    }

    // Practice sessions
    const sessions = localStorage.getItem('objections-app-sessions');
    if (sessions) {
      try {
        migrationData.practiceSessions = JSON.parse(sessions);
      } catch (error) {
        console.error('Error parsing practice sessions:', error);
      }
    }

    // Notes
    const notes = localStorage.getItem('objections-app-notes');
    if (notes) {
      try {
        migrationData.notes = JSON.parse(notes);
      } catch (error) {
        console.error('Error parsing notes:', error);
      }
    }

    // Templates
    const templates = localStorage.getItem('objections-app-templates');
    if (templates) {
      try {
        migrationData.responseTemplates = JSON.parse(templates);
      } catch (error) {
        console.error('Error parsing templates:', error);
      }
    }

    // Practice history
    const history = localStorage.getItem('objections-app-practice-history');
    if (history) {
      try {
        migrationData.practiceHistory = JSON.parse(history);
      } catch (error) {
        console.error('Error parsing practice history:', error);
      }
    }

    // Points
    const points = localStorage.getItem('objections-app-points');
    if (points) {
      try {
        const pointsData = JSON.parse(points);
        migrationData.points = {
          total: pointsData.total || 0,
          history: pointsData.history || [],
        };
      } catch (error) {
        console.error('Error parsing points:', error);
      }
    }

    // Review schedules (from spacedRepetition)
    const reviewSchedules = localStorage.getItem('objections-app-review-schedules');
    if (reviewSchedules) {
      try {
        migrationData.reviewSchedules = JSON.parse(reviewSchedules);
      } catch (error) {
        console.error('Error parsing review schedules:', error);
      }
    }

    // Learning path progress
    const learningPaths = localStorage.getItem('objections-app-learning-path-progress');
    if (learningPaths) {
      try {
        const paths = JSON.parse(learningPaths);
        migrationData.learningPathProgress = Array.isArray(paths) ? paths : [paths];
      } catch (error) {
        console.error('Error parsing learning paths:', error);
      }
    }

    // Voice sessions
    const voiceSessions = localStorage.getItem('response-ready-voice-sessions');
    if (voiceSessions) {
      try {
        migrationData.voiceSessions = JSON.parse(voiceSessions);
      } catch (error) {
        console.error('Error parsing voice sessions:', error);
      }
    }

    // Send to migration API
    const result = await apiPost('/api/migrate', { data: migrationData });

    // Clear localStorage after successful migration (optional - comment out if you want to keep backup)
    // localStorage.removeItem('objections-app-data');
    // localStorage.removeItem('objections-app-confidence-ratings');
    // localStorage.removeItem('objections-app-sessions');
    // localStorage.removeItem('objections-app-notes');
    // localStorage.removeItem('objections-app-templates');
    // localStorage.removeItem('objections-app-practice-history');
    // localStorage.removeItem('objections-app-points');
    // localStorage.removeItem('objections-app-review-schedules');
    // localStorage.removeItem('objections-app-learning-path-progress');
    // localStorage.removeItem('response-ready-voice-sessions');

    return {
      success: true,
      migrated: result.migrated || {},
    };
  } catch (error: any) {
    console.error('Migration error:', error);
    return {
      success: false,
      migrated: {},
      error: error.message || 'Migration failed',
    };
  }
}

