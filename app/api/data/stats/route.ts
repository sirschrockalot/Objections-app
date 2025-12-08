import { NextRequest, NextResponse } from 'next/server';
import PracticeSession from '@/lib/models/PracticeSession';
import ConfidenceRating from '@/lib/models/ConfidenceRating';
import ReviewSchedule from '@/lib/models/ReviewSchedule';
import Points from '@/lib/models/Points';
import { initialObjections } from '@/data/objections';
import { createApiHandler } from '@/lib/api/routeHandler';
import { RATE_LIMITS } from '@/lib/rateLimiter';
import { getCachedQueryResult } from '@/lib/cache/queryCache';

export const GET = createApiHandler({
  rateLimit: RATE_LIMITS.read,
  requireAuth: true,
  errorContext: 'Get stats',
  handler: async (req, { userId }) => {

    // Fetch all data in parallel with caching (5 minute cache)
    const [sessions, ratings, reviewSchedules, pointsEntries] = await Promise.all([
      getCachedQueryResult(
        'PracticeSession',
        { userId },
        () => PracticeSession.find({ userId }).lean(),
        300 // 5 minutes
      ),
      getCachedQueryResult(
        'ConfidenceRating',
        { userId },
        () => ConfidenceRating.find({ userId }).lean(),
        300
      ),
      getCachedQueryResult(
        'ReviewSchedule',
        { userId },
        () => ReviewSchedule.find({ userId }).lean(),
        300
      ),
      getCachedQueryResult(
        'Points',
        { userId, sort: { date: -1 } },
        () => Points.find({ userId }).sort({ date: -1 }).lean(),
        300
      ),
    ]);

    // Calculate total sessions
    const totalSessions = sessions.length;

    // Calculate total objections practiced
    const allObjectionsPracticed = new Set<string>();
    sessions.forEach(session => {
      session.objectionsPracticed.forEach(id => allObjectionsPracticed.add(id));
    });
    const totalObjectionsPracticed = allObjectionsPracticed.size;

    // Calculate practice streak
    let streak = 0;
    if (sessions.length > 0) {
      const sorted = sessions.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      const sessionsByDate = new Map<string, typeof sessions>();
      sorted.forEach(session => {
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);
        const dateKey = sessionDate.toISOString().split('T')[0];
        
        if (!sessionsByDate.has(dateKey)) {
          sessionsByDate.set(dateKey, []);
        }
        sessionsByDate.get(dateKey)!.push(session);
      });
      
      const dateKeys = Array.from(sessionsByDate.keys()).sort().reverse();
      
      for (let i = 0; i < dateKeys.length; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        checkDate.setHours(0, 0, 0, 0);
        const checkKey = checkDate.toISOString().split('T')[0];
        
        if (dateKeys.includes(checkKey)) {
          streak++;
        } else {
          break;
        }
      }
    }

    // Calculate category stats
    const categoryStats: Record<string, { practiced: Set<string>; total: number }> = {};
    
    initialObjections.forEach(obj => {
      if (!categoryStats[obj.category]) {
        categoryStats[obj.category] = { practiced: new Set(), total: 0 };
      }
      categoryStats[obj.category].total++;
    });

    allObjectionsPracticed.forEach(id => {
      const objection = initialObjections.find(o => o.id === id);
      if (objection && categoryStats[objection.category]) {
        categoryStats[objection.category].practiced.add(id);
      }
    });

    const categoryStatsResult: Record<string, { practiced: number; total: number }> = {};
    Object.keys(categoryStats).forEach(category => {
      categoryStatsResult[category] = {
        practiced: categoryStats[category].practiced.size,
        total: categoryStats[category].total,
      };
    });

    // Calculate total points
    const totalPoints = pointsEntries.reduce((sum, entry) => sum + entry.points, 0);

    // Calculate spaced repetition stats
    const totalScheduled = reviewSchedules.length;
    const now = new Date();
    const dueForReview = reviewSchedules.filter(schedule => {
      if (!schedule.nextReviewDate) return false;
      return new Date(schedule.nextReviewDate) <= now;
    }).length;

    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingThisWeek = reviewSchedules.filter(schedule => {
      if (!schedule.nextReviewDate) return false;
      const reviewDate = new Date(schedule.nextReviewDate);
      return reviewDate > now && reviewDate <= weekFromNow;
    }).length;

    const intervals = reviewSchedules
      .map(s => s.interval)
      .filter(i => i !== undefined && i !== null) as number[];
    const averageInterval = intervals.length > 0
      ? Math.round(intervals.reduce((sum, i) => sum + i, 0) / intervals.length)
      : 0;

    const easeFactors = reviewSchedules
      .map(s => s.easeFactor)
      .filter(e => e !== undefined && e !== null) as number[];
    const averageEaseFactor = easeFactors.length > 0
      ? Math.round((easeFactors.reduce((sum, e) => sum + e, 0) / easeFactors.length) * 100) / 100
      : 0;

    // Calculate category mastery
    const categoryMastery: Array<{
      category: string;
      masteryLevel: number;
      objectionsPracticed: number;
      totalObjections: number;
      averageConfidence: number;
      badgeEarned: string | null;
    }> = [];

    Object.entries(categoryStatsResult).forEach(([category, stats]) => {
      const categoryRatings = ratings.filter(r => {
        const objection = initialObjections.find(o => o.id === r.objectionId);
        return objection && objection.category === category;
      });

      const averageConfidence = categoryRatings.length > 0
        ? Math.round((categoryRatings.reduce((sum, r) => sum + r.rating, 0) / categoryRatings.length) * 10) / 10
        : 0;

      const masteryLevel = stats.total > 0
        ? Math.round((stats.practiced / stats.total) * 100)
        : 0;

      let badgeEarned: string | null = null;
      if (masteryLevel >= 90 && averageConfidence >= 4.5) {
        badgeEarned = 'Master';
      } else if (masteryLevel >= 75 && averageConfidence >= 4.0) {
        badgeEarned = 'Expert';
      } else if (masteryLevel >= 50 && averageConfidence >= 3.5) {
        badgeEarned = 'Proficient';
      } else if (masteryLevel >= 25 && averageConfidence >= 3.0) {
        badgeEarned = 'Competent';
      }

      categoryMastery.push({
        category,
        masteryLevel,
        objectionsPracticed: stats.practiced,
        totalObjections: stats.total,
        averageConfidence,
        badgeEarned,
      });
    });

    // Calculate user level
    const levelThresholds = [
      { level: 1, name: 'Beginner', points: 0 },
      { level: 2, name: 'Novice', points: 100 },
      { level: 3, name: 'Apprentice', points: 300 },
      { level: 4, name: 'Practitioner', points: 600 },
      { level: 5, name: 'Expert', points: 1000 },
      { level: 6, name: 'Master', points: 1500 },
      { level: 7, name: 'Grand Master', points: 2500 },
    ];

    let userLevel = levelThresholds[0];
    for (let i = levelThresholds.length - 1; i >= 0; i--) {
      if (totalPoints >= levelThresholds[i].points) {
        userLevel = levelThresholds[i];
        break;
      }
    }

    const nextLevel = levelThresholds.find(l => l.points > totalPoints) || levelThresholds[levelThresholds.length - 1];
    const pointsToNextLevel = nextLevel.points - totalPoints;
    const currentLevelPoints = totalPoints - userLevel.points;

    return {
      // Basic stats
      totalSessions,
      totalObjectionsPracticed,
      streak,
      categoryStats: categoryStatsResult,
      totalObjections: initialObjections.length,
      
      // Points and level
      totalPoints,
      userLevel: {
        level: userLevel.level,
        levelName: userLevel.name,
        totalPoints,
        pointsToNextLevel,
        currentLevelPoints,
      },
      
      // Spaced repetition
      spacedRepetition: {
        totalScheduled,
        dueForReview,
        upcomingThisWeek,
        averageInterval,
        averageEaseFactor,
      },
      
      // Category mastery
      categoryMastery,
      
      // Recent points (last 5 entries)
      recentPoints: pointsEntries.slice(0, 5).reduce((sum, entry) => sum + entry.points, 0),
    };
  },
});

