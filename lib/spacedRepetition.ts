import { PracticeHistoryEntry } from '@/types';
import { getPracticeHistory, getLatestConfidenceRating, getConfidenceRatings, invalidateStatsCache } from './storage';
import { apiGet, apiPost } from './apiClient';
import { getCurrentUserId, isAuthenticated } from './auth';
import { error as logError } from './logger';

export interface ReviewSchedule {
  objectionId: string;
  nextReviewDate: string; // ISO date string
  interval: number; // days until next review
  easeFactor: number; // difficulty multiplier (default 2.5)
  repetitions: number; // number of successful reviews
  lastReviewDate: string | null;
  isDue: boolean;
}

const INITIAL_EASE_FACTOR = 2.5;
const MIN_EASE_FACTOR = 1.3;

function shouldUseAPI(): boolean {
  return typeof window !== 'undefined' && isAuthenticated();
}

/**
 * SM-2 Algorithm for Spaced Repetition
 * Based on SuperMemo 2 algorithm
 */
export function calculateNextReview(
  objectionId: string,
  quality: number, // 0-5 rating (0=fail, 5=perfect)
  currentSchedule: ReviewSchedule | null
): ReviewSchedule {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Initialize if first review
  if (!currentSchedule) {
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + 1); // First review: 1 day

    return {
      objectionId,
      nextReviewDate: nextDate.toISOString().split('T')[0],
      interval: 1,
      easeFactor: INITIAL_EASE_FACTOR,
      repetitions: quality >= 3 ? 1 : 0,
      lastReviewDate: today.toISOString().split('T')[0],
      isDue: false,
    };
  }

  // Calculate new ease factor based on quality
  let newEaseFactor = currentSchedule.easeFactor;
  if (quality < 3) {
    // Failed review - reset
    newEaseFactor = Math.max(
      MIN_EASE_FACTOR,
      currentSchedule.easeFactor - 0.15
    );
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + 1); // Review again in 1 day

    return {
      ...currentSchedule,
      nextReviewDate: nextDate.toISOString().split('T')[0],
      interval: 1,
      easeFactor: newEaseFactor,
      repetitions: 0,
      lastReviewDate: today.toISOString().split('T')[0],
      isDue: false,
    };
  }

  // Successful review
  let newRepetitions = currentSchedule.repetitions;
  let newInterval: number;

  if (newRepetitions === 0) {
    newInterval = 1;
  } else if (newRepetitions === 1) {
    newInterval = 6;
  } else {
    newInterval = Math.round(currentSchedule.interval * newEaseFactor);
  }

  // Adjust ease factor based on quality
  newEaseFactor = currentSchedule.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEaseFactor = Math.max(MIN_EASE_FACTOR, newEaseFactor);

  // Increase repetitions for successful review
  if (quality >= 3) {
    newRepetitions += 1;
  }

  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + newInterval);

  return {
    ...currentSchedule,
    nextReviewDate: nextDate.toISOString().split('T')[0],
    interval: newInterval,
    easeFactor: newEaseFactor,
    repetitions: newRepetitions,
    lastReviewDate: today.toISOString().split('T')[0],
    isDue: false,
  };
}

/**
 * Get review schedule for an objection
 */
export async function getReviewSchedule(objectionId: string): Promise<ReviewSchedule | null> {
  if (typeof window === 'undefined') return null;

  if (shouldUseAPI()) {
    try {
      const data = await apiGet('/api/data/review-schedules', { objectionId });
      if (data.schedules && data.schedules.length > 0) {
        return data.schedules[0];
      }
      return null;
    } catch (error) {
      logError('Failed to get review schedule from API', error);
      // Fall through
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem('objections-app-review-schedules');
    if (!stored) return null;

    const schedules: ReviewSchedule[] = JSON.parse(stored);
    const schedule = schedules.find(s => s.objectionId === objectionId);
    
    if (!schedule) return null;

    const today = new Date().toISOString().split('T')[0];
    const isDue = schedule.nextReviewDate <= today;

    return {
      ...schedule,
      isDue,
    };
  } catch (error) {
    logError('Failed to get review schedule', error);
    return null;
  }
}

/**
 * Save review schedule
 */
export async function saveReviewSchedule(schedule: ReviewSchedule): Promise<void> {
  if (typeof window === 'undefined') return;

  if (shouldUseAPI()) {
    try {
      await apiPost('/api/data/review-schedules', { schedule });
      invalidateStatsCache(); // Invalidate cache when review schedule is updated
      return;
    } catch (error) {
      logError('Failed to save review schedule to API', error);
      // Fall through
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem('objections-app-review-schedules');
    const schedules: ReviewSchedule[] = stored ? JSON.parse(stored) : [];

    const index = schedules.findIndex(s => s.objectionId === schedule.objectionId);
    if (index >= 0) {
      schedules[index] = schedule;
    } else {
      schedules.push(schedule);
    }

    localStorage.setItem('objections-app-review-schedules', JSON.stringify(schedules));
    invalidateStatsCache(); // Invalidate cache when review schedule is updated
  } catch (error) {
    logError('Failed to save review schedule', error);
  }
}

/**
 * Record a review session and update schedule
 */
export async function recordReview(objectionId: string, confidenceRating: number): Promise<void> {
  const quality = Math.max(1, Math.min(5, confidenceRating));

  const currentSchedule = await getReviewSchedule(objectionId);
  const newSchedule = calculateNextReview(objectionId, quality, currentSchedule);
  await saveReviewSchedule(newSchedule);
}

/**
 * Get all objections that are due for review
 */
export async function getDueForReview(): Promise<string[]> {
  if (typeof window === 'undefined') return [];

  if (shouldUseAPI()) {
    try {
      const data = await apiGet('/api/data/review-schedules', { dueOnly: 'true' });
      return (data.schedules || []).map((s: ReviewSchedule) => s.objectionId);
    } catch (error) {
      logError('Failed to get due reviews from API', error);
      // Fall through
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem('objections-app-review-schedules');
    if (!stored) return [];

    const schedules: ReviewSchedule[] = JSON.parse(stored);
    const today = new Date().toISOString().split('T')[0];

    return schedules
      .filter(schedule => schedule.nextReviewDate <= today)
      .map(schedule => schedule.objectionId);
  } catch (error) {
    logError('Failed to get due reviews', error);
    return [];
  }
}

/**
 * Get all review schedules
 */
export async function getAllReviewSchedules(): Promise<ReviewSchedule[]> {
  if (typeof window === 'undefined') return [];

  if (shouldUseAPI()) {
    try {
      const data = await apiGet('/api/data/review-schedules');
      return data.schedules || [];
    } catch (error) {
      logError('Failed to get review schedules from API', error);
      // Fall through
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem('objections-app-review-schedules');
    if (!stored) return [];

    const schedules: ReviewSchedule[] = JSON.parse(stored);
    const today = new Date().toISOString().split('T')[0];

    return schedules.map(schedule => ({
      ...schedule,
      isDue: schedule.nextReviewDate <= today,
    }));
  } catch (error) {
    logError('Failed to get review schedules', error);
    return [];
  }
}

/**
 * Get review statistics
 */
export async function getReviewStats() {
  const schedules = await getAllReviewSchedules();
  const due = schedules.filter(s => s.isDue);
  const upcoming = schedules.filter(s => {
    const daysUntil = Math.ceil(
      (new Date(s.nextReviewDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return !s.isDue && daysUntil <= 7;
  });

  return {
    totalScheduled: schedules.length,
    dueForReview: due.length,
    upcomingThisWeek: upcoming.length,
    averageInterval: schedules.length > 0
      ? Math.round(schedules.reduce((sum, s) => sum + s.interval, 0) / schedules.length)
      : 0,
    averageEaseFactor: schedules.length > 0
      ? parseFloat((schedules.reduce((sum, s) => sum + s.easeFactor, 0) / schedules.length).toFixed(2))
      : 0,
  };
}
