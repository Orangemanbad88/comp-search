'use client';

import { useState } from 'react';
import { SubjectProperty, SearchCriteria, PropertyType, SearchMode } from '@/types/property';
import { Button } from '@/components/ui/Button';

interface SubjectPropertyFormProps {
  onSearch: (subject: SubjectProperty, criteria: SearchCriteria) => void;
  isSearching?: boolean;
  searchMode?: SearchMode;
  subject: SubjectProperty;
  onSubjectChange: (subject: SubjectProperty) => void;
}

// Cape May County cities — matches MLS lookup values
const CAPE_MAY_CITIES = [
  'Sea Isle City',
  'Avalon',
  'Stone Harbor',
  'Cape May',
  'Cape May Court House',
  'Cape May Point',
  'Wildwood',
  'Wildwood Crest',
  'North Wildwood',
  'Ocean City',
  'Upper Township',
  'Middle Township',
  'Lower Township',
  'Dennis Township',
  'Woodbine',
  'West Cape May',
  'West Wildwood',
];

export const defaultSubject: SubjectProperty = {
  address: '205 84th Street',
  city: 'Sea Isle City',
  state: 'NJ',
  zip: '08243',
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1800,
  yearBuilt: 1970,
  propertyType: 'Single Family',
  lat: 39.1534,
  lng: -74.6929,
};

export const defaultCriteria: SearchCriteria = {
  radiusMiles: 5,
  dateRangeMonths: 12,
  bedVariance: 1,
  bathVariance: 1,
  sqftVariancePercent: 20,
  propertyTypeMatch: true,
};

export function SubjectPropertyForm({ onSearch, isSearching = false, searchMode = 'sold', subject, onSubjectChange }: SubjectPropertyFormProps) {
  const isActive = searchMode === 'active';
  const setSubject = onSubjectChange;
  const [criteria, setCriteria] = useState<SearchCriteria>(defaultCriteria);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(subject, criteria);
  };

  const inputClass = "input-premium w-full px-3 py-2.5 rounded-lg text-sm text-charcoal dark:text-cream placeholder-walnut/50 dark:placeholder-cream/30";
  const labelClass = "block text-xs font-semibold text-walnut dark:text-gold-light/70 uppercase tracking-wider mb-1.5";
  const sectionClass = "space-y-4";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Property Details */}
      <div className={sectionClass}>
        <div>
          <label className={labelClass}>Address</label>
          <input
            type="text"
            className={inputClass}
            value={subject.address}
            onChange={(e) => setSubject({ ...subject, address: e.target.value })}
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>City</label>
            <select
              className={inputClass}
              value={subject.city}
              onChange={(e) => setSubject({ ...subject, city: e.target.value })}
            >
              {CAPE_MAY_CITIES.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>State</label>
              <input
                type="text"
                className={inputClass}
                value={subject.state}
                onChange={(e) => setSubject({ ...subject, state: e.target.value })}
                placeholder="NJ"
                maxLength={2}
              />
            </div>
            <div>
              <label className={labelClass}>ZIP</label>
              <input
                type="text"
                className={inputClass}
                value={subject.zip}
                onChange={(e) => setSubject({ ...subject, zip: e.target.value })}
                placeholder="08243"
                maxLength={5}
              />
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Property Type</label>
          <select
            className={inputClass}
            value={subject.propertyType}
            onChange={(e) => setSubject({ ...subject, propertyType: e.target.value as PropertyType })}
          >
            <option value="Single Family">Single Family</option>
            <option value="Condo">Condo</option>
            <option value="Townhouse">Townhouse</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Beds</label>
            <input
              type="number"
              className={inputClass}
              value={subject.bedrooms}
              onChange={(e) => setSubject({ ...subject, bedrooms: parseInt(e.target.value) || 0 })}
              min={0}
              max={10}
            />
          </div>
          <div>
            <label className={labelClass}>Baths</label>
            <input
              type="number"
              className={inputClass}
              value={subject.bathrooms}
              onChange={(e) => setSubject({ ...subject, bathrooms: parseFloat(e.target.value) || 0 })}
              min={0}
              max={10}
              step={0.5}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Sq Ft</label>
            <input
              type="number"
              className={inputClass}
              value={subject.sqft}
              onChange={(e) => setSubject({ ...subject, sqft: parseInt(e.target.value) || 0 })}
              min={0}
            />
          </div>
          <div>
            <label className={labelClass}>Year Built <span className="text-walnut/40 dark:text-cream/30 normal-case">(opt)</span></label>
            <input
              type="number"
              className={inputClass}
              value={subject.yearBuilt || ''}
              onChange={(e) => setSubject({ ...subject, yearBuilt: parseInt(e.target.value) || 0 })}
              placeholder="Any"
              min={1800}
              max={2030}
            />
          </div>
        </div>
      </div>

      {/* Brass Divider */}
      <div className="divider-brass"></div>

      {/* Search Criteria — only shown for sold comps mode */}
      {!isActive && (
        <div className={sectionClass}>
          <p className="text-xs font-semibold text-burgundy dark:text-gold uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Search Filters
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Radius</label>
              <select
                className={inputClass}
                value={criteria.radiusMiles}
                onChange={(e) => setCriteria({ ...criteria, radiusMiles: parseFloat(e.target.value) as 0.5 | 1 | 2 | 5 })}
              >
                <option value={0.5}>0.5 mi</option>
                <option value={1}>1 mi</option>
                <option value={2}>2 mi</option>
                <option value={5}>5 mi</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Timeframe</label>
              <select
                className={inputClass}
                value={criteria.dateRangeMonths}
                onChange={(e) => setCriteria({ ...criteria, dateRangeMonths: parseInt(e.target.value) as 3 | 6 | 12 })}
              >
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Bed +/-</label>
              <select
                className={inputClass}
                value={criteria.bedVariance}
                onChange={(e) => setCriteria({ ...criteria, bedVariance: parseInt(e.target.value) })}
              >
                <option value={0}>Exact</option>
                <option value={1}>+/- 1</option>
                <option value={2}>+/- 2</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Bath +/-</label>
              <select
                className={inputClass}
                value={criteria.bathVariance}
                onChange={(e) => setCriteria({ ...criteria, bathVariance: parseInt(e.target.value) })}
              >
                <option value={0}>Exact</option>
                <option value={1}>+/- 1</option>
                <option value={2}>+/- 2</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Sq Ft Range</label>
            <select
              className={inputClass}
              value={criteria.sqftVariancePercent}
              onChange={(e) => setCriteria({ ...criteria, sqftVariancePercent: parseInt(e.target.value) })}
            >
              <option value={10}>+/- 10%</option>
              <option value={20}>+/- 20%</option>
              <option value={30}>+/- 30%</option>
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              className="w-4 h-4 text-burgundy dark:text-gold bg-ivory dark:bg-charcoal border-walnut/30 dark:border-gold/30 rounded focus:ring-burgundy dark:focus:ring-gold focus:ring-2 transition-colors"
              checked={criteria.propertyTypeMatch}
              onChange={(e) => setCriteria({ ...criteria, propertyTypeMatch: e.target.checked })}
            />
            <span className="text-sm text-walnut dark:text-cream/70 group-hover:text-charcoal dark:group-hover:text-cream transition-colors">Match property type</span>
          </label>
        </div>
      )}

      {isActive && (
        <p className="text-xs text-walnut/60 dark:text-cream/40 text-center">
          Showing all active listings in the selected city. Change the city above to search a different area.
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSearching}>
        {isSearching ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Searching...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {isActive ? 'Search Active Listings' : 'Search Comparables'}
          </span>
        )}
      </Button>
    </form>
  );
}
