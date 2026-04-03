'use client';

import React, { useState } from 'react';
import { 
  useCrossAssetSignals, 
  RegimeSignal, 
  SignalType, 
  SignalSeverity,
  REGIME_DESCRIPTIONS,
  getSeverityColor,
  getSignalTypeLabel,
} from '@/hooks/useCrossAssetSignals';
import { SymbolConfig } from '@/hooks/useRTDS';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Shield,
  Globe,
  Bitcoin,
  DollarSign,
  BarChart3,
  AlertCircle,
  X,
  Filter,
  Bell,
  BellOff,
  Clock,
  ChevronDown,
  ChevronUp,
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
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ============================================================================
// Components
// ============================================================================

interface AgentAlertFeedProps {
  className?: string;
  symbols?: SymbolConfig[];
  maxAlerts?: number;
  showFilters?: boolean;
  onAlertClick?: (signal: RegimeSignal) => void;
}

export function AgentAlertFeed({
  className,
  symbols,
  maxAlerts = 50,
  showFilters = true,
  onAlertClick,
}: AgentAlertFeedProps) {
  // Hook
  const { 
    regime, 
    regimeInfo, 
    signals, 
    recentSignals,
    clearSignals,
    getSignalCount,
  } = useCrossAssetSignals({ symbols });

  // Local state
  const [selectedSeverities, setSelectedSeverities] = useState<Set<SignalSeverity>>(
    new Set(['critical', 'high', 'medium', 'low', 'info'])
  );
  const [selectedTypes, setSelectedTypes] = useState<Set<SignalType>>(
    new Set(['regime_shift', 'divergence', 'confluence', 'momentum_surge', 'volatility_spike'])
  );
  const [showRead, setShowRead] = useState(true);
  const [readSignals, setReadSignals] = useState<Set<string>>(new Set());
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);

  // Filter signals
  const filteredSignals = signals.filter((signal) => {
    if (!selectedSeverities.has(signal.severity)) return false;
    if (!selectedTypes.has(signal.type)) return false;
    if (!showRead && readSignals.has(signal.id)) return false;
    return true;
  }).slice(0, maxAlerts);

  // Stats
  const stats = {
    total: getSignalCount(),
    critical: getSignalCount('critical'),
    high: getSignalCount('high'),
    unread: signals.filter((s) => !readSignals.has(s.id)).length,
  };

  // Toggle helpers
  const toggleSeverity = (severity: SignalSeverity) => {
    setSelectedSeverities((prev) => {
      const next = new Set(prev);
      if (next.has(severity)) next.delete(severity);
      else next.add(severity);
      return next;
    });
  };

  const toggleType = (type: SignalType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const markAsRead = (id: string) => {
    setReadSignals((prev) => new Set([...prev, id]));
  };

  const markAllAsRead = () => {
    setReadSignals(new Set(signals.map((s) => s.id)));
  };

  // Get icon for signal type
  const getSignalIcon = (type: SignalType, severity: SignalSeverity) => {
    const className = "w-4 h-4";
    
    switch (type) {
      case 'regime_shift':
        return <Globe className={className} />;
      case 'divergence':
        return severity === 'high' > 0 
          ? <TrendingUp className={className} /> 
          : <TrendingDown className={className} />;
      case 'confluence':
        return <Activity className={className} />;
      case 'momentum_surge':
        return <Zap className={className} />;
      case 'volatility_spike':
        return <AlertTriangle className={className} />;
      case 'correlation_break':
        return <BarChart3 className={className} />;
      case 'cross_asset_lead':
        return <DollarSign className={className} />;
      default:
        return <Bell className={className} />;
    }
  };

  // Get background for severity
  const getSeverityBg = (severity: SignalSeverity) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 border-red-500/30';
      case 'high': return 'bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'bg-blue-500/10 border-blue-500/30';
      default: return 'bg-slate-700/30 border-slate-600/30';
    }
  };

  return (
    <div className={cn("flex flex-col h-full bg-slate-900/50 rounded-lg border border-slate-800 overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ backgroundColor: `${regimeInfo.color}20` }}
          >
            <span className="text-lg">{regimeInfo.emoji}</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-100">Agent Signals</h3>
              {stats.unread > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                  {stats.unread}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {regimeInfo.label} · {regime.confidence.toFixed(0)}% confidence
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {stats.unread > 0 && (
            <button
              onClick={markAllAsRead}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              title="Mark all as read"
            >
              <BellOff className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={clearSignals}
            className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Clear all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-3 py-2 border-b border-slate-800 space-y-2">
          {/* Severity filters */}
          <div className="flex items-center gap-1 flex-wrap">
            <Filter className="w-3 h-3 text-slate-600 mr-1" />
            {(['critical', 'high', 'medium', 'low', 'info'] as SignalSeverity[]).map((sev) => (
              <button
                key={sev}
                onClick={() => toggleSeverity(sev)}
                className={cn(
                  "text-[10px] px-2 py-1 rounded-full capitalize transition-colors",
                  selectedSeverities.has(sev)
                    ? "bg-slate-700 text-slate-200"
                    : "text-slate-600 hover:text-slate-400"
                )}
              >
                {sev}
              </button>
            ))}
          </div>
          
          {/* Type filters */}
          <div className="flex items-center gap-1 flex-wrap">
            {(['regime_shift', 'divergence', 'momentum_surge', 'volatility_spike', 'confluence'] as SignalType[]).map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={cn(
                  "text-[10px] px-2 py-1 rounded-full transition-colors",
                  selectedTypes.has(type)
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "text-slate-600 hover:text-slate-400"
                )}
              >
                {getSignalTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto">
        {filteredSignals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500">
            <Bell className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No active signals</p>
            <p className="text-xs mt-1">Waiting for cross-asset patterns...</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredSignals.map((signal) => {
              const isExpanded = expandedSignal === signal.id;
              const isRead = readSignals.has(signal.id);

              return (
                <div
                  key={signal.id}
                  onClick={() => {
                    markAsRead(signal.id);
                    setExpandedSignal(isExpanded ? null : signal.id);
                    onAlertClick?.(signal);
                  }}
                  className={cn(
                    "p-3 cursor-pointer transition-all hover:bg-slate-800/30",
                    getSeverityBg(signal.severity),
                    isRead && "opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div 
                      className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
                      style={{ 
                        backgroundColor: `${getSeverityColor(signal.severity)}20`,
                        color: getSeverityColor(signal.severity)
                      }}
                    >
                      {getSignalIcon(signal.type, signal.severity)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-200">
                              {signal.title}
                            </span>
                            <span className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded-full capitalize",
                              signal.severity === 'critical' && "bg-red-500/20 text-red-400",
                              signal.severity === 'high' && "bg-orange-500/20 text-orange-400",
                              signal.severity === 'medium' && "bg-yellow-500/20 text-yellow-400",
                              signal.severity === 'low' && "bg-blue-500/20 text-blue-400",
                              signal.severity === 'info' && "bg-slate-600/30 text-slate-400",
                            )}>
                              {signal.severity}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                            {signal.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-slate-600">
                          <Clock className="w-3 h-3" />
                          <span className="text-[10px]">{formatTimeAgo(signal.timestamp)}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-2">
                          {/* Contributing assets */}
                          {signal.contributingAssets.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500">Assets:</span>
                              <div className="flex items-center gap-1">
                                {signal.contributingAssets.map((asset) => (
                                  <span 
                                    key={asset}
                                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-300"
                                  >
                                    {asset}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Metrics */}
                          {Object.keys(signal.metrics).length > 0 && (
                            <div className="grid grid-cols-3 gap-2">
                              {Object.entries(signal.metrics).map(([key, value]) => (
                                <div key={key} className="bg-slate-800/50 rounded p-2">
                                  <div className="text-[10px] text-slate-500 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                  </div>
                                  <div className={cn(
                                    "text-sm font-mono font-medium",
                                    typeof value === 'number' && value > 0 && "text-green-400",
                                    typeof value === 'number' && value < 0 && "text-red-400",
                                    typeof value === 'number' && value === 0 && "text-slate-400",
                                  )}>
                                    {typeof value === 'number' 
                                      ? value.toFixed(2) 
                                      : String(value)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Confidence */}
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500">Confidence:</span>
                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-cyan-500 rounded-full transition-all"
                                style={{ width: `${signal.confidence}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400">{signal.confidence.toFixed(0)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Regime Badge (Small inline component)
// ============================================================================

interface RegimeBadgeProps {
  className?: string;
  symbols?: SymbolConfig[];
}

export function RegimeBadge({ className, symbols }: RegimeBadgeProps) {
  const { regime, regimeInfo } = useCrossAssetSignals({ symbols });

  return (
    <div 
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        className
      )}
      style={{ 
        backgroundColor: `${regimeInfo.color}15`,
        color: regimeInfo.color 
      }}
    >
      <span>{regimeInfo.emoji}</span>
      <span className="hidden sm:inline">{regimeInfo.label}</span>
      <span className="opacity-60">{regime.confidence.toFixed(0)}%</span>
    </div>
  );
}

export default AgentAlertFeed;
