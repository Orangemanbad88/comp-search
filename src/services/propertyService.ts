import { Property, SubjectProperty, CompResult, SearchMode } from '@/types/property';

/**
 * Property Service Interface
 *
 * Implement this interface to connect to different data sources:
 * - Mock data (development)
 * - MLS API (production)
 * - CoreLogic, ATTOM, Zillow APIs
 * - County records
 */
export interface PropertyService {
  /**
   * Search for comparable properties based on subject property
   */
  searchComps(subject: SubjectProperty, mode?: SearchMode): Promise<CompResult[]>;

  /**
   * Get a single property by ID
   */
  getProperty(id: string): Promise<Property | null>;

  /**
   * Get property photos
   */
  getPropertyPhotos(id: string): Promise<string[]>;

  /**
   * Geocode an address to get lat/lng coordinates
   */
  geocodeAddress(address: string, city: string, state: string, zip: string): Promise<{ lat: number; lng: number } | null>;
}

/**
 * Search parameters for finding comps
 * Extend this as needed for your data source
 */
export interface CompSearchParams {
  subject: SubjectProperty;
  radiusMiles?: number;
  dateRangeMonths?: number;
  maxResults?: number;
}

/**
 * Configuration for property service
 */
export interface PropertyServiceConfig {
  // MLS API
  mlsApiKey?: string;
  mlsApiUrl?: string;

  // CoreLogic
  coreLogicApiKey?: string;

  // ATTOM
  attomApiKey?: string;

  // Zillow
  zillowApiKey?: string;

  // Google Geocoding
  googleMapsApiKey?: string;
}

// Export the active service instance
// Set DATA_SOURCE in .env.local: 'mock' | 'simplyrets' | 'mls'
import { MockPropertyService, getPropertyService as getMockService } from './mockPropertyService';
import { MLSPropertyService, getMLSPropertyService } from './mlsPropertyService';
import { SimplyRetsService, getSimplyRetsService } from './simplyRetsService';

const DATA_SOURCE = process.env.DATA_SOURCE || 'mock';

export function getActivePropertyService(): PropertyService {
  switch (DATA_SOURCE) {
    case 'simplyrets':
      return getSimplyRetsService();
    case 'mls':
      return getMLSPropertyService();
    default:
      return getMockService();
  }
}

// For backward compatibility
export const PropertyServiceImpl = DATA_SOURCE === 'mls'
  ? MLSPropertyService
  : DATA_SOURCE === 'simplyrets'
    ? SimplyRetsService
    : MockPropertyService;
