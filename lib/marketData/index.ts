/**
 * Market data aggregator
 * Main entry point for fetching property market data
 */

import { PropertyDetails, MarketData } from './types';
import { getPropertyDataFromRapidAPI, isRapidAPIConfigured } from './rapidapi';

/**
 * Get market data for a property
 * Aggregates data from multiple sources
 */
export async function getPropertyData(
  address: string,
  propertyDetails?: Partial<PropertyDetails>
): Promise<MarketData> {
  // For Phase 1, we only use RapidAPI
  // In future phases, we can add multiple sources and aggregate results
  
  if (!isRapidAPIConfigured()) {
    throw new Error('Market data API is not configured');
  }

  try {
    const data = await getPropertyDataFromRapidAPI(address, propertyDetails);
    return data;
  } catch (error) {
    console.error('Error fetching property data:', error);
    throw new Error('Failed to fetch property market data');
  }
}

/**
 * Find comparable properties
 * Filters and sorts comps based on relevance
 */
export function findComparables(
  marketData: MarketData,
  propertyDetails?: Partial<PropertyDetails>
): MarketData['comps'] {
  let comps = [...marketData.comps];

  // Filter by property type if specified
  if (propertyDetails?.propertyType) {
    comps = comps.filter(
      comp => comp.propertyType === propertyDetails.propertyType
    );
  }

  // Sort by distance (closer is better)
  comps.sort((a, b) => {
    const distanceA = a.distance || 999;
    const distanceB = b.distance || 999;
    return distanceA - distanceB;
  });

  // Limit to top 10 comps
  return comps.slice(0, 10);
}

