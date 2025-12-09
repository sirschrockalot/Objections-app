/**
 * IndexedDB storage for audio recordings
 * Uses IndexedDB for larger storage capacity than localStorage
 */

import { SessionAudioRecording } from '@/types';
import { error as logError } from './logger';

const DB_NAME = 'ResponseReadyAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'audioRecordings';

let db: IDBDatabase | null = null;

/**
 * Initialize IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'));
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'sessionId' });
        objectStore.createIndex('recordedAt', 'recordedAt', { unique: false });
      }
    };
  });
}

/**
 * Save audio recording for a session
 */
export async function saveAudioRecording(recording: SessionAudioRecording): Promise<void> {
  try {
    // Check storage quota before saving
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      if (estimate.quota && estimate.usage) {
        const usagePercentage = (estimate.usage / estimate.quota) * 100;
        if (usagePercentage >= 95) {
          throw new Error('Storage quota nearly full. Please free up space before saving audio recordings.');
        }
      }
    }

    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    await new Promise<void>((resolve, reject) => {
      const request = store.put(recording);
      request.onsuccess = () => resolve();
      request.onerror = () => {
        const error = request.error;
        if (error && error.name === 'QuotaExceededError') {
          reject(new Error('Storage quota exceeded. Please free up space or delete old recordings.'));
        } else {
          reject(new Error('Failed to save audio recording'));
        }
      };
    });
  } catch (error) {
    logError('Failed to save audio recording', error);
    throw error;
  }
}

/**
 * Get audio recording for a session
 */
export async function getAudioRecording(sessionId: string): Promise<SessionAudioRecording | null> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(sessionId);
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        reject(new Error('Failed to get audio recording'));
      };
    });
  } catch (error) {
    logError('Failed to get audio recording', error);
    return null;
  }
}

/**
 * Check if audio recording exists for a session
 */
export async function hasAudioRecording(sessionId: string): Promise<boolean> {
  const recording = await getAudioRecording(sessionId);
  return recording !== null;
}

/**
 * Delete audio recording for a session
 */
export async function deleteAudioRecording(sessionId: string): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(sessionId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete audio recording'));
    });
  } catch (error) {
    logError('Failed to delete audio recording', error);
    throw error;
  }
}

/**
 * Get all audio recording session IDs
 */
export async function getAllAudioRecordingIds(): Promise<string[]> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();
      request.onsuccess = () => {
        resolve(request.result as string[]);
      };
      request.onerror = () => {
        reject(new Error('Failed to get audio recording IDs'));
      };
    });
  } catch (error) {
    logError('Failed to get audio recording IDs', error);
    return [];
  }
}

/**
 * Get storage usage estimate
 */
export async function getStorageUsage(): Promise<{ used: number; available: number }> {
  if (typeof navigator === 'undefined' || !('storage' in navigator) || !('estimate' in navigator.storage)) {
    return { used: 0, available: 0 };
  }

  try {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      available: estimate.quota || 0,
    };
  } catch (error) {
    logError('Failed to get storage estimate', error);
    return { used: 0, available: 0 };
  }
}

/**
 * Clear all audio recordings (use with caution)
 */
export async function clearAllAudioRecordings(): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear audio recordings'));
    });
  } catch (error) {
    logError('Failed to clear audio recordings', error);
    throw error;
  }
}

