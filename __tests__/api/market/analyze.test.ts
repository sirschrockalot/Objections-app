/**
 * Tests for /api/market/analyze endpoint
 */

// Mock mongoose and models before any imports
jest.mock('mongoose', () => {
  const mockSchema = {
    index: jest.fn().mockReturnThis(),
  };
  const mockModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  };
  const MockSchema = jest.fn(() => mockSchema);
  (MockSchema as any).Types = {
    Mixed: {},
  };
  const mockMongoose = {
    connect: jest.fn(),
    models: {
      PropertyAnalysis: mockModel,
    },
    model: jest.fn(() => mockModel),
    Schema: MockSchema,
  };
  return {
    default: mockMongoose,
    Schema: MockSchema,
    model: jest.fn(() => mockModel),
  };
});

jest.mock('@/lib/mongodb', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({}),
}));

jest.mock('@/lib/models/PropertyAnalysis', () => {
  const mockModel = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockModel,
  };
});

jest.mock('@/lib/models/User', () => {
  return {
    __esModule: true,
    default: {
      findOne: jest.fn(),
      create: jest.fn(),
    },
  };
});

jest.mock('@/lib/authMiddleware', () => {
  const { NextResponse } = require('next/server');
  return {
    __esModule: true,
    requireAuth: jest.fn(),
    requireAdmin: jest.fn(),
    createAuthErrorResponse: jest.fn((authResult) => {
      return NextResponse.json(
        { error: authResult.error || 'Authentication failed' },
        { status: authResult.statusCode || 401 }
      );
    }),
  };
});

jest.mock('@/lib/rateLimiter', () => ({
  __esModule: true,
  createRateLimitMiddleware: jest.fn(() => jest.fn().mockResolvedValue({ allowed: true, remaining: 99 })),
  RATE_LIMITS: {
    auth: { maxRequests: 5, windowMs: 900000 },
    api: { maxRequests: 100, windowMs: 60000 },
    read: { maxRequests: 200, windowMs: 60000 },
  },
}));

jest.mock('@/lib/marketData', () => ({
  __esModule: true,
  getPropertyData: jest.fn(),
  findComparables: jest.fn(),
}));

jest.mock('@/lib/ai/marketAnalysis', () => ({
  __esModule: true,
  analyzeComps: jest.fn(),
  analyzeMarketTrends: jest.fn(),
  isAIAnalysisAvailable: jest.fn(() => false),
}));

jest.mock('@/lib/inputValidation', () => ({
  __esModule: true,
  sanitizeString: jest.fn(),
  sanitizeEmail: jest.fn(),
  sanitizeObjectId: jest.fn(),
}));

jest.mock('@/lib/errorHandler', () => ({
  __esModule: true,
  logError: jest.fn(),
  getSafeErrorMessage: jest.fn((error, defaultMessage) => defaultMessage || 'An error occurred'),
}));

import { POST, GET } from '@/app/api/market/analyze/route';
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PropertyAnalysis from '@/lib/models/PropertyAnalysis';

import { requireAuth } from '@/lib/authMiddleware';
import { createRateLimitMiddleware } from '@/lib/rateLimiter';
import { getPropertyData, findComparables } from '@/lib/marketData';
import { analyzeComps, analyzeMarketTrends, isAIAnalysisAvailable } from '@/lib/ai/marketAnalysis';
import { sanitizeString } from '@/lib/inputValidation';
import { getSafeErrorMessage, logError } from '@/lib/errorHandler';

const mockRequireAuth = requireAuth as jest.MockedFunction<typeof requireAuth>;
const mockCreateRateLimitMiddleware = createRateLimitMiddleware as jest.MockedFunction<typeof createRateLimitMiddleware>;
const mockGetPropertyData = getPropertyData as jest.MockedFunction<typeof getPropertyData>;
const mockFindComparables = findComparables as jest.MockedFunction<typeof findComparables>;
const mockAnalyzeComps = analyzeComps as jest.MockedFunction<typeof analyzeComps>;
const mockAnalyzeMarketTrends = analyzeMarketTrends as jest.MockedFunction<typeof analyzeMarketTrends>;
const mockIsAIAnalysisAvailable = isAIAnalysisAvailable as jest.MockedFunction<typeof isAIAnalysisAvailable>;
const mockSanitizeString = sanitizeString as jest.MockedFunction<typeof sanitizeString>;
const mockGetSafeErrorMessage = getSafeErrorMessage as jest.MockedFunction<typeof getSafeErrorMessage>;
const mockLogError = logError as jest.MockedFunction<typeof logError>;

const mockPropertyAnalysis = PropertyAnalysis as jest.MockedClass<typeof PropertyAnalysis>;

describe('/api/market/analyze', () => {
  const mockUserId = 'user123';
  const mockAddress = '123 Main St, Phoenix, AZ';
  const mockSanitizedAddress = '123 main st, phoenix, az';

  const mockRateLimit = {
    allowed: true,
    remaining: 100,
    resetTime: Date.now() + 60000,
  };

  const mockAuth = {
    authenticated: true,
    userId: mockUserId,
    isAdmin: false,
  };

  const mockMarketData = {
    estimatedValue: 250000,
    comps: [
      {
        address: '125 Main St, Phoenix, AZ',
        soldPrice: 245000,
        soldDate: '2024-10-15',
        distance: 0.2,
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 1520,
      },
      {
        address: '130 Main St, Phoenix, AZ',
        soldPrice: 238000,
        soldDate: '2024-09-20',
        distance: 0.3,
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 1480,
      },
    ],
    dataSource: 'rapidapi-mock',
    fetchedAt: new Date(),
  };

  const mockRateLimitMiddleware = jest.fn().mockResolvedValue(mockRateLimit);

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mocks
    mockCreateRateLimitMiddleware.mockReturnValue(mockRateLimitMiddleware);
    mockRequireAuth.mockResolvedValue(mockAuth);
    mockSanitizeString.mockReturnValue(mockSanitizedAddress);
    mockGetPropertyData.mockResolvedValue(mockMarketData);
    mockFindComparables.mockReturnValue(mockMarketData.comps);
    mockIsAIAnalysisAvailable.mockReturnValue(false); // Default to no AI
    mockGetSafeErrorMessage.mockReturnValue('An error occurred');

    // Mock PropertyAnalysis model
    const mockCreatedAnalysis = {
      _id: 'analysis123',
      userId: mockUserId,
      propertyAddress: mockSanitizedAddress,
      propertyDetails: { address: mockAddress },
      marketData: {
        ...mockMarketData,
        arv: 241500,
        repairEstimate: 0,
        mao: 169050,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockPropertyAnalysis.findOne as jest.Mock) = jest.fn().mockResolvedValue(null);
    (mockPropertyAnalysis.create as jest.Mock) = jest.fn().mockResolvedValue(mockCreatedAnalysis);
    (mockPropertyAnalysis.find as jest.Mock) = jest.fn().mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });
    (mockPropertyAnalysis.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(0);
  });

  describe('POST', () => {
    it('should require authentication', async () => {
      mockRequireAuth.mockResolvedValue({
        authenticated: false,
        userId: null,
      });

      const request = new NextRequest('http://localhost/api/market/analyze', {
        method: 'POST',
        body: JSON.stringify({ address: mockAddress }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Authentication required');
    });

    it('should require address', async () => {
      mockSanitizeString.mockReturnValue(null); // Invalid address
      
      const request = new NextRequest('http://localhost/api/market/analyze', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Property address is required');
    });

    it('should sanitize address input', async () => {
      const request = new NextRequest('http://localhost/api/market/analyze', {
        method: 'POST',
        body: JSON.stringify({ address: mockAddress }),
      });

      await POST(request);

      expect(mockSanitizeString).toHaveBeenCalledWith(mockAddress, 500);
    });

    it('should return cached analysis if available', async () => {
      const cachedAnalysis = {
        _id: 'cached123',
        userId: mockUserId,
        propertyAddress: mockSanitizedAddress,
        propertyDetails: { address: mockAddress },
        marketData: mockMarketData,
        createdAt: new Date(),
      };

      mockPropertyAnalysis.findOne.mockResolvedValue(cachedAnalysis);

      const request = new NextRequest('http://localhost/api/market/analyze', {
        method: 'POST',
        body: JSON.stringify({ address: mockAddress }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cached).toBe(true);
      expect(data.analysis.id).toBe('cached123');
      expect(mockGetPropertyData).not.toHaveBeenCalled();
    });

    it('should fetch market data and create new analysis', async () => {
      const request = new NextRequest('http://localhost/api/market/analyze', {
        method: 'POST',
        body: JSON.stringify({
          address: mockAddress,
          propertyDetails: { repairEstimate: 35000 },
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cached).toBe(false);
      expect(data.analysis).toBeDefined();
      expect(mockGetPropertyData).toHaveBeenCalledWith(mockSanitizedAddress, { repairEstimate: 35000 });
      expect(mockFindComparables).toHaveBeenCalled();
      expect(mockPropertyAnalysis.create).toHaveBeenCalled();
    });

    it('should calculate ARV from comps', async () => {
      const request = new NextRequest('http://localhost/api/market/analyze', {
        method: 'POST',
        body: JSON.stringify({ address: mockAddress }),
      });

      await POST(request);

      const createCall = mockPropertyAnalysis.create as jest.Mock;
      expect(createCall).toHaveBeenCalled();
      const createdData = createCall.mock.calls[0]?.[0];
      
      // ARV should be average of comp prices: (245000 + 238000) / 2 = 241500
      expect(createdData?.marketData?.arv).toBe(241500);
    });

    it('should calculate MAO correctly (70% of ARV minus repairs)', async () => {
      const repairEstimate = 35000;
      const request = new NextRequest('http://localhost/api/market/analyze', {
        method: 'POST',
        body: JSON.stringify({
          address: mockAddress,
          propertyDetails: { repairEstimate },
        }),
      });

      await POST(request);

      const createCall = mockPropertyAnalysis.create as jest.Mock;
      expect(createCall).toHaveBeenCalled();
      const createdData = createCall.mock.calls[0]?.[0];
      
      // MAO = (241500 * 0.7) - 35000 = 169050 - 35000 = 134050
      expect(createdData?.marketData?.mao).toBe(134050);
      expect(createdData?.marketData?.repairEstimate).toBe(repairEstimate);
    });

    it('should handle errors gracefully', async () => {
      mockGetPropertyData.mockRejectedValueOnce(new Error('API error'));

      const request = new NextRequest('http://localhost/api/market/analyze', {
        method: 'POST',
        body: JSON.stringify({ address: mockAddress }),
      });

      const response = await POST(request);
      expect(response).toBeDefined();
      const data = await response.json().catch(() => ({ error: 'Failed to parse' }));

      expect(response.status).toBe(500);
      if (data && typeof data === 'object') {
        expect(data).toHaveProperty('error');
      }
      expect(mockLogError).toHaveBeenCalled();
    });

    it('should apply rate limiting', async () => {
      const rateLimitResponse = {
        allowed: false,
        remaining: 0,
        response: NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 }),
      };

      mockRateLimitMiddleware.mockResolvedValue(rateLimitResponse);

      const request = new NextRequest('http://localhost/api/market/analyze', {
        method: 'POST',
        body: JSON.stringify({ address: mockAddress }),
      });

      const response = await POST(request);

      expect(response.status).toBe(429);
    });
  });

  describe('GET', () => {
    it('should require authentication', async () => {
      mockRequireAuth.mockResolvedValueOnce({
        authenticated: false,
        userId: null,
      });

      const request = new NextRequest('http://localhost/api/market/analyze');

      const response = await GET(request);
      expect(response).toBeDefined();
      const data = await response.json().catch(() => ({}));

      expect(response.status).toBe(401);
      if (data && typeof data === 'object') {
        expect(data.error).toBe('Authentication required');
      }
    });

    it('should return user analyses with pagination', async () => {
      const mockAnalyses = [
        {
          _id: 'analysis1',
          userId: mockUserId,
          propertyAddress: '123 Main St',
          propertyDetails: {},
          marketData: mockMarketData,
          createdAt: new Date(),
        },
        {
          _id: 'analysis2',
          userId: mockUserId,
          propertyAddress: '456 Oak Ave',
          propertyDetails: {},
          marketData: mockMarketData,
          createdAt: new Date(),
        },
      ];

      const mockFindChain = {
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockAnalyses),
      };
      mockFindChain.sort.mockReturnValue(mockFindChain);
      mockFindChain.limit.mockReturnValue(mockFindChain);
      mockFindChain.skip.mockReturnValue(mockFindChain);

      (mockPropertyAnalysis.find as jest.Mock) = jest.fn().mockReturnValue(mockFindChain);
      (mockPropertyAnalysis.countDocuments as jest.Mock) = jest.fn().mockResolvedValue(2);

      const request = new NextRequest('http://localhost/api/market/analyze?limit=10&offset=0');

      const response = await GET(request);
      expect(response).toBeDefined();
      const data = await response.json().catch(() => ({}));

      expect(response.status).toBe(200);
      if (data && typeof data === 'object') {
        expect(data.analyses).toHaveLength(2);
        expect(data.total).toBe(2);
        expect(data.limit).toBe(10);
        expect(data.offset).toBe(0);
      }
    });
  });
});

