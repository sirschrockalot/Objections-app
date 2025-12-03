'use client';

import { useState, useEffect } from 'react';
import { VoiceSession, AIFeedback } from '@/types';
import { getSessionFeedback, isAIFeedbackAvailable } from '@/lib/aiFeedback';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Target,
  RefreshCw,
  Loader2,
  Star,
  MessageSquare,
  Zap,
} from 'lucide-react';

interface PostSessionFeedbackProps {
  session: VoiceSession;
  onClose?: () => void;
}

export default function PostSessionFeedback({ session, onClose }: PostSessionFeedbackProps) {
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedRecommendation, setExpandedRecommendation] = useState<number | null>(null);

  useEffect(() => {
    if (isAIFeedbackAvailable()) {
      loadFeedback();
    } else {
      setError('AI feedback is not configured. Please set NEXT_PUBLIC_OPENAI_API_KEY in your environment variables.');
    }
  }, [session.id]);

  const loadFeedback = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getSessionFeedback(session, forceRefresh);
      if (result) {
        setFeedback(result);
      } else {
        setError('Failed to generate feedback. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze session');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  if (!isAIFeedbackAvailable()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            AI Feedback
          </CardTitle>
          <CardDescription>AI-powered session analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                AI Feedback Not Configured
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                To enable AI-powered feedback, add your OpenAI API key to your environment variables.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              AI-Powered Session Analysis
            </CardTitle>
            <CardDescription>
              Detailed feedback and recommendations for improvement
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadFeedback(true)}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && !feedback && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Analyzing your session with AI...
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              This may take a few moments
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 dark:text-red-100">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => loadFeedback(true)}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Overall Score */}
              <div className={`p-6 rounded-lg border-2 ${getScoreBgColor(feedback.overallScore)} border-current`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Overall Performance Score</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Based on clarity, empathy, structure, and objection handling
                    </p>
                  </div>
                  <div className={`text-5xl font-bold ${getScoreColor(feedback.overallScore)}`}>
                    {feedback.overallScore}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {feedback.overallScore >= 80 ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-900 dark:text-green-100">
                        Excellent performance!
                      </span>
                    </>
                  ) : feedback.overallScore >= 60 ? (
                    <>
                      <TrendingUp className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                        Good, with room for improvement
                      </span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-medium text-red-900 dark:text-red-100">
                        Focus on key areas below
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Quality Metrics */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Quality Breakdown
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(feedback.qualityMetrics)
                    .filter(([key]) => key !== 'averageResponseTime')
                    .map(([key, value]) => (
                      <div
                        key={key}
                        className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className={`text-lg font-bold ${getScoreColor(value)}`}>
                            {value}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className={`h-2 rounded-full ${
                              value >= 80
                                ? 'bg-green-500'
                                : value >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Strengths */}
              {feedback.strengths.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Strengths
                  </h3>
                  <div className="space-y-2">
                    {feedback.strengths.map((strength, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-green-900 dark:text-green-100">{strength}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Improvement Areas */}
              {feedback.improvementAreas.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                    Areas for Improvement
                  </h3>
                  <div className="space-y-2">
                    {feedback.improvementAreas.map((area, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                      >
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-yellow-900 dark:text-yellow-100">{area}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {feedback.recommendations.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Actionable Recommendations
                  </h3>
                  <div className="space-y-3">
                    {feedback.recommendations.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-lg border-2 ${
                          rec.priority === 'high'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                            : rec.priority === 'medium'
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{rec.title}</h4>
                              <span
                                className={`px-2 py-0.5 text-xs rounded-full ${
                                  rec.priority === 'high'
                                    ? 'bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100'
                                    : rec.priority === 'medium'
                                    ? 'bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100'
                                    : 'bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100'
                                }`}
                              >
                                {rec.priority.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                              {rec.description}
                            </p>
                            {rec.actionItems.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  Action Items:
                                </p>
                                {rec.actionItems.map((item, itemIndex) => (
                                  <div
                                    key={itemIndex}
                                    className="flex items-start gap-2 text-sm"
                                  >
                                    <Zap className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Response Analysis */}
              {feedback.responseAnalysis.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Response-by-Response Analysis
                  </h3>
                  <div className="space-y-4">
                    {feedback.responseAnalysis.map((analysis, index) => (
                      <motion.div
                        key={analysis.messageId || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                Response #{index + 1}
                              </span>
                              <div className={`px-2 py-0.5 rounded-full text-xs font-bold ${getScoreBgColor(analysis.score)} ${getScoreColor(analysis.score)}`}>
                                {analysis.score}
                              </div>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                  Buyer:
                                </span>
                                <p className="text-gray-700 dark:text-gray-300 mt-1">
                                  {analysis.agentMessage}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                  Your Response:
                                </span>
                                <p className="text-gray-700 dark:text-gray-300 mt-1">
                                  {analysis.userMessage}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-800">
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            {analysis.feedback}
                          </p>
                          {analysis.strengths.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-1">
                                Strengths:
                              </p>
                              <ul className="text-xs text-green-600 dark:text-green-500 space-y-1">
                                {analysis.strengths.map((s, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {analysis.improvements.length > 0 && (
                            <div className="mb-2">
                              <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                                Improvements:
                              </p>
                              <ul className="text-xs text-yellow-600 dark:text-yellow-500 space-y-1">
                                {analysis.improvements.map((imp, i) => (
                                  <li key={i} className="flex items-start gap-1">
                                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    {imp}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {analysis.suggestedResponse && (
                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                              <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">
                                Suggested Improved Response:
                              </p>
                              <p className="text-sm text-blue-900 dark:text-blue-100 italic">
                                "{analysis.suggestedResponse}"
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Analysis generated by {feedback.model || 'AI'} on{' '}
                  {new Date(feedback.generatedAt).toLocaleString()}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

