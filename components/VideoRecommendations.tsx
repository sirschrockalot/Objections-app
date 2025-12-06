'use client';

import { VideoRecommendation, getVideoRecommendations } from '@/data/videoRecommendations';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Youtube, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface VideoRecommendationsProps {
  category: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  objectionText?: string;
}

const creatorColors: Record<string, string> = {
  'Andy Elliott': 'bg-red-100 text-red-800 border-red-300',
  'Eric Cline': 'bg-blue-100 text-blue-800 border-blue-300',
  'Tony Mont': 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function VideoRecommendations({
  category,
  difficulty,
  objectionText,
}: VideoRecommendationsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const recommendations = getVideoRecommendations(category, difficulty);

  if (recommendations.length === 0) {
    return null;
  }

  const handleVideoClick = (video: VideoRecommendation) => {
    // Track video click for analytics (if gtag is available)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'video_click', {
        video_id: video.id,
        video_title: video.title,
        creator: video.creator,
        category: category,
        difficulty: difficulty || 'unknown',
      });
    }
    // Open in new tab
    window.open(video.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="mt-4 border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" />
            <CardTitle className="text-lg font-semibold text-gray-800">
              Recommended Videos
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs"
          >
            {isExpanded ? 'Show Less' : `Show ${recommendations.length} Videos`}
          </Button>
        </div>
        <CardDescription className="text-sm text-gray-600">
          Learn from top experts: Andy Elliott, Eric Cline, and Tony Mont
        </CardDescription>
      </CardHeader>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="space-y-3 pt-0">
              {recommendations.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-lg bg-white border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded border ${
                            creatorColors[video.creator] || 'bg-gray-100 text-gray-800 border-gray-300'
                          }`}
                        >
                          {video.creator}
                        </span>
                        {video.difficulty && (
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                            {video.difficulty}
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-2">
                        {video.title}
                      </h4>
                      {video.description && (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                          {video.description}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleVideoClick(video)}
                      className="flex-shrink-0 flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white"
                      aria-label={`Watch ${video.title} by ${video.creator}`}
                    >
                      <Play className="w-3 h-3" />
                      Watch
                    </Button>
                  </div>
                </motion.div>
              ))}
              <div className="pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  💡 Tip: Watch these videos to improve your objection handling skills
                </p>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

