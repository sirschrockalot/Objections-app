import { Objection, Response, ConfidenceRating, PracticeSession, ObjectionNote, ResponseTemplate, PracticeHistoryEntry, Comment, PointsEntry, UserLevel, CategoryMastery } from '@/types';
import { initialObjections } from '@/data/objections';
import { apiGet, apiPost, apiPut, apiDelete } from './apiClient';
import { getCurrentUserId, isAuthenticated } from './auth';
import { error as logError } from './logger';

const STORAGE_KEY = 'objections-app-data';
const CONFIDENCE_RATINGS_KEY = 'objections-app-confidence-ratings';
const PRACTICE_SESSIONS_KEY = 'objections-app-sessions';
const NOTES_KEY = 'objections-app-notes';
const TEMPLATES_KEY = 'objections-app-templates';
const PRACTICE_HISTORY_KEY = 'objections-app-practice-history';
const COMMENTS_KEY = 'objections-app-comments';
const POINTS_KEY = 'objections-app-points';

// Cache for API responses
const cache: {
  customResponses: Map<string, Response[]>;
  notes: Map<string, ObjectionNote>;
  ratings: ConfidenceRating[];
  sessions: PracticeSession[];
  history: PracticeHistoryEntry[];
  templates: ResponseTemplate[];
} = {
  customResponses: new Map(),
  notes: new Map(),
  ratings: [],
  sessions: [],
  history: [],
  templates: [],
};

// Helper to check if we should use API
function shouldUseAPI(): boolean {
  return typeof window !== 'undefined' && isAuthenticated();
}

// Load custom responses from API or localStorage
async function loadCustomResponses(objectionId?: string): Promise<Response[]> {
  if (shouldUseAPI()) {
    try {
      const data = await apiGet('/api/data/custom-responses', objectionId ? { objectionId } : {});
      return data.responses || [];
    } catch (error) {
      logError('Failed to load custom responses from API', error);
      // Fall back to localStorage
    }
  }

  // Fallback to localStorage
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const objection = parsed.find((o: Objection) => objectionId ? o.id === objectionId : true);
      return objection?.customResponses || [];
    }
  } catch (error) {
    logError('Failed to load custom responses from localStorage', error);
  }
  return [];
}

export async function getObjections(): Promise<Objection[]> {
  if (typeof window === 'undefined') {
    return initialObjections;
  }

  try {
    // Load custom responses and notes from API or localStorage in parallel
    // This makes only 2 API calls total instead of N+1 calls
    const [customResponsesData, notesData] = await Promise.all([
      shouldUseAPI()
        ? apiGet('/api/data/custom-responses').catch(() => ({ responses: [] }))
        : Promise.resolve({ responses: [] }),
      shouldUseAPI() 
        ? apiGet('/api/data/notes').catch(() => ({ notes: [] }))
        : Promise.resolve({ notes: getNotesSync() }),
    ]);

    // Group custom responses by objectionId
    const responsesByObjection = new Map<string, Response[]>();
    
    if (shouldUseAPI()) {
      // API now returns responses with objectionId included
      if (customResponsesData?.responses && Array.isArray(customResponsesData.responses)) {
        customResponsesData.responses.forEach((response: any) => {
          if (response.objectionId) {
            if (!responsesByObjection.has(response.objectionId)) {
              responsesByObjection.set(response.objectionId, []);
            }
            responsesByObjection.get(response.objectionId)!.push({
              id: response.id,
              text: response.text,
              isCustom: response.isCustom,
              createdAt: response.createdAt,
              createdBy: response.createdBy,
              upvotes: response.upvotes || 0,
              upvotedBy: response.upvotedBy || [],
            });
          }
        });
      }
    } else {
      // localStorage fallback
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.forEach((obj: Objection) => {
          responsesByObjection.set(obj.id, obj.customResponses || []);
        });
      }
    }

    // Build notes map
    const notesMap = new Map<string, string>();
    (notesData.notes || []).forEach((note: ObjectionNote) => {
      notesMap.set(note.objectionId, note.note);
    });

    return initialObjections.map(obj => ({
      ...obj,
      customResponses: responsesByObjection.get(obj.id) || [],
      personalNote: notesMap.get(obj.id),
    }));
  } catch (error) {
    logError('Failed to load objections', error);
    return initialObjections;
  }
}

// Sync version for backward compatibility
export function getObjectionsSync(): Objection[] {
  if (typeof window === 'undefined') {
    return initialObjections;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const notes = getNotesSync();
      const notesMap = new Map(notes.map(n => [n.objectionId, n.note]));
      
      return initialObjections.map(obj => {
        const storedObj = parsed.find((o: Objection) => o.id === obj.id);
        return {
          ...obj,
          customResponses: storedObj?.customResponses || [],
          personalNote: notesMap.get(obj.id) || undefined,
        };
      });
    }
  } catch (error) {
    logError('Failed to load objections from localStorage', error);
  }

  return initialObjections;
}

export async function saveCustomResponse(objectionId: string, response: Response): Promise<void> {
  if (typeof window === 'undefined') return;

  // Initialize upvotes if not present
  if (!response.upvotes) response.upvotes = 0;
  if (!response.upvotedBy) response.upvotedBy = [];

  if (shouldUseAPI()) {
    try {
      await apiPost('/api/data/custom-responses', { objectionId, response });
      return;
    } catch (error) {
      logError('Failed to save custom response to API', error);
      // Fall through to localStorage fallback
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let objections: Objection[] = stored ? JSON.parse(stored) : [];

    const objectionIndex = objections.findIndex(o => o.id === objectionId);
    
    if (objectionIndex >= 0) {
      objections[objectionIndex].customResponses.push(response);
    } else {
      const initialObj = initialObjections.find(o => o.id === objectionId);
      if (initialObj) {
        objections.push({
          ...initialObj,
          customResponses: [response],
        });
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(objections));
  } catch (error) {
    logError('Failed to save custom response', error);
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw error;
    }
  }
}

export async function upvoteResponse(objectionId: string, responseId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  if (shouldUseAPI()) {
    try {
      await apiPut('/api/data/custom-responses', { objectionId, responseId });
      return;
    } catch (error) {
      logError('Failed to upvote response via API', error);
      // Fall through to localStorage
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const objections: Objection[] = JSON.parse(stored);
    const objection = objections.find(o => o.id === objectionId);
    
    if (objection) {
      const response = objection.customResponses.find(r => r.id === responseId);
      if (response) {
        if (!response.upvotes) response.upvotes = 0;
        if (!response.upvotedBy) response.upvotedBy = [];
        
        const userId = getCurrentUserId() || 'anonymous';
        const index = response.upvotedBy.indexOf(userId);
        if (index > -1) {
          response.upvotedBy.splice(index, 1);
          response.upvotes = Math.max(0, response.upvotes - 1);
        } else {
          response.upvotedBy.push(userId);
          response.upvotes = (response.upvotes || 0) + 1;
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(objections));
      }
    }
  } catch (error) {
    logError('Failed to upvote response', error);
  }
}

export function isResponseUpvoted(objectionId: string, responseId: string): boolean {
  // This would need to be async to check API, but keeping sync for compatibility
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;

    const objections: Objection[] = JSON.parse(stored);
    const objection = objections.find(o => o.id === objectionId);
    
    if (objection) {
      const response = objection.customResponses.find(r => r.id === responseId);
      if (response && response.upvotedBy) {
        const userId = getCurrentUserId() || 'anonymous';
        return response.upvotedBy.includes(userId);
      }
    }
  } catch (error) {
    logError('Failed to check upvote status', error);
  }

  return false;
}

export function getAllObjections(): Objection[] {
  return getObjectionsSync();
}

// Confidence Rating Functions
export async function saveConfidenceRating(objectionId: string, rating: number): Promise<void> {
  if (typeof window === 'undefined') return;

  if (shouldUseAPI()) {
    try {
      await apiPost('/api/data/confidence-ratings', { objectionId, rating });
      return;
    } catch (error) {
      logError('Failed to save confidence rating to API', error);
      // Fall through
    }
  }

  // Fallback to localStorage
  try {
    const ratings = getConfidenceRatingsSync();
    const newRating: ConfidenceRating = {
      objectionId,
      rating,
      date: new Date().toISOString(),
    };
    ratings.push(newRating);
    localStorage.setItem(CONFIDENCE_RATINGS_KEY, JSON.stringify(ratings));
    invalidateStatsCache(); // Invalidate cache when rating is saved
  } catch (error) {
    logError('Failed to save confidence rating', error);
  }
}

export async function getConfidenceRatings(): Promise<ConfidenceRating[]> {
  if (typeof window === 'undefined') return [];

  if (shouldUseAPI()) {
    try {
      const data = await apiGet('/api/data/confidence-ratings');
      return data.ratings || [];
    } catch (error) {
      logError('Failed to load confidence ratings from API', error);
      // Fall through
    }
  }

  return getConfidenceRatingsSync();
}

export function getConfidenceRatingsSync(): ConfidenceRating[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CONFIDENCE_RATINGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logError('Failed to load confidence ratings', error);
    return [];
  }
}

export async function getAverageConfidenceRating(objectionId: string): Promise<number> {
  const ratings = await getConfidenceRatings();
  const objectionRatings = ratings.filter(r => r.objectionId === objectionId);
  if (objectionRatings.length === 0) return 0;
  const sum = objectionRatings.reduce((acc, r) => acc + r.rating, 0);
  return sum / objectionRatings.length;
}

export async function getLatestConfidenceRating(objectionId: string): Promise<number | null> {
  const ratings = await getConfidenceRatings();
  const objectionRatings = ratings.filter(r => r.objectionId === objectionId);
  if (objectionRatings.length === 0) return null;
  const sorted = objectionRatings.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return sorted[0].rating;
}

export function getLatestConfidenceRatingSync(objectionId: string): number | null {
  const ratings = getConfidenceRatingsSync();
  const objectionRatings = ratings.filter(r => r.objectionId === objectionId);
  if (objectionRatings.length === 0) return null;
  const sorted = objectionRatings.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  return sorted[0].rating;
}

export async function getObjectionsNeedingPractice(threshold: number = 3): Promise<string[]> {
  const ratings = await getConfidenceRatings();
  const objectionRatings = new Map<string, number[]>();
  
  ratings.forEach(rating => {
    if (!objectionRatings.has(rating.objectionId)) {
      objectionRatings.set(rating.objectionId, []);
    }
    objectionRatings.get(rating.objectionId)!.push(rating.rating);
  });
  
  const needsPractice: string[] = [];
  objectionRatings.forEach((ratings, objectionId) => {
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    if (avg < threshold) {
      needsPractice.push(objectionId);
    }
  });
  
  return needsPractice;
}

// Practice Session Functions
export async function savePracticeSession(session: PracticeSession): Promise<void> {
  if (typeof window === 'undefined') return;

  if (shouldUseAPI()) {
    try {
      await apiPost('/api/data/practice-sessions', { session });
      invalidateStatsCache(); // Invalidate cache when new session is saved
      return;
    } catch (error) {
      logError('Failed to save practice session to API', error);
      // Fall through
    }
  }

  // Fallback to localStorage
  try {
    const sessions = getPracticeSessionsSync();
    sessions.push(session);
    localStorage.setItem(PRACTICE_SESSIONS_KEY, JSON.stringify(sessions));
    invalidateStatsCache(); // Invalidate cache when new session is saved
  } catch (error) {
    logError('Failed to save practice session', error);
  }
}

export async function getPracticeSessions(): Promise<PracticeSession[]> {
  if (typeof window === 'undefined') return [];

  if (shouldUseAPI()) {
    try {
      const data = await apiGet('/api/data/practice-sessions');
      return data.sessions || [];
    } catch (error) {
      logError('Failed to load practice sessions from API', error);
      // Fall through
    }
  }

  return getPracticeSessionsSync();
}

export function getPracticeSessionsSync(): PracticeSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(PRACTICE_SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logError('Failed to load practice sessions', error);
    return [];
  }
}

// Combined stats endpoint - fetches all stats in one API call
let cachedStats: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5000; // 5 seconds

export async function getAllStats(): Promise<{
  totalSessions: number;
  totalObjectionsPracticed: number;
  streak: number;
  categoryStats: Record<string, { practiced: number; total: number }>;
  totalObjections: number;
  totalPoints: number;
  userLevel: {
    level: number;
    levelName: string;
    totalPoints: number;
    pointsToNextLevel: number;
    currentLevelPoints: number;
  };
  spacedRepetition: {
    totalScheduled: number;
    dueForReview: number;
    upcomingThisWeek: number;
    averageInterval: number;
    averageEaseFactor: number;
  };
  categoryMastery: Array<{
    category: string;
    masteryLevel: number;
    objectionsPracticed: number;
    totalObjections: number;
    averageConfidence: number;
    badgeEarned: string | null;
  }>;
  recentPoints: number;
}> {
  // Return cached stats if available and fresh
  if (cachedStats && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedStats;
  }

  if (typeof window === 'undefined') {
    return {
      totalSessions: 0,
      totalObjectionsPracticed: 0,
      streak: 0,
      categoryStats: {},
      totalObjections: 0,
      totalPoints: 0,
      userLevel: {
        level: 1,
        levelName: 'Beginner',
        totalPoints: 0,
        pointsToNextLevel: 100,
        currentLevelPoints: 0,
      },
      spacedRepetition: {
        totalScheduled: 0,
        dueForReview: 0,
        upcomingThisWeek: 0,
        averageInterval: 0,
        averageEaseFactor: 0,
      },
      categoryMastery: [],
      recentPoints: 0,
    };
  }

  if (shouldUseAPI()) {
    try {
      const data = await apiGet('/api/data/stats');
      // Cache the result
      cachedStats = data;
      cacheTimestamp = Date.now();
      return data;
    } catch (error) {
      logError('Failed to load stats from API', error);
      // Fall through to individual calls
    }
  }

  // Fallback to individual calls (for localStorage or error cases)
  const [totalSessions, totalObjectionsPracticed, streak, categoryStats] = await Promise.all([
    getTotalSessions(),
    getTotalObjectionsPracticed(),
    getPracticeStreak(),
    getCategoryStats(),
  ]);

  const fallbackStats = {
    totalSessions,
    totalObjectionsPracticed,
    streak,
    categoryStats,
    totalObjections: initialObjections.length,
    totalPoints: 0,
    userLevel: {
      level: 1,
      levelName: 'Beginner',
      totalPoints: 0,
      pointsToNextLevel: 100,
      currentLevelPoints: 0,
    },
    spacedRepetition: {
      totalScheduled: 0,
      dueForReview: 0,
      upcomingThisWeek: 0,
      averageInterval: 0,
      averageEaseFactor: 0,
    },
    categoryMastery: [],
    recentPoints: 0,
  };

  // Cache fallback result too
  cachedStats = fallbackStats;
  cacheTimestamp = Date.now();
  return fallbackStats;
}

// Function to invalidate cache (call after data changes)
export function invalidateStatsCache(): void {
  cachedStats = null;
  cacheTimestamp = 0;
}

// Keep individual functions for backward compatibility, but they use cached data when possible
export async function getTotalSessions(): Promise<number> {
  if (cachedStats && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedStats.totalSessions;
  }
  const sessions = await getPracticeSessions();
  return sessions.length;
}

export async function getTotalObjectionsPracticed(): Promise<number> {
  if (cachedStats && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedStats.totalObjectionsPracticed;
  }
  const sessions = await getPracticeSessions();
  const allObjections = new Set<string>();
  sessions.forEach(session => {
    session.objectionsPracticed.forEach(id => allObjections.add(id));
  });
  return allObjections.size;
}

export async function getPracticeStreak(): Promise<number> {
  if (cachedStats && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedStats.streak;
  }
  const sessions = await getPracticeSessions();
  if (sessions.length === 0) return 0;
  
  const sorted = sessions.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  const sessionsByDate = new Map<string, PracticeSession[]>();
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
  
  return streak;
}

export async function getCategoryStats(): Promise<Record<string, { practiced: number; total: number }>> {
  if (cachedStats && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedStats.categoryStats;
  }
  const [sessions, objections] = await Promise.all([
    getPracticeSessions(),
    getObjections(),
  ]);
  
  const categoryStats: Record<string, { practiced: Set<string>; total: number }> = {};
  
  objections.forEach(obj => {
    if (!categoryStats[obj.category]) {
      categoryStats[obj.category] = { practiced: new Set(), total: 0 };
    }
    categoryStats[obj.category].total++;
  });
  
  const allPracticed = new Set<string>();
  sessions.forEach(session => {
    session.objectionsPracticed.forEach(id => allPracticed.add(id));
  });
  
  allPracticed.forEach(id => {
    const objection = objections.find(o => o.id === id);
    if (objection && categoryStats[objection.category]) {
      categoryStats[objection.category].practiced.add(id);
    }
  });
  
  const result: Record<string, { practiced: number; total: number }> = {};
  Object.keys(categoryStats).forEach(category => {
    result[category] = {
      practiced: categoryStats[category].practiced.size,
      total: categoryStats[category].total,
    };
  });
  
  return result;
}

// Notes Functions
export async function saveNote(objectionId: string, note: string): Promise<void> {
  if (typeof window === 'undefined') return;

  if (shouldUseAPI()) {
    try {
      await apiPost('/api/data/notes', { objectionId, note });
      return;
    } catch (error) {
      logError('Failed to save note to API', error);
      // Fall through
    }
  }

  // Fallback to localStorage
  try {
    const notes = getNotesSync();
    const existingIndex = notes.findIndex(n => n.objectionId === objectionId);
    
    const noteData: ObjectionNote = {
      objectionId,
      note,
      createdAt: existingIndex >= 0 ? notes[existingIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      notes[existingIndex] = noteData;
    } else {
      notes.push(noteData);
    }

    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch (error) {
    logError('Failed to save note', error);
  }
}

export async function getNotes(): Promise<ObjectionNote[]> {
  if (typeof window === 'undefined') return [];

  if (shouldUseAPI()) {
    try {
      const data = await apiGet('/api/data/notes');
      return data.notes || [];
    } catch (error) {
      logError('Failed to load notes from API', error);
      // Fall through
    }
  }

  return getNotesSync();
}

export function getNotesSync(): ObjectionNote[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(NOTES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logError('Failed to load notes', error);
    return [];
  }
}

export async function getNote(objectionId: string): Promise<string | null> {
  const notes = await getNotes();
  const note = notes.find(n => n.objectionId === objectionId);
  return note ? note.note : null;
}

export async function deleteNote(objectionId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  if (shouldUseAPI()) {
    try {
      await apiDelete('/api/data/notes', { objectionId });
      return;
    } catch (error) {
      logError('Failed to delete note via API', error);
      // Fall through
    }
  }

  // Fallback to localStorage
  try {
    const notes = getNotesSync();
    const filtered = notes.filter(n => n.objectionId !== objectionId);
    localStorage.setItem(NOTES_KEY, JSON.stringify(filtered));
  } catch (error) {
    logError('Failed to delete note', error);
  }
}

// Response Template Functions
export async function saveTemplate(template: ResponseTemplate): Promise<void> {
  if (typeof window === 'undefined') return;

  if (shouldUseAPI()) {
    try {
      await apiPost('/api/data/templates', { template });
      return;
    } catch (error) {
      logError('Failed to save template to API', error);
      // Fall through
    }
  }

  // Fallback to localStorage
  try {
    const templates = getTemplatesSync();
    const existingIndex = templates.findIndex(t => t.id === template.id);
    
    if (existingIndex >= 0) {
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }

    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch (error) {
    logError('Failed to save template', error);
  }
}

export async function getTemplates(): Promise<ResponseTemplate[]> {
  if (typeof window === 'undefined') return [];

  if (shouldUseAPI()) {
    try {
      const data = await apiGet('/api/data/templates');
      return data.templates || [];
    } catch (error) {
      logError('Failed to load templates from API', error);
      // Fall through
    }
  }

  return getTemplatesSync();
}

export function getTemplatesSync(): ResponseTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logError('Failed to load templates', error);
    return [];
  }
}

export async function deleteTemplate(templateId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  if (shouldUseAPI()) {
    try {
      await apiDelete('/api/data/templates', { templateId });
      return;
    } catch (error) {
      logError('Failed to delete template via API', error);
      // Fall through
    }
  }

  // Fallback to localStorage
  try {
    const templates = getTemplatesSync();
    const filtered = templates.filter(t => t.id !== templateId);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
  } catch (error) {
    logError('Failed to delete template', error);
  }
}

export function getDefaultTemplate(): ResponseTemplate {
  return {
    id: 'default',
    name: 'Default Framework',
    acknowledge: 'Acknowledge the buyer\'s concern with empathy',
    reframe: 'Reframe the objection to show a different perspective',
    value: 'Highlight the value or benefit to the buyer',
    nextStep: 'End with a clear next step or call to action',
    createdAt: new Date().toISOString(),
  };
}

// Practice History Functions
export async function recordPracticeHistory(objectionId: string, sessionId: string, confidenceRating?: number): Promise<void> {
  if (typeof window === 'undefined') return;

  if (shouldUseAPI()) {
    try {
      await apiPost('/api/data/practice-history', { objectionId, sessionId, confidenceRating });
      return;
    } catch (error) {
      logError('Failed to record practice history to API', error);
      // Fall through
    }
  }

  // Fallback to localStorage
  try {
    const history = getPracticeHistorySync();
    const today = new Date().toISOString().split('T')[0];
    
    const existingIndex = history.findIndex(
      entry => entry.objectionId === objectionId && entry.date === today
    );

    if (existingIndex >= 0) {
      history[existingIndex].timesPracticed += 1;
      if (confidenceRating) {
        history[existingIndex].confidenceRating = confidenceRating;
      }
    } else {
      const allHistoryForObjection = history.filter(e => e.objectionId === objectionId);
      const newEntry: PracticeHistoryEntry = {
        objectionId,
        date: today,
        sessionId,
        confidenceRating,
        timesPracticed: allHistoryForObjection.length + 1,
      };
      history.push(newEntry);
    }

    localStorage.setItem(PRACTICE_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    logError('Failed to record practice history', error);
  }
}

export async function getPracticeHistory(): Promise<PracticeHistoryEntry[]> {
  if (typeof window === 'undefined') return [];

  if (shouldUseAPI()) {
    try {
      const data = await apiGet('/api/data/practice-history');
      return data.history || [];
    } catch (error) {
      logError('Failed to load practice history from API', error);
      // Fall through
    }
  }

  return getPracticeHistorySync();
}

export function getPracticeHistorySync(): PracticeHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(PRACTICE_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logError('Failed to load practice history', error);
    return [];
  }
}

export async function getObjectionPracticeHistory(objectionId: string): Promise<PracticeHistoryEntry[]> {
  const history = await getPracticeHistory();
  return history
    .filter(entry => entry.objectionId === objectionId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function getAllPracticedObjections(): Promise<string[]> {
  const history = await getPracticeHistory();
  const uniqueIds = new Set(history.map(entry => entry.objectionId));
  return Array.from(uniqueIds);
}

export async function getObjectionPracticeCount(objectionId: string): Promise<number> {
  const history = await getPracticeHistory();
  return history.filter(entry => entry.objectionId === objectionId).length;
}

export async function getObjectionFirstPracticedDate(objectionId: string): Promise<string | null> {
  const history = await getObjectionPracticeHistory(objectionId);
  return history.length > 0 ? history[0].date : null;
}

export async function getObjectionLastPracticedDate(objectionId: string): Promise<string | null> {
  const history = await getObjectionPracticeHistory(objectionId);
  return history.length > 0 ? history[history.length - 1].date : null;
}

export async function getConfidenceImprovement(objectionId: string): Promise<{ trend: 'improving' | 'declining' | 'stable'; average: number } | null> {
  const history = await getObjectionPracticeHistory(objectionId);
  const withRatings = history.filter(entry => entry.confidenceRating !== undefined);
  
  if (withRatings.length < 2) return null;

  const ratings = withRatings.map(entry => entry.confidenceRating!);
  const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  
  const midpoint = Math.floor(ratings.length / 2);
  const firstHalf = ratings.slice(0, midpoint);
  const secondHalf = ratings.slice(midpoint);
  
  const firstAvg = firstHalf.reduce((sum, r) => sum + r, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, r) => sum + r, 0) / secondHalf.length;
  
  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (secondAvg > firstAvg + 0.3) trend = 'improving';
  else if (secondAvg < firstAvg - 0.3) trend = 'declining';

  return { trend, average };
}

export async function getPracticeHistoryByDateRange(startDate: string, endDate: string): Promise<PracticeHistoryEntry[]> {
  const history = await getPracticeHistory();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  return history.filter(entry => {
    const entryDate = new Date(entry.date).getTime();
    return entryDate >= start && entryDate <= end;
  });
}
