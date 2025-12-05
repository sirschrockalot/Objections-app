/**
 * Analytics utilities for voice practice sessions
 */

import { VoiceSession, ConversationMessage } from '@/types';
import { getVoiceSessions } from './voiceSessionStorage';

export interface VoiceAnalytics {
  // Overall metrics
  totalSessions: number;
  totalDuration: number; // in seconds
  totalMessages: number;
  averageSessionDuration: number;
  averageMessagesPerSession: number;
  
  // Response time metrics
  averageResponseTime: number; // in seconds
  fastestResponseTime: number;
  slowestResponseTime: number;
  responseTimeTrend: 'improving' | 'declining' | 'stable';
  
  // Engagement metrics
  averageMessagesPerMinute: number;
  longestSession: number; // in seconds
  shortestSession: number;
  
  // Time-based trends
  sessionsByWeek: Array<{ week: string; count: number; duration: number }>;
  messagesByWeek: Array<{ week: string; count: number }>;
  
  // Performance insights
  mostActiveDay: string;
  bestSession: VoiceSession | null;
  improvementAreas: string[];
  strengths: string[];
  
  // Conversation quality
  averageConversationLength: number;
  longestConversation: number;
  shortestConversation: number;
}

/**
 * Calculate response time between user and agent messages
 */
function calculateResponseTime(messages: ConversationMessage[]): number[] {
  const responseTimes: number[] = [];
  
  for (let i = 0; i < messages.length - 1; i++) {
    const current = messages[i];
    const next = messages[i + 1];
    
    // If current is user message and next is agent, calculate time
    if (current.type === 'user' && next.type === 'agent') {
      const timeDiff = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime();
      responseTimes.push(timeDiff / 1000); // Convert to seconds
    }
  }
  
  return responseTimes;
}

/**
 * Get week identifier from date string
 */
function getWeekIdentifier(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-W${week.toString().padStart(2, '0')}`;
}

/**
 * Get week number of year
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Get day of week name
 */
function getDayOfWeek(dateString: string): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(dateString).getDay()];
}

/**
 * Calculate comprehensive analytics from voice sessions
 */
export async function calculateVoiceAnalytics(): Promise<VoiceAnalytics> {
  const allSessions = await getVoiceSessions();
  const sessions = allSessions.filter(s => s.status === 'completed');
  
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      totalDuration: 0,
      totalMessages: 0,
      averageSessionDuration: 0,
      averageMessagesPerSession: 0,
      averageResponseTime: 0,
      fastestResponseTime: 0,
      slowestResponseTime: 0,
      responseTimeTrend: 'stable',
      averageMessagesPerMinute: 0,
      longestSession: 0,
      shortestSession: 0,
      sessionsByWeek: [],
      messagesByWeek: [],
      mostActiveDay: 'N/A',
      bestSession: null,
      improvementAreas: [],
      strengths: [],
      averageConversationLength: 0,
      longestConversation: 0,
      shortestConversation: 0,
    };
  }

  // Basic metrics
  const totalDuration = sessions.reduce((sum, s) => sum + s.metrics.totalDuration, 0);
  const totalMessages = sessions.reduce((sum, s) => sum + s.metrics.messagesExchanged, 0);
  const averageSessionDuration = Math.floor(totalDuration / sessions.length);
  const averageMessagesPerSession = totalMessages / sessions.length;

  // Response time analysis
  const allResponseTimes: number[] = [];
  sessions.forEach(session => {
    const responseTimes = calculateResponseTime(session.messages);
    allResponseTimes.push(...responseTimes);
  });

  const averageResponseTime = allResponseTimes.length > 0
    ? allResponseTimes.reduce((sum, t) => sum + t, 0) / allResponseTimes.length
    : 0;
  const fastestResponseTime = allResponseTimes.length > 0
    ? Math.min(...allResponseTimes)
    : 0;
  const slowestResponseTime = allResponseTimes.length > 0
    ? Math.max(...allResponseTimes)
    : 0;

  // Response time trend (compare first half vs second half)
  let responseTimeTrend: 'improving' | 'declining' | 'stable' = 'stable';
  if (sessions.length >= 4) {
    const midpoint = Math.floor(sessions.length / 2);
    const firstHalf = sessions.slice(0, midpoint);
    const secondHalf = sessions.slice(midpoint);
    
    const firstHalfTimes = firstHalf.flatMap(s => calculateResponseTime(s.messages));
    const secondHalfTimes = secondHalf.flatMap(s => calculateResponseTime(s.messages));
    
    if (firstHalfTimes.length > 0 && secondHalfTimes.length > 0) {
      const firstAvg = firstHalfTimes.reduce((sum, t) => sum + t, 0) / firstHalfTimes.length;
      const secondAvg = secondHalfTimes.reduce((sum, t) => sum + t, 0) / secondHalfTimes.length;
      
      const improvement = ((firstAvg - secondAvg) / firstAvg) * 100;
      if (improvement > 10) {
        responseTimeTrend = 'improving';
      } else if (improvement < -10) {
        responseTimeTrend = 'declining';
      }
    }
  }

  // Engagement metrics
  const averageMessagesPerMinute = sessions.reduce((sum, s) => {
    const minutes = s.metrics.totalDuration / 60;
    return sum + (s.metrics.messagesExchanged / (minutes || 1));
  }, 0) / sessions.length;

  const sessionDurations = sessions.map(s => s.metrics.totalDuration);
  const longestSession = Math.max(...sessionDurations);
  const shortestSession = Math.min(...sessionDurations);

  // Time-based trends
  const weekMap = new Map<string, { count: number; duration: number }>();
  const messagesWeekMap = new Map<string, number>();

  sessions.forEach(session => {
    const week = getWeekIdentifier(session.startTime);
    const existing = weekMap.get(week) || { count: 0, duration: 0 };
    weekMap.set(week, {
      count: existing.count + 1,
      duration: existing.duration + session.metrics.totalDuration,
    });

    const msgCount = messagesWeekMap.get(week) || 0;
    messagesWeekMap.set(week, msgCount + session.metrics.messagesExchanged);
  });

  const sessionsByWeek = Array.from(weekMap.entries())
    .map(([week, data]) => ({ week, ...data }))
    .sort((a, b) => a.week.localeCompare(b.week));

  const messagesByWeek = Array.from(messagesWeekMap.entries())
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week));

  // Most active day
  const dayCounts = new Map<string, number>();
  sessions.forEach(session => {
    const day = getDayOfWeek(session.startTime);
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
  });
  const mostActiveDay = Array.from(dayCounts.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  // Best session (longest with most messages)
  const bestSession = sessions.reduce((best, current) => {
    const bestScore = best.metrics.messagesExchanged * best.metrics.totalDuration;
    const currentScore = current.metrics.messagesExchanged * current.metrics.totalDuration;
    return currentScore > bestScore ? current : best;
  }, sessions[0]);

  // Improvement areas and strengths
  const improvementAreas: string[] = [];
  const strengths: string[] = [];

  if (averageResponseTime > 5) {
    improvementAreas.push('Response time could be faster');
  } else if (averageResponseTime < 2) {
    strengths.push('Quick response time');
  }

  if (averageMessagesPerSession < 5) {
    improvementAreas.push('Try longer conversations');
  } else if (averageMessagesPerSession > 15) {
    strengths.push('Engaged in detailed conversations');
  }

  if (averageSessionDuration < 60) {
    improvementAreas.push('Practice for longer sessions');
  } else if (averageSessionDuration > 300) {
    strengths.push('Dedicated practice sessions');
  }

  if (responseTimeTrend === 'declining') {
    improvementAreas.push('Response time is getting slower');
  } else if (responseTimeTrend === 'improving') {
    strengths.push('Improving response time');
  }

  if (sessions.length < 5) {
    improvementAreas.push('Practice more regularly');
  } else {
    strengths.push('Consistent practice');
  }

  // Conversation quality
  const conversationLengths = sessions.map(s => s.metrics.messagesExchanged);
  const averageConversationLength = conversationLengths.reduce((sum, l) => sum + l, 0) / conversationLengths.length;
  const longestConversation = Math.max(...conversationLengths);
  const shortestConversation = Math.min(...conversationLengths);

  return {
    totalSessions: sessions.length,
    totalDuration,
    totalMessages,
    averageSessionDuration,
    averageMessagesPerSession,
    averageResponseTime,
    fastestResponseTime,
    slowestResponseTime,
    responseTimeTrend,
    averageMessagesPerMinute,
    longestSession,
    shortestSession,
    sessionsByWeek,
    messagesByWeek,
    mostActiveDay,
    bestSession,
    improvementAreas,
    strengths,
    averageConversationLength,
    longestConversation,
    shortestConversation,
  };
}

/**
 * Get analytics summary for quick display
 */
export async function getAnalyticsSummary(): Promise<{
  keyMetrics: Array<{ label: string; value: string; trend?: string }>;
  insights: string[];
}> {
  const analytics = await calculateVoiceAnalytics();

  const keyMetrics = [
    {
      label: 'Total Sessions',
      value: analytics.totalSessions.toString(),
    },
    {
      label: 'Avg Duration',
      value: formatDuration(analytics.averageSessionDuration),
    },
    {
      label: 'Avg Response Time',
      value: formatDuration(analytics.averageResponseTime),
      trend: analytics.responseTimeTrend,
    },
    {
      label: 'Messages/Min',
      value: analytics.averageMessagesPerMinute.toFixed(1),
    },
  ];

  const insights: string[] = [];
  if (analytics.strengths.length > 0) {
    insights.push(...analytics.strengths.slice(0, 3));
  }
  if (analytics.improvementAreas.length > 0) {
    insights.push(...analytics.improvementAreas.slice(0, 2));
  }

  return { keyMetrics, insights };
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
  return `${mins}m ${secs}s`;
}

