'use client';

import { useState, useEffect } from 'react';
import { PracticeScenario, ScenarioObjection, Objection } from '@/types';
import { getObjections } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, User, TrendingUp, MessageSquare, ChevronRight, ChevronLeft, CheckCircle2, XCircle } from 'lucide-react';
import ObjectionCard, { ObjectionCardRef } from './ObjectionCard';

interface ScenarioPracticeProps {
  scenario: PracticeScenario;
  onComplete: () => void;
  onExit: () => void;
}

export default function ScenarioPractice({ scenario, onComplete, onExit }: ScenarioPracticeProps) {
  const [currentObjectionIndex, setCurrentObjectionIndex] = useState(0);
  const [completedObjections, setCompletedObjections] = useState<Set<string>>(new Set());
  const [showContext, setShowContext] = useState(true);
  const [currentObjection, setCurrentObjection] = useState<Objection | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpResponse, setFollowUpResponse] = useState<string>('');
  const [scenarioComplete, setScenarioComplete] = useState(false);

  const allObjections = getObjections();
  const currentScenarioObjection = scenario.objections[currentObjectionIndex];
  const isLastObjection = currentObjectionIndex === scenario.objections.length - 1;

  useEffect(() => {
    if (currentScenarioObjection) {
      const objection = allObjections.find(o => o.id === currentScenarioObjection.objectionId);
      setCurrentObjection(objection || null);
    }
  }, [currentObjectionIndex, currentScenarioObjection, allObjections]);

  const handleObjectionComplete = () => {
    if (currentScenarioObjection) {
      setCompletedObjections(prev => new Set([...prev, currentScenarioObjection.objectionId]));
      
      // Check if there's a follow-up
      if (currentScenarioObjection.followUp && !showFollowUp) {
        setShowFollowUp(true);
      } else {
        // Move to next objection or complete scenario
        if (isLastObjection) {
          setScenarioComplete(true);
        } else {
          setCurrentObjectionIndex(prev => prev + 1);
          setShowFollowUp(false);
          setFollowUpResponse('');
        }
      }
    }
  };

  const handleFollowUpResponse = () => {
    if (currentScenarioObjection?.followUp?.nextObjectionId) {
      // Move to next objection
      const nextIndex = scenario.objections.findIndex(
        o => o.objectionId === currentScenarioObjection.followUp?.nextObjectionId
      );
      if (nextIndex >= 0) {
        setCurrentObjectionIndex(nextIndex);
      } else {
        setCurrentObjectionIndex(prev => prev + 1);
      }
    } else {
      // Move to next objection in sequence
      if (isLastObjection) {
        setScenarioComplete(true);
      } else {
        setCurrentObjectionIndex(prev => prev + 1);
      }
    }
    setShowFollowUp(false);
    setFollowUpResponse('');
  };

  const handleNextObjection = () => {
    if (isLastObjection) {
      setScenarioComplete(true);
    } else {
      setCurrentObjectionIndex(prev => prev + 1);
      setShowFollowUp(false);
      setFollowUpResponse('');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (scenarioComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-500">
          <CardHeader>
            <CardTitle className="text-3xl text-center text-green-800 dark:text-green-200 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-8 h-8" />
              Scenario Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-lg text-gray-700 dark:text-gray-300">
              Great job handling all objections in this scenario!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {scenario.objections.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Objections Handled</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {completedObjections.size}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
              </div>
              <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {scenario.difficulty}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Difficulty</div>
              </div>
            </div>
            <div className="flex gap-4 justify-center mt-6">
              <Button onClick={onComplete} size="lg" className="bg-green-600 hover:bg-green-700">
                Practice Another Scenario
              </Button>
              <Button onClick={onExit} variant="outline" size="lg">
                Exit Scenario Mode
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Scenario Context Header */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-gray-900 dark:text-white">{scenario.title}</CardTitle>
              <CardDescription className="text-base mt-2">{scenario.description}</CardDescription>
            </div>
            <Button variant="ghost" onClick={() => setShowContext(!showContext)}>
              {showContext ? 'Hide' : 'Show'} Context
            </Button>
          </div>
        </CardHeader>
        <AnimatePresence>
          {showContext && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <CardContent className="space-y-4">
                {/* Property Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-white dark:bg-gray-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Property Details
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <span className="font-semibold">Address:</span> {scenario.property.address}
                      </div>
                      <div>
                        <span className="font-semibold">ARV:</span> {formatCurrency(scenario.property.arv)}
                      </div>
                      <div>
                        <span className="font-semibold">Purchase Price:</span>{' '}
                        {formatCurrency(scenario.property.purchasePrice)}
                      </div>
                      <div>
                        <span className="font-semibold">Repair Estimate:</span>{' '}
                        {formatCurrency(scenario.property.repairEstimate)}
                      </div>
                      <div>
                        <span className="font-semibold">Potential Profit:</span>{' '}
                        <span className="text-green-600 dark:text-green-400 font-bold">
                          {formatCurrency(
                            scenario.property.arv -
                              scenario.property.purchasePrice -
                              scenario.property.repairEstimate
                          )}
                        </span>
                      </div>
                      <div>
                        <span className="font-semibold">Type:</span> {scenario.property.propertyType}
                      </div>
                      <div>
                        <span className="font-semibold">Condition:</span> {scenario.property.condition}
                      </div>
                      {scenario.property.notes && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                          {scenario.property.notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Buyer Profile */}
                  <Card className="bg-white dark:bg-gray-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Buyer Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      {scenario.buyer.name && (
                        <div>
                          <span className="font-semibold">Name:</span> {scenario.buyer.name}
                        </div>
                      )}
                      <div>
                        <span className="font-semibold">Type:</span> {scenario.buyer.type.replace(/-/g, ' ')}
                      </div>
                      <div>
                        <span className="font-semibold">Experience:</span> {scenario.buyer.experience}
                      </div>
                      <div>
                        <span className="font-semibold">Budget:</span> {formatCurrency(scenario.buyer.budget)}
                      </div>
                      {scenario.buyer.background && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                          {scenario.buyer.background}
                        </div>
                      )}
                      <div className="mt-2">
                        <span className="font-semibold">Goals:</span>
                        <ul className="list-disc list-inside text-xs mt-1">
                          {scenario.buyer.goals.map((goal, i) => (
                            <li key={i}>{goal}</li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Market Conditions */}
                  <Card className="bg-white dark:bg-gray-800">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Market Conditions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div>
                        <span className="font-semibold">Market Type:</span> {scenario.market.marketType.replace(/-/g, ' ')}
                      </div>
                      <div>
                        <span className="font-semibold">Inventory:</span> {scenario.market.inventory}
                      </div>
                      <div>
                        <span className="font-semibold">Competition:</span> {scenario.market.competition}
                      </div>
                      <div>
                        <span className="font-semibold">Avg Days on Market:</span>{' '}
                        {scenario.market.averageDaysOnMarket}
                      </div>
                      {scenario.market.notes && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                          {scenario.market.notes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Objection {currentObjectionIndex + 1} of {scenario.objections.length}
          </span>
          <div className="flex gap-1">
            {scenario.objections.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index < currentObjectionIndex
                    ? 'bg-green-500'
                    : index === currentObjectionIndex
                    ? 'bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onExit}>
          Exit Scenario
        </Button>
      </div>

      {/* Follow-Up Response */}
      <AnimatePresence>
        {showFollowUp && currentScenarioObjection?.followUp && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Buyer's Follow-Up Response
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                  The buyer responds to your answer with:
                </p>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-yellow-300 dark:border-yellow-700">
                  <p className="font-medium text-gray-900 dark:text-white">
                    "{currentScenarioObjection.followUp.responses[0]}"
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    How would you respond to this follow-up?
                  </label>
                  <textarea
                    value={followUpResponse}
                    onChange={(e) => setFollowUpResponse(e.target.value)}
                    placeholder="Enter your response to the buyer's follow-up..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none dark:bg-gray-700 dark:text-white"
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleFollowUpResponse} className="bg-yellow-600 hover:bg-yellow-700">
                    Continue
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowFollowUp(false);
                      handleNextObjection();
                    }}
                  >
                    Skip Follow-Up
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Objection */}
      {currentObjection && (
        <motion.div
          key={currentObjection.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <ObjectionCard
            ref={null}
            objection={currentObjection}
            onAddResponse={() => {}}
            onRatingChange={handleObjectionComplete}
            onUpvote={() => {}}
          />
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentObjectionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentObjectionIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button
          onClick={handleNextObjection}
          disabled={isLastObjection && !scenarioComplete}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLastObjection ? 'Complete Scenario' : 'Next Objection'}
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}

