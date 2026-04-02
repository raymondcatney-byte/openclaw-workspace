export interface Market {
  condition_id: string;
  question: string;
  slug: string;
  sector: string;
  yes_price: number;
  no_price: number;
  volume: number;
  liquidity: number;
  created_at: string;
  end_date: string;
  last_updated: string;
}

export interface PriceHistory {
  id: number;
  condition_id: string;
  yes_price: number;
  volume: number;
  timestamp: string;
}

export interface Alert {
  id: number;
  condition_id: string;
  sector: string;
  alert_type: 'VOLUME_SPIKE' | 'PRICE_MOVE_UP' | 'PRICE_MOVE_DOWN';
  severity: number;
  description: string;
  timestamp: string;
  market?: Market;
}

export interface Anomaly {
  market: Market;
  signals: {
    type: string;
    zScore?: number;
    change?: number;
    score: number;
  }[];
  totalScore: number;
}

export const SECTORS = {
  GEOPOLITICS: ['war', 'israel', 'iran', 'ukraine', 'russia', 'china', 'taiwan', 'election', 'nato', 'sanction', 'invasion', 'ceasefire', 'treaty', 'diplomatic', 'embassy', 'terror', 'attack', 'military', 'defense', 'border'],
  AI: ['agi', 'ai ', 'gpt', 'llm', 'openai', 'anthropic', 'deepmind', 'model', 'alignment', 'safety', 'regulation', 'artificial intelligence', 'machine learning', 'neural', 'compute'],
  DEFI: ['hack', 'exploit', 'defi', 'protocol', 'smart contract', 'dex', 'lending', 'stablecoin', 'sec', 'coinbase', 'binance', 'liquidation', 'bridge', 'token'],
  COMMODITIES: ['gold', 'silver', 'copper', 'wheat', 'corn', 'soy', 'supply chain', 'shortage', 'inventory', 'agriculture', 'grain', 'metal', 'lme', 'comex'],
  ENERGY: ['oil', 'gas', 'opec', 'pipeline', 'refinery', 'nuclear', 'electricity', 'power grid', 'lng', 'crude', 'brent', 'wti', 'saudi', 'iran oil', 'gazprom'],
  BIOTECH: ['fda', 'trial', 'drug', 'vaccine', 'pandemic', 'approval', 'pdufa', 'clinical', 'biotech', 'pharma', 'moderna', 'pfizer', 'gene', 'therapy'],
  MACRO: ['fed', 'cpi', 'inflation', 'unemployment', 'recession', 'interest rate', 'gdp', 'treasury', 'yield', 'dollar', 'fomc', 'powell', 'debt ceiling']
} as const;

export type Sector = keyof typeof SECTORS;
