// ============================================================================
// WAR ROOM - Main Integration Module
// ============================================================================
// Combines SitDeck providers, Dashboard architecture, Polymarket alerts,
// and Globe data feeds into a unified War Room system
// ============================================================================

export * from './sitdeck-providers';
export * from './dashboard-architecture';
export * from './polymarket-alerts';
export * from './globe-data-feed';

import { warRoomDashboard, Dashboard, Widget, defaultDashboards } from './dashboard-architecture';
import { polymarketAlerts, PolymarketAlertSystem } from './polymarket-alerts';
import { allProviders, getProvidersForPersona } from './sitdeck-providers';

// ============================================================================
// WAR ROOM ORCHESTRATOR
// ============================================================================

export interface WarRoomConfig {
  bankroll: number;
  autoRefresh: boolean;
  refreshInterval: number;
  alertsEnabled: boolean;
  personas: ('makaveli' | 'bruce' | 'protocol')[];
}

export interface WarRoomStatus {
  activeDashboards: number;
  activeWidgets: number;
  dataProviders: number;
  lastRefresh: number;
  alertsTriggered: number;
  topOpportunities: number;
}

export class WarRoom {
  private dashboard = warRoomDashboard;
  private alerts: PolymarketAlertSystem;
  private config: WarRoomConfig;

  constructor(config: Partial<WarRoomConfig> = {}) {
    this.config = {
      bankroll: 10000,
      autoRefresh: true,
      refreshInterval: 60000,
      alertsEnabled: true,
      personas: ['makaveli', 'bruce'],
      ...config
    };

    this.alerts = polymarketAlerts;
    this.alerts.setBankroll(this.config.bankroll);
  }

  // Initialize the War Room
  async initialize(): Promise<void> {
    console.log('🎯 Initializing War Room...');
    
    // Load default dashboards
    console.log('📊 Loading dashboards:', Object.keys(defaultDashboards).join(', '));
    
    // Start Polymarket alerts
    if (this.config.alertsEnabled) {
      console.log('🔔 Starting Polymarket alert system...');
      this.alerts.start(this.config.refreshInterval);
    }

    // Log provider stats
    const all = Object.values(allProviders).flat();
    console.log(`📡 ${all.length} data providers loaded`);
    console.log(`   - Makaveli sources: ${getProvidersForPersona('makaveli').length}`);
    console.log(`   - Bruce sources: ${getProvidersForPersona('bruce').length}`);
    console.log(`   - Dark signals: 3 (Telegram, DNS, Polymarket)`);

    console.log('✅ War Room initialized');
  }

  // Get dashboard by ID
  getDashboard(id: string): Dashboard | undefined {
    return this.dashboard.getDashboard(id);
  }

  // Get all dashboards
  getDashboards(): Dashboard[] {
    return this.dashboard.getDashboards();
  }

  // Get specific dashboard shortcuts
  getIranCommand(): Dashboard | undefined {
    return this.getDashboard('iran-command');
  }

  getCapitalCommand(): Dashboard | undefined {
    return this.getDashboard('capital-command');
  }

  getGlobalOverview(): Dashboard | undefined {
    return this.getDashboard('global-overview');
  }

  // Subscribe to widget updates
  subscribeToWidget(widgetId: string, callback: (widget: Widget) => void): () => void {
    return this.dashboard.subscribeToWidget(widgetId, callback);
  }

  // Get status
  getStatus(): WarRoomStatus {
    const dashboards = this.dashboard.getDashboards();
    const widgets = dashboards.flatMap(d => d.widgets);

    return {
      activeDashboards: dashboards.length,
      activeWidgets: widgets.length,
      dataProviders: Object.values(allProviders).flat().length,
      lastRefresh: Date.now(),
      alertsTriggered: 0, // Would track from alert system
      topOpportunities: this.alerts.getTopOpportunities(10).length
    };
  }

  // Get top trading opportunities
  getOpportunities(limit: number = 10) {
    return this.alerts.getTopOpportunities(limit);
  }

  // Get category scores (for risk management)
  getCategoryScores() {
    return this.alerts.getCategoryScores();
  }

  // Record trade result (for category scoring)
  recordTrade(category: string, outcome: 'win' | 'loss', pnl: number): void {
    this.alerts.recordTrade(category, outcome, pnl);
  }

  // Update bankroll
  setBankroll(amount: number): void {
    this.config.bankroll = amount;
    this.alerts.setBankroll(amount);
  }

  // Shutdown
  dispose(): void {
    this.alerts.stop();
    this.dashboard.dispose();
    console.log('🛑 War Room shutdown complete');
  }
}

// ============================================================================
// QUICK START
// ============================================================================

/*
// Initialize War Room
const warRoom = new WarRoom({
  bankroll: 50000,
  alertsEnabled: true
});

await warRoom.initialize();

// Access dashboards
const iran = warRoom.getIranCommand();
const capital = warRoom.getCapitalCommand();

// Subscribe to widget updates
const unsubscribe = warRoom.subscribeToWidget('iran-telegram-sentiment', (widget) => {
  console.log('New sentiment data:', widget.data);
});

// Get trading opportunities
const opportunities = warRoom.getOpportunities(5);
opportunities.forEach(opp => {
  console.log(`${opp.market.question}: ${opp.edgePercent.toFixed(1)}% edge`);
  console.log(`  Recommended size: $${opp.recommendedSize.toFixed(0)}`);
});

// Record trade results
warRoom.recordTrade('Geopolitics', 'win', 150);
warRoom.recordTrade('Iran', 'loss', -200);

// Cleanup
unsubscribe();
warRoom.dispose();
*/

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export const warRoom = new WarRoom();
export default warRoom;
