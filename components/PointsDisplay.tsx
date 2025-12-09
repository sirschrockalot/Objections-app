'use client';

import { useEffect, useState } from 'react';
import { error as logError } from '@/lib/logger';
import { getAllStats } from '@/lib/storage';
import { UserLevel } from '@/types';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PointsDisplay() {
  const [totalPoints, setTotalPoints] = useState(0);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [recentPoints, setRecentPoints] = useState(0);

  useEffect(() => {
    const updatePoints = async () => {
      try {
        // Use the batched stats API instead of individual calls
        const allStats = await getAllStats();

        setTotalPoints(prev => {
          if (prev === allStats.totalPoints) return prev;
          return allStats.totalPoints;
        });
        
        setUserLevel(prev => {
          if (!prev) return allStats.userLevel;
          // Compare key properties instead of object reference
          if (
            prev.level === allStats.userLevel.level &&
            prev.levelName === allStats.userLevel.levelName &&
            prev.totalPoints === allStats.userLevel.totalPoints &&
            prev.pointsToNextLevel === allStats.userLevel.pointsToNextLevel &&
            prev.currentLevelPoints === allStats.userLevel.currentLevelPoints
          ) {
            return prev;
          }
          return allStats.userLevel;
        });
        
        setRecentPoints(prev => {
          if (prev === allStats.recentPoints) return prev;
          return allStats.recentPoints;
        });
      } catch (error) {
        logError('Failed to update points', error);
      }
    };

    updatePoints();
    // Refresh points every 30 seconds (reduced frequency since we're batching)
    const interval = setInterval(updatePoints, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!userLevel) return null;

  const progressPercentage = userLevel.pointsToNextLevel > 0
    ? Math.min((userLevel.currentLevelPoints / (userLevel.pointsToNextLevel + userLevel.currentLevelPoints)) * 100, 100)
    : 100;

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-lg p-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Current Level</h3>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              <span className="text-2xl font-bold">{userLevel.levelName}</span>
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-medium opacity-90 mb-1">Total Points</h3>
            <div className="flex items-center gap-1">
              <Star className="w-5 h-5" />
              <span className="text-2xl font-bold">{totalPoints.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {userLevel.pointsToNextLevel > 0 ? (
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="opacity-90">Progress to next level</span>
              <span className="opacity-90">{userLevel.pointsToNextLevel} points needed</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.5 }}
                className="bg-white h-full rounded-full"
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-2">
            <span className="text-sm opacity-90">🏆 Maximum level reached!</span>
          </div>
        )}
      </div>

      {recentPoints > 0 && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
          <span className="text-sm text-green-800 dark:text-green-200">
            +{recentPoints} points from recent activity
          </span>
        </div>
      )}
    </div>
  );
}

