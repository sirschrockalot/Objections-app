'use client';

import { useState, useEffect } from 'react';
import { VoiceSession } from '@/types';
import {
  compareSessions,
  SessionComparison,
  formatDuration,
  formatImprovement,
} from '@/lib/sessionComparison';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Target,
  Lightbulb,
  Award,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Calendar,
  Clock,
  MessageSquare,
} from 'lucide-react';

interface VoiceSessionComparisonProps {
  sessions: VoiceSession[];
  onClose?: () => void;
}

export default function VoiceSessionComparison({
  sessions,
  onClose,
}: VoiceSessionComparisonProps) {
  const [comparison, setComparison] = useState<SessionComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadComparison();
  }, [sessions]);

  const loadComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await compareSessions(sessions);
      setComparison(result);
    } catch (err: any) {
      setError(err.message || 'Failed to compare sessions');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (improvement: number) => {
    if (improvement > 5) return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
    if (improvement < -5) return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = (improvement: number) => {
    if (improvement > 5) return 'text-green-600 dark:text-green-400';
    if (improvement < -5) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Comparing sessions...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">{error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!comparison) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Session Comparison
              </CardTitle>
              <CardDescription>
                Comparing {comparison.sessions.length} voice practice sessions
              </CardDescription>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Insights */}
      {comparison.insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comparison.insights.map((insight, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-2 ${
                    insight.type === 'improvement'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                      : insight.type === 'decline'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                      : insight.type === 'milestone'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {insight.type === 'improvement' && (
                      <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                    )}
                    {insight.type === 'decline' && (
                      <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    )}
                    {insight.type === 'milestone' && (
                      <Award className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    )}
                    {insight.type === 'consistency' && (
                      <CheckCircle2 className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        {insight.description}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {insight.metric}:
                        </span>
                        <span className="text-xs font-bold">{insight.value}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Metrics Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Metrics Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Duration */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Session Duration</span>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(comparison.metrics.duration.improvement)}
                  <span className={`text-sm font-bold ${getTrendColor(comparison.metrics.duration.improvement)}`}>
                    {formatImprovement(comparison.metrics.duration.improvement)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {comparison.sessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 text-center"
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Session {index + 1}
                    </p>
                    <p className="text-lg font-bold">
                      {formatDuration(comparison.metrics.duration.values[index])}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Messages Exchanged</span>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(comparison.metrics.messages.improvement)}
                  <span className={`text-sm font-bold ${getTrendColor(comparison.metrics.messages.improvement)}`}>
                    {formatImprovement(comparison.metrics.messages.improvement)}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {comparison.sessions.map((session, index) => (
                  <div
                    key={session.id}
                    className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 text-center"
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Session {index + 1}
                    </p>
                    <p className="text-lg font-bold">
                      {comparison.metrics.messages.values[index]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Time */}
            {comparison.metrics.responseTime.values.some((v) => v > 0) && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Average Response Time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(-comparison.metrics.responseTime.improvement)}
                    <span className={`text-sm font-bold ${getTrendColor(-comparison.metrics.responseTime.improvement)}`}>
                      {formatImprovement(-comparison.metrics.responseTime.improvement)}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {comparison.sessions.map((session, index) => (
                    <div
                      key={session.id}
                      className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 text-center"
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        Session {index + 1}
                      </p>
                      <p className="text-lg font-bold">
                        {comparison.metrics.responseTime.values[index].toFixed(1)}s
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quality Metrics Comparison */}
      {comparison.qualityMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Quality Metrics Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparison.qualityMetrics.map((qm) => (
                <div key={qm.metric} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">
                      {qm.metric.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <div className="flex items-center gap-2">
                      {qm.trend === 'improving' && (
                        <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                      )}
                      {qm.trend === 'declining' && (
                        <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                      )}
                      {qm.trend === 'stable' && (
                        <Minus className="w-4 h-4 text-gray-500" />
                      )}
                      <span className={`text-sm font-bold ${getTrendColor(qm.improvement)}`}>
                        {formatImprovement(qm.improvement)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {qm.values.map((value, index) => (
                      <div
                        key={index}
                        className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Session {index + 1}
                          </span>
                          <span className="text-sm font-bold">{value}</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              value >= 80
                                ? 'bg-green-500'
                                : value >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Feedback Scores */}
      {comparison.feedbackScores && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              AI Feedback Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average Score</p>
                  <p className="text-2xl font-bold">{comparison.feedbackScores.averageScore.toFixed(1)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(comparison.feedbackScores.scoreImprovement)}
                  <div className="text-right">
                    <p className="text-xs text-gray-600 dark:text-gray-400">Improvement</p>
                    <p className={`text-lg font-bold ${getTrendColor(comparison.feedbackScores.scoreImprovement)}`}>
                      {formatImprovement(comparison.feedbackScores.scoreImprovement)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {comparison.feedbackScores.overallScores.map((score, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 text-center ${
                      index === comparison.feedbackScores!.bestSession
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                        : index === comparison.feedbackScores!.worstSession
                        ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Session {index + 1}
                      {index === comparison.feedbackScores!.bestSession && (
                        <span className="ml-1 text-green-600 dark:text-green-400">★ Best</span>
                      )}
                      {index === comparison.feedbackScores!.worstSession && (
                        <span className="ml-1 text-yellow-600 dark:text-yellow-400">⚠ Needs Work</span>
                      )}
                    </p>
                    <p className="text-2xl font-bold">{score}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Session Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {comparison.sessions.map((session, index) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                    {index + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(session.startTime).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(session.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatDuration(session.metrics.totalDuration)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session.metrics.messagesExchanged} messages
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

