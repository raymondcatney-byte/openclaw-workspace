import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { 
  useRTDS, 
  PriceState, 
  AssetClass, 
  SymbolConfig 
} from '@/hooks/useRTDS';

// ============================================================================
// Types
// ============================================================================

export type RegimeType = 
  | 'expansion_risk_on'
  | 'contraction_risk_off'
  | 'dollar_dominance'
  | 'inflation_hedge'
  | 'geopolitical_stress'
  | 'tech_momentum'
  | 'crypto_spring'
  | 'crypto_winter'
  | 'choppy_neutral'
  | 'unclear';

export type SignalType = 
  | 'regime_shift'
  | 'divergence'
  | 'confluence'
  | 'momentum_surge'
  | 'volatility_spike'
  | 'correlation_break'
  | 'cross_asset_lead';

export type SignalSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface RegimeSignal {
  id: string;
  type: SignalType;
  severity: SignalSeverity;
  regime: RegimeType;
  title: string;
  description: string;
  timestamp: number;
  confidence: number;
  contributingAssets: string[];
  metrics: Record<string, number>;
}

export interface RegimeState {
  current: RegimeType;
  confidence: number;
  duration: number; // ms in current regime
  lastChangeAt: number;
}

export interface CrossAssetMetrics {
  // Risk-on/off indicators
  spyChange: number;
  qqqChange: number;
  btcChange: number;
  ethChange: number;
  
  // Volatility/fear
  vxxLevel: number;
  vxxChange: number;
  
  // Safe havens
  goldChange: number;
  silverChange: number;
  
  // Dollar strength
  dxyProxy: number; // Approximated from EURUSD, USDJPY
  
  // Energy/cost pressures
  oilChange: number;
  gasChange: number;
  
  // Composite scores
  riskOnScore: number; // -100 to +100
  fearScore: number; // 0 to 100
  dollarScore: number; // -100 to +100
  inflationHedgeScore: number; // 0 to 100
}

export interface UseCrossAssetSignalsOptions {
  symbols?: SymbolConfig[];
  minRegimeDuration?: number; // ms before confirming regime change
  signalCooldown?: number; // ms between similar signals
  onSignal?: (signal: RegimeSignal) => void;
  onRegimeChange?: (newRegime: RegimeType, oldRegime: RegimeType) => void;
}

// ============================================================================
// Regime Configuration
// ============================================================================

const REGIME_DESCRIPTIONS: Record<RegimeType, { 
  label: string; 
  emoji: string; 
  color: string;
  description: string;
}> = {
  expansion_risk_on: {
    label: 'Expansion / Risk-On',
    emoji: '🚀',
    color: '#22c55e',
    description: 'Stocks and crypto rallying together. Risk appetite high.',
  },
  contraction_risk_off: {
    label: 'Contraction / Risk-Off',
    emoji: '🛡️',
    color: '#ef4444',
    description: 'Flight to safety. Gold up, VIX elevated, risk assets declining.',
  },
  dollar_dominance: {
    label: 'Dollar Dominance',
    emoji: '💵',
    color: '#3b82f6',
    description: 'USD strength pressuring EM and commodities.',
  },
  inflation_hedge: {
    label: 'Inflation Hedge Mode',
    emoji: '🏛️',
    color: '#f59e0b',
    description: 'Gold and Bitcoin rising as inflation hedges.',
  },
  geopolitical_stress: {
    label: 'Geopolitical Stress',
    emoji: '⚠️',
    color: '#dc2626',
    description: 'Energy prices elevated, safe haven demand.',
  },
  tech_momentum: {
    label: 'Tech Momentum',
    emoji: '🤖',
    color: '#8b5cf6',
    description: 'QQQ outperforming SPY. AI/tech narrative dominant.',
  },
  crypto_spring: {
    label: 'Crypto Spring',
    emoji: '🌱',
    color: '#10b981',
    description: 'Crypto outperforming traditional risk assets.',
  },
  crypto_winter: {
    label: 'Crypto Winter',
    emoji: '❄️',
    color: '#64748b',
    description: 'Crypto underperforming, risk-off in digital assets.',
  },
  choppy_neutral: {
    label: 'Choppy / Neutral',
    emoji: '🌊',
    color: '#6b7280',
    description: 'No clear directional bias. Mixed signals.',
  },
  unclear: {
    label: 'Unclear',
    emoji: '❓',
    color: '#9ca3af',
    description: 'Insufficient data to determine regime.',
  },
};

// ============================================================================
// Main Hook
// ============================================================================

export function useCrossAssetSignals(options: UseCrossAssetSignalsOptions = {}) {
  const {
    symbols,
    minRegimeDuration = 60000, // 1 minute
    signalCooldown = 300000, // 5 minutes
    onSignal,
    onRegimeChange,
  } = options;

  // RTDS connection
  const { prices, getPrice, getPricesByAssetClass } = useRTDS({ symbols });

  // Internal state
  const [currentRegime, setCurrentRegime] = useState<RegimeState>({
    current: 'unclear',
    confidence: 0,
    duration: 0,
    lastChangeAt: Date.now(),
  });
  const [signals, setSignals] = useState<RegimeSignal[]>([]);
  
  // Refs for tracking
  const regimeHistoryRef = useRef<RegimeType[]>([]);
  const lastSignalTimeRef = useRef<Map<SignalType, number>>(new Map());
  const previousMetricsRef = useRef<CrossAssetMetrics | null>(null);

  // ============================================================================
  // Metrics Calculation
  // ============================================================================

  const calculateMetrics = useCallback((): CrossAssetMetrics | null => {
    const spy = getPrice('SPY');
    const qqq = getPrice('QQQ');
    const vxx = getPrice('VXX');
    const btc = getPrice('BTC');
    const eth = getPrice('ETH');
    const gold = getPrice('XAUUSD');
    const silver = getPrice('XAGUSD');
    const eurusd = getPrice('EURUSD');
    const usdjpy = getPrice('USDJPY');
    const oil = getPrice('WTI');
    const gas = getPrice('NGD');

    // Need at least some core assets
    if (!spy && !btc) return null;

    const metrics: CrossAssetMetrics = {
      spyChange: spy?.changePercent24h || 0,
      qqqChange: qqq?.changePercent24h || 0,
      btcChange: btc?.changePercent24h || 0,
      ethChange: eth?.changePercent24h || 0,
      vxxLevel: vxx?.value || 0,
      vxxChange: vxx?.changePercent24h || 0,
      goldChange: gold?.changePercent24h || 0,
      silverChange: silver?.changePercent24h || 0,
      dxyProxy: calculateDXYProxy(eurusd, usdjpy),
      oilChange: oil?.changePercent24h || 0,
      gasChange: gas?.changePercent24h || 0,
      riskOnScore: 0,
      fearScore: 0,
      dollarScore: 0,
      inflationHedgeScore: 0,
    };

    // Calculate composite scores
    // Risk-On Score: Weighted average of SPY, QQQ, BTC
    const equityAvg = (metrics.spyChange + metrics.qqqChange) / 2;
    const cryptoAvg = (metrics.btcChange + metrics.ethChange) / 2;
    metrics.riskOnScore = (equityAvg * 0.6 + cryptoAvg * 0.4);

    // Fear Score: VXX change + inverse of risk-on
    metrics.fearScore = Math.min(100, Math.max(0, 
      (metrics.vxxChange * 2) + 
      (metrics.riskOnScore < -1 ? Math.abs(metrics.riskOnScore) * 2 : 0)
    ));

    // Dollar Score: Approximate DXY movement
    metrics.dollarScore = metrics.dxyProxy;

    // Inflation Hedge Score: Gold + BTC correlation
    metrics.inflationHedgeScore = Math.max(0, 
      (metrics.goldChange > 0 ? metrics.goldChange : 0) + 
      (metrics.btcChange > 0 && metrics.goldChange > 0 ? metrics.btcChange * 0.5 : 0)
    );

    return metrics;
  }, [getPrice]);

  // Helper: Approximate DXY from EURUSD and USDJPY
  function calculateDXYProxy(eurusd?: PriceState, usdjpy?: PriceState): number {
    // DXY is roughly 57% EUR, 13% JPY (simplified)
    let score = 0;
    if (eurusd) {
      // EURUSD down = DXY up (inverted)
      score += (-eurusd.changePercent24h || 0) * 0.57;
    }
    if (usdjpy) {
      // USDJPY up = DXY up (direct)
      score += (usdjpy.changePercent24h || 0) * 0.13;
    }
    return score;
  }

  // ============================================================================
  // Regime Detection
  // ============================================================================

  const detectRegime = useCallback((metrics: CrossAssetMetrics): { regime: RegimeType; confidence: number } => {
    const scores: Record<RegimeType, number> = {
      expansion_risk_on: 0,
      contraction_risk_off: 0,
      dollar_dominance: 0,
      inflation_hedge: 0,
      geopolitical_stress: 0,
      tech_momentum: 0,
      crypto_spring: 0,
      crypto_winter: 0,
      choppy_neutral: 0,
      unclear: 0,
    };

    // Expansion / Risk-On
    if (metrics.riskOnScore > 1.5 && metrics.fearScore < 30) {
      scores.expansion_risk_on += metrics.riskOnScore * 10;
    }

    // Contraction / Risk-Off
    if (metrics.riskOnScore < -1.5 || metrics.fearScore > 50) {
      scores.contraction_risk_off += Math.abs(metrics.riskOnScore) * 10 + metrics.fearScore;
    }

    // Dollar Dominance
    if (metrics.dollarScore > 0.5) {
      scores.dollar_dominance += metrics.dollarScore * 20;
    }

    // Inflation Hedge
    if (metrics.inflationHedgeScore > 1 && metrics.goldChange > 0.5) {
      scores.inflation_hedge += metrics.inflationHedgeScore * 15;
    }

    // Geopolitical Stress
    if ((metrics.oilChange > 2 || metrics.gasChange > 3) && metrics.goldChange > 0.5) {
      scores.geopolitical_stress += (metrics.oilChange + metrics.gasChange) * 5;
    }

    // Tech Momentum
    if (metrics.qqqChange > metrics.spyChange + 0.5) {
      scores.tech_momentum += (metrics.qqqChange - metrics.spyChange) * 20;
    }

    // Crypto Spring
    if (metrics.btcChange > metrics.spyChange + 2 && metrics.btcChange > 0) {
      scores.crypto_spring += (metrics.btcChange - metrics.spyChange) * 10;
    }

    // Crypto Winter
    if (metrics.btcChange < metrics.spyChange - 2 && metrics.btcChange < 0) {
      scores.crypto_winter += Math.abs(metrics.btcChange - metrics.spyChange) * 10;
    }

    // Choppy / Neutral (no strong signals)
    const maxSignal = Math.max(...Object.values(scores));
    if (maxSignal < 10) {
      scores.choppy_neutral = 50;
    }

    // Find highest scoring regime
    let bestRegime: RegimeType = 'unclear';
    let bestScore = 0;

    (Object.keys(scores) as RegimeType[]).forEach((regime) => {
      if (scores[regime] > bestScore) {
        bestScore = scores[regime];
        bestRegime = regime;
      }
    });

    // Calculate confidence (0-100)
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence = totalScore > 0 ? Math.min(100, (bestScore / totalScore) * 150) : 0;

    return { regime: bestRegime, confidence };
  }, []);

  // ============================================================================
  // Signal Generation
  // ============================================================================

  const generateSignals = useCallback((
    metrics: CrossAssetMetrics,
    prevMetrics: CrossAssetMetrics | null,
    regime: RegimeType,
    prevRegime: RegimeType
  ): RegimeSignal[] => {
    const newSignals: RegimeSignal[] = [];
    const now = Date.now();

    // Check cooldown
    const canEmit = (type: SignalType) => {
      const last = lastSignalTimeRef.current.get(type) || 0;
      return now - last > signalCooldown;
    };

    // 1. Regime Shift
    if (regime !== prevRegime && canEmit('regime_shift')) {
      newSignals.push({
        id: `regime-${now}`,
        type: 'regime_shift',
        severity: 'high',
        regime,
        title: `Regime Change: ${REGIME_DESCRIPTIONS[regime].label}`,
        description: `Market has shifted from ${REGIME_DESCRIPTIONS[prevRegime].label} to ${REGIME_DESCRIPTIONS[regime].label}. ${REGIME_DESCRIPTIONS[regime].description}`,
        timestamp: now,
        confidence: currentRegime.confidence,
        contributingAssets: getContributingAssets(metrics, regime),
        metrics: {
          riskOnScore: metrics.riskOnScore,
          fearScore: metrics.fearScore,
          dollarScore: metrics.dollarScore,
        },
      });
      lastSignalTimeRef.current.set('regime_shift', now);
    }

    // 2. Divergence (if prev metrics exist)
    if (prevMetrics) {
      // Crypto-Equity divergence
      const cryptoChange = (metrics.btcChange + metrics.ethChange) / 2;
      const equityChange = (metrics.spyChange + metrics.qqqChange) / 2;
      const divergence = Math.abs(cryptoChange - equityChange);
      
      if (divergence > 3 && canEmit('divergence')) {
        const cryptoLeading = cryptoChange > equityChange;
        newSignals.push({
          id: `divergence-${now}`,
          type: 'divergence',
          severity: divergence > 5 ? 'high' : 'medium',
          regime,
          title: `${cryptoLeading ? 'Crypto' : 'Equity'} Leading Divergence`,
          description: `${cryptoLeading ? 'Crypto' : 'Equities'} outperforming by ${divergence.toFixed(1)}%. Potential ${cryptoLeading ? 'risk-on' : 'risk-off'} rotation.`,
          timestamp: now,
          confidence: Math.min(100, divergence * 10),
          contributingAssets: cryptoLeading ? ['BTC', 'ETH'] : ['SPY', 'QQQ'],
          metrics: { cryptoChange, equityChange, divergence },
        });
        lastSignalTimeRef.current.set('divergence', now);
      }

      // 3. Momentum Surge
      const momentumChange = metrics.riskOnScore - (prevMetrics.riskOnScore || 0);
      if (Math.abs(momentumChange) > 2 && canEmit('momentum_surge')) {
        newSignals.push({
          id: `momentum-${now}`,
          type: 'momentum_surge',
          severity: Math.abs(momentumChange) > 4 ? 'high' : 'medium',
          regime,
          title: momentumChange > 0 ? 'Momentum Surge 🚀' : 'Momentum Collapse 📉',
          description: `Risk-on score ${momentumChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(momentumChange).toFixed(1)} points in the last update.`,
          timestamp: now,
          confidence: Math.min(100, Math.abs(momentumChange) * 20),
          contributingAssets: momentumChange > 0 ? ['SPY', 'QQQ', 'BTC'] : ['VXX', 'XAUUSD'],
          metrics: { momentumChange, riskOnScore: metrics.riskOnScore },
        });
        lastSignalTimeRef.current.set('momentum_surge', now);
      }

      // 4. Volatility Spike
      const vxxJump = metrics.vxxChange - prevMetrics.vxxChange;
      if (vxxJump > 5 && canEmit('volatility_spike')) {
        newSignals.push({
          id: `vol-${now}`,
          type: 'volatility_spike',
          severity: vxxJump > 10 ? 'critical' : 'high',
          regime,
          title: 'Volatility Spike ⚠️',
          description: `VXX jumped ${vxxJump.toFixed(1)}%. Fear entering the market.`,
          timestamp: now,
          confidence: Math.min(100, vxxJump * 5),
          contributingAssets: ['VXX'],
          metrics: { vxxJump, vxxChange: metrics.vxxChange },
        });
        lastSignalTimeRef.current.set('volatility_spike', now);
      }

      // 5. Safe Haven Confluence
      if (metrics.goldChange > 0.5 && prevMetrics.goldChange <= 0.5 && canEmit('confluence')) {
        newSignals.push({
          id: `safehaven-${now}`,
          type: 'confluence',
          severity: 'medium',
          regime,
          title: 'Safe Haven Demand Emerging',
          description: 'Gold turning positive while risk assets under pressure. Flight to quality beginning.',
          timestamp: now,
          confidence: 70,
          contributingAssets: ['XAUUSD', 'XAGUSD'],
          metrics: { goldChange: metrics.goldChange, riskOnScore: metrics.riskOnScore },
        });
        lastSignalTimeRef.current.set('confluence', now);
      }
    }

    return newSignals;
  }, [currentRegime.confidence, signalCooldown]);

  // Helper: Get assets contributing to a regime
  function getContributingAssets(metrics: CrossAssetMetrics, regime: RegimeType): string[] {
    const assets: string[] = [];
    
    switch (regime) {
      case 'expansion_risk_on':
        if (metrics.spyChange > 0) assets.push('SPY');
        if (metrics.qqqChange > 0) assets.push('QQQ');
        if (metrics.btcChange > 0) assets.push('BTC');
        if (metrics.ethChange > 0) assets.push('ETH');
        break;
      case 'contraction_risk_off':
        if (metrics.goldChange > 0) assets.push('XAUUSD');
        if (metrics.vxxChange > 0) assets.push('VXX');
        break;
      case 'dollar_dominance':
        assets.push('DXY');
        break;
      case 'inflation_hedge':
        if (metrics.goldChange > 0) assets.push('XAUUSD');
        if (metrics.btcChange > 0) assets.push('BTC');
        break;
      case 'geopolitical_stress':
        if (metrics.oilChange > 0) assets.push('WTI');
        if (metrics.gasChange > 0) assets.push('NGD');
        if (metrics.goldChange > 0) assets.push('XAUUSD');
        break;
      case 'tech_momentum':
        assets.push('QQQ');
        break;
      case 'crypto_spring':
        assets.push('BTC', 'ETH');
        break;
      case 'crypto_winter':
        assets.push('BTC', 'ETH');
        break;
    }
    
    return assets;
  }

  // ============================================================================
  // Main Effect
  // ============================================================================

  useEffect(() => {
    const metrics = calculateMetrics();
    if (!metrics) return;

    // Detect regime
    const { regime, confidence } = detectRegime(metrics);
    const now = Date.now();

    // Update regime state
    setCurrentRegime((prev) => {
      const isNewRegime = regime !== prev.current;
      const timeInRegime = now - prev.lastChangeAt;

      // Only confirm regime change if we've been in it long enough
      if (isNewRegime && timeInRegime > minRegimeDuration) {
        regimeHistoryRef.current.push(prev.current);
        onRegimeChange?.(regime, prev.current);
        
        return {
          current: regime,
          confidence,
          duration: 0,
          lastChangeAt: now,
        };
      }

      return {
        ...prev,
        confidence,
        duration: now - prev.lastChangeAt,
      };
    });

    // Generate signals
    const newSignals = generateSignals(metrics, previousMetricsRef.current, regime, currentRegime.current);
    
    if (newSignals.length > 0) {
      setSignals((prev) => [...newSignals, ...prev].slice(0, 100)); // Keep last 100
      newSignals.forEach((signal) => onSignal?.(signal));
    }

    // Store metrics for next comparison
    previousMetricsRef.current = metrics;

  }, [prices, calculateMetrics, detectRegime, generateSignals, currentRegime.current, minRegimeDuration, onRegimeChange, onSignal]);

  // ============================================================================
  // Public API
  // ============================================================================

  const clearSignals = useCallback(() => {
    setSignals([]);
  }, []);

  const getRegimeHistory = useCallback(() => {
    return regimeHistoryRef.current;
  }, []);

  const getSignalCount = useCallback((severity?: SignalSeverity) => {
    if (!severity) return signals.length;
    return signals.filter((s) => s.severity === severity).length;
  }, [signals]);

  return {
    // Current state
    regime: currentRegime,
    regimeInfo: REGIME_DESCRIPTIONS[currentRegime.current],
    metrics: previousMetricsRef.current,
    
    // Signals
    signals,
    recentSignals: signals.slice(0, 10),
    
    // Methods
    clearSignals,
    getRegimeHistory,
    getSignalCount,
  };
}

// ============================================================================
// Utility Exports
// ============================================================================

export { REGIME_DESCRIPTIONS };

export function getSeverityColor(severity: SignalSeverity): string {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#3b82f6';
    default: return '#6b7280';
  }
}

export function getSignalTypeLabel(type: SignalType): string {
  const labels: Record<SignalType, string> = {
    regime_shift: 'Regime Shift',
    divergence: 'Divergence',
    confluence: 'Confluence',
    momentum_surge: 'Momentum',
    volatility_spike: 'Volatility',
    correlation_break: 'Correlation Break',
    cross_asset_lead: 'Cross-Asset Lead',
  };
  return labels[type];
}

export default useCrossAssetSignals;
