/**
 * Tests for AI market analysis functions
 */

// Mock OpenAI API
global.fetch = jest.fn();

const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

describe('AI Market Analysis', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variable
    delete process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  });

  describe('analyzeComps', () => {
    it('should return basic analysis when AI is not configured', async () => {
      const { analyzeComps } = await import('@/lib/ai/marketAnalysis');
      const { PropertyDetails, ComparableProperty, MarketData } = await import('@/lib/marketData/types');

      const subjectProperty: PropertyDetails = {
        address: '123 Main St',
        bedrooms: 3,
        bathrooms: 2,
      };

      const comps: ComparableProperty[] = [
        {
          address: '125 Main St',
          soldPrice: 245000,
          soldDate: '2024-10-15',
          distance: 0.2,
        },
      ];

      const marketData: MarketData = {
        estimatedValue: 250000,
        comps: [],
        dataSource: 'test',
        fetchedAt: new Date(),
      };

      const result = await analyzeComps(subjectProperty, comps, marketData);

      expect(result).toBeDefined();
      expect(result.ranking).toHaveLength(1);
      expect(result.recommendedARV.value).toBeGreaterThan(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should call OpenAI API when configured', async () => {
      process.env.NEXT_PUBLIC_OPENAI_API_KEY = 'test-key';

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              ranking: [
                {
                  compId: 0,
                  score: 85,
                  reasoning: 'Excellent match',
                  adjustments: { size: 0, condition: 0, location: 0, timing: 0 },
                },
              ],
              recommendedARV: {
                value: 250000,
                range: { min: 240000, max: 260000 },
                confidence: 80,
                factors: ['Location', 'Size'],
              },
              riskAssessment: {
                level: 'low',
                factors: [],
              },
              recommendations: ['Verify condition'],
            }),
          },
        }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { analyzeComps } = await import('@/lib/ai/marketAnalysis');
      const { PropertyDetails, ComparableProperty, MarketData } = await import('@/lib/marketData/types');

      const subjectProperty: PropertyDetails = {
        address: '123 Main St',
      };

      const comps: ComparableProperty[] = [
        {
          address: '125 Main St',
          soldPrice: 245000,
          soldDate: '2024-10-15',
        },
      ];

      const marketData: MarketData = {
        estimatedValue: 250000,
        comps: [],
        dataSource: 'test',
        fetchedAt: new Date(),
      };

      const result = await analyzeComps(subjectProperty, comps, marketData);

      expect(mockFetch).toHaveBeenCalled();
      expect(result.ranking[0].score).toBe(85);
      expect(result.recommendedARV.value).toBe(250000);
    });

    it('should fallback to basic analysis on API error', async () => {
      process.env.NEXT_PUBLIC_OPENAI_API_KEY = 'test-key';

      mockFetch.mockRejectedValueOnce(new Error('API error'));

      const { analyzeComps } = await import('@/lib/ai/marketAnalysis');
      const { PropertyDetails, ComparableProperty, MarketData } = await import('@/lib/marketData/types');

      const subjectProperty: PropertyDetails = { address: '123 Main St' };
      const comps: ComparableProperty[] = [
        { address: '125 Main St', soldPrice: 245000, soldDate: '2024-10-15' },
      ];
      const marketData: MarketData = {
        estimatedValue: 250000,
        comps: [],
        dataSource: 'test',
        fetchedAt: new Date(),
      };

      const result = await analyzeComps(subjectProperty, comps, marketData);

      expect(result).toBeDefined();
      expect(result.ranking).toHaveLength(1);
    });
  });

  describe('analyzeMarketTrends', () => {
    it('should return basic trends when AI is not configured', async () => {
      const { analyzeMarketTrends } = await import('@/lib/ai/marketAnalysis');
      const { ComparableProperty } = await import('@/lib/marketData/types');

      const comps: ComparableProperty[] = [
        {
          address: '125 Main St',
          soldPrice: 245000,
          soldDate: '2024-10-15',
        },
      ];

      const result = await analyzeMarketTrends(comps, 'Phoenix, AZ');

      expect(result).toBeDefined();
      expect(['up', 'down', 'stable']).toContain(result.direction);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should call OpenAI API when configured', async () => {
      process.env.NEXT_PUBLIC_OPENAI_API_KEY = 'test-key';

      const mockResponse = {
        choices: [{
          message: {
            content: JSON.stringify({
              direction: 'up',
              confidence: 75,
              insights: ['Prices rising'],
              predictions: {
                next3Months: 'Continued growth',
                next6Months: 'Stable market',
              },
            }),
          },
        }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const { analyzeMarketTrends } = await import('@/lib/ai/marketAnalysis');
      const { ComparableProperty } = await import('@/lib/marketData/types');

      const comps: ComparableProperty[] = [
        {
          address: '125 Main St',
          soldPrice: 245000,
          soldDate: '2024-10-15',
        },
      ];

      const result = await analyzeMarketTrends(comps, 'Phoenix, AZ');

      expect(mockFetch).toHaveBeenCalled();
      expect(result.direction).toBe('up');
      expect(result.confidence).toBe(75);
    });
  });

  describe('isAIAnalysisAvailable', () => {
    it('should return false when API key is not set', async () => {
      delete process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      const { isAIAnalysisAvailable } = await import('@/lib/ai/marketAnalysis');
      expect(isAIAnalysisAvailable()).toBe(false);
    });

    it('should return true when API key is set', async () => {
      process.env.NEXT_PUBLIC_OPENAI_API_KEY = 'test-key';
      const { isAIAnalysisAvailable } = await import('@/lib/ai/marketAnalysis');
      expect(isAIAnalysisAvailable()).toBe(true);
    });
  });
});

