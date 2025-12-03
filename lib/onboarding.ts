/**
 * Onboarding and tutorial management
 * Tracks user progress through onboarding steps and tutorials
 */

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector or element ID
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    onClick: () => void;
  };
  skipable?: boolean;
}

export interface OnboardingProgress {
  completedSteps: string[];
  currentStep?: string;
  completed: boolean;
  dismissed: boolean;
  lastUpdated: string;
}

const ONBOARDING_KEY = 'response-ready-onboarding-progress';
const ONBOARDING_DISMISSED_KEY = 'response-ready-onboarding-dismissed';

/**
 * Get onboarding progress
 */
export function getOnboardingProgress(): OnboardingProgress {
  if (typeof window === 'undefined') {
    return {
      completedSteps: [],
      completed: false,
      dismissed: false,
      lastUpdated: new Date().toISOString(),
    };
  }

  try {
    const stored = localStorage.getItem(ONBOARDING_KEY);
    if (stored) {
      return JSON.parse(stored) as OnboardingProgress;
    }
  } catch (error) {
    console.error('Error loading onboarding progress:', error);
  }

  return {
    completedSteps: [],
    completed: false,
    dismissed: false,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Save onboarding progress
 */
export function saveOnboardingProgress(progress: OnboardingProgress): void {
  if (typeof window === 'undefined') return;

  try {
    progress.lastUpdated = new Date().toISOString();
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving onboarding progress:', error);
  }
}

/**
 * Mark onboarding step as completed
 */
export function completeOnboardingStep(stepId: string): void {
  const progress = getOnboardingProgress();
  if (!progress.completedSteps.includes(stepId)) {
    progress.completedSteps.push(stepId);
    saveOnboardingProgress(progress);
  }
}

/**
 * Check if onboarding step is completed
 */
export function isOnboardingStepCompleted(stepId: string): boolean {
  const progress = getOnboardingProgress();
  return progress.completedSteps.includes(stepId);
}

/**
 * Check if onboarding is completed
 */
export function isOnboardingCompleted(): boolean {
  const progress = getOnboardingProgress();
  return progress.completed || progress.dismissed;
}

/**
 * Mark onboarding as completed
 */
export function completeOnboarding(): void {
  const progress = getOnboardingProgress();
  progress.completed = true;
  progress.completedSteps = []; // Clear steps when completed
  saveOnboardingProgress(progress);
}

/**
 * Dismiss onboarding
 */
export function dismissOnboarding(): void {
  const progress = getOnboardingProgress();
  progress.dismissed = true;
  saveOnboardingProgress(progress);
}

/**
 * Reset onboarding (for testing or re-showing)
 */
export function resetOnboarding(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ONBOARDING_KEY);
  localStorage.removeItem(ONBOARDING_DISMISSED_KEY);
}

/**
 * Get main app onboarding steps
 */
export function getMainAppOnboardingSteps(): OnboardingStep[] {
  return [
    {
      id: 'welcome',
      title: 'Welcome to ResponseReady!',
      description: 'Practice handling buyer objections and improve your real estate sales skills.',
      target: 'body',
      position: 'center',
      skipable: true,
    },
    {
      id: 'start-practice',
      title: 'Start Your First Practice Session',
      description: 'Click "Start Practice Session" to get a random objection. Practice your response, then view suggested answers.',
      target: '[data-onboarding="start-practice"]',
      position: 'top',
    },
    {
      id: 'view-responses',
      title: 'View Suggested Responses',
      description: 'Click "Show Responses" to see expert-recommended answers. You can also add your own custom responses.',
      target: '[data-onboarding="show-responses"]',
      position: 'top',
    },
    {
      id: 'add-response',
      title: 'Add Your Own Response',
      description: 'Share your own responses with your team. Click "Add Your Response" to contribute.',
      target: '[data-onboarding="add-response"]',
      position: 'top',
    },
    {
      id: 'stats-dashboard',
      title: 'Track Your Progress',
      description: 'View your practice statistics, achievements, and progress in the Stats Dashboard.',
      target: '[data-onboarding="stats-dashboard"]',
      position: 'left',
    },
  ];
}

/**
 * Get voice agent onboarding steps
 */
export function getVoiceAgentOnboardingSteps(): OnboardingStep[] {
  return [
    {
      id: 'voice-intro',
      title: 'Voice Practice Mode',
      description: 'Practice with a real AI voice agent! Have natural conversations and get real-time feedback.',
      target: '[data-onboarding="voice-mode"]',
      position: 'top',
      skipable: true,
    },
    {
      id: 'voice-connect',
      title: 'Connect to Voice Agent',
      description: 'Click "Connect & Start" to begin. Make sure your microphone is enabled.',
      target: '[data-onboarding="voice-connect"]',
      position: 'top',
    },
    {
      id: 'voice-scenarios',
      title: 'Practice with Scenarios',
      description: 'Select a scenario to practice in realistic situations with property and buyer context.',
      target: '[data-onboarding="voice-scenarios"]',
      position: 'left',
    },
    {
      id: 'voice-feedback',
      title: 'Get AI Feedback',
      description: 'After each session, review AI-powered feedback on your performance, strengths, and areas for improvement.',
      target: '[data-onboarding="voice-feedback"]',
      position: 'top',
    },
    {
      id: 'voice-goals',
      title: 'Set Practice Goals',
      description: 'Create goals to track your progress and stay motivated. View them in the Stats Dashboard.',
      target: '[data-onboarding="voice-goals"]',
      position: 'top',
    },
  ];
}

