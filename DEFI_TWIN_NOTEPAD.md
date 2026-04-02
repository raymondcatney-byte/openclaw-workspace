# DEFI PROTOCOL TWIN — NOTEPAD REFERENCE
*MiroFish Multi-Agent Simulation for DeFi*

**Last Updated**: 2026-03-15 04:33  
**File**: `PROMPT_mirofish_defi_twin.md` (38KB)  
**Status**: Implementation ready

---

## THE PATTERN

```
LAYER 1: ON-CHAIN DATA INGESTION
├── DEX pools (reserves, ticks, volume, fees)
├── Lending markets (supply/borrow, health factors)
├── Mempool (pending swaps, liquidations)
├── Yield aggregators (vaults, rewards)
└── Governance (proposals, delegates)
    ↓
LAYER 2: DEFI PATTERN DETECTION
├── ImpermanentLossRisk (price divergence + LP concentration)
├── LiquidationCascadeDetector (clustered positions)
├── YieldOpportunityFinder (mispriced rewards)
├── MEVThreatAnalyzer (sandwich/latency arb)
├── GovernanceAttackDetector (flash loans, bribery)
└── CorrelationBreakdown (stable depeg, oracle failure)
    ↓
LAYER 3: PROTOCOL STATE SEED
├── PoolState (liquidity, volatility, tick distribution)
├── MarketParticipants (LPs, borrowers, collateral)
├── EconomicEnvironment (gas, ETH price, stable pegs)
├── MEVLandscape (bot counts, strategies)
└── GovernancePower (token distribution, delegates)
    ↓
LAYER 4: DEFI SIMULATION (15,850 agents)
├── LP agents (10,000) — passive, active, concentrated
├── Borrower agents (5,000) — leverage, farmers, loopers
├── Arbitrageur agents (500) — CEX-DEX, cross-DEX
├── MEV bots (200) — sandwich, frontrun, liquidation
├── Liquidator agents (100) — profit-seeking, coordinated
└── Governance agents (50) — whales, delegates, attackers
    ↓
LAYER 5: DEFI SIGNAL SYNTHESIS
├── YieldOptimization (pool, range, timing)
├── RiskManagement (IL hedging, collateral buffers)
├── ArbitrageSignals (profitable trades)
├── MEVProtection (slippage, timing)
└── GovernanceInsights (vote timing, delegation)
```

---

## AGENT ARCHITECTURE

### LP Agents (10,000)
| Subtype | % | Behavior |
|---------|---|----------|
| Passive | 40% | Full range, hold forever |
| Active | 30% | Rebalance when IL > threshold |
| Concentrated | 25% | Narrow ranges, chase fees |
| Trend | 5% | Shift ranges on price prediction |

**Capital**: $1K - $10M (power law)  
**Rebalance trigger**: Fees < IL

### Borrower Agents (5,000)
| Subtype | % | Behavior |
|---------|---|----------|
| Leverage Longs | 35% | Borrow stables, buy ETH |
| Leverage Shorts | 20% | Borrow ETH, sell for stables |
| Yield Farmers | 30% | Recursive borrowing for points |
| Loopers | 15% | Supply → Borrow → Resupply |

**Health Factor Awareness**: 0.1 - 0.9 (risk tolerance distribution)

### Arbitrageur Agents (500)
| Subtype | % | Speed |
|---------|---|-------|
| CEX-DEX | 40% | Block time |
| Cross-DEX | 35% | Block time |
| Latency | 15% | Sub-block |
| Cross-chain | 10% | Multi-block |

**Profit threshold**: Spread > gas + slippage

### MEV Bots (200)
| Subtype | % | Strategy |
|---------|---|----------|
| Sandwich | 30% | Target large swaps |
| Frontrun | 25% | Copy profitable txs |
| Backrun | 20% | Atomic arb after target |
| JIT Liquidity | 15% | Just-in-time LP |
| Liquidation | 10% | Protocol liquidations |

**Reaction speed**: 100ms

### Liquidator Agents (100)
| Subtype | % | Behavior |
|---------|---|----------|
| Solo | 60% | Individual profit seekers |
| Coordination Pools | 30% | Flash loan aggregators |
| Protocol-Aligned | 10% | Backstop liquidators |

**Execute when**: Bonus > gas + slippage

### Governance Agents (50)
| Subtype | % | Behavior |
|---------|---|----------|
| Retail Voters | 40% | Small holders, emotional |
| Protocol Whales | 25% | Team/investor aligned |
| Delegates | 20% | Professional managers |
| Attackers | 10% | Profit-seeking extraction |
| Abstainers | 5% | Don't participate |

---

## PATTERN DETECTORS

### 1. Liquidation Cascade
**Input**: Lending market state, ETH price  
**Detect**: Clustered positions at HF < 1.2  
**Output**:
```typescript
{
  cascadeTriggerPrice: number;
  affectedPositions: number;
  totalCollateralAtRisk: number;
  cascadeDepth: number;      // How many rounds
  timeToTrigger: number;     // Minutes
}
```

**Confidence**: 60% base + (positions/100)*0.2 + (depth/20)*0.15

### 2. Impermanent Loss
**Input**: Pool state, LP position  
**Formula**: IL = 2*sqrt(priceRatio)/(1+priceRatio) - 1  
**Output**:
```typescript
{
  ilPercent: number;         // Current IL
  projectedIL7d: number;     // Simulated
  feeIncome7d: number;       // Expected fees
  netReturn7d: number;       // Fees - IL
  recommendation: 'hold' | 'rebalance' | 'exit';
}
```

**Rebalance trigger**: netReturn7d > 0 but < 5%
**Exit trigger**: netReturn7d < 0

### 3. MEV Threat
**Input**: Pending swap, pool state  
**Threats**: Sandwich, frontrun, backrun, JIT  
**Output**:
```typescript
{
  threatType: string;
  estimatedMEVExtract: number;
  protectionStrategy: 'flashbots' | 'slippage' | 'timing' | 'split';
  safeSlippage: number;
}
```

### 4. Governance Attack
**Input**: Proposal state, token distribution  
**Detect**: Flash loan voting, delegate bribery, quorum manipulation  
**Output**:
```typescript
{
  attackType: string;
  attackerCapital: number;
  attackCost: number;
  potentialProfit: number;
  defenseRecommendation: string;
}
```

### 5. Yield Opportunity
**Input**: Pool APY, TVL, risk params  
**Output**:
```typescript
{
  totalAPY: number;
  riskScore: number;         // 0-100
  ilRisk: number;
  smartContractRisk: number;
  optimalPositionSize: number;
  timeToOptimalEntry: number;
}
```

---

## SIMULATION OUTPUT

```typescript
interface DeFiSimulationResult {
  timeline: DeFiStatePoint[];      // 24h-30d projection
  predictions: DeFiPrediction[];   // Probabilistic forecasts
  signals: DeFiSignal[];           // Actionable trades
  risks: DeFiRiskWarning[];        // Critical alerts
  
  // User-specific
  yourPositionImpact?: PositionImpact;
  optimalStrategy?: StrategyRecommendation;
  
  confidence: number;
}
```

### Signal Types
| Type | Action | Example |
|------|--------|---------|
| enter_position | Deposit into pool | "Enter ETH-USDC 0.3% at tick -120/+120" |
| exit_position | Withdraw from pool | "Exit before IL exceeds 5%" |
| rebalance | Adjust LP range | "Rebalance to -60/+60, tighter range" |
| hedge | Protect position | "Short perp 0.5x to hedge IL" |
| claim | Harvest rewards | "Claim before emission drop" |

### Risk Warnings
| Type | Severity | Mitigation |
|------|----------|------------|
| liquidation_risk | critical | Add collateral / reduce borrow |
| il_risk | medium-high | Hedge with perps / narrow range |
| smart_contract | medium | Diversify across protocols |
| oracle | high | Check alternative price feeds |
| governance | medium | Monitor proposal closely |

---

## KEY FILES

```
lib/mirofish/defi/
├── client.ts                    # DeFi MiroFish client
├── types.ts                     # Interfaces
├── seed-builder-defi.ts         # On-chain state → sim seed
├── agent-factory-defi.ts        # 15,850 agent configs
├── pattern-detectors.ts         # IL, cascade, MEV detection
├── signal-synthesizer.ts        # Generate signals
└── result-parser-defi.ts        # Parse to actionable strategy

lib/onchain/
├── pool-monitor.ts              # Uniswap/Curve tracking
├── lending-monitor.ts           # Aave/Compound tracking
├── mempool-scanner.ts           # Pending tx analysis
├── oracle-tracker.ts            # Price feed monitoring
└── governance-tracker.ts        # Proposal tracking

lib/defi-patterns/
├── impermanent-loss.ts          # IL calc + projection
├── liquidation-cascade.ts       # Cluster detection
├── yield-opportunity.ts         # Risk-adjusted ranking
├── mev-exposure.ts              # Threat analysis
├── governance-attack.ts         # Flash loan detection
└── stable-depeg.ts              # Stablecoin risk

app/(dashboard)/defi-twin/
├── page.tsx
├── PoolMonitor.tsx              # Live pool states
├── PositionRiskCard.tsx         # Your position risk
├── SimulationControl.tsx        # What-if scenarios
├── YieldOptimizer.tsx           # Optimal strategies
├── MEVShield.tsx                # Protection settings
└── GovernanceRadar.tsx          # Proposal monitoring

app/api/defi/
├── simulate/route.ts            # Run simulation
├── pools/route.ts               # Pool state endpoint
├── positions/route.ts           # User position analysis
├── signals/route.ts             # Trading signals
└── risks/route.ts               # Risk warnings
```

---

## ENVIRONMENT CONFIG

```bash
# RPC Providers
ALCHEMY_API_KEY=your-key
INFURA_PROJECT_ID=your-id
FLASHBOTS_PROTECT_RPC=https://rpc.flashbots.net/fast

# Subgraphs
THE_GRAPH_API_KEY=your-key
UNISWAP_SUBGRAPH=https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3
AAVE_SUBGRAPH=https://api.thegraph.com/subgraphs/name/aave/protocol-v3

# Simulation
DEFI_SIMULATION_HOURS=168        # 7 days
DEFI_AGENT_COUNT=15850
DEFI_TIMESTEP_MINUTES=10

# Risk Thresholds
LIQUIDATION_WARNING_THRESHOLD=1.2
IL_WARNING_THRESHOLD=0.05
CASCADE_MIN_POSITIONS=5

# Auto-execution (DANGEROUS)
AUTO_HEDGE_LIQUIDATION=false
SLIPPAGE_TOLERANCE=0.005         # 0.5%
```

---

## EXAMPLE OUTPUTS

### Liquidation Cascade Warning
```
⚠️ CASCADE ALERT

Asset: ETH
Trigger Price: $1,847
Positions at Risk: 73
Total Collateral: $12.4M
Cascade Depth: 5 rounds
Time to Trigger: ~45 minutes

YOUR POSITION:
Health Factor: 1.25 → 1.08 if ETH hits trigger
Risk: HIGH

MITIGATION:
[ ] Add 15% collateral (+$2,100)
[ ] Close 30% of borrow position
[ ] Hedge with put options
```

### IL Prediction
```
📊 LP POSITION ANALYSIS

Pool: ETH-USDC 0.3%
Range: -120/+120 ticks
Current Price: $3,245

Current IL: 2.3%
Projected IL (7d): 4.1% ± 1.2%
Fee Income (7d): 3.8%
Net Return: -0.3%

RECOMMENDATION: REBALANCE
New Range: -60/+60 ticks
Expected Improvement: +1.2%
Gas Cost: ~$45
Break-even: 12 days
```

### Yield Opportunity
```
🌱 YIELD OPPORTUNITY

Pool: cbETH-ETH (Curve)
Total APY: 24.3%
Base APY: 3.2%
Reward APY: 21.1%

Risk Score: 42/100 (moderate)
- IL Risk: Low (correlated assets)
- Smart Contract: Low (Curve v2)
- TVL: $89M (healthy)

OPTIMAL POSITION SIZE: $5,000 - $15,000
Expected Monthly Return: $101 - $304
Confidence: 78%

[Enter Position] [Add to Watchlist]
```

### MEV Protection
```
🛡️ MEV SHIELD ALERT

Your Trade: 5 ETH → USDC
Slippage Tolerance: 0.5%

THREAT DETECTED:
Sandwich bot active in mempool
Expected Extract: $89
Your Loss: 0.18%

PROTECTION OPTIONS:
[Use Flashbots] — Private mempool, +$12 gas
[Reduce Slippage] — 0.1%, may fail
[Split Order] — 5 × 1 ETH, +$25 gas
[Wait 2 blocks] — Bot may move on
```

---

## SUCCESS METRICS

- [ ] Liquidation prediction accuracy >80%
- [ ] IL prediction within 2% of actual (7d)
- [ ] Yield opportunity detection: >15% APY weekly
- [ ] MEV protection: <50% trades sandwiched (vs 10% baseline)
- [ ] Cascade warning latency: <2 min from trigger
- [ ] Governance attack detection: 100% flash loan votes flagged

---

## INTEGRATION CHECKLIST

- [ ] Set up RPC providers (Alchemy/Infura)
- [ ] Connect The Graph subgraphs
- [ ] Implement pool monitor (Uniswap V3)
- [ ] Implement lending monitor (Aave V3)
- [ ] Build mempool scanner
- [ ] Create seed builder
- [ ] Configure agent factory
- [ ] Build pattern detectors
- [ ] Create signal synthesizer
- [ ] Wire to MiroFish client
- [ ] Build UI components
- [ ] Test with mainnet fork
- [ ] Deploy widget endpoint

---

## QUICK REFERENCE

| Question | Use |
|----------|-----|
| "Will I get liquidated?" | LiquidationCascadeDetector |
| "Should I rebalance my LP?" | ILRiskCalculator |
| "Is this trade safe from MEV?" | MEVThreatAnalyzer |
| "Where's the best yield?" | YieldOpportunityFinder |
| "Is this governance proposal safe?" | GovernanceAttackDetector |
| "Will my position be profitable?" | Full simulation |

---

*Your DeFi positions as a war game. Simulate before you ape.*
