import { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export type AssetClass = 'crypto' | 'equity' | 'forex' | 'metal' | 'commodity';

export interface RTDSPrice {
  symbol: string;
  value: number;
  fullAccuracyValue?: string;
  timestamp: number;
  receivedAt?: number;
  isCarriedForward?: boolean;
}

export interface RTDSHistoricalPoint {
  timestamp: number;
  value: number;
}

export interface RTDSSubscription {
  topic: 'crypto_prices' | 'crypto_prices_chainlink' | 'equity_prices';
  type: 'update' | '*';
  filters?: string;
}

export interface RTDSMessage {
  topic: string;
  type: string;
  timestamp: number;
  payload: RTDSPrice | { symbol: string; data: RTDSHistoricalPoint[] } | unknown;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface SymbolConfig {
  symbol: string;
  assetClass: AssetClass;
  displayName: string;
}

export interface PriceState extends RTDSPrice {
  change24h?: number;
  changePercent24h?: number;
  high24h?: number;
  low24h?: number;
  volume24h?: number;
  lastUpdate: number;
}

// ============================================================================
// Default Symbol Configurations
// ============================================================================

export const DEFAULT_SYMBOLS: SymbolConfig[] = [
  // Tech Stocks
  { symbol: 'AAPL', assetClass: 'equity', displayName: 'Apple' },
  { symbol: 'TSLA', assetClass: 'equity', displayName: 'Tesla' },
  { symbol: 'NVDA', assetClass: 'equity', displayName: 'NVIDIA' },
  { symbol: 'MSFT', assetClass: 'equity', displayName: 'Microsoft' },
  { symbol: 'GOOGL', assetClass: 'equity', displayName: 'Alphabet' },
  { symbol: 'META', assetClass: 'equity', displayName: 'Meta' },
  { symbol: 'COIN', assetClass: 'equity', displayName: 'Coinbase' },
  { symbol: 'HOOD', assetClass: 'equity', displayName: 'Robinhood' },
  // ETFs
  { symbol: 'SPY', assetClass: 'equity', displayName: 'S&P 500 ETF' },
  { symbol: 'QQQ', assetClass: 'equity', displayName: 'Nasdaq 100 ETF' },
  { symbol: 'VXX', assetClass: 'equity', displayName: 'VIX Short-Term' },
  // Crypto
  { symbol: 'BTC', assetClass: 'crypto', displayName: 'Bitcoin' },
  { symbol: 'ETH', assetClass: 'crypto', displayName: 'Ethereum' },
  { symbol: 'SOL', assetClass: 'crypto', displayName: 'Solana' },
  // Forex
  { symbol: 'EURUSD', assetClass: 'forex', displayName: 'EUR/USD' },
  { symbol: 'USDJPY', assetClass: 'forex', displayName: 'USD/JPY' },
  // Metals
  { symbol: 'XAUUSD', assetClass: 'metal', displayName: 'Gold' },
  { symbol: 'XAGUSD', assetClass: 'metal', displayName: 'Silver' },
  // Commodities
  { symbol: 'WTI', assetClass: 'commodity', displayName: 'Crude Oil' },
  { symbol: 'NGD', assetClass: 'commodity', displayName: 'Natural Gas' },
];

// ============================================================================
// Hook Options
// ============================================================================

export interface UseRTDSOptions {
  symbols?: SymbolConfig[];
  enableCrypto?: boolean;
  enableEquities?: boolean;
  reconnectInterval?: number;
  pingInterval?: number;
  maxReconnectAttempts?: number;
  onPriceUpdate?: (price: RTDSPrice, symbolConfig: SymbolConfig) => void;
  onSnapshot?: (symbol: string, data: RTDSHistoricalPoint[]) => void;
  onError?: (error: Error) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

// ============================================================================
// Main Hook
// ============================================================================

const RTDS_WS_URL = 'wss://ws-live-data.polymarket.com';
const DEFAULT_RECONNECT_INTERVAL = 3000;
const DEFAULT_PING_INTERVAL = 5000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;

export function useRTDS(options: UseRTDSOptions = {}) {
  const {
    symbols = DEFAULT_SYMBOLS,
    enableCrypto = true,
    enableEquities = true,
    reconnectInterval = DEFAULT_RECONNECT_INTERVAL,
    pingInterval = DEFAULT_PING_INTERVAL,
    maxReconnectAttempts = DEFAULT_MAX_RECONNECT_ATTEMPTS,
    onPriceUpdate,
    onSnapshot,
    onError,
    onConnect,
    onDisconnect,
  } = options;

  // State
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [prices, setPrices] = useState<Map<string, PriceState>>(new Map());
  const [lastMessage, setLastMessage] = useState<RTDSMessage | null>(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  // Refs for mutable state without re-renders
  const wsRef = useRef<WebSocket | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const symbolMapRef = useRef<Map<string, SymbolConfig>>(new Map());
  const snapshotDataRef = useRef<Map<string, RTDSHistoricalPoint[]>>(new Map());
  const isConnectingRef = useRef(false);

  // Build symbol lookup map
  useEffect(() => {
    const map = new Map<string, SymbolConfig>();
    symbols.forEach((config) => {
      // Store both uppercase and lowercase versions
      map.set(config.symbol.toUpperCase(), config);
      map.set(config.symbol.toLowerCase(), config);
    });
    symbolMapRef.current = map;
  }, [symbols]);

  // ============================================================================
  // WebSocket Management
  // ============================================================================

  const buildSubscriptions = useCallback((): RTDSSubscription[] => {
    const subs: RTDSSubscription[] = [];

    if (enableCrypto) {
      // Get crypto symbols in Binance format (lowercase, concatenated)
      const cryptoSymbols = symbols
        .filter((s) => s.assetClass === 'crypto')
        .map((s) => `${s.symbol.toLowerCase()}usdt`)
        .join(',');

      if (cryptoSymbols) {
        subs.push({
          topic: 'crypto_prices',
          type: 'update',
          filters: cryptoSymbols,
        });
      }
    }

    if (enableEquities) {
      // Subscribe to each equity/forex/metal/commodity symbol individually
      // RTDS equity feed requires individual symbol filters
      symbols
        .filter((s) => s.assetClass !== 'crypto')
        .forEach((config) => {
          subs.push({
            topic: 'equity_prices',
            type: '*', // Get both snapshots and updates
            filters: JSON.stringify({ symbol: config.symbol }),
          });
        });
    }

    return subs;
  }, [symbols, enableCrypto, enableEquities]);

  const sendPing = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send('PING');
    }
  }, []);

  const subscribe = useCallback(() => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;

    const subscriptions = buildSubscriptions();
    const message = {
      action: 'subscribe',
      subscriptions,
    };

    wsRef.current.send(JSON.stringify(message));
    console.log('[RTDS] Subscribed to:', subscriptions);
  }, [buildSubscriptions]);

  const connect = useCallback(() => {
    if (isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    isConnectingRef.current = true;
    setConnectionState('connecting');

    try {
      const ws = new WebSocket(RTDS_WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[RTDS] Connected');
        isConnectingRef.current = false;
        setConnectionState('connected');
        setReconnectCount(0);
        
        // Start ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
        }
        pingIntervalRef.current = setInterval(sendPing, pingInterval);

        // Subscribe to symbols
        subscribe();
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          // Handle PONG response
          if (event.data === 'PONG') {
            return;
          }

          const message: RTDSMessage = JSON.parse(event.data);
          setLastMessage(message);

          handleMessage(message);
        } catch (err) {
          console.error('[RTDS] Failed to parse message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[RTDS] WebSocket error:', error);
        setConnectionState('error');
        onError?.(new Error('WebSocket connection error'));
      };

      ws.onclose = () => {
        console.log('[RTDS] Disconnected');
        isConnectingRef.current = false;
        setConnectionState('disconnected');
        onDisconnect?.();

        // Clear ping interval
        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = null;
        }

        // Attempt reconnect if not at max attempts
        if (reconnectCount < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectCount((prev) => prev + 1);
            connect();
          }, reconnectInterval);
        }
      };
    } catch (err) {
      console.error('[RTDS] Connection failed:', err);
      isConnectingRef.current = false;
      setConnectionState('error');
      onError?.(err as Error);
    }
  }, [connect, pingInterval, reconnectInterval, maxReconnectAttempts, reconnectCount, subscribe, onConnect, onDisconnect, onError, sendPing]);

  const disconnect = useCallback(() => {
    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clear ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    // Close connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    isConnectingRef.current = false;
    setConnectionState('disconnected');
    setReconnectCount(0);
  }, []);

  // ============================================================================
  // Message Handling
  // ============================================================================

  const handleMessage = useCallback((message: RTDSMessage) => {
    const { topic, type, payload } = message;

    // Handle equity historical snapshot
    if (topic === 'equity_prices' && type === 'subscribe') {
      const snapshot = payload as { symbol: string; data: RTDSHistoricalPoint[] };
      const symbol = snapshot.symbol.toUpperCase();
      
      snapshotDataRef.current.set(symbol, snapshot.data);
      
      // Calculate initial stats from snapshot
      if (snapshot.data.length > 0) {
        const values = snapshot.data.map((d) => d.value);
        const latest = snapshot.data[snapshot.data.length - 1];
        const earliest = snapshot.data[0];
        
        const symbolConfig = symbolMapRef.current.get(symbol);
        if (symbolConfig) {
          const priceState: PriceState = {
            symbol,
            value: latest.value,
            timestamp: latest.timestamp,
            lastUpdate: Date.now(),
            change24h: latest.value - earliest.value,
            changePercent24h: ((latest.value - earliest.value) / earliest.value) * 100,
            high24h: Math.max(...values),
            low24h: Math.min(...values),
          };

          setPrices((prev) => {
            const next = new Map(prev);
            next.set(symbol, priceState);
            return next;
          });

          onSnapshot?.(symbol, snapshot.data);
        }
      }
      return;
    }

    // Handle live price updates
    if (type === 'update' && payload && typeof payload === 'object') {
      const priceData = payload as RTDSPrice;
      if (!priceData.symbol) return;

      const symbol = priceData.symbol.toUpperCase();
      const symbolConfig = symbolMapRef.current.get(symbol);
      
      if (!symbolConfig) return;

      setPrices((prev) => {
        const existing = prev.get(symbol);
        const priceState: PriceState = {
          ...priceData,
          symbol,
          lastUpdate: Date.now(),
          // Calculate change from existing data if available
          change24h: existing ? priceData.value - (existing.value - (existing.change24h || 0)) : undefined,
          changePercent24h: existing 
            ? ((priceData.value - (existing.value - (existing.change24h || 0))) / (existing.value - (existing.change24h || 0))) * 100
            : undefined,
        };

        const next = new Map(prev);
        next.set(symbol, priceState);
        return next;
      });

      onPriceUpdate?.(priceData, symbolConfig);
    }
  }, [onPriceUpdate, onSnapshot]);

  // ============================================================================
  // Effects
  // ============================================================================

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Re-subscribe when symbols change
  useEffect(() => {
    if (connectionState === 'connected') {
      subscribe();
    }
  }, [symbols, connectionState, subscribe]);

  // ============================================================================
  // Public API
  // ============================================================================

  const getPrice = useCallback((symbol: string): PriceState | undefined => {
    return prices.get(symbol.toUpperCase());
  }, [prices]);

  const getSnapshotData = useCallback((symbol: string): RTDSHistoricalPoint[] | undefined => {
    return snapshotDataRef.current.get(symbol.toUpperCase());
  }, []);

  const getPricesByAssetClass = useCallback((assetClass: AssetClass): PriceState[] => {
    const result: PriceState[] = [];
    prices.forEach((price, symbol) => {
      const config = symbolMapRef.current.get(symbol);
      if (config?.assetClass === assetClass) {
        result.push(price);
      }
    });
    return result;
  }, [prices]);

  const isStale = useCallback((symbol: string, maxAgeMs: number = 30000): boolean => {
    const price = prices.get(symbol.toUpperCase());
    if (!price) return true;
    return Date.now() - price.lastUpdate > maxAgeMs || price.isCarriedForward === true;
  }, [prices]);

  const reconnect = useCallback(() => {
    disconnect();
    setReconnectCount(0);
    connect();
  }, [connect, disconnect]);

  return {
    // Connection state
    connectionState,
    isConnected: connectionState === 'connected',
    isConnecting: connectionState === 'connecting',
    reconnectCount,

    // Data
    prices,
    lastMessage,

    // Methods
    getPrice,
    getSnapshotData,
    getPricesByAssetClass,
    isStale,
    connect,
    disconnect,
    reconnect,
    subscribe,
  };
}

// ============================================================================
// Utility Exports
// ============================================================================

export function formatPrice(value: number, assetClass: AssetClass): string {
  switch (assetClass) {
    case 'crypto':
      return value >= 1000 
        ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : value.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
    case 'forex':
      return value.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 5 });
    case 'metal':
      return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    case 'commodity':
      return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
    default:
      return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}

export function formatChangePercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function getChangeColor(value: number): string {
  if (value > 0) return 'text-green-500';
  if (value < 0) return 'text-red-500';
  return 'text-gray-500';
}

export default useRTDS;
