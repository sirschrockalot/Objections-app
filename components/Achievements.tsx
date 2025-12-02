'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { Achievement, checkAchievements } from '@/lib/achievements';
import { Trophy, Lock } from 'lucide-react';

export default function Achievements() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  useEffect(() => {
    const loadAchievements = () => {
      setAchievements(checkAchievements());
    };

    loadAchievements();
    const interval = setInterval(loadAchievements, 2000);
    return () => clearInterval(interval);
  }, []);

  const unlocked = achievements.filter(a => a.unlocked);
  const locked = achievements.filter(a => !a.unlocked);
  const displayAchievements = showUnlockedOnly ? unlocked : achievements;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Achievements
          </CardTitle>
          <button
            onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showUnlockedOnly ? 'Show All' : 'Show Unlocked Only'}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {unlocked.length} of {achievements.length} unlocked
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {displayAchievements.map((achievement, index) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg border-2 ${
                  achievement.unlocked
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-3xl">
                    {achievement.unlocked ? achievement.icon : '🔒'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${
                        achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {achievement.name}
                      </h3>
                      {achievement.unlocked && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-yellow-500"
                        >
                          ✓
                        </motion.div>
                      )}
                    </div>
                    <p className={`text-xs ${
                      achievement.unlocked ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {achievement.description}
                    </p>
                    {achievement.unlocked && achievement.unlockedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}

