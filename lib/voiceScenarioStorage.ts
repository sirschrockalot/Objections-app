/**
 * Storage utilities for voice scenario practice sessions
 */

import { VoiceSession } from '@/types';

const VOICE_SCENARIO_SESSIONS_KEY = 'response-ready-voice-scenario-sessions';

export interface VoiceScenarioSession extends VoiceSession {
  scenarioId: string;
  scenarioName: string;
  scenarioContext?: any;
}

/**
 * Save a voice scenario session
 */
export function saveVoiceScenarioSession(session: VoiceScenarioSession): void {
  if (typeof window === 'undefined') return;

  try {
    const sessions = getVoiceScenarioSessions();
    const existingIndex = sessions.findIndex((s) => s.id === session.id);

    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }

    localStorage.setItem(VOICE_SCENARIO_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Error saving voice scenario session:', error);
  }
}

/**
 * Get all voice scenario sessions
 */
export function getVoiceScenarioSessions(): VoiceScenarioSession[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(VOICE_SCENARIO_SESSIONS_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as VoiceScenarioSession[];
  } catch (error) {
    console.error('Error loading voice scenario sessions:', error);
    return [];
  }
}

/**
 * Get scenario sessions by scenario ID
 */
export function getSessionsByScenario(scenarioId: string): VoiceScenarioSession[] {
  const sessions = getVoiceScenarioSessions();
  return sessions.filter(s => s.scenarioId === scenarioId);
}

/**
 * Get scenario statistics
 */
export function getScenarioStats(scenarioId: string): {
  totalSessions: number;
  averageDuration: number;
  averageMessages: number;
  lastPracticed: string | null;
} {
  const sessions = getSessionsByScenario(scenarioId);
  const completed = sessions.filter(s => s.status === 'completed');

  if (completed.length === 0) {
    return {
      totalSessions: 0,
      averageDuration: 0,
      averageMessages: 0,
      lastPracticed: null,
    };
  }

  const totalDuration = completed.reduce((sum, s) => sum + s.metrics.totalDuration, 0);
  const totalMessages = completed.reduce((sum, s) => sum + s.metrics.messagesExchanged, 0);
  const sorted = completed.sort((a, b) => 
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  return {
    totalSessions: completed.length,
    averageDuration: Math.floor(totalDuration / completed.length),
    averageMessages: Math.floor(totalMessages / completed.length),
    lastPracticed: sorted[0]?.startTime || null,
  };
}

