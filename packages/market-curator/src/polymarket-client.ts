// packages/market-curator/src/polymarket-client.ts
// Polymarket API client with filtering

import { Market, MarketClassification, MarketCurator } from './market-filter.js';

const POLYMARKET_API_BASE = 'https://gamma-api.polymarket.com';

interface PolymarketMarket {
  id: string;
  slug: string;
  question: string;
  description?: string;
  category?: string;
  endDate?: string;
  volume?: string;
  liquidity?: string;
  outcomes?: Array<{
    name: string;
    price?: string;
    probability?: string;
  }>;
}

export class PolymarketClient {
  private curator = new MarketCurator();
  
  // Fetch all active markets
  async fetchMarkets(options?: {
    limit?: number;
    offset?: number;
    active?: boolean;
    category?: string;
  }): Promise<Market[]> {
    const params = new URLSearchParams({
      limit: String(options?.limit || 100),
      offset: String(options?.offset || 0),
      active: String(options?.active !== false),
      ...options?.category ? { category: options.category } : {}
    });
    
    const response = await fetch(`${POLYMARKET_API_BASE}/markets?${params}`);
    
    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return (data.markets || []).map(this.transformMarket);
  }
  
  // Fetch markets with keyword filtering (server-side where possible)
  async searchMarkets(query: string, limit = 50): Promise<Market[]> {
    // Polymarket doesn't have a search endpoint, so we fetch and filter
    const markets = await this.fetchMarkets({ limit: 200 });
    const lowerQuery = query.toLowerCase();
    
    return markets.filter(m => 
      m.title.toLowerCase().includes(lowerQuery) ||
      m.description?.toLowerCase().includes(lowerQuery)
    ).slice(0, limit);
  }
  
  // Get curated markets for Bruce (biotech)
  async getBruceMarkets(limit = 20): Promise<MarketClassification[]> {
    // Fetch all markets
    const markets = await this.fetchMarkets({ limit: 500 });
    
    // Filter for biotech
    return this.curator.filter(markets, {
      personas: ['bruce'],
      excludeNoise: true
    }).slice(0, limit);
  }
  
  // Get curated markets for Makaveli (geopolitics)
  async getMakaveliMarkets(limit = 20): Promise<MarketClassification[]> {
    const markets = await this.fetchMarkets({ limit: 500 });
    
    return this.curator.filter(markets, {
      personas: ['makaveli'],
      excludeNoise: true
    }).slice(0, limit);
  }
  
  // Get all high-relevance markets across domains
  async getAllCurated(minRelevance = 0.5, limit = 50): Promise<MarketClassification[]> {
    const markets = await this.fetchMarkets({ limit: 1000 });
    
    return this.curator.filter(markets, {
      minRelevance,
      excludeNoise: true
    }).slice(0, limit);
  }
  
  // Get specific market by ID
  async getMarket(id: string): Promise<Market | null> {
    try {
      const response = await fetch(`${POLYMARKET_API_BASE}/markets/${id}`);
      if (!response.ok) return null;
      const data = await response.json();
      return this.transformMarket(data);
    } catch {
      return null;
    }
  }
  
  private transformMarket(pm: PolymarketMarket): Market {
    const yesOutcome = pm.outcomes?.find(o => o.name === 'Yes');
    const noOutcome = pm.outcomes?.find(o => o.name === 'No');
    
    return {
      id: pm.id,
      platform: 'polymarket',
      title: pm.question,
      description: pm.description,
      category: pm.category,
      endDate: pm.endDate,
      volume: pm.volume ? parseFloat(pm.volume) : undefined,
      liquidity: pm.liquidity ? parseFloat(pm.liquidity) : undefined,
      yesPrice: yesOutcome?.price ? parseFloat(yesOutcome.price) : undefined,
      noPrice: noOutcome?.price ? parseFloat(noOutcome.price) : undefined,
      url: `https://polymarket.com/market/${pm.slug}`
    };
  }
}

// Convenience functions
export async function getBruceOpportunities(): Promise<MarketClassification[]> {
  const client = new PolymarketClient();
  return client.getBruceMarkets();
}

export async function getMakaveliOpportunities(): Promise<MarketClassification[]> {
  const client = new PolymarketClient();
  return client.getMakaveliMarkets();
}

export async function getAllEdgeMarkets(): Promise<MarketClassification[]> {
  const client = new PolymarketClient();
  return client.getAllCurated(0.5, 100);
}
