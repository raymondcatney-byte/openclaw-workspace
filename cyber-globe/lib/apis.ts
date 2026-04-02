// lib/apis.ts - Client-side data fetchers for Bruce Wayne Operations Console
// All APIs are free, no backend required, CORS-friendly

// ============================================
// SATELLITE TRACKING (CelesTrak - 2000+ active satellites)
// ============================================

export interface Satellite {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  EPOCH: string;
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  EPHEMERIS_TYPE: number;
  CLASSIFICATION_TYPE: string;
  NORAD_CAT_ID: number;
  ELEMENT_SET_NO: number;
  REV_AT_EPOCH: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
}

// TLE to Lat/Lon/Alt conversion (SGP4 propagation)
// Simplified - for production use satellite.js library
export function tleToPosition(sat: Satellite, date = new Date()) {
  // This is a placeholder - you'd use satellite.js for real propagation
  // Returns { lat, lon, alt, velocity }
  return {
    lat: (Math.random() - 0.5) * 180, // Placeholder
    lon: (Math.random() - 0.5) * 360,
    alt: 400 + Math.random() * 400,
    velocity: 7.5,
    name: sat.OBJECT_NAME,
    id: sat.NORAD_CAT_ID
  };
}

export async function getSatellites(): Promise<Satellite[]> {
  const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=json');
  if (!response.ok) throw new Error('Failed to fetch satellite data');
  return response.json();
}

// Get specific satellite groups
export async function getSatellitesByGroup(group: 'stations' | 'visual' | 'weather' | 'noaa' | 'goes') {
  const groups: Record<string, string> = {
    stations: 'stations',
    visual: 'visual',
    weather: 'weather',
    noaa: 'noaa',
    goes: 'goes'
  };
  const response = await fetch(`https://celestrak.org/NORAD/elements/gp.php?GROUP=${groups[group]}&FORMAT=json`);
  return response.json();
}

// ============================================
// AIRCRAFT TRACKING (adsb.lol - Military)
// ============================================

export interface Aircraft {
  hex: string;
  flight?: string;
  lat: number;
  lon: number;
  altitude: number;
  speed: number;
  track: number;
  squawk?: string;
  category?: string;
  type?: string;
  registration?: string;
}

export async function getMilitaryAircraft(): Promise<Aircraft[]> {
  const response = await fetch('https://api.adsb.lol/v2/mil');
  if (!response.ok) throw new Error('Failed to fetch military aircraft');
  const data = await response.json();
  return data.ac || [];
}

export async function getAircraftInBounds(
  latMin: number, 
  latMax: number, 
  lonMin: number, 
  lonMax: number
): Promise<Aircraft[]> {
  const response = await fetch(
    `https://api.adsb.lol/v2/lat/${(latMin + latMax) / 2}/lon/${(lonMin + lonMax) / 2}/dist/250`
  );
  const data = await response.json();
  return data.ac || [];
}

// ============================================
// EARTHQUAKES (USGS - Real-time)
// ============================================

export interface EarthquakeFeature {
  type: 'Feature';
  properties: {
    mag: number;
    place: string;
    time: number;
    updated: number;
    tz: number | null;
    url: string;
    detail: string;
    felt: number | null;
    cdi: number | null;
    mmi: number | null;
    alert: string | null;
    status: string;
    tsunami: number;
    sig: number;
    net: string;
    code: string;
    ids: string;
    sources: string;
    types: string;
    nst: number | null;
    dmin: number | null;
    rms: number;
    gap: number | null;
    magType: string;
    type: string;
    title: string;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [lon, lat, depth]
  };
  id: string;
}

export async function getEarthquakes(period: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<EarthquakeFeature[]> {
  const periods: Record<string, string> = {
    hour: 'all_hour',
    day: 'all_day',
    week: 'all_week',
    month: 'all_month'
  };
  const response = await fetch(
    `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${periods[period]}.geojson`
  );
  if (!response.ok) throw new Error('Failed to fetch earthquake data');
  const data = await response.json();
  return data.features || [];
}

export function getEarthquakeIntensity(mag: number): {
  label: string;
  color: string;
  severity: 'minor' | 'light' | 'moderate' | 'strong' | 'major' | 'great';
} {
  if (mag < 2.5) return { label: 'Micro', color: '#4ade80', severity: 'minor' };
  if (mag < 3.5) return { label: 'Minor', color: '#facc15', severity: 'minor' };
  if (mag < 4.5) return { label: 'Light', color: '#fb923c', severity: 'light' };
  if (mag < 5.5) return { label: 'Moderate', color: '#f87171', severity: 'moderate' };
  if (mag < 6.5) return { label: 'Strong', color: '#ef4444', severity: 'strong' };
  if (mag < 7.5) return { label: 'Major', color: '#dc2626', severity: 'major' };
  return { label: 'Great', color: '#991b1b', severity: 'great' };
}

// ============================================
// WEATHER & BIOHACKING (Open-Meteo - Free)
// ============================================

export interface BioWeather {
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    uv_index: number;
    weather_code: number;
    wind_speed_10m: number;
    time: string;
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
  air_quality?: {
    current: {
      us_aqi: number;
      pm10: number;
      pm2_5: number;
      carbon_monoxide: number;
      nitrogen_dioxide: number;
      sulphur_dioxide: number;
      ozone: number;
      dust: number;
    };
  };
}

export async function getBioWeather(lat: number, lon: number): Promise<BioWeather> {
  // Current weather + daily forecast
  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,uv_index,weather_code,wind_speed_10m` +
    `&daily=sunrise,sunset,uv_index_max,temperature_2m_max,temperature_2m_min` +
    `&timezone=auto`
  );
  
  // Air quality data
  const airQualityRes = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?` +
    `latitude=${lat}&longitude=${lon}` +
    `&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust`
  );
  
  const weather = await weatherRes.json();
  const airQuality = await airQualityRes.json();
  
  return {
    current: weather.current,
    daily: weather.daily,
    air_quality: airQuality
  };
}

// WMO Weather interpretation codes
export function getWeatherDescription(code: number): string {
  const codes: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
    61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
    71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Heavy thunderstorm'
  };
  return codes[code] || 'Unknown';
}

// ============================================
// FIRE HOTSPOTS (NASA FIRMS - 24h thermal anomalies)
// ============================================

export async function getFireHotspots() {
  // Note: NASA FIRMS CSV is not CORS-friendly, use USGS alternative
  // or implement backend proxy for full FIRMS access
  const response = await fetch('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson');
  return response.json();
}

// ============================================
// CRYPTO MARKETS (CoinGecko - Free tier)
// ============================================

export async function getCryptoPrices(ids: string[] = ['bitcoin', 'ethereum']) {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_change=true`
  );
  return response.json();
}

// ============================================
// POLLING HELPERS
// ============================================

export function createPollingFetch<T>(
  fetcher: () => Promise<T>,
  interval: number,
  onData: (data: T) => void,
  onError?: (error: Error) => void
) {
  let isActive = true;
  let timeoutId: NodeJS.Timeout;
  
  const poll = async () => {
    if (!isActive) return;
    try {
      const data = await fetcher();
      onData(data);
    } catch (error) {
      onError?.(error as Error);
    }
    if (isActive) {
      timeoutId = setTimeout(poll, interval);
    }
  };
  
  poll();
  
  return {
    stop: () => {
      isActive = false;
      clearTimeout(timeoutId);
    }
  };
}

// Recommended polling intervals
export const POLLING_INTERVALS = {
  aircraft: 10000,     // 10 seconds
  satellites: 60000,   // 1 minute (TLE updates infrequently)
  earthquakes: 60000,  // 1 minute
  weather: 300000,     // 5 minutes
  crypto: 30000        // 30 seconds
};
