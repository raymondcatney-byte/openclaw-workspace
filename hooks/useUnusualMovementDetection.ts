import { useCallback, useEffect, useRef, useState } from 'react';
import { useRTDS, PriceState, AssetClass, SymbolConfig } from './useRTDS';

// ============================================================================
// Types
// ============================================================================

export type MovementType = 
  | 'price_spike'        // Sudden price jump
  | 'price_drop'         // Sudden price drop  
  | 'volume_anomaly'     // Unusual volume (if available)
  | 'momentum_burst'     // Accelerating price move
  | 'reversal'           // Direction change after trend
  | 'breakout'           // Breaking recent range
  | 'flash_crash'        // Extreme rapid drop
  | 'pump'               // Coordinated rapid rise
  | 'volatility_expansion' // Volatility suddenly increasing
  | 'stealth_accumulation'; // Quiet buying before move

export type MovementSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export interface UnusualMovement {
  id: string;
  type: MovementType;
  severity: MovementSeverity;
  symbol: string;
  assetClass: AssetClass;
  
  // Price data
  price: number;
  previousPrice: number;
  changePercent: number;
  changeAmount: number;
  
  // Time context
  timestamp: number;
  detectionWindowMs: number;
  
  // Historical context
  context: {
    high24h?: number;
    low24h?: number;
    avgPrice?: number;
    volatility?: number;
    momentum?: number;
  };
  
  // Alert metadata
  title: string;
  description: string;
  recommendation?: string;
  
  // Scoring
  significanceScore: number; // 0-100
  rarityScore: number; // How unusual this is historically
}

export interface UseUnusualMovementOptions {
  symbols?: SymbolConfig[];
  
  // Detection thresholds
  spikeThreshold?: number;        // % move to trigger spike (default 2%)
  dropThreshold?: number;         // % drop to trigger alert (default -2%)
  momentumThreshold?: number;     // Acceleration threshold
  volatilityExpansionThreshold?: number;
  
  // Time windows
  detectionWindowMs?: number;     // How far back to look (default 5 min)
  cooldownMs?: number;            // Min time between alerts for same symbol
  
  // History
  historyWindowMs?: number;       // How much price history to keep
  
  // Callbacks
  onMovement?: (movement: UnusualMovement) => void;
  onCritical?: (movement: UnusualMovement) => void;
}

// ============================================================================
// Price History Management
// ============================================================================

interface PricePoint {
  price: number;
  timestamp: number;
}

class PriceHistory {
  private history: Map<string, PricePoint[]> = new Map();
  private maxAgeMs: number;

  constructor(maxAgeMs: number) {
    this.maxAgeMs = maxAgeMs;
  }

  add(symbol: string, price: number, timestamp: number) {
    if (!this.history.has(symbol)) {
      this.history.set(symbol, []);
    }
    
    const points = this.history.get(symbol)!;
    points.push({ price, timestamp });
    
    // Clean old points
    const cutoff = timestamp - this.maxAgeMs;
    const filtered = points.filter((p) => p.timestamp > cutoff);
    this.history.set(symbol, filtered);
  }

  getHistory(symbol: string): PricePoint[] {
    return this.history.get(symbol) || [];
  }

  getRecent(symbol: string, windowMs: number): PricePoint[] {
    const points = this.getHistory(symbol);
    const cutoff = Date.now() - windowMs;
    return points.filter((p) => p.timestamp > cutoff);
  }

  calculateVolatility(symbol: string): number {
    const points = this.getHistory(symbol);
    if (points.length < 2) return 0;
    
    const returns: number[] = [];
    for (let i = 1; i < points.length; i++) {
      const ret = (points[i].price - points[i - 1].price) / points[i - 1].price;
      returns.push(ret);
    }
    
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    return Math.sqrt(variance) * 100; // Return as percentage
  }

  calculateMomentum(symbol: string, windowMs: number): number {
    const recent = this.getRecent(symbol, windowMs);
    if (recent.length < 2) return 0;
    
    const first = recent[0].price;
    const last = recent[recent.length - 1].price;
    return ((last - first) / first) * 100;
  }

  getHighLow(symbol: string): { high: number; low: number } | null {
    const points = this.getHistory(symbol);
    if (points.length === 0) return null;
    
    const prices = points.map((p) => p.price);
    return {
      high: Math.max(...prices),
      low: Math.min(...prices),
    };
  }

  clear() {
    this.history.clear();
  }
}

// ============================================================================
// Main Hook
// ============================================================================

export function useUnusualMovementDetection(options: UseUnusualMovementOptions = {}) {
  const {
    symbols,
    spikeThreshold = 2,
    dropThreshold = -2,
    momentumThreshold = 1.5,
    volatilityExpansionThreshold = 50,
    detectionWindowMs = 300000, // 5 minutes
    cooldownMs = 600000, // 10 minutes
    historyWindowMs = 3600000, // 1 hour
    onMovement,
    onCritical,
  } = options;

  // RTDS connection
  const { prices, lastMessage } = useRTDS({ symbols });
  
  // Internal state
  const [movements, setMovements] = useState<UnusualMovement[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<Map<string, number>>(new Map());
  
  // Refs
  const historyRef = useRef(new PriceHistory(historyWindowMs));
  const lastAlertTimeRef = useRef<Map<string, number>>(new Map());
  const symbolMapRef = useRef<Map<string, SymbolConfig>>(new Map());

  // Build symbol lookup
  useEffect(() => {
    const map = new Map<string, SymbolConfig>();
    symbols?.forEach((s) => {
      map.set(s.symbol.toUpperCase(), s);
      map.set(s.symbol.toLowerCase(), s);
    });
    symbolMapRef.current = map;
  }, [symbols]);

  // ============================================================================
  // Detection Logic
  // ============================================================================

  const canAlert = useCallback((symbol: string): boolean => {
    const lastAlert = lastAlertTimeRef.current.get(symbol);
    if (!lastAlert) return true;
    return Date.now() - lastAlert > cooldownMs;
  }, [cooldownMs]);

  const detectMovement = useCallback((symbol: string, price: PriceState): UnusualMovement | null => {
    const config = symbolMapRef.current.get(symbol);
    if (!config) return null;

    // Add to history
    historyRef.current.add(symbol, price.value, price.timestamp);

    // Get historical context
    const recentHistory = historyRef.current.getRecent(symbol, detectionWindowMs);
    if (recentHistory.length < 2) return null;

    const previous = recentHistory[recentHistory.length - 2];
    const changePercent = ((price.value - previous.price) / previous.price) * 100;
    const highLow = historyRef.current.getHighLow(symbol);
    const volatility = historyRef.current.calculateVolatility(symbol);
    const momentum = historyRef.current.calculateMomentum(symbol, detectionWindowMs);

    // Check if we can alert
    if (!canAlert(symbol)) return null;

    let movement: UnusualMovement | null = null;

    // 1. Flash crash detection (extreme rapid drop)
    if (changePercent < -5) {
      movement = {
        id: `flash-${symbol}-${Date.now()}`,
        type: 'flash_crash',
        severity: changePercent < -10 ? 'critical' : 'high',
        symbol,
        assetClass: config.assetClass,
        price: price.value,
        previousPrice: previous.price,
        changePercent,
        changeAmount: price.value - previous.price,
        timestamp: Date.now(),
        detectionWindowMs,
        context: {
          high24h: highLow?.high,
          low24h: highLow?.low,
          volatility,
          momentum,
        },
        title: `⚠️ ${symbol} Flash Crash`,
        description: `${symbol} dropped ${Math.abs(changePercent).toFixed(2)}% in ${formatDuration(detectionWindowMs)}. ${
          changePercent < -10 ? 'Extreme volatility - potential liquidation cascade.' : 'Sharp decline detected.'
        }`,
        recommendation: changePercent < -10 
          ? 'Consider waiting for bounce or placing stink bids below market.' 
          : 'Monitor for support levels.',
        significanceScore: Math.min(100, Math.abs(changePercent) * 5),
        rarityScore: calculateRarityScore(volatility, Math.abs(changePercent)),
      };
    }
    // 2. Pump detection (extreme rapid rise)
    else if (changePercent > 5) {
      movement = {
        id: `pump-${symbol}-${Date.now()}`,
        type: 'pump',
        severity: changePercent > 10 ? 'critical' : 'high',
        symbol,
        assetClass: config.assetClass,
        price: price.value,
        previousPrice: previous.price,
        changePercent,
        changeAmount: price.value - previous.price,
        timestamp: Date.now(),
        detectionWindowMs,
        context: { high24h: highLow?.high, low24h: highLow?.low, volatility, momentum },
        title: `🚀 ${symbol} Sharp Rally`,
        description: `${symbol} surged ${changePercent.toFixed(2)}% in ${formatDuration(detectionWindowMs)}. ${
          changePercent > 10 ? 'Breakout momentum - FOMO may continue.' : 'Strong buying pressure.'
        }`,
        recommendation: changePercent > 10 
          ? 'Consider taking profits on euphoria.' 
          : 'Watch for continuation or reversal at resistance.',
        significanceScore: Math.min(100, changePercent * 5),
        rarityScore: calculateRarityScore(volatility, changePercent),
      };
    }
    // 3. Standard spike
    else if (changePercent > spikeThreshold) {
      movement = {
        id: `spike-${symbol}-${Date.now()}`,
        type: 'price_spike',
        severity: changePercent > 4 ? 'high' : changePercent > 3 ? 'medium' : 'low',
        symbol,
        assetClass: config.assetClass,
        price: price.value,
        previousPrice: previous.price,
        changePercent,
        changeAmount: price.value - previous.price,
        timestamp: Date.now(),
        detectionWindowMs,
        context: { high24h: highLow?.high, low24h: highLow?.low, volatility, momentum },
        title: `📈 ${symbol} Price Spike`,
        description: `${symbol} moved up ${changePercent.toFixed(2)}% in ${formatDuration(detectionWindowMs)}.`,
        significanceScore: changePercent * 10,
        rarityScore: calculateRarityScore(volatility, changePercent),
      };
    }
    // 4. Standard drop
    else if (changePercent < dropThreshold) {
      movement = {
        id: `drop-${symbol}-${Date.now()}`,
        type: 'price_drop',
        severity: changePercent < -4 ? 'high' : changePercent < -3 ? 'medium' : 'low',
        symbol,
        assetClass: config.assetClass,
        price: price.value,
        previousPrice: previous.price,
        changePercent,
        changeAmount: price.value - previous.price,
        timestamp: Date.now(),
        detectionWindowMs,
        context: { high24h: highLow?.high, low24h: highLow?.low, volatility, momentum },
        title: `📉 ${symbol} Price Drop`,
        description: `${symbol} dropped ${Math.abs(changePercent).toFixed(2)}% in ${formatDuration(detectionWindowMs)}.`,
        significanceScore: Math.abs(changePercent) * 10,
        rarityScore: calculateRarityScore(volatility, Math.abs(changePercent)),
      };
    }
    // 5. Volatility expansion
    else if (volatility > volatilityExpansionThreshold && Math.abs(changePercent) > 1) {
      movement = {
        id: `vol-${symbol}-${Date.now()}`,
        type: 'volatility_expansion',
        severity: 'medium',
        symbol,
        assetClass: config.assetClass,
        price: price.value,
        previousPrice: previous.price,
        changePercent,
        changeAmount: price.value - previous.price,
        timestamp: Date.now(),
        detectionWindowMs,
        context: { high24h: highLow?.high, low24h: highLow?.low, volatility, momentum },
        title: `⚡ ${symbol} Volatility Expansion`,
        description: `${symbol} volatility spiked to ${volatility.toFixed(2)}%. Expect larger moves.`,
        recommendation: 'Widen stops, reduce position size, or wait for consolidation.',
        significanceScore: Math.min(100, volatility),
        rarityScore: 60,
      };
    }
    // 6. Momentum burst
    else if (Math.abs(momentum) > momentumThreshold && Math.abs(changePercent) > 1) {
      const isUp = momentum > 0;
      movement = {
        id: `mom-${symbol}-${Date.now()}`,
        type: 'momentum_burst',
        severity: Math.abs(momentum) > 3 ? 'high' : 'medium',
        symbol,
        assetClass: config.assetClass,
        price: price.value,
        previousPrice: previous.price,
        changePercent,
        changeAmount: price.value - previous.price,
        timestamp: Date.now(),
        detectionWindowMs,
        context: { high24h: highLow?.high, low24h: highLow?.low, volatility, momentum },
        title: `${isUp ? '📈' : '📉'} ${symbol} Momentum ${isUp ? 'Surge' : 'Dump'}`,
        description: `${symbol} ${isUp ? 'accelerating higher' : 'selling off'} with ${Math.abs(momentum).toFixed(2)}% momentum.`,
        significanceScore: Math.abs(momentum) * 20,
        rarityScore: 50,
      };
    }

    if (movement) {
      lastAlertTimeRef.current.set(symbol, Date.now());
    }

    return movement;
  }, [canAlert, detectionWindowMs, dropThreshold, momentumThreshold, spikeThreshold, volatilityExpansionThreshold]);

  // ============================================================================
  // Main Effect
  // ============================================================================

  useEffect(() => {
    if (!lastMessage) return;

    const { topic, type, payload } = lastMessage;
    
    // Only process price updates
    if (type !== 'update' || !payload || typeof payload !== 'object') return;
    
    const priceData = payload as { symbol?: string; value?: number; timestamp?: number };
    if (!priceData.symbol || !priceData.value) return;

    const symbol = priceData.symbol.toUpperCase();
    const existingPrice = prices.get(symbol);
    
    if (!existingPrice) return;

    const movement = detectMovement(symbol, existingPrice);
    
    if (movement) {
      setMovements((prev) => [movement, ...prev].slice(0, 100)); // Keep last 100
      
      if (movement.severity === 'critical') {
        onCritical?.(movement);
      }
      onMovement?.(movement);

      // Update active alerts
      setActiveAlerts((prev) => {
        const next = new Map(prev);
        next.set(symbol, Date.now());
        return next;
      });
    }
  }, [lastMessage, prices, detectMovement, onMovement, onCritical]);

  // ============================================================================
  // Public API
  // ============================================================================

  const clearMovements = useCallback(() => {
    setMovements([]);
  }, []);

  const dismissAlert = useCallback((symbol: string) => {
    setActiveAlerts((prev) => {
      const next = new Map(prev);
      next.delete(symbol);
      return next;
    });
  }, []);

  const getMovementsBySeverity = useCallback((severity: MovementSeverity) => {
    return movements.filter((m) => m.severity === severity);
  }, [movements]);

  const getMovementsByType = useCallback((type: MovementType) => {
    return movements.filter((m) => m.type === type);
  }, [movements]);

  const getCriticalCount = useCallback(() => {
    return movements.filter((m) => m.severity === 'critical' || m.severity === 'high').length;
  }, [movements]);

  return {
    movements,
    activeAlerts,
    criticalCount: getCriticalCount(),
    
    // Methods
    clearMovements,
    dismissAlert,
    getMovementsBySeverity,
    getMovementsByType,
    
    // Raw history access
    getHistory: (symbol: string) => historyRef.current.getHistory(symbol),
    getVolatility: (symbol: string) => historyRef.current.calculateVolatility(symbol),
    getMomentum: (symbol: string, windowMs?: number) => 
      historyRef.current.calculateMomentum(symbol, windowMs || detectionWindowMs),
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function calculateRarityScore(normalVolatility: number, currentMove: number): number {
  // If current move is 3x normal volatility, it's rare
  if (normalVolatility === 0) return 50;
  const ratio = currentMove / normalVolatility;
  return Math.min(100, ratio * 25);
}

// ============================================================================
// Utility Exports
// ============================================================================

export function getMovementColor(type: MovementType): string {
  switch (type) {
    case 'flash_crash':
    case 'price_drop':
      return '#ef4444';
    case 'pump':
    case 'price_spike':
      return '#22c55e';
    case 'volatility_expansion':
      return '#f59e0b';
    case 'momentum_burst':
      return '#8b5cf6';
    default:
      return '#6b7280';
  }
}

export function getMovementIcon(type: MovementType): string {
  switch (type) {
    case 'flash_crash': return '💥';
    case 'price_drop': return '📉';
    case 'pump': return '🚀';
    case 'price_spike': return '📈';
    case 'volatility_expansion': return '⚡';
    case 'momentum_burst': return '🔥';
    case 'reversal': return '🔄';
    case 'breakout': return '⛰️';
    case 'stealth_accumulation': return '🥷';
    default: return '📊';
  }
}

export function getSeverityColor(severity: MovementSeverity): string {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'high': return '#ef4444';
    case 'medium': return '#f59e0b';
    case 'low': return '#3b82f6';
    default: return '#6b7280';
  }
}

export default useUnusualMovementDetection;
