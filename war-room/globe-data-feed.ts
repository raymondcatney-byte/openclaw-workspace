// ============================================================================
// GLOBE DATA FEED - For 3D/2D Globe Visualization
// ============================================================================
// Feeds your existing globe with real-time intelligence layers
// No UI changes - just structured data your globe consumes
// ============================================================================

// ============================================================================
// GLOBE FEATURE TYPES
// ============================================================================

export type GlobeLayer = 
  | 'conflicts'      // ACLED events - red dots, sized by fatalities
  | 'vessels'        // AIS tracks - moving dots with trails
  | 'flights'        // ADS-B - aircraft positions
  | 'sentiment'      // Telegram heatmap - colored regions
  | 'infrastructure' // DNS status - site up/down indicators
  | 'cyber'          // CISA alerts - origin points
  | 'ports'          // Port congestion - status rings
  | 'markets'        // Polymarket events - location-tagged
  | 'earthquakes'    // USGS seismic - magnitude circles
  | 'simulations';   // War game scenarios - animated regions

export interface GlobePoint {
  id: string;
  lat: number;
  lng: number;
  layer: GlobeLayer;
  timestamp: number;
  
  // Visual properties (your globe consumes these)
  color: string;           // Hex color
  size: number;            // Point size (pixels or relative)
  opacity: number;         // 0-1
  pulse?: boolean;         // Pulse animation for critical
  
  // Data payload (tooltip/popup content)
  title: string;
  description: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  
  // For moving objects (vessels, flights)
  heading?: number;        // Degrees
  speed?: number;          // Knots or km/h
  trail?: [number, number][]; // Last N positions [lat, lng][]
  
  // For regions/heatmap
  radius?: number;         // KM radius for heatmap circles
  intensity?: number;      // 0-1 for heatmap intensity
  
  // Links back to your systems
  makaveliQuery?: string;  // Click triggers Makaveli analysis
  bruceQuery?: string;     // Click triggers Bruce analysis
  polymarketMarketId?: string; // Link to related market
}

export interface GlobeArc {
  id: string;
  from: { lat: number; lng: number; label?: string };
  to: { lat: number; lng: number; label?: string };
  layer: 'trade_routes' | 'flight_paths' | 'supply_chains' | 'cyber_attacks';
  
  // Visual
  color: string;
  width: number;
  animated: boolean;       // Flow animation
  animationSpeed?: number;
  
  // Data
  volume?: number;         // Trade volume, flight count, etc.
  timestamp: number;
  status: 'active' | 'disrupted' | 'surging';
}

export interface GlobeRegion {
  id: string;
  name: string;
  bounds: [number, number, number, number]; // [minLat, minLng, maxLat, maxLng]
  layer: 'sentiment_heatmap' | 'conflict_zone' | 'economic_status' | 'infrastructure_health';
  
  // Visual
  color: string;
  opacity: number;
  
  // Data
  intensity: number;       // 0-1
  sentiment?: 'fearful' | 'defiant' | 'neutral' | 'optimistic';
  status?: 'critical' | 'stressed' | 'stable' | 'growing';
  
  // Metrics
  metrics: Record<string, number>;
  change24h?: Record<string, number>; // Change in last 24h
}

// ============================================================================
// GLOBE DATA STATE
// ============================================================================

export interface GlobeDataState {
  points: GlobePoint[];
  arcs: GlobeArc[];
  regions: GlobeRegion[];
  lastUpdated: number;
  activeLayers: GlobeLayer[];
}

// ============================================================================
// DATA TRANSFORMERS (Raw -> Globe Format)
// ============================================================================

export const GlobeTransformers = {
  // ACLED conflict events -> Red dots
  conflicts: (raw: any[]): GlobePoint[] => {
    return raw.map(event => ({
      id: `conflict-${event.data_id}`,
      lat: parseFloat(event.latitude),
      lng: parseFloat(event.longitude),
      layer: 'conflicts',
      timestamp: new Date(event.event_date).getTime(),
      color: event.fatalities > 10 ? '#ff0000' : event.fatalities > 0 ? '#ff6600' : '#ffaa00',
      size: Math.min(20, 5 + (event.fatalities || 1) * 2),
      opacity: 0.8,
      pulse: event.fatalities > 20,
      title: `${event.event_type} - ${event.country}`,
      description: `${event.notes || 'No details'} | Actors: ${event.actor1}${event.actor2 ? ' vs ' + event.actor2 : ''}`,
      category: event.sub_event_type,
      severity: event.fatalities > 10 ? 'critical' : event.fatalities > 0 ? 'high' : 'medium',
      makaveliQuery: `Analyze ${event.event_type} in ${event.country} involving ${event.actor1}`
    }));
  },

  // AIS vessel data -> Moving ship icons
  vessels: (raw: any[]): GlobePoint[] => {
    return raw.map(vessel => ({
      id: `vessel-${vessel.mmsi}`,
      lat: parseFloat(vessel.lat),
      lng: parseFloat(vessel.lng),
      layer: 'vessels',
      timestamp: Date.now(),
      color: vessel.speed > 20 ? '#00ff00' : vessel.speed > 5 ? '#ffff00' : '#ff0000',
      size: 8,
      opacity: 0.9,
      heading: vessel.course,
      speed: vessel.speed,
      trail: vessel.positions?.slice(-20).map((p: any) => [p.lat, p.lng]) || [],
      title: vessel.vessel_name || 'Unknown Vessel',
      description: `Type: ${vessel.type || 'Unknown'} | Speed: ${vessel.speed}kn | Destination: ${vessel.destination || 'Unknown'}`,
      category: 'Maritime',
      severity: 'low',
      makaveliQuery: `Track vessel ${vessel.vessel_name} heading to ${vessel.destination}`
    }));
  },

  // ADS-B flight data -> Aircraft icons
  flights: (raw: any[]): GlobePoint[] => {
    return raw.map(flight => ({
      id: `flight-${flight.hex}`,
      lat: parseFloat(flight.lat),
      lng: parseFloat(flight.lng),
      layer: 'flights',
      timestamp: Date.now(),
      color: flight.altitude > 30000 ? '#00ffff' : '#0088ff',
      size: 6,
      opacity: 0.8,
      heading: flight.heading,
      speed: flight.speed,
      title: flight.callsign || flight.hex,
      description: `Aircraft: ${flight.aircraft_type || 'Unknown'} | Alt: ${flight.altitude}ft | Spd: ${flight.speed}kn`,
      category: 'Aviation',
      severity: flight.squawk === '7700' ? 'critical' : flight.squawk === '7600' ? 'high' : 'low'
    }));
  },

  // Telegram sentiment -> Regional heatmap
  sentiment: (raw: { city: string; lat: number; lng: number; sentiment: number; volume: number }[]): GlobeRegion[] => {
    return raw.map(city => ({
      id: `sentiment-${city.city}`,
      name: city.city,
      bounds: [city.lat - 0.5, city.lng - 0.5, city.lat + 0.5, city.lng + 0.5],
      layer: 'sentiment_heatmap',
      color: city.sentiment > 0.6 ? '#ff0000' : city.sentiment > 0.4 ? '#ff8800' : city.sentiment > 0.2 ? '#ffff00' : '#00ff00',
      opacity: 0.4 + (city.intensity || 0.3) * 0.4,
      intensity: city.intensity || 0.5,
      sentiment: city.sentiment > 0.6 ? 'fearful' : city.sentiment > 0.3 ? 'defiant' : 'neutral',
      metrics: {
        fear_index: city.sentiment * 100,
        message_volume: city.volume,
        viral_coefficient: city.volume / 1000
      },
      change24h: {
        fear_index: (Math.random() - 0.5) * 20 // Would be actual change
      }
    }));
  },

  // DNS infrastructure -> Site status indicators
  infrastructure: (raw: { domain: string; lat: number; lng: number; status: string; response_time: number }[]): GlobePoint[] => {
    return raw.map(site => ({
      id: `infra-${site.domain}`,
      lat: site.lat,
      lng: site.lng,
      layer: 'infrastructure',
      timestamp: Date.now(),
      color: site.status === 'up' ? '#00ff00' : site.status === 'slow' ? '#ffff00' : '#ff0000',
      size: site.status === 'down' ? 12 : 8,
      opacity: 0.9,
      pulse: site.status === 'down',
      title: site.domain,
      description: `Status: ${site.status.toUpperCase()} | Response: ${site.response_time}ms`,
      category: 'Infrastructure',
      severity: site.status === 'down' ? 'critical' : site.status === 'slow' ? 'high' : 'low',
      makaveliQuery: `Analyze ${site.domain} outage implications`
    }));
  },

  // USGS earthquakes -> Magnitude circles
  earthquakes: (raw: any[]): GlobePoint[] => {
    return raw.map(quake => ({
      id: `quake-${quake.id}`,
      lat: parseFloat(quake.geometry.coordinates[1]),
      lng: parseFloat(quake.geometry.coordinates[0]),
      layer: 'earthquakes',
      timestamp: quake.properties.time,
      color: quake.properties.mag > 6 ? '#ff0000' : quake.properties.mag > 5 ? '#ff8800' : '#ffff00',
      size: quake.properties.mag * 3,
      opacity: 0.6,
      pulse: quake.properties.mag > 6,
      radius: quake.properties.mag * 50, // KM
      title: `M${quake.properties.mag} Earthquake`,
      description: `${quake.properties.place} | Depth: ${quake.geometry.coordinates[2]}km`,
      category: 'Seismic',
      severity: quake.properties.mag > 6 ? 'critical' : quake.properties.mag > 5 ? 'high' : 'medium'
    }));
  },

  // Port congestion -> Status rings
  ports: (raw: any[]): GlobePoint[] => {
    return raw.map(port => ({
      id: `port-${port.port_name}`,
      lat: port.lat,
      lng: port.lng,
      layer: 'ports',
      timestamp: Date.now(),
      color: port.congestion_level > 0.8 ? '#ff0000' : port.congestion_level > 0.5 ? '#ffff00' : '#00ff00',
      size: 10 + port.vessel_count / 10,
      opacity: 0.8,
      title: port.port_name,
      description: `Congestion: ${(port.congestion_level * 100).toFixed(0)}% | Waiting: ${port.waiting_time}h | Vessels: ${port.vessel_count}`,
      category: 'Maritime',
      severity: port.congestion_level > 0.8 ? 'critical' : port.congestion_level > 0.5 ? 'high' : 'low',
      bruceQuery: `Analyze ${port.port_name} congestion impact on supply chains`
    }));
  },

  // Trade routes -> Animated arcs
  tradeRoutes: (raw: { from: any; to: any; volume: number; commodity: string }[]): GlobeArc[] => {
    return raw.map((route, idx) => ({
      id: `trade-${idx}`,
      from: { lat: route.from.lat, lng: route.from.lng, label: route.from.name },
      to: { lat: route.to.lat, lng: route.to.lng, label: route.to.name },
      layer: 'trade_routes',
      color: route.commodity === 'oil' ? '#000000' : route.commodity === 'gas' ? '#0088ff' : '#888888',
      width: Math.max(1, route.volume / 1000000),
      animated: true,
      animationSpeed: route.volume / 10000000,
      volume: route.volume,
      timestamp: Date.now(),
      status: 'active'
    }));
  }
};

// ============================================================================
// GLOBE DATA FEED ENGINE
// ============================================================================

export class GlobeDataFeed {
  private state: GlobeDataState = {
    points: [],
    arcs: [],
    regions: [],
    lastUpdated: 0,
    activeLayers: ['conflicts', 'vessels', 'flights', 'sentiment', 'infrastructure']
  };

  private updateCallbacks: ((state: GlobeDataState) => void)[] = [];
  private dataFetchers: Map<GlobeLayer, () => Promise<any[]>> = new Map();

  constructor() {
    this.setupDefaultFetchers();
  }

  private setupDefaultFetchers(): void {
    // These would connect to your actual data sources
    this.dataFetchers.set('conflicts', async () => []);
    this.dataFetchers.set('vessels', async () => []);
    this.dataFetchers.set('flights', async () => []);
    this.dataFetchers.set('sentiment', async () => []);
    this.dataFetchers.set('infrastructure', async () => []);
    this.dataFetchers.set('earthquakes', async () => []);
    this.dataFetchers.set('ports', async () => []);
  }

  // Register a custom data fetcher for a layer
  setDataFetcher(layer: GlobeLayer, fetcher: () => Promise<any[]>): void {
    this.dataFetchers.set(layer, fetcher);
  }

  // Subscribe to state updates (your globe calls this)
  subscribe(callback: (state: GlobeDataState) => void): () => void {
    this.updateCallbacks.push(callback);
    // Send initial state
    callback(this.state);
    
    return () => {
      const idx = this.updateCallbacks.indexOf(callback);
      if (idx > -1) this.updateCallbacks.splice(idx, 1);
    };
  }

  // Toggle layers on/off
  setActiveLayers(layers: GlobeLayer[]): void {
    this.state.activeLayers = layers;
    this.notifySubscribers();
  }

  // Manual data injection (for your existing systems to push data)
  injectPoints(layer: GlobeLayer, rawData: any[]): void {
    const transformer = GlobeTransformers[layer];
    if (!transformer) return;

    const points = transformer(rawData);
    
    // Remove old points from this layer
    this.state.points = this.state.points.filter(p => p.layer !== layer);
    
    // Add new points
    this.state.points.push(...points);
    
    this.state.lastUpdated = Date.now();
    this.notifySubscribers();
  }

  injectArcs(rawData: Parameters<typeof GlobeTransformers.tradeRoutes>[0]): void {
    this.state.arcs = GlobeTransformers.tradeRoutes(rawData);
    this.state.lastUpdated = Date.now();
    this.notifySubscribers();
  }

  injectRegions(layer: 'sentiment_heatmap', rawData: Parameters<typeof GlobeTransformers.sentiment>[0]): void {
    this.state.regions = GlobeTransformers.sentiment(rawData);
    this.state.lastUpdated = Date.now();
    this.notifySubscribers();
  }

  // Auto-refresh all active layers
  async refresh(): Promise<void> {
    for (const layer of this.state.activeLayers) {
      const fetcher = this.dataFetchers.get(layer);
      if (!fetcher) continue;

      try {
        const rawData = await fetcher();
        this.injectPoints(layer, rawData);
      } catch (error) {
        console.error(`[GlobeDataFeed] Failed to refresh ${layer}:`, error);
      }
    }
  }

  // Start auto-refresh interval
  startAutoRefresh(intervalMs: number = 30000): () => void {
    // Initial refresh
    this.refresh();
    
    // Set up interval
    const interval = setInterval(() => this.refresh(), intervalMs);
    
    return () => clearInterval(interval);
  }

  private notifySubscribers(): void {
    this.updateCallbacks.forEach(cb => cb(this.state));
  }

  // Get current state
  getState(): GlobeDataState {
    return { ...this.state };
  }

  // Filter by layer
  getPointsByLayer(layer: GlobeLayer): GlobePoint[] {
    return this.state.points.filter(p => p.layer === layer);
  }

  // Get points near location (for click interactions)
  getPointsNear(lat: number, lng: number, radiusKm: number = 100): GlobePoint[] {
    return this.state.points.filter(p => {
      const distance = this.haversine(lat, lng, p.lat, p.lng);
      return distance <= radiusKm;
    });
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

// ============================================================================
// INTEGRATION HELPERS
// ============================================================================

// Hook into your existing War Room
export function createGlobeFeedFromWarRoom(warRoom: any): GlobeDataFeed {
  const feed = new GlobeDataFeed();

  // Connect to your existing data streams
  // These would be your actual data sources

  // Conflicts: ACLED
  feed.setDataFetcher('conflicts', async () => {
    // Return your ACLED data
    return [];
  });

  // Vessels: AIS
  feed.setDataFetcher('vessels', async () => {
    // Return your MarineTraffic data
    return [];
  });

  // Flights: ADS-B
  feed.setDataFetcher('flights', async () => {
    // Return your ADS-B Exchange data
    return [];
  });

  // Sentiment: Telegram
  feed.setDataFetcher('sentiment', async () => {
    // Return your dark signals sentiment data
    return [];
  });

  // Infrastructure: DNS
  feed.setDataFetcher('infrastructure', async () => {
    // Return your DNS monitoring data
    return [];
  });

  // Earthquakes: USGS
  feed.setDataFetcher('earthquakes', async () => {
    // Return your USGS feed
    return [];
  });

  return feed;
}

// ============================================================================
// EXAMPLE: Your globe consumes this
// ============================================================================

/*
// In your globe component:
import { GlobeDataFeed } from './globe-data-feed';

const feed = new GlobeDataFeed();

// Subscribe to updates
feed.subscribe((state) => {
  // Update your globe visualization
  updateGlobePoints(state.points);
  updateGlobeArcs(state.arcs);
  updateGlobeRegions(state.regions);
});

// Start auto-refresh
const stopRefresh = feed.startAutoRefresh(30000);

// Or manually inject from your existing systems:
feed.injectPoints('conflicts', acledData);
feed.injectPoints('vessels', aisData);
feed.injectRegions('sentiment_heatmap', telegramData);

// Handle clicks
function onGlobeClick(lat, lng) {
  const nearby = feed.getPointsNear(lat, lng, 50);
  nearby.forEach(point => {
    if (point.makaveliQuery) {
      triggerMakaveli(point.makaveliQuery);
    }
    if (point.polymarketMarketId) {
      openPolymarket(point.polymarketMarketId);
    }
  });
}
*/

// ============================================================================
// EXPORTS
// ============================================================================

export const globeDataFeed = new GlobeDataFeed();
export default globeDataFeed;
