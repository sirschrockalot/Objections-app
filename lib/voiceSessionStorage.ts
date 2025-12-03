/**
 * Storage utilities for voice practice sessions
 */

import { VoiceSession } from '@/types';

const VOICE_SESSIONS_KEY = 'response-ready-voice-sessions';
const ACTIVE_SESSION_KEY = 'response-ready-active-voice-session';

/**
 * Save a voice session
 */
export function saveVoiceSession(session: VoiceSession): void {
  if (typeof window === 'undefined') return;

  try {
    const sessions = getVoiceSessions();
    const existingIndex = sessions.findIndex((s) => s.id === session.id);

    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }

    localStorage.setItem(VOICE_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('Storage quota exceeded when saving voice session');
      throw new Error('Storage quota exceeded. Please free up space or export your data.');
    }
    console.error('Error saving voice session:', error);
    throw error;
  }
}

/**
 * Get all voice sessions
 */
export function getVoiceSessions(): VoiceSession[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(VOICE_SESSIONS_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as VoiceSession[];
  } catch (error) {
    console.error('Error loading voice sessions:', error);
    return [];
  }
}

/**
 * Get a specific voice session by ID
 */
export function getVoiceSession(sessionId: string): VoiceSession | null {
  const sessions = getVoiceSessions();
  return sessions.find((s) => s.id === sessionId) || null;
}

/**
 * Delete a voice session
 */
export function deleteVoiceSession(sessionId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const sessions = getVoiceSessions();
    const filtered = sessions.filter((s) => s.id !== sessionId);
    localStorage.setItem(VOICE_SESSIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting voice session:', error);
  }
}

/**
 * Get voice session statistics
 */
export function getVoiceSessionStats(): {
  totalSessions: number;
  totalDuration: number; // in seconds
  totalMessages: number;
  averageSessionDuration: number;
  lastSessionDate: string | null;
} {
  const sessions = getVoiceSessions();
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
    console.error('Error saving active session:', error);
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
    console.error('Error loading active session:', error);
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
  
  // Session is recoverable if it's active or paused and less than 1 hour old
  if (activeSession.status === 'active' || activeSession.status === 'paused') {
    const lastSaved = activeSession.lastSavedAt 
      ? new Date(activeSession.lastSavedAt).getTime()
      : new Date(activeSession.startTime).getTime();
    const age = Date.now() - lastSaved;
    return age < 60 * 60 * 1000; // 1 hour
  }
  
  return false;
}

