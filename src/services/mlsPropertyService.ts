import { Property, SubjectProperty, CompResult, SearchMode } from '@/types/property';
import { PropertyService } from './propertyService';
import { retsSearch } from '@/lib/retsClient';

/**
 * Cape May County MLS Property Service (Paragon RETS)
 *
 * Field names and lookup values are specific to this MLS.
 * Class: RE_1 (Residential), CT_5 (Condo/Townhouse)
 */

interface MLSConfig {
  retsUrl?: string;
  username?: string;
  password?: string;
  userAgent?: string;
  apiUrl?: string;
  apiKey?: string;
  googleMapsApiKey?: string;
}

// Cape May MLS system field names (NOT standard names)
const FIELDS = {
  listingId: 'L_ListingID',
  address: 'L_Address',
  city: 'L_City',
  zip: 'L_Zip',
  bedrooms: 'L_Keyword1',
  bathsFull: 'L_Keyword2',
  bathsTotal: 'LM_Dec_13',
  sqft: 'L_SquareFeet',
  yearBuilt: 'LM_Char10_1',
  type: 'L_Type_',
  askingPrice: 'L_AskingPrice',
  soldPrice: 'L_SoldPrice',
  statusDate: 'L_StatusDate',
  statusCat: 'L_StatusCatID',
  status: 'L_Status',
  daysOnMarket: 'L_PictureCount', // Using photo count as proxy; DOM not directly available
  lat: 'LMD_MP_Latitude',
  lng: 'LMD_MP_Longitude',
  photoCount: 'L_PictureCount',
};

// Select fields to request from RETS
const SELECT_FIELDS = [
  FIELDS.listingId, FIELDS.address, FIELDS.city, FIELDS.zip,
  FIELDS.bedrooms, FIELDS.bathsFull, FIELDS.bathsTotal, FIELDS.sqft,
  FIELDS.yearBuilt, FIELDS.type, FIELDS.askingPrice, FIELDS.soldPrice,
  FIELDS.statusDate, FIELDS.statusCat, FIELDS.status,
  FIELDS.lat, FIELDS.lng, FIELDS.photoCount,
];

// Lookup values for this MLS — Cape May County municipalities
const CITY_LOOKUP: Record<string, string> = {
  'Sea Isle City': 'SeaIsleC',
  'Avalon': 'Avalon',
  'Stone Harbor': 'StoneHar',
  'Cape May': 'CapeMay',
  'Cape May Court House': 'CMCrtHse',
  'Cape May Point': 'CapeMyPt',
  'Wildwood': 'Wildwood',
  'Wildwood Crest': 'WildwCrs',
  'North Wildwood': 'NWildwood',
  'Ocean City': 'OceanCty',
  'Upper Township': 'UpperTwp',
  'Middle Township': 'MiddleTp',
  'Lower Township': 'LowerTwp',
  'Dennis Township': 'DennisTp',
  'Woodbine': 'Woodbine',
  'West Cape May': 'WCapeMay',
  'West Wildwood': 'WWldwood',
};

const STATUS_SOLD = '2';  // L_StatusCatID lookup value for Sold/Closed
const STATUS_ACTIVE = '1';

// City center coordinates for lat/lng fallback when MLS doesn't return coords
// Keyed by decoded city name (COMPACT-DECODED format returns full names)
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Sea Isle City': { lat: 39.1534, lng: -74.6929 },
  'Avalon': { lat: 39.1012, lng: -74.7177 },
  'Stone Harbor': { lat: 39.0526, lng: -74.7608 },
  'Cape May': { lat: 38.9351, lng: -74.9060 },
  'Cape May Court House': { lat: 39.0826, lng: -74.8238 },
  'Cape May Point': { lat: 38.9376, lng: -74.9658 },
  'Wildwood': { lat: 38.9918, lng: -74.8148 },
  'Wildwood Crest': { lat: 38.9748, lng: -74.8238 },
  'North Wildwood': { lat: 39.0026, lng: -74.7988 },
  'Ocean City': { lat: 39.2776, lng: -74.5746 },
  'Upper Township': { lat: 39.2048, lng: -74.7238 },
  'Middle Township': { lat: 39.0426, lng: -74.8438 },
  'Lower Township': { lat: 38.9626, lng: -74.8838 },
  'Dennis Township': { lat: 39.1926, lng: -74.8238 },
  'Woodbine': { lat: 39.2416, lng: -74.8128 },
  'West Cape May': { lat: 38.9398, lng: -74.9380 },
  'West Wildwood': { lat: 38.9928, lng: -74.8268 },
};

const TYPE_LOOKUP: Record<string, string> = {
  'Single Family': '4',
  'Townhouse': '67',
};

export class MLSPropertyService implements PropertyService {
  private config: MLSConfig;

  constructor(config?: MLSConfig) {
    this.config = config || {
      retsUrl: process.env.MLS_RETS_URL,
      username: process.env.MLS_USERNAME,
      password: process.env.MLS_PASSWORD,
      userAgent: process.env.MLS_USER_AGENT || 'CompSearch/1.0',
      apiUrl: process.env.MLS_API_URL,
      apiKey: process.env.MLS_API_KEY,
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    };
  }

  async searchComps(subject: SubjectProperty, mode: SearchMode = 'sold'): Promise<CompResult[]> {
    if (!this.hasCredentials()) {
      console.warn('MLS credentials not configured');
      return [];
    }

    try {
      const listings = await this.fetchListings(subject, mode);
      return this.processResults(listings, subject, mode);
    } catch (error) {
      console.error('MLS search failed:', error);
      throw error;
    }
  }

  async getProperty(id: string): Promise<Property | null> {
    if (!this.hasCredentials()) return null;
    try {
      const results = await retsSearch(
        {
          loginUrl: this.config.retsUrl!,
          username: this.config.username!,
          password: this.config.password!,
          userAgent: this.config.userAgent,
        },
        'Property',
        'RE_1',
        `(${FIELDS.listingId}=${id})`,
        SELECT_FIELDS,
        1,
      );
      return results.length > 0 ? this.mapToProperty(results[0]) : null;
    } catch (error) {
      console.error('Failed to fetch property:', error);
      return null;
    }
  }

  async getPropertyPhotos(_id: string): Promise<string[]> {
    return [];
  }

  async geocodeAddress(
    address: string,
    city: string,
    state: string,
    zip: string
  ): Promise<{ lat: number; lng: number } | null> {
    if (!this.config.googleMapsApiKey) return null;
    const fullAddress = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`);
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${fullAddress}&key=${this.config.googleMapsApiKey}`
    );
    const data = await response.json();
    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    }
    return null;
  }

  private hasCredentials(): boolean {
    return !!(this.config.retsUrl && this.config.username && this.config.password);
  }

  private async fetchListings(subject: SubjectProperty, mode: SearchMode = 'sold'): Promise<Record<string, string>[]> {
    const query = mode === 'active'
      ? this.buildActiveQuery(subject)
      : this.buildQuery(subject);
    console.log(`RETS Query (${mode}):`, query);

    const config = {
      loginUrl: this.config.retsUrl!,
      username: this.config.username!,
      password: this.config.password!,
      userAgent: this.config.userAgent,
    };

    if (mode === 'active') {
      // Search both residential (RE_1) and condo/townhouse (CT_5) classes
      const [residential, condo] = await Promise.all([
        retsSearch(config, 'Property', 'RE_1', query, SELECT_FIELDS, 50),
        retsSearch(config, 'Property', 'CT_5', query, SELECT_FIELDS, 50).catch(() => []),
      ]);
      return [...residential, ...condo];
    }

    return retsSearch(config, 'Property', 'RE_1', query, SELECT_FIELDS, 25);
  }

  /**
   * Build DMQL2 query for active listings — filters by city + property details.
   */
  private buildActiveQuery(subject: SubjectProperty): string {
    const conditions: string[] = [];

    // City filter (case-insensitive lookup)
    const cityLookup = this.lookupCity(subject.city);
    if (cityLookup) {
      conditions.push(`(${FIELDS.city}=|${cityLookup})`);
    } else {
      // No match — search all Cape May County cities
      const allCities = Object.values(CITY_LOOKUP).join(',');
      conditions.push(`(${FIELDS.city}=|${allCities})`);
    }

    // Active status only
    conditions.push(`(${FIELDS.statusCat}=|${STATUS_ACTIVE})`);

    // Bedrooms range (wider than sold: ±2)
    if (subject.bedrooms > 0) {
      const bedMin = Math.max(1, subject.bedrooms - 2);
      const bedMax = subject.bedrooms + 2;
      conditions.push(`(${FIELDS.bedrooms}=${bedMin}-${bedMax})`);
    }

    // Baths range (±2)
    if (subject.bathrooms > 0) {
      const bathMin = Math.max(1, subject.bathrooms - 2);
      const bathMax = subject.bathrooms + 2;
      conditions.push(`(${FIELDS.bathsFull}=${bathMin}-${bathMax})`);
    }

    // Sqft range (±50% — wide to capture more active listings)
    if (subject.sqft > 0) {
      const sqftMin = Math.round(subject.sqft * 0.50);
      const sqftMax = Math.round(subject.sqft * 1.50);
      conditions.push(`(${FIELDS.sqft}=${sqftMin}-${sqftMax})`);
    }

    return conditions.join(',');
  }

  /** Case-insensitive city lookup */
  private lookupCity(city: string): string | null {
    // Try exact match first
    if (CITY_LOOKUP[city]) return CITY_LOOKUP[city];
    // Case-insensitive
    const lower = city.toLowerCase().trim();
    for (const [key, value] of Object.entries(CITY_LOOKUP)) {
      if (key.toLowerCase() === lower) return value;
    }
    return null;
  }

  /**
   * Build DMQL2 query using Cape May MLS system names and lookup values.
   */
  private buildQuery(subject: SubjectProperty): string {
    const conditions: string[] = [];

    // City filter (case-insensitive lookup)
    const cityLookup = this.lookupCity(subject.city);
    if (cityLookup) {
      conditions.push(`(${FIELDS.city}=|${cityLookup})`);
    }

    // Status: Sold only
    conditions.push(`(${FIELDS.statusCat}=|${STATUS_SOLD})`);

    // Bedrooms range
    const bedMin = Math.max(1, subject.bedrooms - 1);
    const bedMax = subject.bedrooms + 1;
    conditions.push(`(${FIELDS.bedrooms}=${bedMin}-${bedMax})`);

    // Baths range
    const bathMin = Math.max(1, subject.bathrooms - 1);
    const bathMax = subject.bathrooms + 1;
    conditions.push(`(${FIELDS.bathsFull}=${bathMin}-${bathMax})`);

    // Sqft range (+/- 25% - wider for shore properties)
    if (subject.sqft > 0) {
      const sqftMin = Math.round(subject.sqft * 0.75);
      const sqftMax = Math.round(subject.sqft * 1.25);
      conditions.push(`(${FIELDS.sqft}=${sqftMin}-${sqftMax})`);
    }

    // Date range: last 90 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    const dateStr = startDate.toISOString().split('T')[0];
    conditions.push(`(${FIELDS.statusDate}=${dateStr}+)`);

    return conditions.join(',');
  }

  private mapToProperty(listing: Record<string, string>, mode: SearchMode = 'sold'): Property {
    const bathsFull = Number(listing[FIELDS.bathsFull]) || 0;
    const bathsTotal = Number(listing[FIELDS.bathsTotal]) || bathsFull;

    // Active listings use asking price; sold use sold price (fallback to asking)
    const price = mode === 'active'
      ? Number(listing[FIELDS.askingPrice]) || 0
      : Number(listing[FIELDS.soldPrice]) || Number(listing[FIELDS.askingPrice]) || 0;

    const listingId = listing[FIELDS.listingId] || '';
    const photoCount = Math.min(Number(listing[FIELDS.photoCount]) || 0, 10);

    // Generate proxy photo URLs for each available photo
    const photos: string[] = [];
    for (let i = 0; i < photoCount; i++) {
      photos.push(`/api/photos/${listingId}?idx=${i}`);
    }

    // Use MLS lat/lng if available; fall back to city center coords with slight offset
    let lat = Number(listing[FIELDS.lat]) || 0;
    let lng = Number(listing[FIELDS.lng]) || 0;
    if (lat === 0 && lng === 0) {
      const cityName = listing[FIELDS.city] || '';
      const cityCenter = CITY_COORDS[cityName];
      if (cityCenter) {
        // Add small random offset (±0.003°, ~300m) so markers don't stack
        lat = cityCenter.lat + (Math.random() - 0.5) * 0.006;
        lng = cityCenter.lng + (Math.random() - 0.5) * 0.006;
      }
    }

    return {
      id: listingId,
      address: listing[FIELDS.address] || '',
      city: listing[FIELDS.city] || '',
      state: 'NJ',
      zip: listing[FIELDS.zip] || '',
      bedrooms: Number(listing[FIELDS.bedrooms]) || 0,
      bathrooms: bathsTotal,
      sqft: Number(listing[FIELDS.sqft]) || 0,
      yearBuilt: Number(listing[FIELDS.yearBuilt]) || 0,
      propertyType: this.mapPropertyType(listing[FIELDS.type] || ''),
      saleDate: listing[FIELDS.statusDate] || '',
      salePrice: price,
      daysOnMarket: 0,
      lat,
      lng,
      photos,
    };
  }

  private mapPropertyType(type: string): 'Single Family' | 'Condo' | 'Townhouse' {
    const t = type.toLowerCase();
    if (t.includes('condo')) return 'Condo';
    if (t.includes('town')) return 'Townhouse';
    return 'Single Family';
  }

  private processResults(listings: Record<string, string>[], subject: SubjectProperty, mode: SearchMode = 'sold'): CompResult[] {
    const MIN_SIMILARITY = 15; // Minimum score to be considered compatible
    const MAX_ACTIVE = 15;
    const MAX_SOLD = 10;

    return listings
      .map((listing) => {
        const property = this.mapToProperty(listing, mode);
        const distanceMiles = this.calculateDistance(
          subject.lat || 0, subject.lng || 0,
          property.lat, property.lng
        );

        return {
          ...property,
          distanceMiles,
          pricePerSqft: property.sqft > 0 ? Math.round(property.salePrice / property.sqft) : 0,
          selected: false,
          similarityScore: this.calculateSimilarityScore(property, subject, distanceMiles),
        };
      })
      .filter((comp) => comp.similarityScore >= MIN_SIMILARITY)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, mode === 'active' ? MAX_ACTIVE : MAX_SOLD);
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

    // Sqft similarity (35 points)
    if (subject.sqft > 0 && property.sqft > 0) {
      const sqftDiffPercent = Math.abs(property.sqft - subject.sqft) / subject.sqft;
      score += Math.max(0, 35 * (1 - sqftDiffPercent / 0.25));
    }

    // Distance similarity (25 points)
    if (distanceMiles > 0) {
      score += Math.max(0, 25 * (1 - distanceMiles / 5));
    } else {
      score += 15; // No geo data, give partial credit
    }

    // Bedroom match (20 points)
    const bedDiff = Math.abs(property.bedrooms - subject.bedrooms);
    score += bedDiff === 0 ? 20 : bedDiff === 1 ? 10 : 0;

    // Bathroom match (15 points)
    const bathDiff = Math.abs(property.bathrooms - subject.bathrooms);
    score += bathDiff === 0 ? 15 : bathDiff <= 1 ? 7 : 0;

    // Recency (5 points)
    if (property.saleDate) {
      const saleDate = new Date(property.saleDate);
      const daysSinceSale = Math.floor((Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
      score += Math.max(0, 5 * (1 - daysSinceSale / 730));
    }

    return Math.round(score);
  }
}

let serviceInstance: MLSPropertyService | null = null;

export function getMLSPropertyService(): MLSPropertyService {
  if (!serviceInstance) {
    serviceInstance = new MLSPropertyService();
  }
  return serviceInstance;
}
