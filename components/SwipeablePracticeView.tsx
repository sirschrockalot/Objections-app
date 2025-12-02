'use client';

import { Objection } from '@/types';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import ObjectionCard, { ObjectionCardRef } from './ObjectionCard';
import ChallengeMode from './ChallengeMode';
import { useSwipe } from '@/hooks/useSwipe';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useRef } from 'react';

interface SwipeablePracticeViewProps {
  currentObjection: Objection;
  challengeMode: boolean;
  challengeConfig: { timeLimit: number; goal: number } | null;
  onChallengeComplete: (completed: number, timeUsed: number) => void;
  onChallengeCancel: () => void;
  onAddResponse: (objectionId: string, responseText: string) => void;
  onRatingChange: () => void;
  onUpvote: () => void;
  onNextObjection: () => void;
  onEndSession: () => void;
  sessionCount: number;
  onObjectionCardRef?: (ref: ObjectionCardRef | null) => void;
}

export default function SwipeablePracticeView({
  currentObjection,
  challengeMode,
  challengeConfig,
  onChallengeComplete,
  onChallengeCancel,
  onAddResponse,
  onRatingChange,
  onUpvote,
  onNextObjection,
  onEndSession,
  sessionCount,
  onObjectionCardRef,
}: SwipeablePracticeViewProps) {
  const objectionCardRef = useRef<ObjectionCardRef>(null);
  // Swipe left to get next objection
  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      onNextObjection();
    },
  }, 80); // Higher threshold for intentional swipes

  return (
    <div
      {...swipeHandlers}
      className="space-y-6 touch-pan-y"
    >
      {/* Swipe Indicator */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
          <ChevronLeft className="w-4 h-4" />
          <span>Swipe left for next</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Challenge Mode Display */}
      {challengeMode && challengeConfig && (
        <ChallengeMode
          timeLimit={challengeConfig.timeLimit}
          goal={challengeConfig.goal}
          onComplete={onChallengeComplete}
          onCancel={onChallengeCancel}
        />
      )}

      <ObjectionCard
        ref={(ref) => {
          objectionCardRef.current = ref;
          if (onObjectionCardRef) {
            onObjectionCardRef(ref);
          }
        }}
        objection={currentObjection}
        onAddResponse={onAddResponse}
        onRatingChange={onRatingChange}
        onUpvote={onUpvote}
      />
      
      <div className="text-center space-y-4">
        <div className="flex gap-4 justify-center flex-wrap">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onNextObjection}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xl px-8 py-6 min-h-[56px] min-w-[200px]"
            >
              Get Next Objection
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onEndSession}
              size="lg"
              variant="outline"
              className="text-xl px-8 py-6 min-h-[56px] min-w-[200px]"
            >
              End Session
            </Button>
          </motion.div>
        </div>
        <p className="text-sm text-gray-500">
          {sessionCount} objection{sessionCount !== 1 ? 's' : ''} practiced this session
        </p>
      </div>
    </div>
  );
}

