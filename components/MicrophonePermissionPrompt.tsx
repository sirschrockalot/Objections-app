'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Mic, MicOff, AlertCircle, CheckCircle2, X } from 'lucide-react';

interface MicrophonePermissionPromptProps {
  onRequestPermission: () => Promise<void>;
  onDismiss?: () => void;
  error?: string;
}

export default function MicrophonePermissionPrompt({
  onRequestPermission,
  onDismiss,
  error,
}: MicrophonePermissionPromptProps) {
  const [isRequesting, setIsRequesting] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');

  const handleRequest = async () => {
    setIsRequesting(true);
    try {
      await onRequestPermission();
      setPermissionStatus('granted');
    } catch (err) {
      setPermissionStatus('denied');
      console.error('Permission request failed:', err);
    } finally {
      setIsRequesting(false);
    }
  };

  const checkPermissionStatus = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
      const state = result.state === 'prompt' ? 'unknown' : result.state;
      setPermissionStatus(state);
      
      result.onchange = () => {
        const newState = result.state === 'prompt' ? 'unknown' : result.state;
        setPermissionStatus(newState);
      };
    } catch (error) {
      // Permissions API not supported, try direct access
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setPermissionStatus('granted');
      } catch (err) {
        setPermissionStatus('denied');
      }
    }
  };

  // Check permission status on mount
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  if (permissionStatus === 'granted') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <Card className="border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div className="flex-1">
                <p className="font-medium text-green-900 dark:text-green-100">
                  Microphone Access Granted
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  You're ready to start voice practice!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Card className="border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {permissionStatus === 'denied' || error ? (
                <MicOff className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              ) : (
                <Mic className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
              )}
              <div>
                <CardTitle className="text-orange-900 dark:text-orange-100">
                  {permissionStatus === 'denied' || error
                    ? 'Microphone Access Required'
                    : 'Enable Microphone Access'}
                </CardTitle>
                <CardDescription className="text-orange-700 dark:text-orange-300">
                  {permissionStatus === 'denied' || error
                    ? 'Microphone access is required for voice practice. Please enable it in your browser settings.'
                    : 'To use voice practice mode, we need access to your microphone.'}
                </CardDescription>
              </div>
            </div>
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDismiss}
                className="text-orange-600 hover:text-orange-700"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="text-sm text-orange-800 dark:text-orange-200">
              <p className="font-medium mb-2">How to enable microphone access:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Click the "Request Permission" button below</li>
                <li>When prompted, click "Allow" in the browser permission dialog</li>
                <li>If you previously denied access, check your browser settings:
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li><strong>Chrome/Edge:</strong> Click the lock icon in the address bar → Site settings → Microphone → Allow</li>
                    <li><strong>Firefox:</strong> Click the lock icon → Permissions → Microphone → Allow</li>
                    <li><strong>Safari:</strong> Safari → Settings → Websites → Microphone → Allow</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRequest}
                disabled={isRequesting || permissionStatus === 'denied'}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Mic className="w-4 h-4" />
                {isRequesting ? 'Requesting...' : 'Request Permission'}
              </Button>
              <Button
                variant="outline"
                onClick={checkPermissionStatus}
                className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/30"
              >
                Check Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

