import { Objection, Response, PracticeSession, ConfidenceRating, ObjectionNote, ResponseTemplate, PracticeHistoryEntry, Comment } from '@/types';
import { getObjections, getConfidenceRatings, getPracticeSessions, getNotes, getPracticeHistory, getTemplates } from './storage';
import { getTotalPoints, getPointsHistory } from './gamification';
import { getAllReviewSchedules } from './spacedRepetition';

export interface ExportData {
  version: string;
  exportDate: string;
  objections: Objection[];
  customResponses: Array<{ objectionId: string; response: Response }>;
  confidenceRatings: ConfidenceRating[];
  practiceSessions: PracticeSession[];
  notes: ObjectionNote[];
  responseTemplates: ResponseTemplate[];
  practiceHistory: PracticeHistoryEntry[];
  comments: Comment[];
  points: {
    total: number;
    history: any[];
  };
  reviewSchedules: any[];
}

/**
 * Get all comments from localStorage
 */
function getAllComments(): Comment[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem('objections-app-comments');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading all comments:', error);
    return [];
  }
}

/**
 * Export all app data as JSON
 */
export async function exportAllData(): Promise<ExportData> {
  if (typeof window === 'undefined') {
    throw new Error('Export only available in browser');
  }

  const objections = await getObjections();
  const customResponses: Array<{ objectionId: string; response: Response }> = [];
  
  objections.forEach(obj => {
    obj.customResponses.forEach(resp => {
      customResponses.push({ objectionId: obj.id, response: resp });
    });
  });

  const data: ExportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    objections: objections.map(obj => ({
      ...obj,
      customResponses: [], // Exclude custom responses from main array (they're in separate array)
    })),
    customResponses,
    confidenceRatings: await getConfidenceRatings(),
    practiceSessions: await getPracticeSessions(),
    notes: await getNotes(),
    responseTemplates: await getTemplates(),
    practiceHistory: await getPracticeHistory(),
    comments: await getAllComments(),
    points: {
      total: await getTotalPoints(),
      history: await getPointsHistory(),
    },
    reviewSchedules: await getAllReviewSchedules(),
  };

  return data;
}

/**
 * Export data as JSON file
 */
export function downloadJSON(data: ExportData, filename: string = 'objections-app-backup.json'): void {
  if (typeof window === 'undefined') return;

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export custom responses as CSV
 */
export async function exportCustomResponsesCSV(): Promise<string> {
  const objections = await getObjections();
  const rows: string[][] = [
    ['Objection ID', 'Objection Text', 'Category', 'Response ID', 'Response Text', 'Created At', 'Upvotes'],
  ];

  objections.forEach(obj => {
    obj.customResponses.forEach(resp => {
      rows.push([
        obj.id,
        `"${obj.text.replace(/"/g, '""')}"`,
        obj.category,
        resp.id,
        `"${resp.text.replace(/"/g, '""')}"`,
        resp.createdAt || '',
        (resp.upvotes || 0).toString(),
      ]);
    });
  });

  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Export practice sessions as CSV
 */
export async function exportPracticeSessionsCSV(): Promise<string> {
  const sessions = await getPracticeSessions();
  const rows: string[][] = [
    ['Session ID', 'Date', 'Duration (seconds)', 'Objections Practiced', 'Challenge Mode', 'Time Limit', 'Goal'],
  ];

  sessions.forEach(session => {
    rows.push([
      session.id,
      session.date,
      session.duration.toString(),
      session.objectionsPracticed.join('; '),
      session.challengeMode ? 'Yes' : 'No',
      session.timeLimit?.toString() || '',
      session.goal?.toString() || '',
    ]);
  });

  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Export confidence ratings as CSV
 */
export async function exportConfidenceRatingsCSV(): Promise<string> {
  const [ratings, objections] = await Promise.all([
    getConfidenceRatings(),
    getObjections(),
  ]);
  const rows: string[][] = [
    ['Objection ID', 'Objection Text', 'Category', 'Rating', 'Date'],
  ];

  ratings.forEach(rating => {
    const objection = objections.find(o => o.id === rating.objectionId);
    rows.push([
      rating.objectionId,
      objection ? `"${objection.text.replace(/"/g, '""')}"` : '',
      objection?.category || '',
      rating.rating.toString(),
      rating.date,
    ]);
  });

  return rows.map(row => row.join(',')).join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  if (typeof window === 'undefined') return;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Import data from JSON file
 */
export function importData(jsonData: ExportData, options: {
  importObjections?: boolean;
  importCustomResponses?: boolean;
  importRatings?: boolean;
  importSessions?: boolean;
  importNotes?: boolean;
  importTemplates?: boolean;
  importComments?: boolean;
  importPoints?: boolean;
  importReviewSchedules?: boolean;
  importPracticeHistory?: boolean;
} = {}): {
  success: boolean;
  errors: string[];
  imported: {
    objections: number;
    customResponses: number;
    ratings: number;
    sessions: number;
    notes: number;
    templates: number;
    comments: number;
    reviewSchedules: number;
    practiceHistory: number;
  };
} {
  if (typeof window === 'undefined') {
    throw new Error('Import only available in browser');
  }

  const errors: string[] = [];
  const imported = {
    objections: 0,
    customResponses: 0,
    ratings: 0,
    sessions: 0,
    notes: 0,
    templates: 0,
    comments: 0,
    reviewSchedules: 0,
    practiceHistory: 0,
  };

  // Validate version
  if (!jsonData.version) {
    errors.push('Invalid export file: missing version');
    return { success: false, errors, imported };
  }

  try {
    // Import objections (if enabled)
    if (options.importObjections !== false && jsonData.objections) {
      // This would need to merge with existing objections
      // For now, we'll just count them
      imported.objections = jsonData.objections.length;
    }

    // Import custom responses
    if (options.importCustomResponses !== false && jsonData.customResponses) {
      const { saveCustomResponse } = require('./storage');
      jsonData.customResponses.forEach(({ objectionId, response }) => {
        try {
          saveCustomResponse(objectionId, response);
          imported.customResponses++;
        } catch (error) {
          errors.push(`Failed to import response ${response.id}: ${error}`);
        }
      });
    }

    // Import confidence ratings
    if (options.importRatings !== false && jsonData.confidenceRatings) {
      const { saveConfidenceRating } = require('./storage');
      jsonData.confidenceRatings.forEach(rating => {
        try {
          saveConfidenceRating(rating.objectionId, rating.rating);
          imported.ratings++;
        } catch (error) {
          errors.push(`Failed to import rating for ${rating.objectionId}: ${error}`);
        }
      });
    }

    // Import practice sessions
    if (options.importSessions !== false && jsonData.practiceSessions) {
      const { savePracticeSession } = require('./storage');
      jsonData.practiceSessions.forEach(session => {
        try {
          savePracticeSession(session);
          imported.sessions++;
        } catch (error) {
          errors.push(`Failed to import session ${session.id}: ${error}`);
        }
      });
    }

    // Import notes
    if (options.importNotes !== false && jsonData.notes) {
      const { saveNote } = require('./storage');
      jsonData.notes.forEach(note => {
        try {
          saveNote(note.objectionId, note.note);
          imported.notes++;
        } catch (error) {
          errors.push(`Failed to import note for ${note.objectionId}: ${error}`);
        }
      });
    }

    // Import response templates
    if (options.importTemplates !== false && jsonData.responseTemplates) {
      const { saveTemplate } = require('./storage');
      jsonData.responseTemplates.forEach(template => {
        try {
          saveTemplate(template);
          imported.templates++;
        } catch (error) {
          errors.push(`Failed to import template ${template.id}: ${error}`);
        }
      });
    }

    // Import comments
    if (options.importComments !== false && jsonData.comments) {
      const { addComment } = require('./comments');
      jsonData.comments.forEach(comment => {
        try {
          addComment(comment.responseId, comment.objectionId, comment.text, comment.parentId);
          imported.comments++;
        } catch (error) {
          errors.push(`Failed to import comment ${comment.id}: ${error}`);
        }
      });
    }

    // Import practice history
    if (options.importPracticeHistory !== false && jsonData.practiceHistory) {
      const { recordPracticeHistory } = require('./storage');
      jsonData.practiceHistory.forEach(entry => {
        try {
          recordPracticeHistory(entry.objectionId, entry.sessionId, entry.confidenceRating);
          imported.practiceHistory++;
          // Note: This might create duplicates, but that's acceptable for import
        } catch (error) {
          // Silently skip - practice history is cumulative
        }
      });
    }

    // Import review schedules
    if (options.importReviewSchedules !== false && jsonData.reviewSchedules) {
      const { saveReviewSchedule } = require('./spacedRepetition');
      jsonData.reviewSchedules.forEach(schedule => {
        try {
          saveReviewSchedule(schedule);
          imported.reviewSchedules++;
        } catch (error) {
          errors.push(`Failed to import review schedule for ${schedule.objectionId}: ${error}`);
        }
      });
    }

    return {
      success: errors.length === 0,
      errors,
      imported,
    };
  } catch (error) {
    errors.push(`Import failed: ${error}`);
    return { success: false, errors, imported };
  }
}

/**
 * Parse JSON file from File object
 */
export function parseJSONFile(file: File): Promise<ExportData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Validate export data structure
 */
export function validateExportData(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Invalid data format');
    return { valid: false, errors };
  }

  if (!data.version) {
    errors.push('Missing version field');
  }

  if (!data.exportDate) {
    errors.push('Missing exportDate field');
  }

  if (!Array.isArray(data.objections)) {
    errors.push('Invalid objections array');
  }

  if (!Array.isArray(data.customResponses)) {
    errors.push('Invalid customResponses array');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

