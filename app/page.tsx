'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Objection, Response, PracticeSession } from '@/types';
import { 
  getObjections,
  getObjectionsSync,
  saveCustomResponse, 
  savePracticeSession,
  getObjectionsNeedingPractice,
  recordPracticeHistory,
  getLatestConfidenceRating,
} from '@/lib/storage';
import { addPoints, POINTS_VALUES } from '@/lib/gamification';
import { getDueForReview, recordReview, getAllReviewSchedules } from '@/lib/spacedRepetition';
import { getCurrentPathObjection, completePathStep, isPathCompleted } from '@/lib/learningPaths';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ObjectionCard from '@/components/ObjectionCard';
import LoadingAnimation from '@/components/LoadingAnimation';
import StatsDashboard from '@/components/StatsDashboard';
import MarketIntelligence from '@/components/MarketIntelligence';
import Celebration from '@/components/Celebration';
import ChallengeMode from '@/components/ChallengeMode';
import ReviewMode from '@/components/ReviewMode';
import SwipeablePracticeView from '@/components/SwipeablePracticeView';
import ScenarioPractice from '@/components/ScenarioPractice';
import { practiceScenarios, getScenariosByDifficulty } from '@/data/scenarios';
import LearningPaths from '@/components/LearningPaths';
import KeyboardShortcutsHelp from '@/components/KeyboardShortcutsHelp';
import { ThemeToggle } from '@/components/ThemeToggle';
import DailyTip from '@/components/DailyTip';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { checkAchievements } from '@/lib/achievements';
import VoicePracticeMode from '@/components/VoicePracticeMode';
import { saveVoiceSession } from '@/lib/voiceSessionStorage';
import { VoiceSession } from '@/types';
import { Search, Filter, X, Keyboard, Mic, Home as HomeIcon } from 'lucide-react';
import OnboardingTour from '@/components/OnboardingTour';
import { getMainAppOnboardingSteps, isOnboardingCompleted } from '@/lib/onboarding';
import WelcomeScreen from '@/components/WelcomeScreen';
import UserMenu from '@/components/UserMenu';
import { getCurrentUserId, trackUserActivity } from '@/lib/auth';
import AuthGuard from '@/components/AuthGuard';

type PracticeMode = 'random' | 'category' | 'weakness' | 'challenge' | 'review' | 'spaced' | 'scenario' | 'learning-path' | 'voice';

export default function Home() {
  // Feature flag for Voice Practice
  const isVoicePracticeEnabled = process.env.NEXT_PUBLIC_ENABLE_VOICE_PRACTICE === 'true';
  
  const [allObjections, setAllObjections] = useState<Objection[]>([]);
  const [filteredObjections, setFilteredObjections] = useState<Objection[]>([]);
  const [currentObjection, setCurrentObjection] = useState<Objection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showMarketIntelligence, setShowMarketIntelligence] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('random');
  const [showFilters, setShowFilters] = useState(false);
  const sessionStartTime = useRef<number | null>(null);
  const sessionObjections = useRef<string[]>([]);
  const currentSessionId = useRef<string | null>(null);
  const [celebration, setCelebration] = useState<{ type: 'achievement' | 'streak' | 'milestone' | 'session'; message: string; icon?: string } | null>(null);
  const previousAchievements = useRef<Set<string>>(new Set());
  const [challengeConfig, setChallengeConfig] = useState<{ timeLimit: number; goal: number } | null>(null);
  const [challengeCompleted, setChallengeCompleted] = useState(0);
  const [challengeTimeUsed, setChallengeTimeUsed] = useState(0);
  const [showReviewMode, setShowReviewMode] = useState(false);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [scenarioDifficulty, setScenarioDifficulty] = useState<'beginner' | 'intermediate' | 'advanced' | 'all'>('all');
  const [selectedLearningPath, setSelectedLearningPath] = useState<string | null>(null);
  const objectionCardRef = useRef<{ revealResponses?: () => void; addResponse?: () => void } | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      try {
        const objections = await getObjections();
        if (isMounted) {
          setAllObjections(objections);
          setFilteredObjections(objections);
        }

        const initialAchievements = await checkAchievements();
        if (isMounted) {
          previousAchievements.current = new Set(
            initialAchievements.filter(a => a.unlocked).map(a => a.id)
          );
        }

        const userId = getCurrentUserId();
        if (userId) {
          void trackUserActivity(userId, 'page_view', { page: 'home' });
        }

        if (isMounted && !isOnboardingCompleted()) {
          setTimeout(() => {
            if (isMounted) {
              setShowWelcome(true);
            }
          }, 300);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    
    void loadInitialData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // Skip if allObjections is empty (still loading)
    if (allObjections.length === 0) return;

    let filtered = [...allObjections];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(obj =>
        obj.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(obj => obj.category === selectedCategory);
    }

    // Apply practice mode filter (async - will update when data loads)
    if (practiceMode === 'weakness') {
      getObjectionsNeedingPractice(3).then(needsPractice => {
        setFilteredObjections(prev => {
          const updated = getObjectionsSync();
          const filtered = updated.filter(obj => needsPractice.includes(obj.id));
          if (prev.length !== filtered.length) return filtered;
          const idsChanged = prev.some((p, i) => p.id !== filtered[i]?.id);
          return idsChanged ? filtered : prev;
        });
      });
      return; // Early return, will update via promise
    } else if (practiceMode === 'spaced') {
      Promise.all([getDueForReview(), getAllReviewSchedules()]).then(([dueForReview, allSchedules]) => {
        setFilteredObjections(prev => {
          const updated = getObjectionsSync();
          let filtered;
          if (dueForReview.length === 0) {
            const scheduledIds = allSchedules.map(s => s.objectionId);
            filtered = updated.filter(obj => scheduledIds.includes(obj.id));
          } else {
            filtered = updated.filter(obj => dueForReview.includes(obj.id));
          }
          if (prev.length !== filtered.length) return filtered;
          const idsChanged = prev.some((p, i) => p.id !== filtered[i]?.id);
          return idsChanged ? filtered : prev;
        });
      });
      return; // Early return, will update via promise
    }

    // Only update if filtered list actually changed
    setFilteredObjections(prev => {
      if (prev.length !== filtered.length) return filtered;
      // Check if any objection IDs changed
      const idsChanged = prev.some((p, i) => p.id !== filtered[i]?.id);
      if (idsChanged) return filtered;
      return prev; // No changes, return previous state
    });
  }, [searchQuery, selectedCategory, practiceMode, allObjections]);

  const getAvailableObjections = () => {
    return filteredObjections.length > 0 ? filteredObjections : allObjections;
  };

  const handleGetObjection = () => {
    // Track user activity
    const userId = getCurrentUserId();
    if (userId) {
      void trackUserActivity(userId, 'get_objection', { practiceMode });
    }
    
    const available = getAvailableObjections();
    if (available.length === 0) {
      alert('No objections match your current filters. Please adjust your search or filters.');
      return;
    }

    // Start session tracking if not already started
    if (sessionStartTime.current === null) {
      sessionStartTime.current = Date.now();
      currentSessionId.current = `session-${sessionStartTime.current}`;
      sessionObjections.current = [];
    }

    setIsLoading(true);
    setHasStarted(true);
    setCurrentObjection(null);
  };

  const handleAnimationComplete = (selectedObjection: Objection) => {
    setCurrentObjection(selectedObjection);
    setIsLoading(false);
    
    // Track objection in session
    if (!sessionObjections.current.includes(selectedObjection.id)) {
      sessionObjections.current.push(selectedObjection.id);
    }
    
    // Record practice history
    if (currentSessionId.current) {
      getLatestConfidenceRating(selectedObjection.id).then(latestRating => {
        if (latestRating) {
          recordPracticeHistory(selectedObjection.id, currentSessionId.current!, latestRating);
          recordReview(selectedObjection.id, latestRating);
        } else {
          recordPracticeHistory(selectedObjection.id, currentSessionId.current!, undefined);
        }
      });
    }
  };

  const checkForNewAchievements = async () => {
    const currentAchievements = await checkAchievements();
    const currentUnlocked = new Set(currentAchievements.filter(a => a.unlocked).map(a => a.id));
    
    // Check for new achievements
    currentUnlocked.forEach(id => {
      if (!previousAchievements.current.has(id)) {
        const achievement = currentAchievements.find(a => a.id === id);
        if (achievement) {
          // Award points for achievement
          try {
            addPoints(POINTS_VALUES.ACHIEVEMENT_UNLOCKED, `Achievement unlocked: ${achievement.name}`, {
              achievementId: id,
            });
          } catch (error) {
            console.error('Error adding points:', error);
          }
          
          setCelebration({
            type: 'achievement',
            message: achievement.name,
            icon: achievement.icon,
          });
        }
      }
    });
    
    previousAchievements.current = currentUnlocked;
  };

  const handleEndSession = async () => {
    if (sessionStartTime.current !== null) {
      const duration = practiceMode === 'challenge' && challengeTimeUsed > 0 
        ? challengeTimeUsed 
        : Math.floor((Date.now() - sessionStartTime.current) / 1000);
      const session: PracticeSession = {
        id: `session-${Date.now()}`,
        date: new Date().toISOString(),
        objectionsPracticed: [...sessionObjections.current],
        duration,
        challengeMode: practiceMode === 'challenge',
        timeLimit: challengeConfig?.timeLimit,
        goal: challengeConfig?.goal,
      };
      await savePracticeSession(session);
      
      // Award points for session
      try {
        addPoints(POINTS_VALUES.PRACTICE_SESSION, 'Completed practice session', {
          duration,
          objectionsCount: sessionObjections.current.length,
        });
      } catch (error) {
        console.error('Error adding points:', error);
      }
      
      sessionStartTime.current = null;
      currentSessionId.current = null;
      sessionObjections.current = [];
      setChallengeConfig(null);
      setChallengeCompleted(0);
      setChallengeTimeUsed(0);
      
      // Check for achievements after session ends
      setTimeout(() => {
        checkForNewAchievements();
      }, 500);
    }
    setHasStarted(false);
    setCurrentObjection(null);
  };

  const handleAddResponse = async (objectionId: string, responseText: string) => {
    // Track user activity
    const userId = getCurrentUserId();
    if (userId) {
      void trackUserActivity(userId, 'add_response', { objectionId });
    }
    
    const newResponse: Response = {
      id: `${objectionId}-custom-${Date.now()}`,
      text: responseText,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    await saveCustomResponse(objectionId, newResponse);

    // Award points for adding custom response
    try {
      addPoints(POINTS_VALUES.CUSTOM_RESPONSE, 'Added custom response', {
        objectionId,
      });
    } catch (error) {
      console.error('Error adding points:', error);
    }

    // Update local state - only update if objection actually changed
    getObjections().then(updated => {
      setAllObjections(prev => {
        // Check if any objections actually changed
        if (prev.length !== updated.length) return updated;
        const changed = prev.some((p, i) => {
          const u = updated[i];
          if (!u || p.id !== u.id) return true;
          // Check if custom responses changed
          if (p.customResponses.length !== u.customResponses.length) return true;
          return false;
        });
        return changed ? updated : prev;
      });
      
      setCurrentObjection((prev) => {
      if (!prev || prev.id !== objectionId) return prev;
      return {
        ...prev,
        customResponses: [...prev.customResponses, newResponse],
      };
      });
    });
  };

  const handleRatingChange = () => {
    // Update practice history with new rating if in a session
    if (currentObjection && currentSessionId.current) {
      getLatestConfidenceRating(currentObjection.id).then(latestRating => {
        if (latestRating) {
          recordPracticeHistory(currentObjection.id, currentSessionId.current!, latestRating);
          recordReview(currentObjection.id, latestRating);
          
          // Update learning path progress if in a path
          if (selectedLearningPath) {
            completePathStep(selectedLearningPath, currentObjection.id);
          }
        }
      });
    }
    
    // Only refresh objections if in weakness mode (needs practice filter)
    if (practiceMode === 'weakness') {
      getObjectionsNeedingPractice(3).then(needsPractice => {
        setFilteredObjections(prev => {
          const updated = getObjectionsSync();
          const filtered = updated.filter(obj => needsPractice.includes(obj.id));
          if (prev.length !== filtered.length) return filtered;
          const idsChanged = prev.some((p, i) => p.id !== filtered[i]?.id);
          return idsChanged ? filtered : prev;
        });
      });
    } else if (practiceMode === 'spaced') {
      getDueForReview().then(dueForReview => {
        setFilteredObjections(prev => {
          const updated = getObjectionsSync();
          const filtered = updated.filter(obj => dueForReview.includes(obj.id));
          if (prev.length !== filtered.length) return filtered;
          const idsChanged = prev.some((p, i) => p.id !== filtered[i]?.id);
          return idsChanged ? filtered : prev;
        });
      });
    }
  };

  const categories = Array.from(new Set(allObjections.map(obj => obj.category))).sort();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNextObjection: () => {
      if (hasStarted && !isLoading && currentObjection) {
        handleGetObjection();
      }
    },
    onRevealResponses: () => {
      if (objectionCardRef.current?.revealResponses) {
        objectionCardRef.current.revealResponses();
      }
    },
    onAddResponse: () => {
      if (objectionCardRef.current?.addResponse) {
        objectionCardRef.current.addResponse();
      }
    },
    onNewSession: () => {
      if (hasStarted) {
        handleEndSession();
      }
    },
    onCloseModal: () => {
      setShowShortcutsHelp(false);
      setShowStats(false);
      setShowFilters(false);
      setShowReviewMode(false);
    },
    onToggleHelp: () => {
      setShowShortcutsHelp(!showShortcutsHelp);
    },
  });

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <div className="flex items-center justify-end gap-2 mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
              className="relative"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard className="h-5 w-5" />
            </Button>
            <UserMenu />
            <ThemeToggle />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            ResponseReady
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Always Ready. Always Confident. Master your responses to buyer objections and build confidence in your sales conversations.
          </p>
        </header>

            {/* Daily Tip */}
            <div className="max-w-5xl mx-auto mb-6">
              <DailyTip autoShow={true} />
            </div>

            {/* Stats Dashboard Toggle */}
            <div className="max-w-5xl mx-auto mb-6 flex gap-2">
              <Button
                onClick={() => setShowStats(!showStats)}
                variant="outline"
                className="mb-4"
                data-onboarding="stats-dashboard"
                aria-label={showStats ? 'Hide statistics dashboard' : 'Show statistics dashboard'}
                aria-expanded={showStats}
              >
                {showStats ? 'Hide' : 'Show'} Stats Dashboard
              </Button>
              <Button
                onClick={() => setShowMarketIntelligence(!showMarketIntelligence)}
                variant="outline"
                className="mb-4"
                aria-label={showMarketIntelligence ? 'Hide market intelligence' : 'Show market intelligence'}
                aria-expanded={showMarketIntelligence}
              >
                {showMarketIntelligence ? 'Hide' : 'Show'} Market Intelligence
              </Button>
            </div>
          
          {showStats && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <StatsDashboard 
                onSelectObjection={(objectionId) => {
                  const objection = allObjections.find(o => o.id === objectionId);
                  if (objection) {
                    setCurrentObjection(objection);
                    setHasStarted(true);
                    setIsLoading(false);
                  }
                }}
              />
            </motion.div>
          )}

          {showMarketIntelligence && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <MarketIntelligence />
            </motion.div>
          )}
        </div>

        {/* Practice Mode Selection - Always Visible */}
        {!hasStarted && (
          <div className="max-w-5xl mx-auto mb-6">
            <Card className="shadow-lg border-2 border-blue-200">
              <CardHeader>
                <CardTitle className="text-xl">Choose Practice Mode</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Practice Mode Buttons */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-3 block">
                      Select how you want to practice:
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                      <Button
                        variant={practiceMode === 'random' ? 'default' : 'outline'}
                        size="lg"
                        className="h-auto py-4 flex flex-col items-center gap-2 min-h-[100px]"
                        onClick={() => {
                          setPracticeMode('random');
                          setChallengeConfig(null);
                        }}
                      >
                        <span className="text-lg">🎲</span>
                        <span>Random</span>
                        <span className="text-xs opacity-75">Any objection</span>
                      </Button>
                      <Button
                        variant={practiceMode === 'category' ? 'default' : 'outline'}
                        size="lg"
                        className="h-auto py-4 flex flex-col items-center gap-2 min-h-[100px]"
                        onClick={() => {
                          setPracticeMode('category');
                          setChallengeConfig(null);
                        }}
                      >
                        <span className="text-lg">📁</span>
                        <span>Category</span>
                        <span className="text-xs opacity-75">By type</span>
                      </Button>
                      <Button
                        variant={practiceMode === 'weakness' ? 'default' : 'outline'}
                        size="lg"
                        className="h-auto py-4 flex flex-col items-center gap-2 min-h-[100px]"
                        onClick={() => {
                          setPracticeMode('weakness');
                          setChallengeConfig(null);
                        }}
                      >
                        <span className="text-lg">🎯</span>
                        <span>Needs Practice</span>
                        <span className="text-xs opacity-75">Low confidence</span>
                      </Button>
                      <Button
                        variant={practiceMode === 'challenge' ? 'default' : 'outline'}
                        size="lg"
                        className="h-auto py-4 flex flex-col items-center gap-2 bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 min-h-[100px]"
                        onClick={() => {
                          setPracticeMode('challenge');
                          // Default challenge: 5 minutes, 10 objections
                          if (!challengeConfig) {
                            setChallengeConfig({ timeLimit: 300, goal: 10 });
                          }
                        }}
                      >
                        <span className="text-lg">⚡</span>
                        <span className="font-bold">Challenge</span>
                        <span className="text-xs opacity-90">Timed practice</span>
                      </Button>
                      <Button
                        variant={practiceMode === 'review' ? 'default' : 'outline'}
                        size="lg"
                        className="h-auto py-4 flex flex-col items-center gap-2 min-h-[100px]"
                        onClick={() => {
                          setPracticeMode('review');
                          setChallengeConfig(null);
                        }}
                      >
                        <span className="text-lg">📚</span>
                        <span>Review</span>
                        <span className="text-xs opacity-75">Practice history</span>
                      </Button>
                      <Button
                        variant={practiceMode === 'spaced' ? 'default' : 'outline'}
                        size="lg"
                        className="h-auto py-4 flex flex-col items-center gap-2 min-h-[100px] bg-gradient-to-br from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
                        onClick={() => {
                          setPracticeMode('spaced');
                          setChallengeConfig(null);
                        }}
                      >
                        <span className="text-lg">🔄</span>
                        <span className="font-semibold">Review Due</span>
                        <span className="text-xs opacity-90">Spaced repetition</span>
                      </Button>
                      <Button
                        variant={practiceMode === 'scenario' ? 'default' : 'outline'}
                        size="lg"
                        className="h-auto py-4 flex flex-col items-center gap-2 min-h-[100px] bg-gradient-to-br from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-0"
                        onClick={() => {
                          setPracticeMode('scenario');
                          setChallengeConfig(null);
                        }}
                      >
                        <span className="text-lg">🎭</span>
                        <span className="font-semibold">Scenario</span>
                        <span className="text-xs opacity-90">Real-world practice</span>
                      </Button>
                      <Button
                        variant={practiceMode === 'learning-path' ? 'default' : 'outline'}
                        size="lg"
                        className="h-auto py-4 flex flex-col items-center gap-2 min-h-[100px] bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0"
                        onClick={() => {
                          setPracticeMode('learning-path');
                          setChallengeConfig(null);
                        }}
                      >
                        <span className="text-lg">📚</span>
                        <span className="font-semibold">Learning Path</span>
                        <span className="text-xs opacity-90">Guided progression</span>
                      </Button>
                      {isVoicePracticeEnabled && (
                        <Button
                          variant={practiceMode === 'voice' ? 'default' : 'outline'}
                          size="lg"
                          className="h-auto py-4 flex flex-col items-center gap-2 min-h-[100px] bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0"
                          onClick={() => {
                            setPracticeMode('voice');
                            setChallengeConfig(null);
                            setHasStarted(true); // Start the voice practice mode
                          }}
                        >
                          <Mic className="w-6 h-6" />
                          <span className="font-semibold">Voice Practice</span>
                          <span className="text-xs opacity-90">AI conversation</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        {!hasStarted && (
          <div className="max-w-5xl mx-auto mb-8">
            <Card className="shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Search & Filter</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {showFilters ? 'Hide' : 'Show'} Filters
                  </Button>
                </div>
              </CardHeader>
              {showFilters && (
                <CardContent className="space-y-4">
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search objections..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* Category Filter */}
                  {practiceMode === 'category' && (
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-2 block">
                        Category
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={selectedCategory === null ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedCategory(null)}
                        >
                          All
                        </Button>
                        {categories.map(category => (
                          <Button
                            key={category}
                            variant={selectedCategory === category ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(category)}
                          >
                            {category}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Challenge Mode Configuration */}
                  {practiceMode === 'challenge' && !challengeConfig && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                      <h4 className="font-medium text-gray-800">Configure Challenge</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Time Limit (minutes)</label>
                          <select
                            defaultValue="5"
                            onChange={(e) => {
                              const timeLimit = parseInt(e.target.value) * 60;
                              setChallengeConfig({ timeLimit, goal: 10 });
                            }}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="5">5 minutes</option>
                            <option value="10">10 minutes</option>
                            <option value="15">15 minutes</option>
                            <option value="30">30 minutes</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-600 mb-1 block">Goal (objections)</label>
                          <select
                            defaultValue="10"
                            onChange={(e) => {
                              const goal = parseInt(e.target.value);
                              // Default to 5 minutes (300 seconds) if not set
                              const timeLimit = 300;
                              setChallengeConfig({ timeLimit, goal });
                            }}
                            className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="5">5 objections</option>
                            <option value="10">10 objections</option>
                            <option value="15">15 objections</option>
                            <option value="20">20 objections</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Results Count */}
                  <div className="text-sm text-gray-600">
                    {filteredObjections.length} objection{filteredObjections.length !== 1 ? 's' : ''} available
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        )}

        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {!hasStarted ? (
              <div className="text-center">
                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-3xl">Ready to Get ResponseReady?</CardTitle>
                    <CardDescription className="text-lg">
                      Click the button below to get a random objection. Practice your response,
                      view suggested answers, and add your own responses to help your team.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={handleGetObjection}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xl px-8 py-6"
                        data-onboarding="start-practice"
                      >
                        Start Practice Session
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </div>
            ) : practiceMode === 'review' ? (
              <ReviewMode
                onSelectObjection={(objection) => {
                  setCurrentObjection(objection);
                  setHasStarted(true);
                  setIsLoading(false);
                }}
              />
            ) : practiceMode === 'voice' && isVoicePracticeEnabled ? (
              <div className="max-w-4xl mx-auto">
                <VoicePracticeMode
                  onSessionEnd={(session: VoiceSession) => {
                    // Save voice session
                    saveVoiceSession(session);
                    
                    // Award points for voice practice session
                    try {
                      addPoints(POINTS_VALUES.PRACTICE_SESSION, 'Completed voice practice session', {
                        duration: session.metrics.totalDuration,
                        messagesExchanged: session.metrics.messagesExchanged,
                      });
                    } catch (error) {
                      console.error('Error adding points:', error);
                    }
                    
                    // Show celebration if significant session
                    if (session.metrics.messagesExchanged >= 10) {
                      setCelebration({
                        type: 'session',
                        message: `Great job! You completed a ${Math.floor(session.metrics.totalDuration / 60)}-minute voice practice session with ${session.metrics.messagesExchanged} messages!`,
                      });
                    }
                  }}
                />
              </div>
            ) : practiceMode === 'learning-path' ? (
              <LearningPaths
                onSelectObjection={(objectionId) => {
                  const objection = allObjections.find(o => o.id === objectionId);
                  if (objection) {
                    setCurrentObjection(objection);
                    setHasStarted(true);
                    setIsLoading(false);
                  }
                }}
                onStartPath={async (pathId) => {
                  setSelectedLearningPath(pathId);
                  const currentObjectionId = await getCurrentPathObjection(pathId);
                  if (currentObjectionId) {
                    const objection = allObjections.find(o => o.id === currentObjectionId);
                    if (objection) {
                      setCurrentObjection(objection);
                      setHasStarted(true);
                      setIsLoading(false);
                    }
                  }
                }}
              />
            ) : practiceMode === 'scenario' ? (
              selectedScenario ? (
                <ScenarioPractice
                  scenario={practiceScenarios.find(s => s.id === selectedScenario)!}
                  onComplete={() => {
                    setSelectedScenario(null);
                    setHasStarted(false);
                  }}
                  onExit={() => {
                    setSelectedScenario(null);
                    setHasStarted(false);
                    setPracticeMode('random');
                  }}
                />
              ) : (
                <div className="max-w-5xl mx-auto">
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-2xl">Choose a Scenario</CardTitle>
                      <CardDescription>
                        Practice handling multiple objections in realistic call scenarios with full context
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Difficulty Filter */}
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                            Filter by Difficulty
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant={scenarioDifficulty === 'all' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setScenarioDifficulty('all')}
                            >
                              All
                            </Button>
                            <Button
                              variant={scenarioDifficulty === 'beginner' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setScenarioDifficulty('beginner')}
                            >
                              Beginner
                            </Button>
                            <Button
                              variant={scenarioDifficulty === 'intermediate' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setScenarioDifficulty('intermediate')}
                            >
                              Intermediate
                            </Button>
                            <Button
                              variant={scenarioDifficulty === 'advanced' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setScenarioDifficulty('advanced')}
                            >
                              Advanced
                            </Button>
                          </div>
                        </div>

                        {/* Scenario List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(scenarioDifficulty === 'all'
                            ? practiceScenarios
                            : getScenariosByDifficulty(scenarioDifficulty)
                          ).map((scenario) => (
                            <Card
                              key={scenario.id}
                              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-teal-500"
                              onClick={() => {
                                setSelectedScenario(scenario.id);
                                setHasStarted(true);
                              }}
                            >
                              <CardHeader>
                                <div className="flex items-start justify-between">
                                  <CardTitle className="text-lg">{scenario.title}</CardTitle>
                                  <span className={`text-xs px-2 py-1 rounded ${
                                    scenario.difficulty === 'beginner'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                      : scenario.difficulty === 'intermediate'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  }`}>
                                    {scenario.difficulty}
                                  </span>
                                </div>
                                <CardDescription>{scenario.description}</CardDescription>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center justify-between">
                                    <span>Objections:</span>
                                    <span className="font-semibold">{scenario.objections.length}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Estimated Duration:</span>
                                    <span className="font-semibold">{scenario.estimatedDuration} min</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Property:</span>
                                    <span className="font-semibold">{scenario.property.address}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Potential Profit:</span>
                                    <span className="font-semibold text-green-600 dark:text-green-400">
                                      ${(
                                        scenario.property.arv -
                                        scenario.property.purchasePrice -
                                        scenario.property.repairEstimate
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            ) : practiceMode === 'spaced' && filteredObjections.length === 0 ? (
              <div className="text-center">
                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-3xl">No Reviews Due</CardTitle>
                    <CardDescription className="text-lg">
                      Great job! You're all caught up on your spaced repetition reviews.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-600 dark:text-gray-400">
                        Continue practicing objections to build your review schedule. The algorithm will automatically schedule reviews at optimal intervals based on your performance.
                      </p>
                      <div className="flex gap-4 justify-center">
                        <Button
                          onClick={() => setPracticeMode('random')}
                          size="lg"
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xl px-8 py-6"
                        >
                          Practice Random Objections
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : isLoading ? (
              <div>
                <LoadingAnimation 
                  objections={getAvailableObjections()} 
                  onComplete={handleAnimationComplete}
                />
              </div>
            ) : currentObjection ? (
              <SwipeablePracticeView
                currentObjection={currentObjection}
                challengeMode={practiceMode === 'challenge' && !!challengeConfig}
                challengeConfig={challengeConfig}
                onChallengeComplete={(completed, timeUsed) => {
                  setChallengeCompleted(completed);
                  setChallengeTimeUsed(timeUsed);
                  setTimeout(() => {
                    handleEndSession();
                  }, 2000);
                }}
                onChallengeCancel={() => {
                  setChallengeConfig(null);
                  setPracticeMode('random');
                }}
                onBackToMenu={() => {
                  handleEndSession();
                  setHasStarted(false);
                  setCurrentObjection(null);
                }}
                onAddResponse={handleAddResponse}
                onRatingChange={handleRatingChange}
                onUpvote={async () => {
                  // Upvote is handled in ObjectionCard, just refresh data
                  const updated = await getObjections();
                  setAllObjections(prev => {
                    // Only update if upvotes actually changed
                    const changed = prev.some((p, i) => {
                      const u = updated[i];
                      if (!u || p.id !== u.id) return true;
                      // Check if upvotes changed for any response
                      const pResponses = [...p.customResponses, ...p.defaultResponses];
                      const uResponses = [...u.customResponses, ...u.defaultResponses];
                      return pResponses.some((pr, j) => {
                        const ur = uResponses[j];
                        return !ur || (pr.upvotes || 0) !== (ur.upvotes || 0);
                      });
                    });
                    return changed ? updated : prev;
                  });
                  const updatedObj = updated.find(o => o.id === currentObjection.id);
                  if (updatedObj) {
                    setCurrentObjection(prev => {
                      if (!prev || prev.id !== updatedObj.id) return updatedObj;
                      // Check if upvotes changed
                      const prevResponses = [...prev.customResponses, ...prev.defaultResponses];
                      const newResponses = [...updatedObj.customResponses, ...updatedObj.defaultResponses];
                      const upvotesChanged = prevResponses.some((pr, i) => {
                        const nr = newResponses[i];
                        return !nr || (pr.upvotes || 0) !== (nr.upvotes || 0);
                      });
                      return upvotesChanged ? updatedObj : prev;
                    });
                  }
                }}
                    onNextObjection={async () => {
                      // If in learning path mode, advance to next step
                      if (selectedLearningPath && currentObjection) {
                        await completePathStep(selectedLearningPath, currentObjection.id);
                        // Check if path is completed
                        const completed = await isPathCompleted(selectedLearningPath);
                        if (completed) {
                          alert('Congratulations! You completed the learning path!');
                          setSelectedLearningPath(null);
                          setPracticeMode('random');
                        }
                      }
                      handleGetObjection();
                    }}
                onEndSession={handleEndSession}
                sessionCount={sessionObjections.current.length}
                onObjectionCardRef={(ref) => {
                  // Store ref in useRef to avoid state updates
                  objectionCardRef.current = ref;
                }}
              />
            ) : null}
          </AnimatePresence>
        </div>

      {/* Celebration Modal */}
      {celebration && (
        <Celebration
          type={celebration.type}
          message={celebration.message}
          icon={celebration.icon}
          onComplete={() => setCelebration(null)}
        />
      )}

      {/* Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />

      {/* Welcome Screen */}
      {showWelcome && (
        <WelcomeScreen
          onDismiss={() => {
            setShowWelcome(false);
            // Show onboarding tour after welcome screen
            setTimeout(() => {
              setShowOnboarding(true);
            }, 500);
          }}
          onStartPractice={() => {
            setShowWelcome(false);
            handleGetObjection();
            // Show onboarding tour after starting practice
            setTimeout(() => {
              setShowOnboarding(true);
            }, 1000);
          }}
        />
      )}

      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour
          steps={getMainAppOnboardingSteps()}
          onComplete={() => setShowOnboarding(false)}
          onDismiss={() => setShowOnboarding(false)}
          showSkip={true}
        />
      )}
      </div>
    </AuthGuard>
  );
}
