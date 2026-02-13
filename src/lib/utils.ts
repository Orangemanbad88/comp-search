import { Property, SubjectProperty, SearchCriteria, CompResult } from '@/types/property';

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function filterComps(
  properties: Property[],
  subject: SubjectProperty,
  criteria: SearchCriteria
): CompResult[] {
  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setMonth(now.getMonth() - criteria.dateRangeMonths);

  return properties
    .filter((property) => {
      // Date range filter
      const saleDate = new Date(property.saleDate);
      if (saleDate < cutoffDate) return false;

      // Property type match
      if (criteria.propertyTypeMatch && property.propertyType !== subject.propertyType) {
        return false;
      }

      // Bedroom variance
      if (Math.abs(property.bedrooms - subject.bedrooms) > criteria.bedVariance) {
        return false;
      }

      // Bathroom variance
      if (Math.abs(property.bathrooms - subject.bathrooms) > criteria.bathVariance) {
        return false;
      }

      // Square footage variance
      const sqftDiff = Math.abs(property.sqft - subject.sqft) / subject.sqft;
      if (sqftDiff > criteria.sqftVariancePercent / 100) {
        return false;
      }

      // Distance filter (if subject has coordinates)
      if (subject.lat && subject.lng) {
        const distance = calculateDistance(
          subject.lat,
          subject.lng,
          property.lat,
          property.lng
        );
        if (distance > criteria.radiusMiles) return false;
      }

      return true;
    })
    .map((property) => ({
      ...property,
      distanceMiles: subject.lat && subject.lng
        ? calculateDistance(subject.lat, subject.lng, property.lat, property.lng)
        : 0,
      pricePerSqft: Math.round(property.salePrice / property.sqft),
      selected: false,
      similarityScore: 0,
    }));
}

/**
 * Search for comparable properties with similarity scoring
 *
 * MUST MATCH:
 * - Property type (exact)
 * - Beds (+/- 1)
 * - Baths (+/- 1)
 *
 * FILTERS:
 * - Sqft: within 20%
 * - Sale date: last 12 months
 * - Distance: within 2 miles
 *
 * Returns top 10 sorted by similarity score
 */
export function searchComps(
  properties: Property[],
  subject: SubjectProperty
): CompResult[] {
  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setMonth(now.getMonth() - 12); // Last 12 months

  const results = properties
    .filter((property) => {
      // MUST MATCH: Property type (exact)
      if (property.propertyType !== subject.propertyType) {
        return false;
      }

      // MUST MATCH: Beds (+/- 1)
      if (Math.abs(property.bedrooms - subject.bedrooms) > 1) {
        return false;
      }

      // MUST MATCH: Baths (+/- 1)
      if (Math.abs(property.bathrooms - subject.bathrooms) > 1) {
        return false;
      }

      // FILTER: Sale date within last 12 months
      const saleDate = new Date(property.saleDate);
      if (saleDate < cutoffDate) {
        return false;
      }

      // FILTER: Sqft within 20%
      const sqftDiff = Math.abs(property.sqft - subject.sqft) / subject.sqft;
      if (sqftDiff > 0.20) {
        return false;
      }

      // FILTER: Distance within 2 miles
      if (subject.lat && subject.lng) {
        const distance = calculateDistance(
          subject.lat,
          subject.lng,
          property.lat,
          property.lng
        );
        if (distance > 2) {
          return false;
        }
      }

      return true;
    })
    .map((property) => {
      const distanceMiles = subject.lat && subject.lng
        ? calculateDistance(subject.lat, subject.lng, property.lat, property.lng)
        : 0;

      // Calculate similarity score (0-100)
      const similarityScore = calculateSimilarityScore(property, subject, distanceMiles);

      return {
        ...property,
        distanceMiles,
        pricePerSqft: Math.round(property.salePrice / property.sqft),
        selected: false,
        similarityScore,
      };
    })
    // Sort by similarity score (highest first)
    .sort((a, b) => b.similarityScore - a.similarityScore)
    // Return top 10
    .slice(0, 10);

  return results;
}

/**
 * Calculate similarity score (0-100)
 *
 * Scoring weights:
 * - Sqft difference: 35 points (closer = higher)
 * - Distance: 25 points (closer = higher)
 * - Bed match: 20 points (exact = 20, +/-1 = 10)
 * - Bath match: 15 points (exact = 15, +/-1 = 7)
 * - Recency: 5 points (more recent = higher)
 */
function calculateSimilarityScore(
  property: Property,
  subject: SubjectProperty,
  distanceMiles: number
): number {
  let score = 0;

  // Sqft similarity (35 points max)
  // 0% diff = 35 pts, 20% diff = 0 pts
  const sqftDiffPercent = Math.abs(property.sqft - subject.sqft) / subject.sqft;
  const sqftScore = Math.max(0, 35 * (1 - sqftDiffPercent / 0.20));
  score += sqftScore;

  // Distance similarity (25 points max)
  // 0 miles = 25 pts, 2 miles = 0 pts
  const distanceScore = Math.max(0, 25 * (1 - distanceMiles / 2));
  score += distanceScore;

  // Bedroom match (20 points max)
  const bedDiff = Math.abs(property.bedrooms - subject.bedrooms);
  if (bedDiff === 0) {
    score += 20;
  } else if (bedDiff === 1) {
    score += 10;
  }

  // Bathroom match (15 points max)
  const bathDiff = Math.abs(property.bathrooms - subject.bathrooms);
  if (bathDiff === 0) {
    score += 15;
  } else if (bathDiff <= 1) {
    score += 7;
  }

  // Recency (5 points max)
  // Sales from today = 5 pts, 12 months ago = 0 pts
  const saleDate = new Date(property.saleDate);
  const now = new Date();
  const daysSinceSale = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
  const recencyScore = Math.max(0, 5 * (1 - daysSinceSale / 365));
  score += recencyScore;

  return Math.round(score);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
