'use client';

import { Objection } from '@/types';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ObjectionCardProps {
  objection: Objection;
  onAddResponse: (objectionId: string, responseText: string) => void;
}

export default function ObjectionCard({ objection, onAddResponse }: ObjectionCardProps) {
  const [showResponses, setShowResponses] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newResponse, setNewResponse] = useState('');

  const allResponses = [...objection.defaultResponses, ...objection.customResponses];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newResponse.trim()) {
      onAddResponse(objection.id, newResponse.trim());
      setNewResponse('');
      setShowAddForm(false);
      setShowResponses(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="max-w-4xl w-full mx-auto shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl mb-4">Objection</CardTitle>
          <CardDescription className="text-xl text-gray-700 leading-relaxed">
            {objection.text}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="flex-1">
              <Button
                onClick={() => setShowResponses(!showResponses)}
                variant="default"
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {showResponses ? 'Hide' : 'Show'} Responses ({allResponses.length})
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
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {showAddForm ? 'Cancel' : 'Add'} Your Response
              </Button>
            </motion.div>
          </div>

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
                <textarea
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  placeholder="Enter your response to this objection..."
                  className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  rows={4}
                />
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    type="submit"
                    variant="default"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Save Response
                  </Button>
                </motion.div>
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
                {allResponses.length === 0 ? (
                  <p className="text-gray-500 italic">No responses yet. Be the first to add one!</p>
                ) : (
                  allResponses.map((response, index) => (
                    <motion.div
                      key={response.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                      className={`p-4 rounded-lg border-l-4 ${
                        response.isCustom
                          ? 'bg-green-50 border-green-500'
                          : 'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            response.isCustom
                              ? 'bg-green-200 text-green-800'
                              : 'bg-blue-200 text-blue-800'
                          }`}
                        >
                          {response.isCustom ? 'Custom Response' : 'Default Response'}
                        </span>
                        {response.createdAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(response.createdAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 leading-relaxed">{response.text}</p>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
