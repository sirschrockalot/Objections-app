'use client';

import { useState, useEffect } from 'react';
import type { ObjectionOfTheDay } from '@/types';
import { getObjectionOfTheDay } from '@/lib/microLearning';
import { getObjections } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Calendar, Lightbulb, TrendingUp, Target, ChevronRight } from 'lucide-react';

interface ObjectionOfTheDayProps {
  onSelectObjection?: (objectionId: string) => void;
}

export default function ObjectionOfTheDay({ onSelectObjection }: ObjectionOfTheDayProps) {
  const [objectionOfDay, setObjectionOfDay] = useState<ObjectionOfTheDay | null>(null);
  const [objectionText, setObjectionText] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      const data = await getObjectionOfTheDay();
      setObjectionOfDay(data);

      if (data) {
        getObjections().then(objections => {
          const objection = objections.find(o => o.id === data.objectionId);
          if (objection) {
            setObjectionText(objection.text);
          }
        });
      }
    };
    loadData();
  }, []);

  if (!objectionOfDay) return null;

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-400 dark:border-indigo-600">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <CardTitle className="text-xl text-gray-900 dark:text-white">
              📅 Objection of the Day
            </CardTitle>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(objectionOfDay.date).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
            "{objectionText}"
          </h3>
        </div>

        {objectionOfDay.insights && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <h4 className="font-semibold text-blue-900 dark:text-blue-200">Key Insight</h4>
            </div>
            <p className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">
              {objectionOfDay.insights}
            </p>
          </div>
        )}

        {objectionOfDay.tips && objectionOfDay.tips.length > 0 && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-start gap-2 mb-3">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <h4 className="font-semibold text-green-900 dark:text-green-200">Quick Tips</h4>
            </div>
            <ul className="space-y-2">
              {objectionOfDay.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-green-800 dark:text-green-300">
                  <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          onClick={() => onSelectObjection?.(objectionOfDay.objectionId)}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Practice This Objection
        </Button>
      </CardContent>
    </Card>
  );
}

