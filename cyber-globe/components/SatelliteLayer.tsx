// components/SatelliteLayer.tsx - Satellite orbital tracking
'use client';

import { useEffect, useRef, useState } from 'react';
import { useSatelliteTracking, Satellite } from '@/hooks/useLiveData';

interface SatelliteLayerProps {
  enabled: boolean;
  filterType?: 'all' | 'stations' | 'military' | 'weather';
}

// Satellite categories based on name patterns
function categorizeSatellite(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('space station') || n.includes('iss') || n.includes('tiangong')) return 'station';
  if (n.includes('goes') || n.includes('noaa') || n.includes('metop')) return 'weather';
  if (n.includes('cosmos') || n.includes('ofeq') || n.includes('yaogan')) return 'military';
  if (n.includes('starlink')) return 'starlink';
  return 'other';
}

// Get color based on satellite type
function getSatelliteColor(type: string): string {
  const colors: Record<string, string> = {
    station: '#3b82f6',    // Blue for space stations
    weather: '#10b981',    // Green for weather
    military: '#ef4444',   // Red for military
    starlink: '#8b5cf6',   // Purple for Starlink
    other: '#6b7280'       // Gray for others
  };
  return colors[type] || colors.other;
}

export function SatelliteLayer({ enabled, filterType = 'all' }: SatelliteLayerProps) {
  const { satellites, count } = useSatelliteTracking(enabled);
  const [selectedSat, setSelectedSat] = useState<Satellite | null>(null);

  // Filter satellites based on type
  const filteredSatellites = satellites.filter(sat => {
    if (filterType === 'all') return true;
    const type = categorizeSatellite(sat.OBJECT_NAME);
    if (filterType === 'stations') return type === 'station';
    if (filterType === 'military') return type === 'military';
    if (filterType === 'weather') return type === 'weather';
    return true;
  });

  if (!enabled) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Satellite count by category */}
      <div className="absolute top-4 left-4 bg-black/80 border border-blue-500/30 rounded px-3 py-2 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-xs text-blue-500 font-mono">
            ACTIVE SATELLITES: {filteredSatellites.length}
          </span>
        </div>
        
        {/* Category breakdown */}
        <div className="space-y-1 text-[10px]">
          {['station', 'weather', 'military', 'starlink', 'other'].map(type => {
            const count = satellites.filter(s => categorizeSatellite(s.OBJECT_NAME) === type).length;
            if (count === 0) return null;
            return (
              <div key={type} className="flex items-center gap-2">
                <div 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ backgroundColor: getSatelliteColor(type) }}
                />
                <span className="text-zinc-400 uppercase">{type}: </span>
                <span className="text-zinc-300">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/80 border border-zinc-700 rounded px-3 py-2">
        <div className="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider">Orbital Assets</div>
        <div className="space-y-1">
          {[
            { type: 'station', label: 'Space Stations' },
            { type: 'weather', label: 'Weather Sats' },
            { type: 'military', label: 'Military/Intel' },
            { type: 'starlink', label: 'Starlink' }
          ].map(({ type, label }) => (
            <div key={type} className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: getSatelliteColor(type) }}
              />
              <span className="text-xs text-zinc-300">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
