/**
 * Storage utilities for voice practice sessions
 * Now uses MongoDB via API routes
 */

import { VoiceSession } from '@/types';
import { apiGet, apiPost, apiDelete } from './apiClient';
import { getCurrentUserId, isAuthenticated } from './auth';
import { error as logError, warn } from './logger';

const VOICE_SESSIONS_KEY = 'response-ready-voice-sessions';
const ACTIVE_SESSION_KEY = 'response-ready-active-voice-session';

function shouldUseAPI(): boolean {
  return typeof window !== 'undefined' && isAuthenticated();
}

/**
 * Save a voice session
 */
export async function saveVoiceSession(session: VoiceSession): Promise<void> {
  if (typeof window === 'undefined') return;

  if (shouldUseAPI()) {
    try {
      await apiPost('/api/data/voice-sessions', { session });
      return;
    } catch (error) {
      logError('Failed to save voice session to API', error);
      // Fall through to localStorage
    }
  }

  // Fallback to localStorage
  try {
    const sessions = getVoiceSessionsSync();
    const existingIndex = sessions.findIndex((s) => s.id === session.id);

    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }

    localStorage.setItem(VOICE_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      warn('Storage quota exceeded when saving voice session');
      throw new Error('Storage quota exceeded. Please free up space or export your data.');
    }
    logError('Failed to save voice session', error);
    throw error;
  }
}

/**
 * Get all voice sessions
 */
export async function getVoiceSessions(): Promise<VoiceSession[]> {
  if (typeof window === 'undefined') return [];

  if (shouldUseAPI()) {
    try {
      const data = await apiGet('/api/data/voice-sessions');
      return data.sessions || [];
    } catch (error) {
      logError('Failed to load voice sessions from API', error);
      // Fall through
    }
  }

  return getVoiceSessionsSync();
}

function getVoiceSessionsSync(): VoiceSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(VOICE_SESSIONS_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as VoiceSession[];
  } catch (error) {
    logError('Failed to load voice sessions', error);
    return [];
  }
}

/**
 * Get a specific voice session by ID
 */
export async function getVoiceSession(sessionId: string): Promise<VoiceSession | null> {
  if (shouldUseAPI()) {
    try {
      const data = await apiGet('/api/data/voice-sessions', { sessionId });
      if (data.sessions && data.sessions.length > 0) {
        return data.sessions[0];
      }
      return null;
    } catch (error) {
      logError('Failed to get voice session from API', error);
      // Fall through
    }
  }

  const sessions = getVoiceSessionsSync();
  return sessions.find((s) => s.id === sessionId) || null;
}

/**
 * Delete a voice session
 */
export async function deleteVoiceSession(sessionId: string): Promise<void> {
  if (typeof window === 'undefined') return;

  if (shouldUseAPI()) {
    try {
      await apiDelete('/api/data/voice-sessions', { sessionId });
      return;
    } catch (error) {
      logError('Failed to delete voice session via API', error);
      // Fall through
    }
  }

  // Fallback to localStorage
  try {
    const sessions = getVoiceSessionsSync();
    const filtered = sessions.filter((s) => s.id !== sessionId);
    localStorage.setItem(VOICE_SESSIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    logError('Failed to delete voice session', error);
  }
}

/**
 * Get voice session statistics
 */
export async function getVoiceSessionStats(): Promise<{
  totalSessions: number;
  totalDuration: number; // in seconds
  totalMessages: number;
  averageSessionDuration: number;
  lastSessionDate: string | null;
}> {
  const sessions = await getVoiceSessions();
  const completedSessions = sessions.filter((s) => s.status === 'completed');

  const totalDuration = completedSessions.reduce(
    (sum, s) => sum + s.metrics.totalDuration,
    0
  );
  const totalMessages = completedSessions.reduce(
    (sum, s) => sum + s.metrics.messagesExchanged,
    0
  );

  const sortedSessions = completedSessions.sort(
    (a, b) =>
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  return {
    totalSessions: completedSessions.length,
    totalDuration,
    totalMessages,
    averageSessionDuration:
      completedSessions.length > 0
        ? Math.floor(totalDuration / completedSessions.length)
        : 0,
    lastSessionDate:
      sortedSessions.length > 0 ? sortedSessions[0].startTime : null,
  };
}

/**
 * Save active session for recovery (auto-save)
 */
export function saveActiveSession(session: VoiceSession): void {
  if (typeof window === 'undefined') return;

  try {
    const sessionWithSaveTime = {
      ...session,
      lastSavedAt: new Date().toISOString(),
    };
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(sessionWithSaveTime));
  } catch (error) {
    logError('Failed to save active session', error);
  }
}

/**
 * Get active session for recovery
 */
export function getActiveSession(): VoiceSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as VoiceSession;
  } catch (error) {
    logError('Failed to load active session', error);
    return null;
  }
}

/**
 * Clear active session (after completion or intentional end)
 */
export function clearActiveSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACTIVE_SESSION_KEY);
}

/**
 * Check if there's a recoverable session
 */
export function hasRecoverableSession(): boolean {
  const activeSession = getActiveSession();
  if (!activeSession) return false;
  
  if (activeSession.status === 'active' || activeSession.status === 'paused') {
    const lastSaved = activeSession.lastSavedAt 
      ? new Date(activeSession.lastSavedAt).getTime()
      : new Date(activeSession.startTime).getTime();
    const age = Date.now() - lastSaved;
    return age < 60 * 60 * 1000; // 1 hour
  }
  
  return false;
}
