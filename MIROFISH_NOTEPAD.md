# MIROFISH INTEGRATION — NOTEPAD REFERENCE
*Multi-Agent Swarm Intelligence for Prediction*

---

## THE PATTERN (All 3 Domains)

```
LAYER 1: Data Ingestion
    ↓
LAYER 2: Pattern Detection  
    ↓
LAYER 3: Seed Construction
    ↓
LAYER 4: Agent Simulation (MiroFish Core)
    ↓
LAYER 5: Signal Synthesis
```

---

## DOMAIN 1: MARKETS
*File: `PROMPT_mirofish_prevalent.md`*

**Purpose**: Predict volatility regimes, sentiment inflections, whale clustering

**Data Inputs**:
- Market microstructure (order flow, options skew, funding rates)
- Social sentiment (Twitter velocity, Reddit cohorts, news)
- On-chain (whale wallets, exchange flows, gas patterns)

**Patterns Detected**:
| Pattern | Frequency | Signal |
|---------|-----------|--------|
| Volatility regime shift | Hourly | Kelly-sized position |
| Sentiment inflection | Real-time | Entry/exit timing |
| Whale clustering | Per-block | Accumulation/distribution |
| Options flow anomaly | Intraday | Vol skew arb |

**Agents**: 1,180 financial agents
- 1,000 retail | 50 institutional | 20 whales | 10 MMs | 100 algorithms

**Widget Price**: 0.001 SOL (volatility), 0.0005 SOL (sentiment)

---

## DOMAIN 2: BODY (Biohacking)
*File: `PROMPT_mirofish_body_twin.md`*

**Purpose**: Simulate your biology, predict recovery, optimize protocols

**Data Inputs**:
- Wearables: Oura/Whoop (sleep, HRV, strain)
- CGM: Glucose curves, variability
- Subjective: Readiness, motivation, soreness

**Patterns Detected**:
| Pattern | Input | Adjustment |
|---------|-------|------------|
| CNS fatigue | Low HRV + high resting HR | Skip NMN, add PS |
| Metabolic flexibility | Glucose variability | Carbs vs fat fueling |
| Hormonal imbalance | Cortisol elevated | Remove caffeine, add ashwagandha |
| Overreaching risk | Accumulated fatigue | Deload 50%, extra sleep |

**Agents**: 11,600 biological agents
- 10,000 mitochondrial | 100 hormonal | 1,000 neural | 500 immune | 100 gut

**Example Output**:
> "Predicted readiness 4.3/10 in 12h. Recommendation: Break fast now, skip training, 20min sauna by 7pm."

---

## DOMAIN 3: DeFi
*File: `PROMPT_mirofish_defi_twin.md`*

**Purpose**: Predict yield, detect cascades, optimize positions, front-run risks

**Data Inputs**:
- DEX pools: Reserves, tick distribution, volume
- Lending markets: Collateral factors, health factors, utilization
- Mempool: Pending swaps, liquidations, MEV opportunities

**Patterns Detected**:
| Pattern | Detection | Action |
|---------|-----------|--------|
| Liquidation cascade | Clustered positions at HF < 1.2 | Add collateral / reduce borrow |
| Impermanent loss | Price deviation + LP concentration | Rebalance / exit / hedge |
| MEV threat | Large pending swap, high slippage | Flashbots / lower slippage / split |
| Governance attack | Flash loan voting, bribery | Flag, warn, document |
| Yield opportunity | Risk-adjusted APY > 20% | Enter with optimal sizing |

**Agents**: 15,850 DeFi participants
- 10,000 LPs | 5,000 borrowers | 500 arbitrageurs | 200 MEV bots | 100 liquidators | 50 governance

**Example Output**:
> "Cascade depth: 5. 73 positions at risk below $1,847 ETH. Time to trigger: ~45 min. Mitigation: Add 15% collateral or close 30% of borrow."

---

## SHARED ARCHITECTURE

```
lib/mirofish/
├── {domain}/
│   ├── client.ts              # Domain-specific MiroFish client
│   ├── seed-builder-{domain}.ts    # Convert real data → sim seed
│   ├── agent-factory-{domain}.ts   # Spawn agents with configs
│   ├── pattern-detectors.ts   # Identify opportunities/risks
│   └── signal-synthesizer.ts  # Generate actionable outputs
```

**80% Shared**: Client, types, orchestration, result parsing  
**20% Domain**: Seed builders, agent factories, pattern detectors

---

## AGENT FACTORY PATTERN

```typescript
// All domains follow this structure
interface AgentConfig {
  role: string;
  count: number;
  capitalDistribution: { min, max, distribution };
  behaviorParams: {
    riskTolerance: 0-1;
    profitThreshold: number;  // bps
    reactionSpeed: seconds;
    coordinationBias: 0-1;
    informationDelay: seconds;
  };
  strategyWeights: {
    passiveHolding: 0-1;
    activeManagement: 0-1;
    speculation: 0-1;
    arbitrage: 0-1;
    mevExtraction: 0-1;
  };
}
```

---

## SIMULATION OUTPUT STRUCTURE

```typescript
interface SimulationResult {
  timeline: StatePoint[];        // 24-72h projection
  predictions: Prediction[];     // Probabilistic forecasts
  signals: Signal[];             // Actionable trades/adjustments
  risks: RiskWarning[];          // Critical alerts
  confidence: number;            // 0-1
}
```

---

## WIDGET PRICING (A2A Economy)

| Capability | Price | Domain |
|------------|-------|--------|
| Volatility prediction | 0.001 SOL | Markets |
| Sentiment lifecycle | 0.0005 SOL | Markets |
| Whale impact analysis | 0.0015 SOL | Markets |
| Bio-optimization consult | 0.0005 SOL | Body |
| Recovery prediction | 0.001 SOL | Body |
| Yield optimization | 0.001 SOL | DeFi |
| Cascade warning | 0.0015 SOL | DeFi |
| MEV protection | 0.0005 SOL | DeFi |

---

## QUICK REFERENCE: Which Spec?

| Question | Use |
|----------|-----|
| "What will BTC do?" | Markets (`PROMPT_mirofish_prevalent.md`) |
| "Should I train today?" | Body (`PROMPT_mirofish_body_twin.md`) |
| "Will I get liquidated?" | DeFi (`PROMPT_mirofish_defi_twin.md`) |
| "When does narrative peak?" | Markets |
| "Skip NMN today?" | Body |
| "Rebalance my LP?" | DeFi |

---

## KEY FILES

```
workspace/
├── PROMPT_mirofish_prevalent.md      # 60KB — Market prediction
├── PROMPT_mirofish_body_twin.md      # 45KB — Biohacking
├── PROMPT_mirofish_defi_twin.md      # 38KB — DeFi
└── memory/2026-03-15.md              # Full context log
```

---

## NEXT STEPS (If Asked)

1. Implement `lib/mirofish/core/client.ts` (shared)
2. Build domain seed builders (market, body, defi)
3. Create pattern detectors for each domain
4. Wire to BrowserOS widget endpoints
5. Test A2A payment flows

---

*Last updated: 2026-03-15 04:33*  
*All specs complete — ready for implementation*
