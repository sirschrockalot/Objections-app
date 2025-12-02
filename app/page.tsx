'use client';

import { useState, useEffect } from 'react';
import { Objection, Response } from '@/types';
import { getObjections, saveCustomResponse } from '@/lib/storage';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import ObjectionCard from '@/components/ObjectionCard';
import LoadingAnimation from '@/components/LoadingAnimation';

export default function Home() {
  const [objections, setObjections] = useState<Objection[]>([]);
  const [currentObjection, setCurrentObjection] = useState<Objection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    setObjections(getObjections());
  }, []);

  const handleGetObjection = () => {
    if (objections.length === 0) return;

    setIsLoading(true);
    setHasStarted(true);
    setCurrentObjection(null);
  };

  const handleAnimationComplete = (selectedObjection: Objection) => {
    setCurrentObjection(selectedObjection);
    setIsLoading(false);
  };

  const handleAddResponse = (objectionId: string, responseText: string) => {
    const newResponse: Response = {
      id: `${objectionId}-custom-${Date.now()}`,
      text: responseText,
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    saveCustomResponse(objectionId, newResponse);

    // Update local state
    setObjections(getObjections());
    setCurrentObjection((prev) => {
      if (!prev || prev.id !== objectionId) return prev;
      return {
        ...prev,
        customResponses: [...prev.customResponses, newResponse],
      };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Objection Practice
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Master your responses to buyer objections and build confidence in your sales conversations
          </p>
        </header>

        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {!hasStarted ? (
              <div className="text-center">
                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-3xl">Ready to Practice?</CardTitle>
                    <CardDescription className="text-lg">
                      Click the button below to get a random objection. Practice your response,
                      view suggested answers, and add your own responses to help your team.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={handleGetObjection}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xl px-8 py-6"
                      >
                        Start Practice Session
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </div>
            ) : isLoading ? (
              <div>
                <LoadingAnimation 
                  objections={objections} 
                  onComplete={handleAnimationComplete}
                />
              </div>
            ) : currentObjection ? (
              <div className="space-y-6">
                <ObjectionCard
                  objection={currentObjection}
                  onAddResponse={handleAddResponse}
                />
                <div className="text-center">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleGetObjection}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xl px-8 py-6"
                    >
                      Get Next Objection
                    </Button>
                  </motion.div>
                </div>
              </div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
