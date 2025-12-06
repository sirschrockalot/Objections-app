/**
 * RapidAPI integration for property data
 * This is a mock implementation for Phase 1
 * In production, you would integrate with actual RapidAPI endpoints
 */

import { PropertyDetails, MarketData, ComparableProperty } from './types';

/**
 * Mock property data for testing
 * In production, this would call RapidAPI endpoints
 */
export async function getPropertyDataFromRapidAPI(
  address: string,
  propertyDetails?: Partial<PropertyDetails>
): Promise<MarketData> {
  // TODO: Replace with actual RapidAPI integration
  // Example: const response = await fetch('https://zillow-api.p.rapidapi.com/property', {
  //   headers: { 'X-RapidAPI-Key': process.env.RAPIDAPI_KEY }
  // });

  // For Phase 1, return mock data
  // This allows us to build the UI and test the flow without API costs
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock comparable properties
  const mockComps: ComparableProperty[] = [
    {
      address: '125 Main St, Phoenix, AZ',
      soldPrice: 245000,
      soldDate: '2024-10-15',
      distance: 0.2,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1520,
      propertyType: 'single-family',
    },
    {
      address: '130 Main St, Phoenix, AZ',
      soldPrice: 238000,
      soldDate: '2024-09-20',
      distance: 0.3,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1480,
      propertyType: 'single-family',
    },
    {
      address: '115 Main St, Phoenix, AZ',
      soldPrice: 252000,
      soldDate: '2024-11-01',
      distance: 0.25,
      bedrooms: 3,
      bathrooms: 2.5,
      squareFeet: 1600,
      propertyType: 'single-family',
    },
  ];

  // Calculate estimated value from comps (average of recent sales)
  const avgPrice = mockComps.reduce((sum, comp) => sum + comp.soldPrice, 0) / mockComps.length;

  return {
    estimatedValue: Math.round(avgPrice),
    comps: mockComps,
    dataSource: 'rapidapi-mock',
    fetchedAt: new Date(),
  };
}

/**
 * Validate RapidAPI configuration
 */
export function isRapidAPIConfigured(): boolean {
  // For Phase 1, we'll use mock data, so this always returns true
  // In production, check for RAPIDAPI_KEY
  return true;
}

