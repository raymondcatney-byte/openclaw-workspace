// hooks/useLiveData.ts - React hooks for real-time data polling
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getMilitaryAircraft, getSatellites, getEarthquakes, 
  getBioWeather, Aircraft, Satellite, EarthquakeFeature, BioWeather,
  POLLING_INTERVALS 
} from '@/lib/apis';

// Generic hook for polling any API
function usePolling<T>(
  fetcher: () => Promise<T>,
  interval: number,
  enabled: boolean = true
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    if (!enabled) return;
    
    fetchData(); // Initial fetch
    intervalRef.current = setInterval(fetchData, interval);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, interval, enabled]);

  return { data, error, isLoading, refetch: fetchData };
}

// Aircraft tracking hook
export function useAircraftTracking(enabled: boolean = true) {
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchAndUpdate = async () => {
      try {
        const data = await getMilitaryAircraft();
        setAircraft(data);
        setLastUpdate(new Date());
        setError(null);
      } catch (err) {
        setError(err as Error);
      }
    };

    fetchAndUpdate();
    const interval = setInterval(fetchAndUpdate, POLLING_INTERVALS.aircraft);
    
    return () => clearInterval(interval);
  }, [enabled]);

  return { aircraft, error, lastUpdate, count: aircraft.length };
}

// Satellite tracking hook
export function useSatelliteTracking(enabled: boolean = true) {
  const [satellites, setSatellites] = useState<Satellite[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchAndUpdate = async () => {
      try {
        const data = await getSatellites();
        setSatellites(data.slice(0, 500)); // Limit to 500 for performance
      } catch (err) {
        setError(err as Error);
      }
    };

    fetchAndUpdate();
    const interval = setInterval(fetchAndUpdate, POLLING_INTERVALS.satellites);
    
    return () => clearInterval(interval);
  }, [enabled]);

  return { satellites, error, count: satellites.length };
}

// Earthquake monitoring hook
export function useEarthquakeMonitoring(period: 'hour' | 'day' | 'week' = 'day', enabled: boolean = true) {
  return usePolling(() => getEarthquakes(period), POLLING_INTERVALS.earthquakes, enabled);
}

// Bio-weather hook (location-aware)
export function useBioWeather(lat: number | null, lon: number | null) {
  const [weather, setWeather] = useState<BioWeather | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lat === null || lon === null) return;

    const fetchWeather = async () => {
      setLoading(true);
      try {
        const data = await getBioWeather(lat, lon);
        setWeather(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, POLLING_INTERVALS.weather);
    
    return () => clearInterval(interval);
  }, [lat, lon]);

  return { weather, error, loading };
}

// User geolocation hook
export function useUserLocation() {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (err) => {
        setError(err.message);
        // Fallback to default (New York)
        setLocation({ lat: 40.7128, lon: -74.0060 });
      }
    );
  }, []);

  return { location, error };
}
