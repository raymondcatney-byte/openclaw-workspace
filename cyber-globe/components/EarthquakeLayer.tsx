// components/EarthquakeLayer.tsx - Global seismic activity overlay
'use client';

import { useMemo } from 'react';
import { useEarthquakeMonitoring, getEarthquakeIntensity } from '@/hooks/useLiveData';

interface EarthquakeLayerProps {
  enabled: boolean;
  minMagnitude?: number;
}

export function EarthquakeLayer({ enabled, minMagnitude = 4.0 }: EarthquakeLayerProps) {
  const { data: earthquakes, isLoading } = useEarthquakeMonitoring('day', enabled);

  // Filter by magnitude
  const significantQuakes = useMemo(() => {
    if (!earthquakes) return [];
    return earthquakes.filter(q => q.properties.mag >= minMagnitude);
  }, [earthquakes, minMagnitude]);

  // Count by severity
  const counts = useMemo(() => {
    return significantQuakes.reduce((acc, q) => {
      const { severity } = getEarthquakeIntensity(q.properties.mag);
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [significantQuakes]);

  if (!enabled || isLoading) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Earthquake panel */}
      <div className="absolute top-4 right-4 bg-black/80 border border-red-500/30 rounded px-3 py-2 max-w-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-500 font-mono">
            SEISMIC ACTIVITY (24H)
          </span>
        </div>

        {/* Severity breakdown */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { key: 'minor', label: 'Minor', color: 'text-yellow-500' },
            { key: 'light', label: 'Light', color: 'text-orange-500' },
            { key: 'moderate', label: 'Mod+', color: 'text-red-500' }
          ].map(({ key, label, color }) => (
            <div key={key} className="text-center">
              <div className={`text-lg font-bold ${color}`}>{counts[key] || 0}</div>
              <div className="text-[10px] text-zinc-500">{label}</div>
            </div>
          ))}
        </div>

        {/* Recent significant quakes */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">
            Significant Events
          </div>
          {significantQuakes.slice(0, 5).map((quake) => {
            const { mag } = quake.properties;
            const { color, label } = getEarthquakeIntensity(mag);
            const time = new Date(quake.properties.time).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            
            return (
              <div key={quake.id} className="flex items-center gap-3 text-xs border-l-2 border-zinc-700 pl-2">
                <div 
                  className="w-8 h-8 rounded flex items-center justify-center font-bold text-black"
                  style={{ backgroundColor: color }}
                >
                  {mag.toFixed(1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-zinc-300 truncate">{quake.properties.place}</div>
                  <div className="text-[10px] text-zinc-500">{time} • {label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
