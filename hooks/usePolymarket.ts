import { useCallback, useEffect, useRef, useState } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface PolymarketMarket {
  id: string;
  question: string;
  conditionId: string;
  slug: string;
  resolutionSource?: string;
  endDate: string;
  startDate?: string;
  image?: string;
  icon?: string;
  active: boolean;
  closed: boolean;
  archived?: boolean;
  paused?: boolean;
  status?: string;
  marketMakerAddress?: string;
  createdAt: string;
  updatedAt: string;
  
  // Liquidity metrics
  volume24h: number;
  volumeTotal: number;
  liquidity: number;
  
  // Price data
  yesPrice: number; // 0-1
  noPrice: number; // 0-1
  spread: number;
  
  // Metadata
  category?: string;
  tags?: string[];
  outcomes?: string[];
  outcomePrices?: Record<string, number>;
  
  // Related
  eventId?: string;
  eventSlug?: string;
  group?: string;
  
  // Description/resolution criteria
  description?: string;
  resolutionCriteria?: string;
}

export interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  description?: string;
  startDate?: string;
  endDate: string;
  image?: string;
  category?: string;
  tags?: string[];
  status?: string;
  
  // Aggregated metrics
  volume24h: number;
  volumeTotal: number;
  liquidity: number;
  marketsCount: number;
  
  // Related markets
  markets?: PolymarketMarket[];
  
  // Computed fields for signal correlation
  probability: number; // Primary market yes price * 100
  probabilityChange24h: number;
  trending?: 'up' | 'down' | 'stable';
  
  // For correlation
  relatedAssets?: string[];
}

export type PolymarketCategory = 
  | 'crypto' 
  | 'politics' 
  | 'sports' 
  | 'entertainment' 
  | 'finance' 
  | 'science' 
  | 'tech' 
  | 'weather' 
  | 'all';

export interface UsePolymarketOptions {
  categories?: PolymarketCategory[];
  limit?: number;
  activeOnly?: boolean;
  minLiquidity?: number;
  minVolume24h?: number;
  refreshInterval?: number; // ms
  onError?: (error: Error) => void;
  onEventsUpdate?: (events: PolymarketEvent[]) => void;
}

export interface PolymarketState {
  events: PolymarketEvent[];
  markets: PolymarketMarket[];
  loading: boolean;
  error: Error | null;
  lastUpdated: number;
}

// ============================================================================
// Constants
// ============================================================================

const GAMMA_API_BASE = 'https://gamma-api.polymarket.com';
const DEFAULT_REFRESH_INTERVAL = 60000; // 1 minute

// Asset correlation mapping
const EVENT_ASSET_MAP: Record<string, string[]> = {
  'crypto': ['BTC', 'ETH', 'SOL', 'COIN', 'HOOD'],
  'bitcoin': ['BTC'],
  'ethereum': ['ETH'],
  'solana': ['SOL'],
  'etf': ['BTC', 'ETH', 'COIN'],
  'regulation': ['BTC', 'ETH', 'COIN', 'HOOD'],
  'fed': ['SPY', 'QQQ', 'BTC', 'ETH', 'XAUUSD'],
  'rates': ['SPY', 'QQQ', 'BTC', 'XAUUSD', 'EURUSD'],
  'inflation': ['XAUUSD', 'XAGUSD', 'BTC', 'SPY'],
  'election': ['SPY', 'QQQ', 'VXX'],
  'nvidia': ['NVDA', 'QQQ', 'SPY'],
  'tech': ['GOOGL', 'META', 'AAPL', 'MSFT', 'QQQ'],
  'earnings': ['SPY', 'QQQ'],
  'gold': ['XAUUSD'],
  'oil': ['WTI'],
  'gas': ['NGD'],
  'war': ['WTI', 'NGD', 'XAUUSD'],
  'ukraine': ['WTI', 'NGD'],
};

// ============================================================================
// Helper Functions
// ============================================================================

function extractRelatedAssets(event: PolymarketEvent): string[] {
  const title = event.title.toLowerCase();
  const description = (event.description || '').toLowerCase();
  const category = (event.category || '').toLowerCase();
  const tags = (event.tags || []).map((t) => t.toLowerCase());
  
  const related = new Set<string>();
  
  // Check all text fields for keywords
  const textToCheck = [title, description, category, ...tags].join(' ');
  
  Object.entries(EVENT_ASSET_MAP).forEach(([keyword, assets]) => {
    if (textToCheck.includes(keyword)) {
      assets.forEach((asset) => related.add(asset));
    }
  });
  
  return Array.from(related);
}

function calculateTrending(market: PolymarketMarket): 'up' | 'down' | 'stable' {
  // This would ideally compare to historical data
  // For now, use spread as a proxy for uncertainty
  if (market.spread > 0.05) return 'stable';
  return market.yesPrice > 0.5 ? 'up' : 'down';
}

// ============================================================================
// Main Hook
// ============================================================================

export function usePolymarket(options: UsePolymarketOptions = {}) {
  const {
    categories = ['all'],
    limit = 50,
    activeOnly = true,
    minLiquidity = 10000, // $10k minimum
    minVolume24h = 1000,  // $1k daily volume
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
    onError,
    onEventsUpdate,
  } = options;

  // State
  const [state, setState] = useState<PolymarketState>({
    events: [],
    markets: [],
    loading: true,
    error: null,
    lastUpdated: 0,
  });

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ============================================================================
  // API Functions
  // ============================================================================

  const fetchEvents = useCallback(async (): Promise<PolymarketEvent[]> => {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    params.set('active', activeOnly.toString());
    params.set('closed', 'false');
    params.set('archived', 'false');
    
    if (categories.length > 0 && !categories.includes('all')) {
      params.set('category', categories.join(','));
    }

    const url = `${GAMMA_API_BASE}/events?${params.toString()}`;
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const response = await fetch(url, {
      signal: abortControllerRef.current.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform and filter
    const events: PolymarketEvent[] = (data.events || [])
      .map((event: any): PolymarketEvent | null => {
        // Find primary market (usually the first one or highest liquidity)
        const markets = event.markets || [];
        if (markets.length === 0) return null;
        
        const primaryMarket = markets.reduce((best: any, current: any) => {
          if (!best) return current;
          return (current.liquidity || 0) > (best.liquidity || 0) ? current : best;
        }, null);
        
        if (!primaryMarket) return null;
        
        // Apply filters
        if ((primaryMarket.liquidity || 0) < minLiquidity) return null;
        if ((primaryMarket.volume24h || 0) < minVolume24h) return null;
        
        // Calculate probability from yes price
        const probability = Math.round((primaryMarket.yesPrice || 0) * 100);
        
        // Calculate 24h change (if historical data available, otherwise estimate from trending)
        const trending = calculateTrending(primaryMarket);
        const probabilityChange24h = trending === 'up' ? 5 : trending === 'down' ? -5 : 0;
        
        const transformed: PolymarketEvent = {
          id: event.id,
          title: event.title,
          slug: event.slug,
          description: event.description,
          startDate: event.startDate,
          endDate: event.endDate,
          image: event.image,
          category: event.category,
          tags: event.tags || [],
          status: event.status,
          volume24h: event.volume24h || primaryMarket.volume24h || 0,
          volumeTotal: event.volumeTotal || primaryMarket.volumeTotal || 0,
          liquidity: event.liquidity || primaryMarket.liquidity || 0,
          marketsCount: markets.length,
          markets: markets,
          probability,
          probabilityChange24h,
          trending,
          relatedAssets: extractRelatedAssets({
            ...event,
            probability,
            probabilityChange24h,
            volume24h: event.volume24h || 0,
            volumeTotal: event.volumeTotal || 0,
            liquidity: event.liquidity || 0,
            marketsCount: markets.length,
          }),
        };
        
        return transformed;
      })
      .filter(Boolean) as PolymarketEvent[];

    return events;
  }, [categories, limit, activeOnly, minLiquidity, minVolume24h]);

  const fetchMarkets = useCallback(async (): Promise<PolymarketMarket[]> => {
    const params = new URLSearchParams();
    params.set('limit', limit.toString());
    params.set('active', activeOnly.toString());
    
    const url = `${GAMMA_API_BASE}/markets?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const data = await response.json();
    
    return (data.markets || []).map((market: any): PolymarketMarket => ({
      id: market.id,
      question: market.question,
      conditionId: market.conditionId,
      slug: market.slug,
      resolutionSource: market.resolutionSource,
      endDate: market.endDate,
      startDate: market.startDate,
      image: market.image,
      icon: market.icon,
      active: market.active,
      closed: market.closed,
      archived: market.archived,
      paused: market.paused,
      status: market.status,
      marketMakerAddress: market.marketMakerAddress,
      createdAt: market.createdAt,
      updatedAt: market.updatedAt,
      volume24h: market.volume24h || 0,
      volumeTotal: market.volumeTotal || 0,
      liquidity: market.liquidity || 0,
      yesPrice: market.yesPrice || 0,
      noPrice: market.noPrice || 0,
      spread: market.spread || 0,
      category: market.category,
      tags: market.tags || [],
      outcomes: market.outcomes || [],
      outcomePrices: market.outcomePrices || {},
      eventId: market.eventId,
      eventSlug: market.eventSlug,
      group: market.group,
      description: market.description,
      resolutionCriteria: market.resolutionCriteria,
    }));
  }, [limit, activeOnly]);

  // ============================================================================
  // Refresh Logic
  // ============================================================================

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    
    try {
      const [events, markets] = await Promise.all([
        fetchEvents(),
        fetchMarkets(),
      ]);
      
      const newState: PolymarketState = {
        events,
        markets,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      };
      
      setState(newState);
      onEventsUpdate?.(events);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setState((prev) => ({
        ...prev,
        loading: false,
        error,
        lastUpdated: Date.now(),
      }));
      onError?.(error);
    }
  }, [fetchEvents, fetchMarkets, onEventsUpdate, onError]);

  // Auto-refresh
  useEffect(() => {
    refresh();
    
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(refresh, refreshInterval);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [refresh, refreshInterval]);

  // ============================================================================
  // Public API
  // ============================================================================

  const getEventById = useCallback((id: string): PolymarketEvent | undefined => {
    return state.events.find((e) => e.id === id);
  }, [state.events]);

  const getEventsByCategory = useCallback((category: PolymarketCategory): PolymarketEvent[] => {
    if (category === 'all') return state.events;
    return state.events.filter((e) => 
      e.category?.toLowerCase() === category.toLowerCase() ||
      e.tags?.some((t) => t.toLowerCase().includes(category.toLowerCase()))
    );
  }, [state.events]);

  const getEventsByAsset = useCallback((asset: string): PolymarketEvent[] => {
    return state.events.filter((e) => 
      e.relatedAssets?.includes(asset.toUpperCase())
    );
  }, [state.events]);

  const getHighConfidenceEvents = useCallback((threshold = 70): PolymarketEvent[] => {
    return state.events
      .filter((e) => e.probability >= threshold || e.probability <= (100 - threshold))
      .sort((a, b) => Math.abs(b.probability - 50) - Math.abs(a.probability - 50));
  }, [state.events]);

  const getTrendingEvents = useCallback((minChange = 5): PolymarketEvent[] => {
    return state.events
      .filter((e) => Math.abs(e.probabilityChange24h) >= minChange)
      .sort((a, b) => Math.abs(b.probabilityChange24h) - Math.abs(a.probabilityChange24h));
  }, [state.events]);

  return {
    ...state,
    refresh,
    getEventById,
    getEventsByCategory,
    getEventsByAsset,
    getHighConfidenceEvents,
    getTrendingEvents,
  };
}

// ============================================================================
// Utility Exports
// ============================================================================

export function formatProbability(value: number): string {
  return `${value.toFixed(0)}%`;
}

export function formatVolume(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

export function getProbabilityColor(probability: number): string {
  if (probability >= 80) return '#22c55e';
  if (probability >= 60) return '#84cc16';
  if (probability >= 40) return '#eab308';
  if (probability >= 20) return '#f97316';
  return '#ef4444';
}

export default usePolymarket;
