import { LearningPathProgress, DailyChallenge } from '@/types';
import { apiGet, apiPost } from './apiClient';
import { getCurrentUserId, isAuthenticated } from './auth';
import { getObjections, getObjectionsSync } from './storage';
import { getLearningPathById, getAllLearningPaths } from '@/data/learningPaths';
import { error as logError } from './logger';

const LEARNING_PATH_PROGRESS_KEY = 'objections-app-learning-path-progress';
const DAILY_CHALLENGES_KEY = 'objections-app-daily-challenges';

function shouldUseAPI(): boolean {
  return typeof window !== 'undefined' && isAuthenticated();
}

/**
 * Get progress for a learning path
 */
export async function getPathProgress(pathId: string): Promise<LearningPathProgress | null> {
  if (typeof window === 'undefined') return null;

  if (shouldUseAPI()) {
    try {
      const data = await apiGet('/api/data/learning-paths', { pathId });
      if (data.progress && data.progress.length > 0) {
        const progress = data.progress[0];
        return {
          ...progress,
          completedSteps: new Set(progress.completedSteps),
        };
      }
      return null;
    } catch (error) {
      logError('Failed to get path progress from API', error);
      // Fall through
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(LEARNING_PATH_PROGRESS_KEY);
    if (!stored) return null;

    const allProgress: LearningPathProgress[] = JSON.parse(stored);
    const progress = allProgress.find(p => p.pathId === pathId);
    
    if (!progress) return null;

    return {
      ...progress,
      completedSteps: new Set(progress.completedSteps as any),
    };
  } catch (error) {
    logError('Failed to get path progress', error);
    return null;
  }
}

/**
 * Save progress for a learning path
 */
export async function savePathProgress(progress: LearningPathProgress): Promise<void> {
  if (typeof window === 'undefined') return;

  if (shouldUseAPI()) {
    try {
      await apiPost('/api/data/learning-paths', {
        progress: {
          ...progress,
          completedSteps: Array.from(progress.completedSteps),
        },
      });
      return;
    } catch (error) {
      logError('Failed to save path progress to API', error);
      // Fall through
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(LEARNING_PATH_PROGRESS_KEY);
    const allProgress: LearningPathProgress[] = stored ? JSON.parse(stored) : [];

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
    logError('Failed to save path progress', error);
  }
}

/**
 * Initialize or update path progress
 */
export async function startLearningPath(pathId: string): Promise<LearningPathProgress> {
  const existing = await getPathProgress(pathId);
  
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

  await savePathProgress(newProgress);
  return newProgress;
}

/**
 * Mark objection as completed in path
 */
export async function completePathStep(pathId: string, objectionId: string): Promise<void> {
  const progress = await getPathProgress(pathId);
  if (!progress) return;

  progress.completedSteps.add(objectionId);
  progress.lastPracticedAt = new Date().toISOString();
  
  const path = getLearningPathById(pathId);
  if (path) {
    const nextIndex = path.objections.findIndex(
      (id: string, index: number) => index > progress.currentStep && !progress.completedSteps.has(id)
    );
    if (nextIndex >= 0) {
      progress.currentStep = nextIndex;
    } else {
      progress.completedAt = new Date().toISOString();
    }
  }

  await savePathProgress(progress);
}

/**
 * Get current objection for path
 */
export async function getCurrentPathObjection(pathId: string): Promise<string | null> {
  const progress = await getPathProgress(pathId);
  if (!progress) return null;

  const path = getLearningPathById(pathId);
  if (!path) return null;

  return path.objections[progress.currentStep] || null;
}

/**
 * Check if path is completed
 */
export async function isPathCompleted(pathId: string): Promise<boolean> {
  const progress = await getPathProgress(pathId);
  if (!progress) return false;

  const path = getLearningPathById(pathId);
  if (!path) return false;

  return path.objections.every((id: string) => progress.completedSteps.has(id));
}

/**
 * Get completion percentage for path
 */
export async function getPathCompletionPercentage(pathId: string): Promise<number> {
  const progress = await getPathProgress(pathId);
  if (!progress) return 0;

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

    // Create new daily challenge - this still uses localStorage for now
    const objections = getObjectionsSync();
    
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

    const challenges: DailyChallenge[] = stored ? JSON.parse(stored) : [];
    challenges.push(challenge);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const filtered = challenges.filter(c => new Date(c.date) >= thirtyDaysAgo);
    localStorage.setItem(DAILY_CHALLENGES_KEY, JSON.stringify(filtered));

    return challenge;
  } catch (error) {
    logError('Failed to get daily challenge', error);
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
    logError('Failed to complete daily challenge', error);
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
export async function getCompletedPaths(): Promise<string[]> {
  if (typeof window === 'undefined') return [];

  if (shouldUseAPI()) {
    try {
      const data = await apiGet('/api/data/learning-paths');
      const allPaths = getAllLearningPaths();

      return (data.progress || [])
        .filter((progress: any) => {
          const path = allPaths.find((p: any) => p.id === progress.pathId);
          if (!path) return false;
          const completedSet = new Set(progress.completedSteps);
          return path.objections.every((id: string) => completedSet.has(id));
        })
        .map((progress: any) => progress.pathId);
    } catch (error) {
      logError('Failed to get completed paths from API', error);
      // Fall through
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(LEARNING_PATH_PROGRESS_KEY);
    if (!stored) return [];

    const allProgress: LearningPathProgress[] = JSON.parse(stored);
    const allPaths = getAllLearningPaths();

    return allProgress
      .filter((progress: LearningPathProgress) => {
        const path = allPaths.find((p: any) => p.id === progress.pathId);
        if (!path) return false;
        const completedSet = new Set(progress.completedSteps as any);
        return path.objections.every((id: string) => completedSet.has(id));
      })
      .map((progress: LearningPathProgress) => progress.pathId);
  } catch (error) {
    logError('Failed to get completed paths', error);
    return [];
  }
}

// Helper function for getDailyChallenge - uses imported getObjectionsSync
