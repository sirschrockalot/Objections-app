'use client';

import { useEffect, useState, useCallback } from 'react';
import { getTotalPoints, getUserLevel, getPointsHistory } from '@/lib/gamification';
import { UserLevel } from '@/types';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PointsDisplay() {
  const [totalPoints, setTotalPoints] = useState(0);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [recentPoints, setRecentPoints] = useState(0);

  useEffect(() => {
    const updatePoints = () => {
      try {
        const points = getTotalPoints();
        const level = getUserLevel();
        const history = getPointsHistory(5);
        const recent = history.slice(0, 5).reduce((sum, entry) => sum + entry.points, 0);

        setTotalPoints(prev => {
          if (prev === points) return prev;
          return points;
        });
        
        setUserLevel(prev => {
          if (!prev) return level;
          // Compare key properties instead of object reference
          if (
            prev.level === level.level &&
            prev.levelName === level.levelName &&
            prev.totalPoints === level.totalPoints &&
            prev.pointsToNextLevel === level.pointsToNextLevel &&
            prev.currentLevelPoints === level.currentLevelPoints
          ) {
            return prev;
          }
          return level;
        });
        
        setRecentPoints(prev => {
          if (prev === recent) return prev;
          return recent;
        });
      } catch (error) {
        console.error('Error updating points:', error);
      }
    };

    updatePoints();
    // Refresh points every 10 seconds (further reduced to prevent loops)
    const interval = setInterval(updatePoints, 10000);
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

