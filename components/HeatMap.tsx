'use client';

import { HeatMapData } from '@/lib/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface HeatMapProps {
  data: HeatMapData[];
  onSelectObjection?: (objectionId: string) => void;
}

export default function HeatMap({ data, onSelectObjection }: HeatMapProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Practice Heat Map</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No practice data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  // Sort by intensity (hottest first)
  const sortedData = [...data].sort((a, b) => b.intensity - a.intensity);

  const getIntensityColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100 text-gray-400';
    if (intensity < 25) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (intensity < 50) return 'bg-green-100 text-green-800 border-green-200';
    if (intensity < 75) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const getIntensityLabel = (intensity: number) => {
    if (intensity === 0) return 'Not Practiced';
    if (intensity < 25) return 'Cold';
    if (intensity < 50) return 'Warm';
    if (intensity < 75) return 'Hot';
    return 'Very Hot';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Practice Heat Map</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          Color intensity shows practice frequency and confidence level
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs mb-4 pb-4 border-b">
            <span className="font-medium text-gray-700">Intensity:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span>Not Practiced</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-blue-100 rounded"></div>
              <span>Cold</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-100 rounded"></div>
              <span>Warm</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-yellow-100 rounded"></div>
              <span>Hot</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-red-100 rounded"></div>
              <span>Very Hot</span>
            </div>
          </div>

          {/* Heat Map Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedData.map((item, index) => (
              <motion.div
                key={item.objectionId}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.02 }}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${getIntensityColor(item.intensity)}`}
                onClick={() => onSelectObjection?.(item.objectionId)}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-white/50">
                    {item.category}
                  </span>
                  <span className="text-xs font-bold">
                    {getIntensityLabel(item.intensity)}
                  </span>
                </div>
                <p className="text-sm font-medium mb-2 line-clamp-2">
                  {item.objectionText}
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span>Practiced: {item.practiceCount}x</span>
                  {item.averageConfidence > 0 && (
                    <span>Confidence: {item.averageConfidence.toFixed(1)}/5</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {data.filter(d => d.intensity === 0).length}
              </div>
              <div className="text-xs text-gray-600">Not Practiced</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {data.filter(d => d.intensity > 0 && d.intensity < 50).length}
              </div>
              <div className="text-xs text-gray-600">Needs More Practice</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {data.filter(d => d.intensity >= 50).length}
              </div>
              <div className="text-xs text-gray-600">Well Practiced</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

