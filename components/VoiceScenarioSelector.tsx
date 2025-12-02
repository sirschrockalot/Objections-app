'use client';

import { useState } from 'react';
import { VoiceScenario } from '@/data/voiceScenarios';
import { getVoiceScenariosByDifficulty, getVoiceScenarioById } from '@/data/voiceScenarios';
import { getScenarioStats } from '@/lib/voiceScenarioStorage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Target, TrendingUp, Play, Info } from 'lucide-react';

interface VoiceScenarioSelectorProps {
  onSelectScenario: (scenario: VoiceScenario) => void;
  selectedScenarioId?: string;
}

export default function VoiceScenarioSelector({
  onSelectScenario,
  selectedScenarioId,
}: VoiceScenarioSelectorProps) {
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [selectedScenario, setSelectedScenario] = useState<VoiceScenario | null>(
    selectedScenarioId ? getVoiceScenarioById(selectedScenarioId) || null : null
  );

  const scenarios = getVoiceScenariosByDifficulty(difficultyFilter);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-400';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const handleSelectScenario = (scenario: VoiceScenario) => {
    setSelectedScenario(scenario);
  };

  const handleStartScenario = () => {
    if (selectedScenario) {
      onSelectScenario(selectedScenario);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={difficultyFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDifficultyFilter('all')}
        >
          All
        </Button>
        <Button
          variant={difficultyFilter === 'beginner' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDifficultyFilter('beginner')}
        >
          Beginner
        </Button>
        <Button
          variant={difficultyFilter === 'intermediate' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDifficultyFilter('intermediate')}
        >
          Intermediate
        </Button>
        <Button
          variant={difficultyFilter === 'advanced' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDifficultyFilter('advanced')}
        >
          Advanced
        </Button>
      </div>

      {/* Scenario List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.map((scenario) => {
          const stats = getScenarioStats(scenario.id);
          const isSelected = selectedScenario?.id === scenario.id;

          return (
            <Card
              key={scenario.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleSelectScenario(scenario)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{scenario.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {scenario.description}
                    </CardDescription>
                  </div>
                  <Badge className={getDifficultyColor(scenario.difficulty)}>
                    {scenario.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Context Preview */}
                  <div className="text-sm space-y-1">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Target className="w-4 h-4" />
                      <span>
                        {scenario.context.property.propertyType} • ${scenario.context.property.purchasePrice.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>~{scenario.estimatedDuration} min</span>
                    </div>
                    {stats.totalSessions > 0 && (
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <TrendingUp className="w-4 h-4" />
                        <span>Practiced {stats.totalSessions} time{stats.totalSessions !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>

                  {/* Buyer Type */}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Buyer: {scenario.context.buyer.type.replace(/-/g, ' ')}
                  </div>

                  {/* Expected Objections Count */}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {scenario.expectedObjections.length} expected objection{scenario.expectedObjections.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Selected Scenario Details */}
      {selectedScenario && (
        <Card className="border-2 border-blue-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Selected: {selectedScenario.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  {selectedScenario.description}
                </CardDescription>
              </div>
              <Badge className={getDifficultyColor(selectedScenario.difficulty)}>
                {selectedScenario.difficulty}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Property Context */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Property Context
              </h4>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-1 text-sm">
                <div><strong>Address:</strong> {selectedScenario.context.property.address}</div>
                <div><strong>ARV:</strong> ${selectedScenario.context.property.arv.toLocaleString()}</div>
                <div><strong>Purchase Price:</strong> ${selectedScenario.context.property.purchasePrice.toLocaleString()}</div>
                <div><strong>Condition:</strong> {selectedScenario.context.property.condition}</div>
                <div><strong>Type:</strong> {selectedScenario.context.property.propertyType}</div>
              </div>
            </div>

            {/* Buyer Profile */}
            <div>
              <h4 className="font-semibold mb-2">Buyer Profile</h4>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-1 text-sm">
                <div><strong>Type:</strong> {selectedScenario.context.buyer.type.replace(/-/g, ' ')}</div>
                <div><strong>Experience:</strong> {selectedScenario.context.buyer.experience}</div>
                <div><strong>Budget:</strong> ${selectedScenario.context.buyer.budget.toLocaleString()}</div>
                <div><strong>Concerns:</strong> {selectedScenario.context.buyer.concerns.join(', ')}</div>
              </div>
            </div>

            {/* Success Criteria */}
            <div>
              <h4 className="font-semibold mb-2">Success Criteria</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {selectedScenario.successCriteria.map((criterion, index) => (
                  <li key={index}>{criterion}</li>
                ))}
              </ul>
            </div>

            {/* Start Button */}
            <Button
              onClick={handleStartScenario}
              className="w-full"
              size="lg"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Scenario Practice
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

