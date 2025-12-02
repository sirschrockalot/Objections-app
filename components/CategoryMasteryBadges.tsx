'use client';

import { useEffect, useState } from 'react';
import { getCategoryMastery } from '@/lib/gamification';
import { CategoryMastery } from '@/types';
import { Award, Trophy, Star, Target } from 'lucide-react';
import { motion } from 'framer-motion';

const categoryColors: Record<string, string> = {
  'Price': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-300 dark:border-red-700',
  'Timing': 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700',
  'Trust': 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700',
  'Property': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700',
  'Financial': 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700',
  'Interest': 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700',
};

const badgeIcons: Record<string, any> = {
  'Master': Trophy,
  'Expert': Award,
  'Proficient': Star,
  'Competent': Target,
};

export default function CategoryMasteryBadges() {
  const [mastery, setMastery] = useState<CategoryMastery[]>([]);

  useEffect(() => {
    const loadMastery = () => {
      try {
        const newMastery = getCategoryMastery();
        setMastery(prev => {
          // Only update if mastery data actually changed
          if (prev.length !== newMastery.length) return newMastery;
          
          const changed = prev.some((p, i) => {
            const n = newMastery[i];
            return !n || 
                   p.category !== n.category ||
                   p.masteryLevel !== n.masteryLevel ||
                   p.objectionsPracticed !== n.objectionsPracticed ||
                   p.totalObjections !== n.totalObjections ||
                   p.averageConfidence !== n.averageConfidence ||
                   p.badgeEarned !== n.badgeEarned;
          });
          
          return changed ? newMastery : prev;
        });
      } catch (error) {
        console.error('Error loading mastery:', error);
      }
    };
    
    loadMastery();
    // Only refresh every 10 seconds to prevent loops
    const interval = setInterval(loadMastery, 10000);
    return () => clearInterval(interval);
  }, []);

  if (mastery.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <Award className="w-5 h-5" />
        Category Mastery
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mastery.map((category) => {
          const BadgeIcon = category.badgeEarned ? badgeIcons[category.badgeEarned] : null;
          const colorClass = categoryColors[category.category] || categoryColors['Price'];

          return (
            <motion.div
              key={category.category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border-2 rounded-lg p-4 ${colorClass}`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">{category.category}</h4>
                {BadgeIcon && (
                  <BadgeIcon className="w-5 h-5" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="opacity-75">Mastery Level</span>
                  <span className="font-bold">{category.masteryLevel}%</span>
                </div>
                <div className="w-full bg-white/30 dark:bg-black/20 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${category.masteryLevel}%` }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="bg-current h-full rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between text-xs opacity-75">
                  <span>{category.objectionsPracticed}/{category.totalObjections} practiced</span>
                  <span>Avg confidence: {category.averageConfidence}/5</span>
                </div>
                {category.badgeEarned && (
                  <div className="mt-2 pt-2 border-t border-current/20">
                    <span className="text-xs font-medium">🏆 {category.badgeEarned} Badge Earned!</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

