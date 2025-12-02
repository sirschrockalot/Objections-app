'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  getTotalSessions,
  getTotalObjectionsPracticed,
  getPracticeStreak,
  getCategoryStats,
  getObjections,
} from '@/lib/storage';
import { Trophy, Target, Flame, TrendingUp } from 'lucide-react';
import Achievements from './Achievements';

export default function StatsDashboard() {
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalObjections: 0,
    streak: 0,
    categoryStats: {} as Record<string, { practiced: number; total: number }>,
  });

  useEffect(() => {
    const loadStats = () => {
      const totalSessions = getTotalSessions();
      const totalObjections = getTotalObjectionsPracticed();
      const streak = getPracticeStreak();
      const categoryStats = getCategoryStats();
      
      setStats({
        totalSessions,
        totalObjections,
        streak,
        categoryStats,
      });
    };

    loadStats();
    // Refresh stats every second for real-time updates
    const interval = setInterval(loadStats, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalObjections = getObjections().length;
  const overallProgress = totalObjections > 0 
    ? Math.round((stats.totalObjections / totalObjections) * 100) 
    : 0;

  const categoryColors: Record<string, string> = {
    'Price': 'bg-red-500',
    'Timing': 'bg-yellow-500',
    'Trust': 'bg-purple-500',
    'Property': 'bg-green-500',
    'Financial': 'bg-blue-500',
    'Interest': 'bg-orange-500',
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Progress</h2>
      
      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Total Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.totalSessions}</div>
                <Target className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Objections Practiced</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{stats.totalObjections}</div>
                  <div className="text-xs opacity-80 mt-1">of {totalObjections} total</div>
                </div>
                <TrendingUp className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Practice Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.streak}</div>
                <Flame className="w-8 h-8 opacity-80" />
              </div>
              <div className="text-xs opacity-80 mt-1">days in a row</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{overallProgress}%</div>
                <Trophy className="w-8 h-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Category Progress */}
      {Object.keys(stats.categoryStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progress by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.categoryStats).map(([category, { practiced, total }]) => {
                const percentage = total > 0 ? Math.round((practiced / total) * 100) : 0;
                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{category}</span>
                      <span className="text-gray-500">
                        {practiced} / {total} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className={`h-2.5 rounded-full ${categoryColors[category] || 'bg-gray-500'}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      <Achievements />
    </div>
  );
}

