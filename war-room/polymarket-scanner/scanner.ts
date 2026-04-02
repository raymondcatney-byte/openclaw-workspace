import { ClobClient } from '@polymarket/clob-client';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface Market {
  id: string;
  question: string;
  slug: string;
  resolutionSource: string;
  endDate: string;
  category: string;
  yesTokenId: string;
  noTokenId: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity: number;
  createdAt: string;
  updatedAt: string;
}

export interface Trade {
  id: string;
  marketId: string;
  trader: string;
  side: 'YES' | 'NO';
  size: number;
  price: number;
  timestamp: string;
  transactionHash: string;
}

export interface ArbitrageOpportunity {
  marketId: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  sum: number;
  edge: number;
  potentialProfit: number;
  liquidity: number;
  timestamp: string;
}

export interface Whale {
  address: string;
  totalVolume: number;
  winRate: number;
  profitLoss: number;
  marketsTraded: number;
  avgTradeSize: number;
  lastTrade: string;
  categoryExpertise: Record<string, number>;
}

export interface Inefficiency {
  marketId: string;
  question: string;
  type: 'MISPRICED' | 'LOW_LIQUIDITY' | 'STALE_ODDS' | 'INFORMATION_LAG';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
  expectedValue: number;
  confidence: number;
  indicators: string[];
}

export class PolymarketScanner {
  private clobClient: ClobClient;
  private supabase: SupabaseClient;
  private readonly MIN_ARB_EDGE = 0.005; // 0.5% minimum edge
  private readonly WHALE_THRESHOLD = 100000; // $100k+ volume

  constructor(
    clobApiKey: string,
    clobSecret: string,
    supabaseUrl: string,
    supabaseKey: string
  ) {
    this.clobClient = new ClobClient(
      'https://clob.polymarket.com',
      137, // Polygon
      clobApiKey,
      clobSecret
    );
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Fetch all active markets with pricing data
   */
  async fetchMarkets(): Promise<Market[]> {
    try {
      const markets = await this.clobClient.getMarkets();
      return markets.map((m: any) => ({
        id: m.condition_id,
        question: m.question,
        slug: m.market_slug,
        resolutionSource: m.resolution_source,
        endDate: m.end_date,
        category: m.category,
        yesTokenId: m.tokens.find((t: any) => t.outcome === 'Yes')?.token_id,
        noTokenId: m.tokens.find((t: any) => t.outcome === 'No')?.token_id,
        yesPrice: parseFloat(m.tokens.find((t: any) => t.outcome === 'Yes')?.price || 0),
        noPrice: parseFloat(m.tokens.find((t: any) => t.outcome === 'No')?.price || 0),
        volume: parseFloat(m.volume || 0),
        liquidity: parseFloat(m.liquidity || 0),
        createdAt: m.created_at,
        updatedAt: m.updated_at,
      }));
    } catch (error) {
      console.error('Failed to fetch markets:', error);
      throw error;
    }
  }

  /**
   * Detect arbitrage opportunities where YES + NO < 1.00
   */
  async detectArbitrage(markets?: Market[]): Promise<ArbitrageOpportunity[]> {
    const targetMarkets = markets || await this.fetchMarkets();
    const opportunities: ArbitrageOpportunity[] = [];

    for (const market of targetMarkets) {
      const sum = market.yesPrice + market.noPrice;
      const edge = 1.0 - sum;

      if (edge > this.MIN_ARB_EDGE && market.liquidity > 10000) {
        opportunities.push({
          marketId: market.id,
          question: market.question,
          yesPrice: market.yesPrice,
          noPrice: market.noPrice,
          sum,
          edge,
          potentialProfit: edge * 100, // Per $100 invested
          liquidity: market.liquidity,
          timestamp: new Date().toISOString(),
        });
      }
    }

    return opportunities.sort((a, b) => b.edge - a.edge);
  }

  /**
   * Fetch recent trades for whale analysis
   */
  async fetchRecentTrades(hours: number = 24): Promise<Trade[]> {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    const { data, error } = await this.supabase
      .from('trades')
      .select('*')
      .gte('timestamp', since)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Identify whale wallets and their performance metrics
   */
  async identifyWhales(trades?: Trade[]): Promise<Whale[]> {
    const targetTrades = trades || await this.fetchRecentTrades(168); // 7 days
    const traderMap = new Map<string, {
      trades: Trade[];
      totalVolume: number;
      markets: Set<string>;
    }>();

    // Aggregate trades by trader
    for (const trade of targetTrades) {
      if (!traderMap.has(trade.trader)) {
        traderMap.set(trade.trader, {
          trades: [],
          totalVolume: 0,
          markets: new Set(),
        });
      }
      const data = traderMap.get(trade.trader)!;
      data.trades.push(trade);
      data.totalVolume += trade.size * trade.price;
      data.markets.add(trade.marketId);
    }

    const whales: Whale[] = [];

    for (const [address, data] of traderMap) {
      if (data.totalVolume < this.WHALE_THRESHOLD) continue;

      // Calculate win rate (simplified - needs resolution data)
      const winRate = await this.calculateWinRate(address, data.trades);
      const pnl = await this.calculatePnL(address, data.trades);
      const categoryExpertise = await this.analyzeCategoryExpertise(address, data.trades);

      whales.push({
        address,
        totalVolume: data.totalVolume,
        winRate,
        profitLoss: pnl,
        marketsTraded: data.markets.size,
        avgTradeSize: data.totalVolume / data.trades.length,
        lastTrade: data.trades[0]?.timestamp,
        categoryExpertise,
      });
    }

    return whales.sort((a, b) => b.profitLoss - a.profitLoss);
  }

  /**
   * Detect market inefficiencies
   */
  async detectInefficiencies(markets?: Market[]): Promise<Inefficiency[]> {
    const targetMarkets = markets || await this.fetchMarkets();
    const inefficiencies: Inefficiency[] = [];

    for (const market of targetMarkets) {
      // Check for mispricing
      const mispricing = await this.checkMispricing(market);
      if (mispricing) inefficiencies.push(mispricing);

      // Check for stale odds
      const staleOdds = await this.checkStaleOdds(market);
      if (staleOdds) inefficiencies.push(staleOdds);

      // Check for information lag
      const infoLag = await this.checkInformationLag(market);
      if (infoLag) inefficiencies.push(infoLag);

      // Check for liquidity gaps
      const liquidityGap = await this.checkLiquidityGap(market);
      if (liquidityGap) inefficiencies.push(liquidityGap);
    }

    return inefficiencies.sort((a, b) => {
      const severityMap = { LOW: 1, MEDIUM: 2, HIGH: 3 };
      return severityMap[b.severity] - severityMap[a.severity];
    });
  }

  private async checkMispricing(market: Market): Promise<Inefficiency | null> {
    // Check if odds deviate significantly from base rate
    const historicalAccuracy = await this.getHistoricalAccuracy(market.category);
    const currentImpliedProbability = market.yesPrice;
    
    if (Math.abs(currentImpliedProbability - historicalAccuracy) > 0.15) {
      return {
        marketId: market.id,
        question: market.question,
        type: 'MISPRICED',
        severity: 'HIGH',
        description: `Odds (${(currentImpliedProbability * 100).toFixed(1)}%) deviate >15% from historical base rate (${(historicalAccuracy * 100).toFixed(1)}%)`,
        expectedValue: historicalAccuracy - currentImpliedProbability,
        confidence: 0.7,
        indicators: ['Historical deviation', 'Category mismatch'],
      };
    }
    return null;
  }

  private async checkStaleOdds(market: Market): Promise<Inefficiency | null> {
    const lastUpdate = new Date(market.updatedAt);
    const hoursSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate > 24 && market.volume > 50000) {
      return {
        marketId: market.id,
        question: market.question,
        type: 'STALE_ODDS',
        severity: 'MEDIUM',
        description: `No price update in ${hoursSinceUpdate.toFixed(1)} hours despite ${market.volume} volume`,
        expectedValue: 0.05,
        confidence: 0.5,
        indicators: ['Stale pricing', 'High volume dormancy'],
      };
    }
    return null;
  }

  private async checkInformationLag(market: Market): Promise<Inefficiency | null> {
    // Compare Polymarket odds to external prediction sources
    const externalOdds = await this.fetchExternalOdds(market);
    if (!externalOdds) return null;

    const diff = Math.abs(market.yesPrice - externalOdds);
    if (diff > 0.1) {
      return {
        marketId: market.id,
        question: market.question,
        type: 'INFORMATION_LAG',
        severity: diff > 0.2 ? 'HIGH' : 'MEDIUM',
        description: `Polymarket (${(market.yesPrice * 100).toFixed(1)}%) vs External (${(externalOdds * 100).toFixed(1)}%) - ${diff > 0.2 ? 'Significant' : 'Moderate'} lag`,
        expectedValue: diff,
        confidence: 0.8,
        indicators: ['External data divergence', 'Information asymmetry'],
      };
    }
    return null;
  }

  private async checkLiquidityGap(market: Market): Promise<Inefficiency | null> {
    if (market.liquidity < 5000 && market.volume > 100000) {
      return {
        marketId: market.id,
        question: market.question,
        type: 'LOW_LIQUIDITY',
        severity: 'MEDIUM',
        description: `High volume (${market.volume}) but low liquidity (${market.liquidity}) - potential slippage opportunity`,
        expectedValue: 0.03,
        confidence: 0.6,
        indicators: ['Volume/liquidity mismatch', 'Potential whale impact'],
      };
    }
    return null;
  }

  // Helper methods (would need implementation)
  private async calculateWinRate(address: string, trades: Trade[]): Promise<number> {
    // Requires resolved market data
    return 0.55; // Placeholder
  }

  private async calculatePnL(address: string, trades: Trade[]): Promise<number> {
    // Requires trade outcome data
    return 0; // Placeholder
  }

  private async analyzeCategoryExpertise(address: string, trades: Trade[]): Promise<Record<string, number>> {
    // Map trades to categories and calculate win rates
    return {}; // Placeholder
  }

  private async getHistoricalAccuracy(category: string): Promise<number> {
    // Return base rate for category
    const baseRates: Record<string, number> = {
      'Sports': 0.5,
      'Politics': 0.5,
      'Crypto': 0.5,
      'Weather': 0.5,
    };
    return baseRates[category] || 0.5;
  }

  private async fetchExternalOdds(market: Market): Promise<number | null> {
    // Fetch from betting aggregators, other prediction markets
    return null; // Placeholder
  }
}
