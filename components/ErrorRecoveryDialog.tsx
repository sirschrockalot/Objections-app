'use client';

import { useState } from 'react';
import { error as logError } from '@/lib/logger';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Download, Trash2, X } from 'lucide-react';
import { StorageError, handleStorageError, recoverFromStorageError } from '@/lib/errorRecovery';
import { exportAllData, downloadJSON } from '@/lib/exportImport';

interface ErrorRecoveryDialogProps {
  error: unknown;
  onDismiss: () => void;
  onRetry?: () => void;
  context?: string; // e.g., 'saving voice session', 'loading data'
}

export default function ErrorRecoveryDialog({
  error,
  onDismiss,
  onRetry,
  context = 'operation',
}: ErrorRecoveryDialogProps) {
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  const [storageError, setStorageError] = useState<StorageError | null>(null);

  // Analyze error on mount
  useState(() => {
    const analyzed = handleStorageError(error);
    setStorageError(analyzed);
  });

  if (!storageError) {
    // Re-analyze if not set
    const analyzed = handleStorageError(error);
    setStorageError(analyzed);
  }

  const handleRecovery = async () => {
    if (!storageError || !storageError.recoverable) return;

    setIsRecovering(true);
    try {
      // Attempt recovery based on error type
      const recovered = await recoverFromStorageError(storageError, '');
      if (recovered && onRetry) {
        onRetry();
        onDismiss();
      } else {
        setRecoveryAttempted(true);
      }
    } catch (recoveryError) {
      logError('Recovery failed', recoveryError);
      setRecoveryAttempted(true);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const filename = `response-ready-backup-${new Date().toISOString().split('T')[0]}.json`;
      downloadJSON(data, filename);
    } catch (exportError) {
      alert('Failed to export data: ' + (exportError instanceof Error ? exportError.message : 'Unknown error'));
    }
  };

  if (!storageError) return null;

  const getErrorColor = () => {
    switch (storageError.type) {
      case 'quota':
        return 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20';
      case 'corruption':
        return 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20';
      case 'permission':
        return 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20';
      default:
        return 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[10001] flex items-center justify-center p-4"
        onClick={onDismiss}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="max-w-lg w-full"
        >
          <Card className={getErrorColor()}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mt-0.5" />
                  <div>
                    <CardTitle className="text-xl">
                      {storageError.type === 'quota'
                        ? 'Storage Full'
                        : storageError.type === 'corruption'
                        ? 'Data Corruption Detected'
                        : storageError.type === 'permission'
                        ? 'Permission Denied'
                        : 'Error Occurred'}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {storageError.message}
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onDismiss}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {context && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Context: {context}
                </p>
              )}

              {/* Suggestions */}
              {storageError.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Suggested Actions:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {storageError.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recovery Status */}
              {recoveryAttempted && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
                  Recovery attempted. If the issue persists, please try the suggested actions.
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap pt-2">
                {storageError.recoverable && !recoveryAttempted && (
                  <Button
                    onClick={handleRecovery}
                    disabled={isRecovering}
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isRecovering ? 'animate-spin' : ''}`} />
                    {isRecovering ? 'Recovering...' : 'Attempt Recovery'}
                  </Button>
                )}
                {storageError.type === 'quota' && (
                  <Button
                    onClick={handleExport}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export Data
                  </Button>
                )}
                {onRetry && (
                  <Button
                    onClick={onRetry}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retry
                  </Button>
                )}
                <Button onClick={onDismiss} variant="ghost" className="flex-1">
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

