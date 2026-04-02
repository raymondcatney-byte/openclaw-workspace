# MiroFish Swarm — Quick Start Guide

**Scale:** 50 agents → 500 agents  
**Time:** 30s → 8s  
**Architecture:** 4 parallel K2.5 sub-agent pods

---

## Project Structure

```
mirofish-swarm/
├── SWARM_INTEGRATION.md          # Full architecture spec
├── QUICKSTART.md                 # This file
├── package.json
├── tsconfig.json
├── src/
│   ├── swarm/
│   │   ├── orchestrator.ts       # Main coordination
│   │   ├── pod-sessions.ts       # 4 pod configs (125 agents each)
│   │   ├── critic-pool.ts        # Validation layer (25 critics)
│   │   └── result-merger.ts      # Conflict resolution
│   ├── consensus/
│   │   └── swarm-consensus.ts    # Kelly sizing + synthesis
│   └── types/
│       └── swarm.ts              # TypeScript interfaces
└── prompts/
    ├── AGENT_POD.md              # Pod sub-agent prompt
    ├── CRITIC_POOL.md            # Critic validation prompt
    └── SYNTHESIZER.md            # Final aggregation prompt
```

---

## Installation

```bash
cd mirofish-swarm
npm install
```

---

## Usage

### Basic Swarm Scan

```typescript
import { SwarmOrchestrator } from './src/swarm/orchestrator';

const orchestrator = new SwarmOrchestrator({
  maxCostPerScan: 0.25,
  maxTimePerPod: 15000,
  enableFallback: true
});

const result = await orchestrator.runSwarmScan('BTC-100K-2024', {
  currentPrice: 0.35,
  volume24h: 1500000000,
  newsHeadlines: ['Fed signals pause', 'ETF inflows accelerate']
});

console.log(result.consensus.recommendation);
// "MODERATE BUY: Decent consensus with positive edge. Half-Kelly position."
```

---

## Data Flow

```
1. Input → Market ID + context
2. Split → 4 pods × 125 agents
3. Spawn → Parallel sessions_spawn() calls
4. Execute → K2.5 high reasoning per pod
5. Collect → 500 predictions
6. Validate → Critic pool approval
7. Merge → Deduplicate + weight
8. Synthesize → Consensus + Kelly size
9. Output → Position recommendation
```

---

## Performance

| Metric | Phase 1 (Sequential) | Phase 2 (Swarm) | Improvement |
|--------|---------------------|-----------------|-------------|
| Agents | 50 | 500 | 10× |
| Time | ~30s | ~8s | 4× |
| Cost/scan | ~$0.015 | ~$0.15 | 10× |
| Daily scans | ~100 | ~500 | 5× |

---

## Cost Controls

```typescript
const orchestrator = new SwarmOrchestrator({
  maxCostPerScan: 0.25,    // Kill switch threshold
  maxTimePerPod: 15000,    // 15s timeout
  enableFallback: true     // Use 3 pods if 1 fails
});
```

---

## Fallback Chain

If pods fail:
1. **4 pods succeed** → Full 500-agent synthesis
2. **3 pods succeed** → Reduced 375-agent synthesis (flagged)
3. **2 pods succeed** → Minimal 250-agent synthesis (caution)
4. **<2 pods** → Fallback to Phase 1 (50 sequential agents)

---

## Pod Specialties

| Pod | Agents | Specialty | Weight |
|-----|--------|-----------|--------|
| 1 | 125 | Fundamental analysis | 1.0 |
| 2 | 125 | Technical indicators | 1.1 |
| 3 | 125 | Sentiment/social | 0.9 |
| 4 | 125 | Whale/behavioral | 1.05 |

---

## Validation (Critic Pool)

Each pod checked for:
- **Structure:** Valid JSON, required fields
- **Coherence:** Not 100% agreement or 50/50 split
- **Diversity:** Varied confidence + rationales
- **Extremes:** <20% at 95%+ or 10%- confidence

Approval threshold: **60%** overall score

---

## Consensus Output

```json
{
  "direction": "YES",
  "consensusProbability": 72,
  "confidence": 68,
  "edge": 12,
  "positionSize": 3,
  "signalStrength": 76,
  "recommendation": "MODERATE BUY...",
  "factors": [
    "Technical breakout (87 citations)",
    "Earnings momentum (64 citations)"
  ],
  "contrarianView": "NO: RSI overbought..."
}
```

---

## Testing

```bash
# Test single pod (125 agents)
npm run test:pods

# Test consensus engine
npm run test:consensus

# Dry run (no API calls)
npm run swarm:dry

# Live swarm scan
npm run swarm:scan
```

---

## Next Steps

1. ✅ Review `SWARM_INTEGRATION.md` for full architecture
2. ✅ Customize pod agents in `src/swarm/pod-sessions.ts`
3. ✅ Adjust Kelly sizing in `src/consensus/swarm-consensus.ts`
4. ✅ Run `npm run swarm:dry` to validate
5. ✅ Deploy with `npm run swarm:scan`

---

## Support

See `SWARM_INTEGRATION.md` for:
- Detailed architecture diagrams
- Error handling strategies
- Calibration testing protocol
- Risk control mechanisms

---

*"From 50 minds to 500 — the swarm awakens."*
