import { getTotalSessions, getTotalObjectionsPracticed, getPracticeStreak, getObjections, getConfidenceRatings } from './storage';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export function checkAchievements(): Achievement[] {
  const totalSessions = getTotalSessions();
  const totalObjections = getTotalObjectionsPracticed();
  const streak = getPracticeStreak();
  const allObjections = getObjections();
  const ratings = getConfidenceRatings();
  
  const achievements: Achievement[] = [
    {
      id: 'first-practice',
      name: 'First Steps',
      description: 'Complete your first practice session',
      icon: '🎯',
      unlocked: totalSessions >= 1,
      unlockedAt: totalSessions >= 1 ? new Date().toISOString() : undefined,
    },
    {
      id: '10-sessions',
      name: 'Dedicated Learner',
      description: 'Complete 10 practice sessions',
      icon: '🔥',
      unlocked: totalSessions >= 10,
    },
    {
      id: '25-sessions',
      name: 'Practice Master',
      description: 'Complete 25 practice sessions',
      icon: '⭐',
      unlocked: totalSessions >= 25,
    },
    {
      id: '50-sessions',
      name: 'Elite Practitioner',
      description: 'Complete 50 practice sessions',
      icon: '🏆',
      unlocked: totalSessions >= 50,
    },
    {
      id: '5-objections',
      name: 'Getting Started',
      description: 'Practice 5 different objections',
      icon: '📚',
      unlocked: totalObjections >= 5,
    },
    {
      id: 'all-objections',
      name: 'Complete Coverage',
      description: 'Practice all objections',
      icon: '🎓',
      unlocked: totalObjections >= allObjections.length,
    },
    {
      id: '3-day-streak',
      name: 'On a Roll',
      description: 'Practice for 3 days in a row',
      icon: '🔥',
      unlocked: streak >= 3,
    },
    {
      id: '7-day-streak',
      name: 'Week Warrior',
      description: 'Practice for 7 days in a row',
      icon: '💪',
      unlocked: streak >= 7,
    },
    {
      id: '30-day-streak',
      name: 'Consistency King',
      description: 'Practice for 30 days in a row',
      icon: '👑',
      unlocked: streak >= 30,
    },
    {
      id: '10-responses',
      name: 'Contributor',
      description: 'Add 10 custom responses',
      icon: '✍️',
      unlocked: false, // Will be calculated from custom responses
    },
    {
      id: 'high-confidence',
      name: 'Confident Communicator',
      description: 'Rate yourself 4+ stars on 10 objections',
      icon: '🌟',
      unlocked: ratings.filter(r => r.rating >= 4).length >= 10,
    },
  ];

  // Calculate custom responses achievement
  const totalCustomResponses = allObjections.reduce(
    (sum, obj) => sum + obj.customResponses.length,
    0
  );
  const contributorAchievement = achievements.find(a => a.id === '10-responses');
  if (contributorAchievement) {
    contributorAchievement.unlocked = totalCustomResponses >= 10;
  }

  return achievements;
}

export function getUnlockedAchievements(): Achievement[] {
  return checkAchievements().filter(a => a.unlocked);
}

export function getLockedAchievements(): Achievement[] {
  return checkAchievements().filter(a => !a.unlocked);
}

