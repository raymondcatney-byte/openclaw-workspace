// ============================================================================
// CORE TYPES — MiroFish Phase 1
// ============================================================================

export interface Market {
  id: string;
  slug: string;
  question: string;
  description: string;
  category: MarketCategory;
  outcomePrices: {
    yes: number;
    no: number;
  };
  volume: number;
  liquidity: number;
  startDate: Date;
  endDate: Date;
  status: 'open' | 'closed' | 'resolved';
  resolution?: 'yes' | 'no' | null;
  resolutionDate?: Date;
}

export type MarketCategory = 
  | 'politics'
  | 'crypto'
  | 'sports'
  | 'science'
  | 'culture'
  | 'finance';

// ============================================================================
// AGENT TYPES
// ============================================================================

export interface AgentPersona {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  systemPrompt: string;
  temperature: number;
  weight: number;
}

export type AgentType =
  | 'fundamental'
  | 'technical'
  | 'sentiment'
  | 'whale'
  | 'contrarian'
  | 'momentum'
  | 'fearful'
  | 'greedy';

export interface Agent {
  id: string;
  persona: AgentPersona;
  memory: AgentMemory[];
  stats: AgentStats;
}

export interface AgentMemory {
  marketId: string;
  prediction: number;
  confidence: number;
  reasoning: string;
  timestamp: Date;
}

export interface AgentStats {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  brierScore: number;
  averageConfidence: number;
  calibrationError: number;
}

export interface AgentOpinion {
  agentId: string;
  agentType: AgentType;
  prediction: number;
  confidence: number;
  reasoning: string;
  keyFactors: string[];
  timestamp: Date;
}

// ============================================================================
// CONSENSUS TYPES
// ============================================================================

export interface OpinionCluster {
  center: number;
  opinions: AgentOpinion[];
  weight: number;
  coherence: number;
}

export interface Consensus {
  marketId: string;
  probability: number;
  confidence: number;
  clusters: OpinionCluster[];
  majorityCluster: OpinionCluster;
  dissentingOpinions: AgentOpinion[];
  timestamp: Date;
  agentCount: number;
  simulationTimeMs: number;
}

// ============================================================================
// EXECUTION TYPES
// ============================================================================

export interface Position {
  id: string;
  marketId: string;
  direction: 'yes' | 'no';
  size: number;
  entryPrice: number;
  exitPrice?: number;
  entryDate: Date;
  exitDate?: Date;
  status: 'open' | 'closed';
  consensusProbability: number;
  marketPrice: number;
  edge: number;
  kellyFraction: number;
  realizedPnl?: number;
  unrealizedPnl?: number;
  roi?: number;
}

export interface PaperTrade {
  id: string;
  timestamp: Date;
  market: Market;
  consensus: Consensus;
  position: Position | null;
  reasoning: string;
}

// ============================================================================
// DATA TYPES
// ============================================================================

export interface MarketContext {
  market: Market;
  news: NewsItem[];
  sentiment: SentimentAnalysis;
  timestamp: Date;
}

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: Date;
  sentiment: number;
  relevance: number;
}

export interface SentimentAnalysis {
  overall: number;
  magnitude: number;
  sources: string[];
}

export interface OnChainData {
  whalePositions: WhaleTrade[];
  volume24h: number;
  largeTrades: number;
}

export interface WhaleTrade {
  address: string;
  direction: 'buy' | 'sell';
  amount: number;
  timestamp: Date;
}

// ============================================================================
// SCAN RESULT TYPES
// ============================================================================

export interface ScanResult {
  timestamp: Date;
  scanTimeMs: number;
  marketsAnalyzed: number;
  positionsRecommended: number;
  totalRecommendedSize: number;
  positions: Position[];
  skipped: number;
  errors: number;
  estimatedCost: number;
}

export interface MarketScanResult {
  market: Market;
  consensus?: Consensus;
  position: Position | null;
  reason: string;
  error?: string;
}
