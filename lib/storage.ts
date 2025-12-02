import { Objection, Response } from '@/types';
import { initialObjections } from '@/data/objections';

const STORAGE_KEY = 'objections-app-data';

export function getObjections(): Objection[] {
  if (typeof window === 'undefined') {
    return initialObjections;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge custom responses with initial objections
      return initialObjections.map(obj => {
        const storedObj = parsed.find((o: Objection) => o.id === obj.id);
        return {
          ...obj,
          customResponses: storedObj?.customResponses || [],
        };
      });
    }
  } catch (error) {
    console.error('Error loading objections:', error);
  }

  return initialObjections;
}

export function saveCustomResponse(objectionId: string, response: Response): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let objections: Objection[] = stored ? JSON.parse(stored) : [];

    const objectionIndex = objections.findIndex(o => o.id === objectionId);
    
    if (objectionIndex >= 0) {
      objections[objectionIndex].customResponses.push(response);
    } else {
      // Find the objection in initial data and add custom response
      const initialObj = initialObjections.find(o => o.id === objectionId);
      if (initialObj) {
        objections.push({
          ...initialObj,
          customResponses: [response],
        });
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(objections));
  } catch (error) {
    console.error('Error saving custom response:', error);
  }
}

export function getAllObjections(): Objection[] {
  return getObjections();
}

