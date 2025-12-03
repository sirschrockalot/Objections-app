'use client';

import { useState, useEffect } from 'react';
import { VoicePracticeGoal, GoalProgress } from '@/types';
import {
  getVoiceGoals,
  getActiveGoals,
  saveVoiceGoal,
  deleteVoiceGoal,
  calculateAllGoalProgress,
  getGoalRecommendations,
  createGoalFromRecommendation,
} from '@/lib/voiceGoals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  TrendingUp,
  Award,
  X,
  Calendar,
  BarChart3,
  Zap,
  Lightbulb,
} from 'lucide-react';

export default function VoicePracticeGoals() {
  const [goals, setGoals] = useState<VoicePracticeGoal[]>([]);
  const [progress, setProgress] = useState<Map<string, GoalProgress>>(new Map());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [editingGoal, setEditingGoal] = useState<VoicePracticeGoal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, []);

  useEffect(() => {
    if (goals.length > 0) {
      loadProgress();
      // Refresh progress every 30 seconds
      const interval = setInterval(loadProgress, 30000);
      return () => clearInterval(interval);
    }
  }, [goals]);

  const loadGoals = () => {
    const allGoals = getVoiceGoals();
    setGoals(allGoals);
    setLoading(false);
  };

  const loadProgress = async () => {
    try {
      const progressData = await calculateAllGoalProgress();
      const progressMap = new Map(
        progressData.map((p) => [p.goalId, p])
      );
      setProgress(progressMap);
    } catch (error) {
      console.error('Error loading goal progress:', error);
    }
  };

  const handleDelete = (goalId: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      deleteVoiceGoal(goalId);
      loadGoals();
    }
  };

  const handleToggleActive = (goal: VoicePracticeGoal) => {
    goal.isActive = !goal.isActive;
    saveVoiceGoal(goal);
    loadGoals();
  };

  const handleCreateFromRecommendation = (recommendation: Partial<VoicePracticeGoal>) => {
    const newGoal = createGoalFromRecommendation(recommendation);
    saveVoiceGoal(newGoal);
    loadGoals();
    setShowRecommendations(false);
  };

  const getGoalTypeLabel = (goal: VoicePracticeGoal): string => {
    switch (goal.type) {
      case 'overallScore':
        return 'Overall Score';
      case 'qualityMetric':
        return goal.metric ? `${goal.metric.charAt(0).toUpperCase() + goal.metric.slice(1)} Score` : 'Quality Metric';
      case 'sessionFrequency':
        return 'Session Frequency';
      case 'sessionDuration':
        return 'Session Duration';
      case 'consistency':
        return 'Consistency Streak';
      default:
        return 'Goal';
    }
  };

  const getGoalTargetLabel = (goal: VoicePracticeGoal): string => {
    switch (goal.type) {
      case 'overallScore':
      case 'qualityMetric':
        return `${goal.target}`;
      case 'sessionFrequency':
        return `${goal.target} sessions${goal.period ? `/${goal.period}` : ''}`;
      case 'sessionDuration':
        const mins = Math.floor(goal.target / 60);
        return `${mins} minutes${goal.period ? `/${goal.period}` : ''}`;
      case 'consistency':
        return `${goal.target} days`;
      default:
        return goal.target.toString();
    }
  };

  const getProgressValue = (goal: VoicePracticeGoal): string => {
    const prog = progress.get(goal.id);
    if (!prog) return '0';
    
    switch (goal.type) {
      case 'overallScore':
      case 'qualityMetric':
        return prog.current.toFixed(1);
      case 'sessionFrequency':
      case 'consistency':
        return Math.floor(prog.current).toString();
      case 'sessionDuration':
        const mins = Math.floor(prog.current / 60);
        const secs = Math.floor(prog.current % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
      default:
        return prog.current.toString();
    }
  };

  const activeGoals = goals.filter((g) => g.isActive);
  const completedGoals = goals.filter((g) => g.completedAt && !g.isActive);
  const recommendations = getGoalRecommendations();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6" />
            Practice Goals
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Set targets and track your progress
          </p>
        </div>
        <div className="flex gap-2">
          {recommendations.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRecommendations(!showRecommendations)}
            >
              <Zap className="w-4 h-4 mr-2" />
              Recommendations
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Recommendations */}
      <AnimatePresence>
        {showRecommendations && recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  Recommended Goals
                </CardTitle>
                <CardDescription>
                  Based on your current performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm mb-1">
                          {rec.description || getGoalTypeLabel(rec as VoicePracticeGoal)}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Target: {getGoalTargetLabel(rec as VoicePracticeGoal)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleCreateFromRecommendation(rec)}
                      >
                        Add Goal
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Goals */}
      {activeGoals.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Active Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeGoals.map((goal) => {
              const prog = progress.get(goal.id);
              const isCompleted = prog?.isCompleted || false;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-6 rounded-lg border-2 ${
                    isCompleted
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <h4 className="font-semibold">{getGoalTypeLabel(goal)}</h4>
                        {isCompleted && (
                          <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      {goal.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {goal.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          Target: <strong>{getGoalTargetLabel(goal)}</strong>
                        </span>
                        {prog && (
                          <span className="text-gray-600 dark:text-gray-400">
                            Current: <strong>{getProgressValue(goal)}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(goal)}
                        className="h-8 w-8"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(goal.id)}
                        className="h-8 w-8 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {prog && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Progress</span>
                        <span className="font-bold">
                          {prog.progress.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${prog.progress}%` }}
                          transition={{ duration: 0.5 }}
                          className={`h-3 rounded-full ${
                            isCompleted
                              ? 'bg-green-500'
                              : prog.progress >= 75
                              ? 'bg-blue-500'
                              : prog.progress >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>
                          {prog.remaining > 0
                            ? `${prog.remaining.toFixed(1)} remaining`
                            : 'Goal achieved!'}
                        </span>
                        {prog.daysRemaining !== undefined && (
                          <span>
                            {prog.daysRemaining > 0
                              ? `${prog.daysRemaining} days left`
                              : 'Deadline passed'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {goal.deadline && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      Deadline: {new Date(goal.deadline).toLocaleDateString()}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                No active goals yet
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
                Set goals to track your progress and stay motivated
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Goal
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            Completed Goals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 opacity-75"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="font-medium text-sm">{getGoalTypeLabel(goal)}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Completed {goal.completedAt && new Date(goal.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(goal.id)}
                    className="h-8 w-8 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateGoalModal
            onClose={() => setShowCreateModal(false)}
            onSave={(goal) => {
              saveVoiceGoal(goal);
              loadGoals();
              setShowCreateModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface CreateGoalModalProps {
  onClose: () => void;
  onSave: (goal: VoicePracticeGoal) => void;
}

function CreateGoalModal({ onClose, onSave }: CreateGoalModalProps) {
  const [type, setType] = useState<VoicePracticeGoal['type']>('overallScore');
  const [target, setTarget] = useState<string>('75');
  const [metric, setMetric] = useState<string>('clarity');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'allTime'>('weekly');
  const [deadline, setDeadline] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const goal: VoicePracticeGoal = {
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      target: parseFloat(target) || 0,
      current: 0,
      metric: type === 'qualityMetric' ? metric : undefined,
      period: type === 'sessionFrequency' || type === 'sessionDuration' ? period : undefined,
      deadline: deadline || undefined,
      createdAt: new Date().toISOString(),
      isActive: true,
      description: description || undefined,
    };
    onSave(goal);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Create New Goal</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Goal Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as VoicePracticeGoal['type'])}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="overallScore">Overall Score</option>
              <option value="qualityMetric">Quality Metric</option>
              <option value="sessionFrequency">Session Frequency</option>
              <option value="sessionDuration">Session Duration</option>
              <option value="consistency">Consistency Streak</option>
            </select>
          </div>

          {type === 'qualityMetric' && (
            <div>
              <label className="block text-sm font-medium mb-2">Metric</label>
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="clarity">Clarity</option>
                <option value="empathy">Empathy</option>
                <option value="structure">Structure</option>
                <option value="objectionHandling">Objection Handling</option>
                <option value="closingTechnique">Closing Technique</option>
              </select>
            </div>
          )}

          {(type === 'sessionFrequency' || type === 'sessionDuration') && (
            <div>
              <label className="block text-sm font-medium mb-2">Period</label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="allTime">All Time</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Target {type === 'sessionDuration' ? '(minutes)' : type === 'overallScore' || type === 'qualityMetric' ? '(0-100)' : ''}
            </label>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              min="0"
              max={type === 'overallScore' || type === 'qualityMetric' ? '100' : undefined}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Deadline (Optional)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
              placeholder="Add a note about this goal..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Create Goal
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

