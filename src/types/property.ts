export type PropertyType = 'Single Family' | 'Condo' | 'Townhouse';
export type SearchMode = 'active' | 'sold';

export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt: number;
  propertyType: PropertyType;
  saleDate: string;
  salePrice: number;
  daysOnMarket: number;
  lat: number;
  lng: number;
  photos: string[];
}

export interface SubjectProperty {
  address: string;
  city: string;
  state: string;
  zip: string;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  yearBuilt: number;
  propertyType: PropertyType;
  lat?: number;
  lng?: number;
  photos?: string[];
  listingId?: string;
}

export interface SearchCriteria {
  radiusMiles: 0.5 | 1 | 2 | 5;
  dateRangeMonths: 3 | 6 | 12;
  bedVariance: number;
  bathVariance: number;
  sqftVariancePercent: number;
  propertyTypeMatch: boolean;
}

export interface CompResult extends Property {
  distanceMiles: number;
  pricePerSqft: number;
  selected: boolean;
  adjustedPrice?: number;
  similarityScore: number;
}
