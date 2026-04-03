// components/MarketLayer.tsx
// NERV-styled market overlay for War Room globe

'use client';

import { useMarketFeed } from '@/hooks/useMarketFeed';
import { Globe, AlertTriangle, TrendingUp, Activity } from 'lucide-react';

export function MarketLayer() {
  const { 
    feed, 
    loading, 
    criticalAlerts, 
    highAlerts, 
    totalAlertCount,
    lastUpdate 
  } = useMarketFeed();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'P0': return 'text-red-500 animate-pulse';
      case 'P1': return 'text-orange-500';
      case 'P2': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'P0': return 'bg-red-900/30 border-red-500/50';
      case 'P1': return 'bg-orange-900/30 border-orange-500/50';
      case 'P2': return 'bg-yellow-900/30 border-yellow-500/50';
      default: return 'bg-gray-900/30 border-gray-500/50';
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Header */}
      <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-mono text-amber-400">POLYMARKET_FEED</span>
        </div>
        <div className="flex items-center gap-4">
          {criticalAlerts.length > 0 && (
            <div className="flex items-center gap-1 text-red-400">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-xs font-mono">{criticalAlerts.length} CRITICAL</span>
            </div>
          )}
          {highAlerts.length > 0 && (
            <div className="flex items-center gap-1 text-orange-400">
              <TrendingUp className="w-3 h-3" />
              <span className="text-xs font-mono">{highAlerts.length} HIGH</span>
            </div>
          )}
          <span className="text-xs font-mono text-gray-500">
            {lastUpdate?.toLocaleTimeString() || '--:--:--'}
          </span>
        </div>
      </div>

      {/* Alert Feed */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {loading ? (
          <div className="text-xs font-mono text-gray-500 animate-pulse">
            INITIALIZING FEED...
          </div>
        ) : totalAlertCount === 0 ? (
          <div className="text-xs font-mono text-green-500">
            ✓ ALL SYSTEMS NOMINAL
          </div>
        ) : (
          feed?.events.slice(0, 10).map((event) => (
            <a
              key={event.id}
              href={event.data.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`block p-3 border rounded ${getSeverityBg(event.severity)} hover:brightness-110 transition-all`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-bold ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </span>
                    <span className="text-xs font-mono text-amber-400">
                      {event.data.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1 truncate">{event.title}</p>
                  <p className="text-xs text-gray-500">{event.description}</p>
                </div>
                <Activity className={`w-4 h-4 flex-shrink-0 ${getSeverityColor(event.severity)}`} />
              </div>
            </a>
          ))
        )}
      </div>

      {/* Market Stats */}
      {feed && (
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-amber-500/30">
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-amber-400">{feed.summary.totalMarkets}</div>
            <div className="text-xs font-mono text-gray-500">MARKETS</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-red-400">{feed.summary.p0Alerts}</div>
            <div className="text-xs font-mono text-gray-500">P0</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-orange-400">{feed.summary.p1Alerts}</div>
            <div className="text-xs font-mono text-gray-500">P1</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-yellow-400">{feed.summary.p2Alerts}</div>
            <div className="text-xs font-mono text-gray-500">P2</div>
          </div>
        </div>
      )}
    </div>
  );
}
