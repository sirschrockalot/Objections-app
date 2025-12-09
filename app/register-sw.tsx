'use client';

import { useEffect } from 'react';
import { debug, error as logError } from '@/lib/logger';

export default function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          debug('Service Worker registered', registration);
        })
        .catch((error) => {
          logError('Service Worker registration failed', error);
        });
    }
  }, []);

  return null;
}

