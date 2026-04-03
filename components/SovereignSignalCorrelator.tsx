'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRTDS, PriceState, AssetClass } from '@/hooks/useRTDS';
import { useCrossAssetSignals, RegimeType, REGIME_DESCRIPTIONS } from '@/hooks/useCrossAssetSignals';
import { usePolymarket, PolymarketEvent, formatProbability, formatVolume } from '@/hooks/usePolymarket';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Activity,
  ArrowRight,
  GitBranch,
  Shield,
  Clock,
  ChevronRight,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================================================
// Utility
// ============================================================================

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Types
// ============================================================================

export type CorrelationType = 
  | 'confidence_surge'      // Polymarket confidence increasing + price moving
  | 'divergence_opportunity' // Polymarket says one thing, price says another
  | 'regime_alignment'       // Polymarket prediction aligns with detected regime
  | 'contrarian_signal'      // Polymarket crowded, price diverging
  | 'momentum_confluence';   // Both prediction and price trending same direction

// Re-export PolymarketEvent from hook
export type { PolymarketEvent } from '@/hooks/usePolymarket';

export interface SovereignSignal {
  id: string;
  type: CorrelationType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: number;
  confidence: number; // 0-100
  
  // Sources
  polymarketEvent?: PolymarketEvent;
  priceSymbol?: string;
  currentPrice?: number;
  priceChange24h?: number;
  
  // Analysis
  regimeContext: RegimeType;
  thesis: string;
  timeHorizon: 'hours' | 'days' | 'weeks';
  conviction: 'speculative' | 'tactical' | 'strategic';
  
  // Metrics
  alignmentScore: number; // -100 to +100 (how aligned PM and price are)
  edgeScore: number; // 0-100 (opportunity quality)
}

export interface UseSovereignSignalsOptions {
  minEdgeScore?: number;
  maxEvents?: number;
  onSignal?: (signal: SovereignSignal) => void;
}

// ============================================================================
// Default Events (Example Data)
// ============================================================================

export const DEFAULT_EVENTS: PolymarketEvent[] = [
  {
    id: 'crypto-regulation',
    title: 'Crypto Regulation Passes in Q2',
    category: 'Crypto',
    endDate: '2026-06-30',
    probability: 34,
    probabilityChange24h: -5,
    volume24h: 2400000,
    liquidity: 890000,
    relatedAssets: ['BTC', 'ETH', 'COIN', 'HOOD'],
    marketUrl: 'https://polymarket.com/event/crypto-regulation',
  },
  {
    id: 'fed-rate-cut',
    title: 'Fed Cuts Rates Before July',
    category: 'Macro',
    endDate: '2026-07-01',
    probability: 67,
    probabilityChange24h: 8,
    volume24h: 5600000,
    liquidity: 2100000,
    relatedAssets: ['SPY', 'QQQ', 'BTC', 'ETH', 'XAUUSD'],
    marketUrl: 'https://polymarket.com/event/fed-rate-cut',
  },
  {
    id: 'nvda-earnings',
    title: 'NVDA Beats Earnings Estimates',
    category: 'Earnings',
    endDate: '2026-04-15',
    probability: 72,
    probabilityChange24h: 3,
    volume24h: 1200000,
    liquidity: 450000,
    relatedAssets: ['NVDA', 'QQQ', 'SPY'],
    marketUrl: 'https://polymarket.com/event/nvda-earnings',
  },
  {
    id: 'eth-etf',
    title: 'ETH ETF Approved This Quarter',
    category: 'Crypto',
    endDate: '2026-04-30',
    probability: 28,
    probabilityChange24h: -12,
    volume24h: 1800000,
    liquidity: 670000,
    relatedAssets: ['ETH', 'COIN', 'HOOD'],
    marketUrl: 'https://polymarket.com/event/eth-etf',
  },
  {
    id: 'tech-antitrust',
    title: 'Major Tech Antitrust Ruling',
    category: 'Policy',
    endDate: '2026-05-15',
    probability: 45,
    probabilityChange24h: 2,
    volume24h: 890000,
    liquidity: 320000,
    relatedAssets: ['GOOGL', 'META', 'AAPL', 'MSFT', 'QQQ'],
    marketUrl: 'https://polymarket.com/event/tech-antitrust',
  },
  {
    id: 'gold-2200',
    title: 'Gold Hits $2,200 This Month',
    category: 'Commodities',
    endDate: '2026-04-30',
    probability: 23,
    probabilityChange24h: 6,
    volume24h: 670000,
    liquidity: 240000,
    relatedAssets: ['XAUUSD', 'XAGUSD'],
    marketUrl: 'https://polymarket.com/event/gold-2200',
  },
];

// ============================================================================
// Main Hook (Using Real Polymarket Data)
// ============================================================================

export function useSovereignSignals(options: UseSovereignSignalsOptions = {}) {
  const {
    minEdgeScore = 40,
    maxEvents = 50,
    onSignal,
  } = options;

  // Get real Polymarket data
  const { 
    events, 
    loading: pmLoading, 
    error: pmError, 
    refresh,
    lastUpdated,
  } = usePolymarket({
    categories: ['crypto', 'politics', 'finance', 'tech'],
    limit: maxEvents,
    activeOnly: true,
    minLiquidity: 10000,
    minVolume24h: 5000,
    refreshInterval: 60000, // 1 minute
  });

  // Get data from other hooks
  const { prices, getPrice } = useRTDS({});
  const { regime, metrics } = useCrossAssetSignals({});

  // State
  const [signals, setSignals] = useState<SovereignSignal[]>([]);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Generate signals based on correlations
  useEffect(() => {
    const newSignals: SovereignSignal[] = [];

    events.slice(0, maxEvents).forEach((event) => {
      // Check each related asset
      event.relatedAssets?.forEach((symbol) => {
        const price = getPrice(symbol);
        if (!price) return;

        const signal = analyzeCorrelation(event, price, regime.current, metrics);
        
        if (signal && signal.edgeScore >= minEdgeScore) {
          newSignals.push(signal);
        }
      });
    });

    // Sort by edge score
    newSignals.sort((a, b) => b.edgeScore - a.edgeScore);

    // Deduplicate by event+symbol
    const seen = new Set<string>();
    const deduped = newSignals.filter((s) => {
      const key = `${s.polymarketEvent?.id}-${s.priceSymbol}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    setSignals(deduped);
    setLastUpdate(Date.now());

    // Emit new high-edge signals
    deduped.forEach((signal) => {
      if (signal.edgeScore >= 70) {
        onSignal?.(signal);
      }
    });

  }, [events, prices, regime.current, metrics, getPrice, minEdgeScore, maxEvents, onSignal]);

  // Group signals by type
  const groupedSignals = useMemo(() => {
    const grouped: Record<CorrelationType, SovereignSignal[]> = {
      confidence_surge: [],
      divergence_opportunity: [],
      regime_alignment: [],
      contrarian_signal: [],
      momentum_confluence: [],
    };

    signals.forEach((signal) => {
      grouped[signal.type].push(signal);
    });

    return grouped;
  }, [signals]);

  // Stats
  const stats = useMemo(() => ({
    total: signals.length,
    highEdge: signals.filter((s) => s.edgeScore >= 70).length,
    byType: {
      divergence: groupedSignals.divergence_opportunity.length,
      confluence: groupedSignals.momentum_confluence.length,
      regime: groupedSignals.regime_alignment.length,
      contrarian: groupedSignals.contrarian_signal.length,
    },
    pmConnected: !pmError,
    pmEventCount: events.length,
  }), [signals, groupedSignals, pmError, events.length]);

  return {
    signals,
    groupedSignals,
    stats,
    lastUpdate,
    regime: regime.current,
    loading: pmLoading,
    error: pmError,
    refresh,
    lastPolymarketUpdate: lastUpdated,
  };
}

// ============================================================================
// Analysis Logic
// ============================================================================

function analyzeCorrelation(
  event: PolymarketEvent,
  price: PriceState,
  currentRegime: RegimeType,
  metrics: ReturnType<typeof useCrossAssetSignals>['metrics']
): SovereignSignal | null {
  const priceChange = price.changePercent24h || 0;
  const probChange = event.probabilityChange24h;
  const now = Date.now();

  // Calculate alignment: are PM probability and price moving together?
  // +100 = perfect alignment (both up), -100 = perfect divergence (one up, one down)
  const alignmentScore = calculateAlignment(probChange, priceChange);

  // Determine signal type and generate thesis
  let type: CorrelationType;
  let severity: SovereignSignal['severity'] = 'low';
  let title: string;
  let description: string;
  let thesis: string;
  let conviction: SovereignSignal['conviction'] = 'speculative';
  let timeHorizon: SovereignSignal['timeHorizon'] = 'days';
  let edgeScore: number;

  // High probability event + price not moving = potential opportunity
  if (event.probability > 70 && priceChange < 2 && alignmentScore < 0) {
    type = 'divergence_opportunity';
    severity = event.probability > 80 ? 'high' : 'medium';
    title = `${event.title} / ${price.symbol} Disconnect`;
    description = `Polymarket pricing ${event.probability}% probability, but ${price.symbol} only up ${priceChange.toFixed(1)}%. Market may be underpricing the outcome.`;
    thesis = `High conviction prediction market vs muted price action suggests information asymmetry. If event resolves yes, ${price.symbol} likely catches up.`;
    conviction = 'tactical';
    edgeScore = Math.min(95, event.probability + (Math.abs(priceChange) * 2));
  }
  // Low probability event + price surging = contrarian setup
  else if (event.probability < 30 && priceChange > 5 && alignmentScore < 0) {
    type = 'contrarian_signal';
    severity = priceChange > 10 ? 'critical' : 'high';
    title = `${price.symbol} Diverging From ${event.title} Consensus`;
    description = `${price.symbol} up ${priceChange.toFixed(1)}% while Polymarket prices ${event.probability}% probability. Smart money may know something.`;
    thesis = `Price action leading prediction market. Either insider information or false signal. Monitor for confirmation or mean reversion.`;
    conviction = 'speculative';
    timeHorizon = 'hours';
    edgeScore = Math.min(90, Math.abs(priceChange) * 5 + (30 - event.probability));
  }
  // Probability and price both surging = momentum confluence
  else if (probChange > 10 && priceChange > 3 && alignmentScore > 50) {
    type = 'momentum_confluence';
    severity = probChange > 20 ? 'high' : 'medium';
    title = `${event.title} Momentum Aligning With ${price.symbol}`;
    description = `Both prediction market (+${probChange}%) and price (+${priceChange.toFixed(1)}%) surging. Strong directional consensus.`;
    thesis = `Confluence of information flow. Prediction market absorbing new info, price confirming. Trend likely continues short-term.`;
    conviction = 'tactical';
    timeHorizon = 'hours';
    edgeScore = Math.min(85, (probChange + priceChange) * 2);
  }
  // Regime alignment
  else if (isRegimeAligned(event, currentRegime) && Math.abs(priceChange) > 2) {
    type = 'regime_alignment';
    severity = 'medium';
    title = `${event.title} Fits ${REGIME_DESCRIPTIONS[currentRegime].label}`;
    description = `Current market regime (${REGIME_DESCRIPTIONS[currentRegime].label}) aligns with ${event.title} outcome.`;
    thesis = `Macro tailwinds supporting this position. Regime persistence increases probability of favorable resolution.`;
    conviction = 'strategic';
    timeHorizon = 'weeks';
    edgeScore = 50 + Math.abs(priceChange);
  }
  // Probability surging but price flat = early signal
  else if (probChange > 15 && Math.abs(priceChange) < 1) {
    type = 'confidence_surge';
    severity = probChange > 25 ? 'high' : 'medium';
    title = `${event.title} Confidence Surging`;
    description = `Polymarket probability jumped ${probChange}% in 24h but ${price.symbol} hasn't moved yet. Potential leading indicator.`;
    thesis = `Prediction market moving first. Either price follows within 24-48h, or prediction market corrects back.`;
    conviction = 'tactical';
    timeHorizon = 'days';
    edgeScore = Math.min(80, probChange * 2);
  }
  else {
    return null;
  }

  return {
    id: `${event.id}-${price.symbol}-${now}`,
    type,
    severity,
    title,
    description,
    timestamp: now,
    confidence: event.probability,
    polymarketEvent: event,
    priceSymbol: price.symbol,
    currentPrice: price.value,
    priceChange24h: priceChange,
    regimeContext: currentRegime,
    thesis,
    timeHorizon,
    conviction,
    alignmentScore,
    edgeScore,
  };
}

function calculateAlignment(probChange: number, priceChange: number): number {
  // Normalize to -100 to +100 scale
  const normalizedProb = Math.max(-100, Math.min(100, probChange * 5)); // Scale: 20% change = 100
  const normalizedPrice = Math.max(-100, Math.min(100, priceChange * 10)); // Scale: 10% change = 100
  
  // If both positive or both negative, alignment is positive
  if (normalizedProb * normalizedPrice > 0) {
    return (Math.abs(normalizedProb) + Math.abs(normalizedPrice)) / 2;
  }
  
  // Divergence
  return -((Math.abs(normalizedProb) + Math.abs(normalizedPrice)) / 2);
}

function isRegimeAligned(event: PolymarketEvent, regime: RegimeType): boolean {
  const regimeAssetMap: Record<RegimeType, string[]> = {
    expansion_risk_on: ['SPY', 'QQQ', 'BTC', 'ETH'],
    contraction_risk_off: ['XAUUSD', 'VXX'],
    dollar_dominance: ['EURUSD'],
    inflation_hedge: ['XAUUSD', 'BTC'],
    geopolitical_stress: ['XAUUSD', 'WTI', 'NGD'],
    tech_momentum: ['QQQ', 'NVDA'],
    crypto_spring: ['BTC', 'ETH', 'COIN'],
    crypto_winter: ['BTC', 'ETH'],
    choppy_neutral: [],
    unclear: [],
  };

  const regimeAssets = regimeAssetMap[regime] || [];
  return event.relatedAssets.some((asset) => regimeAssets.includes(asset));
}

// ============================================================================
// Visual Components
// ============================================================================

interface SovereignSignalPanelProps {
  className?: string;
  minEdgeScore?: number;
  maxEvents?: number;
  onSignalClick?: (signal: SovereignSignal) => void;
}

export function SovereignSignalPanel({
  className,
  minEdgeScore = 40,
  maxEvents = 50,
  onSignalClick,
}: SovereignSignalPanelProps) {
  const { 
    signals, 
    groupedSignals, 
    stats, 
    lastUpdate, 
    regime,
    loading,
    error,
    refresh,
    lastPolymarketUpdate,
  } = useSovereignSignals({
    minEdgeScore,
    maxEvents,
  });

  const [selectedTypes, setSelectedTypes] = useState<Set<CorrelationType>>(
    new Set(['divergence_opportunity', 'momentum_confluence', 'contrarian_signal', 'confidence_surge'])
  );
  const [selectedSeverity, setSelectedSeverity] = useState<Set<string>>(
    new Set(['low', 'medium', 'high', 'critical'])
  );

  const filteredSignals = signals.filter((s) => 
    selectedTypes.has(s.type) && selectedSeverity.has(s.severity)
  );

  const toggleType = (type: CorrelationType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  return (
    <div className={cn("flex flex-col h-full bg-slate-900/50 rounded-lg border border-slate-800 overflow-hidden", className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/20">
              <Target className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100">Sovereign Signals</h3>
                {stats.pmConnected ? (
                  <Wifi className="w-3 h-3 text-green-400" />
                ) : (
                  <WifiOff className="w-3 h-3 text-red-400" />
                )}
              </div>
              <p className="text-xs text-slate-500">
                {loading ? 'Loading...' : `${stats.total} opportunities · ${stats.pmEventCount} PM events`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              disabled={loading}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
              title="Refresh Polymarket data"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            <div 
              className="px-2 py-1 rounded-full text-xs"
              style={{ 
                backgroundColor: `${REGIME_DESCRIPTIONS[regime].color}20`,
                color: REGIME_DESCRIPTIONS[regime].color
              }}
            >
              {REGIME_DESCRIPTIONS[regime].emoji} {REGIME_DESCRIPTIONS[regime].label}
            </div>
          </div>
        </div>
        
        {/* Connection status bar */}
        <div className="flex items-center gap-2 mt-2">
          {error ? (
            <span className="text-[10px] text-red-400">PM API Error: {error.message}</span>
          ) : (
            <span className="text-[10px] text-slate-500">
              Last updated: {lastPolymarketUpdate ? new Date(lastPolymarketUpdate).toLocaleTimeString() : 'Never'}
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="px-3 py-2 border-b border-slate-800 space-y-2">
        <div className="flex items-center gap-1 flex-wrap">
          {(['divergence_opportunity', 'momentum_confluence', 'contrarian_signal', 'confidence_surge'] as CorrelationType[]).map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={cn(
                "text-[10px] px-2 py-1 rounded-full transition-colors capitalize",
                selectedTypes.has(type)
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-slate-600 hover:text-slate-400"
              )}
            >
              {type.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Signals List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <Loader2 className="w-8 h-8 mb-2 animate-spin" />
            <p className="text-sm">Loading Polymarket data...</p>
            <p className="text-xs mt-1">Fetching live prediction markets</p>
          </div>
        ) : filteredSignals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <GitBranch className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No high-edge signals</p>
            <p className="text-xs mt-1">{stats.pmEventCount > 0 ? 'Try lowering edge threshold' : 'Waiting for Polymarket data'}</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredSignals.map((signal) => (
              <SignalCard 
                key={signal.id} 
                signal={signal} 
                onClick={() => onSignalClick?.(signal)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SignalCard({ signal, onClick }: { signal: SovereignSignal; onClick?: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const typeConfig: Record<CorrelationType, { icon: React.ReactNode; color: string; bg: string }> = {
    divergence_opportunity: { 
      icon: <TrendingUp className="w-4 h-4" />, 
      color: 'text-green-400', 
      bg: 'bg-green-500/10' 
    },
    contrarian_signal: { 
      icon: <AlertTriangle className="w-4 h-4" />, 
      color: 'text-red-400', 
      bg: 'bg-red-500/10' 
    },
    momentum_confluence: { 
      icon: <Zap className="w-4 h-4" />, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10' 
    },
    confidence_surge: { 
      icon: <Activity className="w-4 h-4" />, 
      color: 'text-cyan-400', 
      bg: 'bg-cyan-500/10' 
    },
    regime_alignment: { 
      icon: <Shield className="w-4 h-4" />, 
      color: 'text-purple-400', 
      bg: 'bg-purple-500/10' 
    },
  };

  const config = typeConfig[signal.type];

  return (
    <div 
      onClick={() => { setExpanded(!expanded); onClick?.(); }}
      className={cn(
        "p-3 cursor-pointer transition-all hover:bg-slate-800/30",
        signal.severity === 'critical' && "bg-red-500/5 border-l-2 border-red-500",
        signal.severity === 'high' && "bg-orange-500/5 border-l-2 border-orange-500",
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0", config.bg, config.color)}
        >
          {config.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-200">{signal.title}</span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full",
                  signal.severity === 'critical' && "bg-red-500/20 text-red-400",
                  signal.severity === 'high' && "bg-orange-500/20 text-orange-400",
                  signal.severity === 'medium' && "bg-yellow-500/20 text-yellow-400",
                  signal.severity === 'low' && "bg-blue-500/20 text-blue-400",
                )}>
                  {signal.severity}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{signal.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono font-semibold text-amber-400">
                {signal.edgeScore.toFixed(0)} edge
              </div>
              <div className="text-[10px] text-slate-500">
                {signal.alignmentScore > 0 ? '+' : ''}{signal.alignmentScore.toFixed(0)}% align
              </div>
            </div>
          </div>

          {expanded && (
            <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-3">
              {/* Thesis */}
              <div className="bg-slate-800/50 rounded p-3">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Thesis</div>
                <p className="text-xs text-slate-300">{signal.thesis}</p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-slate-800/30 rounded p-2">
                  <div className="text-[10px] text-slate-500">PM Prob</div>
                  <div className="text-sm font-mono" style={{ color: getProbabilityColor(signal.confidence) }}>
                    {signal.confidence.toFixed(0)}%
                  </div>
                </div>
                <div className="bg-slate-800/30 rounded p-2">
                  <div className="text-[10px] text-slate-500">Price</div>
                  <div className="text-sm font-mono text-slate-200">${signal.currentPrice?.toFixed(2)}</div>
                </div>
                <div className="bg-slate-800/30 rounded p-2">
                  <div className="text-[10px] text-slate-500">24h Chg</div>
                  <div className={cn(
                    "text-sm font-mono",
                    (signal.priceChange24h || 0) >= 0 ? "text-green-400" : "text-red-400"
                  )}>
                    {(signal.priceChange24h || 0) >= 0 ? '+' : ''}{signal.priceChange24h?.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-slate-800/30 rounded p-2">
                  <div className="text-[10px] text-slate-500">Horizon</div>
                  <div className="text-sm text-slate-300 capitalize">{signal.timeHorizon}</div>
                </div>
              </div>

              {/* Polymarket Link */}
              {signal.polymarketEvent?.slug && (
                <a
                  href={`https://polymarket.com/event/${signal.polymarketEvent.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>View on Polymarket</span>
                  {signal.polymarketEvent.volume24h > 0 && (
                    <span className="text-[10px] text-slate-500">
                      · {formatVolume(signal.polymarketEvent.volume24h)} vol
                    </span>
                  )}
                </a>
              )}

              {/* Conviction badge */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">Conviction:</span>
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full capitalize",
                  signal.conviction === 'strategic' && "bg-purple-500/20 text-purple-400",
                  signal.conviction === 'tactical' && "bg-cyan-500/20 text-cyan-400",
                  signal.conviction === 'speculative' && "bg-slate-600/30 text-slate-400",
                )}>
                  {signal.conviction}
                </span>
                <span className="text-[10px] text-slate-500 ml-2">Regime: {REGIME_DESCRIPTIONS[signal.regimeContext].label}</span>
              </div⎯
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SovereignSignalPanel;
