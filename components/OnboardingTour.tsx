'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft, SkipForward } from 'lucide-react';
import {
  OnboardingStep,
  getOnboardingProgress,
  completeOnboardingStep,
  completeOnboarding,
  dismissOnboarding,
  isOnboardingCompleted,
} from '@/lib/onboarding';

interface OnboardingTourProps {
  steps: OnboardingStep[];
  onComplete?: () => void;
  onDismiss?: () => void;
  showSkip?: boolean;
}

export default function OnboardingTour({
  steps,
  onComplete,
  onDismiss,
  showSkip = true,
}: OnboardingTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [overlayStyle, setOverlayStyle] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = steps[currentStepIndex];
  const progress = getOnboardingProgress();

  // Check if onboarding should be shown
  useEffect(() => {
    if (isOnboardingCompleted()) {
      setIsVisible(false);
      return;
    }

    // Check if this is the first time
    if (progress.completedSteps.length === 0 && !progress.dismissed) {
      setIsVisible(true);
    } else {
      // Check if there are incomplete steps
      const incompleteSteps = steps.filter(
        (step) => !progress.completedSteps.includes(step.id)
      );
      if (incompleteSteps.length > 0) {
        const firstIncompleteIndex = steps.findIndex(
          (step) => step.id === incompleteSteps[0].id
        );
        if (firstIncompleteIndex >= 0) {
          setCurrentStepIndex(firstIncompleteIndex);
          setIsVisible(true);
        }
      }
    }
  }, [steps, progress]);

  // Position overlay and tooltip
  useEffect(() => {
    if (!isVisible || !currentStep) return;

    const updatePosition = () => {
      const targetElement = document.querySelector(currentStep.target);
      if (!targetElement) {
        // If target not found, show in center
        setOverlayStyle(null);
        return;
      }

      const rect = targetElement.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;

      setOverlayStyle({
        top: rect.top + scrollY,
        left: rect.left + scrollX,
        width: rect.width,
        height: rect.height,
      });

      // Scroll element into view if needed
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    };

    // Wait for DOM to be ready
    const timer = setTimeout(updatePosition, 100);
    updatePosition();

    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isVisible, currentStep, currentStepIndex]);

  const handleNext = useCallback(() => {
    if (currentStep) {
      completeOnboardingStep(currentStep.id);
    }

    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Tour complete
      completeOnboarding();
      setIsVisible(false);
      onComplete?.();
    }
  }, [currentStep, currentStepIndex, steps.length, onComplete]);

  const handlePrevious = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex]);

  const handleSkip = useCallback(() => {
    dismissOnboarding();
    setIsVisible(false);
    onDismiss?.();
  }, [onDismiss]);

  const handleAction = useCallback(() => {
    if (currentStep?.action) {
      currentStep.action.onClick();
      // Small delay before moving to next step
      setTimeout(handleNext, 300);
    }
  }, [currentStep, handleNext]);

  if (!isVisible || !currentStep) return null;

  const getTooltipPosition = () => {
    if (!overlayStyle) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const spacing = 20;
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    switch (currentStep.position) {
      case 'top':
        return {
          top: `${overlayStyle.top - tooltipHeight - spacing}px`,
          left: `${overlayStyle.left + overlayStyle.width / 2 - tooltipWidth / 2}px`,
        };
      case 'bottom':
        return {
          top: `${overlayStyle.top + overlayStyle.height + spacing}px`,
          left: `${overlayStyle.left + overlayStyle.width / 2 - tooltipWidth / 2}px`,
        };
      case 'left':
        return {
          top: `${overlayStyle.top + overlayStyle.height / 2 - tooltipHeight / 2}px`,
          left: `${overlayStyle.left - tooltipWidth - spacing}px`,
        };
      case 'right':
        return {
          top: `${overlayStyle.top + overlayStyle.height / 2 - tooltipHeight / 2}px`,
          left: `${overlayStyle.left + overlayStyle.width + spacing}px`,
        };
      case 'center':
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        };
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[9998]"
            onClick={currentStep.skipable ? handleSkip : undefined}
          />

          {/* Highlighted Element Overlay */}
          {overlayStyle && (
            <motion.div
              ref={overlayRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-[9999] pointer-events-none"
              style={{
                top: `${overlayStyle.top}px`,
                left: `${overlayStyle.left}px`,
                width: `${overlayStyle.width}px`,
                height: `${overlayStyle.height}px`,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 0 4px rgba(59, 130, 246, 0.8)',
                borderRadius: '8px',
              }}
            />
          )}

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed z-[10000]"
            style={getTooltipPosition()}
          >
            <Card className="w-80 shadow-2xl border-2 border-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{currentStep.title}</CardTitle>
                    <div className="text-xs text-gray-500 mt-1">
                      Step {currentStepIndex + 1} of {steps.length}
                    </div>
                  </div>
                  {showSkip && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSkip}
                      className="h-6 w-6"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <CardDescription className="text-sm">
                  {currentStep.description}
                </CardDescription>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all"
                    style={{
                      width: `${((currentStepIndex + 1) / steps.length) * 100}%`,
                    }}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    {currentStepIndex > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevious}
                        className="flex items-center gap-1"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                    )}
                    {currentStep.action && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleAction}
                        className="flex items-center gap-1"
                      >
                        {currentStep.action.label}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {showSkip && currentStep.skipable && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSkip}
                        className="flex items-center gap-1"
                      >
                        <SkipForward className="w-4 h-4" />
                        Skip
                      </Button>
                    )}
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleNext}
                      className="flex items-center gap-1"
                    >
                      {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                      {currentStepIndex < steps.length - 1 && (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

