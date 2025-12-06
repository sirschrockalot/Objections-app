/**
 * Tests for market data aggregator
 */

const mockGetPropertyDataFromRapidAPI = jest.fn();
const mockIsRapidAPIConfigured = jest.fn(() => true);

jest.mock('@/lib/marketData/rapidapi', () => ({
  __esModule: true,
  getPropertyDataFromRapidAPI: (...args: any[]) => mockGetPropertyDataFromRapidAPI(...args),
  isRapidAPIConfigured: () => mockIsRapidAPIConfigured(),
}));

import { getPropertyData, findComparables } from '@/lib/marketData';
import { PropertyDetails } from '@/lib/marketData/types';

describe('Market Data Aggregator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsRapidAPIConfigured.mockReturnValue(true);
  });

  describe('getPropertyData', () => {
    it('should fetch property data from RapidAPI', async () => {
      const mockData = {
        estimatedValue: 250000,
        comps: [
          {
            address: '125 Main St',
            soldPrice: 245000,
            soldDate: '2024-10-15',
            distance: 0.2,
          },
        ],
        dataSource: 'rapidapi-mock',
        fetchedAt: new Date(),
      };

      mockGetPropertyDataFromRapidAPI.mockResolvedValue(mockData);

      const result = await getPropertyData('123 Main St, Phoenix, AZ');

      expect(result).toEqual(mockData);
      expect(mockGetPropertyDataFromRapidAPI).toHaveBeenCalledWith(
        '123 Main St, Phoenix, AZ',
        undefined
      );
    });

    it('should pass property details to data source', async () => {
      const propertyDetails: Partial<PropertyDetails> = {
        bedrooms: 3,
        bathrooms: 2,
        repairEstimate: 35000,
      };

      mockGetPropertyDataFromRapidAPI.mockResolvedValue({
        estimatedValue: 250000,
        comps: [],
        dataSource: 'rapidapi-mock',
        fetchedAt: new Date(),
      });

      await getPropertyData('123 Main St', propertyDetails);

      expect(mockGetPropertyDataFromRapidAPI).toHaveBeenCalledWith(
        '123 Main St',
        propertyDetails
      );
    });

    it('should throw error if API is not configured', async () => {
      mockIsRapidAPIConfigured.mockReturnValueOnce(false);

      await expect(getPropertyData('123 Main St')).rejects.toThrow(
        'Market data API is not configured'
      );
    });
  });

  describe('findComparables', () => {
    const mockMarketData = {
      estimatedValue: 250000,
      comps: [
        {
          address: '125 Main St',
          soldPrice: 245000,
          soldDate: '2024-10-15',
          distance: 0.3,
          propertyType: 'single-family',
          bedrooms: 3,
          bathrooms: 2,
        },
        {
          address: '130 Main St',
          soldPrice: 238000,
          soldDate: '2024-09-20',
          distance: 0.2,
          propertyType: 'single-family',
          bedrooms: 3,
          bathrooms: 2,
        },
        {
          address: '200 Oak Ave',
          soldPrice: 220000,
          soldDate: '2024-08-10',
          distance: 0.5,
          propertyType: 'condo',
          bedrooms: 2,
          bathrooms: 1,
        },
      ],
      dataSource: 'rapidapi-mock',
      fetchedAt: new Date(),
    };

    it('should return all comps if no property details provided', () => {
      const result = findComparables(mockMarketData);

      expect(result).toHaveLength(3);
    });

    it('should filter by property type', () => {
      const propertyDetails: Partial<PropertyDetails> = {
        propertyType: 'single-family',
      };

      const result = findComparables(mockMarketData, propertyDetails);

      expect(result).toHaveLength(2);
      expect(result.every(comp => comp.propertyType === 'single-family')).toBe(true);
    });

    it('should sort by distance (closest first)', () => {
      const result = findComparables(mockMarketData);

      expect(result[0].distance).toBe(0.2);
      expect(result[1].distance).toBe(0.3);
      expect(result[2].distance).toBe(0.5);
    });

    it('should limit to top 10 comps', () => {
      const manyComps = {
        ...mockMarketData,
        comps: Array.from({ length: 15 }, (_, i) => ({
          address: `Address ${i}`,
          soldPrice: 200000 + i * 1000,
          soldDate: '2024-10-15',
          distance: i * 0.1,
        })),
      };

      const result = findComparables(manyComps);

      expect(result).toHaveLength(10);
    });

    it('should handle comps without distance', () => {
      const compsWithoutDistance = {
        ...mockMarketData,
        comps: mockMarketData.comps.map(comp => ({
          ...comp,
          distance: undefined,
        })),
      };

      const result = findComparables(compsWithoutDistance);

      expect(result).toHaveLength(3);
      // Should still sort (undefined distances go to end)
    });
  });
});

