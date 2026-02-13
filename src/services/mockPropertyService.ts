import { Property, SubjectProperty, CompResult } from '@/types/property';
import { PropertyService } from './propertyService';
import propertiesData from '@/data/properties.json';

// Type assertion for mock data
const properties = propertiesData as Property[];

/**
 * Mock Property Service
 *
 * Uses local JSON data for development and testing.
 * Replace with real API implementation for production.
 */
export class MockPropertyService implements PropertyService {
  private properties: Property[] = properties;

  async searchComps(subject: SubjectProperty, _mode?: string): Promise<CompResult[]> {
    // Simulate API delay
    await this.simulateDelay(300);

    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setMonth(now.getMonth() - 12);

    const results = this.properties
      .filter((property) => {
        // MUST MATCH: Property type
        if (property.propertyType !== subject.propertyType) return false;

        // MUST MATCH: Beds (+/- 1)
        if (Math.abs(property.bedrooms - subject.bedrooms) > 1) return false;

        // MUST MATCH: Baths (+/- 1)
        if (Math.abs(property.bathrooms - subject.bathrooms) > 1) return false;

        // FILTER: Sale date within 12 months
        const saleDate = new Date(property.saleDate);
        if (saleDate < cutoffDate) return false;

        // FILTER: Sqft within 20%
        const sqftDiff = Math.abs(property.sqft - subject.sqft) / subject.sqft;
        if (sqftDiff > 0.20) return false;

        // FILTER: Distance within 2 miles
        if (subject.lat && subject.lng) {
          const distance = this.calculateDistance(
            subject.lat,
            subject.lng,
            property.lat,
            property.lng
          );
          if (distance > 2) return false;
        }

        return true;
      })
      .map((property) => {
        const distanceMiles = subject.lat && subject.lng
          ? this.calculateDistance(subject.lat, subject.lng, property.lat, property.lng)
          : 0;

        return {
          ...property,
          distanceMiles,
          pricePerSqft: Math.round(property.salePrice / property.sqft),
          selected: false,
          similarityScore: this.calculateSimilarityScore(property, subject, distanceMiles),
        };
      })
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 10);

    return results;
  }

  async getProperty(id: string): Promise<Property | null> {
    await this.simulateDelay(100);
    return this.properties.find((p) => p.id === id) || null;
  }

  async getPropertyPhotos(id: string): Promise<string[]> {
    await this.simulateDelay(100);
    const property = this.properties.find((p) => p.id === id);
    return property?.photos || [];
  }

  async geocodeAddress(
    address: string,
    city: string,
    state: string,
    zip: string
  ): Promise<{ lat: number; lng: number } | null> {
    await this.simulateDelay(200);

    // Mock geocoding - returns Fort Myers center coordinates
    // In production, use Google Geocoding API or similar
    console.log(`Geocoding: ${address}, ${city}, ${state} ${zip}`);

    return {
      lat: 26.6406 + (Math.random() - 0.5) * 0.1,
      lng: -81.8723 + (Math.random() - 0.5) * 0.1,
    };
  }

  // Helper methods

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
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

    // Sqft similarity (35 points max)
    const sqftDiffPercent = Math.abs(property.sqft - subject.sqft) / subject.sqft;
    score += Math.max(0, 35 * (1 - sqftDiffPercent / 0.20));

    // Distance similarity (25 points max)
    score += Math.max(0, 25 * (1 - distanceMiles / 2));

    // Bedroom match (20 points max)
    const bedDiff = Math.abs(property.bedrooms - subject.bedrooms);
    score += bedDiff === 0 ? 20 : bedDiff === 1 ? 10 : 0;

    // Bathroom match (15 points max)
    const bathDiff = Math.abs(property.bathrooms - subject.bathrooms);
    score += bathDiff === 0 ? 15 : bathDiff <= 1 ? 7 : 0;

    // Recency (5 points max)
    const saleDate = new Date(property.saleDate);
    const daysSinceSale = Math.floor((Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
    score += Math.max(0, 5 * (1 - daysSinceSale / 365));

    return Math.round(score);
  }

  private simulateDelay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
let serviceInstance: MockPropertyService | null = null;

export function getPropertyService(): MockPropertyService {
  if (!serviceInstance) {
    serviceInstance = new MockPropertyService();
  }
  return serviceInstance;
}
