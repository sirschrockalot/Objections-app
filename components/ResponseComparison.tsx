'use client';

import { Objection, Response } from '@/types';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface ResponseComparisonProps {
  objection: Objection;
  userResponse: string;
  onClose: () => void;
}

export default function ResponseComparison({ objection, userResponse, onClose }: ResponseComparisonProps) {
  const [selectedDefaultResponse, setSelectedDefaultResponse] = useState<Response | null>(
    objection.defaultResponses[0] || null
  );

  const analyzeResponse = (userText: string, defaultText: string) => {
    const userLower = userText.toLowerCase();
    const defaultLower = defaultText.toLowerCase();
    
    const checks = {
      hasEmpathy: /(understand|feel|get|know|totally|completely)/i.test(userLower),
      hasValueProp: /(spread|equity|upside|deal|opportunity|value|benefit)/i.test(userLower),
      hasNextStep: /(walk|schedule|come|let's|let me|pencil|time|call)/i.test(userLower),
      hasReframe: /(but|however|that's why|actually|really|usually)/i.test(userLower),
    };

    return checks;
  };

  const userChecks = selectedDefaultResponse 
    ? analyzeResponse(userResponse, selectedDefaultResponse.text)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        <Card className="shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Response Comparison</CardTitle>
              <Button variant="ghost" onClick={onClose}>✕</Button>
            </div>
            <p className="text-gray-600 mt-2">{objection.text}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Default Response Selector */}
            {objection.defaultResponses.length > 1 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Compare with:
                </label>
                <div className="flex flex-wrap gap-2">
                  {objection.defaultResponses.map((response) => (
                    <Button
                      key={response.id}
                      variant={selectedDefaultResponse?.id === response.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedDefaultResponse(response)}
                    >
                      Response {objection.defaultResponses.indexOf(response) + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Side by Side Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Your Response */}
              <div className="space-y-2">
                <h3 className="font-semibold text-green-700 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Your Response
                </h3>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-gray-700 leading-relaxed">{userResponse}</p>
                </div>
                
                {/* Response Elements Check */}
                {userChecks && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600">Key Elements:</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        {userChecks.hasEmpathy ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={userChecks.hasEmpathy ? 'text-green-700' : 'text-red-700'}>
                          Empathy/Acknowledgment
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {userChecks.hasValueProp ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={userChecks.hasValueProp ? 'text-green-700' : 'text-red-700'}>
                          Value Proposition
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {userChecks.hasNextStep ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={userChecks.hasNextStep ? 'text-green-700' : 'text-red-700'}>
                          Next Step/Call to Action
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        {userChecks.hasReframe ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={userChecks.hasReframe ? 'text-green-700' : 'text-red-700'}>
                          Objection Reframing
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Default Response */}
              {selectedDefaultResponse && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-blue-700 flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    Recommended Response
                  </h3>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-gray-700 leading-relaxed">{selectedDefaultResponse.text}</p>
                  </div>
                  
                  {/* Response Elements Check */}
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium text-gray-600">Key Elements:</p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-green-700">Empathy/Acknowledgment</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-green-700">Value Proposition</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-green-700">Next Step/Call to Action</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-green-700">Objection Reframing</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Tips */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 mb-1">Tips for Improvement:</p>
                  <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                    <li>Always acknowledge the buyer's concern with empathy</li>
                    <li>Reframe the objection to show a different perspective</li>
                    <li>Highlight the value or benefit to the buyer</li>
                    <li>End with a clear next step or call to action</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={onClose}>Close</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

