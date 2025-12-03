'use client';

import { Objection } from '@/types';
import { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getLatestConfidenceRating, saveConfidenceRating, upvoteResponse, isResponseUpvoted, getObjections, saveNote, getNote } from '@/lib/storage';
import { addPoints, POINTS_VALUES } from '@/lib/gamification';
import { Star, ThumbsUp, GitCompare, StickyNote, FileText, Mic, MicOff } from 'lucide-react';
import ResponseComparison from './ResponseComparison';
import ResponseTemplateBuilder from './ResponseTemplateBuilder';
import CommentsSection from './CommentsSection';
import ReviewDueBadge from './ReviewDueBadge';
import { useSwipe } from '@/hooks/useSwipe';
import { useVoiceInput } from '@/hooks/useVoiceInput';

interface ObjectionCardProps {
  objection: Objection;
  onAddResponse: (objectionId: string, responseText: string) => void;
  onRatingChange?: () => void;
  onUpvote?: () => void;
}

export interface ObjectionCardRef {
  revealResponses: () => void;
  addResponse: () => void;
}

const categoryColors: Record<string, string> = {
  'Price': 'bg-red-100 text-red-800 border-red-300',
  'Timing': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Trust': 'bg-purple-100 text-purple-800 border-purple-300',
  'Property': 'bg-green-100 text-green-800 border-green-300',
  'Financial': 'bg-blue-100 text-blue-800 border-blue-300',
  'Interest': 'bg-orange-100 text-orange-800 border-orange-300',
};

const ObjectionCard = forwardRef<ObjectionCardRef, ObjectionCardProps>(
  ({ objection, onAddResponse, onRatingChange, onUpvote }, ref) => {
  const [showResponses, setShowResponses] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newResponse, setNewResponse] = useState('');
  const [confidenceRating, setConfidenceRating] = useState<number | null>(null);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonResponse, setComparisonResponse] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [note, setNote] = useState(objection.personalNote || '');
  const [showTemplateBuilder, setShowTemplateBuilder] = useState(false);
  const [showResponsesViaSwipe, setShowResponsesViaSwipe] = useState(false);

  // Voice input for responses
  const {
    isListening: isVoiceListening,
    transcript: voiceTranscript,
    isSupported: isVoiceSupported,
    toggleListening: toggleVoiceListening,
    stopListening: stopVoiceListening,
  } = useVoiceInput({
    onResult: (text) => {
      setNewResponse(prev => prev + (prev ? ' ' : '') + text);
    },
    continuous: true,
  });

  // Swipe gestures
  const swipeHandlers = useSwipe({
    onSwipeUp: () => {
      if (!showResponses) {
        setShowResponses(true);
        setShowResponsesViaSwipe(true);
      }
    },
    onSwipeDown: () => {
      if (showResponses && showResponsesViaSwipe) {
        setShowResponses(false);
        setShowResponsesViaSwipe(false);
      }
    },
  });

  // Expose methods for keyboard shortcuts
  // Use useCallback to create stable function references
  const revealResponsesHandler = useCallback(() => {
    setShowResponses(prev => !prev);
  }, []);

  const addResponseHandler = useCallback(() => {
    setShowAddForm(prev => !prev);
    setShowResponses(true);
  }, []);

  useImperativeHandle(ref, () => ({
    revealResponses: revealResponsesHandler,
    addResponse: addResponseHandler,
  }), [revealResponsesHandler, addResponseHandler]);

  // Sort responses: custom responses by upvotes (desc), then default responses
  const sortedResponses = [...objection.customResponses]
    .sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0))
    .concat(objection.defaultResponses);

  useEffect(() => {
    setConfidenceRating(getLatestConfidenceRating(objection.id));
    const savedNote = getNote(objection.id);
    setNote(savedNote || '');
  }, [objection.id]);

  const handleSaveNote = () => {
    saveNote(objection.id, note);
    if (onRatingChange) {
      onRatingChange();
    }
  };

  const handleUseTemplate = (template: any) => {
    const templateText = `${template.acknowledge}\n\n${template.reframe}\n\n${template.value}\n\n${template.nextStep}`;
    setNewResponse(templateText);
    setShowTemplateBuilder(false);
  };

  const handleUpvote = (responseId: string) => {
    upvoteResponse(objection.id, responseId);
    if (onUpvote) {
      onUpvote();
    }
  };

  const handleRatingClick = (rating: number) => {
    saveConfidenceRating(objection.id, rating);
    setConfidenceRating(rating);
    
    // Award points based on confidence rating
    try {
      let points = 0;
      if (rating === 5) {
        points = POINTS_VALUES.CONFIDENCE_RATING_5;
      } else if (rating === 4) {
        points = POINTS_VALUES.CONFIDENCE_RATING_4;
      } else if (rating === 3) {
        points = POINTS_VALUES.CONFIDENCE_RATING_3;
      }
      if (points > 0) {
        addPoints(points, `Confidence rating: ${rating}/5`, {
          objectionId: objection.id,
          rating,
        });
      }
    } catch (error) {
      console.error('Error adding points:', error);
    }
    
    if (onRatingChange) {
      onRatingChange();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newResponse.trim()) {
      onAddResponse(objection.id, newResponse.trim());
      setNewResponse('');
      setShowAddForm(false);
      setShowResponses(true);
    }
  };

  const handleCompareResponse = () => {
    if (newResponse.trim()) {
      setComparisonResponse(newResponse.trim());
      setShowComparison(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      {...swipeHandlers}
      className="touch-pan-y"
    >
      <Card className="max-w-4xl w-full mx-auto shadow-xl" role="article" aria-labelledby="objection-title">
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Objection metadata">
              <span 
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${
                  categoryColors[objection.category] || 'bg-gray-100 text-gray-800 border-gray-300'
                }`}
                aria-label={`Category: ${objection.category}`}
              >
                {objection.category}
              </span>
              {objection.difficulty && (
                <span 
                  className="text-xs font-medium px-2 py-1 rounded bg-gray-200 text-gray-700"
                  aria-label={`Difficulty: ${objection.difficulty}`}
                >
                  {objection.difficulty}
                </span>
              )}
              <ReviewDueBadge objectionId={objection.id} />
            </div>
          </div>
          <CardTitle id="objection-title" className="text-3xl mb-4">Objection</CardTitle>
          <CardDescription className="text-xl text-gray-700 leading-relaxed" aria-label="Objection text">
            {objection.text}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Confidence Rating Section */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Rate Your Confidence:</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => handleRatingClick(rating)}
                      onMouseEnter={() => setHoveredRating(rating)}
                      onMouseLeave={() => setHoveredRating(null)}
                      className="transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          (hoveredRating !== null && rating <= hoveredRating) ||
                          (hoveredRating === null && confidenceRating !== null && rating <= confidenceRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {confidenceRating && (
                  <p className="text-xs text-gray-600 mt-2">
                    Your confidence: {confidenceRating}/5
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button
                onClick={() => setShowResponses(!showResponses)}
                variant="default"
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 min-h-[48px] text-base"
                data-onboarding="show-responses"
                aria-label={showResponses ? `Hide ${sortedResponses.length} responses` : `Show ${sortedResponses.length} responses`}
                aria-expanded={showResponses}
              >
                {showResponses ? 'Hide' : 'Show'} Responses ({sortedResponses.length})
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button
                onClick={() => {
                  setShowAddForm(!showAddForm);
                  setShowResponses(true);
                }}
                variant="default"
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 min-h-[48px] text-base"
                data-onboarding="add-response"
                aria-label={showAddForm ? 'Cancel adding response' : 'Add your response to this objection'}
                aria-expanded={showAddForm}
              >
                {showAddForm ? 'Cancel' : 'Add'} Your Response
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full sm:w-auto">
              <Button
                onClick={() => setShowNotes(!showNotes)}
                variant="outline"
                size="lg"
                className="w-full min-h-[48px] text-base"
              >
                <StickyNote className="w-4 h-4 mr-2" />
                {showNotes ? 'Hide' : 'Notes'}
              </Button>
            </motion.div>
          </div>
          
          {/* Mobile Swipe Hint */}
          <div className="sm:hidden text-center mb-4">
            <p className="text-xs text-gray-500">
              💡 Swipe up to reveal responses, swipe down to hide
            </p>
          </div>

          {/* Notes Section */}
          <AnimatePresence>
            {showNotes && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
              >
                <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <StickyNote className="w-4 h-4" />
                  Personal Notes
                </h3>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  onBlur={handleSaveNote}
                  placeholder="Add your personal notes about this objection... (e.g., what worked, what didn't, tips for next time)"
                  className="w-full p-3 border border-yellow-300 rounded-lg mb-2 focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500">Notes are saved automatically and private to you</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showAddForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={handleSubmit}
                className="mb-6 p-4 bg-gray-50 rounded-lg overflow-hidden"
              >
                <div className="space-y-2">
                  <textarea
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    placeholder="Enter your response to this objection..."
                    className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none text-base"
                    rows={4}
                  />
                  {isVoiceSupported && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={isVoiceListening ? "default" : "outline"}
                        size="sm"
                        onClick={toggleVoiceListening}
                        className={`flex items-center gap-2 ${
                          isVoiceListening ? 'bg-red-600 hover:bg-red-700' : ''
                        }`}
                      >
                        {isVoiceListening ? (
                          <>
                            <MicOff className="w-4 h-4" />
                            Stop Recording
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4" />
                            Voice Input
                          </>
                        )}
                      </Button>
                      {isVoiceListening && (
                        <span className="text-xs text-gray-600 animate-pulse">
                          Listening...
                        </span>
                      )}
                      {voiceTranscript && (
                        <span className="text-xs text-gray-500 italic">
                          "{voiceTranscript}"
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Save Response
                      </Button>
                    </motion.div>
                    {newResponse.trim() && (
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleCompareResponse}
                          className="flex items-center gap-2"
                        >
                          <GitCompare className="w-4 h-4" />
                          Compare
                        </Button>
                      </motion.div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTemplateBuilder(!showTemplateBuilder)}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    {showTemplateBuilder ? 'Hide' : 'Use'} Response Template
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showResponses && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Responses:</h3>
                {sortedResponses.length === 0 ? (
                  <p className="text-gray-500 italic">No responses yet. Be the first to add one!</p>
                ) : (
                  sortedResponses.map((response, index) => {
                    const isUpvoted = response.isCustom && isResponseUpvoted(objection.id, response.id);
                    const upvoteCount = response.upvotes || 0;
                    const isTopResponse = response.isCustom && upvoteCount > 0 && index === 0 && 
                      sortedResponses.filter(r => r.isCustom && (r.upvotes || 0) > 0).length > 0;
                    
                    return (
                      <motion.div
                        key={response.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                        className={`p-4 rounded-lg border-l-4 relative ${
                          response.isCustom
                            ? 'bg-green-50 border-green-500'
                            : 'bg-blue-50 border-blue-500'
                        } ${isTopResponse ? 'ring-2 ring-yellow-400' : ''}`}
                      >
                        {isTopResponse && (
                          <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                            TOP
                          </div>
                        )}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded ${
                                response.isCustom
                                  ? 'bg-green-200 text-green-800'
                                  : 'bg-blue-200 text-blue-800'
                              }`}
                            >
                              {response.isCustom ? 'Custom Response' : 'Default Response'}
                            </span>
                            {response.isCustom && (
                              <button
                                onClick={() => handleUpvote(response.id)}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                                  isUpvoted
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                <ThumbsUp className={`w-3 h-3 ${isUpvoted ? 'fill-current' : ''}`} />
                                {upvoteCount}
                              </button>
                            )}
                          </div>
                          {response.createdAt && (
                            <span className="text-xs text-gray-500">
                              {new Date(response.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">{response.text}</p>
                        <CommentsSection
                          responseId={response.id}
                          objectionId={objection.id}
                        />
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Template Builder */}
          <AnimatePresence>
            {showTemplateBuilder && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4"
              >
                <ResponseTemplateBuilder
                  onSelectTemplate={handleUseTemplate}
                  onClose={() => setShowTemplateBuilder(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Response Comparison Modal */}
      {showComparison && (
        <ResponseComparison
          objection={objection}
          userResponse={comparisonResponse}
          onClose={() => {
            setShowComparison(false);
            setComparisonResponse('');
          }}
        />
      )}
    </motion.div>
  );
});

ObjectionCard.displayName = 'ObjectionCard';

export default ObjectionCard;
