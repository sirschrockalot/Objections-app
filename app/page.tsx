'use client';

import { useState, useEffect, useRef } from 'react';
import { Objection, Response, PracticeSession } from '@/types';
import { 
  getObjections, 
  saveCustomResponse, 
  savePracticeSession,
  getObjectionsNeedingPractice,
} from '@/lib/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ObjectionCard from '@/components/ObjectionCard';
import LoadingAnimation from '@/components/LoadingAnimation';
import StatsDashboard from '@/components/StatsDashboard';
import Celebration from '@/components/Celebration';
import ChallengeMode from '@/components/ChallengeMode';
import { checkAchievements } from '@/lib/achievements';
import { Search, Filter, X } from 'lucide-react';

type PracticeMode = 'random' | 'category' | 'weakness' | 'challenge';

export default function Home() {
  const [allObjections, setAllObjections] = useState<Objection[]>([]);
  const [filteredObjections, setFilteredObjections] = useState<Objection[]>([]);
  const [currentObjection, setCurrentObjection] = useState<Objection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('random');
  const [showFilters, setShowFilters] = useState(false);
  const sessionStartTime = useRef<number | null>(null);
  const sessionObjections = useRef<string[]>([]);
  const [celebration, setCelebration] = useState<{ type: 'achievement' | 'streak' | 'milestone' | 'session'; message: string; icon?: string } | null>(null);
  const previousAchievements = useRef<Set<string>>(new Set());
  const [challengeConfig, setChallengeConfig] = useState<{ timeLimit: number; goal: number } | null>(null);
  const [challengeCompleted, setChallengeCompleted] = useState(0);
  const [challengeTimeUsed, setChallengeTimeUsed] = useState(0);

  useEffect(() => {
    const objections = getObjections();
    setAllObjections(objections);
    setFilteredObjections(objections);
    
    // Initialize previous achievements
    const initialAchievements = checkAchievements();
    previousAchievements.current = new Set(
      initialAchievements.filter(a => a.unlocked).map(a => a.id)
    );
  }, []);

  useEffect(() => {
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

    // Apply practice mode filter
    if (practiceMode === 'weakness') {
      const needsPractice = getObjectionsNeedingPractice(3);
      filtered = filtered.filter(obj => needsPractice.includes(obj.id));
    }

    setFilteredObjections(filtered);
  }, [searchQuery, selectedCategory, practiceMode, allObjections]);

  const getAvailableObjections = () => {
    return filteredObjections.length > 0 ? filteredObjections : allObjections;
  };

  const handleGetObjection = () => {
    const available = getAvailableObjections();
    if (available.length === 0) {
      alert('No objections match your current filters. Please adjust your search or filters.');
      return;
    }

    // Start session tracking if not already started
    if (sessionStartTime.current === null) {
      sessionStartTime.current = Date.now();
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
  };

  const checkForNewAchievements = () => {
    const currentAchievements = checkAchievements();
    const currentUnlocked = new Set(currentAchievements.filter(a => a.unlocked).map(a => a.id));
    
    // Check for new achievements
    currentUnlocked.forEach(id => {
      if (!previousAchievements.current.has(id)) {
        const achievement = currentAchievements.find(a => a.id === id);
        if (achievement) {
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

  const handleEndSession = () => {
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
      savePracticeSession(session);
      sessionStartTime.current = null;
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

  const handleAddResponse = (objectionId: string, responseText: string) => {
    const newResponse: Response = {
      id: `${objectionId}-custom-${Date.now()}`,
      text: responseText,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    saveCustomResponse(objectionId, newResponse);

    // Update local state
    const updated = getObjections();
    setAllObjections(updated);
    setCurrentObjection((prev) => {
      if (!prev || prev.id !== objectionId) return prev;
      return {
        ...prev,
        customResponses: [...prev.customResponses, newResponse],
      };
    });
  };

  const handleRatingChange = () => {
    // Refresh objections to update filtered list for weakness mode
    const updated = getObjections();
    setAllObjections(updated);
  };

  const categories = Array.from(new Set(allObjections.map(obj => obj.category))).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Objection Practice
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Master your responses to buyer objections and build confidence in your sales conversations
          </p>
        </header>

        {/* Stats Dashboard Toggle */}
        <div className="max-w-5xl mx-auto mb-6">
          <Button
            onClick={() => setShowStats(!showStats)}
            variant="outline"
            className="mb-4"
          >
            {showStats ? 'Hide' : 'Show'} Stats Dashboard
          </Button>
          
          {showStats && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <StatsDashboard />
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button
                        variant={practiceMode === 'random' ? 'default' : 'outline'}
                        size="lg"
                        className="h-auto py-4 flex flex-col items-center gap-2"
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
                        className="h-auto py-4 flex flex-col items-center gap-2"
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
                        className="h-auto py-4 flex flex-col items-center gap-2"
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
                        className="h-auto py-4 flex flex-col items-center gap-2 bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0"
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
                    <CardTitle className="text-3xl">Ready to Practice?</CardTitle>
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
                      >
                        Start Practice Session
                      </Button>
                    </motion.div>
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
              <div className="space-y-6">
                {/* Challenge Mode Display */}
                {practiceMode === 'challenge' && challengeConfig && (
                  <ChallengeMode
                    timeLimit={challengeConfig.timeLimit}
                    goal={challengeConfig.goal}
                    onComplete={(completed, timeUsed) => {
                      setChallengeCompleted(completed);
                      setChallengeTimeUsed(timeUsed);
                      // End session after challenge
                      setTimeout(() => {
                        handleEndSession();
                      }, 2000);
                    }}
                    onCancel={() => {
                      setChallengeConfig(null);
                      setPracticeMode('random');
                    }}
                  />
                )}

                <ObjectionCard
                  objection={currentObjection}
                  onAddResponse={handleAddResponse}
                  onRatingChange={handleRatingChange}
                  onUpvote={() => {
                    const updated = getObjections();
                    setAllObjections(updated);
                    const updatedObj = updated.find(o => o.id === currentObjection.id);
                    if (updatedObj) {
                      setCurrentObjection(updatedObj);
                    }
                  }}
                />
                <div className="text-center space-y-4">
                  <div className="flex gap-4 justify-center flex-wrap">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={handleGetObjection}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xl px-8 py-6"
                      >
                        Get Next Objection
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={handleEndSession}
                        size="lg"
                        variant="outline"
                        className="text-xl px-8 py-6"
                      >
                        End Session
                      </Button>
                    </motion.div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {sessionObjections.current.length} objection{sessionObjections.current.length !== 1 ? 's' : ''} practiced this session
                  </p>
                </div>
              </div>
            ) : null}
          </AnimatePresence>
        </div>
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
    </div>
  );
}
