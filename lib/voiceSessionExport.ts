/**
 * Export utilities for voice practice sessions
 */

import { VoiceSession, ConversationMessage } from '@/types';
import { getVoiceSessions } from './voiceSessionStorage';

/**
 * Export a single voice session as JSON
 */
export function exportVoiceSessionJSON(session: VoiceSession): void {
  const dataStr = JSON.stringify(session, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `voice-session-${session.id}-${formatDateForFilename(session.startTime)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export a single voice session as text transcript
 */
export function exportVoiceSessionTXT(session: VoiceSession): void {
  const lines: string[] = [];
  
  lines.push('='.repeat(60));
  lines.push('VOICE PRACTICE SESSION TRANSCRIPT');
  lines.push('='.repeat(60));
  lines.push('');
  lines.push(`Session ID: ${session.id}`);
  lines.push(`Start Time: ${formatDate(session.startTime)}`);
  if (session.endTime) {
    lines.push(`End Time: ${formatDate(session.endTime)}`);
  }
  lines.push(`Duration: ${formatDuration(session.metrics.totalDuration)}`);
  lines.push(`Total Messages: ${session.metrics.messagesExchanged}`);
  lines.push(`Status: ${session.status.toUpperCase()}`);
  lines.push('');
  lines.push('-'.repeat(60));
  lines.push('CONVERSATION TRANSCRIPT');
  lines.push('-'.repeat(60));
  lines.push('');

  session.messages.forEach((message, index) => {
    const speaker = message.type === 'user' ? 'YOU' : 'AGENT';
    const timestamp = formatTime(message.timestamp);
    lines.push(`[${timestamp}] ${speaker}:`);
    lines.push(message.text);
    lines.push('');
  });

  lines.push('-'.repeat(60));
  lines.push('SESSION METRICS');
  lines.push('-'.repeat(60));
  lines.push(`Total Duration: ${formatDuration(session.metrics.totalDuration)}`);
  lines.push(`Messages Exchanged: ${session.metrics.messagesExchanged}`);
  lines.push(`Objections Handled: ${session.metrics.objectionsHandled}`);
  if (session.metrics.averageResponseTime > 0) {
    lines.push(`Average Response Time: ${formatDuration(session.metrics.averageResponseTime)}`);
  }
  if (session.metrics.confidenceScore !== undefined) {
    lines.push(`Confidence Score: ${session.metrics.confidenceScore}/100`);
  }
  lines.push('');

  const text = lines.join('\n');
  const dataBlob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `voice-session-${session.id}-${formatDateForFilename(session.startTime)}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export a single voice session as CSV
 */
export function exportVoiceSessionCSV(session: VoiceSession): void {
  const lines: string[] = [];
  
  // Header
  lines.push('Timestamp,Speaker,Message');
  
  // Messages
  session.messages.forEach((message) => {
    const timestamp = formatDate(message.timestamp);
    const speaker = message.type === 'user' ? 'User' : 'Agent';
    const text = message.text.replace(/"/g, '""'); // Escape quotes
    lines.push(`"${timestamp}","${speaker}","${text}"`);
  });

  const csv = lines.join('\n');
  const dataBlob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `voice-session-${session.id}-${formatDateForFilename(session.startTime)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export all voice sessions as JSON
 */
export function exportAllVoiceSessionsJSON(): void {
  const sessions = getVoiceSessions();
  const dataStr = JSON.stringify(sessions, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `all-voice-sessions-${formatDateForFilename(new Date().toISOString())}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export all voice sessions as CSV summary
 */
export function exportAllVoiceSessionsCSV(): void {
  const sessions = getVoiceSessions();
  const lines: string[] = [];
  
  // Header
  lines.push('Session ID,Start Time,End Time,Duration (seconds),Messages,Objections,Status');
  
  // Sessions
  sessions.forEach((session) => {
    const startTime = formatDate(session.startTime);
    const endTime = session.endTime ? formatDate(session.endTime) : '';
    const duration = session.metrics.totalDuration;
    const messages = session.metrics.messagesExchanged;
    const objections = session.metrics.objectionsHandled;
    const status = session.status;
    
    lines.push(`"${session.id}","${startTime}","${endTime}",${duration},${messages},${objections},"${status}"`);
  });

  const csv = lines.join('\n');
  const dataBlob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `all-voice-sessions-${formatDateForFilename(new Date().toISOString())}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate a shareable text summary of a voice session
 */
export function generateSessionSummary(session: VoiceSession): string {
  const lines: string[] = [];
  
  lines.push('🎤 Voice Practice Session Summary');
  lines.push('');
  lines.push(`📅 Date: ${formatDate(session.startTime)}`);
  lines.push(`⏱️  Duration: ${formatDuration(session.metrics.totalDuration)}`);
  lines.push(`💬 Messages: ${session.metrics.messagesExchanged}`);
  lines.push(`🎯 Objections: ${session.metrics.objectionsHandled}`);
  lines.push('');
  lines.push('💭 Conversation Highlights:');
  lines.push('');
  
  // Get first few messages as highlights
  const highlights = session.messages.slice(0, 6);
  highlights.forEach((message) => {
    const speaker = message.type === 'user' ? '👤 You' : '🤖 Agent';
    const preview = message.text.length > 100 
      ? message.text.substring(0, 100) + '...' 
      : message.text;
    lines.push(`${speaker}: ${preview}`);
  });
  
  if (session.messages.length > 6) {
    lines.push(`... and ${session.messages.length - 6} more messages`);
  }
  
  return lines.join('\n');
}

/**
 * Copy session summary to clipboard
 */
export async function copySessionSummaryToClipboard(session: VoiceSession): Promise<boolean> {
  try {
    const summary = generateSessionSummary(session);
    await navigator.clipboard.writeText(summary);
    return true;
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

/**
 * Format date for filename (no special characters)
 */
function formatDateForFilename(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}_${hours}-${minutes}`;
}

/**
 * Format time for display
 */
function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

/**
 * Format duration in seconds to readable string
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins < 60) {
    return `${mins}m ${secs}s`;
  }
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m ${secs}s`;
}

