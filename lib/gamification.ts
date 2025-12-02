import { PointsEntry, UserLevel, CategoryMastery } from '@/types';
import { getPracticeSessions, getConfidenceRatings, getObjections, getCategoryStats } from './storage';

const POINTS_KEY = 'objections-app-points';
const USER_ID_KEY = 'objections-app-user-id';

function getUserId(): string {
  if (typeof window === 'undefined') return 'user-1';
  
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = `user-${Date.now()}`;
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

// Points System
export function addPoints(points: number, reason: string, metadata?: Record<string, any>): PointsEntry {
  if (typeof window === 'undefined') {
    throw new Error('Cannot add points in server environment');
  }

  try {
    const stored = localStorage.getItem(POINTS_KEY);
    const allPoints: PointsEntry[] = stored ? JSON.parse(stored) : [];

    const entry: PointsEntry = {
      id: `points-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: getUserId(),
      points,
      reason,
      date: new Date().toISOString(),
      metadata,
    };

    allPoints.push(entry);
    localStorage.setItem(POINTS_KEY, JSON.stringify(allPoints));

    return entry;
  } catch (error) {
    console.error('Error adding points:', error);
    throw error;
  }
}

export function getTotalPoints(): number {
  if (typeof window === 'undefined') return 0;

  try {
    const stored = localStorage.getItem(POINTS_KEY);
    if (!stored) return 0;

    const allPoints: PointsEntry[] = JSON.parse(stored);
    const userId = getUserId();
    return allPoints
      .filter(p => p.userId === userId)
      .reduce((sum, entry) => sum + entry.points, 0);
  } catch (error) {
    console.error('Error getting total points:', error);
    return 0;
  }
}

export function getPointsHistory(limit?: number): PointsEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(POINTS_KEY);
    if (!stored) return [];

    const allPoints: PointsEntry[] = JSON.parse(stored);
    const userId = getUserId();
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

export function getUserLevel(): UserLevel {
  const totalPoints = getTotalPoints();
  
  // Find current level
  let currentLevel = LEVEL_THRESHOLDS[0];
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_THRESHOLDS[i].points) {
      currentLevel = LEVEL_THRESHOLDS[i];
      break;
    }
  }

  // Find next level
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
export function getCategoryMastery(): CategoryMastery[] {
  if (typeof window === 'undefined') return [];

  const objections = getObjections();
  const categoryStats = getCategoryStats();
  const ratings = getConfidenceRatings();

  // Calculate average confidence per category
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

    // Mastery calculation: (practiced/total * 0.6 + averageConfidence/5 * 0.4) * 100
    const practiceRatio = stats.total > 0 ? stats.practiced / stats.total : 0;
    const confidenceRatio = averageConfidence / 5;
    const masteryLevel = Math.round((practiceRatio * 0.6 + confidenceRatio * 0.4) * 100);

    // Badge thresholds
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

