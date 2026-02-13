import { Property, SubjectProperty, CompResult } from '@/types/property';
import { PropertyService } from './propertyService';

/**
 * SimplyRETS Demo Service
 *
 * Free demo API for testing - no signup required.
 * Uses sample MLS data from Houston area.
 *
 * Demo credentials (public):
 * - Username: simplyrets
 * - Password: simplyrets
 *
 * Docs: https://docs.simplyrets.com/
 */

const DEMO_URL = 'https://api.simplyrets.com';
const DEMO_USER = 'simplyrets';
const DEMO_PASS = 'simplyrets';

export class SimplyRetsService implements PropertyService {
  private authHeader: string;

  constructor() {
    this.authHeader = 'Basic ' + Buffer.from(`${DEMO_USER}:${DEMO_PASS}`).toString('base64');
  }

  async searchComps(subject: SubjectProperty, _mode?: string): Promise<CompResult[]> {
    try {
      // Build query params
      const params = new URLSearchParams({
        status: 'Closed',
        minbeds: String(Math.max(1, subject.bedrooms - 1)),
        maxbeds: String(subject.bedrooms + 1),
        minbaths: String(Math.max(1, subject.bathrooms - 1)),
        maxbaths: String(subject.bathrooms + 1),
        minarea: String(Math.round(subject.sqft * 0.8)),
        maxarea: String(Math.round(subject.sqft * 1.2)),
        limit: '20',
      });

      // Add property type filter
      if (subject.propertyType === 'Condo') {
        params.append('type', 'condominium');
      } else if (subject.propertyType === 'Townhouse') {
        params.append('type', 'townhouse');
      } else {
        params.append('type', 'residential');
      }

      console.log('SimplyRETS query:', params.toString());

      const response = await fetch(`${DEMO_URL}/properties?${params}`, {
        headers: {
          'Authorization': this.authHeader,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`SimplyRETS API error: ${response.status}`);
      }

      const listings = await response.json();
      console.log(`SimplyRETS returned ${listings.length} listings`);

      return this.processResults(listings, subject);
    } catch (error) {
      console.error('SimplyRETS search failed:', error);
      throw error;
    }
  }

  async getProperty(id: string): Promise<Property | null> {
    try {
      const response = await fetch(`${DEMO_URL}/properties/${id}`, {
        headers: {
          'Authorization': this.authHeader,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) return null;

      const listing = await response.json();
      return this.mapToProperty(listing);
    } catch (error) {
      console.error('Failed to fetch property:', error);
      return null;
    }
  }

  async getPropertyPhotos(id: string): Promise<string[]> {
    const property = await this.getProperty(id);
    return property?.photos || [];
  }

  async geocodeAddress(
    address: string,
    city: string,
    state: string,
    zip: string
  ): Promise<{ lat: number; lng: number } | null> {
    // SimplyRETS doesn't have geocoding - return Houston area coords for demo
    console.log(`Geocoding (demo): ${address}, ${city}, ${state} ${zip}`);
    return {
      lat: 29.7604 + (Math.random() - 0.5) * 0.1,
      lng: -95.3698 + (Math.random() - 0.5) * 0.1,
    };
  }

  // Map SimplyRETS listing to our Property type
  private mapToProperty(listing: Record<string, unknown>): Property {
    const address = listing.address as Record<string, unknown> || {};
    const property = listing.property as Record<string, unknown> || {};
    const geo = listing.geo as Record<string, unknown> || {};
    const sales = listing.sales as Record<string, unknown> || {};
    const mls = listing.mls as Record<string, unknown> || {};

    const closeDate = sales.closeDate as string || mls.statusChangeDate as string || '';
    const closePrice = (sales.closePrice as number) || (listing.listPrice as number) || 0;

    return {
      id: String(listing.mlsId || listing.listingId || ''),
      address: String(address.full || address.streetName || ''),
      city: String(address.city || ''),
      state: String(address.state || 'TX'),
      zip: String(address.postalCode || ''),
      bedrooms: Number(property.bedrooms) || 0,
      bathrooms: Number(property.bathsFull || 0) + (Number(property.bathsHalf || 0) * 0.5),
      sqft: Number(property.area) || 0,
      yearBuilt: Number(property.yearBuilt) || 0,
      propertyType: this.mapPropertyType(String(property.type || '')),
      saleDate: closeDate,
      salePrice: closePrice,
      daysOnMarket: Number(mls.daysOnMarket) || 0,
      lat: Number(geo.lat) || 0,
      lng: Number(geo.lng) || 0,
      photos: (listing.photos as string[]) || [],
    };
  }

  private mapPropertyType(type: string): 'Single Family' | 'Condo' | 'Townhouse' {
    const t = type.toLowerCase();
    if (t.includes('condo')) return 'Condo';
    if (t.includes('town')) return 'Townhouse';
    return 'Single Family';
  }

  private processResults(listings: Record<string, unknown>[], subject: SubjectProperty): CompResult[] {
    return listings
      .map((listing) => {
        const property = this.mapToProperty(listing);
        const distanceMiles = this.calculateDistance(
          subject.lat || 29.76,
          subject.lng || -95.37,
          property.lat,
          property.lng
        );

        return {
          ...property,
          distanceMiles,
          pricePerSqft: property.sqft > 0 ? Math.round(property.salePrice / property.sqft) : 0,
          selected: false,
          similarityScore: this.calculateSimilarityScore(property, subject, distanceMiles),
        };
      })
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 10);
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
    const R = 3959;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 100) / 100;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private calculateSimilarityScore(
    property: Property,
    subject: SubjectProperty,
    distanceMiles: number
  ): number {
    let score = 0;

    if (subject.sqft > 0) {
      const sqftDiffPercent = Math.abs(property.sqft - subject.sqft) / subject.sqft;
      score += Math.max(0, 35 * (1 - sqftDiffPercent / 0.20));
    }

    score += Math.max(0, 25 * (1 - distanceMiles / 10));

    const bedDiff = Math.abs(property.bedrooms - subject.bedrooms);
    score += bedDiff === 0 ? 20 : bedDiff === 1 ? 10 : 0;

    const bathDiff = Math.abs(property.bathrooms - subject.bathrooms);
    score += bathDiff === 0 ? 15 : bathDiff <= 1 ? 7 : 0;

    if (property.saleDate) {
      const saleDate = new Date(property.saleDate);
      const daysSinceSale = Math.floor((Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
      score += Math.max(0, 5 * (1 - daysSinceSale / 365));
    }

    return Math.round(score);
  }
}

// Singleton
let instance: SimplyRetsService | null = null;
export function getSimplyRetsService(): SimplyRetsService {
  if (!instance) instance = new SimplyRetsService();
  return instance;
}
