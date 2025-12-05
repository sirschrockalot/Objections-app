'use client';

import { useState, useEffect, useMemo } from 'react';
import { Objection, PracticeHistoryEntry } from '@/types';
import { 
  getObjections, 
  getPracticeHistory, 
  getObjectionPracticeHistory,
  getConfidenceImprovement,
  getObjectionFirstPracticedDate,
  getObjectionLastPracticedDate,
  getObjectionPracticeCount,
} from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, TrendingDown, Minus, Clock, Target } from 'lucide-react';

interface ReviewModeProps {
  onSelectObjection: (objection: Objection) => void;
}

export default function ReviewMode({ onSelectObjection }: ReviewModeProps) {
  const [allObjections, setAllObjections] = useState<Objection[]>([]);
  const [practiceHistory, setPracticeHistory] = useState<PracticeHistoryEntry[]>([]);
  const [practicedObjections, setPracticedObjections] = useState<Array<{
    objection: Objection;
    history: PracticeHistoryEntry[];
    firstDate: string | null;
    lastDate: string | null;
    practiceCount: number;
    improvement: { trend: 'improving' | 'declining' | 'stable'; average: number } | null;
  }>>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<'all' | 'week' | 'month' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'most-practiced' | 'least-practiced'>('recent');

  useEffect(() => {
    const loadData = async () => {
      const [objections, history] = await Promise.all([
        getObjections(),
        getPracticeHistory(),
      ]);
      setAllObjections(objections);
      setPracticeHistory(history);

      // Get all practiced objections with their history
      const practicedIds = new Set(history.map(entry => entry.objectionId));
      const practiced = await Promise.all(
        objections
          .filter(obj => practicedIds.has(obj.id))
          .map(async (obj) => {
            const [objHistory, firstDate, lastDate, practiceCount, improvement] = await Promise.all([
              getObjectionPracticeHistory(obj.id),
              getObjectionFirstPracticedDate(obj.id),
              getObjectionLastPracticedDate(obj.id),
              getObjectionPracticeCount(obj.id),
              getConfidenceImprovement(obj.id),
            ]);
            
            return {
              objection: obj,
              history: objHistory,
              firstDate,
              lastDate,
              practiceCount,
              improvement,
            };
          })
      );
      setPracticedObjections(practiced);
    };
    loadData();
  }, []);

  // Filter by date range
  const filteredObjections = useMemo(() => {
    let filtered = [...practicedObjections];
    
    // Filter by date range
    if (selectedDateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      if (selectedDateRange === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (selectedDateRange === 'month') {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        startDate = new Date(0); // All time
      }
      
      filtered = filtered.filter(item => {
        if (!item.lastDate) return false;
        return new Date(item.lastDate) >= startDate;
      });
    }
    
    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.objection.text.toLowerCase().includes(query) ||
        item.objection.category.toLowerCase().includes(query)
      );
    }
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          if (!a.lastDate || !b.lastDate) return 0;
          return new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime();
        case 'oldest':
          if (!a.firstDate || !b.firstDate) return 0;
          return new Date(a.firstDate).getTime() - new Date(b.firstDate).getTime();
        case 'most-practiced':
          return b.practiceCount - a.practiceCount;
        case 'least-practiced':
          return a.practiceCount - b.practiceCount;
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [practicedObjections, selectedDateRange, searchQuery, sortBy]);

  if (practicedObjections.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Practice History Yet</h3>
          <p className="text-gray-500">
            Start practicing objections to see your review history here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Review Practice History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search objections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Date Range</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedDateRange === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDateRange('all')}
              >
                All Time
              </Button>
              <Button
                variant={selectedDateRange === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDateRange('week')}
              >
                Last Week
              </Button>
              <Button
                variant={selectedDateRange === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedDateRange('month')}
              >
                Last Month
              </Button>
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Sort By</label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={sortBy === 'recent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('recent')}
              >
                Most Recent
              </Button>
              <Button
                variant={sortBy === 'oldest' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('oldest')}
              >
                Oldest First
              </Button>
              <Button
                variant={sortBy === 'most-practiced' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('most-practiced')}
              >
                Most Practiced
              </Button>
              <Button
                variant={sortBy === 'least-practiced' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSortBy('least-practiced')}
              >
                Least Practiced
              </Button>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Showing {filteredObjections.length} of {practicedObjections.length} practiced objections
          </div>
        </CardContent>
      </Card>

      {/* Objection List */}
      <div className="space-y-4">
        {filteredObjections.map((item, index) => (
          <motion.div
            key={item.objection.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onSelectObjection(item.objection)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        item.objection.category === 'Price' ? 'bg-red-100 text-red-800' :
                        item.objection.category === 'Timing' ? 'bg-yellow-100 text-yellow-800' :
                        item.objection.category === 'Trust' ? 'bg-purple-100 text-purple-800' :
                        item.objection.category === 'Property' ? 'bg-green-100 text-green-800' :
                        item.objection.category === 'Financial' ? 'bg-blue-100 text-blue-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {item.objection.category}
                      </span>
                      {item.improvement && (
                        <div className="flex items-center gap-1">
                          {item.improvement.trend === 'improving' && (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          )}
                          {item.improvement.trend === 'declining' && (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          {item.improvement.trend === 'stable' && (
                            <Minus className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.objection.text}
                    </h3>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>Practiced {item.practiceCount} time{item.practiceCount !== 1 ? 's' : ''}</span>
                      </div>
                      {item.firstDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>First: {new Date(item.firstDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {item.lastDate && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Last: {new Date(item.lastDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {item.improvement && (
                        <div className="flex items-center gap-1">
                          <span>Avg Confidence: {item.improvement.average.toFixed(1)}/5</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            item.improvement.trend === 'improving' ? 'bg-green-100 text-green-700' :
                            item.improvement.trend === 'declining' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {item.improvement.trend}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectObjection(item.objection);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Revisit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

