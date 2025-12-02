'use client';

import { useState, useEffect } from 'react';
import type { LearningPath } from '@/types';
import { getAllLearningPaths, getBeginnerPath, getCategoryMasteryPaths, hasCompletedPrerequisites } from '@/data/learningPaths';
import {
  getPathProgress,
  startLearningPath,
  getPathCompletionPercentage,
  isPathCompleted,
  getCompletedPaths,
  getDailyChallenge,
  completeDailyChallenge,
} from '@/lib/learningPaths';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { BookOpen, Target, CheckCircle2, Lock, TrendingUp, Calendar, Award } from 'lucide-react';
import { getObjections } from '@/lib/storage';

interface LearningPathsProps {
  onSelectObjection?: (objectionId: string) => void;
  onStartPath?: (pathId: string) => void;
}

export default function LearningPaths({ onSelectObjection, onStartPath }: LearningPathsProps) {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [dailyChallenge, setDailyChallenge] = useState<any>(null);
  const [completedPaths, setCompletedPaths] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'paths' | 'challenge'>('paths');

  useEffect(() => {
    const allPaths = getAllLearningPaths();
    setPaths(allPaths);
    
    const challenge = getDailyChallenge();
    setDailyChallenge(challenge);
    
    const completed = getCompletedPaths();
    setCompletedPaths(completed);
  }, []);

  const handleStartPath = (pathId: string) => {
    startLearningPath(pathId);
    if (onStartPath) {
      onStartPath(pathId);
    }
    setSelectedPath(pathId);
  };

  const handlePracticeCurrent = (pathId: string) => {
    const { getLearningPathById } = require('@/data/learningPaths');
    const path = getLearningPathById(pathId);
    const progress = getPathProgress(pathId);
    
    if (path && progress) {
      const currentObjectionId = path.objections[progress.currentStep];
      if (currentObjectionId && onSelectObjection) {
        onSelectObjection(currentObjectionId);
      }
    }
  };

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  const objections = getObjections();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Learning Paths
        </h2>
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'paths' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('paths')}
          >
            <Target className="w-4 h-4 mr-2" />
            Paths
          </Button>
          <Button
            variant={activeTab === 'challenge' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('challenge')}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Daily Challenge
          </Button>
        </div>
      </div>

      {activeTab === 'challenge' && dailyChallenge && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-400">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <CardTitle className="text-xl text-gray-900 dark:text-white">
                  📅 Today's Challenge
                </CardTitle>
              </div>
              {dailyChallenge.completed && (
                <span className="text-sm text-green-600 dark:text-green-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Completed
                </span>
              )}
            </div>
            <CardDescription>
              {dailyChallenge.theme && (
                <span className="text-purple-700 dark:text-purple-300 font-medium">
                  Theme: {dailyChallenge.theme}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Practice these {dailyChallenge.objections.length} objections today to complete your daily challenge!
            </p>
            <div className="space-y-2">
              {dailyChallenge.objections.map((objectionId: string) => {
                const objection = objections.find(o => o.id === objectionId);
                return objection ? (
                  <div
                    key={objectionId}
                    className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-800"
                  >
                    <p className="text-sm text-gray-900 dark:text-white">"{objection.text}"</p>
                    <span className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
                      difficultyColors[objection.difficulty || 'beginner']
                    }`}>
                      {objection.difficulty || 'beginner'}
                    </span>
                  </div>
                ) : null;
              })}
            </div>
            <Button
              onClick={() => {
                if (dailyChallenge.objections.length > 0 && onSelectObjection) {
                  onSelectObjection(dailyChallenge.objections[0]);
                }
              }}
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={dailyChallenge.completed}
            >
              {dailyChallenge.completed ? 'Challenge Completed!' : 'Start Daily Challenge'}
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'paths' && (
        <div className="space-y-6">
          {/* Beginner Path */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recommended for Beginners
            </h3>
            {(() => {
              const beginner = getBeginnerPath();
              const progress = getPathProgress(beginner.id);
              const completed = isPathCompleted(beginner.id);
              const percentage = getPathCompletionPercentage(beginner.id);
              const canStart = hasCompletedPrerequisites(beginner.id, completedPaths);

              return (
                <Card className={completed ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-400' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl">{beginner.name}</CardTitle>
                        <CardDescription>{beginner.description}</CardDescription>
                      </div>
                      {completed && (
                        <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {beginner.objections.length} objections • {beginner.estimatedDuration} min
                      </span>
                      <span className={`px-2 py-1 rounded-full ${difficultyColors[beginner.difficulty]}`}>
                        {beginner.difficulty}
                      </span>
                    </div>
                    {progress && (
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-700 dark:text-gray-300">Progress</span>
                          <span className="font-semibold">{percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            className="bg-blue-600 h-2 rounded-full"
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {!progress ? (
                        <Button
                          onClick={() => handleStartPath(beginner.id)}
                          disabled={!canStart}
                          className="flex-1"
                        >
                          {!canStart ? (
                            <>
                              <Lock className="w-4 h-4 mr-2" />
                              Prerequisites Required
                            </>
                          ) : (
                            <>
                              <Target className="w-4 h-4 mr-2" />
                              Start Path
                            </>
                          )}
                        </Button>
                      ) : completed ? (
                        <Button variant="outline" className="flex-1" disabled>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Path Completed!
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={() => handlePracticeCurrent(beginner.id)}
                            className="flex-1"
                          >
                            Practice Current
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedPath(selectedPath === beginner.id ? null : beginner.id)}
                          >
                            View Details
                          </Button>
                        </>
                      )}
                    </div>
                    {selectedPath === beginner.id && (
                      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h4 className="font-semibold mb-2 text-sm">Path Steps:</h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm">
                          {beginner.objections.map((objectionId, index) => {
                            const objection = objections.find(o => o.id === objectionId);
                            const isCompleted = progress?.completedSteps.has(objectionId);
                            return (
                              <li
                                key={objectionId}
                                className={isCompleted ? 'text-green-600 dark:text-green-400 line-through' : ''}
                              >
                                {objection?.text || `Objection ${index + 1}`}
                                {isCompleted && <CheckCircle2 className="w-3 h-3 inline ml-1" />}
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </div>

          {/* Category Mastery Paths */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Category Mastery Paths
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getCategoryMasteryPaths().map((path) => {
                const progress = getPathProgress(path.id);
                const completed = isPathCompleted(path.id);
                const percentage = getPathCompletionPercentage(path.id);
                const canStart = hasCompletedPrerequisites(path.id, completedPaths);

                return (
                  <Card key={path.id} className={completed ? 'bg-green-50 dark:bg-green-900/20 border border-green-400' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{path.name}</CardTitle>
                        {completed && (
                          <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      <CardDescription className="text-xs">{path.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 dark:text-gray-400">
                          {path.objections.length} objections
                        </span>
                        <span className={`px-2 py-1 rounded-full ${difficultyColors[path.difficulty]}`}>
                          {path.difficulty}
                        </span>
                      </div>
                      {progress && (
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span className="font-semibold">{percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              className="bg-blue-600 h-1.5 rounded-full"
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        {!progress ? (
                          <Button
                            onClick={() => handleStartPath(path.id)}
                            disabled={!canStart}
                            size="sm"
                            className="flex-1 text-xs"
                          >
                            {!canStart ? (
                              <>
                                <Lock className="w-3 h-3 mr-1" />
                                Locked
                              </>
                            ) : (
                              'Start'
                            )}
                          </Button>
                        ) : completed ? (
                          <Button variant="outline" size="sm" className="flex-1 text-xs" disabled>
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Done
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handlePracticeCurrent(path.id)}
                            size="sm"
                            className="flex-1 text-xs"
                          >
                            Continue
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

