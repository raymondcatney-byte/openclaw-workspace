'use client';

import React, { useMemo, useState } from 'react';
import { 
  useRTDS, 
  DEFAULT_SYMBOLS, 
  AssetClass, 
  SymbolConfig,
  formatPrice,
  formatChangePercent,
  getChangeColor,
} from '@/hooks/useRTDS';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  DollarSign,
  Bitcoin,
  Coins,
  BarChart3,
  Activity as ActivityIcon,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Layers
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

type ViewMode = 'grid' | 'list';
type SortBy = 'symbol' | 'price' | 'change' | 'lastUpdate';

interface RTDSMarketPanelProps {
  className?: string;
  showHeader?: boolean;
  defaultSymbols?: SymbolConfig[];
  enableCrypto?: boolean;
  enableEquities?: boolean;
  maxItems?: number;
  onSymbolClick?: (symbol: SymbolConfig) => void;
}

// ============================================================================
// Asset Class Config
// ============================================================================

const ASSET_CLASS_CONFIG: Record<AssetClass, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  crypto: {
    label: 'Crypto',
    icon: <Bitcoin className="w-4 h-4" />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
  equity: {
    label: 'Stocks',
    icon: <BarChart3 className="w-4 h-4" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  forex: {
    label: 'Forex',
    icon: <DollarSign className="w-4 h-4" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  metal: {
    label: 'Metals',
    icon: <Coins className="w-4 h-4" />,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
  },
  commodity: {
    label: 'Commodities',
    icon: <ActivityIcon className="w-4 h-4" />,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
};

// ============================================================================
// Components
// ============================================================================

export function RTDSMarketPanel({
  className,
  showHeader = true,
  defaultSymbols = DEFAULT_SYMBOLS,
  enableCrypto = true,
  enableEquities = true,
  maxItems,
  onSymbolClick,
}: RTDSMarketPanelProps) {
  // Local state
  const [selectedAssetClasses, setSelectedAssetClasses] = useState<Set<AssetClass>>(
    new Set(['crypto', 'equity', 'forex', 'metal', 'commodity'])
  );
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('lastUpdate');
  const [sortDesc, setSortDesc] = useState(true);
  const [flashSymbols, setFlashSymbols] = useState<Set<string>>(new Set());

  // RTDS Hook
  const {
    connectionState,
    isConnected,
    reconnectCount,
    prices,
    reconnect,
    getPrice,
    isStale,
  } = useRTDS({
    symbols: defaultSymbols,
    enableCrypto,
    enableEquities,
    onPriceUpdate: (price, config) => {
      // Flash animation on price update
      setFlashSymbols((prev) => new Set([...prev, config.symbol]));
      setTimeout(() => {
        setFlashSymbols((prev) => {
          const next = new Set(prev);
          next.delete(config.symbol);
          return next;
        });
      }, 500);
    },
  });

  // Filter symbols by selected asset classes
  const filteredSymbols = useMemo(() => {
    return defaultSymbols.filter((s) => selectedAssetClasses.has(s.assetClass));
  }, [defaultSymbols, selectedAssetClasses]);

  // Sort symbols
  const sortedSymbols = useMemo(() => {
    const sorted = [...filteredSymbols].sort((a, b) => {
      const priceA = getPrice(a.symbol);
      const priceB = getPrice(b.symbol);

      switch (sortBy) {
        case 'symbol':
          return a.symbol.localeCompare(b.symbol);
        case 'price':
          return (priceA?.value || 0) - (priceB?.value || 0);
        case 'change':
          return (priceA?.changePercent24h || 0) - (priceB?.changePercent24h || 0);
        case 'lastUpdate':
        default:
          return (priceB?.lastUpdate || 0) - (priceA?.lastUpdate || 0);
      }
    });

    return sortDesc ? sorted : sorted.reverse();
  }, [filteredSymbols, sortBy, sortDesc, getPrice]);

  // Limit items if specified
  const displaySymbols = maxItems ? sortedSymbols.slice(0, maxItems) : sortedSymbols;

  // Stats
  const stats = useMemo(() => {
    const total = filteredSymbols.length;
    const withData = filteredSymbols.filter((s) => getPrice(s.symbol)).length;
    const stale = filteredSymbols.filter((s) => isStale(s.symbol)).length;
    const gainers = filteredSymbols.filter((s) => {
      const p = getPrice(s.symbol);
      return p && (p.changePercent24h || 0) > 0;
    }).length;
    const losers = filteredSymbols.filter((s) => {
      const p = getPrice(s.symbol);
      return p && (p.changePercent24h || 0) < 0;
    }).length;

    return { total, withData, stale, gainers, losers };
  }, [filteredSymbols, getPrice, isStale]);

  // Toggle asset class filter
  const toggleAssetClass = (assetClass: AssetClass) => {
    setSelectedAssetClasses((prev) => {
      const next = new Set(prev);
      if (next.has(assetClass)) {
        next.delete(assetClass);
      } else {
        next.add(assetClass);
      }
      return next;
    });
  };

  // Connection status badge
  const ConnectionBadge = () => {
    if (isConnected) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-green-400">
          <Wifi className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Live</span>
        </div>
      );
    }
    if (connectionState === 'connecting') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-yellow-400">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span className="hidden sm:inline">Connecting...</span>
        </div>
      );
    }
    return (
      <button
        onClick={reconnect}
        className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
      >
        <WifiOff className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">
          {reconnectCount > 0 ? `Retry ${reconnectCount}` : 'Disconnected'}
        </span>
      </button>
    );
  };

  return (
    <div className={cn("flex flex-col h-full bg-slate-900/50 rounded-lg border border-slate-800 overflow-hidden", className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/20">
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">RTDS Market Feed</h3>
              <p className="text-xs text-slate-500">
                {stats.withData}/{stats.total} active · {stats.gainers}↑ {stats.losers}↓
              </p>
            </div>
          </div>
          <ConnectionBadge />
        </div>
      )}

      {/* Asset Class Filters */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-800 overflow-x-auto">
        {(Object.keys(ASSET_CLASS_CONFIG) as AssetClass[]).map((assetClass) => {
          const config = ASSET_CLASS_CONFIG[assetClass];
          const isSelected = selectedAssetClasses.has(assetClass);
          const count = defaultSymbols.filter((s) => s.assetClass === assetClass).length;

          return (
            <button
              key={assetClass}
              onClick={() => toggleAssetClass(assetClass)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap",
                isSelected
                  ? cn(config.bgColor, config.color, "ring-1 ring-inset", config.color.replace('text-', 'ring-'))
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/50"
              )}
            >
              {config.icon}
              <span className="capitalize">{config.label}</span>
              <span className="text-[10px] opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Sort Controls */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/30">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Sort by:</span>
          {(['symbol', 'price', 'change', 'lastUpdate'] as SortBy[]).map((sort) => (
            <button
              key={sort}
              onClick={() => {
                if (sortBy === sort) {
                  setSortDesc(!sortDesc);
                } else {
                  setSortBy(sort);
                  setSortDesc(true);
                }
              }}
              className={cn(
                "text-xs px-2 py-1 rounded transition-colors",
                sortBy === sort
                  ? "bg-slate-700 text-slate-200"
                  : "text-slate-500 hover:text-slate-300"
              )}
            >
              {sort === 'lastUpdate' ? 'Activity' : sort.charAt(0).toUpperCase() + sort.slice(1)}
              {sortBy === sort && (
                sortDesc ? <ChevronDown className="w-3 h-3 inline ml-1" /> : <ChevronUp className="w-3 h-3 inline ml-1" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-1.5 rounded transition-colors",
              viewMode === 'grid' ? "bg-slate-700 text-slate-200" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              "p-1.5 rounded transition-colors",
              viewMode === 'list' ? "bg-slate-700 text-slate-200" : "text-slate-500 hover:text-slate-300"
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 p-3">
            {displaySymbols.map((symbol) => (
              <SymbolCard
                key={symbol.symbol}
                config={symbol}
                price={getPrice(symbol.symbol)}
                isFlashing={flashSymbols.has(symbol.symbol)}
                isStale={isStale(symbol.symbol)}
                onClick={() => onSymbolClick?.(symbol)}
              />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {displaySymbols.map((symbol) => (
              <SymbolRow
                key={symbol.symbol}
                config={symbol}
                price={getPrice(symbol.symbol)}
                isFlashing={flashSymbols.has(symbol.symbol)}
                isStale={isStale(symbol.symbol)}
                onClick={() => onSymbolClick?.(symbol)}
              />
            ))}
          </div>
        )}

        {displaySymbols.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No symbols selected</p>
            <p className="text-xs mt-1">Select an asset class above</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Symbol Card (Grid View)
// ============================================================================

interface SymbolCardProps {
  config: SymbolConfig;
  price?: ReturnType<typeof useRTDS>['getPrice'];
  isFlashing: boolean;
  isStale: boolean;
  onClick?: () => void;
}

function SymbolCard({ config, price, isFlashing, isStale, onClick }: SymbolCardProps) {
  const assetConfig = ASSET_CLASS_CONFIG[config.assetClass];
  const changePercent = price?.changePercent24h ?? 0;
  const isUp = changePercent > 0;
  const isDown = changePercent < 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative p-3 rounded-lg border transition-all cursor-pointer",
        "bg-slate-800/30 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/50",
        isFlashing && "ring-2 ring-cyan-500/50",
        isStale && "opacity-60"
      )}
    >
      {/* Flash overlay */}
      {isFlashing && (
        <div className="absolute inset-0 bg-cyan-500/10 rounded-lg animate-pulse" />
      )}

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md", assetConfig.bgColor)}>
              {assetConfig.icon}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-200">{config.symbol}</div>
              <div className="text-[10px] text-slate-500 truncate max-w-[80px]">{config.displayName}</div>
            </div>
          </div>
          {isStale && (
            <Clock className="w-3 h-3 text-slate-600" />
          )}
        </div>

        {/* Price */}
        <div className="mb-2">
          {price ? (
            <div className="text-lg font-mono font-semibold text-slate-100">
              {formatPrice(price.value, config.assetClass)}
            </div>
          ) : (
            <div className="text-lg font-mono text-slate-600">—</div>
          )}
        </div>

        {/* Change */}
        <div className="flex items-center justify-between">
          {price?.changePercent24h !== undefined ? (
            <div className={cn("flex items-center gap-1 text-xs font-medium", getChangeColor(changePercent))}>
              {isUp && <TrendingUp className="w-3 h-3" />}
              {isDown && <TrendingDown className="w-3 h-3" />}
              <span>{formatChangePercent(changePercent)}</span>
            </div>
          ) : (
            <span className="text-xs text-slate-600">—</span>
          )}

          {/* Asset class badge */}
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded", assetConfig.bgColor, assetConfig.color)}>
            {assetConfig.label}
          </span>
        </div>

        {/* Carried forward indicator */}
        {price?.isCarriedForward && (
          <div className="mt-2 text-[10px] text-amber-500/80 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>Market closed · Last known price</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Symbol Row (List View)
// ============================================================================

interface SymbolRowProps extends SymbolCardProps {}

function SymbolRow({ config, price, isFlashing, isStale, onClick }: SymbolRowProps) {
  const assetConfig = ASSET_CLASS_CONFIG[config.assetClass];
  const changePercent = price?.changePercent24h ?? 0;
  const isUp = changePercent > 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between px-4 py-3 transition-all cursor-pointer",
        "hover:bg-slate-800/30",
        isFlashing && "bg-cyan-500/5"
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-1.5 rounded-md", assetConfig.bgColor)}>
          {assetConfig.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-200">{config.symbol}</span>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded", assetConfig.bgColor, assetConfig.color)}>
              {assetConfig.label}
            </span>
          </div>
          <div className="text-xs text-slate-500">{config.displayName}</div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Change */}
        <div className={cn("flex items-center gap-1 text-sm font-medium w-20 justify-end", getChangeColor(changePercent))}>
          {isUp && <TrendingUp className="w-3.5 h-3.5" />}
          {!isUp && changePercent < 0 && <TrendingDown className="w-3.5 h-3.5" />}
          <span>{price ? formatChangePercent(changePercent) : '—'}</span>
        </div>

        {/* Price */}
        <div className="w-28 text-right">
          {price ? (
            <div className="text-sm font-mono font-semibold text-slate-100">
              {formatPrice(price.value, config.assetClass)}
            </div>
          ) : (
            <div className="text-sm font-mono text-slate-600">—</div>
          )}
          {price?.isCarriedForward && (
            <div className="text-[10px] text-amber-500/80">Closed</div>
          )}
        </div>

        {/* Status */}
        {isStale && <Clock className="w-3.5 h-3.5 text-slate-600" />}
      </div>
    </div>
  );
}

export default RTDSMarketPanel;
