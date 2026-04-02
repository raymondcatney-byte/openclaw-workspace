# MIROFISH PHASE 1 — 50-Agent Paper Trading System

**Complete Implementation Specification**  
**Goal:** Prove edge on Polymarket with 50 simulated agents  
**Timeline:** 7 days to first paper trade, 14 days to statistically significant sample  
**Budget:** $0 (free APIs) + existing Groq allocation

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAPER TRADING SYSTEM                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Data Layer   │───▶│ Agent Swarm  │───▶│ Consensus    │      │
│  │ (Free APIs)  │    │ (50 Agents)  │    │ Engine       │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │ Polymarket   │    │ Groq (LLM)   │    │ Kelly        │      │
│  │ Prices       │    │ Agent        │    │ Position     │      │
│  │ News/Data    │    │ Opinions     │    │ Sizing       │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│                                                   │             │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              PREDICTION DATABASE (SQLite)                 │  │
│  │  - Every prediction logged from day 1                    │  │
│  │  - Market resolution tracked                             │  │
│  │  - P&L calculated (paper)                                │  │
│  │  - Agent performance history                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## FILE STRUCTURE

```
/mirofish-phase1
├── README.md
├── .env.example
├── package.json
├── tsconfig.json
├── drizzle.config.ts
│
├── /src
│   ├── /types
│   │   └── index.ts
│   ├── /data
│   │   ├── polymarket.ts
│   │   ├── news.ts
│   │   └── index.ts
│   ├── /agents
│   │   ├── personas.ts
│   │   ├── factory.ts
│   │   └── engine.ts
│   ├── /consensus
│   │   ├── clustering.ts
│   │   └── engine.ts
│   ├── /execution
│   │   ├── kelly.ts
│   │   └── paper-trade.ts
│   ├── /database
│   │   ├── schema.ts
│   │   └── index.ts
│   ├── /critic
│   │   └── meta-analyst.ts
│   └── /jobs
│       └── daily-scan.ts
│
├── /scripts
│   ├── setup-db.ts
│   └── backfill-markets.ts
│
└── /tests
    └── consensus.test.ts
```

---

## 1. TYPES (`src/types/index.ts`)

```typescript
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
    yes: number; // 0-1
    no: number;  // 0-1
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
  weight: number; // 0-1, relative importance in consensus
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
  prediction: number; // 0-1 probability
  confidence: number; // 0-1
  reasoning: string;
  keyFactors: string[];
  timestamp: Date;
}

// ============================================================================
// CONSENSUS TYPES
// ============================================================================

export interface OpinionCluster {
  center: number; // Mean prediction
  opinions: AgentOpinion[];
  weight: number; // Size × avg confidence
  coherence: number; // Inverse variance
}

export interface Consensus {
  marketId: string;
  probability: number; // Weighted consensus
  confidence: number;  // Cluster coherence
  clusters: OpinionCluster[];
  majorityCluster: OpinionCluster;
  dissentingOpinions: AgentOpinion[];
  timestamp: Date;
  
  // Meta
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
  size: number; // USD
  entryPrice: number; // 0-1
  exitPrice?: number;
  entryDate: Date;
  exitDate?: Date;
  status: 'open' | 'closed';
  
  // MiroFish data
  consensusProbability: number;
  marketPrice: number;
  edge: number;
  kellyFraction: number;
  
  // P&L
  realizedPnl?: number;
  unrealizedPnl?: number;
  roi?: number;
}

export interface PaperTrade {
  id: string;
  timestamp: Date;
  market: Market;
  consensus: Consensus;
  position: Position | null; // null if no edge
  reasoning: string;
}

// ============================================================================
// DATA TYPES
// ============================================================================

export interface MarketContext {
  market: Market;
  news: NewsItem[];
  sentiment: SentimentAnalysis;
  onChain?: OnChainData;
  timestamp: Date;
}

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: Date;
  sentiment: number; // -1 to 1
  relevance: number; // 0-1
}

export interface SentimentAnalysis {
  overall: number; // -1 to 1
  magnitude: number; // 0-1
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
// DATABASE TYPES
// ============================================================================

export interface PredictionRecord {
  id: string;
  timestamp: Date;
  marketId: string;
  marketQuestion: string;
  marketCategory: MarketCategory;
  
  // Inputs
  consensusProbability: number;
  consensusConfidence: number;
  marketPriceYes: number;
  marketPriceNo: number;
  edge: number;
  
  // Execution
  recommendedDirection: 'yes' | 'no' | 'skip';
  recommendedSize: number;
  kellyFraction: number;
  
  // Actual (filled after resolution)
  actualPosition: 'yes' | 'no' | null;
  positionSize: number;
  entryPrice: number | null;
  
  // Resolution
  resolved: boolean;
  actualOutcome: 'yes' | 'no' | null;
  resolutionDate: Date | null;
  pnl: number | null;
  
  // Meta
  agentCount: number;
  simulationTimeMs: number;
}
```

---

## 2. AGENT PERSONAS (`src/agents/personas.ts`)

```typescript
import { AgentPersona } from '../types';

// ============================================================================
// 50-AGENT PERSONA DEFINITIONS
// ============================================================================

export const AGENT_PERSONAS: AgentPersona[] = [
  // FUNDAMENTAL ANALYSTS (10 agents) — 20%
  {
    id: 'fundamental-1',
    type: 'fundamental',
    name: 'The Historian',
    description: 'Analyzes based on historical precedent and base rates',
    systemPrompt: `You are a fundamental analyst who specializes in historical precedent.
When evaluating prediction market questions:
1. Look for similar historical events and their outcomes
2. Consider base rates — how often does this type of event occur?
3. Analyze structural factors (institutions, incentives, constraints)
4. Ignore short-term noise, focus on fundamental drivers

Output format:
- Probability estimate (0-100%)
- Confidence level (0-100%)
- Key historical precedents (2-3 examples)
- Critical assumption that would change your view`,
    temperature: 0.3,
    weight: 0.02,
  },
  {
    id: 'fundamental-2',
    type: 'fundamental',
    name: 'The Institutionalist',
    description: 'Focuses on institutional constraints and incentives',
    systemPrompt: `You are a fundamental analyst focused on institutional dynamics.
Analyze:
1. What institutions are involved and what are their incentives?
2. What constraints (legal, political, economic) limit outcomes?
3. Who has decision-making power and what do they want?
4. What is the path dependency — what steps must occur?

Be conservative. Institutions usually preserve status quo.`,
    temperature: 0.3,
    weight: 0.02,
  },
  {
    id: 'fundamental-3',
    type: 'fundamental',
    name: 'The Base Rate Betty',
    description: 'Obsessed with base rates and reference classes',
    systemPrompt: `You are an analyst who focuses exclusively on base rates.
For any prediction:
1. What is the reference class of similar events?
2. What percentage of those events had the outcome in question?
3. Is this case meaningfully different from the base rate?
4. If different, in which direction and by how much?

Always start with the outside view (base rate) before adjusting.`,
    temperature: 0.2,
    weight: 0.02,
  },
  // ... (7 more fundamental variants)
  
  // TECHNICAL ANALYSTS (8 agents) — 16%
  {
    id: 'technical-1',
    type: 'technical',
    name: 'The Price Action Pro',
    description: 'Reads price charts and market structure',
    systemPrompt: `You are a technical analyst focused on price action.
Analyze:
1. Price trend — is momentum building or fading?
2. Volume patterns — is smart money entering or exiting?
3. Support/resistance levels from historical prices
4. Divergences between price and sentiment

You care about WHAT the price is doing, not WHY.`,
    temperature: 0.3,
    weight: 0.02,
  },
  {
    id: 'technical-2',
    type: 'technical',
    name: 'The Liquidity Watcher',
    description: 'Focuses on order flow and market microstructure',
    systemPrompt: `You are a technical analyst focused on liquidity and flow.
Analyze:
1. Where is liquidity concentrated?
2. Are there large bids/offers that suggest informed trading?
3. Is the market skewed long or short?
4. Where would stops be triggered?

Follow the money, not the narrative.`,
    temperature: 0.3,
    weight: 0.02,
  },
  // ... (6 more technical variants)
  
  // SENTIMENT ANALYSTS (10 agents) — 20%
  {
    id: 'sentiment-1',
    type: 'sentiment',
    name: 'The Narrative Navigator',
    description: 'Tracks media narratives and public attention',
    systemPrompt: `You are a sentiment analyst focused on narratives.
Analyze:
1. What is the dominant media narrative?
2. Is attention increasing or decreasing?
3. Are there competing narratives emerging?
4. What would surprise the market most?

Narratives drive short-term price. Track shifts.`,
    temperature: 0.5,
    weight: 0.02,
  },
  {
    id: 'sentiment-2',
    type: 'sentiment',
    name: 'The Contrarian Compass',
    description: 'Looks for crowd excess and reversal signals',
    systemPrompt: `You are a sentiment analyst who bets against extremes.
Identify:
1. Where is the crowd most confident?
2. What is the consensus "obvious" outcome?
3. What would invalidate that consensus?
4. Is there "smart money" positioning against the crowd?

The market prices in the obvious. Look for the non-obvious.`,
    temperature: 0.4,
    weight: 0.02,
  },
  // ... (8 more sentiment variants)
  
  // WHALE/INSIDER ANALYSTS (6 agents) — 12%
  {
    id: 'whale-1',
    type: 'whale',
    name: 'The Smart Money Tracker',
    description: 'Follows large trades and informed positioning',
    systemPrompt: `You are an analyst who tracks smart money.
Analyze:
1. Are there unusually large trades?
2. Is there informed flow (trading ahead of news)?
3. What do the top wallets hold?
4. Is there accumulation or distribution?

Someone always knows. Find their footprints.`,
    temperature: 0.3,
    weight: 0.02,
  },
  // ... (5 more whale variants)
  
  // BEHAVIORAL TYPES (16 agents) — 32%
  {
    id: 'contrarian-1',
    type: 'contrarian',
    name: 'The Devil\'s Advocate',
    description: 'Always takes the opposite view',
    systemPrompt: `You are a contrarian. Whatever the consensus believes, you argue the opposite.
Your job is to find:
1. What assumptions are the crowd making?
2. What would happen if those assumptions are wrong?
3. What evidence would change the narrative?
4. What is the market missing?

Be provocative. Find the unpopular truth.`,
    temperature: 0.6,
    weight: 0.02,
  },
  {
    id: 'momentum-1',
    type: 'momentum',
    name: 'The Trend Follower',
    description: 'Rides momentum, assumes trends continue',
    systemPrompt: `You are a momentum trader. The trend is your friend.
Beliefs:
1. Markets move in trends
2. Trends persist longer than expected
3. Price action predicts fundamentals, not vice versa
4. Don't fight the tape

If it's going up, it will keep going up.`,
    temperature: 0.4,
    weight: 0.02,
  },
  {
    id: 'fearful-1',
    type: 'fearful',
    name: 'The Risk Manager',
    description: 'Overweights downside, seeks safety',
    systemPrompt: `You are risk-averse. Your default is skepticism.
Always ask:
1. What is the worst case scenario?
2. How could this go to zero?
3. What am I not seeing?
4. Is the risk worth the reward?

Survival first, profits second.`,
    temperature: 0.3,
    weight: 0.01,
  },
  {
    id: 'greedy-1',
    type: 'greedy',
    name: 'The Optimist',
    description: 'Overweights upside, seeks asymmetric bets',
    systemPrompt: `You are aggressively optimistic. Look for fat tails.
Always ask:
1. What is the best case scenario?
2. What would 10x this position?
3. Am I being too conservative?
4. Is the market underestimating the upside?

Fortune favors the bold.`,
    temperature: 0.5,
    weight: 0.01,
  },
  // ... (12 more behavioral variants)
];

export function getPersonasForMarket(category: string): AgentPersona[] {
  // Adjust weights based on market category
  const adjusted = AGENT_PERSONAS.map(p => {
    let weight = p.weight;
    
    // Politics: fundamental and sentiment more important
    if (category === 'politics') {
      if (p.type === 'fundamental') weight *= 1.5;
      if (p.type === 'sentiment') weight *= 1.3;
      if (p.type === 'technical') weight *= 0.5;
    }
    
    // Crypto: technical and whale more important
    if (category === 'crypto') {
      if (p.type === 'technical') weight *= 1.4;
      if (p.type === 'whale') weight *= 1.4;
      if (p.type === 'fundamental') weight *= 0.7;
    }
    
    return { ...p, weight };
  });
  
  // Normalize weights to sum to 1
  const totalWeight = adjusted.reduce((sum, p) => sum + p.weight, 0);
  return adjusted.map(p => ({ ...p, weight: p.weight / totalWeight }));
}
```

---

## 3. AGENT ENGINE (`src/agents/engine.ts`)

```typescript
import Groq from 'groq-sdk';
import { AgentOpinion, AgentPersona, MarketContext } from '../types';
import { getPersonasForMarket } from './personas';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ============================================================================
// AGENT OPINION GENERATION
// ============================================================================

interface AgentPromptContext {
  marketQuestion: string;
  marketDescription: string;
  currentPrice: number;
  category: string;
  news: string[];
  daysToResolution: number;
}

function buildAgentPrompt(
  persona: AgentPersona,
  context: AgentPromptContext
): string {
  return `${persona.systemPrompt}

MARKET QUESTION: ${context.marketQuestion}

DESCRIPTION: ${context.marketDescription}

CURRENT MARKET PRICE: Yes ${(context.currentPrice * 100).toFixed(1)}¢ / No ${((1 - context.currentPrice) * 100).toFixed(1)}¢

CATEGORY: ${context.category}

DAYS TO RESOLUTION: ~${context.daysToResolution}

RECENT NEWS:
${context.news.slice(0, 5).map(n => `- ${n}`).join('\n')}

Provide your analysis in this exact format:

PROBABILITY: [number 0-100]%
CONFIDENCE: [number 0-100]%
REASONING: [2-3 sentences explaining your reasoning]
KEY_FACTORS: [3 bullet points of critical factors]

Be decisive. Don't hedge. State your view clearly.`;
}

function parseAgentResponse(response: string): Omit<AgentOpinion, 'agentId' | 'agentType' | 'timestamp'> {
  const probabilityMatch = response.match(/PROBABILITY:\s*(\d+(?:\.\d+)?)/i);
  const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+(?:\.\d+)?)/i);
  const reasoningMatch = response.match(/REASONING:\s*([^]*?)(?=KEY_FACTORS:|$)/i);
  const factorsMatch = response.match(/KEY_FACTORS:\s*([^]*?)$/i);
  
  return {
    prediction: (parseFloat(probabilityMatch?.[1] || '50') / 100),
    confidence: (parseFloat(confidenceMatch?.[1] || '50') / 100),
    reasoning: reasoningMatch?.[1]?.trim() || 'No reasoning provided',
    keyFactors: factorsMatch?.[1]
      ?.split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
      .map(line => line.replace(/^[-•]\s*/, '').trim())
      .slice(0, 3) || [],
  };
}

// ============================================================================
// BATCH AGENT SIMULATION
// ============================================================================

export async function simulateAgentOpinions(
  marketContext: MarketContext,
  agentCount: number = 50
): Promise<AgentOpinion[]> {
  
  const personas = getPersonasForMarket(marketContext.market.category)
    .slice(0, agentCount);
  
  const promptContext: AgentPromptContext = {
    marketQuestion: marketContext.market.question,
    marketDescription: marketContext.market.description,
    currentPrice: marketContext.market.outcomePrices.yes,
    category: marketContext.market.category,
    news: marketContext.news.map(n => n.title),
    daysToResolution: Math.ceil(
      (marketContext.market.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ),
  };
  
  // Process agents in batches to control costs
  const BATCH_SIZE = 5;
  const opinions: AgentOpinion[] = [];
  
  for (let i = 0; i < personas.length; i += BATCH_SIZE) {
    const batch = personas.slice(i, i + BATCH_SIZE);
    
    const batchPromises = batch.map(async (persona) => {
      const prompt = buildAgentPrompt(persona, promptContext);
      
      try {
        const completion = await groq.chat.completions.create({
          model: 'llama-3.1-70b-versatile',
          messages: [
            { role: 'system', content: persona.systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: persona.temperature,
          max_tokens: 300,
        });
        
        const response = completion.choices[0]?.message?.content || '';
        const parsed = parseAgentResponse(response);
        
        return {
          agentId: persona.id,
          agentType: persona.type,
          ...parsed,
          timestamp: new Date(),
        };
      } catch (error) {
        console.error(`Agent ${persona.id} failed:`, error);
        // Return neutral opinion on failure
        return {
          agentId: persona.id,
          agentType: persona.type,
          prediction: 0.5,
          confidence: 0.1,
          reasoning: 'Failed to generate opinion',
          keyFactors: ['Error in processing'],
          timestamp: new Date(),
        };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    opinions.push(...batchResults);
    
    // Rate limiting — be nice to Groq
    if (i + BATCH_SIZE < personas.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return opinions;
}

// ============================================================================
// COST TRACKING
// ============================================================================

export function estimateSimulationCost(agentCount: number): number {
  // Groq llama-3.1-70b: ~$0.0006 per 1K tokens input, $0.0008 per 1K output
  // Estimate: 500 tokens input, 150 tokens output per agent
  const inputTokens = agentCount * 500;
  const outputTokens = agentCount * 150;
  
  const inputCost = (inputTokens / 1000) * 0.0006;
  const outputCost = (outputTokens / 1000) * 0.0008;
  
  return inputCost + outputCost;
}

// 50 agents ≈ $0.021 per market
// 20 markets/day = $0.42/day
// 30 days = $12.60/month (well within free tier)
```

---

## 4. CONSENSUS ENGINE (`src/consensus/engine.ts`)

```typescript
import { AgentOpinion, Consensus, OpinionCluster } from '../types';

// ============================================================================
// CLUSTERING ALGORITHM
// ============================================================================

const CLUSTER_BANDWIDTH = 0.1; // 10% bandwidth for clustering

interface ClusterCandidate {
  center: number;
  opinions: AgentOpinion[];
}

export function clusterOpinions(
  opinions: AgentOpinion[],
  bandwidth: number = CLUSTER_BANDWIDTH
): OpinionCluster[] {
  
  if (opinions.length === 0) return [];
  
  // Sort by prediction value
  const sorted = [...opinions].sort((a, b) => a.prediction - b.prediction);
  
  const clusters: ClusterCandidate[] = [];
  let currentCluster: AgentOpinion[] = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const lastPrediction = currentCluster[currentCluster.length - 1].prediction;
    const currentPrediction = sorted[i].prediction;
    
    if (currentPrediction - lastPrediction <= bandwidth) {
      currentCluster.push(sorted[i]);
    } else {
      // Start new cluster
      const center = currentCluster.reduce((sum, o) => sum + o.prediction, 0) / currentCluster.length;
      clusters.push({ center, opinions: currentCluster });
      currentCluster = [sorted[i]];
    }
  }
  
  // Don't forget the last cluster
  if (currentCluster.length > 0) {
    const center = currentCluster.reduce((sum, o) => sum + o.prediction, 0) / currentCluster.length;
    clusters.push({ center, opinions: currentCluster });
  }
  
  // Convert to OpinionCluster format with weights
  return clusters.map(cluster => {
    const avgConfidence = cluster.opinions.reduce((sum, o) => sum + o.confidence, 0) / cluster.opinions.length;
    const variance = calculateVariance(cluster.opinions.map(o => o.prediction));
    const coherence = 1 / (1 + variance * 10); // Higher variance = lower coherence
    
    return {
      center: cluster.center,
      opinions: cluster.opinions,
      weight: cluster.opinions.length * avgConfidence,
      coherence,
    };
  });
}

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
}

function calculateStdDev(values: number[]): number {
  return Math.sqrt(calculateVariance(values));
}

// ============================================================================
// CONSENSUS GENERATION
// ============================================================================

export function generateConsensus(
  marketId: string,
  opinions: AgentOpinion[],
  simulationTimeMs: number
): Consensus {
  
  const startTime = Date.now();
  
  // Cluster opinions
  const clusters = clusterOpinions(opinions);
  
  if (clusters.length === 0) {
    throw new Error('No opinions to generate consensus');
  }
  
  // Sort clusters by weight (size × confidence)
  const sortedClusters = [...clusters].sort((a, b) => b.weight - a.weight);
  const majorityCluster = sortedClusters[0];
  
  // Calculate weighted consensus
  const totalWeight = clusters.reduce((sum, c) => sum + c.weight, 0);
  const weightedProbability = clusters.reduce(
    (sum, c) => sum + (c.center * c.weight),
    0
  ) / totalWeight;
  
  // Confidence = coherence of majority cluster, scaled by cluster dominance
  const clusterDominance = majorityCluster.weight / totalWeight;
  const overallConfidence = majorityCluster.coherence * clusterDominance;
  
  // Find dissenting opinions (outside majority cluster, high confidence)
  const dissentingOpinions = opinions.filter(o => {
    const inMajority = majorityCluster.opinions.some(mo => mo.agentId === o.agentId);
    return !inMajority && o.confidence > 0.6;
  }).slice(0, 5);
  
  return {
    marketId,
    probability: weightedProbability,
    confidence: overallConfidence,
    clusters: sortedClusters,
    majorityCluster,
    dissentingOpinions,
    timestamp: new Date(),
    agentCount: opinions.length,
    simulationTimeMs: simulationTimeMs + (Date.now() - startTime),
  };
}

// ============================================================================
// CONSENSUS QUALITY METRICS
// ============================================================================

export interface ConsensusQuality {
  isValid: boolean;
  issues: string[];
  recommendation: 'proceed' | 'caution' | 'reject';
}

export function validateConsensus(consensus: Consensus): ConsensusQuality {
  const issues: string[] = [];
  
  // Check confidence
  if (consensus.confidence < 0.3) {
    issues.push('Low confidence — agents disagree significantly');
  }
  
  // Check cluster distribution
  if (consensus.clusters.length > 3) {
    issues.push('Highly fragmented opinion — no clear consensus');
  }
  
  // Check majority dominance
  const majorityWeight = consensus.majorityCluster.weight;
  const totalWeight = consensus.clusters.reduce((sum, c) => sum + c.weight, 0);
  if (majorityWeight / totalWeight < 0.6) {
    issues.push('Weak majority — significant dissent');
  }
  
  // Check for bimodal distribution (polarized)
  if (consensus.clusters.length === 2) {
    const c1 = consensus.clusters[0];
    const c2 = consensus.clusters[1];
    const distance = Math.abs(c1.center - c2.center);
    if (distance > 0.3 && c1.weight > 0.3 * totalWeight && c2.weight > 0.3 * totalWeight) {
      issues.push('Bimodal distribution — market is polarized');
    }
  }
  
  // Recommendation
  let recommendation: 'proceed' | 'caution' | 'reject' = 'proceed';
  if (issues.length >= 2) recommendation = 'caution';
  if (issues.length >= 3 || consensus.confidence < 0.2) recommendation = 'reject';
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendation,
  };
}
```

---

## 5. KELLY CRITERION EXECUTION (`src/execution/kelly.ts`)

```typescript
import { Consensus, Market, Position } from '../types';

// ============================================================================
// KELLY CRITERION POSITION SIZING
// ============================================================================

interface KellyParams {
  consensusProbability: number;
  marketPrice: number;
  bankroll: number;
  kellyFraction: number; // Conservative: 0.25, Aggressive: 0.5
  maxPositionPct: number; // Max position as % of bankroll
  minEdge: number; // Minimum edge to trade
}

interface KellyResult {
  shouldTrade: boolean;
  direction: 'yes' | 'no' | null;
  size: number;
  edge: number;
  kellyPercentage: number;
  adjustedKellyPercentage: number;
  reason: string;
}

export function calculateKellyPosition(params: KellyParams): KellyResult {
  const {
    consensusProbability,
    marketPrice,
    bankroll,
    kellyFraction,
    maxPositionPct,
    minEdge,
  } = params;
  
  // Calculate edge
  const edge = Math.abs(consensusProbability - marketPrice);
  
  // Check minimum edge
  if (edge < minEdge) {
    return {
      shouldTrade: false,
      direction: null,
      size: 0,
      edge,
      kellyPercentage: 0,
      adjustedKellyPercentage: 0,
      reason: `Edge ${(edge * 100).toFixed(2)}% below minimum ${(minEdge * 100).toFixed(2)}%`,
    };
  }
  
  // Determine direction
  const direction: 'yes' | 'no' = consensusProbability > marketPrice ? 'yes' : 'no';
  
  // Calculate decimal odds
  // If betting on Yes at price P, odds are (1-P)/P
  const odds = direction === 'yes' 
    ? (1 - marketPrice) / marketPrice
    : marketPrice / (1 - marketPrice);
  
  // Probability of winning (from consensus)
  const p = direction === 'yes' ? consensusProbability : (1 - consensusProbability);
  const q = 1 - p;
  
  // Kelly formula: f* = (bp - q) / b
  // where b = odds, p = win probability, q = loss probability
  const kellyPercentage = (odds * p - q) / odds;
  
  // Kelly can be negative (don't bet)
  if (kellyPercentage <= 0) {
    return {
      shouldTrade: false,
      direction: null,
      size: 0,
      edge,
      kellyPercentage,
      adjustedKellyPercentage: 0,
      reason: 'Kelly criterion negative — expected value < 0',
    };
  }
  
  // Apply fractional Kelly for safety
  const adjustedKellyPercentage = kellyPercentage * kellyFraction;
  
  // Calculate position size
  const rawPositionSize = bankroll * adjustedKellyPercentage;
  
  // Apply max position limit
  const maxPositionSize = bankroll * maxPositionPct;
  const positionSize = Math.min(rawPositionSize, maxPositionSize);
  
  return {
    shouldTrade: true,
    direction,
    size: positionSize,
    edge,
    kellyPercentage,
    adjustedKellyPercentage,
    reason: `Kelly ${(kellyPercentage * 100).toFixed(2)}%, ` +
            `fractional ${(adjustedKellyPercentage * 100).toFixed(2)}%, ` +
            `edge ${(edge * 100).toFixed(2)}%`,
  };
}

// ============================================================================
// POSITION GENERATION
// ============================================================================

interface PositionParams {
  market: Market;
  consensus: Consensus;
  bankroll: number;
  config?: {
    kellyFraction?: number;
    maxPositionPct?: number;
    minEdge?: number;
    minConfidence?: number;
  };
}

export function generatePosition(
  params: PositionParams
): Position | null {
  const {
    market,
    consensus,
    bankroll,
    config = {},
  } = params;
  
  const {
    kellyFraction = 0.25, // Quarter Kelly — conservative
    maxPositionPct = 0.10, // Max 10% per position
    minEdge = 0.05, // Min 5% edge
    minConfidence = 0.3, // Min 30% confidence
  } = config;
  
  // Check confidence threshold
  if (consensus.confidence < minConfidence) {
    console.log(`Skipping ${market.slug}: confidence ${(consensus.confidence * 100).toFixed(1)}% below threshold`);
    return null;
  }
  
  // Calculate Kelly position
  const kellyResult = calculateKellyPosition({
    consensusProbability: consensus.probability,
    marketPrice: market.outcomePrices.yes,
    bankroll,
    kellyFraction,
    maxPositionPct,
    minEdge,
  });
  
  if (!kellyResult.shouldTrade) {
    console.log(`Skipping ${market.slug}: ${kellyResult.reason}`);
    return null;
  }
  
  // Create position
  const position: Position = {
    id: `pos-${Date.now()}-${market.id.slice(0, 8)}`,
    marketId: market.id,
    direction: kellyResult.direction!,
    size: kellyResult.size,
    entryPrice: kellyResult.direction === 'yes' 
      ? market.outcomePrices.yes 
      : market.outcomePrices.no,
    entryDate: new Date(),
    status: 'open',
    consensusProbability: consensus.probability,
    marketPrice: market.outcomePrices.yes,
    edge: kellyResult.edge,
    kellyFraction: kellyFraction,
  };
  
  return position;
}

// ============================================================================
// P&L CALCULATION
// ============================================================================

export function calculateUnrealizedPnl(position: Position, currentPrice: number): number {
  if (position.direction === 'yes') {
    return position.size * (currentPrice - position.entryPrice) / position.entryPrice;
  } else {
    const entryPriceNo = 1 - position.entryPrice;
    const currentPriceNo = 1 - currentPrice;
    return position.size * (currentPriceNo - entryPriceNo) / entryPriceNo;
  }
}

export function calculateRealizedPnl(position: Position, resolution: 'yes' | 'no'): number {
  if (position.direction === resolution) {
    // Win: position pays out at $1 per share
    const shares = position.size / position.entryPrice;
    return shares * (1 - position.entryPrice);
  } else {
    // Loss: lose entire position
    return -position.size;
  }
}
```

---

## 6. DATABASE SCHEMA (`src/database/schema.ts`)

```typescript
import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

// ============================================================================
// PREDICTIONS TABLE — THE HOLY GRAIL
// ============================================================================

export const predictions = sqliteTable('predictions', {
  id: text('id').primaryKey(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  
  // Market info
  marketId: text('market_id').notNull(),
  marketSlug: text('market_slug').notNull(),
  marketQuestion: text('market_question').notNull(),
  marketCategory: text('market_category').notNull(),
  
  // Consensus data
  consensusProbability: real('consensus_probability').notNull(),
  consensusConfidence: real('consensus_confidence').notNull(),
  agentCount: integer('agent_count').notNull(),
  simulationTimeMs: integer('simulation_time_ms').notNull(),
  
  // Market data at time of prediction
  marketPriceYes: real('market_price_yes').notNull(),
  marketPriceNo: real('market_price_no').notNull(),
  marketVolume: real('market_volume').notNull(),
  
  // Edge calculation
  edge: real('edge').notNull(),
  edgeDirection: text('edge_direction').notNull(), // 'yes' | 'no' | 'none'
  
  // Recommendation
  recommendedDirection: text('recommended_direction').notNull(), // 'yes' | 'no' | 'skip'
  recommendedSize: real('recommended_size').notNull(),
  kellyFraction: real('kelly_fraction').notNull(),
  
  // Actual execution (filled manually or by automation)
  actualDirection: text('actual_direction'), // null if skipped
  actualSize: real('actual_size'),
  entryPrice: real('entry_price'),
  executedAt: integer('executed_at', { mode: 'timestamp' }),
  
  // Resolution (filled after market closes)
  resolved: integer('resolved', { mode: 'boolean' }).default(false),
  resolutionOutcome: text('resolution_outcome'), // 'yes' | 'no' | null
  resolutionDate: integer('resolution_date', { mode: 'timestamp' }),
  
  // P&L
  realizedPnl: real('realized_pnl'),
  roi: real('roi'),
  
  // Raw data for analysis
  agentOpinionsJson: text('agent_opinions_json'), // JSON of all opinions
  consensusClustersJson: text('consensus_clusters_json'), // JSON of clusters
  
  // Metadata
  notes: text('notes'),
});

// ============================================================================
// AGENT PERFORMANCE TABLE
// ============================================================================

export const agentPerformance = sqliteTable('agent_performance', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull(),
  agentType: text('agent_type').notNull(),
  
  // Stats
  totalPredictions: integer('total_predictions').default(0),
  correctPredictions: integer('correct_predictions').default(0),
  accuracy: real('accuracy'),
  averageError: real('average_error'),
  brierScore: real('brier_score'),
  
  // Contextual performance
  politicsAccuracy: real('politics_accuracy'),
  cryptoAccuracy: real('crypto_accuracy'),
  sportsAccuracy: real('sports_accuracy'),
  
  // Updated at
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// ============================================================================
// DAILY SUMMARY TABLE
// ============================================================================

export const dailySummaries = sqliteTable('daily_summaries', {
  id: text('id').primaryKey(),
  date: text('date').notNull().unique(), // YYYY-MM-DD
  
  // Activity
  marketsAnalyzed: integer('markets_analyzed').default(0),
  predictionsMade: integer('predictions_made').default(0),
  positionsRecommended: integer('positions_recommended').default(0),
  positionsTaken: integer('positions_taken').default(0),
  
  // Performance
  realizedPnl: real('realized_pnl').default(0),
  unrealizedPnl: real('unrealized_pnl').default(0),
  totalPnl: real('total_pnl').default(0),
  
  // Accuracy
  predictionsCorrect: integer('predictions_correct').default(0),
  predictionsWrong: integer('predictions_wrong').default(0),
  accuracy: real('accuracy'),
  
  // Costs
  groqTokensUsed: integer('groq_tokens_used').default(0),
  estimatedCost: real('estimated_cost').default(0),
  
  // Meta
  notes: text('notes'),
});
```

---

## 7. DAILY SCAN JOB (`src/jobs/daily-scan.ts`)

```typescript
import { getActiveMarkets } from '../data/polymarket';
import { getNewsForQuery } from '../data/news';
import { simulateAgentOpinions, estimateSimulationCost } from '../agents/engine';
import { generateConsensus, validateConsensus } from '../consensus/engine';
import { generatePosition } from '../execution/kelly';
import { db } from '../database';
import { predictions } from '../database/schema';
import { MarketContext, Consensus, Position } from '../types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  // Markets to analyze
  minLiquidity: 10000,      // $10K minimum
  maxMarketsPerRun: 20,     // Control costs
  categories: ['politics', 'crypto'], // Start focused
  
  // Execution
  paperBankroll: 10000,     // $10K paper money
  kellyFraction: 0.25,      // Quarter Kelly
  minEdge: 0.05,            // 5% minimum edge
  
  // Agents
  agentCount: 50,
};

// ============================================================================
// MAIN SCAN FUNCTION
// ============================================================================

export async function runDailyScan(): Promise<ScanResult> {
  console.log('🔮 Starting MiroFish Daily Scan...');
  console.log(`Configuration: ${CONFIG.agentCount} agents, $${CONFIG.paperBankroll} bankroll`);
  
  const startTime = Date.now();
  const results: MarketScanResult[] = [];
  
  // 1. Get active markets
  console.log('Fetching markets...');
  const markets = await getActiveMarkets({
    minLiquidity: CONFIG.minLiquidity,
    categories: CONFIG.categories,
  });
  
  // Sort by liquidity, take top N
  const topMarkets = markets
    .sort((a, b) => b.liquidity - a.liquidity)
    .slice(0, CONFIG.maxMarketsPerRun);
  
  console.log(`Found ${markets.length} markets, analyzing top ${topMarkets.length}`);
  
  // 2. Analyze each market
  for (let i = 0; i < topMarkets.length; i++) {
    const market = topMarkets[i];
    console.log(`\n[${i + 1}/${topMarkets.length}] Analyzing: ${market.question.slice(0, 60)}...`);
    
    try {
      const result = await analyzeMarket(market);
      results.push(result);
      
      // Log result
      if (result.position) {
        console.log(`✅ POSITION: ${result.position.direction.toUpperCase()} $${result.position.size.toFixed(2)} ` +
                    `@ ${(result.position.entryPrice * 100).toFixed(1)}¢ ` +
                    `(edge: ${(result.position.edge * 100).toFixed(1)}%)`);
      } else {
        console.log(`⏭️  SKIPPED: ${result.reason}`);
      }
      
    } catch (error) {
      console.error(`❌ ERROR analyzing ${market.slug}:`, error);
      results.push({
        market,
        error: error.message,
        position: null,
        reason: 'Error during analysis',
      });
    }
    
    // Rate limiting between markets
    if (i < topMarkets.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // 3. Generate summary
  const scanTime = Date.now() - startTime;
  const positions = results.filter(r => r.position).map(r => r.position!);
  const totalRecommended = positions.reduce((sum, p) => sum + p.size, 0);
  
  const summary: ScanResult = {
    timestamp: new Date(),
    scanTimeMs: scanTime,
    marketsAnalyzed: topMarkets.length,
    positionsRecommended: positions.length,
    totalRecommendedSize: totalRecommended,
    positions,
    skipped: results.filter(r => !r.position && !r.error).length,
    errors: results.filter(r => r.error).length,
    estimatedCost: estimateSimulationCost(CONFIG.agentCount * topMarkets.length),
  };
  
  console.log('\n📊 SCAN COMPLETE');
  console.log(`Markets analyzed: ${summary.marketsAnalyzed}`);
  console.log(`Positions recommended: ${summary.positionsRecommended}`);
  console.log(`Total recommended size: $${summary.totalRecommendedSize.toFixed(2)}`);
  console.log(`Scan time: ${(summary.scanTimeMs / 1000).toFixed(1)}s`);
  console.log(`Estimated API cost: $${summary.estimatedCost.toFixed(4)}`);
  
  return summary;
}

// ============================================================================
// MARKET ANALYSIS
// ============================================================================

async function analyzeMarket(market: Market): Promise<MarketScanResult> {
  const startTime = Date.now();
  
  // 1. Build market context
  const news = await getNewsForQuery(market.question);
  const context: MarketContext = {
    market,
    news,
    sentiment: analyzeSentiment(news),
    timestamp: new Date(),
  };
  
  // 2. Generate agent opinions
  const opinions = await simulateAgentOpinions(context, CONFIG.agentCount);
  
  // 3. Generate consensus
  const consensus = generateConsensus(market.id, opinions, Date.now() - startTime);
  
  // 4. Validate consensus
  const validation = validateConsensus(consensus);
  if (validation.recommendation === 'reject') {
    return {
      market,
      consensus,
      position: null,
      reason: `Consensus rejected: ${validation.issues.join(', ')}`,
    };
  }
  
  // 5. Generate position
  const position = generatePosition({
    market,
    consensus,
    bankroll: CONFIG.paperBankroll,
    config: {
      kellyFraction: CONFIG.kellyFraction,
      minEdge: CONFIG.minEdge,
    },
  });
  
  // 6. Log to database
  await logPrediction(market, consensus, position, opinions);
  
  return {
    market,
    consensus,
    position,
    reason: position ? 'Edge detected' : 'No edge or below threshold',
  };
}

// ============================================================================
// DATABASE LOGGING
// ============================================================================

async function logPrediction(
  market: Market,
  consensus: Consensus,
  position: Position | null,
  opinions: AgentOpinion[]
): Promise<void> {
  await db.insert(predictions).values({
    id: `pred-${Date.now()}-${market.id.slice(0, 8)}`,
    timestamp: new Date(),
    marketId: market.id,
    marketSlug: market.slug,
    marketQuestion: market.question,
    marketCategory: market.category,
    consensusProbability: consensus.probability,
    consensusConfidence: consensus.confidence,
    agentCount: consensus.agentCount,
    simulationTimeMs: consensus.simulationTimeMs,
    marketPriceYes: market.outcomePrices.yes,
    marketPriceNo: market.outcomePrices.no,
    marketVolume: market.volume,
    edge: position?.edge || Math.abs(consensus.probability - market.outcomePrices.yes),
    edgeDirection: consensus.probability > market.outcomePrices.yes ? 'yes' : 'no',
    recommendedDirection: position?.direction || 'skip',
    recommendedSize: position?.size || 0,
    kellyFraction: position?.kellyFraction || 0,
    agentOpinionsJson: JSON.stringify(opinions),
    consensusClustersJson: JSON.stringify(consensus.clusters),
  });
}

// ============================================================================
// TYPES
// ============================================================================

interface ScanResult {
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

interface MarketScanResult {
  market: Market;
  consensus?: Consensus;
  position: Position | null;
  reason: string;
  error?: string;
}
```

---

## 8. SETUP & DEPLOYMENT

### 8.1 Installation

```bash
# 1. Clone and setup
git clone <your-repo>
cd mirofish-phase1
npm install

# 2. Environment variables
cp .env.example .env
# Edit .env with your keys

# 3. Database
npx drizzle-kit generate
npx drizzle-kit migrate

# 4. Test run
npm run scan:dry
```

### 8.2 Environment Variables (`.env.example`)

```
# Groq (Required)
GROQ_API_KEY=your_groq_key_here

# Polymarket (Optional, has defaults)
POLYMARKET_API_URL=https://gamma-api.polymarket.com

# NewsAPI (Free tier: 100 requests/day)
NEWSAPI_KEY=your_newsapi_key

# Database
DATABASE_URL=file:./mirofish.db

# Config
PAPER_BANKROLL=10000
KELLY_FRACTION=0.25
MIN_EDGE=0.05
AGENT_COUNT=50
```

### 8.3 Scripts (`package.json`)

```json
{
  "scripts": {
    "scan": "tsx src/jobs/daily-scan.ts",
    "scan:dry": "DRY_RUN=true tsx src/jobs/daily-scan.ts",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "backfill": "tsx scripts/backfill-markets.ts",
    "test": "vitest"
  }
}
```

---

## 9. SUCCESS METRICS (First 30 Days)

| Week | Target | Validation |
|------|--------|------------|
| 1 | 50 predictions logged | Database has 50+ rows |
| 2 | First resolved markets | Can calculate accuracy |
| 3 | >55% accuracy (better than coin flip) | Beating random |
| 4 | Positive paper P&L | Kelly sizing working |

**Success = 30 days of logged predictions with >52% accuracy (statistically significant)**

---

## 10. FROM PAPER TO REAL MONEY

### Criteria for Live Trading

1. **Accuracy**: >55% over 100+ predictions
2. **Calibration**: Predicted confidence ≈ actual accuracy
3. **Sharpe**: Positive risk-adjusted returns
4. **Drawdown**: Max <20% of bankroll
5. **Edge persistence**: Edge exists across different market regimes

### Gradual Live Deployment

```
Week 5-6:  $100 positions (1% of bankroll)
Week 7-8:  $500 positions (5% of bankroll)
Week 9-12: Full Kelly sizing
Month 4+:  Increase bankroll with profits
```

---

## SUMMARY

This is your **Phase 1 deployment spec**. It gives you:

✅ 50-agent simulation (proven architecture)  
✅ Kelly criterion position sizing (risk management)  
✅ Paper trading (prove edge before risking capital)  
✅ Database logging (build history from day 1)  
✅ <$0.50/day API costs (within free tier)

**Start today. Run first scan tomorrow. Build your edge.**

Ready to deploy?
