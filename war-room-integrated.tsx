import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WarRoomGlobe } from './war-room-globe';
import { LayerControlPanel } from './layer-control-panel';
import { 
  Radar, 
  Activity, 
  Globe as GlobeIcon,
  AlertTriangle
} from 'lucide-react';

const NERV = {
  orange: '#FF9800',
  amber: '#E8A03C',
  rust: '#8B5A2B',
  brown: '#5C3A1E',
  void: '#050505',
  alert: '#C9302C'
};

// Sample data types - replace with your actual data hooks
interface WarRoomData {
  satellites: any[];
  aircraft: any[];
  earthquakes: any[];
  marketEvents: any[];
  intelEvents: any[];
}

export const WarRoomIntegrated: React.FC = () => {
  // Layer visibility state
  const [activeLayers, setActiveLayers] = useState({
    satellites: true,
    aircraft: true,
    earthquakes: true,
    markets: true,
    intel: true
  });
  
  // Data state - replace with your actual data fetching
  const [data, setData] = useState<WarRoomData>({
    satellites: [],
    aircraft: [],
    earthquakes: [],
    marketEvents: [],
    intelEvents: []
  });
  
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch all data sources
  const fetchData = async () => {
    setLoading(true);
    try {
      // Replace these with your actual API calls
      const [
        satellitesRes,
        aircraftRes,
        earthquakesRes,
        marketsRes,
        intelRes
      ] = await Promise.all([
        fetch('/api/satellites').then(r => r.json()).catch(() => []),
        fetch('/api/aircraft').then(r => r.json()).catch(() => []),
        fetch('/api/earthquakes').then(r => r.json()).catch(() => []),
        fetch('/api/polymarket-feed').then(r => r.json()).catch(() => ({ events: [] })),
        fetch('/api/intelligence').then(r => r.json()).catch(() => ({ events: [] }))
      ]);
      
      setData({
        satellites: satellitesRes,
        aircraft: aircraftRes,
        earthquakes: earthquakesRes,
        marketEvents: marketsRes.events || [],
        intelEvents: intelRes.events || []
      });
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch War Room data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and interval
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const handleLayerToggle = (layer: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleMarkerClick = (marker: any) => {
    console.log('Marker clicked:', marker);
    // Add to intel feed, trigger alerts, etc.
  };

  const handleRegionSelect = (lat: number, lng: number) => {
    setSelectedRegion({ lat, lng });
    // Zoom globe to region, fetch regional intel, etc.
  };

  // Calculate active marker counts
  const markerCounts = {
    satellites: activeLayers.satellites ? data.satellites.length : 0,
    aircraft: activeLayers.aircraft ? data.aircraft.length : 0,
    earthquakes: activeLayers.earthquakes ? data.earthquakes.length : 0,
    markets: activeLayers.markets ? data.marketEvents.length : 0,
    intel: activeLayers.intel ? data.intelEvents.filter((e: any) => e.lat && e.lng).length : 0
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden" style={{ background: NERV.void }}>
      {/* Header */}
      <header 
        className="flex items-center justify-between px-6 py-4"
        style={{ 
          background: 'rgba(5, 5, 5, 0.9)',
          borderBottom: `2px solid ${NERV.amber}`,
          boxShadow: `0 2px 20px rgba(232, 160, 60, 0.2)`
        }}
      >
        <div className="flex items-center gap-4">
          <GlobeIcon size={28} color={NERV.amber} />
          <div>
            <h1 
              className="text-xl font-bold tracking-widest"
              style={{ color: NERV.amber, fontFamily: 'Space Grotesk' }}
            >
              WAR ROOM
            </h1>
            <p className="text-xs font-mono" style={{ color: NERV.rust }}>
              GLOBAL SITUATIONAL AWARENESS // TERMINAL-7
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Status Indicators */}
          <div className="flex items-center gap-4 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Radar size={16} color={NERV.amber} />
              <span style={{ color: NERV.amber }}>
                {loading ? 'SYNCING...' : 'ACTIVE'}
              </span>
            </div>
            
            {lastUpdate && (
              <div style={{ color: NERV.rust }}>
                LAST UPDATE: {lastUpdate.toLocaleTimeString()}
              </div>
            )}
            
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3 py-1 rounded text-xs transition-all hover:opacity-80 disabled:opacity-50"
              style={{ 
                background: NERV.amber, 
                color: NERV.void,
                border: `1px solid ${NERV.amber}`
              }}
            >
              {loading ? 'REFRESHING...' : 'REFRESH'}
            </button>
          </div>
          
          {/* Alert Count */}
          <div 
            className="flex items-center gap-2 px-3 py-1 rounded"
            style={{ 
              background: 'rgba(201, 48, 44, 0.2)', 
              border: `1px solid ${NERV.alert}`
            }}
          >
            <AlertTriangle size={16} color={NERV.alert} />
            <span className="font-mono text-sm" style={{ color: NERV.alert }}>
              {data.intelEvents.filter((e: any) => e.severity === 'critical').length} CRITICAL
            </span>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Layer Controls */}
        <motion.aside
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-80 p-4 overflow-y-auto"
          style={{ 
            background: 'rgba(5, 5, 5, 0.7)',
            borderRight: `1px solid ${NERV.rust}`
          }}
        >
          <LayerControlPanel
            activeLayers={activeLayers}
            onToggle={handleLayerToggle}
            counts={markerCounts}
          />
          
          {/* Selected Region Info */}
          {selectedRegion && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 rounded-lg"
              style={{ 
                background: 'rgba(232, 160, 60, 0.1)',
                border: `1px solid ${NERV.amber}`
              }}
            >
              <h3 className="text-xs font-mono mb-2" style={{ color: NERV.amber }}>
                SELECTED REGION
              </h3>
              <div className="font-mono text-sm" style={{ color: NERV.rust }}>
                <div>LAT: {selectedRegion.lat.toFixed(4)}°</div>
                <div>LNG: {selectedRegion.lng.toFixed(4)}°</div>
              </div>
              <button
                onClick={() => setSelectedRegion(null)}
                className="mt-2 text-xs hover:opacity-70"
                style={{ color: NERV.amber }}
              >
                CLEAR SELECTION
              </button>
            </motion.div>
          )}
          
          {/* Quick Stats */}
          <div className="mt-4 p-4 rounded-lg" style={{ border: `1px solid ${NERV.rust}` }}>
            <h3 className="text-xs font-mono mb-3" style={{ color: NERV.amber }}>
              SYSTEM STATUS
            </h3>
            <div className="space-y-2 font-mono text-xs" style={{ color: NERV.rust }}>
              <div className="flex justify-between">
                <span>SATELLITE LINK</span>
                <span style={{ color: NERV.amber }}>ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span>ADSB FEED</span>
                <span style={{ color: NERV.amber }}>ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span>USGS SEISMIC</span>
                <span style={{ color: NERV.amber }}>ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span>POLYMARKET</span>
                <span style={{ color: NERV.amber }}>ONLINE</span>
              </div>
            </div>
          </div>
        </motion.aside>
        
        {/* Center - Globe */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 relative"
        >
          <WarRoomGlobe
            satellites={data.satellites}
            aircraft={data.aircraft}
            earthquakes={data.earthquakes}
            marketEvents={data.marketEvents}
            intelEvents={data.intelEvents}
            activeLayers={activeLayers}
            onMarkerClick={handleMarkerClick}
            onRegionSelect={handleRegionSelect}
          />
        </motion.main>
      </div>
    </div>
  );
};
