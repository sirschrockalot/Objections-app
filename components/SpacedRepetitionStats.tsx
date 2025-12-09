'use client';

import { useEffect, useState } from 'react';
import { error as logError } from '@/lib/logger';
import { getAllStats } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Calendar, TrendingUp, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SpacedRepetitionStats() {
  const [stats, setStats] = useState({
    totalScheduled: 0,
    dueForReview: 0,
    upcomingThisWeek: 0,
    averageInterval: 0,
    averageEaseFactor: 0,
  });

  useEffect(() => {
    const updateStats = async () => {
      try {
        // Use the batched stats API instead of individual calls
        const allStats = await getAllStats();
        const reviewStats = allStats.spacedRepetition;
        
        setStats(prev => {
          if (
            prev.totalScheduled === reviewStats.totalScheduled &&
            prev.dueForReview === reviewStats.dueForReview &&
            prev.upcomingThisWeek === reviewStats.upcomingThisWeek &&
            prev.averageInterval === reviewStats.averageInterval &&
            prev.averageEaseFactor === reviewStats.averageEaseFactor
          ) {
            return prev;
          }
          return reviewStats;
        });
      } catch (error) {
        logError('Failed to load review stats', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 30000); // Update every 30 seconds (reduced frequency)
    return () => clearInterval(interval);
  }, []);

  if (stats.totalScheduled === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Spaced Repetition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Start practicing objections to begin spaced repetition scheduling. The algorithm will automatically schedule reviews at optimal intervals based on your performance.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Spaced Repetition
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
          >
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.dueForReview}</div>
            <div className="text-xs text-red-700 dark:text-red-300 mt-1">Due for Review</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
          >
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.upcomingThisWeek}</div>
            <div className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">Upcoming This Week</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
          >
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.averageInterval}</div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">Avg Interval (days)</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
          >
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.averageEaseFactor}</div>
            <div className="text-xs text-green-700 dark:text-green-300 mt-1">Avg Ease Factor</div>
          </motion.div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            <strong>{stats.totalScheduled}</strong> objections are scheduled for spaced repetition review.
            {stats.dueForReview > 0 && (
              <span className="text-red-600 dark:text-red-400 font-semibold ml-1">
                {stats.dueForReview} need immediate review!
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

