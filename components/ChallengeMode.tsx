'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Target, CheckCircle2 } from 'lucide-react';

interface ChallengeModeProps {
  timeLimit: number; // in seconds
  goal: number; // number of objections to complete
  onComplete: (completed: number, timeUsed: number) => void;
  onCancel: () => void;
}

export default function ChallengeMode({ timeLimit, goal, onComplete, onCancel }: ChallengeModeProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [completed, setCompleted] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning && !isFinished) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsFinished(true);
            setIsRunning(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            const timeUsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
            onComplete(completed, Math.floor(timeUsed / 1000));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isFinished, completed, onComplete]);

  const handleStart = () => {
    setIsRunning(true);
    startTimeRef.current = Date.now();
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleResume = () => {
    setIsRunning(true);
  };

  const handleComplete = () => {
    setIsFinished(true);
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    const timeUsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
    onComplete(completed + 1, Math.floor(timeUsed / 1000));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = goal > 0 ? (completed / goal) * 100 : 0;
  const isUrgent = timeRemaining < 60; // Less than 1 minute
  const isWarning = timeRemaining < timeLimit * 0.3; // Less than 30% remaining

  return (
    <Card className="border-2 border-blue-500 shadow-xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            Challenge Mode
          </CardTitle>
          {!isFinished && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer */}
        <div className="text-center">
          <div className={`text-5xl font-bold mb-2 ${
            isUrgent ? 'text-red-600 animate-pulse' : 
            isWarning ? 'text-orange-600' : 
            'text-blue-600'
          }`}>
            {formatTime(timeRemaining)}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>Time Remaining</span>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">
              Completed: {completed} / {goal}
            </span>
            <span className="text-gray-500">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className={`h-3 rounded-full ${
                progress >= 100 ? 'bg-green-500' :
                progress >= 75 ? 'bg-blue-500' :
                progress >= 50 ? 'bg-yellow-500' :
                'bg-orange-500'
              }`}
            />
          </div>
        </div>

        {/* Controls */}
        {!isFinished && (
          <div className="flex gap-2 justify-center">
            {!isRunning && completed === 0 && (
              <Button onClick={handleStart} size="lg" className="bg-blue-600 hover:bg-blue-700">
                Start Challenge
              </Button>
            )}
            {isRunning && (
              <>
                <Button onClick={handlePause} variant="outline" size="lg">
                  Pause
                </Button>
                <Button onClick={handleComplete} size="lg" className="bg-green-600 hover:bg-green-700">
                  Complete Objection
                </Button>
              </>
            )}
            {!isRunning && completed > 0 && (
              <>
                <Button onClick={handleResume} size="lg" className="bg-blue-600 hover:bg-blue-700">
                  Resume
                </Button>
                <Button onClick={handleComplete} size="lg" className="bg-green-600 hover:bg-green-700">
                  Complete Objection
                </Button>
              </>
            )}
          </div>
        )}

        {/* Results */}
        {isFinished && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-green-300"
          >
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Challenge Complete!</h3>
            <div className="space-y-1 text-sm text-gray-700">
              <p>Completed: <span className="font-semibold">{completed} objections</span></p>
              <p>Goal: <span className="font-semibold">{goal} objections</span></p>
              <p>Time Used: <span className="font-semibold">{formatTime(timeLimit - timeRemaining)}</span></p>
              {completed >= goal && (
                <p className="text-green-600 font-bold mt-2">🎉 Goal Achieved!</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Instructions */}
        {!isRunning && completed === 0 && !isFinished && (
          <div className="text-sm text-gray-600 space-y-1">
            <p>• Complete {goal} objections within {formatTime(timeLimit)}</p>
            <p>• Click "Complete Objection" after practicing each one</p>
            <p>• Challenge ends when time runs out or goal is reached</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

