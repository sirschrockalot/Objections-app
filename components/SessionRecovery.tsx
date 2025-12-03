'use client';

import { useState } from 'react';
import { VoiceSession } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { RotateCcw, X, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SessionRecoveryProps {
  session: VoiceSession;
  onRecover: (session: VoiceSession) => void;
  onDismiss: () => void;
}

export default function SessionRecovery({
  session,
  onRecover,
  onDismiss,
}: SessionRecoveryProps) {
  const [isRecovering, setIsRecovering] = useState(false);

  const handleRecover = () => {
    setIsRecovering(true);
    onRecover(session);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionAge = (): string => {
    const lastSaved = session.lastSavedAt 
      ? new Date(session.lastSavedAt).getTime()
      : new Date(session.startTime).getTime();
    const ageMinutes = Math.floor((Date.now() - lastSaved) / (1000 * 60));
    
    if (ageMinutes < 1) return 'Just now';
    if (ageMinutes < 60) return `${ageMinutes} minute${ageMinutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(ageMinutes / 60);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Card className="border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <CardTitle className="text-yellow-900 dark:text-yellow-100">
                  Recoverable Session Found
                </CardTitle>
                <CardDescription className="text-yellow-700 dark:text-yellow-300">
                  We found an active session that was interrupted. You can recover it to continue where you left off.
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDismiss}
              className="text-yellow-600 hover:text-yellow-700"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-yellow-700 dark:text-yellow-300">Duration</p>
                <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                  {formatDuration(session.metrics.totalDuration)}
                </p>
              </div>
              <div>
                <p className="text-yellow-700 dark:text-yellow-300">Messages</p>
                <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                  {session.messages.length}
                </p>
              </div>
              <div>
                <p className="text-yellow-700 dark:text-yellow-300">Last Saved</p>
                <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                  {getSessionAge()}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRecover}
                disabled={isRecovering}
                className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                <RotateCcw className="w-4 h-4" />
                {isRecovering ? 'Recovering...' : 'Recover Session'}
              </Button>
              <Button
                variant="outline"
                onClick={onDismiss}
                disabled={isRecovering}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-700 dark:text-yellow-300 dark:hover:bg-yellow-900/30"
              >
                Start New Session
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

