import { Objection, Response, ConfidenceRating, PracticeSession, ObjectionNote, ResponseTemplate, PracticeHistoryEntry, Comment, PointsEntry, UserLevel, CategoryMastery } from '@/types';
import { initialObjections } from '@/data/objections';

const STORAGE_KEY = 'objections-app-data';
const CONFIDENCE_RATINGS_KEY = 'objections-app-confidence-ratings';
const PRACTICE_SESSIONS_KEY = 'objections-app-sessions';
const NOTES_KEY = 'objections-app-notes';
const TEMPLATES_KEY = 'objections-app-templates';
const PRACTICE_HISTORY_KEY = 'objections-app-practice-history';
const COMMENTS_KEY = 'objections-app-comments';
const POINTS_KEY = 'objections-app-points';
const USER_ID_KEY = 'objections-app-user-id';

export function getObjections(): Objection[] {
  if (typeof window === 'undefined') {
    return initialObjections;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge custom responses with initial objections, preserving category and difficulty
      // Load notes
      const notes = getNotes();
      const notesMap = new Map(notes.map(n => [n.objectionId, n.note]));
      
      return initialObjections.map(obj => {
        const storedObj = parsed.find((o: Objection) => o.id === obj.id);
        return {
          ...obj,
          category: obj.category, // Ensure category is preserved
          difficulty: obj.difficulty, // Ensure difficulty is preserved
          customResponses: storedObj?.customResponses || [],
          personalNote: notesMap.get(obj.id) || undefined,
        };
      });
    }
  } catch (error) {
    console.error('Error loading objections:', error);
  }

  return initialObjections;
}

export function saveCustomResponse(objectionId: string, response: Response): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let objections: Objection[] = stored ? JSON.parse(stored) : [];

    // Initialize upvotes if not present
    if (!response.upvotes) {
      response.upvotes = 0;
    }
    if (!response.upvotedBy) {
      response.upvotedBy = [];
    }

    const objectionIndex = objections.findIndex(o => o.id === objectionId);
    
    if (objectionIndex >= 0) {
      objections[objectionIndex].customResponses.push(response);
    } else {
      // Find the objection in initial data and add custom response
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
    console.error('Error saving custom response:', error);
    // Re-throw to allow error recovery dialog to handle it
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw error;
    }
  }
}

export function upvoteResponse(objectionId: string, responseId: string): void {
  if (typeof window === 'undefined') return;

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
        
        // Simple user ID (in a real app, this would be from auth)
        const userId = `user-${localStorage.getItem('user-id') || 'anonymous'}`;
        
        // Toggle upvote
        const index = response.upvotedBy.indexOf(userId);
        if (index > -1) {
          // Remove upvote
          response.upvotedBy.splice(index, 1);
          response.upvotes = Math.max(0, response.upvotes - 1);
        } else {
          // Add upvote
          response.upvotedBy.push(userId);
          response.upvotes = (response.upvotes || 0) + 1;
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(objections));
      }
    }
  } catch (error) {
    console.error('Error upvoting response:', error);
  }
}

export function isResponseUpvoted(objectionId: string, responseId: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;

    const objections: Objection[] = JSON.parse(stored);
    const objection = objections.find(o => o.id === objectionId);
    
    if (objection) {
      const response = objection.customResponses.find(r => r.id === responseId);
      if (response && response.upvotedBy) {
        const userId = `user-${localStorage.getItem('user-id') || 'anonymous'}`;
        return response.upvotedBy.includes(userId);
      }
    }
  } catch (error) {
    console.error('Error checking upvote status:', error);
  }

  return false;
}

export function getAllObjections(): Objection[] {
  return getObjections();
}

// Confidence Rating Functions
export function saveConfidenceRating(objectionId: string, rating: number): void {
  if (typeof window === 'undefined') return;

  try {
    const ratings = getConfidenceRatings();
    const newRating: ConfidenceRating = {
      objectionId,
      rating,
      date: new Date().toISOString(),
    };
    
    // Add new rating (keep history)
    ratings.push(newRating);
    localStorage.setItem(CONFIDENCE_RATINGS_KEY, JSON.stringify(ratings));
  } catch (error) {
    console.error('Error saving confidence rating:', error);
  }
}

export function getConfidenceRatings(): ConfidenceRating[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(CONFIDENCE_RATINGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading confidence ratings:', error);
    return [];
  }
}

export function getAverageConfidenceRating(objectionId: string): number {
  const ratings = getConfidenceRatings();
  const objectionRatings = ratings.filter(r => r.objectionId === objectionId);
  
  if (objectionRatings.length === 0) return 0;
  
  const sum = objectionRatings.reduce((acc, r) => acc + r.rating, 0);
  return sum / objectionRatings.length;
}

export function getLatestConfidenceRating(objectionId: string): number | null {
  const ratings = getConfidenceRatings();
  const objectionRatings = ratings.filter(r => r.objectionId === objectionId);
  
  if (objectionRatings.length === 0) return null;
  
  // Sort by date descending and get most recent
  const sorted = objectionRatings.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  return sorted[0].rating;
}

export function getObjectionsNeedingPractice(threshold: number = 3): string[] {
  const ratings = getConfidenceRatings();
  const objectionRatings = new Map<string, number[]>();
  
  // Group ratings by objection
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
export function savePracticeSession(session: PracticeSession): void {
  if (typeof window === 'undefined') return;

  try {
    const sessions = getPracticeSessions();
    sessions.push(session);
    localStorage.setItem(PRACTICE_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving practice session:', error);
  }
}

export function getPracticeSessions(): PracticeSession[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(PRACTICE_SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading practice sessions:', error);
    return [];
  }
}

export function getTotalSessions(): number {
  return getPracticeSessions().length;
}

export function getTotalObjectionsPracticed(): number {
  const sessions = getPracticeSessions();
  const allObjections = new Set<string>();
  
  sessions.forEach(session => {
    session.objectionsPracticed.forEach(id => allObjections.add(id));
  });
  
  return allObjections.size;
}

export function getPracticeStreak(): number {
  const sessions = getPracticeSessions();
  if (sessions.length === 0) return 0;
  
  // Sort sessions by date descending
  const sorted = sessions.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  // Group sessions by date
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
  
  // Check consecutive days
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

export function getCategoryStats(): Record<string, { practiced: number; total: number }> {
  const sessions = getPracticeSessions();
  const objections = getObjections();
  const categoryStats: Record<string, { practiced: Set<string>; total: number }> = {};
  
  // Initialize categories
  objections.forEach(obj => {
    if (!categoryStats[obj.category]) {
      categoryStats[obj.category] = { practiced: new Set(), total: 0 };
    }
    categoryStats[obj.category].total++;
  });
  
  // Count practiced objections by category
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
  
  // Convert Set to number
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
export function saveNote(objectionId: string, note: string): void {
  if (typeof window === 'undefined') return;

  try {
    const notes = getNotes();
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
    console.error('Error saving note:', error);
  }
}

export function getNotes(): ObjectionNote[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(NOTES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading notes:', error);
    return [];
  }
}

export function getNote(objectionId: string): string | null {
  const notes = getNotes();
  const note = notes.find(n => n.objectionId === objectionId);
  return note ? note.note : null;
}

export function deleteNote(objectionId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const notes = getNotes();
    const filtered = notes.filter(n => n.objectionId !== objectionId);
    localStorage.setItem(NOTES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting note:', error);
  }
}

// Response Template Functions
export function saveTemplate(template: ResponseTemplate): void {
  if (typeof window === 'undefined') return;

  try {
    const templates = getTemplates();
    const existingIndex = templates.findIndex(t => t.id === template.id);
    
    if (existingIndex >= 0) {
      templates[existingIndex] = template;
    } else {
      templates.push(template);
    }

    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving template:', error);
  }
}

export function getTemplates(): ResponseTemplate[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading templates:', error);
    return [];
  }
}

export function deleteTemplate(templateId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const templates = getTemplates();
    const filtered = templates.filter(t => t.id !== templateId);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting template:', error);
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
export function recordPracticeHistory(objectionId: string, sessionId: string, confidenceRating?: number): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getPracticeHistory();
    const today = new Date().toISOString().split('T')[0];
    
    // Find existing entry for today
    const existingIndex = history.findIndex(
      entry => entry.objectionId === objectionId && entry.date === today
    );

    if (existingIndex >= 0) {
      // Update existing entry
      history[existingIndex].timesPracticed += 1;
      if (confidenceRating) {
        history[existingIndex].confidenceRating = confidenceRating;
      }
    } else {
      // Create new entry
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
    console.error('Error recording practice history:', error);
  }
}

export function getPracticeHistory(): PracticeHistoryEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(PRACTICE_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading practice history:', error);
    return [];
  }
}

export function getObjectionPracticeHistory(objectionId: string): PracticeHistoryEntry[] {
  const history = getPracticeHistory();
  return history
    .filter(entry => entry.objectionId === objectionId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export function getAllPracticedObjections(): string[] {
  const history = getPracticeHistory();
  const uniqueIds = new Set(history.map(entry => entry.objectionId));
  return Array.from(uniqueIds);
}

export function getObjectionPracticeCount(objectionId: string): number {
  const history = getPracticeHistory();
  return history.filter(entry => entry.objectionId === objectionId).length;
}

export function getObjectionFirstPracticedDate(objectionId: string): string | null {
  const history = getObjectionPracticeHistory(objectionId);
  return history.length > 0 ? history[0].date : null;
}

export function getObjectionLastPracticedDate(objectionId: string): string | null {
  const history = getObjectionPracticeHistory(objectionId);
  return history.length > 0 ? history[history.length - 1].date : null;
}

export function getConfidenceImprovement(objectionId: string): { trend: 'improving' | 'declining' | 'stable'; average: number } | null {
  const history = getObjectionPracticeHistory(objectionId);
  const withRatings = history.filter(entry => entry.confidenceRating !== undefined);
  
  if (withRatings.length < 2) return null;

  const ratings = withRatings.map(entry => entry.confidenceRating!);
  const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  
  // Compare first half vs second half
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

export function getPracticeHistoryByDateRange(startDate: string, endDate: string): PracticeHistoryEntry[] {
  const history = getPracticeHistory();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  
  return history.filter(entry => {
    const entryDate = new Date(entry.date).getTime();
    return entryDate >= start && entryDate <= end;
  });
}

