'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CompResult } from '@/types/property';
import { formatCurrency, formatDate, cn } from '@/lib/utils';

interface PropertyDetailModalProps {
  property: CompResult | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleSelect: (id: string) => void;
  onUseAsSubject?: (property: CompResult) => void;
}

export function PropertyDetailModal({ property, isOpen, onClose, onToggleSelect, onUseAsSubject }: PropertyDetailModalProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  if (!isOpen || !property) return null;

  const photos = property.photos?.length ? property.photos : ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop'];

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    setImageError(false);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setImageError(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-cream dark:bg-[#0a0a0f] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-walnut/10 dark:border-gold/20">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-walnut-dark/50 wood-grain">
          <div>
            <h2 className="font-display text-xl font-bold text-cream">{property.address}</h2>
            <p className="text-sm text-cream/50">{property.city}, {property.state} {property.zip}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-walnut-dark/50 transition-colors"
          >
            <svg className="w-6 h-6 text-gold-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Photo Gallery */}
          <div className="relative aspect-[16/9] bg-cream-dark dark:bg-[#111118]">
            {imageError ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-walnut/40 dark:text-cream/30">
                  <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2">No photo available</p>
                </div>
              </div>
            ) : (
              <Image
                src={photos[currentPhotoIndex]}
                alt={property.address}
                fill
                className="object-cover"
                onError={() => setImageError(true)}
                unoptimized
              />
            )}

            {photos.length > 1 && !imageError && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-charcoal/60 hover:bg-charcoal/80 text-cream rounded-full p-3 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-charcoal/60 hover:bg-charcoal/80 text-cream rounded-full p-3 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Photo indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {photos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => { setCurrentPhotoIndex(idx); setImageError(false); }}
                      className={cn(
                        'w-2 h-2 rounded-full transition-colors',
                        idx === currentPhotoIndex ? 'bg-gold' : 'bg-cream/50'
                      )}
                    />
                  ))}
                </div>

                {/* Photo counter */}
                <div className="absolute top-4 right-4 bg-charcoal/60 text-cream text-sm px-3 py-1 rounded-full">
                  {currentPhotoIndex + 1} / {photos.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {photos.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto bg-cream-dark dark:bg-[#0a0a0f]">
              {photos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => { setCurrentPhotoIndex(idx); setImageError(false); }}
                  className={cn(
                    'relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all',
                    idx === currentPhotoIndex
                      ? 'border-burgundy dark:border-gold ring-2 ring-burgundy/30 dark:ring-gold/30'
                      : 'border-transparent hover:border-walnut/30 dark:hover:border-gold/30'
                  )}
                >
                  <Image
                    src={photo}
                    alt={`Photo ${idx + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </button>
              ))}
            </div>
          )}

          {/* Property Details */}
          <div className="p-6 space-y-6 bg-gradient-to-b from-ivory to-cream dark:from-[#1a1a24] dark:to-[#111118]">
            {/* Price and Key Stats */}
            <div className="flex flex-wrap gap-6 items-center justify-between">
              <div>
                <p className="text-sm text-walnut/60 dark:text-cream/40">Sale Price</p>
                <p className="font-display text-3xl font-bold text-burgundy dark:text-gold">{formatCurrency(property.salePrice)}</p>
                <p className="text-sm text-walnut/60 dark:text-cream/40">Sold {formatDate(property.saleDate)}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className={cn(
                  'px-4 py-2 rounded-xl text-center border',
                  property.similarityScore >= 80 && 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30',
                  property.similarityScore >= 60 && property.similarityScore < 80 && 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30',
                  property.similarityScore < 60 && 'bg-walnut/5 dark:bg-cream/5 border-walnut/10 dark:border-gold/10'
                )}>
                  <p className="text-xs text-walnut/60 dark:text-cream/40">Match Score</p>
                  <p className={cn(
                    'text-2xl font-bold',
                    property.similarityScore >= 80 && 'text-emerald-600 dark:text-emerald-400',
                    property.similarityScore >= 60 && property.similarityScore < 80 && 'text-amber-600 dark:text-amber-400',
                    property.similarityScore < 60 && 'text-walnut dark:text-cream/60'
                  )}>{property.similarityScore}</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-burgundy/5 dark:bg-gold/5 border border-burgundy/10 dark:border-gold/10 rounded-xl p-4 text-center">
                <p className="font-display text-2xl font-bold text-charcoal dark:text-cream">{property.bedrooms}</p>
                <p className="text-sm text-walnut/60 dark:text-cream/40">Bedrooms</p>
              </div>
              <div className="bg-burgundy/5 dark:bg-gold/5 border border-burgundy/10 dark:border-gold/10 rounded-xl p-4 text-center">
                <p className="font-display text-2xl font-bold text-charcoal dark:text-cream">{property.bathrooms}</p>
                <p className="text-sm text-walnut/60 dark:text-cream/40">Bathrooms</p>
              </div>
              <div className="bg-burgundy/5 dark:bg-gold/5 border border-burgundy/10 dark:border-gold/10 rounded-xl p-4 text-center">
                <p className="font-display text-2xl font-bold text-charcoal dark:text-cream">{property.sqft.toLocaleString()}</p>
                <p className="text-sm text-walnut/60 dark:text-cream/40">Sq Ft</p>
              </div>
              <div className="bg-burgundy/5 dark:bg-gold/5 border border-burgundy/10 dark:border-gold/10 rounded-xl p-4 text-center">
                <p className="font-display text-2xl font-bold text-charcoal dark:text-cream">{property.yearBuilt}</p>
                <p className="text-sm text-walnut/60 dark:text-cream/40">Year Built</p>
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-walnut/10 dark:border-gold/10">
              <div className="flex justify-between">
                <span className="text-walnut/60 dark:text-cream/40">Price per Sq Ft</span>
                <span className="font-semibold text-charcoal dark:text-cream">${property.pricePerSqft}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-walnut/60 dark:text-cream/40">Distance</span>
                <span className="font-semibold text-charcoal dark:text-cream">{property.distanceMiles.toFixed(2)} mi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-walnut/60 dark:text-cream/40">Property Type</span>
                <span className="font-semibold text-charcoal dark:text-cream">{property.propertyType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-walnut/60 dark:text-cream/40">Days on Market</span>
                <span className="font-semibold text-charcoal dark:text-cream">{property.daysOnMarket}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {onUseAsSubject && (
                <button
                  onClick={() => { onUseAsSubject(property); onClose(); }}
                  className="flex-1 py-3 rounded-xl font-semibold transition-all duration-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30 dark:border-emerald-800/30"
                >
                  Use as Subject
                </button>
              )}
              <button
                onClick={() => onToggleSelect(property.id)}
                className={cn(
                  'flex-1 py-3 rounded-xl font-semibold transition-all duration-200',
                  property.selected
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 dark:border-red-800/30'
                    : 'bg-gradient-to-r from-burgundy to-burgundy-dark text-cream hover:from-burgundy-dark hover:to-burgundy shadow-lg shadow-burgundy/20 dark:from-gold dark:to-gold-muted dark:text-charcoal dark:shadow-gold/20'
                )}
              >
                {property.selected ? 'Remove from Selection' : 'Add to Selection'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
