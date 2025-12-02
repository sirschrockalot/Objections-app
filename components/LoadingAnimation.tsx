'use client';

import { Objection } from '@/types';
import { useEffect, useState, useRef } from 'react';

interface LoadingAnimationProps {
  objections: Objection[];
  onComplete: (selectedObjection: Objection) => void;
}

export default function LoadingAnimation({ objections, onComplete }: LoadingAnimationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSlowing, setIsSlowing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const totalDurationRef = useRef<number>(0);
  const slowDownStartRef = useRef<number>(0);

  useEffect(() => {
    if (objections.length === 0) return;

    // Reset state
    setCurrentIndex(0);
    setIsSlowing(false);

    // Initialize timing
    const startTime = Date.now();
    const totalDuration = 2500 + Math.random() * 1500; // 2.5-4 seconds
    const slowDownStart = totalDuration * 0.7;

    startTimeRef.current = startTime;
    totalDurationRef.current = totalDuration;
    slowDownStartRef.current = slowDownStart;

    let currentSpeed = 50; // Start fast

    const cycle = () => {
      const elapsed = Date.now() - startTimeRef.current;

      if (elapsed < slowDownStartRef.current) {
        // Fast cycling phase
        setCurrentIndex((prev) => (prev + 1) % objections.length);
        currentSpeed = 50 + Math.random() * 30; // 50-80ms
      } else if (elapsed < totalDurationRef.current) {
        // Slowing down phase
        setIsSlowing(true);
        const progress = (elapsed - slowDownStartRef.current) / (totalDurationRef.current - slowDownStartRef.current);
        currentSpeed = 50 + progress * 200 + Math.random() * 100; // Gradually slow down
        setCurrentIndex((prev) => (prev + 1) % objections.length);
      } else {
        // Stop and select final objection
        const finalIndex = Math.floor(Math.random() * objections.length);
        setCurrentIndex(finalIndex);
        setTimeout(() => {
          onComplete(objections[finalIndex]);
        }, 300);
        return;
      }

      intervalRef.current = setTimeout(cycle, currentSpeed);
    };

    // Start the cycle
    intervalRef.current = setTimeout(cycle, currentSpeed);

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [objections, onComplete]);

  if (objections.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading objections...</p>
      </div>
    );
  }

  const currentObjection = objections[currentIndex];
  
  if (!currentObjection) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading objection...</p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-[500px] overflow-hidden">
      {/* Pulsing background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 animate-pulse opacity-50 -z-10"></div>
      
      <div className="relative z-10 w-full max-w-4xl px-4">
        {/* Header with intense styling */}
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-red-600 mb-2 animate-pulse">
            ⚡ INCOMING OBJECTION ⚡
          </h3>
          <p className="text-lg text-gray-600 font-semibold">
            {isSlowing ? 'Slowing down...' : 'Cycling through objections...'}
          </p>
        </div>

        {/* Main objection display with flash effect */}
        <div className="relative">
          {/* Flash overlay for intensity */}
          <div 
            className="absolute inset-0 bg-white opacity-0 rounded-2xl"
            style={{ 
              animation: 'flash 0.1s ease-in-out infinite',
            }}
          ></div>
          
          {/* Objection card with intense styling */}
          <div 
            className={`bg-white rounded-2xl shadow-2xl p-8 border-4 transition-all duration-75 ${
              isSlowing 
                ? 'border-orange-500 shadow-orange-200' 
                : 'border-red-500 shadow-red-200'
            }`}
            style={{
              transform: isSlowing ? 'scale(1.02)' : 'scale(1)',
              boxShadow: isSlowing 
                ? '0 0 30px rgba(249, 115, 22, 0.5)' 
                : '0 0 20px rgba(239, 68, 68, 0.5)',
              animation: isSlowing ? 'none' : 'pulse-opacity 0.5s ease-in-out infinite',
            }}
          >
            <div className="text-center">
              <div className="mb-4">
                <span className="text-sm font-bold text-red-600 uppercase tracking-wider">
                  Objection #{currentIndex + 1}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 leading-relaxed">
                {currentObjection.text}
              </p>
            </div>
          </div>

          {/* Speed indicator */}
          <div className="mt-4 text-center">
            <div className="inline-flex items-center space-x-2">
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => {
                  const shouldAnimate = i < (isSlowing ? 2 : 5);
                  return (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all ${
                        shouldAnimate
                          ? 'bg-red-500'
                          : 'bg-gray-300'
                      }`}
                      style={shouldAnimate ? {
                        animationName: 'pulse-opacity',
                        animationDuration: '0.5s',
                        animationTimingFunction: 'ease-in-out',
                        animationIterationCount: 'infinite',
                        animationDelay: `${i * 100}ms`,
                      } : {}}
                    />
                  );
                })}
              </div>
              <span className="text-sm text-gray-600 font-medium">
                {isSlowing ? 'Slowing...' : 'Fast'}
              </span>
            </div>
          </div>
        </div>

        {/* Animated border effect */}
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-2">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className={`h-1 w-12 rounded-full transition-all ${
                  Math.floor((currentIndex + i) % 10) < 3
                    ? 'bg-red-500'
                    : 'bg-gray-300'
                }`}
                style={{
                  animationName: 'pulse-opacity',
                  animationDuration: '0.5s',
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite',
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
