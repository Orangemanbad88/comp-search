'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { CompResult, SubjectProperty } from '@/types/property';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface PhotoComparisonProps {
  subject: SubjectProperty;
  selectedComps: CompResult[];
  subjectPhoto?: string;
}

interface ExpandedProperty {
  title: string;
  photos: string[];
  details: string;
  price?: string;
}

const DEFAULT_SUBJECT_PHOTO = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop';

function PropertyCard({
  title,
  photo,
  details,
  isSubject = false,
  price,
  onClick,
}: {
  title: string;
  photo: string | string[];
  details: string;
  isSubject?: boolean;
  price?: string;
  onClick?: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photos = Array.isArray(photo) ? photo : [photo];

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl overflow-hidden transition-all duration-300',
        onClick && 'cursor-pointer',
        isSubject
          ? 'ring-2 ring-burgundy dark:ring-gold shadow-lg'
          : 'border border-walnut/10 dark:border-gold/10 shadow-md hover:shadow-lg hover:border-walnut/20 dark:hover:border-gold/20'
      )}
    >
      <div className="relative aspect-[4/3] bg-cream-dark dark:bg-[#111118]">
        {imageError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-walnut/40 dark:text-cream/30">
              <svg className="mx-auto h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-1 text-xs">No photo</p>
            </div>
          </div>
        ) : (
          <Image
            src={photos[currentPhotoIndex]}
            alt={title}
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
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-charcoal/60 hover:bg-charcoal/80 text-cream rounded-full p-1.5 transition-colors backdrop-blur-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-charcoal/60 hover:bg-charcoal/80 text-cream rounded-full p-1.5 transition-colors backdrop-blur-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {photos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setCurrentPhotoIndex(idx); }}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-colors',
                    idx === currentPhotoIndex ? 'bg-gold' : 'bg-cream/50'
                  )}
                />
              ))}
            </div>
          </>
        )}

        {isSubject && (
          <div className="absolute top-2 left-2 bg-burgundy dark:bg-gold text-cream dark:text-charcoal text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-lg">
            Subject
          </div>
        )}

        {photos.length > 1 && (
          <div className="absolute top-2 right-2 bg-charcoal/60 backdrop-blur-sm text-cream text-[10px] font-medium px-1.5 py-0.5 rounded">
            {photos.length} photos
          </div>
        )}
      </div>

      <div className="p-3 bg-ivory dark:bg-[#1a1a24]">
        <h4 className="font-semibold text-charcoal dark:text-cream text-sm truncate">{title}</h4>
        <p className="text-xs text-walnut/60 dark:text-cream/40 mt-0.5">{details}</p>
        {price && (
          <p className="text-sm font-bold text-burgundy dark:text-gold mt-1.5">{price}</p>
        )}
      </div>
    </div>
  );
}

function PhotoLightbox({
  property,
  onClose,
}: {
  property: ExpandedProperty;
  onClose: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const photos = property.photos;

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    setImageError(false);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setImageError(false);
  }, [photos.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, goNext, goPrev]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80 backdrop-blur-md"
      onClick={handleBackdropClick}
    >
      <div className="bg-cream dark:bg-[#0a0a0f] rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-walnut/10 dark:border-gold/20">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-walnut/10 dark:border-gold/10 bg-gradient-to-r from-cream to-ivory dark:from-[#111118] dark:to-[#1a1a24]">
          <div>
            <h3 className="font-display text-lg font-semibold text-charcoal dark:text-cream">{property.title}</h3>
            <p className="text-xs text-walnut/60 dark:text-cream/40">{property.details}</p>
          </div>
          <div className="flex items-center gap-3">
            {property.price && (
              <span className="text-sm font-bold text-burgundy dark:text-gold">{property.price}</span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-walnut/10 dark:hover:bg-gold/10 transition-colors"
            >
              <svg className="w-5 h-5 text-walnut dark:text-cream/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Image */}
        <div className="relative aspect-[16/9] bg-cream-dark dark:bg-[#111118]">
          {imageError ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-walnut/40 dark:text-cream/30">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="mt-2 text-sm">Failed to load image</p>
              </div>
            </div>
          ) : (
            <Image
              src={photos[currentIndex]}
              alt={`${property.title} - Photo ${currentIndex + 1}`}
              fill
              className="object-contain"
              onError={() => setImageError(true)}
              unoptimized
            />
          )}

          {/* Photo counter */}
          <div className="absolute top-3 right-3 bg-charcoal/60 backdrop-blur-sm text-cream text-xs font-medium px-2.5 py-1 rounded-lg">
            {currentIndex + 1} / {photos.length}
          </div>

          {/* Nav arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 bg-charcoal/60 hover:bg-charcoal/80 text-cream rounded-full p-2.5 transition-colors backdrop-blur-sm"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-charcoal/60 hover:bg-charcoal/80 text-cream rounded-full p-2.5 transition-colors backdrop-blur-sm"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Thumbnail strip */}
        {photos.length > 1 && (
          <div className="flex gap-2 p-3 overflow-x-auto bg-cream-dark dark:bg-[#0a0a0f]">
            {photos.map((photo, idx) => (
              <button
                key={idx}
                onClick={() => { setCurrentIndex(idx); setImageError(false); }}
                className={cn(
                  'relative flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden transition-all',
                  idx === currentIndex
                    ? 'ring-2 ring-gold opacity-100'
                    : 'opacity-50 hover:opacity-80'
                )}
              >
                <Image
                  src={photo}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PhotoComparison({ subject, selectedComps, subjectPhoto }: PhotoComparisonProps) {
  const [expandedProperty, setExpandedProperty] = useState<ExpandedProperty | null>(null);

  if (selectedComps.length === 0) return null;

  const displayedComps = selectedComps.slice(0, 5);

  const subjectPhotos = subject.photos?.length
    ? subject.photos
    : [subjectPhoto || DEFAULT_SUBJECT_PHOTO];

  const handleSubjectClick = () => {
    setExpandedProperty({
      title: subject.address || 'Subject Property',
      photos: subjectPhotos,
      details: `${subject.bedrooms}bd · ${subject.bathrooms}ba · ${subject.sqft.toLocaleString()} sf`,
    });
  };

  const handleCompClick = (comp: CompResult) => {
    const photos = comp.photos?.length ? comp.photos : [DEFAULT_SUBJECT_PHOTO];
    setExpandedProperty({
      title: comp.address,
      photos,
      details: `${comp.bedrooms}bd · ${comp.bathrooms}ba · ${comp.sqft.toLocaleString()} sf`,
      price: formatCurrency(comp.salePrice),
    });
  };

  return (
    <div className="card-premium rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-walnut/10 dark:border-gold/10 bg-gradient-to-r from-cream to-ivory dark:from-[#111118] dark:to-[#1a1a24]">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-burgundy dark:text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 className="font-display text-xl font-semibold text-charcoal dark:text-cream">Photo Comparison</h2>
          <span className="text-xs text-walnut/50 dark:text-cream/30 ml-auto">Click to expand</span>
        </div>
      </div>

      <div className="p-6 bg-gradient-to-b from-ivory to-cream dark:from-[#1a1a24] dark:to-[#111118]">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {displayedComps.map((comp) => (
            <PropertyCard
              key={comp.id}
              title={comp.address}
              photo={comp.photos?.length ? comp.photos : [DEFAULT_SUBJECT_PHOTO]}
              details={`${comp.bedrooms}bd · ${comp.bathrooms}ba · ${comp.sqft.toLocaleString()} sf`}
              price={formatCurrency(comp.salePrice)}
              onClick={() => handleCompClick(comp)}
            />
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {expandedProperty && (
        <PhotoLightbox
          property={expandedProperty}
          onClose={() => setExpandedProperty(null)}
        />
      )}
    </div>
  );
}
