/**
 * Storage and utilities for voice practice goals
 */

import { VoicePracticeGoal, GoalProgress, VoiceSession } from '@/types';
import { getVoiceSessions, getVoiceSessionStats } from './voiceSessionStorage';
import { getSessionFeedback } from './aiFeedback';
import { error as logError } from './logger';

const VOICE_GOALS_KEY = 'response-ready-voice-goals';

/**
 * Get all voice practice goals
 */
export function getVoiceGoals(): VoicePracticeGoal[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(VOICE_GOALS_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as VoicePracticeGoal[];
  } catch (error) {
    logError('Failed to load voice goals', error);
    return [];
  }
}

/**
 * Get active goals only
 */
export function getActiveGoals(): VoicePracticeGoal[] {
  return getVoiceGoals().filter((goal) => goal.isActive);
}

/**
 * Save a voice practice goal
 */
export function saveVoiceGoal(goal: VoicePracticeGoal): void {
  if (typeof window === 'undefined') return;

  try {
    const goals = getVoiceGoals();
    const existingIndex = goals.findIndex((g) => g.id === goal.id);

    if (existingIndex >= 0) {
      goals[existingIndex] = goal;
    } else {
      goals.push(goal);
    }

    localStorage.setItem(VOICE_GOALS_KEY, JSON.stringify(goals));
  } catch (error) {
    logError('Failed to save voice goal', error);
  }
}

/**
 * Delete a voice practice goal
 */
export function deleteVoiceGoal(goalId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const goals = getVoiceGoals();
    const filtered = goals.filter((g) => g.id !== goalId);
    localStorage.setItem(VOICE_GOALS_KEY, JSON.stringify(filtered));
  } catch (error) {
    logError('Failed to delete voice goal', error);
  }
}

/**
 * Calculate progress for a goal
 */
export async function calculateGoalProgress(goal: VoicePracticeGoal): Promise<GoalProgress> {
  const sessions = await getVoiceSessions();
  const completedSessions = sessions.filter((s) => s.status === 'completed');

  let current = 0;
  let isCompleted = false;
  let completedAt: string | undefined;

  switch (goal.type) {
    case 'overallScore': {
      // Get average overall score from AI feedback
      const feedbackPromises = completedSessions.map((s) =>
        getSessionFeedback(s).catch(() => null)
      );
      const feedbackResults = await Promise.all(feedbackPromises);
      const validFeedback = feedbackResults.filter((f) => f !== null);
      
      if (validFeedback.length > 0) {
        const scores = validFeedback.map((f) => (f ? f.overallScore : 0));
        current = scores.reduce((a, b) => a + b, 0) / scores.length;
      }
      isCompleted = current >= goal.target;
      break;
    }

    case 'qualityMetric': {
      if (!goal.metric) break;
      // Get average quality metric from AI feedback
      const feedbackPromises = completedSessions.map((s) =>
        getSessionFeedback(s).catch(() => null)
      );
      const feedbackResults = await Promise.all(feedbackPromises);
      const validFeedback = feedbackResults.filter((f) => f !== null);
      
      if (validFeedback.length > 0) {
        const metrics = validFeedback.map((f) => {
          if (!f) return 0;
          const metricValue = f.qualityMetrics[goal.metric as keyof typeof f.qualityMetrics];
          return typeof metricValue === 'number' ? metricValue : 0;
        });
        current = metrics.reduce((a, b) => a + b, 0) / metrics.length;
      }
      isCompleted = current >= goal.target;
      break;
    }

    case 'sessionFrequency': {
      // Count sessions in the specified period
      const now = new Date();
      let periodStart: Date;

      switch (goal.period) {
        case 'daily':
          periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          const dayOfWeek = now.getDay();
          periodStart = new Date(now);
          periodStart.setDate(now.getDate() - dayOfWeek);
          periodStart.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          periodStart = new Date(0);
      }

      current = completedSessions.filter(
        (s) => new Date(s.startTime) >= periodStart
      ).length;
      isCompleted = current >= goal.target;
      break;
    }

    case 'sessionDuration': {
      // Calculate average session duration in the specified period
      const now = new Date();
      let periodStart: Date;

      switch (goal.period) {
        case 'daily':
          periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          const dayOfWeek = now.getDay();
          periodStart = new Date(now);
          periodStart.setDate(now.getDate() - dayOfWeek);
          periodStart.setHours(0, 0, 0, 0);
          break;
        case 'monthly':
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          periodStart = new Date(0);
      }

      const periodSessions = completedSessions.filter(
        (s) => new Date(s.startTime) >= periodStart
      );

      if (periodSessions.length > 0) {
        const totalDuration = periodSessions.reduce(
          (sum, s) => sum + s.metrics.totalDuration,
          0
        );
        current = totalDuration / periodSessions.length; // Average in seconds
      }
      isCompleted = current >= goal.target;
      break;
    }

    case 'consistency': {
      // Count consecutive days with at least one session
      const sessionDates = new Set(
        completedSessions.map((s) =>
          new Date(s.startTime).toDateString()
        )
      );
      const sortedDates = Array.from(sessionDates)
        .map((d) => new Date(d))
        .sort((a, b) => a.getTime() - b.getTime());

      let maxStreak = 0;
      let currentStreak = 0;
      let lastDate: Date | null = null;

      for (const date of sortedDates) {
        if (lastDate) {
          const daysDiff = Math.floor(
            (date.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysDiff === 1) {
            currentStreak++;
          } else {
            maxStreak = Math.max(maxStreak, currentStreak);
            currentStreak = 1;
          }
        } else {
          currentStreak = 1;
        }
        lastDate = date;
      }
      maxStreak = Math.max(maxStreak, currentStreak);
      current = maxStreak;
      isCompleted = current >= goal.target;
      break;
    }
  }

  const progress = goal.target > 0 ? Math.min((current / goal.target) * 100, 100) : 0;
  const remaining = Math.max(goal.target - current, 0);

  // Calculate days remaining if deadline exists
  let daysRemaining: number | undefined;
  if (goal.deadline) {
    const deadline = new Date(goal.deadline);
    const now = new Date();
    daysRemaining = Math.ceil(
      (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  // Check if goal was just completed
  if (isCompleted && !goal.completedAt) {
    goal.completedAt = new Date().toISOString();
    saveVoiceGoal(goal);
    completedAt = goal.completedAt;
  }

  return {
    goalId: goal.id,
    progress,
    current: Math.round(current * 100) / 100,
    target: goal.target,
    remaining: Math.round(remaining * 100) / 100,
    daysRemaining,
    isCompleted,
    completedAt: completedAt || goal.completedAt,
  };
}

/**
 * Calculate progress for all active goals
 */
export async function calculateAllGoalProgress(): Promise<GoalProgress[]> {
  const activeGoals = getActiveGoals();
  const progressPromises = activeGoals.map((goal) => calculateGoalProgress(goal));
  return Promise.all(progressPromises);
}

/**
 * Get goal recommendations based on user performance
 */
export async function getGoalRecommendations(): Promise<Partial<VoicePracticeGoal>[]> {
  const [stats, sessions] = await Promise.all([
    getVoiceSessionStats(),
    getVoiceSessions(),
  ]);
  const completedSessions = sessions.filter((s) => s.status === 'completed');

  const recommendations: Partial<VoicePracticeGoal>[] = [];

  // Recommend session frequency goal if user has few sessions
  if (stats.totalSessions < 5) {
    recommendations.push({
      type: 'sessionFrequency',
      target: 5,
      period: 'weekly',
      description: 'Complete 5 practice sessions this week',
    });
  }

  // Recommend duration goal if sessions are short
  if (stats.averageSessionDuration < 300) {
    recommendations.push({
      type: 'sessionDuration',
      target: 600, // 10 minutes
      period: 'weekly',
      description: 'Average 10 minutes per session this week',
    });
  }

  // Recommend consistency goal
  recommendations.push({
    type: 'consistency',
    target: 3,
    description: 'Practice 3 days in a row',
  });

  // Recommend overall score goal if user has sessions
  if (completedSessions.length > 0) {
    recommendations.push({
      type: 'overallScore',
      target: 75,
      description: 'Achieve an average overall score of 75',
    });
  }

  return recommendations;
}

/**
 * Create a new goal from a recommendation
 */
export function createGoalFromRecommendation(
  recommendation: Partial<VoicePracticeGoal>
): VoicePracticeGoal {
  return {
    id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: recommendation.type!,
    target: recommendation.target!,
    current: 0,
    metric: recommendation.metric,
    period: recommendation.period,
    deadline: recommendation.deadline,
    createdAt: new Date().toISOString(),
    isActive: true,
    description: recommendation.description,
  };
}

