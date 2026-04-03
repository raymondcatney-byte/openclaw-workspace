'use client';

import React, { useState } from 'react';
import {
  useUnusualMovementDetection,
  UnusualMovement,
  MovementType,
  MovementSeverity,
  getMovementColor,
  getMovementIcon,
  getSeverityColor,
} from '@/hooks/useUnusualMovementDetection';
import { useRTDS, DEFAULT_SYMBOLS } from '@/hooks/useRTDS';
import {
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Zap,
  Flame,
  Clock,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Bell,
  BellRing,
  BarChart3,
  Shield,
  AlertOctagon,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ============================================================================
// Utility
// ============================================================================

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

// ============================================================================
// Component
// ============================================================================

interface UnusualMovementPanelProps {
  className?: string;
  maxAlerts?: number;
  onAlertClick?: (movement: UnusualMovement) => void;
  onCriticalAlert?: (movement: UnusualMovement) => void;
}

export function UnusualMovementPanel({
  className,
  maxAlerts = 50,
  onAlertClick,
  onCriticalAlert,
}: UnusualMovementPanelProps) {
  // Detection hook
  const {
    movements,
    criticalCount,
    clearMovements,
    getMovementsBySeverity,
    getMovementsByType,
  } = useUnusualMovementDetection({
    symbols: DEFAULT_SYMBOLS,
    spikeThreshold: 2,
    dropThreshold: -2,
    detectionWindowMs: 300000, // 5 min
    cooldownMs: 600000, // 10 min
    onCritical: onCriticalAlert,
  });

  // Local state
  const [selectedTypes, setSelectedTypes] = useState<Set<MovementType>>(
    new Set(['flash_crash', 'pump', 'price_spike', 'price_drop', 'volatility_expansion'])
  );
  const [selectedSeverities, setSelectedSeverities] = useState<Set<MovementSeverity>>(
    new Set(['critical', 'high', 'medium'])
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Filter movements
  const filteredMovements = movements.filter((m) => {
    if (!selectedTypes.has(m.type)) return false;
    if (!selectedSeverities.has(m.severity)) return false;
    return true;
  }).slice(0, maxAlerts);

  // Group by type for stats
  const stats = {
    critical: getMovementsBySeverity('critical').length,
    high: getMovementsBySeverity('high').length,
    pumps: getMovementsByType('pump').length,
    crashes: getMovementsByType('flash_crash').length,
  };

  // Toggle helpers
  const toggleType = (type: MovementType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const toggleSeverity = (severity: MovementSeverity) => {
    setSelectedSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(severity)) next.delete(severity);
      else next.add(severity);
      return next;
    });
  };

  return (
    <div className={cn("flex flex-col h-full bg-slate-900/50 rounded-lg border border-slate-800 overflow-hidden", className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-rose-500/20">
              <BellRing className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100">Movement Alerts</h3>
                {criticalCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 animate-pulse"
                  >
                    {criticalCount} critical
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                {filteredMovements.length} alerts · {stats.pumps} pumps · {stats.crashes} crashes
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                soundEnabled ? "text-cyan-400 bg-cyan-500/10" : "text-slate-500 hover:text-slate-300"
              )}
              title={soundEnabled ? "Sound on" : "Sound off"}
            >
              {soundEnabled ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
            </button>
            <button
              onClick={clearMovements}
              className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Clear all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-3 py-2 border-b border-slate-800 space-y-2">
        {/* Severity filters */}
        <div className="flex items-center gap-1 flex-wrap">
          {(['critical', 'high', 'medium', 'low', 'info'] as MovementSeverity[]).map((sev) => (
            <button
              key={sev}
              onClick={() => toggleSeverity(sev)}
              className={cn(
                "text-[10px] px-2 py-1 rounded-full capitalize transition-colors",
                selectedSeverities.has(sev)
                  ? cn(
                      sev === 'critical' && "bg-red-500/20 text-red-400",
                      sev === 'high' && "bg-orange-500/20 text-orange-400",
                      sev === 'medium' && "bg-yellow-500/20 text-yellow-400",
                      sev === 'low' && "bg-blue-500/20 text-blue-400",
                      sev === 'info' && "bg-slate-600/30 text-slate-400",
                    )
                  : "text-slate-600 hover:text-slate-400"
              )}
            >
              {sev}
            </button>
          ))}
        </div>
        
        {/* Type filters */}
        <div className="flex items-center gap-1 flex-wrap">
          {[
            { type: 'flash_crash', label: 'Crashes' },
            { type: 'pump', label: 'Pumps' },
            { type: 'price_spike', label: 'Spikes' },
            { type: 'price_drop', label: 'Drops' },
            { type: 'volatility_expansion', label: 'Volatility' },
            { type: 'momentum_burst', label: 'Momentum' },
          ].map(({ type, label }) => (
            <button
              key={type}
              onClick={() => toggleType(type as MovementType)}
              className={cn(
                "text-[10px] px-2 py-1 rounded-full transition-colors",
                selectedTypes.has(type as MovementType)
                  ? "bg-rose-500/20 text-rose-400"
                  : "text-slate-600 hover:text-slate-400"
              )}
            >
              {getMovementIcon(type as MovementType)} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="flex-1 overflow-y-auto">
        {filteredMovements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <Shield className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No unusual movements</p>
            <p className="text-xs mt-1">Markets are calm... too calm?</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredMovements.map((movement) => (
              <MovementCard
                key={movement.id}
                movement={movement}
                expanded={expandedId === movement.id}
                onToggle={() => setExpandedId(expandedId === movement.id ? null : movement.id)}
                onClick={() => onAlertClick?.(movement)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Movement Card
// ============================================================================

interface MovementCardProps {
  movement: UnusualMovement;
  expanded: boolean;
  onToggle: () => void;
  onClick?: () => void;
}

function MovementCard({ movement, expanded, onToggle, onClick }: MovementCardProps) {
  const isUp = movement.changePercent > 0;
  const color = getMovementColor(movement.type);
  const icon = getMovementIcon(movement.type);
  
  const getTrendIcon = () => {
    if (movement.changePercent > 5) return <Flame className="w-4 h-4" />;
    if (movement.changePercent < -5) return <AlertOctagon className="w-4 h-4" />;
    return isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div
      onClick={() => { onToggle(); onClick?.(); }}
      className={cn(
        "p-3 cursor-pointer transition-all hover:bg-slate-800/30",
        movement.severity === 'critical' && "bg-red-500/5 animate-pulse",
        movement.severity === 'high' && "bg-orange-500/5",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0 text-lg"
          style={{ 
            backgroundColor: `${color}15`,
          }}
        >
          <span>{icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-200">{movement.title}</span>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full capitalize",
                    movement.severity === 'critical' && "bg-red-500/20 text-red-400",
                    movement.severity === 'high' && "bg-orange-500/20 text-orange-400",
                    movement.severity === 'medium' && "bg-yellow-500/20 text-yellow-400",
                    movement.severity === 'low' && "bg-blue-500/20 text-blue-400",
                    movement.severity === 'info' && "bg-slate-600/30 text-slate-400",
                  )}
                >
                  {movement.severity}
                </span>
              </div>
              
              <p className="text-xs text-slate-400 mt-0.5">{movement.description}</p>
            </div>

            <div className="text-right">
              <div className={cn(
                "text-lg font-mono font-semibold",
                isUp ? "text-green-400" : "text-red-400"
              )}>
                {isUp ? '+' : ''}{movement.changePercent.toFixed(2)}%
              </div>
              <div className="flex items-center gap-1 text-slate-600">
                <Clock className="w-3 h-3" />
                <span className="text-[10px]">{formatTimeAgo(movement.timestamp)}</span>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-3">
              {/* Price Details */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-800/50 rounded p-2">
                  <div className="text-[10px] text-slate-500">Current</div>
                  <div className="text-sm font-mono text-slate-200"
                  >${movement.price.toFixed(2)}</div>
                </div>
                <div className="bg-slate-800/50 rounded p-2">
                  <div className="text-[10px] text-slate-500">Previous</div>
                  <div className="text-sm font-mono text-slate-400"
                  >${movement.previousPrice.toFixed(2)}</div>
                </div>
                <div className="bg-slate-800/50 rounded p-2">
                  <div className="text-[10px] text-slate-500">Change $</div>
                  <div className={cn(
                    "text-sm font-mono",
                    isUp ? "text-green-400" : "text-red-400"
                  )}
                  >
                    {isUp ? '+' : ''}${movement.changeAmount.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Context Metrics */}
              <div className="grid grid-cols-3 gap-2">
                {movement.context.volatility !== undefined && (
                  <div className="bg-slate-800/30 rounded p-2">
                    <div className="text-[10px] text-slate-500">Volatility</div>
                    <div className="text-sm font-mono"
                    >{movement.context.volatility.toFixed(1)}%</div>
                  </div>
                )}
                {movement.context.momentum !== undefined && (
                  <div className="bg-slate-800/30 rounded p-2">
                    <div className="text-[10px] text-slate-500">Momentum</div>
                    <div className={cn(
                      "text-sm font-mono",
                      (movement.context.momentum || 0) >= 0 ? "text-green-400" : "text-red-400"
                    )}
                    >
                      {(movement.context.momentum || 0) >= 0 ? '+' : ''}
                      {(movement.context.momentum || 0).toFixed(1)}%
                    </div>
                  </div>
                )}
                <div className="bg-slate-800/30 rounded p-2">
                  <div className="text-[10px] text-slate-500">Rarity</div>
                  <div className="text-sm font-mono text-amber-400"
                  >{movement.rarityScore.toFixed(0)}/100</div>
                </div>
              </div>

              {/* 24h Range Bar */}
              {(movement.context.high24h && movement.context.low24h) && (
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>24h Range</span>
                    <span>L: ${movement.context.low24h.toFixed(2)} H: ${movement.context.high24h.toFixed(2)}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        background: `linear-gradient(to right, #22c55e 0%, #f59e0b 50%, #22c55e 100%)`,
                        width: `${calculateRangePosition(
                          movement.price,
                          movement.context.low24h,
                          movement.context.high24h
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Recommendation */}
              {movement.recommendation && (
                <div className="bg-slate-800/50 rounded p-3 border-l-2 border-cyan-500"
                >
                  <div className="text-[10px] text-cyan-400 uppercase tracking-wider mb-1"
                  >Agent Recommendation</div>
                  <p className="text-xs text-slate-300"
                  >{movement.recommendation}</p>
                </div>
              )}

              {/* Significance Score */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">Significance:</span>
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${movement.significanceScore}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 w-8 text-right"
                >{movement.significanceScore.toFixed(0)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

function calculateRangePosition(price: number, low: number, high: number): number {
  if (high === low) return 50;
  return ((price - low) / (high - low)) * 100;
}

// ============================================================================
// Compact Alert Badge (for header/toolbar)
// ============================================================================

interface MovementAlertBadgeProps {
  className?: string;
  onClick?: () => void;
}

export function MovementAlertBadge({ className, onClick }: MovementAlertBadgeProps) {
  const { criticalCount, movements } = useUnusualMovementDetection({
    symbols: DEFAULT_SYMBOLS,
  });

  const latest = movements[0];

  if (!latest) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/50 text-slate-500",
          className
        )}
      >
        <Shield className="w-3.5 h-3.5" />
        <span className="text-xs">Markets calm</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors",
        criticalCount > 0 
          ? "bg-red-500/20 text-red-400 animate-pulse" 
          : "bg-amber-500/20 text-amber-400",
        className
      )}
    >
      <span className="text-sm">{getMovementIcon(latest.type)}</span>
      <span className="text-xs font-medium">
        {latest.symbol} {latest.changePercent > 0 ? '+' : ''}{latest.changePercent.toFixed(1)}%
      </span>
      {criticalCount > 0 && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/30"
        >
          +{criticalCount}
        </span>
      )}
    </button>
  );
}

export default UnusualMovementPanel;
