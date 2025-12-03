'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, HardDrive, X, Trash2, Download, Info } from 'lucide-react';
import {
  getStorageUsage,
  checkStorageWarnings,
  formatBytes,
  getLargestStorageItems,
  StorageWarning,
  StorageUsage,
} from '@/lib/storageQuota';
import { exportAllData, downloadJSON } from '@/lib/exportImport';
import { getVoiceSessions } from '@/lib/voiceSessionStorage';
import { clearAllAudioRecordings } from '@/lib/audioStorage';

interface StorageQuotaWarningProps {
  onDismiss?: () => void;
  autoCheck?: boolean; // Auto-check on mount and periodically
  showDetails?: boolean;
}

export default function StorageQuotaWarning({
  onDismiss,
  autoCheck = true,
  showDetails = false,
}: StorageQuotaWarningProps) {
  const [warning, setWarning] = useState<StorageWarning | null>(null);
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [largestItems, setLargestItems] = useState<Array<{ key: string; size: number; type: 'localStorage' }>>([]);
  const [showFullDetails, setShowFullDetails] = useState(showDetails);
  const [isExporting, setIsExporting] = useState(false);

  const checkStorage = async () => {
    try {
      const [storageWarning, storageUsage, largeItems] = await Promise.all([
        checkStorageWarnings(),
        getStorageUsage(),
        Promise.resolve(getLargestStorageItems()),
      ]);

      setWarning(storageWarning);
      setUsage(storageUsage);
      setLargestItems(largeItems);
    } catch (error) {
      console.error('Error checking storage:', error);
    }
  };

  useEffect(() => {
    if (!autoCheck) return;

    // Check immediately
    checkStorage();

    // Check every 5 minutes
    const interval = setInterval(checkStorage, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoCheck]);

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = exportAllData();
      const filename = `response-ready-backup-${new Date().toISOString().split('T')[0]}.json`;
      downloadJSON(data, filename);
    } catch (error) {
      alert('Failed to export data: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleCleanupAudio = async () => {
    if (!confirm('Are you sure you want to delete all audio recordings? This cannot be undone.')) {
      return;
    }

    try {
      await clearAllAudioRecordings();
      await checkStorage();
      alert('Audio recordings cleared successfully');
    } catch (error) {
      alert('Failed to clear audio recordings: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  if (isDismissed || !warning) return null;

  const getWarningColor = () => {
    switch (warning.level) {
      case 'critical':
        return 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info':
        return 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20';
    }
  };

  const getIconColor = () => {
    switch (warning.level) {
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'info':
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getTitleColor = () => {
    switch (warning.level) {
      case 'critical':
        return 'text-red-900 dark:text-red-100';
      case 'warning':
        return 'text-yellow-900 dark:text-yellow-100';
      case 'info':
        return 'text-blue-900 dark:text-blue-100';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-4"
      >
        <Card className={getWarningColor()}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <HardDrive className={`w-5 h-5 mt-0.5 ${getIconColor()}`} />
                <div>
                  <CardTitle className={getTitleColor()}>
                    {warning.level === 'critical'
                      ? 'Storage Critically Full'
                      : warning.level === 'warning'
                      ? 'Storage Warning'
                      : 'Storage Information'}
                  </CardTitle>
                  <CardDescription
                    className={
                      warning.level === 'critical'
                        ? 'text-red-700 dark:text-red-300'
                        : warning.level === 'warning'
                        ? 'text-yellow-700 dark:text-yellow-300'
                        : 'text-blue-700 dark:text-blue-300'
                    }
                  >
                    {warning.message}
                  </CardDescription>
                </div>
              </div>
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDismiss}
                  className={getIconColor()}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Storage Usage Display */}
              {usage && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Total Storage Usage</span>
                    <span className="font-semibold">
                      {formatBytes(usage.total.used)} / {formatBytes(usage.total.total)} (
                      {usage.total.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${
                        warning.level === 'critical'
                          ? 'bg-red-600'
                          : warning.level === 'warning'
                          ? 'bg-yellow-600'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(usage.total.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs mt-3">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">localStorage:</span>
                      <span className="ml-2 font-medium">
                        {formatBytes(usage.localStorage.used)} / {formatBytes(usage.localStorage.total)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">IndexedDB:</span>
                      <span className="ml-2 font-medium">
                        {formatBytes(usage.indexedDB.used)} / {formatBytes(usage.indexedDB.total)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Recommended Actions:
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {warning.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-wrap pt-2">
                <Button
                  onClick={handleExport}
                  disabled={isExporting}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isExporting ? 'Exporting...' : 'Export Data'}
                </Button>
                {warning.level === 'critical' && (
                  <Button
                    onClick={handleCleanupAudio}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear Audio Recordings
                  </Button>
                )}
                <Button
                  onClick={() => setShowFullDetails(!showFullDetails)}
                  variant="ghost"
                  size="sm"
                >
                  {showFullDetails ? 'Hide' : 'Show'} Details
                </Button>
              </div>

              {/* Detailed Storage Breakdown */}
              {showFullDetails && largestItems.length > 0 && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold mb-2">Largest Storage Items:</h4>
                  <div className="space-y-1 text-xs">
                    {largestItems.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                          {item.key}
                        </span>
                        <span className="font-medium">{formatBytes(item.size)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

