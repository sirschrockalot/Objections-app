import { LearningPathProgress, DailyChallenge } from '@/types';

const LEARNING_PATH_PROGRESS_KEY = 'objections-app-learning-path-progress';
const DAILY_CHALLENGES_KEY = 'objections-app-daily-challenges';

/**
 * Get progress for a learning path
 */
export function getPathProgress(pathId: string): LearningPathProgress | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(LEARNING_PATH_PROGRESS_KEY);
    if (!stored) return null;

    const allProgress: LearningPathProgress[] = JSON.parse(stored);
    const progress = allProgress.find(p => p.pathId === pathId);
    
    if (!progress) return null;

    // Convert completedSteps array back to Set
    return {
      ...progress,
      completedSteps: new Set(progress.completedSteps as any),
    };
  } catch (error) {
    console.error('Error getting path progress:', error);
    return null;
  }
}

/**
 * Save progress for a learning path
 */
export function savePathProgress(progress: LearningPathProgress): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(LEARNING_PATH_PROGRESS_KEY);
    const allProgress: LearningPathProgress[] = stored ? JSON.parse(stored) : [];

    // Convert Set to array for storage
    const progressToSave = {
      ...progress,
      completedSteps: Array.from(progress.completedSteps),
    };

    const index = allProgress.findIndex(p => p.pathId === progress.pathId);
    if (index >= 0) {
      allProgress[index] = progressToSave as any;
    } else {
      allProgress.push(progressToSave as any);
    }

    localStorage.setItem(LEARNING_PATH_PROGRESS_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error('Error saving path progress:', error);
  }
}

/**
 * Initialize or update path progress
 */
export function startLearningPath(pathId: string): LearningPathProgress {
  const existing = getPathProgress(pathId);
  
  if (existing) {
    return existing;
  }

  const newProgress: LearningPathProgress = {
    pathId,
    currentStep: 0,
    completedSteps: new Set(),
    startedAt: new Date().toISOString(),
    lastPracticedAt: new Date().toISOString(),
  };

  savePathProgress(newProgress);
  return newProgress;
}

/**
 * Mark objection as completed in path
 */
export function completePathStep(pathId: string, objectionId: string): void {
  const progress = getPathProgress(pathId);
  if (!progress) return;

  progress.completedSteps.add(objectionId);
  progress.lastPracticedAt = new Date().toISOString();
  
  // Update current step to next uncompleted objection
  const { getLearningPathById } = require('@/data/learningPaths');
  const path = getLearningPathById(pathId);
  if (path) {
    const nextIndex = path.objections.findIndex(
      (id: string, index: number) => index > progress.currentStep && !progress.completedSteps.has(id)
    );
    if (nextIndex >= 0) {
      progress.currentStep = nextIndex;
    } else {
      // All steps completed
      progress.completedAt = new Date().toISOString();
    }
  }

  savePathProgress(progress);
}

/**
 * Get current objection for path
 */
export function getCurrentPathObjection(pathId: string): string | null {
  const progress = getPathProgress(pathId);
  if (!progress) return null;

  const { getLearningPathById } = require('@/data/learningPaths');
  const path = getLearningPathById(pathId);
  if (!path) return null;

  return path.objections[progress.currentStep] || null;
}

/**
 * Check if path is completed
 */
export function isPathCompleted(pathId: string): boolean {
  const progress = getPathProgress(pathId);
  if (!progress) return false;

  const { getLearningPathById } = require('@/data/learningPaths');
  const path = getLearningPathById(pathId);
  if (!path) return false;

  return path.objections.every((id: string) => progress.completedSteps.has(id));
}

/**
 * Get completion percentage for path
 */
export function getPathCompletionPercentage(pathId: string): number {
  const progress = getPathProgress(pathId);
  if (!progress) return 0;

  const { getLearningPathById } = require('@/data/learningPaths');
  const path = getLearningPathById(pathId);
  if (!path) return 0;

    const completed = path.objections.filter((id: string) => progress.completedSteps.has(id)).length;
  return Math.round((completed / path.objections.length) * 100);
}

/**
 * Get or create today's daily challenge
 */
export function getDailyChallenge(): DailyChallenge | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(DAILY_CHALLENGES_KEY);
    const today = new Date().toISOString().split('T')[0];
    
    if (stored) {
      const challenges: DailyChallenge[] = JSON.parse(stored);
      const todayChallenge = challenges.find(c => c.date === today);
      if (todayChallenge) {
        return todayChallenge;
      }
    }

    // Create new daily challenge
    const { getObjections } = require('@/lib/storage');
    const objections = getObjections();
    
    // Select 3-5 random objections for today's challenge
    const shuffled = [...objections].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(5, Math.max(3, Math.floor(Math.random() * 3) + 3)));
    
    const challenge: DailyChallenge = {
      id: `challenge-${today}`,
      date: today,
      objections: selected.map(o => o.id),
      difficulty: 'intermediate',
      theme: getDailyTheme(),
      completed: false,
    };

    // Save challenge
    const challenges: DailyChallenge[] = stored ? JSON.parse(stored) : [];
    challenges.push(challenge);
    // Keep only last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const filtered = challenges.filter(c => new Date(c.date) >= thirtyDaysAgo);
    localStorage.setItem(DAILY_CHALLENGES_KEY, JSON.stringify(filtered));

    return challenge;
  } catch (error) {
    console.error('Error getting daily challenge:', error);
    return null;
  }
}

/**
 * Mark daily challenge as completed
 */
export function completeDailyChallenge(): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(DAILY_CHALLENGES_KEY);
    if (!stored) return;

    const challenges: DailyChallenge[] = JSON.parse(stored);
    const today = new Date().toISOString().split('T')[0];
    const challenge = challenges.find(c => c.date === today);
    
    if (challenge) {
      challenge.completed = true;
      localStorage.setItem(DAILY_CHALLENGES_KEY, JSON.stringify(challenges));
    }
  } catch (error) {
    console.error('Error completing daily challenge:', error);
  }
}

/**
 * Get daily theme for challenge
 */
function getDailyTheme(): string {
  const themes = [
    'Price Objections',
    'Timing Concerns',
    'Trust Building',
    'Property Details',
    'Financial Questions',
    'Interest Level',
    'Mixed Challenge',
  ];
  const dayOfWeek = new Date().getDay();
  return themes[dayOfWeek % themes.length];
}

/**
 * Get all completed paths
 */
export function getCompletedPaths(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(LEARNING_PATH_PROGRESS_KEY);
    if (!stored) return [];

    const allProgress: LearningPathProgress[] = JSON.parse(stored);
    const { getAllLearningPaths } = require('@/data/learningPaths');
    const allPaths = getAllLearningPaths();

    return allProgress
      .filter((progress: LearningPathProgress) => {
        const path = allPaths.find((p: any) => p.id === progress.pathId);
        if (!path) return false;
        // Convert completedSteps array back to Set for checking
        const completedSet = new Set(progress.completedSteps as any);
        return path.objections.every((id: string) => completedSet.has(id));
      })
      .map((progress: LearningPathProgress) => progress.pathId);
  } catch (error) {
    console.error('Error getting completed paths:', error);
    return [];
  }
}

