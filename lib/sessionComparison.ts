/**
 * Utilities for comparing voice practice sessions
 */

import { VoiceSession, AIFeedback } from '@/types';
import { getSessionFeedback } from './aiFeedback';

export interface SessionComparison {
  sessions: VoiceSession[];
  metrics: ComparisonMetrics;
  qualityMetrics: QualityComparison[];
  feedbackScores: FeedbackComparison | null;
  insights: ComparisonInsight[];
  trends: TrendData[];
}

export interface ComparisonMetrics {
  duration: {
    values: number[];
    average: number;
    improvement: number; // percentage change
  };
  messages: {
    values: number[];
    average: number;
    improvement: number;
  };
  responseTime: {
    values: number[];
    average: number;
    improvement: number;
  };
}

export interface QualityComparison {
  metric: string;
  values: number[];
  average: number;
  improvement: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface FeedbackComparison {
  overallScores: number[];
  averageScore: number;
  scoreImprovement: number;
  bestSession: number; // index
  worstSession: number; // index
}

export interface ComparisonInsight {
  type: 'improvement' | 'decline' | 'consistency' | 'milestone';
  title: string;
  description: string;
  metric: string;
  value: number | string;
}

export interface TrendData {
  date: string;
  score: number;
  duration: number;
  messages: number;
}

/**
 * Compare multiple voice sessions
 */
export async function compareSessions(sessions: VoiceSession[]): Promise<SessionComparison> {
  if (sessions.length < 2) {
    throw new Error('Need at least 2 sessions to compare');
  }

  // Sort sessions by date (oldest first)
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Calculate basic metrics comparison
  const metrics: ComparisonMetrics = {
    duration: {
      values: sortedSessions.map((s) => s.metrics.totalDuration),
      average: calculateAverage(sortedSessions.map((s) => s.metrics.totalDuration)),
      improvement: calculateImprovement(
        sortedSessions.map((s) => s.metrics.totalDuration)
      ),
    },
    messages: {
      values: sortedSessions.map((s) => s.metrics.messagesExchanged),
      average: calculateAverage(sortedSessions.map((s) => s.metrics.messagesExchanged)),
      improvement: calculateImprovement(
        sortedSessions.map((s) => s.metrics.messagesExchanged)
      ),
    },
    responseTime: {
      values: sortedSessions.map(
        (s) => s.metrics.averageResponseTime || 0
      ),
      average: calculateAverage(
        sortedSessions.map((s) => s.metrics.averageResponseTime || 0)
      ),
      improvement: calculateImprovement(
        sortedSessions.map((s) => s.metrics.averageResponseTime || 0)
      ),
    },
  };

  // Get AI feedback for all sessions (if available)
  const feedbackPromises = sortedSessions.map((session) =>
    getSessionFeedback(session).catch(() => null)
  );
  const feedbackResults = await Promise.all(feedbackPromises);
  const validFeedback = feedbackResults.filter(
    (f): f is AIFeedback => f !== null
  );

  // Quality metrics comparison
  const qualityMetrics: QualityComparison[] = [];
  if (validFeedback.length > 0) {
    const metricKeys: (keyof typeof validFeedback[0]['qualityMetrics'])[] = [
      'clarity',
      'empathy',
      'structure',
      'objectionHandling',
      'closingTechnique',
    ];

    metricKeys.forEach((key) => {
      const values = validFeedback.map((f) => f.qualityMetrics[key]);
      if (values.length > 0) {
        qualityMetrics.push({
          metric: key,
          values,
          average: calculateAverage(values),
          improvement: calculateImprovement(values),
          trend: determineTrend(values),
        });
      }
    });
  }

  // Feedback scores comparison
  let feedbackScores: FeedbackComparison | null = null;
  if (validFeedback.length > 0) {
    const overallScores = validFeedback.map((f) => f.overallScore);
    const bestIndex = overallScores.indexOf(Math.max(...overallScores));
    const worstIndex = overallScores.indexOf(Math.min(...overallScores));

    feedbackScores = {
      overallScores,
      averageScore: calculateAverage(overallScores),
      scoreImprovement: calculateImprovement(overallScores),
      bestSession: bestIndex,
      worstSession: worstIndex,
    };
  }

  // Generate insights
  const insights = generateInsights(
    sortedSessions,
    metrics,
    qualityMetrics,
    feedbackScores
  );

  // Generate trend data
  const trends: TrendData[] = sortedSessions.map((session, index) => {
    const feedback = validFeedback[index];
    return {
      date: session.startTime,
      score: feedback?.overallScore || 0,
      duration: session.metrics.totalDuration,
      messages: session.metrics.messagesExchanged,
    };
  });

  return {
    sessions: sortedSessions,
    metrics,
    qualityMetrics,
    feedbackScores,
    insights,
    trends,
  };
}

/**
 * Calculate average of values
 */
function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

/**
 * Calculate improvement percentage (from first to last)
 */
function calculateImprovement(values: number[]): number {
  if (values.length < 2) return 0;
  const first = values[0];
  const last = values[values.length - 1];
  if (first === 0) return last > 0 ? 100 : 0;
  return Math.round(((last - first) / first) * 100 * 100) / 100;
}

/**
 * Determine trend direction
 */
function determineTrend(values: number[]): 'improving' | 'declining' | 'stable' {
  if (values.length < 2) return 'stable';
  const first = values[0];
  const last = values[values.length - 1];
  const change = last - first;
  const threshold = first * 0.05; // 5% threshold

  if (Math.abs(change) < threshold) return 'stable';
  return change > 0 ? 'improving' : 'declining';
}

/**
 * Generate comparison insights
 */
function generateInsights(
  sessions: VoiceSession[],
  metrics: ComparisonMetrics,
  qualityMetrics: QualityComparison[],
  feedbackScores: FeedbackComparison | null
): ComparisonInsight[] {
  const insights: ComparisonInsight[] = [];

  // Duration insights
  if (metrics.duration.improvement > 20) {
    insights.push({
      type: 'improvement',
      title: 'Longer Practice Sessions',
      description: `Your session duration increased by ${Math.abs(metrics.duration.improvement).toFixed(1)}%, showing increased engagement.`,
      metric: 'Duration',
      value: `${metrics.duration.improvement.toFixed(1)}%`,
    });
  } else if (metrics.duration.improvement < -20) {
    insights.push({
      type: 'decline',
      title: 'Shorter Sessions',
      description: `Session duration decreased by ${Math.abs(metrics.duration.improvement).toFixed(1)}%. Consider practicing longer to build more confidence.`,
      metric: 'Duration',
      value: `${metrics.duration.improvement.toFixed(1)}%`,
    });
  }

  // Response time insights
  if (metrics.responseTime.improvement < -10) {
    insights.push({
      type: 'improvement',
      title: 'Faster Responses',
      description: `Your response time improved by ${Math.abs(metrics.responseTime.improvement).toFixed(1)}%, showing increased confidence.`,
      metric: 'Response Time',
      value: `${metrics.responseTime.improvement.toFixed(1)}%`,
    });
  }

  // Quality metrics insights
  qualityMetrics.forEach((qm) => {
    if (qm.improvement > 15) {
      insights.push({
        type: 'improvement',
        title: `Improved ${qm.metric.charAt(0).toUpperCase() + qm.metric.slice(1)}`,
        description: `Your ${qm.metric} score improved by ${qm.improvement.toFixed(1)}% across these sessions.`,
        metric: qm.metric,
        value: `${qm.improvement.toFixed(1)}%`,
      });
    } else if (qm.improvement < -15) {
      insights.push({
        type: 'decline',
        title: `${qm.metric.charAt(0).toUpperCase() + qm.metric.slice(1)} Needs Attention`,
        description: `Your ${qm.metric} score decreased by ${Math.abs(qm.improvement).toFixed(1)}%. Focus on this area in future practice.`,
        metric: qm.metric,
        value: `${qm.improvement.toFixed(1)}%`,
      });
    }
  });

  // Overall score insights
  if (feedbackScores) {
    if (feedbackScores.scoreImprovement > 10) {
      insights.push({
        type: 'improvement',
        title: 'Overall Performance Improving',
        description: `Your overall score improved by ${feedbackScores.scoreImprovement.toFixed(1)}%! Keep up the great work.`,
        metric: 'Overall Score',
        value: `${feedbackScores.scoreImprovement.toFixed(1)}%`,
      });
    }

    if (feedbackScores.overallScores.length >= 3) {
      const recentScores = feedbackScores.overallScores.slice(-3);
      const isConsistent =
        Math.max(...recentScores) - Math.min(...recentScores) < 10;
      if (isConsistent) {
        insights.push({
          type: 'consistency',
          title: 'Consistent Performance',
          description: 'Your last 3 sessions show consistent performance. Great job maintaining quality!',
          metric: 'Consistency',
          value: 'Stable',
        });
      }
    }

    // Milestone check
    const highestScore = Math.max(...feedbackScores.overallScores);
    if (highestScore >= 80) {
      insights.push({
        type: 'milestone',
        title: 'Excellent Performance Achieved',
        description: `You achieved a score of ${highestScore} in one of these sessions! This is excellent work.`,
        metric: 'Best Score',
        value: highestScore.toString(),
      });
    }
  }

  return insights;
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format improvement percentage
 */
export function formatImprovement(improvement: number): string {
  const sign = improvement >= 0 ? '+' : '';
  return `${sign}${improvement.toFixed(1)}%`;
}

