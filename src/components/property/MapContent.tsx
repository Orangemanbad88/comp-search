'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { CompResult, SubjectProperty } from '@/types/property';
import { formatCurrency } from '@/lib/utils';

interface MapContentProps {
  subject: SubjectProperty;
  comps: CompResult[];
  selectedComps: CompResult[];
  onToggleSelect: (id: string) => void;
}

export default function MapContent({ subject, comps, selectedComps, onToggleSelect }: MapContentProps) {
  const [mounted, setMounted] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const subjectMarkerRef = useRef<any>(null);
  const LRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Always keep latest callback in ref so Leaflet click handlers use fresh version
  const onToggleSelectRef = useRef(onToggleSelect);
  onToggleSelectRef.current = onToggleSelect;

  const selectedIdsRef = useRef(new Set<string>());
  selectedIdsRef.current = new Set(selectedComps.map(c => c.id));

  useEffect(() => {
    setMounted(true);
    import('leaflet').then((L) => {
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      LRef.current = L.default;
      setLeafletReady(true);
    });
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletReady || !containerRef.current || mapRef.current) return;
    const L = LRef.current;
    const subjectLat = subject.lat || 39.08;
    const subjectLng = subject.lng || -74.80;

    const map = L.map(containerRef.current).setView([subjectLat, subjectLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Subject marker
    subjectMarkerRef.current = L.marker([subjectLat, subjectLng]).addTo(map);
    subjectMarkerRef.current.bindPopup(
      `<div class="text-sm p-1">
        <div class="font-bold text-blue-600 text-xs uppercase tracking-wide mb-1">Subject Property</div>
        <div class="font-semibold text-slate-900">${subject.address || 'Subject Property'}</div>
        <div class="text-slate-500 text-xs mt-1">
          ${subject.bedrooms} bed &middot; ${subject.bathrooms} bath &middot; ${subject.sqft.toLocaleString()} sqft
        </div>
      </div>`
    );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
      subjectMarkerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady]);

  // Sync comp markers with data
  const visibleComps = showAll ? comps : comps.slice(0, 5);

  const updateMarkers = useCallback(() => {
    if (!mapRef.current || !LRef.current) return;
    const L = LRef.current;
    const map = mapRef.current;
    const existing = markersRef.current;
    const visibleIds = new Set(visibleComps.map(c => c.id));

    // Remove markers no longer visible
    for (const [id, marker] of existing) {
      if (!visibleIds.has(id)) {
        map.removeLayer(marker);
        existing.delete(id);
      }
    }

    // Add or update markers
    for (const comp of visibleComps) {
      const isSelected = selectedIdsRef.current.has(comp.id);
      const style = {
        radius: isSelected ? 10 : 7,
        color: isSelected ? '#10b981' : '#94a3b8',
        fillColor: isSelected ? '#10b981' : '#94a3b8',
        fillOpacity: 0.9,
        weight: 2,
      };

      if (existing.has(comp.id)) {
        const marker = existing.get(comp.id);
        marker.setStyle(style);
        marker.setRadius(style.radius);
      } else {
        const marker = L.circleMarker([comp.lat, comp.lng], style).addTo(map);
        marker.on('click', () => {
          onToggleSelectRef.current(comp.id);
        });
        marker.bindTooltip(
          `<div class="text-xs" style="min-width:160px">
            <div style="font-weight:600">${comp.address}</div>
            <div style="color:#64748b">${comp.city}, ${comp.state}</div>
            <div style="font-weight:700;margin-top:4px">${formatCurrency(comp.salePrice)}</div>
            <div style="color:#64748b">${comp.bedrooms}bd / ${comp.bathrooms}ba &middot; ${comp.sqft.toLocaleString()} sf</div>
          </div>`,
          { direction: 'top', offset: [0, -8] }
        );
        existing.set(comp.id, marker);
      }
    }
  }, [visibleComps]);

  useEffect(() => {
    updateMarkers();
  }, [updateMarkers, selectedComps]);

  const hiddenCount = comps.length - 5;

  if (!mounted) {
    return (
      <div className="h-64 bg-slate-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600 mb-2"></div>
          <p className="text-slate-500 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-64 rounded-xl overflow-hidden border border-slate-200">
      <div ref={containerRef} className="h-full w-full" />

      {!showAll && hiddenCount > 0 && (
        <button
          onClick={() => setShowAll(true)}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] px-4 py-2 text-xs font-semibold rounded-lg bg-white/95 text-slate-700 shadow-lg border border-slate-200 hover:bg-white hover:shadow-xl transition-shadow"
        >
          Show {hiddenCount} more comp{hiddenCount === 1 ? '' : 's'}
        </button>
      )}
    </div>
  );
}
