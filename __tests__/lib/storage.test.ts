/**
 * Tests for storage utilities
 */

import {
  getObjections,
  saveObjection,
  getCustomResponses,
  saveCustomResponse,
  getPracticeSessions,
  savePracticeSession,
} from '@/lib/storage';

// Mock dependencies
jest.mock('@/lib/apiClient', () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
  apiDelete: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  getCurrentUserId: jest.fn(() => 'user123'),
  isAuthenticated: jest.fn(() => true),
}));

import { apiGet, apiPost } from '@/lib/apiClient';

describe('Storage Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('getObjections', () => {
    it('should fetch objections from API when available', async () => {
      const mockObjections = [
        { id: '1', text: 'Objection 1', category: 'Price' },
        { id: '2', text: 'Objection 2', category: 'Timing' },
      ];

      const mockCustomResponses = { responses: [] };
      const mockNotes = { notes: [] };

      (apiGet as jest.Mock)
        .mockResolvedValueOnce(mockCustomResponses)
        .mockResolvedValueOnce(mockNotes);

      const result = await getObjections();

      expect(apiGet).toHaveBeenCalledWith('/api/data/custom-responses');
      expect(apiGet).toHaveBeenCalledWith('/api/data/notes');
      expect(result).toBeDefined();
    });

    it('should fall back to localStorage when API is not available', async () => {
      const mockObjections = [
        { id: '1', text: 'Objection 1', category: 'Price' },
      ];

      localStorage.setItem('objections-app-data', JSON.stringify(mockObjections));

      (apiGet as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await getObjections();

      // Should try API first, then fall back
      expect(apiGet).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('saveCustomResponse', () => {
    it('should save custom response via API', async () => {
      const mockResponse = {
        id: 'response1',
        objectionId: 'obj1',
        text: 'Custom response',
        isCustom: true,
        upvotes: 0,
        upvotedBy: [],
      };

      (apiPost as jest.Mock).mockResolvedValue({ response: mockResponse });

      const responseObject = {
        id: 'response1',
        text: 'Custom response',
        isCustom: true,
      };

      await saveCustomResponse('obj1', responseObject);

      expect(apiPost).toHaveBeenCalledWith(
        '/api/data/custom-responses',
        expect.objectContaining({
          objectionId: 'obj1',
          response: expect.objectContaining({
            text: 'Custom response',
          }),
        })
      );
    });
  });

  describe('getPracticeSessions', () => {
    it('should fetch practice sessions from API', async () => {
      const mockSessions = [
        {
          id: 'session1',
          userId: 'user1',
          date: '2024-01-01',
          objectionsPracticed: ['obj1'],
          duration: 300,
        },
      ];

      (apiGet as jest.Mock).mockResolvedValue({ sessions: mockSessions });

      const result = await getPracticeSessions();

      expect(apiGet).toHaveBeenCalledWith('/api/data/practice-sessions');
      expect(result).toEqual(mockSessions);
    });
  });

  describe('savePracticeSession', () => {
    it('should save practice session via API', async () => {
      const mockSession = {
        id: 'session1',
        userId: 'user1',
        date: '2024-01-01',
        objectionsPracticed: ['obj1'],
        duration: 300,
      };

      (apiPost as jest.Mock).mockResolvedValue({ session: mockSession });

      await savePracticeSession(mockSession);

      expect(apiPost).toHaveBeenCalledWith(
        '/api/data/practice-sessions',
        expect.objectContaining({
          session: mockSession,
        })
      );
    });
  });
});

