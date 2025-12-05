import { PointsEntry, UserLevel, CategoryMastery } from '@/types';
import { getPracticeSessions, getConfidenceRatings, getObjections, getCategoryStats, invalidateStatsCache } from './storage';
import { apiGet, apiPost } from './apiClient';
import { getCurrentUserId, isAuthenticated } from './auth';

const POINTS_KEY = 'objections-app-points';

function shouldUseAPI(): boolean {
  return typeof window !== 'undefined' && isAuthenticated();
}

// Points System
export async function addPoints(points: number, reason: string, metadata?: Record<string, any>): Promise<PointsEntry> {
  if (typeof window === 'undefined') {
    throw new Error('Cannot add points in server environment');
  }

  if (shouldUseAPI()) {
    try {
      const userId = getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const data = await apiPost('/api/data/points', {
        points,
        reason,
        metadata,
        pointsId: `points-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      });

      invalidateStatsCache(); // Invalidate cache when points are added

      return {
        id: data.entry.id,
        userId: userId,
        points: data.entry.points,
        reason: data.entry.reason,
        date: data.entry.date,
        metadata: data.entry.metadata,
      };
    } catch (error) {
      console.error('Error adding points via API:', error);
      // Fall through to localStorage
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(POINTS_KEY);
    const allPoints: PointsEntry[] = stored ? JSON.parse(stored) : [];

    const userId = getCurrentUserId() || `user-${Date.now()}`;
    const entry: PointsEntry = {
      id: `points-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      points,
      reason,
      date: new Date().toISOString(),
      metadata,
    };

    allPoints.push(entry);
    localStorage.setItem(POINTS_KEY, JSON.stringify(allPoints));

    invalidateStatsCache(); // Invalidate cache when points are added

    return entry;
  } catch (error) {
    console.error('Error adding points:', error);
    throw error;
  }
}

export async function getTotalPoints(): Promise<number> {
  if (typeof window === 'undefined') return 0;

  if (shouldUseAPI()) {
    try {
      const data = await apiGet('/api/data/points');
      return data.total || 0;
    } catch (error) {
      console.error('Error getting total points from API:', error);
      // Fall through
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(POINTS_KEY);
    if (!stored) return 0;

    const allPoints: PointsEntry[] = JSON.parse(stored);
    const userId = getCurrentUserId() || `user-${Date.now()}`;
    return allPoints
      .filter(p => p.userId === userId)
      .reduce((sum, entry) => sum + entry.points, 0);
  } catch (error) {
    console.error('Error getting total points:', error);
    return 0;
  }
}

export async function getPointsHistory(limit?: number): Promise<PointsEntry[]> {
  if (typeof window === 'undefined') return [];

  if (shouldUseAPI()) {
    try {
      const data = await apiGet('/api/data/points');
      const history = data.history || [];
      return limit ? history.slice(0, limit) : history;
    } catch (error) {
      console.error('Error getting points history from API:', error);
      // Fall through
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(POINTS_KEY);
    if (!stored) return [];

    const allPoints: PointsEntry[] = JSON.parse(stored);
    const userId = getCurrentUserId() || `user-${Date.now()}`;
    const userPoints = allPoints
      .filter(p => p.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return limit ? userPoints.slice(0, limit) : userPoints;
  } catch (error) {
    console.error('Error getting points history:', error);
    return [];
  }
}

// Levels System
const LEVEL_THRESHOLDS = [
  { level: 1, name: 'Rookie', points: 0 },
  { level: 2, name: 'Beginner', points: 100 },
  { level: 3, name: 'Intermediate', points: 300 },
  { level: 4, name: 'Advanced', points: 600 },
  { level: 5, name: 'Pro', points: 1000 },
  { level: 6, name: 'Expert', points: 1500 },
  { level: 7, name: 'Master', points: 2500 },
];

export async function getUserLevel(): Promise<UserLevel> {
  const totalPoints = await getTotalPoints();
  
  let currentLevel = LEVEL_THRESHOLDS[0];
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_THRESHOLDS[i].points) {
      currentLevel = LEVEL_THRESHOLDS[i];
      break;
    }
  }

  const currentIndex = LEVEL_THRESHOLDS.findIndex(l => l.level === currentLevel.level);
  const nextLevel = LEVEL_THRESHOLDS[currentIndex + 1] || null;

  const pointsToNextLevel = nextLevel
    ? nextLevel.points - totalPoints
    : 0;

  const currentLevelStartPoints = currentLevel.points;
  const currentLevelPoints = totalPoints - currentLevelStartPoints;
  const currentLevelMaxPoints = nextLevel
    ? nextLevel.points - currentLevelStartPoints
    : Infinity;

  return {
    level: currentLevel.level,
    levelName: currentLevel.name,
    totalPoints,
    pointsToNextLevel,
    currentLevelPoints: currentLevelMaxPoints !== Infinity ? currentLevelPoints : 0,
  };
}

// Category Mastery
export async function getCategoryMastery(): Promise<CategoryMastery[]> {
  if (typeof window === 'undefined') return [];

  const [objections, categoryStats, ratings] = await Promise.all([
    getObjections(),
    getCategoryStats(),
    getConfidenceRatings(),
  ]);

  const categoryRatings = new Map<string, number[]>();
  ratings.forEach(rating => {
    const objection = objections.find(o => o.id === rating.objectionId);
    if (objection) {
      if (!categoryRatings.has(objection.category)) {
        categoryRatings.set(objection.category, []);
      }
      categoryRatings.get(objection.category)!.push(rating.rating);
    }
  });

  const mastery: CategoryMastery[] = [];

  Object.keys(categoryStats).forEach(category => {
    const stats = categoryStats[category];
    const categoryRatingList = categoryRatings.get(category) || [];
    const averageConfidence = categoryRatingList.length > 0
      ? categoryRatingList.reduce((sum, r) => sum + r, 0) / categoryRatingList.length
      : 0;

    const practiceRatio = stats.total > 0 ? stats.practiced / stats.total : 0;
    const confidenceRatio = averageConfidence / 5;
    const masteryLevel = Math.round((practiceRatio * 0.6 + confidenceRatio * 0.4) * 100);

    let badgeEarned: string | undefined;
    if (masteryLevel >= 90) {
      badgeEarned = 'Master';
    } else if (masteryLevel >= 75) {
      badgeEarned = 'Expert';
    } else if (masteryLevel >= 60) {
      badgeEarned = 'Proficient';
    } else if (masteryLevel >= 40) {
      badgeEarned = 'Competent';
    }

    mastery.push({
      category,
      masteryLevel,
      objectionsPracticed: stats.practiced,
      totalObjections: stats.total,
      averageConfidence: Math.round(averageConfidence * 10) / 10,
      badgeEarned,
    });
  });

  return mastery.sort((a, b) => b.masteryLevel - a.masteryLevel);
}

// Points for actions
export const POINTS_VALUES = {
  PRACTICE_SESSION: 10,
  OBJECTION_PRACTICED: 5,
  CUSTOM_RESPONSE: 15,
  CONFIDENCE_RATING_5: 5,
  CONFIDENCE_RATING_4: 3,
  CONFIDENCE_RATING_3: 1,
  STREAK_DAY: 5,
  CATEGORY_MASTERED: 50,
  ACHIEVEMENT_UNLOCKED: 25,
};
