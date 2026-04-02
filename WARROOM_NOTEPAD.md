# WAR ROOM — COMPLETE NOTEPAD REFERENCE
*Autonomous Intelligence Dashboard + Multi-Agent Systems*

**Last Updated**: 2026-03-15 04:33  
**Status**: 3 MiroFish domains spec'd, implementation ready

---

## TABLE OF CONTENTS

1. [Core Architecture](#core-architecture)
2. [Bruce (Intelligence Agent)](#bruce-intelligence-agent)
3. [Protocol Consultant](#protocol-consultant)
4. [CashClaw Pattern](#cashclaw-pattern)
5. [MiroFish Integration](#mirofish-integration)
6. [BrowserOS Widget](#browseros-widget)
7. [Strategic Pivot](#strategic-pivot)
8. [File Index](#file-index)

---

## CORE ARCHITECTURE

### Sidebar Structure
```
🔍 Intelligence (Bruce)     → External web search, blue theme
⚡ Protocol (Consultant)     → Wayne Protocol only, emerald theme  
🌍 War Room                  → Anomaly detection, monitoring
💰 DeFi Twin                 → Yield/cascades (future)
```

### Tech Stack
- **Framework**: Next.js 14 + Edge Functions
- **AI**: Groq API (free tier, ~10k tokens/day)
- **State**: Redis (session), PostgreSQL (persistent)
- **Crypto**: Solana (payments), ZK attestations (verification)
- **Agents**: MiroFish (multi-agent simulation)

### Constraints
- **Free Groq only**: ~20 deep searches/day at 3 calls each
- **Self-funding goal**: Bruce evolves from cost center to revenue generator
- **Statelessness**: Protocol Consultant has NO persistence/logging (explicit user decision)
- **Sequential execution**: Not parallel, to manage token budget

---

## BRUCE (INTELLIGENCE AGENT)

### Current State
- Solo search agent (no Makaveli for now)
- Temperature 0.7
- Stateless per query

### Future: CashClaw Bruce
```
FIND     → Detects intelligence gaps
QUOTE    → Estimates token cost
EXECUTE  → Multi-source research
GET PAID → User feedback (👍/👎)
LEARN    → Weekly evolution
```

### Evolution Path
Search Engine → Autonomous Agent → Self-Sovereign Service → Molt.id Entity

### Key Files
- `lib/bruce/cashclaw.ts` — Core loop
- `lib/bruce/detector.ts` — Gap detection
- `lib/bruce/evolution.ts` — Prompt optimization
- `components/BruceTaskQueue.tsx` — Floating approval panel
- `components/BruceFeedback.tsx` — 👍/👎 buttons

---

## PROTOCOL CONSULTANT

### Purpose
Stateless biohacking consultant for Wayne Protocol. Real-time adjustments based on biomarkers.

### Visual Identity
- **Theme**: Emerald (#10b981)
- **Icon**: ⚡
- **Temperature**: 0.3 (precise)

### Wayne Protocol (Complete Reference)

#### Daily Structure
- **Fasting**: 18:6 base (flexible: 16:8, 20:4, or skip)
- **Meal 1** (08:15 post-training): 6 eggs, wild salmon, sweet potato, avocado, spinach
- **Meal 2** (11:30): Bone broth, grilled chicken/fish, fermented vegetables
- **Meal 3** (18:30): Grass-fed steak/bison, beef liver weekly, cruciferous vegetables

#### Supplement Stacks
- **Morning (05:30)**: NMN 500mg, TMG 1g, Alpha-GPC 600mg, Lion's Mane 1g, D3 5000 IU, K2 200mcg, Omega-3 2g
- **Pre-workout**: Creatine 5g, Beta-alanine 3g, Caffeine 100mg (optional)
- **Post-workout**: Whey isolate 40g
- **Deep work**: L-Theanine 200mg, Mag L-threonate 200mg
- **Afternoon**: Phosphatidylserine 300mg
- **Evening**: Zinc 30mg, Copper 2mg, Apigenin 50mg, Glycine 3g

#### Auto-Adjustment Rules
| Condition | Adjustment |
|-----------|------------|
| Sleep < 6h | Delay fasting 2h, skip caffeine, reduce training 50% |
| HRV < 50 or down > 10% | NO sauna, mobility only, add 1g glycine |
| Readiness < 5 | Skip training, prioritize recovery |
| "Inflamed" or sore | Add curcumin, skip ecdysterone |
| Poor sleep + low HRV | Skip fasting entirely |
| Jet lag | 300mcg melatonin, shift meals to local time |

### Response Modes
1. **Adjustment**: Biomarkers in → modified protocol out
2. **Lookup**: "What's X dose?" → exact timing + rationale
3. **Conflict**: "Can I mix X and Y?" → interaction check

### Key Files
- `app/api/protocol/route.ts` — Edge API
- `lib/protocol/parser.ts` — Biomarker extraction
- `hooks/useProtocolConsultant.ts` — React hook
- `app/protocol/page.tsx` — Full-page chat UI

---

## CASHCLAW PATTERN

### The Loop
```typescript
interface CashClaw {
  // FIND — Detect opportunities/gaps
  scanForGaps: () => IntelligenceGap[];
  
  // QUOTE — Estimate cost
  estimateCost: (task: Task) => TokenEstimate;
  
  // EXECUTE — Do the work
  execute: (task: Task) => Promise<Result>;
  
  // GET PAID — Capture value signal
  captureFeedback: (resultId: string, rating: number) => void;
  
  // LEARN — Improve
  evolve: () => Promise<void>; // Weekly: propagate winners
}
```

### Cross-Tab Integration

| Tab | Trigger | Action |
|-----|---------|--------|
| War Room | Aircraft formation | Research military exercise context |
| War Room | Shallow seismic | Check nuclear test sites, news |
| Protocol | Low HRV + poor sleep | Research recovery protocols |
| Protocol | Supplement conflict | Check Examine.com, PubMed |
| Intelligence | Complex query | Multi-source synthesis |

### Token Budget
- Daily: 10,000 tokens
- Per task: 600-1,500 tokens
- Auto-execute: confidence > 0.8 (optional)

---

## MIROFISH INTEGRATION

### What Is MiroFish
Multi-agent swarm intelligence engine (666ghj/CAMEL-AI). Builds parallel digital worlds for prediction.

### The Pattern (All Domains)
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

### Domain 1: MARKETS
*File: `PROMPT_mirofish_prevalent.md`*

**Purpose**: Predict volatility, sentiment, whale clustering

**Data**: Order flow, options skew, funding rates, social velocity, on-chain flows

**Agents**: 1,180 financial agents
- 1,000 retail | 50 institutional | 20 whales | 10 MMs | 100 algorithms

**Patterns**:
| Pattern | Frequency | Output |
|---------|-----------|--------|
| Volatility regime | Hourly | Kelly-sized position |
| Sentiment inflection | Real-time | Entry/exit timing |
| Whale clustering | Per-block | Accumulation/dist |
| Options flow | Intraday | Vol skew arb |

**Price**: 0.001 SOL (volatility), 0.0005 SOL (sentiment)

---

### Domain 2: BODY (Biohacking)
*File: `PROMPT_mirofish_body_twin.md`*

**Purpose**: Simulate biology, predict recovery, optimize protocols

**Data**: Oura/Whoop (sleep, HRV), CGM (glucose), subjective inputs

**Agents**: 11,600 biological agents
- 10,000 mitochondrial | 100 hormonal | 1,000 neural | 500 immune | 100 gut

**Patterns**:
| Pattern | Detection | Action |
|---------|-----------|--------|
| CNS fatigue | Low HRV + high HR | Skip NMN, add PS |
| Metabolic flex | Glucose variability | Fuel switching |
| Hormonal imbal | Cortisol elevated | Remove caffeine |
| Overreaching | Accumulated fatigue | Deload 50% |

**Example Output**:
> "Predicted readiness 4.3/10 in 12h. Break fast now, skip training, 20min sauna by 7pm."

---

### Domain 3: DeFi
*File: `PROMPT_mirofish_defi_twin.md`*

**Purpose**: Predict yield, detect cascades, optimize positions

**Data**: DEX pools, lending markets, mempool, governance

**Agents**: 15,850 DeFi participants
- 10,000 LPs | 5,000 borrowers | 500 arbitrageurs | 200 MEV bots | 100 liquidators | 50 governance

**Patterns**:
| Pattern | Detection | Action |
|---------|-----------|--------|
| Liquidation cascade | Clustered HF < 1.2 | Add collateral/reduce borrow |
| Impermanent loss | Price deviation | Rebalance/exit/hedge |
| MEV threat | Large pending swap | Flashbots/lower slippage |
| Governance attack | Flash loan voting | Flag/warn/document |
| Yield opportunity | Risk-adj APY > 20% | Enter with sizing |

**Example Output**:
> "Cascade depth: 5. 73 positions at risk below $1,847 ETH. Time to trigger: ~45 min."

---

### Shared Architecture

```
lib/mirofish/
├── core/
│   ├── client.ts              # Shared MiroFish client
│   ├── types.ts               # Common interfaces
│   └── orchestrator.ts        # Simulation runner
├── market/
│   ├── seed-builder-market.ts
│   ├── agent-factory-market.ts
│   └── pattern-detectors/
│       ├── volatility-regime.ts
│       └── sentiment-inflection.ts
├── body/
│   ├── seed-builder-body.ts
│   ├── agent-factory-body.ts
│   └── state-detectors/
│       ├── recovery-state.ts
│       └── metabolic-flexibility.ts
└── defi/
    ├── seed-builder-defi.ts
    ├── agent-factory-defi.ts
    └── pattern-detectors/
        ├── liquidation-cascade.ts
        └── impermanent-loss.ts
```

**80% Shared**: Client, types, orchestration  
**20% Domain**: Seed builders, agent factories, detectors

---

## BROWSEROS WIDGET

### Purpose
A2A (Agent-to-Agent) economy integration. Bruce as service provider.

### Economic Model
| Capability | Price |
|------------|-------|
| Aviation anomaly | 0.001 SOL |
| Seismic analysis | 0.0015 SOL |
| Protocol consult | 0.0005 SOL |
| Volatility prediction | 0.001 SOL |
| Sentiment lifecycle | 0.0005 SOL |
| Whale impact | 0.0015 SOL |
| Bio-optimization | 0.0005 SOL |
| Yield optimization | 0.001 SOL |

### Architecture
```
app/api/widget/route.ts          # Payment verification, capability routing
lib/widget/
├── payment.ts                   # Solana payment verification
├── capabilities.ts              # Skill registry
├── attestation.ts               # ZK proof generation
└── reputation.ts                # 👍/👎 tracking
public/widget.json               # BrowserOS discovery manifest
```

### Flow
1. Agent queries via BrowserOS
2. Payment verified on Solana
3. Bruce executes research
4. Output signed with ZK attestation
5. Feedback recorded for reputation

---

## STRATEGIC PIVOT

### From Rare → Prevalent Anomalies

| Old (Rare) | New (Prevalent) | Frequency |
|------------|-----------------|-----------|
| Military aircraft formations | Market volatility regimes | Hourly |
| Nuclear test seismic | Social sentiment inflections | Real-time |
| Satellite ship movements | Supply chain disruption | Daily |
| Diplomatic flight tracking | Whale wallet clustering | Per-block |
| Geopolitical flashpoints | Options flow anomalies | Intraday |

### Why
- Rare = Low signal, hard to validate, long feedback loops
- Prevalent = Daily signals, rapid iteration, P&L validation

### Validation Shift
- Before: "Did geopolitical event happen?"
- After: P&L attribution, continuous improvement

---

## KEY DECISIONS

1. **Protocol Agent stateless** — No logging/adherence tracking per explicit user request
2. **Separate search bars** — Bruce (external) vs Protocol (internal) prevent context bleed
3. **Sequential not parallel** — Token budget management for swarm mode
4. **Weather trader paused** — Do not revisit unless explicitly asked
5. **Free-tier constraints** — ~20 searches/day, optimize per-query value
6. **A2A economy focus** — Target AI agents as customers, not humans

---

## FILE INDEX

### Specs
| File | Size | Content |
|------|------|---------|
| `PROMPT_cashclaw_bruce.md` | 24KB | CashClaw Bruce implementation |
| `PROMPT_browseros_widget.md` | 25KB | BrowserOS widget + A2A economy |
| `PROMPT_mirofish_prevalent.md` | 60KB | Market prediction (volatility, sentiment, whales) |
| `PROMPT_mirofish_body_twin.md` | 45KB | Biohacking simulation |
| `PROMPT_mirofish_defi_twin.md` | 38KB | DeFi simulation |
| `MIROFISH_NOTEPAD.md` | 6KB | Quick MiroFish reference |
| `WARROOM_NOTEPAD.md` | This file | Complete reference |

### Memory
| File | Content |
|------|---------|
| `memory/2026-03-15.md` | Full context log (comprehensive) |
| `MEMORY.md` | Curated long-term memory |

### Identity
| File | Content |
|------|---------|
| `SOUL.md` | KimiClaw Prime persona |
| `USER.md` | User preferences, goals |
| `AGENTS.md` | Workspace conventions |
| `IDENTITY.md` | Guardian-type chuunibyou identity |

---

## QUICK ACTIONS

### If Asked to Build...

| Request | Start With |
|---------|------------|
| "Build Protocol Consultant" | `app/api/protocol/route.ts` |
| "Build CashClaw Bruce" | `lib/bruce/cashclaw.ts` |
| "Add MiroFish markets" | `lib/mirofish/market/seed-builder-market.ts` |
| "Add Body Twin" | `lib/mirofish/body/seed-builder-body.ts` |
| "Add DeFi Twin" | `lib/mirofish/defi/seed-builder-defi.ts` |
| "BrowserOS widget" | `app/api/widget/route.ts` |
| "Which spec?" | This notepad, "Which Spec?" table |

### Which Spec?

| Question | Use |
|----------|-----|
| "What will BTC do?" | Markets |
| "Should I train today?" | Body |
| "Will I get liquidated?" | DeFi |
| "When does narrative peak?" | Markets |
| "Skip NMN today?" | Body |
| "Rebalance my LP?" | DeFi |

---

## NEXT STEPS (Priority Order)

1. **Protocol Consultant MVP** — Edge API, parser, UI
2. **CashClaw Core** — Detection, task queue, approval flow
3. **MiroFish Client** — Shared core, then domain seed builders
4. **Widget Endpoint** — Payment verification, capability routing
5. **Solana Integration** — Wallet, payment verification, rate limiting
6. **Reputation System** — Redis tracking, feedback aggregation
7. **ZK Attestation** — Output signing, verification proofs
8. **Weekly Evolution** — Vercel Cron for pattern propagation

---

*KimiClaw Prime online. Remembering everything.*
