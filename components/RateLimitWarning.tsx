'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, TrendingUp, Clock, MessageSquare, Activity } from 'lucide-react';
import {
  checkRateLimits,
  getDefaultRateLimitConfig,
  RateLimitConfig,
  UsageStats,
} from '@/lib/rateLimiting';

interface RateLimitWarningProps {
  config?: RateLimitConfig;
  onDismiss?: () => void;
  showDetails?: boolean;
  autoRefresh?: boolean; // Auto-refresh usage stats
}

export default function RateLimitWarning({
  config,
  onDismiss,
  showDetails = false,
  autoRefresh = true,
}: RateLimitWarningProps) {
  const [rateLimitStatus, setRateLimitStatus] = useState<{
    isWarning: boolean;
    isLimitReached: boolean;
    warnings: string[];
    usage: {
      daily: UsageStats;
      monthly: UsageStats;
    };
  } | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  const updateRateLimitStatus = () => {
    const limitConfig = config || getDefaultRateLimitConfig();
    const status = checkRateLimits(limitConfig);
    setRateLimitStatus(status);
  };

  useEffect(() => {
    updateRateLimitStatus();
  }, [config]);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      updateRateLimitStatus();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, config]);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  if (!rateLimitStatus || isDismissed) return null;

  // Only show if there's a warning or limit reached
  if (!rateLimitStatus.isWarning && !rateLimitStatus.isLimitReached) {
    return null;
  }

  const isLimitReached = rateLimitStatus.isLimitReached;
  const limitConfig = config || getDefaultRateLimitConfig();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-4"
      >
        <Card
          className={`${
            isLimitReached
              ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
              : 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20'
          }`}
        >
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className={`w-5 h-5 mt-0.5 ${
                    isLimitReached
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-yellow-600 dark:text-yellow-400'
                  }`}
                />
                <div>
                  <CardTitle
                    className={
                      isLimitReached
                        ? 'text-red-900 dark:text-red-100'
                        : 'text-yellow-900 dark:text-yellow-100'
                    }
                  >
                    {isLimitReached
                      ? 'API Limit Reached'
                      : 'Approaching API Limits'}
                  </CardTitle>
                  <CardDescription
                    className={
                      isLimitReached
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-yellow-700 dark:text-yellow-300'
                    }
                  >
                    {isLimitReached
                      ? 'You have reached your API usage limits. Please wait or upgrade your plan.'
                      : 'You are approaching your API usage limits. Consider monitoring your usage.'}
                  </CardDescription>
                </div>
              </div>
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className={
                    isLimitReached
                      ? 'text-red-600 hover:text-red-700'
                      : 'text-yellow-600 hover:text-yellow-700'
                  }
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Warnings List */}
              <div className="space-y-2">
                {rateLimitStatus.warnings.map((warning, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      isLimitReached
                        ? 'bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'
                    }`}
                  >
                    <p
                      className={`text-sm font-medium ${
                        isLimitReached
                          ? 'text-red-900 dark:text-red-100'
                          : 'text-yellow-900 dark:text-yellow-100'
                      }`}
                    >
                      {warning}
                    </p>
                  </div>
                ))}
              </div>

              {/* Usage Details */}
              {showDetails && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Daily Usage
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Minutes:
                        </span>
                        <span className="font-medium">
                          {rateLimitStatus.usage.daily.minutesUsed.toFixed(1)}
                          {limitConfig.dailyMinutesLimit &&
                            ` / ${limitConfig.dailyMinutesLimit}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Messages:
                        </span>
                        <span className="font-medium">
                          {rateLimitStatus.usage.daily.messagesExchanged}
                          {limitConfig.dailyMessagesLimit &&
                            ` / ${limitConfig.dailyMessagesLimit}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Sessions:
                        </span>
                        <span className="font-medium">
                          {rateLimitStatus.usage.daily.sessionsCompleted}
                          {limitConfig.dailySessionsLimit &&
                            ` / ${limitConfig.dailySessionsLimit}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Monthly Usage
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Minutes:
                        </span>
                        <span className="font-medium">
                          {rateLimitStatus.usage.monthly.minutesUsed.toFixed(1)}
                          {limitConfig.monthlyMinutesLimit &&
                            ` / ${limitConfig.monthlyMinutesLimit}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Messages:
                        </span>
                        <span className="font-medium">
                          {rateLimitStatus.usage.monthly.messagesExchanged}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          Sessions:
                        </span>
                        <span className="font-medium">
                          {rateLimitStatus.usage.monthly.sessionsCompleted}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {isLimitReached ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={() => {
                      // Could link to upgrade page or settings
                      window.open('https://elevenlabs.io/pricing', '_blank');
                    }}
                  >
                    <Activity className="w-4 h-4" />
                    View Plans
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={updateRateLimitStatus}
                  >
                    Refresh Status
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

