'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Trophy, Star, Flame, Target } from 'lucide-react';

interface CelebrationProps {
  type: 'achievement' | 'streak' | 'milestone' | 'session';
  message: string;
  icon?: string;
  onComplete: () => void;
}

export default function Celebration({ type, message, icon, onComplete }: CelebrationProps) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const getIcon = () => {
    if (icon) return <span className="text-6xl">{icon}</span>;
    
    switch (type) {
      case 'achievement':
        return <Trophy className="w-16 h-16 text-yellow-400" />;
      case 'streak':
        return <Flame className="w-16 h-16 text-orange-400" />;
      case 'milestone':
        return <Target className="w-16 h-16 text-blue-400" />;
      case 'session':
        return <Star className="w-16 h-16 text-purple-400" />;
      default:
        return <Star className="w-16 h-16 text-yellow-400" />;
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-400 p-8 rounded-2xl shadow-2xl text-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 0.5,
                repeat: Infinity,
                repeatDelay: 0.5
              }}
              className="mb-4 flex justify-center"
            >
              {getIcon()}
            </motion.div>
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl font-bold text-white mb-2"
            >
              {message}
            </motion.h2>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              className="flex justify-center gap-2 mt-4"
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="text-2xl"
                >
                  ⭐
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

