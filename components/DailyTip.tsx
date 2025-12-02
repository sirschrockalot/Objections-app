'use client';

import { useState, useEffect } from 'react';
import type { DailyTip } from '@/types';
import { getDailyTip } from '@/data/microLearning';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X, ChevronRight } from 'lucide-react';

interface DailyTipProps {
  onDismiss?: () => void;
  autoShow?: boolean;
}

export default function DailyTip({ onDismiss, autoShow = false }: DailyTipProps) {
  const [tip, setTip] = useState<DailyTip | null>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dailyTip = getDailyTip();
    setTip(dailyTip);
    
    if (autoShow) {
      // Check if user has dismissed today's tip
      const dismissedKey = `tip-dismissed-${dailyTip.id}-${new Date().toISOString().split('T')[0]}`;
      const wasDismissed = localStorage.getItem(dismissedKey);
      if (!wasDismissed) {
        setShow(true);
      }
    }
  }, [autoShow]);

  const handleDismiss = () => {
    if (tip) {
      const dismissedKey = `tip-dismissed-${tip.id}-${new Date().toISOString().split('T')[0]}`;
      localStorage.setItem(dismissedKey, 'true');
    }
    setDismissed(true);
    setShow(false);
    onDismiss?.();
  };

  const categoryColors: Record<string, string> = {
    technique: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    psychology: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    strategy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    communication: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    closing: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  if (!tip || (!show && !autoShow)) return null;

  return (
    <AnimatePresence>
      {show && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6"
        >
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-400 dark:border-yellow-600">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    💡 Daily Tip
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className="h-6 w-6"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{tip.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[tip.category] || categoryColors.technique}`}>
                    {tip.category}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    tip.difficulty === 'beginner'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : tip.difficulty === 'intermediate'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {tip.difficulty}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{tip.content}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

