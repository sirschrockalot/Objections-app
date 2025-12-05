'use client';

import { useState, useEffect } from 'react';
import { getReviewSchedule } from '@/lib/spacedRepetition';
import { Clock, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReviewDueBadgeProps {
  objectionId: string;
}

export default function ReviewDueBadge({ objectionId }: ReviewDueBadgeProps) {
  const [schedule, setSchedule] = useState<any>(null);

  useEffect(() => {
    getReviewSchedule(objectionId).then(setSchedule);
  }, [objectionId]);
  
  if (!schedule) return null;

  if (schedule.isDue) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full text-xs font-semibold border border-red-300 dark:border-red-700"
      >
        <Clock className="w-3 h-3" />
        <span>Review Due</span>
      </motion.div>
    );
  }

  // Show upcoming review indicator
  const daysUntil = Math.ceil(
    (new Date(schedule.nextReviewDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntil <= 3) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium border border-yellow-300 dark:border-yellow-700"
      >
        <Clock className="w-3 h-3" />
        <span>Due in {daysUntil} day{daysUntil !== 1 ? 's' : ''}</span>
      </motion.div>
    );
  }

  return null;
}

