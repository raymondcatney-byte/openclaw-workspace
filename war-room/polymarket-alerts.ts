// ============================================================================
// POLYMARKET ALERT SYSTEM - Arbitrage & Edge Detection
// ============================================================================
// Monitors Polymarket markets for mispricings vs Makaveli/Bruce predictions
// Implements category scoring + Kelly sizing from Kalshi bot lessons
// ============================================================================

// ============================================================================
// TYPES
// ============================================================================

export interface PolymarketMarket {
  id: string;
  slug: string;
  question: string;
  description: string;
  category: string;
  endDate: string;
  liquidity: number;
  volume: number;
  outcomes: {
    id: string;
    name: string;
    price: number; // 0-1
    probability: number;
  }[];
  bestBid: number;
  bestAsk: number;
  spread: number;
  lastUpdated: number;
}

export interface ModelPrediction {
  marketId: string;
  model: 'makaveli' | 'bruce' | 'ensemble';
  probability: number;
  confidence: number;
  timestamp: number;
  reasoning: string;
}

export interface MarketEdge {
  market: PolymarketMarket;
  prediction: ModelPrediction;
  edge: number; // Model prob - Market price (positive = model thinks market underpriced)
  edgePercent: number;
  direction: 'YES' | 'NO';
  expectedValue: number;
  kellyFraction: number;
  recommendedSize: number; // USD
  urgency: 'immediate' | 'high' | 'medium' | 'low';
}

export interface AlertRule {
  id: string;
  name: string;
  condition: 'edge_threshold' | 'volume_spike' | 'liquidity_drop' | 'model_confidence' | 'time_decay';
  threshold: number;
  categoryWhitelist?: string[];
  categoryBlacklist?: string[];
  minLiquidity: number;
  maxSpread: number;
  actions: AlertAction[];
  enabled: boolean;
}

export type AlertAction =
  | { type: 'notify'; channels: ('push' | 'email' | 'sms' | 'webhook')[]; message: string }
  | { type: 'auto_trade'; maxSize: number; requireConfirmation: boolean }
  | { type: 'update_dashboard'; widgetId: string }
  | { type: 'trigger_analysis'; persona: 'makaveli' | 'bruce'; query: string }
  | { type: 'log_to_sheet'; sheetId: string };

export interface CategoryScore {
  category: string;
  score: number; // 0-100
  winRate: number;
  roi: number;
  sampleSize: number;
  trend: 'up' | 'down' | 'flat';
  maxPositionSize: number; // % of portfolio
  status: 'strong' | 'good' | 'weak' | 'poor' | 'blocked';
}

// ============================================================================
// CATEGORY SCORING SYSTEM (From Kalshi Bot Lessons)
// ============================================================================

export class CategoryScorer {
  private scores: Map<string, CategoryScore> = new Map();
  private tradeHistory: Map<string, { outcome: 'win' | 'loss'; pnl: number; timestamp: number }[]> = new Map();

  // Pre-seeded with lessons from Kalshi bot
  private defaultScores: Record<string, CategoryScore> = {
    'Geopolitics': {
      category: 'Geopolitics',
      score: 72,
      winRate: 0.68,
      roi: 0.15,
      sampleSize: 45,
      trend: 'up',
      maxPositionSize: 0.15, // 15% of portfolio
      status: 'good'
    },
    'Iran': {
      category: 'Iran',
      score: 75,
      winRate: 0.71,
      roi: 0.18,
      sampleSize: 28,
      trend: 'up',
      maxPositionSize: 0.15,
      status: 'good'
    },
    'Middle East': {
      category: 'Middle East',
      score: 70,
      winRate: 0.66,
      roi: 0.12,
      sampleSize: 38,
      trend: 'flat',
      maxPositionSize: 0.12,
      status: 'good'
    },
    'Crypto': {
      category: 'Crypto',
      score: 55,
      winRate: 0.52,
      roi: 0.03,
      sampleSize: 120,
      trend: 'flat',
      maxPositionSize: 0.08,
      status: 'weak'
    },
    'Sports': {
      category: 'Sports',
      score: 45,
      winRate: 0.48,
      roi: -0.05,
      sampleSize: 200,
      trend: 'down',
      maxPositionSize: 0.05,
      status: 'weak'
    },
    'Entertainment': {
      category: 'Entertainment',
      score: 25,
      winRate: 0.42,
      roi: -0.15,
      sampleSize: 85,
      trend: 'down',
      maxPositionSize: 0,
      status: 'blocked'
    },
    'Economic Data': {
      category: 'Economic Data',
      score: 15,
      winRate: 0.38,
      roi: -0.22,
      sampleSize: 95,
      trend: 'down',
      maxPositionSize: 0,
      status: 'blocked'
    }
  };

  constructor() {
    // Initialize with default scores
    Object.values(this.defaultScores).forEach(score => {
      this.scores.set(score.category, score);
    });
  }

  getScore(category: string): CategoryScore {
    return this.scores.get(category) || this.calculateNewCategoryScore(category);
  }

  private calculateNewCategoryScore(category: string): CategoryScore {
    // New categories start neutral
    const newScore: CategoryScore = {
      category,
      score: 50,
      winRate: 0.5,
      roi: 0,
      sampleSize: 0,
      trend: 'flat',
      maxPositionSize: 0.05, // Conservative 5% until proven
      status: 'weak'
    };
    this.scores.set(category, newScore);
    return newScore;
  }

  recordTrade(category: string, outcome: 'win' | 'loss', pnl: number): void {
    const history = this.tradeHistory.get(category) || [];
    history.push({ outcome, pnl, timestamp: Date.now() });
    this.tradeHistory.set(category, history);
    
    // Recalculate score
    this.recalculateScore(category);
  }

  private recalculateScore(category: string): void {
    const history = this.tradeHistory.get(category) || [];
    if (history.length === 0) return;

    const wins = history.filter(t => t.outcome === 'win').length;
    const winRate = wins / history.length;
    const totalPnl = history.reduce((sum, t) => sum + t.pnl, 0);
    const roi = totalPnl / (history.length * 100); // Assuming $100 avg position

    // Scoring formula (from Kalshi bot)
    // Score = (ROI * 40%) + (Recent Trend * 25%) + (Sample Size * 20%) + (Win Rate * 15%)
    const roiScore = Math.max(0, Math.min(100, (roi + 0.5) * 100)); // Normalize -50% to +50% -> 0-100
    const winRateScore = winRate * 100;
    const sampleSizeScore = Math.min(100, history.length * 2); // Max at 50 trades
    
    // Recent trend (last 10 trades)
    const recent = history.slice(-10);
    const recentWins = recent.filter(t => t.outcome === 'win').length;
    const trendScore = (recentWins / Math.max(1, recent.length)) * 100;

    const score = 
      (roiScore * 0.40) + 
      (trendScore * 0.25) + 
      (sampleSizeScore * 0.20) + 
      (winRateScore * 0.15);

    // Determine status and position size
    let status: CategoryScore['status'];
    let maxPositionSize: number;

    if (score >= 80) { status = 'strong'; maxPositionSize = 0.20; }
    else if (score >= 60) { status = 'good'; maxPositionSize = 0.12; }
    else if (score >= 40) { status = 'weak'; maxPositionSize = 0.05; }
    else if (score >= 20) { status = 'poor'; maxPositionSize = 0.02; }
    else { status = 'blocked'; maxPositionSize = 0; }

    // Determine trend
    const olderWins = history.slice(-20, -10).filter(t => t.outcome === 'win').length;
    const trend: CategoryScore['trend'] = 
      recentWins > olderWins ? 'up' : 
      recentWins < olderWins ? 'down' : 'flat';

    const updatedScore: CategoryScore = {
      category,
      score: Math.round(score * 10) / 10,
      winRate: Math.round(winRate * 100) / 100,
      roi: Math.round(roi * 100) / 100,
      sampleSize: history.length,
      trend,
      maxPositionSize,
      status
    };

    this.scores.set(category, updatedScore);
  }

  getAllScores(): CategoryScore[] {
    return Array.from(this.scores.values()).sort((a, b) => b.score - a.score);
  }

  canTrade(category: string): boolean {
    const score = this.getScore(category);
    return score.status !== 'blocked';
  }

  getMaxPositionSize(category: string): number {
    return this.getScore(category).maxPositionSize;
  }
}

// ============================================================================
// KELLY CRITERION SIZING (Quarter-Kelly for Safety)
// ============================================================================

export interface KellyParameters {
  bankroll: number;
  winProbability: number;
  odds: number; // Decimal odds (e.g., 2.0 for even money)
  kellyFraction: number; // 0.25 for quarter-Kelly
  categoryMax: number; // Max position size from category scorer
}

export function calculateKellySize(params: KellyParameters): number {
  const { bankroll, winProbability, odds, kellyFraction, categoryMax } = params;

  // Kelly formula: f* = (bp - q) / b
  // where b = odds - 1, p = win probability, q = 1 - p
  const b = odds - 1;
  const p = winProbability;
  const q = 1 - p;

  const kellyPercentage = (b * p - q) / b;
  
  // Apply fractional Kelly for safety
  const adjustedPercentage = kellyPercentage * kellyFraction;

  // Calculate position size
  const positionSize = bankroll * adjustedPercentage;

  // Apply category limits
  const categoryLimit = bankroll * categoryMax;

  return Math.min(positionSize, categoryLimit);
}

// For binary markets (Polymarket style)
export function calculateBinaryKellySize(
  bankroll: number,
  modelProbability: number, // Your model's estimate
  marketPrice: number, // Current market price (0-1)
  categoryMax: number,
  kellyFraction: number = 0.25
): number {
  // Edge = model probability - market price
  const edge = modelProbability - marketPrice;
  
  if (edge <= 0) return 0; // No edge, no trade

  // Implied odds
  const odds = 1 / marketPrice;

  return calculateKellySize({
    bankroll,
    winProbability: modelProbability,
    odds,
    kellyFraction,
    categoryMax
  });
}

// ============================================================================
// EDGE DETECTION ENGINE
// ============================================================================

export class EdgeDetectionEngine {
  private categoryScorer: CategoryScorer;
  private predictions: Map<string, ModelPrediction> = new Map();
  private markets: Map<string, PolymarketMarket> = new Map();
  private alertRules: AlertRule[] = [];
  private bankroll: number = 10000; // Default $10k

  constructor() {
    this.categoryScorer = new CategoryScorer();
    this.loadDefaultAlertRules();
  }

  private loadDefaultAlertRules(): void {
    this.alertRules = [
      // Critical: Large edge in high-scoring category
      {
        id: 'critical-edge',
        name: 'Critical Arbitrage Opportunity',
        condition: 'edge_threshold',
        threshold: 10, // 10% edge
        minLiquidity: 10000,
        maxSpread: 0.05,
        actions: [
          { 
            type: 'notify', 
            channels: ['push', 'email'],
            message: 'CRITICAL: {market} showing {edge}% edge vs model'
          },
          { 
            type: 'trigger_analysis', 
            persona: 'makaveli',
            query: 'Re-evaluate {market} with fresh intelligence'
          },
          { type: 'update_dashboard', widgetId: 'alert-stream' }
        ],
        enabled: true
      },
      // High: Moderate edge in good category
      {
        id: 'high-edge',
        name: 'High Confidence Edge',
        condition: 'edge_threshold',
        threshold: 7,
        minLiquidity: 5000,
        maxSpread: 0.08,
        actions: [
          { 
            type: 'notify', 
            channels: ['push'],
            message: 'HIGH: {market} showing {edge}% edge'
          },
          { type: 'update_dashboard', widgetId: 'market-mosaic' }
        ],
        enabled: true
      },
      // Model confidence spike
      {
        id: 'confidence-spike',
        name: 'Model Confidence Spike',
        condition: 'model_confidence',
        threshold: 0.85,
        minLiquidity: 2000,
        maxSpread: 0.1,
        actions: [
          { 
            type: 'trigger_analysis',
            persona: 'bruce',
            query: 'Size position for high-confidence opportunity'
          }
        ],
        enabled: true
      },
      // Volume spike (market attention)
      {
        id: 'volume-spike',
        name: 'Volume Spike Detected',
        condition: 'volume_spike',
        threshold: 3, // 3x average
        minLiquidity: 1000,
        maxSpread: 0.1,
        actions: [
          { 
            type: 'notify',
            channels: ['webhook'],
            message: 'Volume spike in {market} - attention shifting'
          }
        ],
        enabled: true
      },
      // Liquidity drop (exit signal)
      {
        id: 'liquidity-drop',
        name: 'Liquidity Drop Alert',
        condition: 'liquidity_drop',
        threshold: 0.5, // 50% drop
        minLiquidity: 0,
        maxSpread: 1,
        actions: [
          { 
            type: 'notify',
            channels: ['push'],
            message: 'WARNING: Liquidity dropping in {market} - consider exit'
          }
        ],
        enabled: true
      }
    ];
  }

  setBankroll(amount: number): void {
    this.bankroll = amount;
  }

  updateMarket(market: PolymarketMarket): void {
    this.markets.set(market.id, market);
    this.checkForEdges(market);
  }

  updatePrediction(prediction: ModelPrediction): void {
    this.predictions.set(`${prediction.marketId}-${prediction.model}`, prediction);
    const market = this.markets.get(prediction.marketId);
    if (market) {
      this.checkForEdges(market);
    }
  }

  private checkForEdges(market: PolymarketMarket): void {
    const ensemblePred = this.getEnsemblePrediction(market.id);
    if (!ensemblePred) return;

    // Check category eligibility
    if (!this.categoryScorer.canTrade(market.category)) {
      console.log(`[BLOCKED] ${market.category} category blocked by scoring`);
      return;
    }

    // Calculate edge for each outcome
    market.outcomes.forEach(outcome => {
      const edge = ensemblePred.probability - outcome.price;
      const edgePercent = edge * 100;

      if (edge > 0.05) { // 5% minimum edge
        const kellySize = calculateBinaryKellySize(
          this.bankroll,
          ensemblePred.probability,
          outcome.price,
          this.categoryScorer.getMaxPositionSize(market.category)
        );

        const marketEdge: MarketEdge = {
          market,
          prediction: ensemblePred,
          edge,
          edgePercent,
          direction: outcome.name === 'Yes' ? 'YES' : 'NO',
          expectedValue: edge * kellySize,
          kellyFraction: kellySize / this.bankroll,
          recommendedSize: kellySize,
          urgency: this.calculateUrgency(edge, market)
        };

        this.evaluateAlertRules(marketEdge);
      }
    });
  }

  private getEnsemblePrediction(marketId: string): ModelPrediction | null {
    // Get all predictions for this market
    const preds = ['makaveli', 'bruce', 'ensemble']
      .map(model => this.predictions.get(`${marketId}-${model}`))
      .filter(Boolean) as ModelPrediction[];

    if (preds.length === 0) return null;

    // Weight by confidence
    const totalConfidence = preds.reduce((sum, p) => sum + p.confidence, 0);
    const weightedProb = preds.reduce((sum, p) => sum + (p.probability * p.confidence), 0) / totalConfidence;

    return {
      marketId,
      model: 'ensemble',
      probability: weightedProb,
      confidence: totalConfidence / preds.length,
      timestamp: Date.now(),
      reasoning: `Ensemble of ${preds.length} models`
    };
  }

  private calculateUrgency(edge: number, market: PolymarketMarket): MarketEdge['urgency'] {
    if (edge > 0.15) return 'immediate';
    if (edge > 0.10) return 'high';
    if (edge > 0.07) return 'medium';
    return 'low';
  }

  private evaluateAlertRules(edge: MarketEdge): void {
    this.alertRules
      .filter(rule => rule.enabled)
      .forEach(rule => {
        const triggered = this.checkRuleCondition(rule, edge);
        if (triggered) {
          this.executeRuleActions(rule, edge);
        }
      });
  }

  private checkRuleCondition(rule: AlertRule, edge: MarketEdge): boolean {
    // Check liquidity
    if (edge.market.liquidity < rule.minLiquidity) return false;

    // Check spread
    if (edge.market.spread > rule.maxSpread) return false;

    // Check category filters
    if (rule.categoryWhitelist && !rule.categoryWhitelist.includes(edge.market.category)) {
      return false;
    }
    if (rule.categoryBlacklist?.includes(edge.market.category)) {
      return false;
    }

    // Check condition
    switch (rule.condition) {
      case 'edge_threshold':
        return edge.edgePercent >= rule.threshold;
      case 'volume_spike':
        // Would need historical volume data
        return false;
      case 'liquidity_drop':
        // Would need historical liquidity data
        return false;
      case 'model_confidence':
        return edge.prediction.confidence >= rule.threshold;
      case 'time_decay':
        // Time until market close
        const daysToClose = (new Date(edge.market.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return daysToClose <= rule.threshold;
      default:
        return false;
    }
  }

  private executeRuleActions(rule: AlertRule, edge: MarketEdge): void {
    rule.actions.forEach(action => {
      switch (action.type) {
        case 'notify':
          const message = action.message
            .replace('{market}', edge.market.question)
            .replace('{edge}', edge.edgePercent.toFixed(1))
            .replace('{direction}', edge.direction);
          console.log(`[ALERT:${rule.name}] ${message}`);
          break;
        
        case 'trigger_analysis':
          console.log(`[ANALYSIS] Triggering ${action.persona}: ${action.query}`);
          break;
        
        case 'update_dashboard':
          console.log(`[DASHBOARD] Updating ${action.widgetId}`);
          break;
        
        case 'log_to_sheet':
          console.log(`[LOG] Recording to sheet ${action.sheetId}`);
          break;
      }
    });
  }

  getTopOpportunities(limit: number = 10): MarketEdge[] {
    // Calculate all current edges and return sorted
    const edges: MarketEdge[] = [];
    
    this.markets.forEach(market => {
      const pred = this.getEnsemblePrediction(market.id);
      if (!pred) return;

      market.outcomes.forEach(outcome => {
        const edge = pred.probability - outcome.price;
        if (edge > 0.03) {
          const kellySize = calculateBinaryKellySize(
            this.bankroll,
            pred.probability,
            outcome.price,
            this.categoryScorer.getMaxPositionSize(market.category)
          );

          edges.push({
            market,
            prediction: pred,
            edge,
            edgePercent: edge * 100,
            direction: outcome.name === 'Yes' ? 'YES' : 'NO',
            expectedValue: edge * kellySize,
            kellyFraction: kellySize / this.bankroll,
            recommendedSize: kellySize,
            urgency: this.calculateUrgency(edge, market)
          });
        }
      });
    });

    return edges
      .sort((a, b) => b.edge - a.edge)
      .slice(0, limit);
  }

  getCategoryScores(): CategoryScore[] {
    return this.categoryScorer.getAllScores();
  }

  recordTradeResult(category: string, outcome: 'win' | 'loss', pnl: number): void {
    this.categoryScorer.recordTrade(category, outcome, pnl);
  }
}

// ============================================================================
// POLYMARKET API INTEGRATION
// ============================================================================

export class PolymarketClient {
  private baseUrl = 'https://clob.polymarket.com';
  private apiKey?: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async getMarkets(filters?: {
    category?: string;
    active?: boolean;
    minLiquidity?: number;
  }): Promise<PolymarketMarket[]> {
    // This would integrate with actual Polymarket CLOB API
    // For now, returning structure for implementation
    
    const queryParams = new URLSearchParams();
    if (filters?.category) queryParams.set('category', filters.category);
    if (filters?.active !== undefined) queryParams.set('active', String(filters.active));
    
    const url = `${this.baseUrl}/markets?${queryParams}`;
    
    // const response = await fetch(url, {
    //   headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
    // });
    // return response.json();
    
    return []; // Placeholder
  }

  async getMarket(marketId: string): Promise<PolymarketMarket> {
    const url = `${this.baseUrl}/markets/${marketId}`;
    
    // const response = await fetch(url, {
    //   headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}
    // });
    // return response.json();
    
    throw new Error('Not implemented');
  }

  async getOrderBook(marketId: string): Promise<{ bids: [number, number][]; asks: [number, number][] }> {
    const url = `${this.baseUrl}/markets/${marketId}/orderbook`;
    
    // const response = await fetch(url);
    // return response.json();
    
    return { bids: [], asks: [] };
  }
}

// ============================================================================
// MAIN ALERT SYSTEM
// ============================================================================

export class PolymarketAlertSystem {
  private edgeEngine: EdgeDetectionEngine;
  private client: PolymarketClient;
  private isRunning: boolean = false;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor(apiKey?: string) {
    this.edgeEngine = new EdgeDetectionEngine();
    this.client = new PolymarketClient(apiKey);
  }

  start(pollIntervalMs: number = 60000): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('[PolymarketAlertSystem] Starting...');

    // Initial scan
    this.scanMarkets();

    // Set up polling
    this.pollInterval = setInterval(() => {
      this.scanMarkets();
    }, pollIntervalMs);
  }

  stop(): void {
    this.isRunning = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    console.log('[PolymarketAlertSystem] Stopped');
  }

  private async scanMarkets(): Promise<void> {
    try {
      // Fetch active markets
      const markets = await this.client.getMarkets({
        active: true,
        minLiquidity: 1000
      });

      // Update edge engine
      markets.forEach(market => {
        this.edgeEngine.updateMarket(market);
      });

      // Get Makaveli/Bruce predictions (would integrate with your AI system)
      await this.updatePredictions(markets);

    } catch (error) {
      console.error('[PolymarketAlertSystem] Scan error:', error);
    }
  }

  private async updatePredictions(markets: PolymarketMarket[]): Promise<void> {
    // This would trigger Makaveli/Bruce analysis
    // For markets without recent predictions
    
    for (const market of markets) {
      // Check if we need fresh predictions
      // Trigger Makaveli for geopolitical markets
      // Trigger Bruce for economic markets
    }
  }

  setBankroll(amount: number): void {
    this.edgeEngine.setBankroll(amount);
  }

  getTopOpportunities(limit?: number): ReturnType<EdgeDetectionEngine['getTopOpportunities']> {
    return this.edgeEngine.getTopOpportunities(limit);
  }

  getCategoryScores(): ReturnType<EdgeDetectionEngine['getCategoryScores']> {
    return this.edgeEngine.getCategoryScores();
  }

  recordTrade(category: string, outcome: 'win' | 'loss', pnl: number): void {
    this.edgeEngine.recordTradeResult(category, outcome, pnl);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const polymarketAlerts = new PolymarketAlertSystem();
