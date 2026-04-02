// packages/kb-engine/src/types.ts
// Core type definitions for the KB Causation Engine

export type Domain = 
  | 'biotech' 
  | 'geopolitics' 
  | 'commodities' 
  | 'crypto' 
  | 'ai' 
  | 'robotics' 
  | 'human_optimization';

export type KBEntryType = 'pattern' | 'event' | 'prediction' | 'outcome';

export interface KBEntry {
  id: string;
  content: string;
  metadata: {
    type: KBEntryType;
    domain: Domain;
    asset: string;
    timestamp: number;
    outcome?: 'correct' | 'incorrect' | 'pending';
    edge?: number;
    tags?: string[];
  };
  embedding?: number[];
}

export interface ExternalEvent {
  type: string;
  description: string;
  timestamp: number;
  source?: string;
  significance?: number; // 0-1
}

export interface CausationQuery {
  asset: string;
  priceMove: {
    magnitude: number;
    timeframe: string;
  };
  domain: Domain;
  currentMarketPrice: number;
  externalEvents: ExternalEvent[];
}

export interface CausationAnalysis {
  primaryCatalyst: {
    event: string;
    confidence: number;
    evidence: string[];
  };
  contributingFactors: Array<{
    factor: string;
    weight: number;
  }>;
  historicalMatches: Array<{
    event: string;
    date: string;
    outcome: string;
    yourPrediction?: 'correct' | 'incorrect';
    edge?: number;
  }>;
  edgeEstimate: {
    magnitude: number;
    direction: 'up' | 'down' | 'neutral';
    confidence: number;
    reasoning: string;
  };
  recommendation: {
    action: 'predict' | 'monitor' | 'dismiss';
    rationale: string;
    urgency: 'immediate' | 'hours' | 'days';
  };
}

export interface ExtractedPattern {
  pattern: string;
  confidence: number;
  supportingEvidence: {
    predictions: number;
    correctPredictions: number;
    avgEdge: number;
  };
  conditions: string[];
  expectedOutcome: string;
  timeToOutcome: string;
}

export interface Alert {
  id: string;
  type: 'kb_causation' | 'misprice' | 'momentum' | 'pattern_match';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  edge: number;
  timestamp: number;
  metadata: {
    catalyst?: CausationAnalysis['primaryCatalyst'];
    historicalMatches?: CausationAnalysis['historicalMatches'];
    recommendation?: CausationAnalysis['recommendation'];
    asset: string;
    domain: Domain;
  };
}
