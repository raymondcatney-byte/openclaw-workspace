import { Market, MarketCategory, NewsItem, SentimentAnalysis } from '../types/index.js';

const POLYMARKET_API = process.env.POLYMARKET_API_URL || 'https://gamma-api.polymarket.com';

interface PolymarketEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  volume: number;
  liquidity: number;
  startDate: string;
  endDate: string;
  markets?: PolymarketMarket[];
}

interface PolymarketMarket {
  id: string;
  question: string;
  description: string;
  outcomePrices: string; // JSON string: {"yes": "0.65", "no": "0.35"}
  volume: number;
  liquidity: number;
  active: boolean;
  closed: boolean;
  resolved: boolean;
}

function mapCategory(category: string | undefined): MarketCategory {
  if (!category) return 'politics'; // default for undefined
  const cat = category.toLowerCase();
  if (cat.includes('politic')) return 'politics';
  if (cat.includes('crypto')) return 'crypto';
  if (cat.includes('sport')) return 'sports';
  if (cat.includes('baseball') || cat.includes('mlb')) return 'sports';
  if (cat.includes('science')) return 'science';
  if (cat.includes('culture') || cat.includes('pop')) return 'culture';
  if (cat.includes('finance') || cat.includes('econ')) return 'finance';
  return 'politics'; // default
}

function parseOutcomePrices(pricesJson: string): { yes: number; no: number } {
  try {
    const parsed = JSON.parse(pricesJson);
    return {
      yes: parseFloat(parsed.yes || parsed.Yes || '0.5'),
      no: parseFloat(parsed.no || parsed.No || '0.5'),
    };
  } catch {
    return { yes: 0.5, no: 0.5 };
  }
}

export async function getActiveMarkets(options: {
  minLiquidity?: number;
  maxMarkets?: number;
  categories?: string[];
} = {}): Promise<Market[]> {
  const { minLiquidity = 10000, maxMarkets = 20, categories = ['politics', 'crypto'] } = options;
  
  try {
    // Fetch events from Polymarket
    const response = await fetch(
      `${POLYMARKET_API}/events?active=true&closed=false&limit=100`,
      { headers: { 'Accept': 'application/json' } }
    );
    
    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }
    
    const events: PolymarketEvent[] = await response.json();
    
    // Flatten markets from events
    const markets: Market[] = [];
    
    for (const event of events) {
      if (!event.markets) continue;
      
      for (const market of event.markets) {
        if (!market.active || market.closed) continue;
        if (market.liquidity < minLiquidity) continue;
        
        const category = mapCategory(event.category);
        if (!categories.includes(category)) continue;
        
        markets.push({
          id: market.id,
          slug: `${event.slug}/${market.id}`,
          question: market.question,
          description: market.description,
          category,
          outcomePrices: parseOutcomePrices(market.outcomePrices),
          volume: market.volume,
          liquidity: market.liquidity,
          startDate: new Date(event.startDate),
          endDate: new Date(event.endDate),
          status: 'open',
        });
      }
    }
    
    // Sort by liquidity, take top N
    return markets
      .sort((a, b) => b.liquidity - a.liquidity)
      .slice(0, maxMarkets);
      
  } catch (error) {
    console.error('Error fetching Polymarket data:', error);
    // Return mock data for testing if API fails
    return getMockMarkets();
  }
}

function getMockMarkets(): Market[] {
  // Mock data for testing when API is unavailable
  return [
    {
      id: 'mock-1',
      slug: 'mock/will-jd-vance-win-2028',
      question: 'Will JD Vance win the 2028 US Presidential Election?',
      description: 'Resolves Yes if JD Vance wins the 2028 US Presidential Election',
      category: 'politics',
      outcomePrices: { yes: 0.50, no: 0.50 },
      volume: 1500000,
      liquidity: 500000,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2028-11-05'),
      status: 'open',
    },
    {
      id: 'mock-2',
      slug: 'mock/will-bitcoin-hit-100k-2024',
      question: 'Will Bitcoin hit $100K in 2024?',
      description: 'Resolves Yes if Bitcoin trades at or above $100,000 USD in 2024',
      category: 'crypto',
      outcomePrices: { yes: 0.35, no: 0.65 },
      volume: 2500000,
      liquidity: 800000,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      status: 'open',
    },
  ];
}

export async function getMarketById(marketId: string): Promise<Market | null> {
  try {
    const response = await fetch(`${POLYMARKET_API}/markets/${marketId}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    return {
      id: data.id,
      slug: data.slug,
      question: data.question,
      description: data.description,
      category: mapCategory(data.category),
      outcomePrices: parseOutcomePrices(data.outcomePrices),
      volume: data.volume,
      liquidity: data.liquidity,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: data.resolved ? 'resolved' : data.closed ? 'closed' : 'open',
      resolution: data.resolution,
      resolutionDate: data.resolved ? new Date(data.resolutionDate) : undefined,
    };
  } catch {
    return null;
  }
}
