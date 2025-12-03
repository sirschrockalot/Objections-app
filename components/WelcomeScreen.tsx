'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, Sparkles, Mic, Target, TrendingUp, BookOpen, Zap } from 'lucide-react';
import { isOnboardingCompleted, completeOnboarding } from '@/lib/onboarding';

interface WelcomeScreenProps {
  onDismiss: () => void;
  onStartPractice?: () => void;
}

const features = [
  {
    icon: Sparkles,
    title: 'Practice with Real Objections',
    description: 'Master responses to common buyer objections with expert-recommended answers.',
  },
  {
    icon: Mic,
    title: 'Voice Practice Mode',
    description: 'Practice with an AI voice agent for realistic conversation training.',
  },
  {
    icon: Target,
    title: 'Track Your Progress',
    description: 'Monitor your confidence ratings, practice streaks, and category mastery.',
  },
  {
    icon: TrendingUp,
    title: 'Gamification & Achievements',
    description: 'Earn points, unlock achievements, and level up as you improve.',
  },
  {
    icon: BookOpen,
    title: 'Structured Learning Paths',
    description: 'Follow guided paths from beginner to advanced objection handling.',
  },
  {
    icon: Zap,
    title: 'AI-Powered Feedback',
    description: 'Get detailed analysis and recommendations after each practice session.',
  },
];

const gettingStartedSteps = [
  { id: 'start-practice', label: 'Start your first practice session', completed: false },
  { id: 'view-responses', label: 'View suggested responses', completed: false },
  { id: 'add-response', label: 'Add your own response', completed: false },
  { id: 'rate-confidence', label: 'Rate your confidence', completed: false },
  { id: 'explore-stats', label: 'Explore your stats dashboard', completed: false },
];

export default function WelcomeScreen({ onDismiss, onStartPractice }: WelcomeScreenProps) {
  const [currentFeature, setCurrentFeature] = useState(0);
  const [showChecklist, setShowChecklist] = useState(false);

  // Check if user has already completed onboarding
  if (isOnboardingCompleted()) {
    return null;
  }

  const handleGetStarted = () => {
    completeOnboarding();
    onDismiss();
    if (onStartPractice) {
      onStartPractice();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
    onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-4"
        onClick={handleSkip}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-4xl w-full"
        >
          <Card className="shadow-2xl border-2 border-blue-500">
            <CardHeader className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="absolute top-4 right-4"
              >
                <X className="w-5 h-5" />
              </Button>
              <div className="text-center">
                <CardTitle className="text-4xl mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome to ResponseReady!
                </CardTitle>
                <CardDescription className="text-lg">
                  Always Ready. Always Confident.
                </CardDescription>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Master your responses to buyer objections and build confidence in your sales conversations.
                </p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Feature Highlights Carousel */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-center">Key Features</h3>
                <div className="relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentFeature}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-600 rounded-lg text-white">
                          {(() => {
                            const IconComponent = features[currentFeature].icon;
                            return IconComponent ? <IconComponent className="w-6 h-6" /> : null;
                          })()}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold mb-2">
                            {features[currentFeature].title}
                          </h4>
                          <p className="text-gray-700 dark:text-gray-300">
                            {features[currentFeature].description}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Feature Indicators */}
                  <div className="flex justify-center gap-2 mt-4">
                    {features.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentFeature(index)}
                        className={`w-2 h-2 rounded-full transition-all ${
                          index === currentFeature
                            ? 'bg-blue-600 w-8'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Getting Started Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Getting Started</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowChecklist(!showChecklist)}
                  >
                    {showChecklist ? 'Hide' : 'Show'} Checklist
                  </Button>
                </div>
                {showChecklist && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                  >
                    {gettingStartedSteps.map((step) => (
                      <div key={step.id} className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {step.label}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1"
                >
                  Skip Tour
                </Button>
                <Button
                  onClick={handleGetStarted}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Get Started
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

