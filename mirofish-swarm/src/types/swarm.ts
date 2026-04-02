// Swarm Types

export interface AgentPersona {
  name: string;
  style: string;
  timeframe: string;
  conviction: 'high' | 'medium' | 'low';
  specialty?: string;
}

export interface AgentPrediction {
  agentId: string;
  prediction: 'YES' | 'NO';
  confidence: number; // 0-100
  rationale: string;
  keyFactors: string[];
  contrarianFactor: string;
}

export interface PodConfig {
  id: number;
  name: string;
  specialty: string;
  agentCount: number;
  baseTypes: string[];
  agents: AgentPersona[];
}

export interface PodResult {
  podId: number;
  predictions: AgentPrediction[];
  agentCount: number;
  timestamp: string;
}

export interface MergedPrediction extends AgentPrediction {
  podId: number;
  podSpecialty: string;
  weight: number;
  weightedConfidence?: number;
  merged: boolean;
  mergeGroup: string | null;
  mergedCount?: number;
}

export interface ValidationResult {
  pod: PodResult;
  approved: boolean;
  score: number;
  checks: {
    structure: number;
    coherence: number;
    diversity: number;
    extremes: number;
  };
}

export interface ClusterInfo {
  highConfidence: { total: number; yes: number; no: number };
  mediumConfidence: number;
  lowConfidence: number;
  highConvictionDirection: 'YES' | 'NO';
  highConvictionStrength: number;
}

export interface ConsensusResult {
  direction: 'YES' | 'NO';
  consensusProbability: number; // 0-100
  confidence: number; // 0-100
  edge: number; // Percentage (e.g., 15 = 15% edge)
  positionSize: number; // Percentage of bankroll (e.g., 5 = 5%)
  signalStrength: number; // 0-100
  totalAgents: number;
  yesVotes: number;
  noVotes: number;
  consensusStdDev: number;
  topFactors: string[];
  contrarianView: string;
  clusters: ClusterInfo;
  recommendation: string;
}

export interface SwarmOutput {
  marketId: string;
  timestamp: string;
  duration: number; // milliseconds
  cost: number; // USD
  podCount: number;
  agentCount: number;
  predictions: MergedPrediction[];
  consensus: ConsensusResult;
  metadata: {
    criticApprovalRate: number;
    fallbackTriggered: boolean;
  };
}

export interface MarketContext {
  currentPrice: number;
  volume24h: number;
  newsHeadlines: string[];
  onChainMetrics?: Record<string, number>;
}
