import React, { useState, useEffect, useCallback, useRef } from 'react';
import Globe from 'globe.gl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radar, 
  Plane, 
  Satellite, 
  Activity, 
  TrendingUp,
  X,
  Layers,
  Info
} from 'lucide-react';

// NERV Theme Colors
const NERV = {
  orange: '#FF9800',
  amber: '#E8A03C',
  rust: '#8B5A2B',
  brown: '#5C3A1E',
  void: '#050505',
  alert: '#C9302C',
  grid: 'rgba(232, 160, 60, 0.15)'
};

interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  type: 'satellite' | 'aircraft' | 'earthquake' | 'market' | 'intel';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  payload: any;
}

interface WarRoomGlobeProps {
  // Data feeds
  satellites?: any[];
  aircraft?: any[];
  earthquakes?: any[];
  marketEvents?: any[];
  intelEvents?: any[];
  
  // Layer visibility
  activeLayers: {
    satellites: boolean;
    aircraft: boolean;
    earthquakes: boolean;
    markets: boolean;
    intel: boolean;
  };
  
  // Callbacks
  onMarkerClick?: (marker: MarkerData) => void;
  onRegionSelect?: (lat: number, lng: number) => void;
}

export const WarRoomGlobe: React.FC<WarRoomGlobeProps> = ({
  satellites = [],
  aircraft = [],
  earthquakes = [],
  marketEvents = [],
  intelEvents = [],
  activeLayers,
  onMarkerClick,
  onRegionSelect
}) => {
  const globeRef = useRef<any>(null);
 const globeContainerRef = useRef<HTMLDivElement>(null);
  const [selectedMarker, setSelectedMarker] = useState<MarkerData | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<MarkerData | null>(null);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(false);

  // Transform data into unified marker format
  const markers: MarkerData[] = React.useMemo(() => {
    const result: MarkerData[] = [];
    
    // Satellites
    if (activeLayers.satellites) {
      satellites.forEach(sat => {
        result.push({
          id: `sat-${sat.satid}`,
          lat: sat.latitude,
          lng: sat.longitude,
          type: 'satellite',
          severity: sat.military ? 'high' : 'medium',
          title: sat.name || 'Unknown Satellite',
          description: `${sat.type || 'Satellite'} - Altitude: ${Math.round(sat.altitude)}km`,
          payload: sat
        });
      });
    }
    
    // Aircraft
    if (activeLayers.aircraft) {
      aircraft.forEach(plane => {
        result.push({
          id: `plane-${plane.icao24}`,
          lat: plane.latitude,
          lng: plane.longitude,
          type: 'aircraft',
          severity: plane.military ? 'high' : 'low',
          title: plane.callsign || 'Unknown Aircraft',
          description: `${plane.military ? 'Military' : 'Civilian'} - Alt: ${Math.round(plane.altitude)}ft`,
          payload: plane
        });
      });
    }
    
    // Earthquakes
    if (activeLayers.earthquakes) {
      earthquakes.forEach(eq => {
        result.push({
          id: `eq-${eq.id}`,
          lat: eq.lat,
          lng: eq.lng,
          type: 'earthquake',
          severity: eq.mag > 6 ? 'critical' : eq.mag > 4 ? 'high' : 'medium',
          title: `M${eq.mag} Earthquake`,
          description: `${eq.place} - Depth: ${eq.depth}km`,
          payload: eq
        });
      });
    }
    
    // Market events (geo-located by domain)
    if (activeLayers.markets) {
      marketEvents.forEach(event => {
        // Map domains to approximate coordinates for visualization
        const geoMap: Record<string, { lat: number; lng: number; region: string }> = {
          geopolitics: { lat: 38.9, lng: -77, region: 'Washington DC' },
          crypto: { lat: 37.8, lng: -122.4, region: 'San Francisco' },
          ai: { lat: 47.6, lng: -122.3, region: 'Seattle' },
          biotech: { lat: 42.4, lng: -71.1, region: 'Boston' },
          markets: { lat: 40.7, lng: -74, region: 'New York' }
        };
        
        const geo = geoMap[event.domain] || { lat: 0, lng: 0, region: 'Global' };
        
        result.push({
          id: `market-${event.id}`,
          lat: geo.lat,
          lng: geo.lng,
          type: 'market',
          severity: event.severity,
          title: event.title.replace('[POLYMARKET] ', ''),
          description: `Odds: ${event.payload?.price_yes || 'N/A'}`,
          payload: event
        });
      });
    }
    
    // Intel events
    if (activeLayers.intel) {
      intelEvents.forEach(intel => {
        if (intel.lat && intel.lng) {
          result.push({
            id: `intel-${intel.id}`,
            lat: intel.lat,
            lng: intel.lng,
            type: 'intel',
            severity: intel.severity,
            title: intel.title,
            description: intel.thesis || intel.why_now,
            payload: intel
          });
        }
      });
    }
    
    return result;
  }, [satellites, aircraft, earthquakes, marketEvents, intelEvents, activeLayers]);

  // Initialize globe
  useEffect(() => {
    if (!globeContainerRef.current || globeRef.current) return;
    
    const globe = Globe()(globeContainerRef.current)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-dark.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundColor(NERV.void)
      .atmosphereColor(NERV.amber)
      .atmosphereAltitude(0.15)
      .pointOfView({ lat: 30, lng: 0, altitude: 2.5 })
      .width(globeContainerRef.current.clientWidth)
      .height(globeContainerRef.current.clientHeight);
    
    // NERV-styled grid
    globe
      .showGraticules(true)
      .graticuleColor(() => NERV.grid);
    
    globeRef.current = globe;
    
    // Handle resize
    const handleResize = () => {
      if (globeContainerRef.current && globeRef.current) {
        globeRef.current
          .width(globeContainerRef.current.clientWidth)
          .height(globeContainerRef.current.clientHeight);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Update markers
  useEffect(() => {
    if (!globeRef.current) return;
    
    const getMarkerColor = (type: string, severity: string) => {
      if (severity === 'critical') return NERV.alert;
      if (severity === 'high') return NERV.orange;
      if (severity === 'medium') return NERV.amber;
      
      const colors: Record<string, string> = {
        satellite: '#4FC3F7',
        aircraft: '#81C784',
        earthquake: NERV.alert,
        market: NERV.orange,
        intel: NERV.amber
      };
      return colors[type] || NERV.amber;
    };
    
    const getMarkerSize = (type: string, severity: string) => {
      const baseSizes: Record<string, number> = {
        satellite: 0.5,
        aircraft: 0.4,
        earthquake: 0.8,
        market: 0.6,
        intel: 0.5
      };
      
      const multiplier = severity === 'critical' ? 2 : severity === 'high' ? 1.5 : 1;
      return (baseSizes[type] || 0.5) * multiplier;
    };
    
    globeRef.current
      .pointsData(markers)
      .pointLat((d: MarkerData) => d.lat)
      .pointLng((d: MarkerData) => d.lng)
      .pointColor((d: MarkerData) => getMarkerColor(d.type, d.severity))
      .pointAltitude((d: MarkerData) => d.type === 'aircraft' ? 0.05 : 0.02)
      .pointRadius((d: MarkerData) => getMarkerSize(d.type, d.severity))
      .pointLabel((d: MarkerData) => `
        <div style="
          background: rgba(5, 5, 5, 0.9);
          border: 1px solid ${NERV.amber};
          padding: 8px 12px;
          border-radius: 4px;
          color: ${NERV.amber};
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          max-width: 250px;
        ">
          <strong>${d.title}</strong><br/>
          <span style="color: ${NERV.rust};">${d.description}</span>
        </div>
      `)
      .onPointClick((d: MarkerData) => {
        setSelectedMarker(d);
        setIsInfoPanelOpen(true);
        onMarkerClick?.(d);
      })
      .onPointHover((d: MarkerData | null) => {
        setHoveredMarker(d);
      });
    
    // Add arcs for aircraft paths (if we have trajectory data)
    const aircraftMarkers = markers.filter(m => m.type === 'aircraft');
    if (aircraftMarkers.length > 0) {
      // Could add arc trails here
    }
    
  }, [markers, onMarkerClick]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: NERV.void }}>
      {/* Globe Container */}
      <div 
        ref={globeContainerRef} 
        className="w-full h-full"
        style={{ cursor: hoveredMarker ? 'pointer' : 'default' }}
      />
      
      {/* CRT Scanline Effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(232, 160, 60, 0.03) 2px, rgba(232, 160, 60, 0.03) 4px)',
          zIndex: 10
        }}
      />
      
      {/* Info Panel (Slide-in) */}
      <AnimatePresence>
        {isInfoPanelOpen && selectedMarker && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-96 z-20"
            style={{
              background: `linear-gradient(180deg, rgba(5, 5, 5, 0.98) 0%, rgba(92, 58, 30, 0.95) 100%)`,
              borderLeft: `2px solid ${NERV.amber}`,
              boxShadow: `-10px 0 30px rgba(232, 160, 60, 0.2)`
            }}
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between p-4"
              style={{ borderBottom: `1px solid ${NERV.rust}` }}
            >
              <div className="flex items-center gap-2">
                {selectedMarker.type === 'satellite' && <Satellite size={20} color={NERV.amber} />}
                {selectedMarker.type === 'aircraft' && <Plane size={20} color={NERV.amber} />}
                {selectedMarker.type === 'earthquake' && <Activity size={20} color={NERV.alert} />}
                {selectedMarker.type === 'market' && <TrendingUp size={20} color={NERV.orange} />}
                {selectedMarker.type === 'intel' && <Info size={20} color={NERV.amber} />}
                <span className="font-mono text-sm tracking-wider" style={{ color: NERV.amber }}>
                  {selectedMarker.type.toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => setIsInfoPanelOpen(false)}
                className="p-1 hover:opacity-70 transition-opacity"
              >
                <X size={20} color={NERV.amber} />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 space-y-4 font-mono text-sm">
              {/* Severity Badge */}
              <div className="flex items-center gap-2">
                <span 
                  className="px-2 py-1 rounded text-xs"
                  style={{ 
                    background: selectedMarker.severity === 'critical' ? NERV.alert : 
                               selectedMarker.severity === 'high' ? NERV.orange : 
                               selectedMarker.severity === 'medium' ? NERV.amber : NERV.rust,
                    color: NERV.void
                  }}
                >
                  {selectedMarker.severity.toUpperCase()}
                </span>
                <span style={{ color: NERV.rust }}>
                  {selectedMarker.lat.toFixed(2)}°, {selectedMarker.lng.toFixed(2)}°
                </span>
              </div>
              
              {/* Title */}
              <h2 className="text-lg font-bold" style={{ color: NERV.amber }}>
                {selectedMarker.title}
              </h2>
              
              {/* Description */}
              <p style={{ color: NERV.rust }}>
                {selectedMarker.description}
              </p>
              
              {/* Payload Details */}
              <div 
                className="p-3 rounded space-y-2"
                style={{ background: 'rgba(0, 0, 0, 0.5)', border: `1px solid ${NERV.rust}` }}
              >
                <h3 style={{ color: NERV.amber }} className="text-xs tracking-wider">
                  RAW DATA
                </h3>
                <pre 
                  className="text-xs overflow-auto max-h-48"
                  style={{ color: NERV.rust }}
                >
                  {JSON.stringify(selectedMarker.payload, null, 2)}
                </pre>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <button
                  className="flex-1 py-2 px-4 rounded font-mono text-xs transition-all hover:opacity-80"
                  style={{ 
                    background: NERV.amber, 
                    color: NERV.void,
                    border: `1px solid ${NERV.amber}`
                  }}
                  onClick={() => onRegionSelect?.(selectedMarker.lat, selectedMarker.lng)}
                >
                  FOCUS REGION
                </button>
                <button
                  className="flex-1 py-2 px-4 rounded font-mono text-xs transition-all hover:opacity-80"
                  style={{ 
                    background: 'transparent', 
                    color: NERV.amber,
                    border: `1px solid ${NERV.amber}`
                  }}
                >
                  ADD TO INTEL
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Stats Overlay */}
      <div 
        className="absolute bottom-4 left-4 p-4 rounded font-mono text-xs z-10"
        style={{ 
          background: 'rgba(5, 5, 5, 0.8)',
          border: `1px solid ${NERV.rust}`,
          color: NERV.amber
        }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Satellite size={14} />
            <span>SATELLITES: {satellites.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Plane size={14} />
            <span>AIRCRAFT: {aircraft.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={14} />
            <span>SEISMIC: {earthquakes.length}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp size={14} />
            <span>MARKETS: {marketEvents.length}</span>
          </div>
          <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${NERV.rust}` }}>
            <span style={{ color: NERV.rust }}>ACTIVE MARKERS: {markers.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
