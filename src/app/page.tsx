'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SubjectPropertyForm, defaultSubject, defaultCriteria } from '@/components/search/SubjectPropertyForm';
import { SubjectMap } from '@/components/search/SubjectMap';
import { CompResultsTable } from '@/components/property/CompResultsTable';
import { AdjustmentGrid, CompAdjustments } from '@/components/property/AdjustmentGrid';
import { PhotoComparison } from '@/components/property/PhotoComparison';
import { MapView } from '@/components/property/MapView';
import { ComparisonChart } from '@/components/property/ComparisonChart';
import { PropertyDetailModal } from '@/components/property/PropertyDetailModal';
import { ExportButtons } from '@/components/ui/ExportButtons';
import { SaveAnalysisDialog } from '@/components/ui/SaveAnalysisDialog';
import { Header } from '@/components/layout/Header';
import { getAnalysis } from '@/lib/storage';
import { SubjectProperty, SearchCriteria, CompResult, SearchMode } from '@/types/property';

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const [results, setResults] = useState<CompResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [formSubject, setFormSubject] = useState<SubjectProperty>(defaultSubject);
  const [subject, setSubject] = useState<SubjectProperty | null>(null);
  const [adjustments, setAdjustments] = useState<CompAdjustments>({});
  const [indicatedValue, setIndicatedValue] = useState<number>(0);
  const [selectedProperty, setSelectedProperty] = useState<CompResult | null>(null);
  const [searchMode, setSearchMode] = useState<SearchMode>('active');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveNotice, setSaveNotice] = useState(false);
  const searchParams = useSearchParams();

  // Load saved analysis from ?load=<id> OR auto-search on page load
  const hasAutoSearched = useRef(false);
  useEffect(() => {
    if (hasAutoSearched.current) return;
    hasAutoSearched.current = true;

    const loadId = searchParams.get('load');
    if (loadId) {
      const saved = getAnalysis(loadId);
      if (saved) {
        setFormSubject(saved.subject);
        setSubject(saved.subject);
        setResults(saved.selectedComps.map(c => ({ ...c, selected: true })));
        setAdjustments(saved.adjustments);
        setIndicatedValue(saved.indicatedValue);
        setSearchMode(saved.searchMode);
        setHasSearched(true);
        return;
      }
    }
    // No auto-search on mount — wait for user action
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map click → update form + auto-search
  const handleMapLocationSelect = (updates: Partial<SubjectProperty>) => {
    const updated = { ...formSubject, ...updates };
    setFormSubject(updated);
    handleSearch(updated, defaultCriteria);
  };

  const handleSearch = async (subjectProperty: SubjectProperty, _criteria: SearchCriteria, mode?: SearchMode) => {
    const activeMode = mode ?? searchMode;
    setIsSearching(true);
    try {
      const res = await fetch('/api/comps/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subjectProperty, mode: activeMode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Search failed (${res.status})`);
      }
      const data = await res.json();
      setResults(data.results);
      setSubject(subjectProperty);
      setHasSearched(true);
      setAdjustments({});
      setIndicatedValue(0);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleModeSwitch = (mode: SearchMode) => {
    setSearchMode(mode);
    handleSearch(formSubject, defaultCriteria, mode);
  };

  const handleToggleSelect = (id: string) => {
    setResults(results.map(comp =>
      comp.id === id ? { ...comp, selected: !comp.selected } : comp
    ));
    if (selectedProperty && selectedProperty.id === id) {
      setSelectedProperty(prev => prev ? { ...prev, selected: !prev.selected } : null);
    }
  };

  const handleAdjustmentsChange = useCallback((newAdjustments: CompAdjustments, newIndicatedValue: number) => {
    setAdjustments(newAdjustments);
    setIndicatedValue(newIndicatedValue);
  }, []);

  const handlePropertyClick = (property: CompResult) => {
    setSelectedProperty(property);
  };

  const handleUseAsSubject = (property: CompResult) => {
    const updated: SubjectProperty = {
      address: property.address,
      city: property.city,
      state: property.state,
      zip: property.zip,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sqft: property.sqft,
      yearBuilt: property.yearBuilt,
      propertyType: property.propertyType,
      lat: property.lat,
      lng: property.lng,
      photos: property.photos,
      listingId: property.id,
    };
    setFormSubject(updated);
    handleSearch(updated, defaultCriteria);
  };

  const selectedComps = results.filter(r => r.selected);

  return (
    <div className="min-h-screen bg-cream dark:bg-[#0a0a0f]">
      <Header>
        {subject && selectedComps.length > 0 && (
          <>
            <div className="hidden sm:block text-right mr-2 px-4 py-1.5 rounded-lg bg-walnut-dark/50 border border-gold/20">
              <p className="text-[10px] text-gold-light/70 uppercase tracking-wider">Indicated Value</p>
              <p className="text-lg font-display font-semibold text-gold-light">
                ${indicatedValue.toLocaleString()}
              </p>
            </div>
            <ExportButtons
              subject={subject}
              comps={selectedComps}
              adjustments={adjustments}
              indicatedValue={indicatedValue}
            />
            <button
              onClick={() => setSaveDialogOpen(true)}
              className="p-2 rounded-lg bg-walnut-dark/50 hover:bg-walnut-dark/70 border border-gold/20 transition-colors relative"
              aria-label="Save analysis"
            >
              <svg className="w-5 h-5 text-gold-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {saveNotice && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-walnut-dark" />
              )}
            </button>
          </>
        )}
      </Header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar - Subject Property Form */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] flex flex-col">
              <div className="card-premium rounded-xl overflow-hidden flex flex-col min-h-0">
                {/* Leather Header */}
                <div className="leather-texture px-6 py-3 flex-shrink-0">
                  <h2 className="font-display text-lg font-semibold text-cream flex items-center gap-3 relative z-10">
                    <svg className="w-5 h-5 text-gold-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Subject Property
                  </h2>
                </div>
                {/* Map — fixed height, no scroll */}
                <div className="p-4 pb-2 bg-gradient-to-b from-cream to-cream-dark dark:from-[#111118] dark:to-[#0a0a0f] flex-shrink-0">
                  <SubjectMap
                    subject={formSubject}
                    onLocationSelect={handleMapLocationSelect}
                    listings={results}
                  />
                </div>
                {/* Scrollable form area */}
                <div className="px-6 pb-6 overflow-y-auto min-h-0 bg-gradient-to-b from-cream-dark to-cream-dark dark:from-[#0a0a0f] dark:to-[#0a0a0f]">
                  <SubjectPropertyForm
                    onSearch={handleSearch}
                    isSearching={isSearching}
                    searchMode={searchMode}
                    subject={formSubject}
                    onSubjectChange={setFormSubject}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-8">
            {/* Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-walnut/5 dark:bg-gold/5 border border-walnut/10 dark:border-gold/10 w-fit">
              <button
                onClick={() => handleModeSwitch('active')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  searchMode === 'active'
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg'
                    : 'text-walnut dark:text-cream/60 hover:text-charcoal dark:hover:text-cream hover:bg-walnut/5 dark:hover:bg-gold/5'
                }`}
              >
                Active Listings
              </button>
              <button
                onClick={() => handleModeSwitch('sold')}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  searchMode === 'sold'
                    ? 'bg-gradient-to-r from-burgundy to-burgundy/90 dark:from-gold dark:to-gold-muted text-white dark:text-walnut-dark shadow-lg'
                    : 'text-walnut dark:text-cream/60 hover:text-charcoal dark:hover:text-cream hover:bg-walnut/5 dark:hover:bg-gold/5'
                }`}
              >
                Sold Comps
              </button>
            </div>

            {/* Results Card */}
            <div className="card-premium rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-walnut/10 dark:border-gold/10 flex items-center justify-between bg-gradient-to-r from-cream to-ivory dark:from-[#111118] dark:to-[#1a1a24]">
                <h2 className="font-display text-xl font-semibold text-charcoal dark:text-cream flex items-center gap-3">
                  <svg className="w-5 h-5 text-burgundy dark:text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {searchMode === 'active' ? 'Active Listings' : 'Comparable Sales'}
                </h2>
                {hasSearched && results.length > 0 && (
                  <span className="text-sm text-walnut dark:text-gold-light/70 bg-walnut/5 dark:bg-gold/10 px-3 py-1 rounded-full">
                    {searchMode === 'active'
                      ? `${results.length} active`
                      : `${selectedComps.length} of ${results.length} selected`}
                  </span>
                )}
              </div>
              <div className="p-6 bg-gradient-to-b from-ivory to-cream dark:from-[#1a1a24] dark:to-[#111118]">
                {!hasSearched ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-burgundy/10 to-burgundy/5 dark:from-gold/10 dark:to-gold/5 flex items-center justify-center border border-burgundy/20 dark:border-gold/20">
                      <svg className="w-10 h-10 text-burgundy/60 dark:text-gold/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="font-display text-2xl font-semibold text-charcoal dark:text-cream mb-2">Ready to Search</h3>
                    <p className="text-walnut dark:text-cream/60 max-w-md mx-auto leading-relaxed">
                      Enter your subject property details and search criteria to discover comparable sales in your market.
                    </p>
                  </div>
                ) : isSearching ? (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-20 h-20 mb-6">
                      <div className="w-16 h-16 border-4 border-burgundy/20 dark:border-gold/20 border-t-burgundy dark:border-t-gold rounded-full animate-spin"></div>
                    </div>
                    <h3 className="font-display text-2xl font-semibold text-charcoal dark:text-cream mb-2">Searching the Atlas...</h3>
                    <p className="text-walnut dark:text-cream/60">Finding comparable properties in your area</p>
                  </div>
                ) : (
                  <CompResultsTable
                    results={results}
                    onToggleSelect={handleToggleSelect}
                    onPropertyClick={handlePropertyClick}
                  />
                )}
              </div>
            </div>

            {/* Map View */}
            {subject && hasSearched && results.length > 0 && (
              <MapView
                subject={subject}
                comps={results}
                selectedComps={selectedComps}
                onToggleSelect={handleToggleSelect}
              />
            )}

            {/* Comparison Chart */}
            {subject && selectedComps.length > 0 && (
              <ComparisonChart subject={subject} selectedComps={selectedComps} />
            )}

            {/* Photo Comparison */}
            {subject && selectedComps.length > 0 && (
              <PhotoComparison
                subject={subject}
                selectedComps={selectedComps}
                subjectPhoto={subject.photos?.[0]}
              />
            )}

            {/* Adjustment Grid */}
            {subject && selectedComps.length > 0 && (
              <AdjustmentGrid
                selectedComps={selectedComps}
                subject={subject}
                onAdjustmentsChange={handleAdjustmentsChange}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-walnut/10 dark:border-gold/10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold/80 to-gold-muted/80 flex items-center justify-center">
                <svg className="w-4 h-4 text-walnut-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <span className="font-display text-sm text-walnut dark:text-cream/60">CompAtlas</span>
            </div>
            <p className="text-xs text-walnut/60 dark:text-cream/40">
              Premium Appraisal Intelligence
            </p>
          </div>
        </div>
      </footer>

      {/* Property Detail Modal */}
      <PropertyDetailModal
        property={selectedProperty}
        isOpen={selectedProperty !== null}
        onClose={() => setSelectedProperty(null)}
        onToggleSelect={handleToggleSelect}
        onUseAsSubject={handleUseAsSubject}
      />

      {/* Save Analysis Dialog */}
      {subject && (
        <SaveAnalysisDialog
          isOpen={saveDialogOpen}
          onClose={() => setSaveDialogOpen(false)}
          onSaved={() => {
            setSaveNotice(true);
            setTimeout(() => setSaveNotice(false), 3000);
          }}
          subject={subject}
          selectedComps={selectedComps}
          adjustments={adjustments}
          indicatedValue={indicatedValue}
          searchMode={searchMode}
        />
      )}
    </div>
  );
}
