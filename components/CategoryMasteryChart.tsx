'use client';

import { CategoryMastery } from '@/lib/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Trophy, Target } from 'lucide-react';

interface CategoryMasteryChartProps {
  data: CategoryMastery[];
}

export default function CategoryMasteryChart({ data }: CategoryMasteryChartProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Mastery</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  const categoryColors: Record<string, string> = {
    'Price': 'bg-red-500',
    'Timing': 'bg-yellow-500',
    'Trust': 'bg-purple-500',
    'Property': 'bg-green-500',
    'Financial': 'bg-blue-500',
    'Interest': 'bg-orange-500',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Category Mastery
        </CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Mastery combines practice completion and confidence levels
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((category, index) => {
            const isMastered = category.masteryPercentage >= 80;
            const isGood = category.masteryPercentage >= 60;
            
            return (
              <motion.div
                key={category.category}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${categoryColors[category.category] || 'bg-gray-500'}`}></div>
                    <span className="font-medium text-gray-900">{category.category}</span>
                    {isMastered && (
                      <Trophy className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600">
                      {category.practiced} / {category.total} practiced
                    </span>
                    <span className={`font-bold ${
                      isMastered ? 'text-green-600' :
                      isGood ? 'text-blue-600' :
                      'text-gray-600'
                    }`}>
                      {category.masteryPercentage}%
                    </span>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${category.masteryPercentage}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`h-3 rounded-full ${
                      isMastered ? 'bg-green-500' :
                      isGood ? 'bg-blue-500' :
                      'bg-yellow-500'
                    }`}
                  />
                </div>
                
                {/* Additional Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  {category.averageConfidence > 0 && (
                    <span>Avg Confidence: {category.averageConfidence.toFixed(1)}/5</span>
                  )}
                  {category.lastPracticed && (
                    <span>Last: {new Date(category.lastPracticed).toLocaleDateString()}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {data.filter(d => d.masteryPercentage >= 80).length}
            </div>
            <div className="text-xs text-gray-600">Mastered (80%+)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {data.filter(d => d.masteryPercentage >= 60 && d.masteryPercentage < 80).length}
            </div>
            <div className="text-xs text-gray-600">Good (60-79%)</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {data.filter(d => d.masteryPercentage < 60).length}
            </div>
            <div className="text-xs text-gray-600">Needs Work (&lt;60%)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

