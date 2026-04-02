// packages/market-curator/src/market-filter.ts
// Filters prediction markets by Bruce/Makaveli relevance

export type MarketCategory = 
  | 'biotech' 
  | 'commodities' 
  | 'crypto' 
  | 'geopolitics' 
  | 'ai' 
  | 'robotics'
  | 'human_optimization'
  | 'sports'
  | 'politics'
  | 'entertainment'
  | 'other';

export interface Market {
  id: string;
  platform: 'polymarket' | 'kalshi' | 'other';
  title: string;
  description?: string;
  category?: string;
  endDate?: string;
  volume?: number;
  liquidity?: number;
  yesPrice?: number;
  noPrice?: number;
  url?: string;
}

// Keywords that indicate Bruce-relevant markets (biotech/pharma)
const BRUCE_KEYWORDS = [
  // FDA/Regulatory
  'FDA', 'PDUFA', 'approval', 'adcom', 'advisory committee',
  'clinical trial', 'phase 2', 'phase 3', 'phase 1',
  'BLA', 'NDA', 'sNDA', 'biologics',
  'fast track', 'breakthrough therapy', 'orphan drug',
  'CRL', 'complete response letter',
  
  // Diseases/Therapeutics
  'oncology', 'cancer', 'tumor', 'carcinoma',
  'Alzheimer', 'dementia', 'neurodegenerative',
  'diabetes', 'obesity', 'GLP-1', 'wegovy', 'ozempic',
  'rare disease', 'gene therapy', 'CAR-T',
  'biosimilar', 'generic drug',
  
  // Companies (add more as needed)
  'vertex', 'biogen', 'amgen', 'gilead', 'regeneron',
  'moderna', 'biontech', 'novo nordisk', 'eli lilly'
];

// Keywords that indicate Makaveli-relevant markets (geopolitics/conflict)
const MAKAveli_KEYWORDS = [
  // Conflict
  'war', 'conflict', 'invasion', 'ceasefire', 'peace',
  'Ukraine', 'Russia', 'Gaza', 'Israel', 'Palestine',
  'Taiwan', 'China', 'Iran', 'North Korea',
  'Hamas', 'Hezbollah', 'Houthi',
  'NATO', 'sanctions', 'embargo',
  
  // Elections/Leadership
  'election', 'coup', 'regime change', 'assassination',
  'impeachment', 'resignation', 'snap election',
  
  // Energy/Resources
  'oil', 'crude', 'brent', 'WTI', 'OPEC',
  'natural gas', 'LNG', 'pipeline',
  'Strait of Hormuz', 'Suez Canal',
  'nuclear', 'enrichment', 'uranium',
  
  // Economic/Political
  'trade war', 'tariff', 'trade deal',
  'sovereign debt', 'default', 'IMF bailout',
  'currency crisis', 'capital controls'
];

// Keywords for other domains
const COMMODITY_KEYWORDS = [
  'crude oil', 'WTI', 'Brent', 'gasoline', 'heating oil',
  'natural gas', 'Henry Hub', 'LNG',
  'gold', 'silver', 'copper', 'aluminum',
  'wheat', 'corn', 'soybeans', 'cotton',
  'EIA', 'inventory', 'storage', 'SPR',
  'OPEC', 'OPEC+', 'production cut'
];

const CRYPTO_KEYWORDS = [
  'bitcoin', 'ethereum', 'BTC', 'ETH',
  'ETF', 'spot ETF', 'GBTC',
  'halving', 'mining', 'hash rate',
  'SEC', 'regulation', 'approval',
  'CBDC', 'stablecoin', 'Tether',
  'DeFi', 'uniswap', 'aave',
  'Layer 2', 'optimism', 'arbitrum'
];

const AI_KEYWORDS = [
  'GPT', 'Claude', 'Gemini', 'LLM',
  'LMSYS', 'chatbot arena', 'ELO',
  'AGI', 'ASI', 'benchmark',
  'OpenAI', 'Anthropic', 'Google',
  'model release', 'capability', 'frontier'
];

// Noise keywords - markets to EXCLUDE
const NOISE_KEYWORDS = [
  // Sports
  'super bowl', 'world cup', 'NBA', 'NFL', 'MLB', 'NHL',
  'championship', 'playoff', 'finals', 'tournament',
  'mvp', 'rookie', 'draft', 'trade',
  
  // Entertainment
  'oscar', 'emmy', 'grammy', 'academy award',
  'album', 'song', 'movie', 'box office',
  'celebrity', 'kardashian', 'taylor swift',
  'reality show', 'bachelor', 'survivor',
  
  // Pop culture/politics theater
  'trump tweet', 'elon musk', 'twitter', 'x.com',
  'meme', 'viral', 'trending',
  'pardon', 'indictment', 'trial' // unless major geopolitical
];

export interface MarketClassification {
  market: Market;
  category: MarketCategory;
  personas: ('bruce' | 'makaveli')[];
  relevanceScore: number; // 0-1
  matchedKeywords: string[];
  reason: string;
}

export class MarketCurator {
  // Classify a single market
  classify(market: Market): MarketClassification {
    const text = `${market.title} ${market.description || ''} ${market.category || ''}`.toLowerCase();
    
    // Check for noise first
    const noiseMatches = this.findMatches(text, NOISE_KEYWORDS);
    if (noiseMatches.length > 0 && !this.hasStrongSignal(text)) {
      return {
        market,
        category: 'other',
        personas: [],
        relevanceScore: 0,
        matchedKeywords: noiseMatches,
        reason: 'Noise/market not relevant to edge-seeking domains'
      };
    }
    
    // Check each domain
    const bruceMatches = this.findMatches(text, BRUCE_KEYWORDS);
    const makaveliMatches = this.findMatches(text, MAKAveli_KEYWORDS);
    const commodityMatches = this.findMatches(text, COMMODITY_KEYWORDS);
    const cryptoMatches = this.findMatches(text, CRYPTO_KEYWORDS);
    const aiMatches = this.findMatches(text, AI_KEYWORDS);
    
    const personas: ('bruce' | 'makaveli')[] = [];
    if (bruceMatches.length > 0) personas.push('bruce');
    if (makaveliMatches.length > 0) personas.push('makaveli');
    
    // Determine primary category
    const category = this.determineCategory({
      bruce: bruceMatches.length,
      makaveli: makaveliMatches.length,
      commodities: commodityMatches.length,
      crypto: cryptoMatches.length,
      ai: aiMatches.length
    });
    
    // Calculate relevance score
    const allMatches = [...bruceMatches, ...makaveliMatches, ...commodityMatches, ...cryptoMatches, ...aiMatches];
    const relevanceScore = Math.min(allMatches.length / 3, 1); // Cap at 3+ keywords = 1.0
    
    return {
      market,
      category,
      personas,
      relevanceScore,
      matchedKeywords: allMatches,
      reason: this.generateReason(category, personas, allMatches)
    };
  }
  
  // Filter a list of markets
  filter(markets: Market[], options?: {
    minRelevance?: number;
    categories?: MarketCategory[];
    personas?: ('bruce' | 'makaveli')[];
    excludeNoise?: boolean;
  }): MarketClassification[] {
    const classified = markets.map(m => this.classify(m));
    
    return classified.filter(c => {
      if (options?.minRelevance && c.relevanceScore < options.minRelevance) return false;
      if (options?.categories && !options.categories.includes(c.category)) return false;
      if (options?.personas && !options.personas.some(p => c.personas.includes(p))) return false;
      if (options?.excludeNoise !== false && c.category === 'other') return false;
      return true;
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
  
  // Get top markets for a persona
  getForPersona(markets: Market[], persona: 'bruce' | 'makaveli', limit = 10): MarketClassification[] {
    return this.filter(markets, { personas: [persona], excludeNoise: true }).slice(0, limit);
  }
  
  private findMatches(text: string, keywords: string[]): string[] {
    return keywords.filter(kw => text.includes(kw.toLowerCase()));
  }
  
  private hasStrongSignal(text: string): boolean {
    // Even if noise keywords present, check for strong signal
    const strongSignals = ['FDA', 'PDUFA', 'approval', 'war', 'invasion', 'OPEC', 'EIA'];
    return strongSignals.some(s => text.includes(s.toLowerCase()));
  }
  
  private determineCategory(scores: Record<string, number>): MarketCategory {
    const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const [top, count] = entries[0];
    
    if (count === 0) return 'other';
    
    const categoryMap: Record<string, MarketCategory> = {
      bruce: 'biotech',
      makaveli: 'geopolitics',
      commodities: 'commodities',
      crypto: 'crypto',
      ai: 'ai'
    };
    
    return categoryMap[top] || 'other';
  }
  
  private generateReason(category: MarketCategory, personas: string[], keywords: string[]): string {
    if (category === 'other') return 'Not relevant to target domains';
    
    const personaStr = personas.length > 0 ? ` (${personas.join('/')})` : '';
    return `${category}${personaStr}: matched ${keywords.slice(0, 3).join(', ')}${keywords.length > 3 ? '...' : ''}`;
  }
}

// Pre-built filters for common queries
export const FILTERS = {
  bruceOnly: (markets: Market[]) => new MarketCurator().filter(markets, { personas: ['bruce'], excludeNoise: true }),
  makaveliOnly: (markets: Market[]) => new MarketCurator().filter(markets, { personas: ['makaveli'], excludeNoise: true }),
  highConfidence: (markets: Market[]) => new MarketCurator().filter(markets, { minRelevance: 0.7, excludeNoise: true }),
  excludeSports: (markets: Market[]) => new MarketCurator().filter(markets, { excludeNoise: true })
};
