'use client';

import { useEffect, useState } from 'react';
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
  const [MapComponents, setMapComponents] = useState<{
    MapContainer: React.ComponentType<any>;
    TileLayer: React.ComponentType<any>;
    Marker: React.ComponentType<any>;
    Popup: React.ComponentType<any>;
    Tooltip: React.ComponentType<any>;
    CircleMarker: React.ComponentType<any>;
  } | null>(null);

  useEffect(() => {
    setMounted(true);

    // Dynamically import react-leaflet components
    Promise.all([
      import('react-leaflet'),
      import('leaflet')
    ]).then(([reactLeaflet, L]) => {
      // Fix Leaflet icon issue
      delete (L.default.Icon.Default.prototype as any)._getIconUrl;
      L.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      setMapComponents({
        MapContainer: reactLeaflet.MapContainer,
        TileLayer: reactLeaflet.TileLayer,
        Marker: reactLeaflet.Marker,
        Popup: reactLeaflet.Popup,
        Tooltip: reactLeaflet.Tooltip,
        CircleMarker: reactLeaflet.CircleMarker,
      });
    });
  }, []);

  if (!mounted || !MapComponents) {
    return (
      <div className="h-64 bg-slate-100 rounded-xl flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-blue-600 mb-2"></div>
          <p className="text-slate-500 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Tooltip, CircleMarker } = MapComponents;
  const subjectLat = subject.lat || 39.08;
  const subjectLng = subject.lng || -74.80;
  const selectedIds = new Set(selectedComps.map(c => c.id));
  const visibleComps = showAll ? comps : comps.slice(0, 5);
  const hiddenCount = comps.length - 5;

  return (
    <div className="relative h-64 rounded-xl overflow-hidden border border-slate-200">
      <MapContainer
        center={[subjectLat, subjectLng]}
        zoom={13}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={[subjectLat, subjectLng]}>
          <Popup>
            <div className="text-sm p-1">
              <div className="font-bold text-blue-600 text-xs uppercase tracking-wide mb-1">Subject Property</div>
              <div className="font-semibold text-slate-900">{subject.address || 'Subject Property'}</div>
              <div className="text-slate-500 text-xs mt-1">
                {subject.bedrooms} bed · {subject.bathrooms} bath · {subject.sqft.toLocaleString()} sqft
              </div>
            </div>
          </Popup>
        </Marker>

        {visibleComps.map((comp) => {
          const isSelected = selectedIds.has(comp.id);
          return (
            <CircleMarker
              key={comp.id}
              center={[comp.lat, comp.lng]}
              radius={isSelected ? 10 : 7}
              pathOptions={{
                color: isSelected ? '#10b981' : '#94a3b8',
                fillColor: isSelected ? '#10b981' : '#94a3b8',
                fillOpacity: 0.9,
                weight: 2,
              }}
              eventHandlers={{
                click: () => onToggleSelect(comp.id),
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                <div className="text-xs min-w-[160px]">
                  <div className="font-semibold">{comp.address}</div>
                  <div className="text-slate-500">{comp.city}, {comp.state}</div>
                  <div className="font-bold mt-1">{formatCurrency(comp.salePrice)}</div>
                  <div className="text-slate-500">{comp.bedrooms}bd / {comp.bathrooms}ba · {comp.sqft.toLocaleString()} sf</div>
                  <div className="text-slate-400 mt-1">{isSelected ? 'Click to deselect' : 'Click to select'}</div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

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
