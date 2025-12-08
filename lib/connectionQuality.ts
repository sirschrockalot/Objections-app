/**
 * Connection quality monitoring utilities
 */

import { error as logError } from './logger';

export interface ConnectionQuality {
  latency: number; // milliseconds
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  packetLoss?: number; // percentage
  jitter?: number; // milliseconds
}

/**
 * Measure WebSocket latency
 */
export function measureWebSocketLatency(ws: WebSocket): Promise<number> {
  return new Promise((resolve, reject) => {
    if (ws.readyState !== WebSocket.OPEN) {
      reject(new Error('WebSocket not connected'));
      return;
    }

    const startTime = performance.now();
    const pingMessage = JSON.stringify({ type: 'ping', timestamp: startTime });

    const timeout = setTimeout(() => {
      ws.removeEventListener('message', handlePong);
      reject(new Error('Latency measurement timeout'));
    }, 5000);

    const handlePong = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'pong' && data.timestamp === startTime) {
          clearTimeout(timeout);
          ws.removeEventListener('message', handlePong);
          const latency = performance.now() - startTime;
          resolve(latency);
        }
      } catch (error) {
        // Not a pong message, ignore
      }
    };

    ws.addEventListener('message', handlePong);
    ws.send(pingMessage);
  });
}

/**
 * Assess connection quality based on latency
 */
export function assessConnectionQuality(latency: number): ConnectionQuality['quality'] {
  if (latency < 100) return 'excellent';
  if (latency < 200) return 'good';
  if (latency < 500) return 'fair';
  return 'poor';
}

/**
 * Get connection quality indicator
 */
export function getConnectionQualityIndicator(quality: ConnectionQuality['quality']): {
  color: string;
  label: string;
  icon: string;
} {
  switch (quality) {
    case 'excellent':
      return {
        color: 'text-green-600 dark:text-green-400',
        label: 'Excellent',
        icon: '🟢',
      };
    case 'good':
      return {
        color: 'text-blue-600 dark:text-blue-400',
        label: 'Good',
        icon: '🔵',
      };
    case 'fair':
      return {
        color: 'text-yellow-600 dark:text-yellow-400',
        label: 'Fair',
        icon: '🟡',
      };
    case 'poor':
      return {
        color: 'text-red-600 dark:text-red-400',
        label: 'Poor',
        icon: '🔴',
      };
  }
}

/**
 * Monitor connection quality periodically
 */
export function createConnectionQualityMonitor(
  ws: WebSocket,
  onQualityUpdate: (quality: ConnectionQuality) => void,
  interval: number = 10000 // 10 seconds
): () => void {
  let isMonitoring = true;
  let monitorInterval: NodeJS.Timeout | null = null;

  const measureQuality = async () => {
    if (!isMonitoring || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const latency = await measureWebSocketLatency(ws);
      const quality = assessConnectionQuality(latency);

      onQualityUpdate({
        latency,
        quality,
      });
    } catch (error) {
      logError('Failed to measure connection quality', error);
      onQualityUpdate({
        latency: -1,
        quality: 'poor',
      });
    }
  };

  // Measure immediately
  measureQuality();

  // Then measure periodically
  monitorInterval = setInterval(measureQuality, interval);

  // Return cleanup function
  return () => {
    isMonitoring = false;
    if (monitorInterval) {
      clearInterval(monitorInterval);
    }
  };
}

