// ============================================================================
// WAR ROOM WIDGET DASHBOARD ARCHITECTURE
// ============================================================================
// Modular, real-time dashboard system for global intelligence monitoring
// Combines SitDeck-style data aggregation with Makaveli/Bruce synthesis
// ============================================================================

import { DataProvider } from './sitdeck-providers';

// ============================================================================
// CORE TYPES
// ============================================================================

export type WidgetType = 
  | 'conflict-map'      // ACLED, Liveuamap data on map
  | 'vessel-tracker'    // AIS vessel positions
  | 'flight-radar'      // ADS-B aircraft tracking
  | 'sentiment-gauge'   // Telegram/dark social sentiment
  | 'market-mosaic'     // Polymarket implied probabilities
  | 'cyber-alerts'      // CISA, CVE feed
  | 'economic-chart'    // FRED, World Bank indicators
  | 'event-timeline'    // Chronological crisis events
  | 'alert-stream'      // Real-time notifications
  | 'simulation-viewer' // War game scenario visualization
  | 'correlation-matrix' // Cross-domain relationship heatmap
  | 'satellite-feed';   // Satellite imagery timestamps

export type WidgetSize = 'small' | 'medium' | 'large' | 'full';
export type WidgetPriority = 'critical' | 'high' | 'medium' | 'low';

export interface WidgetPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WidgetData {
  timestamp: number;
  values: Record<string, number | string | boolean>;
  metadata?: Record<string, unknown>;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: WidgetSize;
  position: WidgetPosition;
  priority: WidgetPriority;
  dataSource: string; // Provider ID
  refreshInterval: number; // seconds
  makaveliWeight: number; // 0-1
  bruceWeight: number; // 0-1
  filters?: Record<string, string | number | boolean>;
  alerts?: WidgetAlert[];
  lastUpdated?: number;
  data?: WidgetData;
  error?: string;
}

export interface WidgetAlert {
  id: string;
  condition: string; // e.g., "value > 70"
  threshold: number;
  operator: 'gt' | 'lt' | 'eq' | 'change';
  message: string;
  severity: 'critical' | 'warning' | 'info';
  actions: AlertAction[];
  triggered?: boolean;
  lastTriggered?: number;
}

export type AlertAction = 
  | { type: 'notify'; channel: 'email' | 'push' | 'webhook'; target: string }
  | { type: 'highlight'; duration: number }
  | { type: 'trigger-makaveli'; query: string }
  | { type: 'trigger-bruce'; query: string }
  | { type: 'update-polymarket'; marketId: string };

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: Widget[];
  layout: 'grid' | 'free' | 'tabs';
  autoRefresh: boolean;
  globalRefreshInterval: number;
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// PRE-BUILT DASHBOARD TEMPLATES
// ============================================================================

export const defaultDashboards: Record<string, Dashboard> = {
  // Makaveli's Iran Command Center
  iranCommand: {
    id: 'iran-command',
    name: 'Iran Command Center',
    description: 'Real-time Iran situation monitoring with dark signals',
    layout: 'grid',
    autoRefresh: true,
    globalRefreshInterval: 300,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    widgets: [
      {
        id: 'iran-conflict-map',
        type: 'conflict-map',
        title: 'Iran Conflict Events',
        size: 'large',
        position: { x: 0, y: 0, w: 6, h: 4 },
        priority: 'critical',
        dataSource: 'acled',
        refreshInterval: 1800,
        makaveliWeight: 1.0,
        bruceWeight: 0.3,
        filters: { country: 'Iran', fatalities: '>0' }
      },
      {
        id: 'iran-telegram-sentiment',
        type: 'sentiment-gauge',
        title: 'Persian Telegram Sentiment',
        size: 'medium',
        position: { x: 6, y: 0, w: 3, h: 2 },
        priority: 'critical',
        dataSource: 'telegram-iran',
        refreshInterval: 900,
        makaveliWeight: 0.95,
        bruceWeight: 0.1,
        alerts: [
          {
            id: 'fear-spike',
            condition: 'fear_index > 70',
            threshold: 70,
            operator: 'gt',
            message: 'Persian Telegram showing elevated fear - potential escalation',
            severity: 'critical',
            actions: [
              { type: 'trigger-makaveli', query: 'Analyze Iran fear spike in Telegram sentiment' },
              { type: 'highlight', duration: 300 }
            ]
          }
        ]
      },
      {
        id: 'iran-dns-health',
        type: 'cyber-alerts',
        title: 'Iran Infrastructure Health',
        size: 'medium',
        position: { x: 6, y: 2, w: 3, h: 2 },
        priority: 'high',
        dataSource: 'dns-infrastructure',
        refreshInterval: 300,
        makaveliWeight: 0.85,
        bruceWeight: 0.5,
        alerts: [
          {
            id: 'partition-detected',
            condition: 'partition_detected = true',
            threshold: 1,
            operator: 'eq',
            message: 'Internet partition detected in Iran - regime sites up, civilian down',
            severity: 'critical',
            actions: [
              { type: 'trigger-makaveli', query: 'Analyze Iran internet shutdown implications' }
            ]
          }
        ]
      },
      {
        id: 'hormuz-vessels',
        type: 'vessel-tracker',
        title: 'Strait of Hormuz Traffic',
        size: 'large',
        position: { x: 0, y: 4, w: 4, h: 3 },
        priority: 'critical',
        dataSource: 'marine-traffic',
        refreshInterval: 60,
        makaveliWeight: 0.85,
        bruceWeight: 0.75,
        filters: { lat: '25.5-27.0', lng: '55.5-57.0' }
      },
      {
        id: 'iran-polymarket',
        type: 'market-mosaic',
        title: 'Iran Conflict Markets',
        size: 'medium',
        position: { x: 4, y: 4, w: 3, h: 3 },
        priority: 'critical',
        dataSource: 'polymarket-makaveli',
        refreshInterval: 60,
        makaveliWeight: 0.9,
        bruceWeight: 0.95,
        alerts: [
          {
            id: 'arbitrage-opportunity',
            condition: 'edge > 5',
            threshold: 5,
            operator: 'gt',
            message: 'Makaveli model differs from market by >5% - arbitrage opportunity',
            severity: 'warning',
            actions: [
              { type: 'trigger-bruce', query: 'Analyze Iran conflict arbitrage position sizing' }
            ]
          }
        ]
      },
      {
        id: 'iran-event-timeline',
        type: 'event-timeline',
        title: 'Iran Crisis Timeline',
        size: 'medium',
        position: { x: 7, y: 4, w: 2, h: 3 },
        priority: 'medium',
        dataSource: 'gdelt',
        refreshInterval: 900,
        makaveliWeight: 0.7,
        bruceWeight: 0.4
      }
    ]
  },

  // Bruce's Capital Command Center
  capitalCommand: {
    id: 'capital-command',
    name: 'Capital Command Center',
    description: 'Real-time capital flow and technology transition monitoring',
    layout: 'grid',
    autoRefresh: true,
    globalRefreshInterval: 300,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    widgets: [
      {
        id: 'yield-curve',
        type: 'economic-chart',
        title: 'Treasury Yield Curve',
        size: 'large',
        position: { x: 0, y: 0, w: 4, h: 3 },
        priority: 'critical',
        dataSource: 'fred',
        refreshInterval: 3600,
        makaveliWeight: 0.3,
        bruceWeight: 0.95,
        filters: { series: ['DGS1MO', 'DGS3MO', 'DGS6MO', 'DGS1', 'DGS2', 'DGS5', 'DGS10', 'DGS30'] }
      },
      {
        id: 'stablecoin-flows',
        type: 'economic-chart',
        title: 'Stablecoin Net Flows',
        size: 'medium',
        position: { x: 4, y: 0, w: 3, h: 3 },
        priority: 'high',
        dataSource: 'internal', // Your custom on-chain data
        refreshInterval: 300,
        makaveliWeight: 0.2,
        bruceWeight: 0.9,
        alerts: [
          {
            id: 'flight-to-safety',
            condition: 'net_flow < -100000000',
            threshold: -100000000,
            operator: 'lt',
            message: 'Large stablecoin outflow detected - possible flight to safety',
            severity: 'warning',
            actions: [{ type: 'trigger-bruce', query: 'Analyze stablecoin outflow risk' }]
          }
        ]
      },
      {
        id: 'energy-commodities',
        type: 'economic-chart',
        title: 'Energy Complex',
        size: 'medium',
        position: { x: 7, y: 0, w: 2, h: 3 },
        priority: 'high',
        dataSource: 'fred',
        refreshInterval: 1800,
        makaveliWeight: 0.5,
        bruceWeight: 0.9,
        filters: { series: ['DCOILWTICO', 'DHHNGSP', 'URANIUM'] }
      },
      {
        id: 'port-congestion',
        type: 'vessel-tracker',
        title: 'Global Port Congestion',
        size: 'large',
        position: { x: 0, y: 3, w: 4, h: 3 },
        priority: 'medium',
        dataSource: 'port-energy',
        refreshInterval: 3600,
        makaveliWeight: 0.4,
        bruceWeight: 0.8
      },
      {
        id: 'cross-asset-correlation',
        type: 'correlation-matrix',
        title: 'Asset Correlations',
        size: 'medium',
        position: { x: 4, y: 3, w: 3, h: 3 },
        priority: 'medium',
        dataSource: 'internal',
        refreshInterval: 3600,
        makaveliWeight: 0.3,
        bruceWeight: 0.85
      },
      {
        id: 'defi-yields',
        type: 'market-mosaic',
        title: 'DeFi Yield Opportunities',
        size: 'medium',
        position: { x: 7, y: 3, w: 2, h: 3 },
        priority: 'high',
        dataSource: 'internal',
        refreshInterval: 600,
        makaveliWeight: 0.1,
        bruceWeight: 0.95
      }
    ]
  },

  // War Room Global Overview
  globalOverview: {
    id: 'global-overview',
    name: 'Global Situation Deck',
    description: 'High-level global intelligence overview',
    layout: 'grid',
    autoRefresh: true,
    globalRefreshInterval: 600,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    widgets: [
      {
        id: 'global-conflicts',
        type: 'conflict-map',
        title: 'Active Conflicts',
        size: 'large',
        position: { x: 0, y: 0, w: 5, h: 4 },
        priority: 'critical',
        dataSource: 'acled',
        refreshInterval: 3600,
        makaveliWeight: 0.9,
        bruceWeight: 0.3
      },
      {
        id: 'alert-stream',
        type: 'alert-stream',
        title: 'Critical Alerts',
        size: 'medium',
        position: { x: 5, y: 0, w: 3, h: 4 },
        priority: 'critical',
        dataSource: 'all',
        refreshInterval: 60,
        makaveliWeight: 1.0,
        bruceWeight: 1.0
      },
      {
        id: 'cyber-threats',
        type: 'cyber-alerts',
        title: 'Active Cyber Threats',
        size: 'medium',
        position: { x: 8, y: 0, w: 2, h: 2 },
        priority: 'high',
        dataSource: 'cisa-kev',
        refreshInterval: 3600,
        makaveliWeight: 0.6,
        bruceWeight: 0.7
      },
      {
        id: 'global-flight-radar',
        type: 'flight-radar',
        title: 'Notable Flights',
        size: 'medium',
        position: { x: 8, y: 2, w: 2, h: 2 },
        priority: 'medium',
        dataSource: 'adsb-exchange',
        refreshInterval: 10,
        makaveliWeight: 0.5,
        bruceWeight: 0.3
      },
      {
        id: 'seismic-activity',
        type: 'event-timeline',
        title: 'Seismic Events',
        size: 'small',
        position: { x: 0, y: 4, w: 2, h: 2 },
        priority: 'low',
        dataSource: 'usgs-earthquakes',
        refreshInterval: 300,
        makaveliWeight: 0.4,
        bruceWeight: 0.4
      },
      {
        id: 'simulation-status',
        type: 'simulation-viewer',
        title: 'Active Simulations',
        size: 'medium',
        position: { x: 2, y: 4, w: 4, h: 2 },
        priority: 'high',
        dataSource: 'internal',
        refreshInterval: 60,
        makaveliWeight: 0.9,
        bruceWeight: 0.6
      },
      {
        id: 'polymarket-summary',
        type: 'market-mosaic',
        title: 'Geopolitical Markets',
        size: 'medium',
        position: { x: 6, y: 4, w: 4, h: 2 },
        priority: 'high',
        dataSource: 'polymarket-makaveli',
        refreshInterval: 60,
        makaveliWeight: 0.85,
        bruceWeight: 0.9
      }
    ]
  }
};

// ============================================================================
// WIDGET ENGINE
// ============================================================================

export class WidgetEngine {
  private widgets: Map<string, Widget> = new Map();
  private updateCallbacks: Map<string, ((widget: Widget) => void)[]> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  registerWidget(widget: Widget): void {
    this.widgets.set(widget.id, widget);
    this.updateCallbacks.set(widget.id, []);
    this.startRefresh(widget);
  }

  unregisterWidget(widgetId: string): void {
    this.stopRefresh(widgetId);
    this.widgets.delete(widgetId);
    this.updateCallbacks.delete(widgetId);
  }

  onUpdate(widgetId: string, callback: (widget: Widget) => void): () => void {
    const callbacks = this.updateCallbacks.get(widgetId) || [];
    callbacks.push(callback);
    this.updateCallbacks.set(widgetId, callbacks);
    
    return () => {
      const idx = callbacks.indexOf(callback);
      if (idx > -1) callbacks.splice(idx, 1);
    };
  }

  private startRefresh(widget: Widget): void {
    // Initial fetch
    this.fetchWidgetData(widget);
    
    // Set up interval
    const interval = setInterval(() => {
      this.fetchWidgetData(widget);
    }, widget.refreshInterval * 1000);
    
    this.intervals.set(widget.id, interval);
  }

  private stopRefresh(widgetId: string): void {
    const interval = this.intervals.get(widgetId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(widgetId);
    }
  }

  private async fetchWidgetData(widget: Widget): Promise<void> {
    try {
      // Fetch from data provider
      const data = await this.fetchFromProvider(widget.dataSource, widget.filters);
      
      // Check alerts
      const triggeredAlerts = this.checkAlerts(widget, data);
      
      // Update widget
      const updatedWidget: Widget = {
        ...widget,
        data: {
          timestamp: Date.now(),
          values: data,
          metadata: { alerts: triggeredAlerts }
        },
        lastUpdated: Date.now(),
        error: undefined
      };
      
      this.widgets.set(widget.id, updatedWidget);
      
      // Notify subscribers
      const callbacks = this.updateCallbacks.get(widget.id) || [];
      callbacks.forEach(cb => cb(updatedWidget));
      
      // Execute alert actions
      triggeredAlerts.forEach(alert => this.executeAlertActions(alert));
      
    } catch (error) {
      const updatedWidget: Widget = {
        ...widget,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastUpdated: Date.now()
      };
      this.widgets.set(widget.id, updatedWidget);
    }
  }

  private async fetchFromProvider(
    dataSource: string, 
    filters?: Record<string, unknown>
  ): Promise<Record<string, number | string | boolean>> {
    // This would integrate with actual data providers
    // For now, return mock data structure
    return {
      timestamp: Date.now(),
      status: 'active',
      ...filters
    };
  }

  private checkAlerts(widget: Widget, data: Record<string, unknown>): WidgetAlert[] {
    if (!widget.alerts) return [];
    
    return widget.alerts.filter(alert => {
      const value = data[alert.condition.split(' ')[0]];
      if (typeof value !== 'number') return false;
      
      switch (alert.operator) {
        case 'gt': return value > alert.threshold;
        case 'lt': return value < alert.threshold;
        case 'eq': return value === alert.threshold;
        case 'change': return Math.abs(value - alert.threshold) > 0;
        default: return false;
      }
    });
  }

  private executeAlertActions(alert: WidgetAlert): void {
    alert.actions.forEach(action => {
      switch (action.type) {
        case 'notify':
          console.log(`[ALERT] ${alert.message} -> ${action.channel}:${action.target}`);
          break;
        case 'highlight':
          console.log(`[HIGHLIGHT] Widget highlighted for ${action.duration}s`);
          break;
        case 'trigger-makaveli':
          console.log(`[MAKAVELI] Triggered query: ${action.query}`);
          break;
        case 'trigger-bruce':
          console.log(`[BRUCE] Triggered query: ${action.query}`);
          break;
        case 'update-polymarket':
          console.log(`[POLYMARKET] Update market: ${action.marketId}`);
          break;
      }
    });
  }

  getWidget(widgetId: string): Widget | undefined {
    return this.widgets.get(widgetId);
  }

  getAllWidgets(): Widget[] {
    return Array.from(this.widgets.values());
  }

  dispose(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.widgets.clear();
    this.updateCallbacks.clear();
  }
}

// ============================================================================
// DASHBOARD MANAGER
// ============================================================================

export class DashboardManager {
  private dashboards: Map<string, Dashboard> = new Map();
  private engine: WidgetEngine;

  constructor() {
    this.engine = new WidgetEngine();
    this.loadDefaultDashboards();
  }

  private loadDefaultDashboards(): void {
    Object.values(defaultDashboards).forEach(dashboard => {
      this.dashboards.set(dashboard.id, dashboard);
      dashboard.widgets.forEach(widget => this.engine.registerWidget(widget));
    });
  }

  createDashboard(config: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Dashboard {
    const dashboard: Dashboard = {
      ...config,
      id: `dashboard-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.dashboards.set(dashboard.id, dashboard);
    dashboard.widgets.forEach(widget => this.engine.registerWidget(widget));
    
    return dashboard;
  }

  getDashboard(id: string): Dashboard | undefined {
    return this.dashboards.get(id);
  }

  getDashboards(): Dashboard[] {
    return Array.from(this.dashboards.values());
  }

  addWidget(dashboardId: string, widget: Omit<Widget, 'id'>): Widget {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) throw new Error(`Dashboard ${dashboardId} not found`);
    
    const newWidget: Widget = {
      ...widget,
      id: `widget-${Date.now()}`
    };
    
    dashboard.widgets.push(newWidget);
    dashboard.updatedAt = Date.now();
    this.engine.registerWidget(newWidget);
    
    return newWidget;
  }

  removeWidget(dashboardId: string, widgetId: string): void {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return;
    
    dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);
    dashboard.updatedAt = Date.now();
    this.engine.unregisterWidget(widgetId);
  }

  subscribeToWidget(widgetId: string, callback: (widget: Widget) => void): () => void {
    return this.engine.onUpdate(widgetId, callback);
  }

  dispose(): void {
    this.engine.dispose();
    this.dashboards.clear();
  }
}

// ============================================================================
// REACT HOOKS (for UI integration)
// ============================================================================

/*
// Example usage in React component:

import { useEffect, useState } from 'react';
import { DashboardManager, Widget } from './war-room-dashboard';

const manager = new DashboardManager();

function useWidget(widgetId: string) {
  const [widget, setWidget] = useState<Widget | undefined>(
    manager.getDashboard('iran-command')?.widgets.find(w => w.id === widgetId)
  );

  useEffect(() => {
    return manager.subscribeToWidget(widgetId, setWidget);
  }, [widgetId]);

  return widget;
}

function IranCommandDashboard() {
  const conflictMap = useWidget('iran-conflict-map');
  const sentiment = useWidget('iran-telegram-sentiment');
  
  return (
    <div className="dashboard-grid">
      <ConflictMapWidget data={conflictMap?.data} />
      <SentimentGaugeWidget data={sentiment?.data} alerts={sentiment?.alerts} />
    </div>
  );
}
*/

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const warRoomDashboard = new DashboardManager();
