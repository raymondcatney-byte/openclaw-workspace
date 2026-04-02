// hooks/useDeFiData.ts - React hooks for DeFi and on-chain intelligence
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getPolymarketEvents,
  getSovereignRelevantMarkets,
  getYieldOpportunities,
  getTopProtocols,
  getWhaleSwaps,
  getGlobalMarketData,
  getTopGainersLosers,
  generateSovereignSignals,
  PolymarketMarket,
  YieldPool,
  ProtocolTVL,
  WhaleSwap,
  SovereignSignal,
  DEFI_POLLING_INTERVALS
} from '@/lib/defi-apis';

// ============================================
// POLYMARKET HOOKS
// ============================================

export function usePolymarketData(enabled: boolean = true) {
  const [markets, setMarkets] = useState<PolymarketMarket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getSovereignRelevantMarkets();
        setMarkets(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, DEFI_POLLING_INTERVALS.polymarket);
    
    return () => clearInterval(interval);
  }, [enabled]);

  return { markets, isLoading, error };
}

// ============================================
// YIELD FARMING HOOKS
// ============================================

export function useYieldOpportunities(
  minTvl: number = 1000000,
  maxApy: number = 100,
  enabled: boolean = true
) {
  const [pools, setPools] = useState<YieldPool[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getYieldOpportunities(minTvl, maxApy);
        setPools(data);
      } catch (error) {
        console.error('Yield fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, DEFI_POLLING_INTERVALS.yields);
    
    return () => clearInterval(interval);
  }, [minTvl, maxApy, enabled]);

  // Separate by risk level
  const byRisk = useMemo(() => ({
    low: pools.filter(p => p.riskLevel === 'low'),
    medium: pools.filter(p => p.riskLevel === 'medium'),
    high: pools.filter(p => p.riskLevel === 'high')
  }), [pools]);

  return { pools, byRisk, isLoading };
}

// ============================================
// PROTOCOL TVL HOOKS
// ============================================

export function useProtocolData(limit: number = 20, enabled: boolean = true) {
  const [protocols, setProtocols] = useState<ProtocolTVL[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      try {
        const data = await getTopProtocols(limit);
        setProtocols(data);
      } catch (error) {
        console.error('Protocol fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, DEFI_POLLING_INTERVALS.protocols);
    
    return () => clearInterval(interval);
  }, [limit, enabled]);

  // Calculate total TVL
  const totalTvl = useMemo(() => 
    protocols.reduce((sum, p) => sum + p.tvl, 0),
  [protocols]);

  // TVL change
  const tvlChange24h = useMemo(() => {
    if (protocols.length === 0) return 0;
    const weightedChange = protocols.reduce((sum, p) => {
      return sum + (p.tvlChange24h * p.tvl);
    }, 0);
    return weightedChange / totalTvl;
  }, [protocols, totalTvl]);

  return { protocols, totalTvl, tvlChange24h, isLoading };
}

// ============================================
// WHALE WATCHING HOOKS
// ============================================

export function useWhaleWatcher(
  minUsd: number = 100000,
  limit: number = 20,
  enabled: boolean = true
) {
  const [swaps, setSwaps] = useState<WhaleSwap[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      try {
        const data = await getWhaleSwaps(minUsd, limit);
        setSwaps(data);
      } catch (error) {
        console.error('Whale fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, DEFI_POLLING_INTERVALS.whaleSwaps);
    
    return () => clearInterval(interval);
  }, [minUsd, limit, enabled]);

  // Identify accumulation patterns
  const accumulationSignals = useMemo(() => {
    const tokenCounts: Record<string, { count: number; totalUsd: number }> = {};
    
    swaps.forEach(swap => {
      // Whale bought token1 with token0 (stable)
      if (swap.token0Symbol.match(/USDC|USDT|DAI/i)) {
        const token = swap.token1Symbol;
        if (!tokenCounts[token]) tokenCounts[token] = { count: 0, totalUsd: 0 };
        tokenCounts[token].count++;
        tokenCounts[token].totalUsd += swap.amountUSD;
      }
    });

    return Object.entries(tokenCounts)
      .filter(([_, data]) => data.count >= 2)
      .sort((a, b) => b[1].totalUsd - a[1].totalUsd);
  }, [swaps]);

  return { swaps, accumulationSignals, isLoading };
}

// ============================================
// MARKET OVERVIEW HOOKS
// ============================================

export function useMarketOverview(enabled: boolean = true) {
  const [marketData, setMarketData] = useState<any>(null);
  const [gainersLosers, setGainersLosers] = useState({ gainers: [], losers: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      try {
        const [global, gl] = await Promise.all([
          getGlobalMarketData(),
          getTopGainersLosers()
        ]);
        setMarketData(global);
        setGainersLosers(gl);
      } catch (error) {
        console.error('Market fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // 1 minute
    
    return () => clearInterval(interval);
  }, [enabled]);

  const fearGreed = useMemo(() => {
    if (!marketData?.data) return null;
    const change = marketData.data.market_cap_change_percentage_24h_usd;
    if (change > 5) return { value: 'Greed', score: 75, color: 'text-green-500' };
    if (change > 0) return { value: 'Neutral', score: 50, color: 'text-yellow-500' };
    if (change > -5) return { value: 'Fear', score: 30, color: 'text-orange-500' };
    return { value: 'Extreme Fear', score: 15, color: 'text-red-500' };
  }, [marketData]);

  return { 
    marketData, 
    ...gainersLosers, 
    fearGreed,
    isLoading 
  };
}

// ============================================
// SOVEREIGN SIGNALS HOOK
// ============================================

export function useSovereignSignals(enabled: boolean = true) {
  const [signals, setSignals] = useState<SovereignSignal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await generateSovereignSignals();
        setSignals(data);
      } catch (error) {
        console.error('Signal generation error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, DEFI_POLLING_INTERVALS.signals);
    
    return () => clearInterval(interval);
  }, [enabled]);

  // High confidence signals only
  const highConfidence = useMemo(() => 
    signals.filter(s => s.confidence >= 0.7),
  [signals]);

  // Auto-executable signals
  const autoExecutable = useMemo(() => 
    signals.filter(s => s.actions.autoExecute),
  [signals]);

  return { 
    signals, 
    highConfidence, 
    autoExecutable,
    count: signals.length,
    isLoading 
  };
}
