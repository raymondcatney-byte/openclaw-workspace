// React Hook: useMarketFeed.ts
// Add to your NERV War Room for real-time market monitoring

import { useState, useEffect, useCallback } from 'react';

export interface MarketAlert {
  id: string;
  type: 'PRICE_MOVEMENT' | 'VOLUME_SPIKE' | 'TREND_SURGE' | 'TREND_CRASH';
  severity: 'P0' | 'P1' | 'P2';
  title: string;
  description: string;
  timestamp: string;
  data: {
    marketId: string;
    category: string;
    oldPrice?: number;
    newPrice: number;
    change?: number;
    volume?: number;
    volumeChange?: number;
    url: string;
  };
}

export interface MarketData {
  id: string;
  question: string;
  category: string;
  yesPrice: number;
  volume: number;
  url: string;
}

export interface MarketFeed {
  ok: boolean;
  timestamp: string;
  summary: {
    totalMarkets: number;
    p0Alerts: number;
    p1Alerts: number;
    p2Alerts: number;
  };
  markets: MarketData[];
  events: MarketAlert[];
}

const POLL_INTERVAL = 60000; // 60 seconds

export function useMarketFeed() {
  const [feed, setFeed] = useState<MarketFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchFeed = useCallback(async () => {
    try {
      const response = await fetch('/api/market-feed?action=feed');
      
      if (!response.ok) {
        throw new Error(`Feed error: ${response.status}`);
      }
      
      const data: MarketFeed = await response.json();
      setFeed(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/market-feed?action=alerts');
      if (!response.ok) return [];
      const data = await response.json();
      return data.alerts as MarketAlert[];
    } catch {
      return [];
    }
  }, []);

  const fetchWatchtower = useCallback(async () => {
    try {
      const response = await fetch('/api/market-feed?action=watchtower');
      if (!response.ok) return null;
      const data = await response.json();
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    
    const interval = setInterval(fetchFeed, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchFeed]);

  return {
    feed,
    loading,
    error,
    lastUpdate,
    refetch: fetchFeed,
    fetchAlerts,
    fetchWatchtower,
    
    // Computed values
    criticalAlerts: feed?.events.filter(e => e.severity === 'P0') || [],
    highAlerts: feed?.events.filter(e => e.severity === 'P1') || [],
    mediumAlerts: feed?.events.filter(e => e.severity === 'P2') || [],
    totalAlertCount: feed?.events.length || 0
  };
}