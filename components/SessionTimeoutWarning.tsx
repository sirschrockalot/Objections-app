'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  getSessionTimeoutConfig,
  getTimeSinceLastActivity,
  getSessionDuration,
  markWarningShown,
  resetSession,
  stopActivityTracking,
} from '@/lib/sessionTimeout';
import { clearCurrentUser } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface SessionTimeoutWarningProps {
  onExtend?: () => void;
  onLogout?: () => void;
}

export default function SessionTimeoutWarning({
  onExtend,
  onLogout,
}: SessionTimeoutWarningProps) {
  const [show, setShow] = useState(false);
  const [reason, setReason] = useState<'idle' | 'session' | null>(null);
  const [minutesRemaining, setMinutesRemaining] = useState(0);
  const router = useRouter();
  const config = getSessionTimeoutConfig();

  const handleLogout = useCallback(async () => {
    await clearCurrentUser();
    stopActivityTracking();
    if (onLogout) {
      onLogout();
    } else {
      router.push('/auth');
    }
  }, [onLogout, router]);

  useEffect(() => {
    let isMounted = true;

    const checkTimeout = () => {
      if (!isMounted) return;

      const idleTime = getTimeSinceLastActivity();
      const sessionDuration = getSessionDuration();
      const idleTimeoutMs = config.idleTimeoutMinutes * 60 * 1000;
      const maxSessionMs = config.maxSessionHours * 60 * 60 * 1000;
      const warningMs = config.warningBeforeTimeoutMinutes * 60 * 1000;

      // Check if we should show warning
      const timeUntilIdleTimeout = idleTimeoutMs - idleTime;
      const timeUntilSessionTimeout = maxSessionMs - sessionDuration;

      // Check if timeout has been exceeded
      if (timeUntilIdleTimeout <= 0 || timeUntilSessionTimeout <= 0) {
        // Timeout exceeded - force logout
        if (isMounted) {
          handleLogout();
        }
        return;
      }

      // Check if we should show warning
      if (timeUntilIdleTimeout > 0 && timeUntilIdleTimeout <= warningMs && !show) {
        if (isMounted) {
          setReason('idle');
          setMinutesRemaining(Math.max(1, Math.ceil(timeUntilIdleTimeout / (60 * 1000))));
          setShow(true);
          markWarningShown();
        }
      } else if (timeUntilSessionTimeout > 0 && timeUntilSessionTimeout <= warningMs && !show) {
        if (isMounted) {
          setReason('session');
          setMinutesRemaining(Math.max(1, Math.ceil(timeUntilSessionTimeout / (60 * 1000))));
          setShow(true);
          markWarningShown();
        }
      } else if (timeUntilIdleTimeout > warningMs && timeUntilSessionTimeout > warningMs) {
        // Reset warning if user is no longer in warning zone
        if (isMounted) {
          setShow(false);
        }
      } else if (show && isMounted) {
        // Update remaining time if warning is already shown
        const remaining = reason === 'idle' 
          ? Math.max(1, Math.ceil(timeUntilIdleTimeout / (60 * 1000)))
          : Math.max(1, Math.ceil(timeUntilSessionTimeout / (60 * 1000)));
        setMinutesRemaining(remaining);
      }
    };

    // Check every 10 seconds for more responsive updates
    const interval = setInterval(checkTimeout, 10000);
    checkTimeout(); // Initial check

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [config, show, reason, handleLogout]);

  const handleExtend = () => {
    resetSession();
    markWarningShown();
    setShow(false);
    if (onExtend) {
      onExtend();
    }
  };

  if (!show) return null;

  const message =
    reason === 'idle'
      ? `You've been inactive for ${Math.floor((config.idleTimeoutMinutes * 60 * 1000 - getTimeSinceLastActivity()) / (60 * 1000))} minutes.`
      : `Your session has been active for ${Math.floor(getSessionDuration() / (60 * 60 * 1000))} hours.`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={(e) => {
          // Don't close on backdrop click - user must choose
          e.stopPropagation();
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="w-full max-w-md shadow-2xl border-2 border-yellow-400">
            <CardHeader className="bg-yellow-50 dark:bg-yellow-900/20">
              <CardTitle className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertTriangle className="w-5 h-5" />
                Session Timeout Warning
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 mb-2">{message}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your session will expire in{' '}
                      <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                        {minutesRemaining} minute{minutesRemaining !== 1 ? 's' : ''}
                      </span>
                      . Please choose an action:
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleExtend}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Stay Logged In
                  </Button>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="flex-1 border-gray-300 hover:bg-gray-100"
                  >
                    Log Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

