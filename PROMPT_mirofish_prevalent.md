# MiroFish × War Room Integration Spec — Prevalent Anomalies Edition

## Overview

This document specifies the integration of MiroFish with War Room, pivoting from **rare geopolitical anomalies** to **prevalent market/social patterns**.

**Version**: 2.0 — Prevalent Focus  
**Status**: Implementation Ready  
**Dependencies**: MiroFish (CAMEL-AI OASIS), Market Data APIs, On-Chain Indexers

---

## Why The Pivot

| Rare Anomalies | Prevalent Patterns |
|----------------|-------------------|
| Low signal volume | Hourly/daily signals |
| Long validation cycles | P&L-validated in hours |
| Crisis-dependent utility | Continuous value delivery |
| Hard to monetize | BrowserOS widget = daily use |

**New Focus**: Market microstructure, sentiment velocity, on-chain flows, cross-asset correlations

---

## New Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  WAR ROOM 2.0: CONTINUOUS PREDICTION ENGINE                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LAYER 1: HIGH-FREQUENCY DATA INGESTION                                     │
│  ├── Market Microstructure                                                  │
│  │   ├── Order flow imbalances (CVD, delta)                                │
│  │   ├── Options skew & term structure                                     │
│  │   ├── Funding rate divergences across exchanges                        │
│  │   └── Open interest concentration heatmaps                             │
│  ├── Social Sentiment Streams                                               │
│  │   ├── Twitter/X narrative velocity (posts/min acceleration)            │
│  │   ├── Reddit cohort formation & echo chamber detection                 │
│  │   ├── News sentiment regime shifts (contextual NLP)                    │
│  │   └── Influencer clustering & information cascade prediction           │
│  └── On-Chain Intelligence                                                  │
│      ├── Whale wallet clustering & movement patterns                      │
│      ├── Exchange inflow/outflow velocity                                 │
│      ├── Smart contract interaction anomalies                             │
│      └── Gas pattern anomalies (MEV, bot activity)                        │
│                              ↓                                              │
│  LAYER 2: PATTERN DETECTION (Bruce Enhancement)                             │
│  ├── VolatilityRegimeDetector: IV expansion/contraction phases            │
│  ├── SentimentInflectionAnalyzer: Acceleration/deceleration detection     │
│  ├── WhaleClusteringEngine: Wallet graph analysis & coordination detection│
│  ├── OptionsFlowParser: Unusual OI buildup, sweep detection               │
│  └── CorrelationBreakdownMonitor: Cross-asset relationship shifts         │
│                              ↓                                              │
│  LAYER 3: SEED CONSTRUCTION (High-Frequency)                                │
│  ├── MarketStateExtractor: Current regime snapshot                        │
│  ├── ParticipantProfiler: Actor types & positioning                       │
│  ├── NarrativeExtractor: Dominant storylines & their velocity             │
│  └── ScenarioGenerator: "What if funding stays negative?" etc.            │
│                              ↓                                              │
│  LAYER 4: DIGITAL TWIN SIMULATION (MiroFish Core)                           │
│  ├── AgentFactory: Spawn market participants                              │
│  │   ├── Retail traders (momentum, FOMO, panic)                           │
│  │   ├── Institutional flow (systematic, rebalancing)                     │
│  │   ├── Market makers (delta hedging, arbitrage)                         │
│  │   ├── Whales (accumulation, distribution, coordination)                │
│  │   └── Algorithms (momentum, mean reversion, HFT)                       │
│  ├── ParallelTimeline: Run 24h-7d market simulations                      │
│  ├── VariableInjection: "What if whales dump?" "What if sentiment flips?" │
│  └── EmergenceObserver: Predict non-obvious second-order effects          │
│                              ↓                                              │
│  LAYER 5: VALIDATION (Makaveli Enhancement)                                 │
│  ├── BacktestValidator: Compare sim predictions to historical accuracy    │
│  ├── AssumptionChallenger: Question agent behavior models                 │
│  └── ConfidenceCalibration: Adjust predictions based on past error        │
│                              ↓                                              │
│  LAYER 6: SYNTHESIS & ACTION (High-Frequency)                               │
│  ├── TradeSignal: Entry/exit with position sizing                         │
│  ├── RiskAlert: Unusual correlation breakdown warning                     │
│  ├── ProtocolAdjust: Stress-based biohacking changes                      │
│  └── PolymarketStrategy: Optimal contract selection & sizing              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Sources

### Market Data
```typescript
interface MarketDataFeed {
  // Perpetual/Futures
  fundingRates: FundingRate[];        // Every 8h per exchange
  openInterest: OpenInterest[];       // OI per contract
  liquidations: Liquidation[];        // Cascading liq detection
  
  // Options
  impliedVol: IVSurface;              // Term structure & skew
  optionsFlow: OptionsTrade[];        // Sweep, block, unusual size
  putCallRatio: PCRData;              // Retail vs institutional
  
  // Spot
  orderBook: OrderBookSnapshot;       // Bid/ask depth, CVD
  tradeFlow: Trade[];                 // Aggressive buyer/seller delta
}
```

### Social Sentiment
```typescript
interface SentimentFeed {
  twitter: {
    velocity: number;                 // Posts per minute
    acceleration: number;             // Change in velocity
    sentiment: number;                // -1 to 1
    topNarratives: Narrative[];       // Clustered topics
    influencerActivity: Influencer[]; // Key accounts posting
  };
  reddit: {
    subredditMomentum: Record<string, number>;
    cohortFormation: Cohort[];        // Echo chamber detection
    sentimentShift: number;           // 24h change
  };
  news: {
    headlineSentiment: number;
    entityMentions: EntityCount[];
    regime: 'bullish' | 'bearish' | 'neutral' | 'fear' | 'euphoria';
  };
}
```

### On-Chain
```typescript
interface OnChainFeed {
  whales: {
    clusters: WalletCluster[];        // Graph-based clustering
    movements: TokenTransfer[];       // Large inflows/outflows
    exchangeFlows: ExchangeFlow[];    // Exchange deposit/withdrawal
  };
  smartContracts: {
    interactions: ContractCall[];     // Unusual function calls
    deployments: ContractDeploy[];    // New contracts (potential signals)
  };
  mempool: {
    gasPatterns: GasPattern[];        // MEV, bot behavior
    pendingValue: number;             // Value stuck in mempool
  };
}
```

---

## File Structure

```
lib/
├── mirofish/
│   ├── client.ts                   # HTTP client for MiroFish API
│   ├── types.ts                    # TypeScript interfaces (updated)
│   ├── seed-builder-market.ts      # Build seeds from market data
│   ├── seed-builder-sentiment.ts   # Build seeds from social data
│   ├── seed-builder-onchain.ts     # Build seeds from on-chain data
│   ├── agent-factory-market.ts     # Financial agent configs
│   ├── regime-detector.ts          # Volatility regime classification
│   ├── inflection-analyzer.ts      # Sentiment acceleration detection
│   └── result-parser.ts            # Parse sim output to trading signals
├── patterns/
│   ├── volatility-regime.ts        # IV expansion/contraction detection
│   ├── sentiment-inflection.ts     # Velocity/acceleration analysis
│   ├── whale-clustering.ts         # Wallet graph analysis
│   ├── options-flow.ts             # Unusual options activity
│   └── correlation-breakdown.ts    # Cross-asset relationship shifts
├── detectors/
│   ├── market-microstructure.ts    # Real-time market anomaly detection
│   ├── social-velocity.ts          # Sentiment change detection
│   └── onchain-anomaly.ts          # Whale movement detection
├── synthesis/
│   ├── trading-signals.ts          # Generate entry/exit signals
│   ├── risk-alerts.ts              # Correlation breakdown warnings
│   └── confidence-calibration.ts   # Adjust based on backtests
└── api/
    └── mirofish/
        ├── simulate/route.ts            # Main simulation endpoint
        ├── market-regime/route.ts       # Current regime classification
        ├── sentiment-state/route.ts     # Current sentiment snapshot
        └── signals/[id]/route.ts        # Retrieve generated signals

app/
├── (dashboard)/
│   └── warroom/
│       ├── page.tsx                # Existing War Room
│       ├── markets/                # NEW: Market prediction panel
│       │   ├── page.tsx
│       │   ├── VolatilityCard.tsx
│       │   ├── SentimentStream.tsx
│       │   ├── WhaleMap.tsx
│       │   └── PredictionChart.tsx
│       └── signals/                # Trading signals history
│           ├── page.tsx
│           └── SignalBacktest.tsx

components/
├── patterns/
│   ├── VolatilityRegimeBadge.tsx   # Current IV regime indicator
│   ├── SentimentVelocityGraph.tsx  # Acceleration/deceleration viz
│   ├── WhaleClusterMap.tsx         # D3.js wallet relationship graph
│   ├── OptionsFlowPanel.tsx        # Unusual flow alerts
│   └── CorrelationMatrix.tsx       # Cross-asset correlation heatmap
├── predictions/
│   ├── MarketSimulationTrigger.tsx # Trigger sim from market pattern
│   ├── SignalCard.tsx              # Individual trading signal
│   └── ConfidenceBadge.tsx         # Historical accuracy indicator
└── alerts/
    ├── RegimeShiftAlert.tsx        # IV regime change notification
    ├── SentimentInflectionAlert.tsx # Sentiment flip notification
    └── WhaleMovementAlert.tsx      # Large wallet move notification
```

---

## Type Definitions

```typescript
// lib/mirofish/types.ts

// === PATTERN TYPES (Prevalent Focus) ===

type PatternType = 
  | 'volatility_regime_shift'
  | 'sentiment_inflection'
  | 'whale_clustering'
  | 'options_flow_anomaly'
  | 'correlation_breakdown'
  | 'funding_divergence';

interface PatternDetection {
  id: string;
  type: PatternType;
  timestamp: number;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  data: PatternData;
}

type PatternData = 
  | VolatilityRegimeData
  | SentimentInflectionData
  | WhaleClusteringData
  | OptionsFlowData
  | CorrelationBreakdownData;

// Volatility Pattern
interface VolatilityRegimeData {
  asset: string;
  currentRegime: 'compression' | 'normal' | 'expansion' | 'extreme';
  ivPercentile: number;           // 0-100 historical percentile
  termStructure: 'contango' | 'backwardation' | 'flat';
  skew: number;                   // Put/call skew
  expectedMove: number;           // Implied 1 std dev move
  regimeDuration: number;         // Hours in current regime
}

// Sentiment Pattern
interface SentimentInflectionData {
  platform: 'twitter' | 'reddit' | 'news' | 'combined';
  narrative: string;
  velocity: number;               // Posts per minute
  acceleration: number;           // Change in velocity (posts/min²)
  sentiment: number;              // -1 to 1
  momentum: 'accelerating_positive' | 'decelerating_positive' | 
            'accelerating_negative' | 'decelerating_negative';
  influencers: string[];          // Key accounts driving narrative
  echoChamberScore: number;       // 0-1 clustering metric
}

// Whale Pattern
interface WhaleClusteringData {
  asset: string;
  clusterId: string;
  clusterSize: number;            // Number of wallets
  totalHoldings: number;          // In base asset
  movementType: 'accumulating' | 'distributing' | 'coordinating';
  exchangeFlows: {
    inflows: number;
    outflows: number;
    netFlow: number;
  };
  confidence: number;             // Coordination detection confidence
}

// Options Pattern
interface OptionsFlowData {
  asset: string;
  unusualActivity: {
    type: 'sweep' | 'block' | 'unusual_size';
    side: 'call' | 'put';
    sentiment: 'bullish' | 'bearish' | 'neutral';
    strike: number;
    expiration: string;
    volume: number;
    openInterest: number;
    premium: number;
  }[];
  putCallRatio: number;
  ivSkewChange: number;           // 24h change
  oiConcentration: number;        // Max pain vs current price
}

// Correlation Pattern
interface CorrelationBreakdownData {
  baseAsset: string;
  correlations: {
    asset: string;
    correlation: number;          // -1 to 1
    change24h: number;            // Change in correlation
    regime: 'diverging' | 'converging' | 'stable';
  }[];
  breakdownSeverity: number;      // 0-1 magnitude of shift
}

// === SIMULATION INPUT ===

interface SimulationTrigger {
  id: string;
  source: PatternType;
  region: string;                 // e.g., "crypto", "tech-stocks"
  timestamp: number;
  patternData: PatternData;
  userQuery?: string;
}

interface SimulationSeed {
  // Market state snapshot
  marketState: {
    regime: VolatilityRegimeData;
    fundingConditions: FundingConditions;
    liquidityProfile: LiquidityProfile;
  };
  
  // Participant state
  participants: {
    retail: RetailProfile;
    institutional: InstitutionalProfile;
    whales: WhaleProfile[];
    marketMakers: MarketMakerProfile;
  };
  
  // Narrative state
  narrative: {
    dominantStories: string[];
    sentiment: SentimentInflectionData;
    velocity: number;
  };
  
  // Historical context
  recentEvents: MarketEvent[];
  
  // Query
  query: string;
}

interface FundingConditions {
  averageFunding: number;         // Across exchanges
  divergence: number;             // Max - min
  trend: 'rising' | 'falling' | 'stable';
}

interface LiquidityProfile {
  bidAskSpread: number;
    orderBookDepth: number;
  slippageProfile: SlippagePoint[];
}

interface RetailProfile {
  longShortRatio: number;
  openInterest: number;
  sentiment: number;
  fomoIndex: number;              // FOMO vs fear metric
}

interface InstitutionalProfile {
  positioning: 'long' | 'short' | 'neutral';
  flowDirection: 'inflow' | 'outflow' | 'stable';
  rebalancingPressure: number;    // 0-1
}

interface WhaleProfile {
  clusterId: string;
  holdings: number;
  recentActivity: 'buying' | 'selling' | 'holding';
  coordinationScore: number;
}

interface MarketMakerProfile {
  gammaExposure: number;          // Net gamma position
  deltaHedgePressure: number;     // Required hedging flow
  inventorySkew: number;          // Long vs short inventory
}

interface MarketEvent {
  timestamp: number;
  type: string;
  description: string;
  impact: number;
}

// === AGENT CONFIGURATION ===

interface AgentConfig {
  role: 'retail' | 'institutional' | 'whale' | 'market_maker' | 'algorithm';
  count: number;
  behaviorProfile: BehaviorProfile;
  capitalDistribution: CapitalDistribution;
  strategyWeights: StrategyWeights;
  memoryConfig: MemoryConfig;
}

interface BehaviorProfile {
  rationality: number;            // 0-1
  riskTolerance: number;          // 0-1
  herdTendency: number;           // 0-1
  contrarianTendency: number;     // 0-1
  reactionSpeed: number;          // Time to react to news (seconds)
}

interface CapitalDistribution {
  min: number;
  max: number;
  distribution: 'uniform' | 'power_law' | 'normal';
}

interface StrategyWeights {
  momentum: number;
  meanReversion: number;
  fundamental: number;
  sentiment: number;
  technical: number;
}

// === SIMULATION OUTPUT ===

interface SimulationResult {
  id: string;
  triggerId: string;
  status: 'running' | 'completed' | 'failed';
  
  // Price path prediction
  priceProjection: PricePoint[];
  
  // Regime prediction
  regimeForecast: RegimeForecast[];
  
  // Participant evolution
  participantEvolution: ParticipantSnapshot[];
  
  // Trading signals
  signals: TradingSignal[];
  
  // Key insights
  predictions: MarketPrediction[];
  
  // Confidence metrics
  confidence: number;
  backtestAccuracy: number;       // Historical accuracy of this pattern
  processingTime: number;
}

interface PricePoint {
  timestamp: number;
  expectedPrice: number;
  confidenceInterval: [number, number]; // 95% CI
  probabilityDistribution: PriceDistribution;
}

interface RegimeForecast {
  timeframe: string;              // e.g., "24h", "7d"
  predictedRegime: 'compression' | 'normal' | 'expansion' | 'extreme';
  probability: number;
  catalysts: string[];
}

interface ParticipantSnapshot {
  timestamp: number;
  retail: RetailProfile;
  institutional: InstitutionalProfile;
  whales: WhaleProfile[];
  marketMakers: MarketMakerProfile;
}

interface TradingSignal {
  id: string;
  type: 'entry' | 'exit' | 'hedge';
  direction: 'long' | 'short' | 'neutral';
  asset: string;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;           // % of portfolio
  confidence: number;
  timeframe: string;
  rationale: string;
  riskReward: number;
}

interface MarketPrediction {
  type: 'price' | 'volatility' | 'sentiment' | 'correlation';
  prediction: string;
  probability: number;
  timeframe: string;
  indicators: string[];
}

// === WAR ROOM INTEGRATION ===

interface PredictionAction {
  type: 'trade' | 'alert' | 'protocol' | 'research';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  signal?: TradingSignal;
  automated?: boolean;
  payload?: any;
}
```

---

## Core Implementation

### 1. MiroFish Client

```typescript
// lib/mirofish/client.ts

import { SimulationTrigger, SimulationSeed, SimulationResult, AgentConfig, PatternType } from './types';

export class MiroFishClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = 'http://localhost:8000', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey || process.env.MIROFISH_API_KEY!;
  }

  // Main simulation entry point
  async simulate(seed: SimulationSeed, config?: SimulationConfig): Promise<SimulationResult> {
    const response = await fetch(`${this.baseUrl}/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ seed, config })
    });

    if (!response.ok) {
      throw new Error(`MiroFish simulation failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Quick regime prediction (lighter weight)
  async predictRegime(asset: string, timeframe: string = '24h'): Promise<RegimeForecast> {
    const response = await fetch(`${this.baseUrl}/predict/regime`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ asset, timeframe })
    });

    return response.json();
  }

  // Check simulation status
  async getStatus(simulationId: string): Promise<SimulationResult> {
    const response = await fetch(`${this.baseUrl}/simulations/${simulationId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return response.json();
  }

  // Get backtest accuracy for a pattern type
  async getBacktestAccuracy(patternType: PatternType): Promise<number> {
    const response = await fetch(`${this.baseUrl}/backtest/accuracy?pattern=${patternType}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    const data = await response.json();
    return data.accuracy;
  }
}

interface SimulationConfig {
  duration: number;               // Hours
  agentCount: number;
  timeStep: number;               // Minutes per step
  scenarios: string[];
  parallelRuns: number;
}

export const mirofish = new MiroFishClient();
```

### 2. Market Seed Builder

```typescript
// lib/mirofish/seed-builder-market.ts

import { 
  VolatilityRegimeData, 
  SimulationSeed, 
  MarketState, 
  FundingConditions,
  LiquidityProfile,
  MarketEvent 
} from './types';

export class MarketSeedBuilder {
  
  // Build seed from volatility regime detection
  static fromVolatilityRegime(
    regime: VolatilityRegimeData,
    marketData: MarketDataFeed,
    query: string
  ): SimulationSeed {
    return {
      marketState: {
        regime,
        fundingConditions: this.extractFundingConditions(marketData),
        liquidityProfile: this.extractLiquidityProfile(marketData)
      },
      participants: {
        retail: this.inferRetailProfile(marketData),
        institutional: this.inferInstitutionalProfile(marketData),
        whales: this.inferWhaleProfiles(marketData),
        marketMakers: this.inferMarketMakerProfile(marketData, regime)
      },
      narrative: {
        dominantStories: this.extractNarratives(marketData),
        sentiment: this.getCompositeSentiment(marketData),
        velocity: this.calculateNarrativeVelocity(marketData)
      },
      recentEvents: this.extractRecentEvents(marketData),
      query
    };
  }

  private static extractFundingConditions(data: MarketDataFeed): FundingConditions {
    const rates = data.fundingRates.map(f => f.rate);
    return {
      averageFunding: rates.reduce((a, b) => a + b, 0) / rates.length,
      divergence: Math.max(...rates) - Math.min(...rates),
      trend: this.classifyTrend(rates)
    };
  }

  private static classifyTrend(rates: number[]): 'rising' | 'falling' | 'stable' {
    const firstHalf = rates.slice(0, Math.floor(rates.length / 2));
    const secondHalf = rates.slice(Math.floor(rates.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg * 1.1) return 'rising';
    if (secondAvg < firstAvg * 0.9) return 'falling';
    return 'stable';
  }

  private static extractLiquidityProfile(data: MarketDataFeed): LiquidityProfile {
    const book = data.orderBook;
    return {
      bidAskSpread: (book.asks[0].price - book.bids[0].price) / book.midPrice,
      orderBookDepth: this.calculateDepth(book),
      slippageProfile: this.calculateSlippage(book)
    };
  }

  private static calculateDepth(book: OrderBookSnapshot): number {
    const bidDepth = book.bids.reduce((sum, level) => sum + level.size, 0);
    const askDepth = book.asks.reduce((sum, level) => sum + level.size, 0);
    return Math.min(bidDepth, askDepth);
  }

  private static calculateSlippage(book: OrderBookSnapshot): SlippagePoint[] {
    // Calculate slippage for different order sizes
    return [];
  }

  private static inferRetailProfile(data: MarketDataFeed) {
    const longShort = data.openInterest.long / data.openInterest.short;
    return {
      longShortRatio: longShort,
      openInterest: data.openInterest.total,
      sentiment: data.sentiment.retail || 0,
      fomoIndex: this.calculateFOMO(data)
    };
  }

  private static calculateFOMO(data: MarketDataFeed): number {
    // FOMO = high sentiment + high OI + high funding
    const sentiment = data.sentiment.retail || 0;
    const oiChange = data.openInterest.change24h;
    const funding = data.fundingRates[0]?.rate || 0;
    
    return Math.min(1, Math.max(0, (sentiment + oiChange / 100 + funding * 100) / 3));
  }

  private static inferInstitutionalProfile(data: MarketDataFeed) {
    // Infer from options flow, block trades, etc.
    return {
      positioning: this.classifyPositioning(data),
      flowDirection: this.classifyFlow(data),
      rebalancingPressure: this.calculateRebalancingPressure(data)
    };
  }

  private static classifyPositioning(data: MarketDataFeed): 'long' | 'short' | 'neutral' {
    const putCallRatio = data.optionsFlow.putCallRatio;
    if (putCallRatio < 0.7) return 'long';
    if (putCallRatio > 1.3) return 'short';
    return 'neutral';
  }

  private static classifyFlow(data: MarketDataFeed): 'inflow' | 'outflow' | 'stable' {
    // Analyze exchange flows
    return 'stable';
  }

  private static calculateRebalancingPressure(data: MarketDataFeed): number {
    // High when price moves far from VWAP with high volume
    return 0.5;
  }

  private static inferWhaleProfiles(data: MarketDataFeed): WhaleProfile[] {
    // From on-chain data
    return data.onChain.whales.clusters.map(cluster => ({
      clusterId: cluster.id,
      holdings: cluster.totalHoldings,
      recentActivity: cluster.movementType === 'accumulating' ? 'buying' : 
                      cluster.movementType === 'distributing' ? 'selling' : 'holding',
      coordinationScore: cluster.confidence
    }));
  }

  private static inferMarketMakerProfile(data: MarketDataFeed, regime: VolatilityRegimeData) {
    // Infer from order book shape, gamma exposure from options
    return {
      gammaExposure: this.calculateGammaExposure(data),
      deltaHedgePressure: this.calculateDeltaHedge(data, regime),
      inventorySkew: this.calculateInventorySkew(data)
    };
  }

  private static calculateGammaExposure(data: MarketDataFeed): number {
    // Sum gamma across options chain
    return data.optionsFlow.options.reduce((sum, opt) => {
      return sum + (opt.gamma || 0) * opt.openInterest;
    }, 0);
  }

  private static calculateDeltaHedge(data: MarketDataFeed, regime: VolatilityRegimeData): number {
    // Required hedging flow based on delta exposure
    return 0;
  }

  private static calculateInventorySkew(data: MarketDataFeed): number {
    // Long vs short inventory from order book
    const bidVolume = data.orderBook.bids.reduce((sum, b) => sum + b.size, 0);
    const askVolume = data.orderBook.asks.reduce((sum, a) => sum + a.size, 0);
    return (bidVolume - askVolume) / (bidVolume + askVolume);
  }

  private static extractNarratives(data: MarketDataFeed): string[] {
    return data.sentiment.topNarratives.map(n => n.topic);
  }

  private static getCompositeSentiment(data: MarketDataFeed) {
    return data.sentiment.composite;
  }

  private static calculateNarrativeVelocity(data: MarketDataFeed): number {
    return data.sentiment.twitter.velocity;
  }

  private static extractRecentEvents(data: MarketDataFeed): MarketEvent[] {
    return data.recentEvents || [];
  }
}
```

### 3. Sentiment Seed Builder

```typescript
// lib/mirofish/seed-builder-sentiment.ts

import { SentimentInflectionData, SimulationSeed, Narrative } from './types';

export class SentimentSeedBuilder {
  
  // Build seed from sentiment inflection detection
  static fromSentimentInflection(
    inflection: SentimentInflectionData,
    historicalSentiment: SentimentInflectionData[],
    query: string
  ): SimulationSeed {
    return {
      marketState: {
        regime: this.inferRegimeFromSentiment(inflection),
        fundingConditions: this.inferFundingFromSentiment(inflection),
        liquidityProfile: this.inferLiquidityFromSentiment(inflection)
      },
      participants: {
        retail: {
          longShortRatio: inflection.sentiment > 0 ? 2 : 0.5,
          openInterest: 0,
          sentiment: inflection.sentiment,
          fomoIndex: inflection.momentum.includes('accelerating') ? 
            (inflection.sentiment > 0 ? 0.8 : 0.2) : 0.5
        },
        institutional: {
          positioning: this.inferInstitutionalPosition(inflection),
          flowDirection: 'stable',
          rebalancingPressure: 0.3
        },
        whales: [],
        marketMakers: {
          gammaExposure: 0,
          deltaHedgePressure: 0,
          inventorySkew: 0
        }
      },
      narrative: {
        dominantStories: [inflection.narrative],
        sentiment: inflection,
        velocity: inflection.velocity
      },
      recentEvents: this.createSentimentEvents(inflection, historicalSentiment),
      query
    };
  }

  private static inferRegimeFromSentiment(inflection: SentimentInflectionData) {
    return {
      asset: 'BTC',
      currentRegime: inflection.velocity > 100 ? 'expansion' : 'normal',
      ivPercentile: 50 + (inflection.velocity / 10),
      termStructure: 'contango',
      skew: inflection.sentiment * -0.5,
      expectedMove: inflection.velocity / 100,
      regimeDuration: 24
    };
  }

  private static inferFundingFromSentiment(inflection: SentimentInflectionData) {
    return {
      averageFunding: inflection.sentiment * 0.01,
      divergence: 0.001,
      trend: inflection.momentum.includes('accelerating') ? 'rising' : 'stable'
    };
  }

  private static inferLiquidityFromSentiment(inflection: SentimentInflectionData) {
    return {
      bidAskSpread: 0.001,
      orderBookDepth: 1000000 / (1 + inflection.velocity / 100),
      slippageProfile: []
    };
  }

  private static inferInstitutionalPosition(inflection: SentimentInflectionData): 'long' | 'short' | 'neutral' {
    if (inflection.momentum === 'accelerating_positive') return 'long';
    if (inflection.momentum === 'accelerating_negative') return 'short';
    return 'neutral';
  }

  private static createSentimentEvents(
    inflection: SentimentInflectionData,
    historical: SentimentInflectionData[]
  ) {
    return [
      {
        timestamp: Date.now(),
        type: 'sentiment_inflection',
        description: `Sentiment ${inflection.momentum} on narrative: ${inflection.narrative}`,
        impact: Math.abs(inflection.acceleration) / 100
      }
    ];
  }
}
```

### 4. Market Agent Factory

```typescript
// lib/mirofish/agent-factory-market.ts

import { AgentConfig, BehaviorProfile, CapitalDistribution, StrategyWeights } from './types';

export class MarketAgentFactory {
  
  // Generate financial market agents
  static forMarketCondition(
    regime: 'compression' | 'normal' | 'expansion' | 'extreme',
    sentiment: number,
    retailProfile: RetailProfile
  ): AgentConfig[] {
    return [
      this.createRetailAgents(regime, sentiment, retailProfile),
      this.createInstitutionalAgents(regime, sentiment),
      this.createWhaleAgents(regime, sentiment),
      this.createMarketMakerAgents(regime),
      this.createAlgorithmAgents(regime)
    ];
  }

  private static createRetailAgents(
    regime: string,
    sentiment: number,
    profile: RetailProfile
  ): AgentConfig {
    const isFOMO = profile.fomoIndex > 0.7;
    const isFear = profile.fomoIndex < 0.3;
    
    return {
      role: 'retail',
      count: 1000,
      behaviorProfile: {
        rationality: 0.3,
        riskTolerance: isFOMO ? 0.8 : isFear ? 0.2 : 0.5,
        herdTendency: 0.7,
        contrarianTendency: 0.2,
        reactionSpeed: 300  // 5 minutes
      },
      capitalDistribution: {
        min: 100,
        max: 50000,
        distribution: 'power_law'
      },
      strategyWeights: {
        momentum: isFOMO ? 0.6 : 0.3,
        meanReversion: isFear ? 0.5 : 0.2,
        fundamental: 0.1,
        sentiment: 0.7,
        technical: 0.4
      },
      memoryConfig: {
        individualDepth: 7,      // 7 days of personal memory
        collectiveDepth: 30,     // 30 days of market memory
        graphRagEnabled: false   // Retail doesn't use complex RAG
      }
    };
  }

  private static createInstitutionalAgents(
    regime: string,
    sentiment: number
  ): AgentConfig {
    return {
      role: 'institutional',
      count: 50,
      behaviorProfile: {
        rationality: 0.85,
        riskTolerance: 0.4,
        herdTendency: 0.3,
        contrarianTendency: 0.4,
        reactionSpeed: 3600  // 1 hour
      },
      capitalDistribution: {
        min: 1000000,
        max: 100000000,
        distribution: 'normal'
      },
      strategyWeights: {
        momentum: 0.2,
        meanReversion: 0.3,
        fundamental: 0.6,
        sentiment: 0.2,
        technical: 0.3
      },
      memoryConfig: {
        individualDepth: 90,
        collectiveDepth: 365,
        graphRagEnabled: true
      }
    };
  }

  private static createWhaleAgents(
    regime: string,
    sentiment: number
  ): AgentConfig {
    return {
      role: 'whale',
      count: 20,
      behaviorProfile: {
        rationality: 0.7,
        riskTolerance: 0.6,
        herdTendency: 0.4,
        contrarianTendency: 0.6,
        reactionSpeed: 1800  // 30 minutes
      },
      capitalDistribution: {
        min: 10000000,
        max: 1000000000,
        distribution: 'power_law'
      },
      strategyWeights: {
        momentum: 0.3,
        meanReversion: 0.4,
        fundamental: 0.3,
        sentiment: 0.5,
        technical: 0.2
      },
      memoryConfig: {
        individualDepth: 180,
        collectiveDepth: 730,
        graphRagEnabled: true
      }
    };
  }

  private static createMarketMakerAgents(regime: string): AgentConfig {
    const volMultiplier = regime === 'extreme' ? 2 : regime === 'expansion' ? 1.5 : 1;
    
    return {
      role: 'market_maker',
      count: 10,
      behaviorProfile: {
        rationality: 0.95,
        riskTolerance: 0.3 * volMultiplier,
        herdTendency: 0.1,
        contrarianTendency: 0.1,
        reactionSpeed: 1  // 1 second
      },
      capitalDistribution: {
        min: 50000000,
        max: 500000000,
        distribution: 'normal'
      },
      strategyWeights: {
        momentum: 0.1,
        meanReversion: 0.8,
        fundamental: 0.1,
        sentiment: 0.1,
        technical: 0.9
      },
      memoryConfig: {
        individualDepth: 1,   // 1 day (very short)
        collectiveDepth: 7,   // 1 week
        graphRagEnabled: false
      }
    };
  }

  private static createAlgorithmAgents(regime: string): AgentConfig {
    return {
      role: 'algorithm',
      count: 100,
      behaviorProfile: {
        rationality: 0.8,
        riskTolerance: 0.5,
        herdTendency: 0.4,
        contrarianTendency: 0.3,
        reactionSpeed: 0.1  // 100ms
      },
      capitalDistribution: {
        min: 100000,
        max: 10000000,
        distribution: 'power_law'
      },
      strategyWeights: {
        momentum: 0.5,
        meanReversion: 0.5,
        fundamental: 0.0,
        sentiment: 0.3,
        technical: 0.8
      },
      memoryConfig: {
        individualDepth: 1,
        collectiveDepth: 30,
        graphRagEnabled: false
      }
    };
  }
}
```

### 5. Pattern Detectors

```typescript
// lib/patterns/volatility-regime.ts

import { VolatilityRegimeData, PatternDetection } from '@/lib/mirofish/types';

export class VolatilityRegimeDetector {
  private history: VolatilityRegimeData[] = [];

  analyze(
    currentIV: number,
    historicalIVs: number[],
    termStructure: TermStructure,
    asset: string
  ): PatternDetection | null {
    const ivPercentile = this.calculatePercentile(currentIV, historicalIVs);
    const regime = this.classifyRegime(ivPercentile, termStructure);
    const prevRegime = this.history[this.history.length - 1]?.currentRegime;
    
    // Only detect on regime change
    if (regime === prevRegime) return null;

    const data: VolatilityRegimeData = {
      asset,
      currentRegime: regime,
      ivPercentile,
      termStructure: this.classifyTermStructure(termStructure),
      skew: this.calculateSkew(termStructure),
      expectedMove: currentIV / Math.sqrt(365) * 100,
      regimeDuration: this.calculateRegimeDuration(regime)
    };

    this.history.push(data);

    return {
      id: crypto.randomUUID(),
      type: 'volatility_regime_shift',
      timestamp: Date.now(),
      confidence: this.calculateConfidence(data, prevRegime),
      severity: this.classifySeverity(regime, prevRegime),
      data
    };
  }

  private calculatePercentile(current: number, historical: number[]): number {
    const sorted = [...historical].sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= current);
    return (index / sorted.length) * 100;
  }

  private classifyRegime(percentile: number, termStructure: TermStructure): string {
    if (percentile > 90) return 'extreme';
    if (percentile > 75) return 'expansion';
    if (percentile < 10) return 'compression';
    return 'normal';
  }

  private classifySeverity(newRegime: string, oldRegime: string | undefined): 'low' | 'medium' | 'high' | 'critical' {
    if (!oldRegime) return 'low';
    
    const transitions: Record<string, Record<string, string>> = {
      'compression': { 'expansion': 'high', 'extreme': 'critical' },
      'normal': { 'extreme': 'high' },
      'expansion': { 'compression': 'medium' },
      'extreme': { 'compression': 'high', 'normal': 'medium' }
    };

    return (transitions[oldRegime]?.[newRegime] || 'low') as any;
  }

  private calculateConfidence(data: VolatilityRegimeData, prevRegime?: string): number {
    let confidence = 0.7;
    
    // Higher confidence if term structure confirms
    if (data.currentRegime === 'extreme' && data.termStructure === 'backwardation') {
      confidence += 0.2;
    }
    
    // Higher confidence if sustained
    if (data.regimeDuration > 24) {
      confidence += 0.1;
    }

    return Math.min(0.99, confidence);
  }

  private calculateRegimeDuration(regime: string): number {
    let duration = 0;
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i].currentRegime === regime) {
        duration += 8; // Assuming 8h data points
      } else {
        break;
      }
    }
    return duration;
  }

  private classifyTermStructure(ts: TermStructure): 'contango' | 'backwardation' | 'flat' {
    const spread = ts.longDated - ts.shortDated;
    if (spread > 0.05) return 'contango';
    if (spread < -0.05) return 'backwardation';
    return 'flat';
  }

  private calculateSkew(ts: TermStructure): number {
    // Put/call skew approximation
    return (ts.putIV - ts.callIV) / ts.atmIV;
  }
}
```

```typescript
// lib/patterns/sentiment-inflection.ts

import { SentimentInflectionData, PatternDetection } from '@/lib/mirofish/types';

export class SentimentInflectionDetector {
  private history: SentimentPoint[] = [];

  analyze(
    currentSentiment: number,
    currentVelocity: number,
    platform: string,
    narrative: string,
    influencers: string[]
  ): PatternDetection | null {
    
    // Calculate acceleration
    const prevVelocity = this.history[this.history.length - 1]?.velocity || 0;
    const acceleration = currentVelocity - prevVelocity;
    
    // Detect inflection
    const momentum = this.classifyMomentum(currentSentiment, acceleration);
    const prevMomentum = this.history[this.history.length - 1]?.momentum;
    
    // Only detect on momentum change or extreme acceleration
    if (momentum === prevMomentum && Math.abs(acceleration) < 50) return null;

    const echoChamberScore = this.calculateEchoChamber(influencers);

    const data: SentimentInflectionData = {
      platform,
      narrative,
      velocity: currentVelocity,
      acceleration,
      sentiment: currentSentiment,
      momentum,
      influencers,
      echoChamberScore
    };

    this.history.push({
      timestamp: Date.now(),
      sentiment: currentSentiment,
      velocity: currentVelocity,
      momentum
    });

    // Trim history
    if (this.history.length > 1000) this.history.shift();

    return {
      id: crypto.randomUUID(),
      type: 'sentiment_inflection',
      timestamp: Date.now(),
      confidence: this.calculateConfidence(data, prevMomentum),
      severity: this.classifySeverity(data),
      data
    };
  }

  private classifyMomentum(sentiment: number, acceleration: number): string {
    const isPositive = sentiment > 0;
    const isAccelerating = acceleration > 0;
    
    if (isPositive && isAccelerating) return 'accelerating_positive';
    if (isPositive && !isAccelerating) return 'decelerating_positive';
    if (!isPositive && isAccelerating) return 'accelerating_negative';
    return 'decelerating_negative';
  }

  private calculateEchoChamber(influencers: string[]): number {
    // Calculate clustering of influence
    if (influencers.length < 3) return 0;
    
    // Simplified: more unique influencers = less echo chamber
    const uniqueCount = new Set(influencers).size;
    return Math.max(0, 1 - uniqueCount / influencers.length);
  }

  private calculateConfidence(data: SentimentInflectionData, prevMomentum?: string): number {
    let confidence = 0.6;
    
    // Higher confidence for large acceleration
    confidence += Math.min(0.2, Math.abs(data.acceleration) / 500);
    
    // Higher confidence if momentum actually changed direction
    if (prevMomentum && prevMomentum !== data.momentum) {
      confidence += 0.15;
    }
    
    // Lower confidence if echo chamber detected
    confidence -= data.echoChamberScore * 0.2;

    return Math.max(0.3, Math.min(0.95, confidence));
  }

  private classifySeverity(data: SentimentInflectionData): 'low' | 'medium' | 'high' | 'critical' {
    const accel = Math.abs(data.acceleration);
    
    if (accel > 200 && data.echoChamberScore > 0.7) return 'critical';
    if (accel > 150) return 'high';
    if (accel > 100) return 'medium';
    return 'low';
  }
}

interface SentimentPoint {
  timestamp: number;
  sentiment: number;
  velocity: number;
  momentum: string;
}
```

### 6. Trading Signal Generator

```typescript
// lib/synthesis/trading-signals.ts

import { SimulationResult, TradingSignal, MarketPrediction } from '@/lib/mirofish/types';

export class TradingSignalGenerator {
  
  static generate(result: SimulationResult): TradingSignal[] {
    const signals: TradingSignal[] = [];
    
    // Generate signals from price projections
    const priceSignals = this.generatePriceSignals(result.priceProjection);
    signals.push(...priceSignals);
    
    // Generate signals from regime forecasts
    const regimeSignals = this.generateRegimeSignals(result.regimeForecast);
    signals.push(...regimeSignals);
    
    // Generate signals from predictions
    const predictionSignals = this.generatePredictionSignals(result.predictions);
    signals.push(...predictionSignals);
    
    // Filter by confidence
    return signals.filter(s => s.confidence > 0.6);
  }

  private static generatePriceSignals(projections: PricePoint[]): TradingSignal[] {
    const signals: TradingSignal[] = [];
    
    // Find entry points
    for (let i = 1; i < projections.length; i++) {
      const prev = projections[i - 1];
      const curr = projections[i];
      
      // Long signal: expected price increase with tight stop
      if (curr.expectedPrice > prev.expectedPrice * 1.02) {
        signals.push({
          id: crypto.randomUUID(),
          type: 'entry',
          direction: 'long',
          asset: 'BTC',
          entryPrice: prev.expectedPrice,
          stopLoss: prev.expectedPrice * 0.97,
          takeProfit: curr.expectedPrice,
          positionSize: this.calculatePositionSize(curr),
          confidence: this.calculateSignalConfidence(curr),
          timeframe: this.getTimeframe(i),
          rationale: `Projected price increase to ${curr.expectedPrice.toFixed(0)}`,
          riskReward: (curr.expectedPrice - prev.expectedPrice) / (prev.expectedPrice * 0.03)
        });
      }
      
      // Short signal
      if (curr.expectedPrice < prev.expectedPrice * 0.98) {
        signals.push({
          id: crypto.randomUUID(),
          type: 'entry',
          direction: 'short',
          asset: 'BTC',
          entryPrice: prev.expectedPrice,
          stopLoss: prev.expectedPrice * 1.03,
          takeProfit: curr.expectedPrice,
          positionSize: this.calculatePositionSize(curr),
          confidence: this.calculateSignalConfidence(curr),
          timeframe: this.getTimeframe(i),
          rationale: `Projected price decrease to ${curr.expectedPrice.toFixed(0)}`,
          riskReward: (prev.expectedPrice - curr.expectedPrice) / (prev.expectedPrice * 0.03)
        });
      }
    }
    
    return signals;
  }

  private static generateRegimeSignals(forecasts: RegimeForecast[]): TradingSignal[] {
    const signals: TradingSignal[] = [];
    
    forecasts.forEach(forecast => {
      if (forecast.predictedRegime === 'expansion' && forecast.probability > 0.7) {
        // Volatility expansion = straddle or options play
        signals.push({
          id: crypto.randomUUID(),
          type: 'entry',
          direction: 'long',
          asset: 'BTC-VOL',
          entryPrice: 50, // ATM vol
          stopLoss: 40,
          takeProfit: 80,
          positionSize: 0.05,
          confidence: forecast.probability,
          timeframe: forecast.timeframe,
          rationale: `Volatility expansion predicted: ${forecast.catalysts.join(', ')}`,
          riskReward: 3
        });
      }
    });
    
    return signals;
  }

  private static generatePredictionSignals(predictions: MarketPrediction[]): TradingSignal[] {
    // Convert high-confidence predictions to signals
    return predictions
      .filter(p => p.probability > 0.75)
      .map(p => this.predictionToSignal(p));
  }

  private static predictionToSignal(prediction: MarketPrediction): TradingSignal {
    // Implementation
    return {
      id: crypto.randomUUID(),
      type: 'entry',
      direction: prediction.prediction.includes('up') ? 'long' : 'short',
      asset: 'BTC',
      entryPrice: 0,
      stopLoss: 0,
      takeProfit: 0,
      positionSize: prediction.probability * 0.1,
      confidence: prediction.probability,
      timeframe: prediction.timeframe,
      rationale: prediction.prediction,
      riskReward: 2
    };
  }

  private static calculatePositionSize(point: PricePoint): number {
    // Kelly criterion simplified
    const winProb = 0.6; // Simplified
    const winLossRatio = 2; // Simplified
    const kelly = winProb - (1 - winProb) / winLossRatio;
    return Math.min(0.1, Math.max(0.01, kelly * 0.5)); // Half Kelly
  }

  private static calculateSignalConfidence(point: PricePoint): number {
    // Tighter confidence interval = higher confidence
    const range = point.confidenceInterval[1] - point.confidenceInterval[0];
    const midPrice = point.expectedPrice;
    return Math.max(0.5, 1 - range / midPrice);
  }

  private static getTimeframe(index: number): string {
    if (index < 24) return '24h';
    if (index < 72) return '3d';
    return '7d';
  }
}
```

### 7. API Routes

```typescript
// app/api/mirofish/simulate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { mirofish } from '@/lib/mirofish/client';
import { MarketSeedBuilder } from '@/lib/mirofish/seed-builder-market';
import { SentimentSeedBuilder } from '@/lib/mirofish/seed-builder-sentiment';
import { MarketAgentFactory } from '@/lib/mirofish/agent-factory-market';
import { SimulationTrigger, PatternType } from '@/lib/mirofish/types';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const trigger: SimulationTrigger = await req.json();
    
    // 1. Build seed based on pattern type
    let seed;
    switch (trigger.source) {
      case 'volatility_regime_shift':
        seed = MarketSeedBuilder.fromVolatilityRegime(
          trigger.patternData as VolatilityRegimeData,
          await fetchMarketData(trigger.region),
          trigger.userQuery || ''
        );
        break;
        
      case 'sentiment_inflection':
        seed = SentimentSeedBuilder.fromSentimentInflection(
          trigger.patternData as SentimentInflectionData,
          await fetchHistoricalSentiment(trigger.region),
          trigger.userQuery || ''
        );
        break;
        
      case 'whale_clustering':
        // TODO: Implement whale seed builder
        return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
        
      case 'options_flow_anomaly':
        // TODO: Implement options seed builder
        return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
        
      case 'correlation_breakdown':
        // TODO: Implement correlation seed builder
        return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
        
      default:
        return NextResponse.json({ error: 'Unknown pattern type' }, { status: 400 });
    }

    // 2. Generate agent configs based on market condition
    const agents = MarketAgentFactory.forMarketCondition(
      seed.marketState.regime.currentRegime,
      seed.narrative.sentiment.sentiment,
      seed.participants.retail
    );

    // 3. Run simulation
    const result = await mirofish.simulate(seed, {
      duration: 168,  // 7 days in hours
      agentCount: agents.reduce((sum, a) => sum + a.count, 0),
      timeStep: 60,   // 1 hour per step
      parallelRuns: 10,
      scenarios: [
        'continuation',
        'momentum_acceleration',
        'mean_reversion',
        'external_shock'
      ]
    });

    // 4. Generate trading signals
    const signals = TradingSignalGenerator.generate(result);

    return NextResponse.json({
      success: true,
      simulationId: result.id,
      status: result.status,
      signals,
      estimatedCompletion: 300000 // 5 minutes
    });

  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json(
      { error: 'Simulation failed', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

async function fetchMarketData(region: string): Promise<MarketDataFeed> {
  // Fetch from your market data provider
  const response = await fetch(`${process.env.MARKET_DATA_API}/market/${region}`);
  return response.json();
}

async function fetchHistoricalSentiment(region: string): Promise<SentimentInflectionData[]> {
  // Fetch from your sentiment data provider
  const response = await fetch(`${process.env.SENTIMENT_API}/history/${region}`);
  return response.json();
}
```

### 8. UI Components

```tsx
// components/patterns/VolatilityRegimeBadge.tsx

'use client';

import { VolatilityRegimeData } from '@/lib/mirofish/types';

interface Props {
  regime: VolatilityRegimeData;
}

const regimeColors = {
  compression: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  normal: 'bg-green-500/20 text-green-400 border-green-500/30',
  expansion: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  extreme: 'bg-red-500/20 text-red-400 border-red-500/30'
};

const regimeLabels = {
  compression: 'IV Compression',
  normal: 'Normal Vol',
  expansion: 'IV Expansion',
  extreme: 'Extreme Vol'
};

export function VolatilityRegimeBadge({ regime }: Props) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 ${regimeColors[regime.currentRegime]}`}>
      <div className={`h-2 w-2 rounded-full ${
        regime.currentRegime === 'extreme' ? 'animate-pulse bg-red-500' :
        regime.currentRegime === 'expansion' ? 'bg-amber-500' :
        regime.currentRegime === 'compression' ? 'bg-blue-500' : 'bg-green-500'
      }`} />
      <span className="text-sm font-medium">{regimeLabels[regime.currentRegime]}</span>
      <span className="text-xs opacity-60">{regime.ivPercentile.toFixed(0)}th %ile</span>
    </div>
  );
}
```

```tsx
// components/patterns/SentimentVelocityGraph.tsx

'use client';

import { useMemo } from 'react';
import { SentimentInflectionData } from '@/lib/mirofish/types';

interface Props {
  data: SentimentInflectionData[];
  width?: number;
  height?: number;
}

export function SentimentVelocityGraph({ data, width = 400, height = 150 }: Props) {
  const path = useMemo(() => {
    if (data.length < 2) return '';
    
    const maxVelocity = Math.max(...data.map(d => Math.abs(d.velocity)));
    const points = data.map((d, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height / 2 - (d.velocity / maxVelocity) * (height / 2);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  }, [data, width, height]);

  const zeroLine = height / 2;

  return (
    <svg width={width} height={height} className="overflow-visible">
      {/* Zero line */}
      <line 
        x1={0} y1={zeroLine} 
        x2={width} y2={zeroLine} 
        stroke="currentColor" 
        strokeOpacity={0.2}
        strokeDasharray="4"
      />
      
      {/* Velocity path */}
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="text-emerald-500"
      />
      
      {/* Current point */}
      {data.length > 0 && (
        <circle
          cx={width}
          cy={zeroLine - (data[data.length - 1].velocity / Math.max(...data.map(d => Math.abs(d.velocity)))) * (height / 2)}
          r={4}
          className="fill-emerald-500"
        />
      )}
    </svg>
  );
}
```

```tsx
// components/predictions/MarketSimulationTrigger.tsx

'use client';

import { useState } from 'react';
import { PatternDetection } from '@/lib/mirofish/types';

interface Props {
  pattern: PatternDetection;
}

const typeLabels: Record<string, string> = {
  volatility_regime_shift: 'Volatility Regime Shift',
  sentiment_inflection: 'Sentiment Inflection',
  whale_clustering: 'Whale Clustering',
  options_flow_anomaly: 'Options Flow Anomaly',
  correlation_breakdown: 'Correlation Breakdown'
};

const severityColors = {
  low: 'border-slate-500/30 bg-slate-500/10',
  medium: 'border-amber-500/30 bg-amber-500/10',
  high: 'border-orange-500/30 bg-orange-500/10',
  critical: 'border-red-500/30 bg-red-500/10 animate-pulse'
};

export function MarketSimulationTrigger({ pattern }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [simulationId, setSimulationId] = useState<string | null>(null);

  const handleSimulate = async () => {
    setIsLoading(true);
    
    const response = await fetch('/api/mirofish/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        source: pattern.type,
        region: 'crypto',
        timestamp: Date.now(),
        patternData: pattern.data,
        userQuery: getQueryForPattern(pattern)
      })
    });

    const data = await response.json();
    setSimulationId(data.simulationId);
    setIsLoading(false);
  };

  return (
    <div className={`rounded-lg border p-4 ${severityColors[pattern.severity]}`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{typeLabels[pattern.type]}</h4>
          <p className="text-sm opacity-70">
            Confidence: {(pattern.confidence * 100).toFixed(0)}% • 
            Severity: {pattern.severity}
          </p>
        </div>
        <button
          onClick={handleSimulate}
          disabled={isLoading}
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400 disabled:opacity-50"
        >
          {isLoading ? 'Running...' : 'Simulate'}
        </button>
      </div>
      {simulationId && (
        <p className="mt-2 text-xs opacity-50">
          Simulation: {simulationId.slice(0, 8)}...
        </p>
      )}
    </div>
  );
}

function getQueryForPattern(pattern: PatternDetection): string {
  const queries: Record<string, string> = {
    volatility_regime_shift: 'Predict price path and optimal options strategy for this IV regime change',
    sentiment_inflection: 'Predict narrative lifecycle and market impact of this sentiment shift',
    whale_clustering: 'Predict market impact if this whale cluster executes coordinated movement',
    options_flow_anomaly: 'Predict underlying price movement based on unusual options flow',
    correlation_breakdown: 'Predict which assets will lead/lag in this correlation regime change'
  };
  return queries[pattern.type] || 'Predict market outcomes';
}
```

---

## Environment Configuration

```bash
# .env.local

# MiroFish Configuration
MIROFISH_API_URL=http://localhost:8000
MIROFISH_API_KEY=your-api-key
MIROFISH_TIMEOUT=300000

# Market Data APIs
MARKET_DATA_API=https://api.coinalyze.net
COINGECKO_API_KEY=your-key
AMBERDATA_API_KEY=your-key

# Sentiment Data
SENTIMENT_API=https://api.lunarcrush.com
LUNARCRUSH_API_KEY=your-key
TWITTER_BEARER_TOKEN=your-token

# On-Chain
ALCHEMY_API_KEY=your-key
ARKHAM_API_KEY=your-key

# Simulation Defaults
DEFAULT_SIMULATION_HOURS=168  # 7 days
DEFAULT_TIMESTEP_MINUTES=60
PARALLEL_RUNS=10

# Pattern Detection
VOLATILITY_HISTORY_DAYS=90
SENTIMENT_HISTORY_HOURS=168
WHALE_THRESHOLD_USD=1000000

# Auto-trigger
AUTO_TRIGGER_ENABLED=true
AUTO_TRIGGER_CONFIDENCE_THRESHOLD=0.75
AUTO_TRIGGER_SEVERITY_THRESHOLD='high'

# Cache
SIMULATION_CACHE_TTL=1800  # 30 minutes
UPSTASH_REDIS_URL=...
UPSTASH_REDIS_TOKEN=...
```

---

## BrowserOS Widget Spec (Updated)

```typescript
// lib/widget/config.ts

export const WIDGET_CONFIG = {
  id: 'war-room-bruce-market-v1',
  name: 'War Room Market Intelligence',
  description: 'Real-time market prediction via multi-agent simulation',
  
  capabilities: [
    {
      id: 'volatility-prediction',
      name: 'Volatility Regime Forecast',
      description: 'Predict IV expansion/compression with options strategy',
      price: 0.001,
      currency: 'SOL',
      timeEstimate: 180000,  // 3 minutes
      inputSchema: {
        asset: { type: 'string', enum: ['BTC', 'ETH', 'SOL'] },
        timeframe: { type: 'string', enum: ['24h', '3d', '7d'] }
      }
    },
    {
      id: 'sentiment-lifecycle',
      name: 'Narrative Lifecycle Prediction',
      description: 'Predict sentiment peak and decay timing',
      price: 0.0005,
      currency: 'SOL',
      timeEstimate: 120000,
      inputSchema: {
        narrative: { type: 'string' },
        platform: { type: 'string', enum: ['twitter', 'reddit', 'combined'] }
      }
    },
    {
      id: 'whale-impact',
      name: 'Whale Movement Impact',
      description: 'Simulate market impact of identified whale cluster',
      price: 0.0015,
      currency: 'SOL',
      timeEstimate: 240000,
      inputSchema: {
        clusterId: { type: 'string' },
        hypotheticalAction: { type: 'string', enum: ['buy', 'sell', 'hold'] }
      }
    },
    {
      id: 'correlation-shift',
      name: 'Cross-Asset Correlation Breakdown',
      description: 'Predict leaders/laggards in regime change',
      price: 0.001,
      currency: 'SOL',
      timeEstimate: 180000,
      inputSchema: {
        baseAsset: { type: 'string' },
        correlatedAssets: { type: 'array', items: { type: 'string' } }
      }
    }
  ],
  
  reputation: {
    score: 4.7,
    totalReviews: 1847,
    avgReturnAttribution: 0.12,  // 12% average signal return
    sharpeRatio: 1.8,
    uptime: 99.95
  }
};
```

---

## Success Metrics (Updated)

- [ ] Pattern detection latency < 5 minutes from data arrival
- [ ] Simulation completion < 5 minutes for 7-day projection
- [ ] Signal win rate > 55% (breakeven with fees)
- [ ] Average signal return > 2% per trade
- [ ] Sharpe ratio > 1.5 for signal portfolio
- [ ] User trade execution rate > 40% of generated signals
- [ ] BrowserOS widget daily queries > 50

---

## Implementation Checklist

### Phase 1: Data Infrastructure
- [ ] Integrate CoinGecko/Amberdata for market data
- [ ] Set up LunarCrush for sentiment
- [ ] Connect Arkham for on-chain whale tracking
- [ ] Build data normalization layer

### Phase 2: Pattern Detection
- [ ] Implement VolatilityRegimeDetector
- [ ] Implement SentimentInflectionDetector
- [ ] Implement WhaleClusteringEngine
- [ ] Build pattern correlation engine

### Phase 3: Simulation Layer
- [ ] Deploy MiroFish locally
- [ ] Build MarketSeedBuilder
- [ ] Configure MarketAgentFactory
- [ ] Create simulation result parser

### Phase 4: Signal Generation
- [ ] Build TradingSignalGenerator
- [ ] Implement backtest validation
- [ ] Create confidence calibration
- [ ] Build P&L attribution tracking

### Phase 5: UI/UX
- [ ] Pattern detection dashboard
- [ ] Signal feed with execution buttons
- [ ] Backtest performance visualization
- [ ] BrowserOS widget integration

### Phase 6: Monetization
- [ ] Solana payment integration
- [ ] ZK attestation for signals
- [ ] Reputation system
- [ ] Molt.id treasury hook

---

*War Room evolves from crisis monitor to continuous alpha generator.*
