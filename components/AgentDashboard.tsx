'use client';

import React, { useState } from 'react';
import { RTDSMarketPanel } from './RTDSMarketPanel';
import { AgentAlertFeed } from './AgentAlertFeed';
import { SovereignSignalPanel } from './SovereignSignalCorrelator';
import { UnusualMovementPanel, MovementAlertBadge } from './UnusualMovementPanel';
import { useUnusualMovementDetection } from '@/hooks/useUnusualMovementDetection';
import { 
  useRTDS, 
  DEFAULT_SYMBOLS,
  formatPrice,
  formatChangePercent,
  getChangeColor,
} from '@/hooks/useRTDS';
import { useCrossAssetSignals, REGIME_DESCRIPTIONS } from '@/hooks/useCrossAssetSignals';
import {
  Activity,
  Target,
  Zap,
  Shield,
  Globe,
  TrendingUp,
  TrendingDown,
  BarChart3,
  LayoutGrid,
  List,
  Settings,
  Bell,
  Wifi,
  WifiOff,
  Clock,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw,
  Bitcoin,
  DollarSign,
  BarChart2,
  Layers,
  Dna,
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

type DashboardView = 'overview' | 'prices' | 'movements' | 'signals' | 'sovereign' | 'settings';

interface AgentDashboardProps {
  className?: string;
  defaultView?: DashboardView;
}

// ============================================================================
// Main Dashboard
// ============================================================================

export function AgentDashboard({ className, defaultView = 'overview' }: AgentDashboardProps) {
  const [activeView, setActiveView] = useState<DashboardView>(defaultView);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Data hooks
  const { 
    connectionState, 
    isConnected, 
    prices, 
    reconnect,
    getPricesByAssetClass,
  } = useRTDS({ symbols: DEFAULT_SYMBOLS });

  const { 
    regime, 
    regimeInfo, 
    signals: regimeSignals,
    recentSignals,
  } = useCrossAssetSignals({ symbols: DEFAULT_SYMBOLS });

  // Calculate stats
  const stats = React.useMemo(() => {
    const equity = getPricesByAssetClass('equity');
    const crypto = getPricesByAssetClass('crypto');
    
    const equityUp = equity.filter((p) => (p.changePercent24h || 0) > 0).length;
    const cryptoUp = crypto.filter((p) => (p.changePercent24h || 0) > 0).length;
    
    const avgEquityChange = equity.length > 0 
      ? equity.reduce((sum, p) => sum + (p.changePercent24h || 0), 0) / equity.length 
      : 0;
    
    const avgCryptoChange = crypto.length > 0 
      ? crypto.reduce((sum, p) => sum + (p.changePercent24h || 0), 0) / crypto.length 
      : 0;

    return {
      equityUp,
      equityDown: equity.length - equityUp,
      cryptoUp,
      cryptoDown: crypto.length - cryptoUp,
      avgEquityChange,
      avgCryptoChange,
      activeAlerts: regimeSignals.filter((s) => s.severity === 'high' || s.severity === 'critical').length,
    };
  }, [getPricesByAssetClass, regimeSignals]);

  const { criticalCount } = useUnusualMovementDetection({ symbols: DEFAULT_SYMBOLS });

  // Get key prices for overview
  const spyPrice = prices.get('SPY');
  const btcPrice = prices.get('BTC');
  const goldPrice = prices.get('XAUUSD');
  const vxxPrice = prices.get('VXX');

  // Navigation items
  const navItems: { id: DashboardView; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'prices', label: 'Market Prices', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'movements', label: 'Movement Alerts', icon: <Bell className="w-4 h-4" />, badge: criticalCount },
    { id: 'signals', label: 'Agent Signals', icon: <Zap className="w-4 h-4" />, badge: stats.activeAlerts },
    { id: 'sovereign', label: 'Sovereign Alpha', icon: <Target className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className={cn("flex h-full bg-slate-950 text-slate-200", className)}>
      {/* Sidebar */}
      <div 
        className={cn(
          "flex flex-col border-r border-slate-800 transition-all duration-300",
          sidebarCollapsed ? "w-14" : "w-56"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 py-4 border-b border-slate-800">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/20 flex-shrink-0">
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <div className="text-sm font-bold text-slate-100">Agent Tab</div>
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <>
                    <Wifi className="w-3 h-3 text-green-400" />
                    <span className="text-[10px] text-green-400">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-red-400" />
                    <button 
                      onClick={reconnect}
                      className="text-[10px] text-red-400 hover:text-red-300"
                    >
                      Reconnect
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors relative",
                activeView === item.id 
                  ? "bg-cyan-500/10 text-cyan-400 border-r-2 border-cyan-400" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )}
            >
              {item.icon}
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>

        {/* Biotech Protocol Link */}
        <div className="px-3 py-2 border-t border-slate-800">
          <a
            href="/biotech"
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg group"
          >
            <Dna className="w-4 h-4" />
            {!sidebarCollapsed && (
              <>
                <span className="flex-1 text-left">Biotech Protocol</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </a>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-3 text-slate-500 hover:text-slate-300 border-t border-slate-800"
        >
          <ChevronRight 
            className={cn(
              "w-4 h-4 transition-transform",
              !sidebarCollapsed && "rotate-180"
            )} 
          />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeView === 'overview' && (
          <OverviewView 
            stats={stats}
            regime={regime}
            regimeInfo={regimeInfo}
            spyPrice={spyPrice}
            btcPrice={btcPrice}
            goldPrice={goldPrice}
            vxxPrice={vxxPrice}
            recentSignals={recentSignals}
          />
        )}
        {activeView === 'prices' && (
          <RTDSMarketPanel className="h-full rounded-none border-0" />
        )}
        {activeView === 'movements' && (
          <UnusualMovementPanel className="h-full rounded-none border-0" />
        )}
        {activeView === 'signals' && (
          <AgentAlertFeed className="h-full rounded-none border-0" />
        )}
        {activeView === 'sovereign' && (
          <SovereignSignalPanel className="h-full rounded-none border-0" />
        )}
        {activeView === 'settings' && (
          <SettingsView />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Overview View
// ============================================================================

interface OverviewViewProps {
  stats: {
    equityUp: number;
    equityDown: number;
    cryptoUp: number;
    cryptoDown: number;
    avgEquityChange: number;
    avgCryptoChange: number;
    activeAlerts: number;
  };
  regime: { current: string; confidence: number; duration: number };
  regimeInfo: { label: string; emoji: string; color: string; description: string };
  spyPrice?: ReturnType<typeof useRTDS>['getPrice'];
  btcPrice?: ReturnType<typeof useRTDS>['getPrice'];
  goldPrice?: ReturnType<typeof useRTDS>['getPrice'];
  vxxPrice?: ReturnType<typeof useRTDS>['getPrice'];
  recentSignals: ReturnType<typeof useCrossAssetSignals>['recentSignals'];
}

function OverviewView({ 
  stats, 
  regime, 
  regimeInfo, 
  spyPrice, 
  btcPrice, 
  goldPrice, 
  vxxPrice,
  recentSignals,
}: OverviewViewProps) {
  return (
    <div className="h-full overflow-y-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Agent Dashboard</h1>
          <p className="text-sm text-slate-500">Cross-asset market intelligence & signal detection</p>
        </div>
        <MovementAlertBadge />
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {/* Regime Card */}
        <div 
          className="p-4 rounded-xl border"
          style={{ 
            backgroundColor: `${regimeInfo.color}08`,
            borderColor: `${regimeInfo.color}30`
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{regimeInfo.emoji}</span>
            <div 
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${regimeInfo.color}20`, color: regimeInfo.color }}
            >
              {regime.confidence.toFixed(0)}% confidence
            </div>
          </div>
          <div className="text-sm font-medium text-slate-200">{regimeInfo.label}</div>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{regimeInfo.description}</p>
        </div>

        {/* SPY Card */}
        <PriceCard 
          symbol="SPY"
          name="S&P 500"
          price={spyPrice}
          icon={<BarChart3 className="w-4 h-4" />}
          color="text-blue-400"
          bgColor="bg-blue-500/10"
        />

        {/* BTC Card */}
        <PriceCard 
          symbol="BTC"
          name="Bitcoin"
          price={btcPrice}
          icon={<Bitcoin className="w-4 h-4" />}
          color="text-orange-400"
          bgColor="bg-orange-500/10"
        />

        {/* Gold Card */}
        <PriceCard 
          symbol="XAUUSD"
          name="Gold"
          price={goldPrice}
          icon={<DollarSign className="w-4 h-4" />}
          color="text-yellow-400"
          bgColor="bg-yellow-500/10"
        />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard 
          label="Equities"
          up={stats.equityUp}
          down={stats.equityDown}
          change={stats.avgEquityChange}
        />
        <StatCard 
          label="Crypto"
          up={stats.cryptoUp}
          down={stats.cryptoDown}
          change={stats.avgCryptoChange}
        />
        <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">VXX (Fear)</div>
          <div className="flex items-end justify-between mt-1">
            <span className="text-lg font-mono font-semibold">{vxxPrice ? vxxPrice.value.toFixed(2) : '—'}</span>
            {vxxPrice?.changePercent24h !== undefined && (
              <span className={cn("text-xs", getChangeColor(vxxPrice.changePercent24h))}>
                {formatChangePercent(vxxPrice.changePercent24h)}
              </span>
            )}
          </div>
        </div>
        <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider">Active Alerts</div>
          <div className="flex items-end justify-between mt-1">
            <span className={cn(
              "text-lg font-mono font-semibold",
              stats.activeAlerts > 0 ? "text-amber-400" : "text-slate-400"
            )}>
              {stats.activeAlerts}
            </span>
            <span className="text-xs text-slate-500">High/Critical</span>
          </div>
        </div>
      </div>

      {/* Recent Signals */}
      <div className="bg-slate-800/20 rounded-xl border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-slate-200">Recent Signals</span>
          </div>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); /* Navigate to signals */ }}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            View all <ChevronRight className="w-3 h-3" />
          </a>
        </div>
        
        <div className="divide-y divide-slate-800">
          {recentSignals.slice(0, 5).map((signal) => (
            <div key={signal.id} className="px-4 py-3 hover:bg-slate-800/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  signal.severity === 'critical' && "bg-red-500",
                  signal.severity === 'high' && "bg-orange-500",
                  signal.severity === 'medium' && "bg-yellow-500",
                  signal.severity === 'low' && "bg-blue-500",
                )} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-slate-200 truncate">{signal.title}</div>
                  <div className="text-xs text-slate-500">{signal.description.slice(0, 60)}...</div>
                </div>
                <span className="text-[10px] text-slate-600">
                  {Math.floor((Date.now() - signal.timestamp) / 60000)}m ago
                </span>
              </div>
            </div>
          ))}
          
          {recentSignals.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-500">
              <Bell className="w-6 h-6 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No signals yet</p>
              <p className="text-xs">Waiting for cross-asset patterns...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface PriceCardProps {
  symbol: string;
  name: string;
  price?: ReturnType<typeof useRTDS>['getPrice'];
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function PriceCard({ symbol, name, price, icon, color, bgColor }: PriceCardProps) {
  return (
    <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-1.5 rounded", bgColor, color)}>
          {icon}
        </div>
        <span className="text-xs text-slate-500">{name}</span>
      </div>
      
      <div className="flex items-end justify-between">
        <span className="text-xl font-mono font-semibold text-slate-100">
          {price ? formatPrice(price.value, 'equity') : '—'}
        </span>
        
        {price?.changePercent24h !== undefined && (
          <div className={cn("flex items-center gap-1 text-xs", getChangeColor(price.changePercent24h))}>
            {price.changePercent24h >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span>{formatChangePercent(price.changePercent24h)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  up: number;
  down: number;
  change: number;
}

function StatCard({ label, up, down, change }: StatCardProps) {
  const total = up + down;
  const upPercent = total > 0 ? (up / total) * 100 : 0;

  return (
    <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
        <span className={cn("text-xs", getChangeColor(change))}>
          {change > 0 ? '+' : ''}{change.toFixed(1)}%
        </span>
      </div>
      
      <div className="flex items-center gap-2 mt-2">
        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 rounded-full"
            style={{ width: `${upPercent}%` }}
          />
        </div>
        <span className="text-xs text-slate-400">{up}/{total}</span>
      </div>
    </div>
  );
}

// ============================================================================
// Settings View
// ============================================================================

function SettingsView() {
  return (
    <div className="h-full overflow-y-auto p-4">
      <h2 className="text-lg font-semibold text-slate-100 mb-4">Agent Settings</h2>
      
      <div className="space-y-4 max-w-lg">
        <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-200">Auto-refresh Prices</div>
              <div className="text-xs text-slate-500">Real-time WebSocket connection</div>
            </div>
            <div className="w-11 h-6 bg-cyan-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-200">Signal Notifications</div>
              <div className="text-xs text-slate-500">Alert on high-confidence signals</div>
            </div>
            <div className="w-11 h-6 bg-cyan-500 rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <div className="mb-3">
            <div className="text-sm font-medium text-slate-200">Minimum Edge Score</div>
            <div className="text-xs text-slate-500">Filter sovereign signals below this threshold</div>
          </div>
          <input 
            type="range" 
            min="0" 
            max="100" 
            defaultValue="40"
            className="w-full"
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>0</span>
            <span>40</span>
            <span>100</span>
          </div>
        </div>

        <div className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50">
          <div className="text-sm font-medium text-slate-200 mb-2">Tracked Assets</div>
          <div className="flex flex-wrap gap-2">
            {['SPY', 'QQQ', 'BTC', 'ETH', 'XAUUSD', 'VXX'].map((symbol) => (
              <span 
                key={symbol}
                className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400"
              >
                {symbol}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AgentDashboard;
