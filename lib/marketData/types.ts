/**
 * Types for market data integration
 */

export interface PropertyDetails {
  address: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSize?: number;
  yearBuilt?: number;
  propertyType?: string;
  condition?: string;
  zipCode?: string;
  city?: string;
  state?: string;
}

export interface ComparableProperty {
  address: string;
  soldPrice: number;
  soldDate: string;
  distance?: number; // in miles
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  lotSize?: number;
  propertyType?: string;
  condition?: string;
  yearBuilt?: number;
}

export interface MarketData {
  estimatedValue?: number;
  comps: ComparableProperty[];
  dataSource: string;
  fetchedAt: Date;
  error?: string;
}

export interface PropertyLookupRequest {
  address: string;
  propertyDetails?: Partial<PropertyDetails>;
}

