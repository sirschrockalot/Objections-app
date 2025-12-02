'use client';

import { useState } from 'react';
import type { ResponseTechnique } from '@/types';
import { responseTechniques, getTechniquesByCategory, getTechniquesByDifficulty } from '@/data/microLearning';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

export default function ResponseTechniques() {
  const [selectedTechnique, setSelectedTechnique] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');

  const categories = Array.from(new Set(responseTechniques.map(t => t.category)));
  
  let filteredTechniques = responseTechniques;
  if (filterCategory !== 'all') {
    filteredTechniques = getTechniquesByCategory(filterCategory);
  }
  if (filterDifficulty !== 'all') {
    filteredTechniques = filteredTechniques.filter(t => t.difficulty === filterDifficulty);
  }

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    intermediate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    advanced: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Response Techniques
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">Difficulty</label>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value as any)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-700 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        {/* Techniques List */}
        <div className="space-y-3">
          {filteredTechniques.map((technique) => (
            <Card
              key={technique.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setSelectedTechnique(selectedTechnique === technique.id ? null : technique.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base mb-2">{technique.name}</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{technique.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${difficultyColors[technique.difficulty]}`}>
                      {technique.difficulty}
                    </span>
                    {selectedTechnique === technique.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <AnimatePresence>
                {selectedTechnique === technique.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <CardContent className="pt-0 space-y-4">
                      {/* Steps */}
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Steps
                        </h4>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                          {technique.steps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </div>

                      {/* Examples */}
                      <div>
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Examples</h4>
                        <div className="space-y-2">
                          {technique.examples.map((example, index) => (
                            <div
                              key={index}
                              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                            >
                              <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{example}"</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          ))}
        </div>

        {filteredTechniques.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No techniques match your filters. Try adjusting your selection.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

