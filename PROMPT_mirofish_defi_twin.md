# DeFi Protocol Twin — MiroFish Integration Spec

## Overview

Simulate decentralized finance protocols as multi-agent systems. Predict yield, detect cascades, optimize positions, front-run risks.

**Version**: 1.0  
**Status**: Implementation Ready  
**Dependencies**: MiroFish, On-Chain Indexers (Alchemy/Infura), DEX Data (The Graph), Mempool Monitor

---

## Why DeFi Twin Beats Static Yield Farming

| Static Approach | DeFi Twin Simulation |
|-----------------|---------------------|
| "APY is 12%, deposit now" | "Simulating 1000 LPs... 73% chance IL exceeds yield in 7 days" |
| "Health factor 1.5, safe" | "Whale cluster detected. Liquidation cascade risk: 34%" |
| "Governance vote passes" | "Simulating delegate behavior... Proposal fails quorum" |
| "Gas is 50 gwei" | "MEV bot simulation: Sandwich risk high for this trade" |

**Agents = Protocol participants. Simulation = Stress test your position.**

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DEFI TWIN: PROTOCOL SIMULATION                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LAYER 1: ON-CHAIN DATA INGESTION                                           │
│  ├── DEX Liquidity Pools                                                    │
│  │   ├── Reserves (token0, token1 balances)                                 │
│  │   ├── Virtual reserves (concentrated liquidity)                          │
│  │   ├── 24h Volume (directional flow)                                      │
│  │   ├── Fees accumulated (yield calc)                                      │
│  │   └── LP positions (active ranges, tick distribution)                    │
│  ├── Lending Protocols (Aave/Compound/Spark)                                │
│  │   ├── Total supply/borrow per asset                                      │
│  │   ├── Utilization rates (interest model)                                 │
│  │   ├── Collateral factors and thresholds                                  │
│  │   ├── Liquidation thresholds per wallet                                  │
│  │   └── Reserve factors and protocol fees                                  │
│  ├── Mempool (Pending Transactions)                                         │
│  │   ├── Swap transactions (size, slippage tolerance)                       │
│  │   ├── Liquidation transactions (profitable vs not)                       │
│  │   ├── Arbitrage opportunities (CEX-DEX spreads)                          │
│  │   └── Sandwich targets (large trades, high slippage)                     │
│  ├── Yield Aggregators (Yearn/Convex)                                       │
│  │   ├── Strategy allocations (vault composition)                           │
│  │   ├── Reward token prices and emissions                                  │
│  │   └── Boost multipliers (veTokenomics)                                   │
│  └── Governance (Snapshot/on-chain)                                         │
│      ├── Proposal parameters (quorum, threshold)                            │
│      ├── Current votes (for/against/abstain)                                │
│      ├── Delegation patterns (power concentration)                          │
│      └── Voting history (delegate behavior)                                 │
│                              ↓                                              │
│  LAYER 2: DEFI PATTERN DETECTION                                            │
│  ├── ImpermanentLossRisk: Price divergence + LP concentration               │
│  ├── LiquidationCascadeDetector: Clustered positions near threshold         │
│  ├── YieldOppportunityFinder: Mispriced rewards vs risk                     │
│  ├── MEVThreatAnalyzer: Sandwich/latency arb exposure                       │
│  ├── GovernanceAttackDetector: Flash loan voting, delegate bribery          │
│  └── CorrelationBreakdown: Stablecoin depeg, oracle failure                 │
│                              ↓                                              │
│  LAYER 3: PROTOCOL STATE SEED CONSTRUCTION                                  │
│  ├── PoolState: Liquidity depth, tick distribution, volatility              │
│  ├── MarketParticipants: LP positions, borrowing collateral                 │
│  ├── EconomicEnvironment: Gas prices, ETH price, stable pegs                │
│  ├── MEVLandscape: Bot counts, strategies, profitability                    │
│  └── GovernancePower: Token distribution, delegate alignment                │
│                              ↓                                              │
│  LAYER 4: DEFI SIMULATION (MiroFish Core)                                   │
│  ├── AgentFactory: Spawn DeFi participants                                  │
│  │   ├── LP agents (10,000) - Passive, active, concentrated                 │
│  │   ├── Borrower agents (5,000) - Leverage longs, shorts, farmers          │
│  │   ├── Arbitrageur agents (500) - CEX-DEX, cross-DEX, latency             │
│  │   ├── MEV bots (200) - Sandwich, frontrun, backrun, liquidation          │
│  │   ├── Liquidator agents (100) - Profit-seeking, coordinated              │
│  │   └── Governance agents (50) - Token holders, delegates, voters           │
│  ├── Timeline: 24h-30d protocol evolution                                   │
│  ├── ShockInjection: "What if ETH drops 20%?" "What if whale exits?"        │
│  └── EmergenceTracking: Cascade detection, death spiral modeling            │
│                              ↓                                              │
│  LAYER 5: DEFI SIGNAL SYNTHESIS                                             │
│  ├── YieldOptimization: Optimal pool, range, timing                         │
│  ├── RiskManagement: IL hedging, collateral buffers, exits                  │
│  ├── ArbitrageSignals: Profitable trades with execution path                │
│  ├── MEVProtection: Slippage optimization, timing strategies                │
│  └── GovernanceInsights: Vote timing, delegation strategies                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Types (DeFi Participants)

### 1. LP Agents (10,000)
**Subtypes:**
- **Passive LPs** (40%): Deposit full range, hold forever
- **Active LPs** (30%): Rebalance when IL > threshold
- **Concentrated LPs** (25%): Narrow ranges, chase fees
- **Trend LPs** (5%): Shift ranges based on price prediction

**Behavior:**
- Enter/exit based on APY vs holding
- Rebalance when fees < IL
- Panic exit if price moves out of range

**Capital:** $1K - $10M (power law)

### 2. Borrower Agents (5,000)
**Subtypes:**
- **Leverage Longs** (35%): Borrow stables, buy ETH
- **Leverage Shorts** (20%): Borrow ETH, sell for stables
- **Yield Farmers** (30%): Recursive borrowing for points/APY
- **Loopers** (15%): Supply → Borrow → Resupply cycles

**Behavior:**
- Add collateral if health factor drops
- Get liquidated if threshold breached
- Close positions if funding rates turn

**Health Factor Awareness:** 0.1 - 0.9 (risk tolerance distribution)

### 3. Arbitrageur Agents (500)
**Subtypes:**
- **CEX-DEX** (40%): Binance vs Uniswap spreads
- **Cross-DEX** (35%): Uni vs Curve vs Balancer
- **Latency** (15%): Block inclusion optimization
- **Cross-chain** (10%): Bridge arbitrage

**Behavior:**
- Execute when spread > gas + slippage
- Compete on gas price for inclusion
- Withdraw if competition too high

### 4. MEV Bots (200)
**Subtypes:**
- **Sandwich Bots** (30%): Target large swaps
- **Frontrunners** (25%): Copy profitable txs
- **Backrunners** (20%): Atomic arb after target
- **JIT Liquidity** (15%): Just-in-time LP for fees
- **Liquidation Bots** (10%): Protocol liquidations

**Behavior:**
- Monitor mempool for opportunities
- Bid gas auction for inclusion
- Coordinate (sometimes) for larger extract

### 5. Liquidator Agents (100)
**Subtypes:**
- **Solo Liquidators** (60%): Individual profit seekers
- **Coordination Pools** (30%): Flash loan aggregators
- **Protocol-Aligned** (10%): Backstop liquidators (e.g., Maker)

**Behavior:**
- Monitor health factors in real-time
- Execute when bonus > gas + slippage
- Strategic: wait for cascade for better prices

### 6. Governance Agents (50)
**Subtypes:**
- **Retail Voters** (40%): Small holders, emotional voting
- **Protocol Whales** (25%): Team/investor aligned
- **Delegates** (20%): Professional vote managers
- **Attackers** (10%): Profit-seeking governance extractors
- **Abstainers** (5%): Don't participate

**Behavior:**
- Vote based on incentive alignment
- Delegate if gas cost > vote value
- Coordinate for proposals (bribery markets)

---

## File Structure

```
lib/
├── mirofish/
│   └── defi/
│       ├── client.ts                    # DeFi-specific MiroFish client
│       ├── types.ts                     # DeFi interfaces
│       ├── seed-builder-defi.ts         # Convert on-chain state to sim seed
│       ├── agent-factory-defi.ts        # DeFi agent configurations
│       ├── pattern-detectors.ts         # IL, cascade, MEV detection
│       ├── signal-synthesizer.ts        # Generate yield/risk/arbitrage signals
│       └── result-parser-defi.ts        # Parse sim to actionable DeFi strategy
├── onchain/
│   ├── pool-monitor.ts                  # Uniswap/Curve pool state tracking
│   ├── lending-monitor.ts               # Aave/Compound position tracking
│   ├── mempool-scanner.ts               # Pending transaction analysis
│   ├── oracle-tracker.ts                # Price feed monitoring
│   └── governance-tracker.ts            # Proposal/delegate tracking
├── defi-patterns/
│   ├── impermanent-loss.ts              # IL risk calculation
│   ├── liquidation-cascade.ts           # Clustered liquidation detection
│   ├── yield-opportunity.ts             # Risk-adjusted yield ranking
│   ├── mev-exposure.ts                  # Sandwich/arb threat analysis
│   ├── governance-attack.ts             # Flash loan voting detection
│   └── stable-depeg.ts                  # Stablecoin risk monitoring
├── strategies/
│   ├── yield-optimizer.ts               # Optimal LP position calculation
│   ├── liquidation-protector.ts         # Collateral management
│   ├── arbitrage-executor.ts            # Arb path execution
│   └── mev-defense.ts                   # Slippage/timing optimization
└── api/
    └── defi/
        ├── simulate/route.ts            # Run DeFi simulation
        ├── pools/route.ts               # Pool state endpoint
        ├── positions/route.ts           # User position analysis
        ├── signals/route.ts             # Trading signals
        └── risks/route.ts               # Risk warnings

app/
├── (dashboard)/
│   ├── warroom/                         # Existing
│   └── defi-twin/                       # NEW: DeFi simulation
│       ├── page.tsx
│       ├── PoolMonitor.tsx              # Live pool states
│       ├── PositionRiskCard.tsx         # Your position risk
│       ├── SimulationControl.tsx        # Run what-if scenarios
│       ├── YieldOptimizer.tsx           # Optimal yield strategies
│       ├── MEVShield.tsx                # MEV protection settings
│       └── GovernanceRadar.tsx          # Proposal monitoring
└── components/
    └── defi/
        ├── ILCalculator.tsx             # Impermanent loss viz
        ├── LiquidationHeatmap.tsx       # Protocol health map
        ├── YieldComparisonChart.tsx     # APY risk-adjusted
        ├── MempoolThreatRadar.tsx       # Pending tx threats
        ├── GovernancePowerMap.tsx       # Vote distribution
        └── CascadeWarning.tsx           # Liquidation cascade alert

integrations/
└── blockchain/
    ├── uniswap-subgraph.ts              # The Graph queries
    ├── aave-data-provider.ts            # Aave protocol data
    ├── ethers-provider.ts               # RPC connection
    └── flashbots-protect.ts             # MEV protection rpc
```

---

## Type Definitions

```typescript
// lib/mirofish/defi/types.ts

// === ON-CHAIN STATE ===

interface PoolState {
  address: string;
  protocol: 'uniswap-v3' | 'curve' | 'balancer' | 'camelot';
  token0: Token;
  token1: Token;
  
  // Liquidity
  totalLiquidity: bigint;
  liquidityDistribution: TickLiquidity[];
  activeLiquidity: bigint;
  
  // Pricing
  spotPrice: number;
  priceRange24h: [number, number];
  volatility24h: number;  // Annualized
  
  // Volume
  volume24h: bigint;
  fees24h: bigint;
  feeTier: number;  // 0.05%, 0.3%, etc.
  
  // Participants
  lpCount: number;
  topLPs: LPPosition[];
}

interface Token {
  address: string;
  symbol: string;
  decimals: number;
  priceUSD: number;
  isStable: boolean;
}

interface TickLiquidity {
  tick: number;
  price: number;
  liquidityNet: bigint;
}

interface LPPosition {
  owner: string;
  tickLower: number;
  tickUpper: number;
  liquidity: bigint;
  token0Amount: bigint;
  token1Amount: bigint;
  uncollectedFees: [bigint, bigint];
  entryPrice: number;
}

interface LendingMarketState {
  protocol: 'aave-v3' | 'compound-v3' | 'spark';
  asset: Token;
  
  // Supply/Borrow
  totalSupply: bigint;
  totalBorrow: bigint;
  utilization: number;  // 0-1
  
  // Rates
  supplyAPY: number;
  borrowAPY: number;
  
  // Risk params
  ltv: number;  // Loan-to-value
  liquidationThreshold: number;
  liquidationBonus: number;
  
  // Positions
  positions: BorrowPosition[];
}

interface BorrowPosition {
  owner: string;
  collateral: Collateral[];
  borrows: Borrow[];
  healthFactor: number;
  liquidationPrice: number;  // For leveraged positions
}

interface Collateral {
  asset: Token;
  amount: bigint;
  valueUSD: number;
}

interface Borrow {
  asset: Token;
  amount: bigint;
  valueUSD: number;
  borrowRate: number;
}

interface MempoolState {
  pendingSwaps: PendingSwap[];
  pendingLiquidations: PendingLiquidation[];
  gasPrice: bigint;
  baseFee: bigint;
}

interface PendingSwap {
  hash: string;
  pool: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
  minAmountOut: bigint;
  slippageTolerance: number;
  gasPrice: bigint;
}

interface PendingLiquidation {
  hash: string;
  protocol: string;
  borrower: string;
  collateralAsset: string;
  debtAsset: string;
  repayAmount: bigint;
  collateralReward: bigint;
  profitUSD: number;
}

interface GovernanceState {
  protocol: string;
  proposalId: string;
  
  // Parameters
  quorum: bigint;
  threshold: number;  // % needed to pass
  
  // Current state
  votesFor: bigint;
  votesAgainst: bigint;
  votesAbstain: bigint;
  
  // Timeline
  startBlock: number;
  endBlock: number;
  currentBlock: number;
  
  // Delegates
  delegates: Delegate[];
  tokenDistribution: TokenHolder[];
}

interface Delegate {
  address: string;
  votingPower: bigint;
  voted: boolean;
  voteChoice?: 'for' | 'against' | 'abstain';
  alignment: 'aligned' | 'contrarian' | 'unknown';
}

// === DEFI PATTERNS ===

type DeFiPatternType =
  | 'impermanent_loss_risk'
  | 'liquidation_cascade'
  | 'yield_opportunity'
  | 'mev_threat'
  | 'governance_attack'
  | 'stable_depeg'
  | 'oracle_manipulation';

interface DeFiPatternDetection {
  id: string;
  type: DeFiPatternType;
  timestamp: number;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedPools?: string[];
  affectedPositions?: string[];
  estimatedImpactUSD: number;
  data: DeFiPatternData;
}

type DeFiPatternData =
  | ILRiskData
  | LiquidationCascadeData
  | YieldOppData
  | MEVThreatData
  | GovernanceAttackData
  | StableDepegData;

interface ILRiskData {
  pool: string;
  token0: string;
  token1: string;
  currentPrice: number;
  entryPrice: number;
  priceDeviation: number;  // % from entry
  ilPercent: number;  // Current IL
  projectedIL7d: number;  // Simulated IL
  feeIncome7d: number;  // Expected fees
  netReturn7d: number;  // Fees - IL
  recommendation: 'hold' | 'rebalance' | 'exit';
}

interface LiquidationCascadeData {
  protocol: string;
  asset: string;
  cascadeTriggerPrice: number;
  affectedPositions: number;
  totalCollateralAtRisk: number;  // USD
  liquidationBonus: number;
  estimatedProfitForLiquidators: number;
  cascadeDepth: number;  // How many rounds of cascading
  timeToTrigger: number;  // Minutes until trigger price
}

interface YieldOppData {
  pool: string;
  baseAPY: number;
  rewardAPY: number;
  totalAPY: number;
  riskScore: number;  // 0-100
  ilRisk: number;
  smartContractRisk: number;
  tvl: number;
  capacityRemaining: number;
  optimalPositionSize: number;  // For your capital
  timeToOptimalEntry: number;  // When gas/fees make sense
}

interface MEVThreatData {
  threatType: 'sandwich' | 'frontrun' | 'backrun' | 'jit';
  targetPool: string;
  yourTradeSize: number;
  estimatedSlippage: number;
  estimatedMEVExtract: number;
  protectionStrategy: 'flashbots' | 'slippage' | 'timing' | 'split';
  safeSlippage: number;
}

interface GovernanceAttackData {
  proposalId: string;
  attackType: 'flash_loan' | 'delegate_bribe' | 'quorum_manipulation';
  attackerCapital: number;
  attackCost: number;
  potentialProfit: number;
  currentVoteSwing: number;
  timeRemainingBlocks: number;
  defenseRecommendation: string;
}

interface StableDepegData {
  stablecoin: string;
  currentPrice: number;
  pegDeviation: number;  // %
  poolLiquidity: number;
  curveHealth: number;  // Pool imbalance
  redemptionPressure: number;  // Outflows
  confidence: number;
  historicalPrecedent: string;  // Similar events
}

// === SIMULATION INPUT ===

interface DeFiSimulationSeed {
  pools: PoolState[];
  lendingMarkets: LendingMarketState[];
  mempool: MempoolState;
  governance?: GovernanceState;
  
  environment: {
    ethPrice: number;
    gasPrice: bigint;
    blockNumber: number;
    timestamp: number;
  };
  
  userPosition?: {
    lpPositions: LPPosition[];
    borrowPositions: BorrowPosition[];
    tokenBalances: TokenBalance[];
  };
  
  shockScenario?: ShockScenario;
  query: string;
}

interface TokenBalance {
  token: Token;
  balance: bigint;
}

interface ShockScenario {
  type: 'price_drop' | 'price_pump' | 'whale_exit' | 'gas_spike' | 'oracle_failure';
  magnitude: number;  // % or bps
  targetAsset?: string;
  duration: number;  // Minutes
}

// === AGENT CONFIGURATION ===

interface DeFiAgentConfig {
  role: 'lp' | 'borrower' | 'arbitrageur' | 'mev_bot' | 'liquidator' | 'governance';
  count: number;
  capitalDistribution: CapitalDistribution;
  behaviorParams: DeFiBehaviorParams;
  strategyWeights: DeFiStrategyWeights;
}

interface DeFiBehaviorParams {
  riskTolerance: number;  // 0-1
  profitThreshold: number;  // Minimum profit to act (bps)
  reactionSpeed: number;  // Seconds to react
  coordinationBias: number;  // Likelihood to act with others
  informationDelay: number;  // Seconds behind real-time
}

interface DeFiStrategyWeights {
  passiveHolding: number;
  activeManagement: number;
  speculation: number;
  arbitrage: number;
  mevExtraction: number;
}

// === SIMULATION OUTPUT ===

interface DeFiSimulationResult {
  id: string;
  status: 'running' | 'completed';
  
  timeline: DeFiStatePoint[];
  predictions: DeFiPrediction[];
  signals: DeFiSignal[];
  risks: DeFiRiskWarning[];
  
  // User-specific
  yourPositionImpact?: PositionImpact;
  optimalStrategy?: StrategyRecommendation;
  
  confidence: number;
  backtestAccuracy?: number;
}

interface DeFiStatePoint {
  timestamp: number;
  blockNumber: number;
  
  pools: PoolState[];
  lendingMarkets: LendingMarketState[];
  
  // Aggregated metrics
  totalLiquidations: number;
  totalLiquidationVolume: bigint;
  mevExtracted: bigint;
  arbitrageVolume: bigint;
}

interface DeFiPrediction {
  type: 'price' | 'apy' | 'liquidation' | 'impermanent_loss' | 'governance';
  prediction: string;
  probability: number;
  timeframe: string;
  affectedAssets: string[];
  confidence: number;
}

interface DeFiSignal {
  id: string;
  type: 'enter_position' | 'exit_position' | 'rebalance' | 'hedge' | 'claim';
  protocol: string;
  pool?: string;
  
  // Position details
  action: string;
  expectedReturn: number;  // APY or absolute
  riskScore: number;
  confidence: number;
  
  // Execution
  suggestedGasPrice: bigint;
  deadline: number;  // Block number
  
  rationale: string;
}

interface DeFiRiskWarning {
  type: 'liquidation_risk' | 'il_risk' | 'smart_contract' | 'oracle' | 'governance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedPosition?: string;
  mitigation: string;
  timeToImpact?: number;
}

interface PositionImpact {
  currentValueUSD: number;
  projectedValueUSD: number;
  pnl: number;
  ilIncurred: number;
  feesEarned: number;
  liquidated: boolean;
}

interface StrategyRecommendation {
  currentStrategy: string;
  recommendedStrategy: string;
  expectedImprovement: number;  // % better return or risk
  steps: string[];
}
```

---

## Core Implementation

### 1. Pattern Detectors

```typescript
// lib/defi-patterns/liquidation-cascade.ts

import { LendingMarketState, LiquidationCascadeData, DeFiPatternDetection } from './types';

export class LiquidationCascadeDetector {
  
  analyze(market: LendingMarketState, ethPrice: number): DeFiPatternDetection | null {
    // Find clustered positions near liquidation
    const vulnerablePositions = market.positions.filter(
      p => p.healthFactor < 1.2 && p.healthFactor > 1.0
    );
    
    if (vulnerablePositions.length < 5) return null;
    
    // Sort by liquidation price
    const sortedByLiqPrice = vulnerablePositions.sort(
      (a, b) => a.liquidationPrice - b.liquidationPrice
    );
    
    // Find cascade trigger (lowest liquidation price among cluster)
    const triggerPrice = sortedByLiqPrice[0].liquidationPrice;
    
    // Calculate how many positions liquidate at each price level
    const priceLevels: Map<number, number> = new Map();
    vulnerablePositions.forEach(pos => {
      const count = priceLevels.get(pos.liquidationPrice) || 0;
      priceLevels.set(pos.liquidationPrice, count + pos.collateral[0].valueUSD);
    });
    
    // Calculate cascade depth
    let cascadeDepth = 0;
    let currentPrice = triggerPrice;
    const sortedPrices = Array.from(priceLevels.keys()).sort((a, b) => a - b);
    
    for (const price of sortedPrices) {
      if (price <= currentPrice * 1.05) {  // Within 5% cascade zone
        cascadeDepth++;
        currentPrice = price;
      } else {
        break;
      }
    }
    
    if (cascadeDepth < 3) return null;
    
    const totalAtRisk = vulnerablePositions.reduce(
      (sum, p) => sum + p.collateral.reduce((c, col) => c + col.valueUSD, 0),
      0
    );
    
    const data: LiquidationCascadeData = {
      protocol: market.protocol,
      asset: market.asset.symbol,
      cascadeTriggerPrice: triggerPrice,
      affectedPositions: vulnerablePositions.length,
      totalCollateralAtRisk: totalAtRisk,
      liquidationBonus: market.liquidationBonus,
      estimatedProfitForLiquidators: totalAtRisk * market.liquidationBonus,
      cascadeDepth,
      timeToTrigger: this.estimateTimeToPrice(ethPrice, triggerPrice)
    };
    
    return {
      id: crypto.randomUUID(),
      type: 'liquidation_cascade',
      timestamp: Date.now(),
      confidence: this.calculateConfidence(data),
      severity: cascadeDepth > 5 ? 'critical' : cascadeDepth > 3 ? 'high' : 'medium',
      affectedPools: [],
      affectedPositions: vulnerablePositions.map(p => p.owner),
      estimatedImpactUSD: totalAtRisk,
      data
    };
  }
  
  private estimateTimeToPrice(currentPrice: number, targetPrice: number): number {
    // Simple volatility-based estimate
    // In reality, would use option implied volatility
    const dailyVol = 0.03;  // 3% daily vol assumption
    const priceDistance = Math.abs(currentPrice - targetPrice) / currentPrice;
    const daysToTarget = priceDistance / dailyVol;
    return daysToTarget * 24 * 60;  // Convert to minutes
  }
  
  private calculateConfidence(data: LiquidationCascadeData): number {
    let confidence = 0.6;
    
    // Higher confidence with more positions
    confidence += Math.min(0.2, data.affectedPositions / 100);
    
    // Higher confidence if cascade is deeper
    confidence += Math.min(0.15, data.cascadeDepth / 20);
    
    // Higher confidence if closer to trigger
    if (data.timeToTrigger < 60) confidence += 0.05;
    
    return Math.min(0.95, confidence);
  }
}
```

```typescript
// lib/defi-patterns/impermanent-loss.ts

import { PoolState, LPPosition, ILRiskData } from './types';

export class ILRiskCalculator {
  
  analyze(pool: PoolState, position: LPPosition): ILRiskData {
    const currentPrice = pool.spotPrice;
    const entryPrice = position.entryPrice;
    
    // Calculate current IL
    const priceRatio = currentPrice / entryPrice;
    const ilCurrent = this.calculateIL(priceRatio);
    
    // Simulate future IL (simplified - would use MiroFish)
    const volatility = pool.volatility24h;
    const projectedPriceRange = [
      currentPrice * (1 - volatility * Math.sqrt(7)),
      currentPrice * (1 + volatility * Math.sqrt(7))
    ];
    
    const ilWorstCase = this.calculateIL(projectedPriceRange[0] / entryPrice);
    const ilBestCase = this.calculateIL(projectedPriceRange[1] / entryPrice);
    const projectedIL7d = (ilWorstCase + ilBestCase) / 2;
    
    // Estimate fees
    const feeIncome7d = this.estimateFees(pool, position, 7);
    
    const netReturn = feeIncome7d - projectedIL7d;
    
    return {
      pool: pool.address,
      token0: pool.token0.symbol,
      token1: pool.token1.symbol,
      currentPrice,
      entryPrice,
      priceDeviation: Math.abs(priceRatio - 1) * 100,
      ilPercent: ilCurrent * 100,
      projectedIL7d: projectedIL7d * 100,
      feeIncome7d: feeIncome7d * 100,
      netReturn7d: netReturn * 100,
      recommendation: netReturn > 0.05 ? 'hold' : 
                      netReturn > 0 ? 'rebalance' : 'exit'
    };
  }
  
  private calculateIL(priceRatio: number): number {
    // IL formula: 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
    return 2 * Math.sqrt(priceRatio) / (1 + priceRatio) - 1;
  }
  
  private estimateFees(pool: PoolState, position: LPPosition, days: number): number {
    // Daily fee rate = volume * feeTier / TVL
    const dailyFeeRate = (Number(pool.volume24h) * pool.feeTier) / Number(pool.totalLiquidity);
    const yourShare = Number(position.liquidity) / Number(pool.activeLiquidity);
    
    return dailyFeeRate * days * yourShare;
  }
}
```

### 2. DeFi Seed Builder

```typescript
// lib/mirofish/defi/seed-builder-defi.ts

import { 
  PoolState, 
  LendingMarketState, 
  MempoolState, 
  DeFiSimulationSeed,
  ShockScenario 
} from './types';

export class DeFiSeedBuilder {
  
  static fromChainState(
    pools: PoolState[],
    lendingMarkets: LendingMarketState[],
    mempool: MempoolState,
    userPosition: UserPosition,
    shock?: ShockScenario,
    query: string
  ): DeFiSimulationSeed {
    return {
      pools: pools.map(p => this.sanitizePool(p)),
      lendingMarkets: lendingMarkets.map(m => this.sanitizeMarket(m)),
      mempool: this.sanitizeMempool(mempool),
      environment: {
        ethPrice: this.getETHPrice(pools),
        gasPrice: mempool.gasPrice,
        blockNumber: 0,  // Current
        timestamp: Date.now()
      },
      userPosition,
      shockScenario: shock,
      query
    };
  }
  
  private static sanitizePool(pool: PoolState): PoolState {
    // Sanitize for simulation - remove PII, keep economic relevant data
    return {
      ...pool,
      // Anonymize LP owners
      topLPs: pool.topLPs.map((lp, i) => ({
        ...lp,
        owner: `lp-${i}`
      }))
    };
  }
  
  private static sanitizeMarket(market: LendingMarketState): LendingMarketState {
    return {
      ...market,
      positions: market.positions.slice(0, 100).map((p, i) => ({
        ...p,
        owner: `borrower-${i}`
      }))
    };
  }
  
  private static sanitizeMempool(mempool: MempoolState): MempoolState {
    return mempool;  // Already anonymized
  }
  
  private static getETHPrice(pools: PoolState[]): number {
    const ethPool = pools.find(p => 
      (p.token0.symbol === 'WETH' && p.token1.symbol === 'USDC') ||
      (p.token1.symbol === 'WETH' && p.token0.symbol === 'USDC')
    );
    if (!ethPool) return 3000;
    return ethPool.token0.symbol === 'WETH' ? 
      ethPool.spotPrice : 1 / ethPool.spotPrice;
  }
}
```

### 3. DeFi Agent Factory

```typescript
// lib/mirofish/defi/agent-factory-defi.ts

import { DeFiAgentConfig, PoolState, LendingMarketState } from './types';

export class DeFiAgentFactory {
  
  static forDeFiState(
    pools: PoolState[],
    markets: LendingMarketState[],
    volatility: number
  ): DeFiAgentConfig[] {
    return [
      this.createLPAgents(pools, volatility),
      this.createBorrowerAgents(markets, volatility),
      this.createArbitrageurAgents(pools),
      this.createMEVBots(pools, volatility),
      this.createLiquidatorAgents(markets),
      this.createGovernanceAgents()
    ];
  }
  
  private static createLPAgents(pools: PoolState[], volatility: number): DeFiAgentConfig {
    const totalTVL = pools.reduce((sum, p) => sum + Number(p.totalLiquidity), 0);
    
    return {
      role: 'lp',
      count: 10000,
      capitalDistribution: {
        min: 1000,
        max: 10000000,
        distribution: 'power_law'
      },
      behaviorParams: {
        riskTolerance: volatility > 0.8 ? 0.3 : 0.6,
        profitThreshold: 0.001,  // 0.1%
        reactionSpeed: 300,  // 5 minutes
        coordinationBias: 0.2,
        informationDelay: 60
      },
      strategyWeights: {
        passiveHolding: 0.4,
        activeManagement: 0.4,
        speculation: 0.1,
        arbitrage: 0,
        mevExtraction: 0
      }
    };
  }
  
  private static createBorrowerAgents(markets: LendingMarketState[], volatility: number): DeFiAgentConfig {
    return {
      role: 'borrower',
      count: 5000,
      capitalDistribution: {
        min: 5000,
        max: 50000000,
        distribution: 'power_law'
      },
      behaviorParams: {
        riskTolerance: volatility > 0.8 ? 0.2 : 0.5,
        profitThreshold: 0.005,
        reactionSpeed: 600,  // 10 minutes
        coordinationBias: 0.3,
        informationDelay: 120
      },
      strategyWeights: {
        passiveHolding: 0.1,
        activeManagement: 0.3,
        speculation: 0.5,
        arbitrage: 0,
        mevExtraction: 0
      }
    };
  }
  
  private static createArbitrageurAgents(pools: PoolState[]): DeFiAgentConfig {
    return {
      role: 'arbitrageur',
      count: 500,
      capitalDistribution: {
        min: 50000,
        max: 5000000,
        distribution: 'normal'
      },
      behaviorParams: {
        riskTolerance: 0.1,
        profitThreshold: 0.0005,  // 5 bps
        reactionSpeed: 1,  // 1 second
        coordinationBias: 0.1,
        informationDelay: 0
      },
      strategyWeights: {
        passiveHolding: 0,
        activeManagement: 0.1,
        speculation: 0.1,
        arbitrage: 0.8,
        mevExtraction: 0
      }
    };
  }
  
  private static createMEVBots(pools: PoolState[], volatility: number): DeFiAgentConfig {
    return {
      role: 'mev_bot',
      count: 200,
      capitalDistribution: {
        min: 100000,
        max: 10000000,
        distribution: 'power_law'
      },
      behaviorParams: {
        riskTolerance: 0.3,
        profitThreshold: 0.001,
        reactionSpeed: 0.1,  // 100ms
        coordinationBias: 0.5,
        informationDelay: 0
      },
      strategyWeights: {
        passiveHolding: 0,
        activeManagement: 0,
        speculation: 0.1,
        arbitrage: 0.2,
        mevExtraction: 0.7
      }
    };
  }
  
  private static createLiquidatorAgents(markets: LendingMarketState[]): DeFiAgentConfig {
    return {
      role: 'liquidator',
      count: 100,
      capitalDistribution: {
        min: 100000,
        max: 10000000,
        distribution: 'normal'
      },
      behaviorParams: {
        riskTolerance: 0.2,
        profitThreshold: 0.005,
        reactionSpeed: 1,
        coordinationBias: 0.4,
        informationDelay: 0
      },
      strategyWeights: {
        passiveHolding: 0,
        activeManagement: 0.1,
        speculation: 0,
        arbitrage: 0.3,
        mevExtraction: 0.6
      }
    };
  }
  
  private static createGovernanceAgents(): DeFiAgentConfig {
    return {
      role: 'governance',
      count: 50,
      capitalDistribution: {
        min: 1000,
        max: 100000000,
        distribution: 'power_law'
      },
      behaviorParams: {
        riskTolerance: 0.5,
        profitThreshold: 0.01,
        reactionSpeed: 86400,  // 1 day
        coordinationBias: 0.6,
        informationDelay: 3600
      },
      strategyWeights: {
        passiveHolding: 0.3,
        activeManagement: 0.4,
        speculation: 0.2,
        arbitrage: 0,
        mevExtraction: 0.1
      }
    };
  }
}
```

### 4. Signal Synthesizer

```typescript
// lib/mirofish/defi/signal-synthesizer.ts

import { 
  DeFiSimulationResult, 
  DeFiSignal, 
  DeFiRiskWarning,
  StrategyRecommendation 
} from './types';

export class DeFiSignalSynthesizer {
  
  static generate(result: DeFiSimulationResult): {
    signals: DeFiSignal[];
    risks: DeFiRiskWarning[];
    strategy?: StrategyRecommendation;
  } {
    const signals: DeFiSignal[] = [];
    const risks: DeFiRiskWarning[] = [];
    
    // Yield opportunities
    const yieldSignals = this.findYieldOpportunities(result);
    signals.push(...yieldSignals);
    
    // Risk warnings
    const riskWarnings = this.assessRisks(result);
    risks.push(...riskWarnings);
    
    // Position recommendations
    if (result.yourPositionImpact) {
      const positionSignals = this.generatePositionSignals(result);
      signals.push(...positionSignals);
    }
    
    // Strategy recommendation
    let strategy: StrategyRecommendation | undefined;
    if (result.optimalStrategy) {
      strategy = result.optimalStrategy;
    }
    
    return { signals, risks, strategy };
  }
  
  private static findYieldOpportunities(result: DeFiSimulationResult): DeFiSignal[] {
    const signals: DeFiSignal[] = [];
    
    result.predictions.forEach(pred => {
      if (pred.type === 'apy' && pred.probability > 0.7) {
        const apyMatch = pred.prediction.match(/(\d+)%/);
        if (apyMatch && parseInt(apyMatch[1]) > 20) {
          signals.push({
            id: crypto.randomUUID(),
            type: 'enter_position',
            protocol: pred.affectedAssets[0],
            expectedReturn: parseInt(apyMatch[1]),
            riskScore: 50,  // Would calculate properly
            confidence: pred.probability,
            suggestedGasPrice: 20000000000n,
            deadline: 100,
            rationale: `Predicted APY ${apyMatch[1]}% with ${pred.probability * 100}% confidence`
          });
        }
      }
    });
    
    return signals;
  }
  
  private static assessRisks(result: DeFiSimulationResult): DeFiRiskWarning[] {
    const risks: DeFiRiskWarning[] = [];
    
    // Check for liquidation cascade
    const cascadePred = result.predictions.find(
      p => p.type === 'liquidation' && p.probability > 0.5
    );
    
    if (cascadePred) {
      risks.push({
        type: 'liquidation_risk',
        severity: cascadePred.probability > 0.8 ? 'critical' : 'high',
        description: cascadePred.prediction,
        mitigation: 'Add collateral or reduce borrow position immediately',
        timeToImpact: 60
      });
    }
    
    // Check IL risk
    const ilPred = result.predictions.find(
      p => p.type === 'impermanent_loss' && p.probability > 0.6
    );
    
    if (ilPred) {
      risks.push({
        type: 'il_risk',
        severity: ilPred.probability > 0.8 ? 'high' : 'medium',
        description: ilPred.prediction,
        mitigation: 'Consider hedging with perps or narrowing range',
        timeToImpact: 1440  // 24h
      });
    }
    
    return risks;
  }
  
  private static generatePositionSignals(result: DeFiSimulationResult): DeFiSignal[] {
    const signals: DeFiSignal[] = [];
    const impact = result.yourPositionImpact!;
    
    if (impact.liquidated) {
      signals.push({
        id: crypto.randomUUID(),
        type: 'hedge',
        protocol: 'aave',
        expectedReturn: -impact.pnl,
        riskScore: 90,
        confidence: 0.9,
        suggestedGasPrice: 50000000000n,
        deadline: 10,
        rationale: `Liquidation predicted. Close position or add collateral NOW.`
      });
    } else if (impact.ilIncurred > 0.05) {  // >5% IL
      signals.push({
        id: crypto.randomUUID(),
        type: 'rebalance',
        protocol: 'uniswap-v3',
        expectedReturn: impact.feesEarned - impact.ilIncurred,
        riskScore: 60,
        confidence: 0.75,
        suggestedGasPrice: 30000000000n,
        deadline: 100,
        rationale: `IL (${(impact.ilIncurred * 100).toFixed(1)}%) exceeding fees. Rebalance recommended.`
      });
    }
    
    return signals;
  }
}
```

---

## Environment Configuration

```bash
# .env.local

# MiroFish DeFi Configuration
MIROFISH_DEFI_API_URL=http://localhost:8000
MIROFISH_DEFI_MODEL=defi-twin-v1

# RPC Providers
ALCHEMY_API_KEY=your-key
INFURA_PROJECT_ID=your-id
FLASHBOTS_PROTECT_RPC=https://rpc.flashbots.net/fast

# Subgraph APIs
THE_GRAPH_API_KEY=your-key
UNISWAP_SUBGRAPH=https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3
AAVE_SUBGRAPH=https://api.thegraph.com/subgraphs/name/aave/protocol-v3

# Mempool
FLASHBOTS_RELAY=https://relay.flashbots.net
MEMPOOL_WS=wss://api.blocknative.com/v0

# Simulation Defaults
DEFI_SIMULATION_HOURS=168  # 7 days
DEFI_AGENT_COUNT=15850
DEFI_TIMESTEP_MINUTES=10

# Risk Thresholds
LIQUIDATION_WARNING_THRESHOLD=1.2
IL_WARNING_THRESHOLD=0.05
CASCADE_MIN_POSITIONS=5

# Auto-execution (dangerous - use with caution)
AUTO_HEDGE_LIQUIDATION=false
AUTO_COMPOUND_YIELD=true
SLIPPAGE_TOLERANCE=0.005  # 0.5%
```

---

## Success Metrics

- [ ] Liquidation prediction accuracy >80% (warned vs actual)
- [ ] IL prediction within 2% of actual over 7 days
- [ ] Yield opportunity detection: >15% APY found weekly
- [ ] MEV protection: <50% of trades sandwiched (vs 10% baseline)
- [ ] Cascade warning latency: <2 minutes from trigger
- [ ] Governance attack detection: 100% of flash loan votes flagged

---

*Your DeFi positions as a war game. Simulate before you ape.*
