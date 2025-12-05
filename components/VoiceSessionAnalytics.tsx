'use client';

import { useState, useEffect } from 'react';
import { calculateVoiceAnalytics, VoiceAnalytics } from '@/lib/voiceAnalytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  MessageSquare,
  Target,
  Award,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Calendar,
  Zap,
} from 'lucide-react';

export default function VoiceSessionAnalytics() {
  const [analytics, setAnalytics] = useState<VoiceAnalytics | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const loadAnalytics = async () => {
      const data = await calculateVoiceAnalytics();
      setAnalytics(data);
    };

    loadAnalytics();
    // Refresh every 10 seconds
    const interval = setInterval(loadAnalytics, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!analytics) {
    return null;
  }

  if (analytics.totalSessions === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Voice Practice Analytics
          </CardTitle>
          <CardDescription>
            Detailed insights into your voice practice performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Complete voice practice sessions to see analytics</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Voice Practice Analytics
            </CardTitle>
            <CardDescription>
              Detailed insights into your voice practice performance
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg Response</span>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">{formatDuration(analytics.averageResponseTime)}</p>
              {getTrendIcon(analytics.responseTimeTrend)}
            </div>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Msg/Min</span>
            </div>
            <p className="text-2xl font-bold">
              {analytics.averageMessagesPerMinute.toFixed(1)}
            </p>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg Session</span>
            </div>
            <p className="text-2xl font-bold">
              {formatDuration(analytics.averageSessionDuration)}
            </p>
          </div>

          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Most Active</span>
            </div>
            <p className="text-lg font-bold">{analytics.mostActiveDay}</p>
          </div>
        </div>

        {/* Strengths & Improvement Areas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.strengths.length > 0 && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-green-900 dark:text-green-100">Strengths</h3>
              </div>
              <ul className="space-y-2">
                {analytics.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-green-800 dark:text-green-200 flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 mt-1">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analytics.improvementAreas.length > 0 && (
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                  Areas for Improvement
                </h3>
              </div>
              <ul className="space-y-2">
                {analytics.improvementAreas.map((area, index) => (
                  <li key={index} className="text-sm text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400 mt-1">•</span>
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Detailed Analytics */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pt-4 border-t"
          >
            {/* Response Time Details */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Response Time Analysis
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Fastest</p>
                  <p className="text-lg font-bold">{formatDuration(analytics.fastestResponseTime)}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average</p>
                  <p className="text-lg font-bold">{formatDuration(analytics.averageResponseTime)}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Slowest</p>
                  <p className="text-lg font-bold">{formatDuration(analytics.slowestResponseTime)}</p>
                </div>
              </div>
            </div>

            {/* Session Duration Range */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Session Duration Range
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Shortest</p>
                  <p className="text-lg font-bold">{formatDuration(analytics.shortestSession)}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Longest</p>
                  <p className="text-lg font-bold">{formatDuration(analytics.longestSession)}</p>
                </div>
              </div>
            </div>

            {/* Conversation Quality */}
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Conversation Quality
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Shortest</p>
                  <p className="text-lg font-bold">{analytics.shortestConversation} msgs</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Average</p>
                  <p className="text-lg font-bold">
                    {Math.round(analytics.averageConversationLength)} msgs
                  </p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Longest</p>
                  <p className="text-lg font-bold">{analytics.longestConversation} msgs</p>
                </div>
              </div>
            </div>

            {/* Weekly Trends */}
            {analytics.sessionsByWeek.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Weekly Trends
                </h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {analytics.sessionsByWeek.slice(-8).map((week, index) => {
                    const messages = analytics.messagesByWeek.find(m => m.week === week.week);
                    return (
                      <div
                        key={week.week}
                        className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-sm">{week.week}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {week.count} session{week.count !== 1 ? 's' : ''} •{' '}
                            {formatDuration(week.duration)} • {messages?.count || 0} messages
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Best Session */}
            {analytics.bestSession && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Best Session
                </h3>
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Date</p>
                      <p className="font-semibold">
                        {new Date(analytics.bestSession.startTime).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Duration</p>
                      <p className="font-semibold">
                        {formatDuration(analytics.bestSession.metrics.totalDuration)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Messages</p>
                      <p className="font-semibold">
                        {analytics.bestSession.metrics.messagesExchanged}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

