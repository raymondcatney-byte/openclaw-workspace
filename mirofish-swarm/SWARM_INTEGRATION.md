# MiroFish Swarm Integration Spec — K2.5 Parallel Execution

**Version:** 1.0  
**Date:** March 16, 2026  
**Scope:** Scale MiroFish from 50 sequential agents → 500 parallel agents using K2.5 sub-agent swarm

---

## Executive Summary

This spec enables MiroFish Phase 2 to run 500 prediction agents in parallel using OpenClaw's `sessions_spawn()` API. The architecture splits agents into 4 pods (125 each), runs them concurrently through isolated sub-agent sessions, validates outputs through a critic pool, and synthesizes results into actionable consensus positions.

**Key Results:**
- Time: 30s → 8s (4× faster)
- Scale: 50 → 500 agents (10× more coverage)
- Cost: ~$0.15/scan (10× sequential cost, 100× more agents)
- Fault tolerance: Graceful degradation if pods fail

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     MIROFISH SWARM ORCHESTRATOR                 │
│                     (Main Session: KimiClaw Prime)              │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   Input     │  │   Config    │  │   Monitor   │             │
│  │  Processor  │  │   Loader    │  │   Dashboard │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      POD SPAWNER                                │
│     sessions_spawn() × 4 parallel sub-agents                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
    ┌────────────────┼────────────────┬────────────────┐
    ▼                ▼                ▼                ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  POD 1  │    │  POD 2  │    │  POD 3  │    │  POD 4  │
│(125    │    │(125    │    │(125    │    │(125    │
│ agents) │    │ agents) │    │ agents) │    │ agents) │
│         │    │         │    │         │    │         │
│Fundamen-│    │Technical│    │Sentiment│    │Whale +  │
│talists  │    │Analysts │    │Traders  │    │Behavior │
└────┬────┘    └────┬────┘    └────┬────┘    └────┬────┘
     │                │                │                │
     └────────────────┴────────────────┴────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CRITIC POOL (25 agents)                     │
│              Validate pod outputs, flag outliers                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SYNTHESIZER AGENT                           │
│              Aggregate → Cluster → Kelly Size                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     OUTPUT MERGER                               │
│              Final consensus + position recommendations         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pod Distribution Strategy

| Pod | Agent Types | Count | Specialty |
|-----|-------------|-------|-----------|
| **Pod 1** | Fundamental Analysts | 125 | Earnings, macro, valuation models |
| **Pod 2** | Technical Analysts | 125 | Chart patterns, indicators, flow |
| **Pod 3** | Sentiment Traders | 125 | Social, news, narrative velocity |
| **Pod 4** | Whale + Behavioral | 125 | On-chain, crowd psychology, contrarian |

**Within each pod:**
- 25 high-conviction specialists (aggressive predictions)
- 75 balanced analysts (moderate confidence)
- 25 conservative skeptics (frequently counter-consensus)

---

## Core Components

### 1. Orchestrator (`src/swarm/orchestrator.ts`)
Main coordination logic. Spawns pods, manages lifecycle, handles failures.

### 2. Pod Sessions (`src/swarm/pod-sessions.ts`)
Sub-agent configuration and spawn parameters for each pod.

### 3. Critic Pool (`src/swarm/critic-pool.ts`)
Meta-analysis layer that validates pod outputs for coherence and flags outliers.

### 4. Result Merger (`src/swarm/result-merger.ts`)
Combines pod results, resolves conflicts, deduplicates signals.

### 5. Synthesizer (`src/consensus/swarm-consensus.ts`)
Final aggregation layer producing consensus + Kelly-sized positions.

---

## Error Handling Strategy

| Failure Mode | Response | Fallback |
|--------------|----------|----------|
| Single pod timeout | Retry once, then exclude | Use 3 pods (375 agents) |
| Multiple pod failures | Abort swarm, fallback to sequential | Run 50-agent baseline |
| High divergence (>40% conflict) | Trigger deep analysis pod | Manual review flag |
| Critic pool rejection | Quarantine pod, resample | Exclude pod from synthesis |
| Cost overrun (>2× budget) | Kill switch, return partial | Best-effort aggregation |

---

## Data Flow

1. **Input:** Market ID + context (price, volume, news)
2. **Split:** 500 agents → 4 pods × 125
3. **Spawn:** Parallel `sessions_spawn()` with AGENT_POD prompt
4. **Execute:** Each pod runs agents (K2.5 high reasoning)
5. **Collect:** Pod returns structured predictions array
6. **Validate:** Critic pool checks each pod's internal coherence
7. **Merge:** Combine 4 pod outputs (500 predictions)
8. **Synthesize:** Cluster → consensus probability → Kelly size
9. **Output:** Final position recommendation with confidence

---

## Performance Targets

| Metric | Sequential (Phase 1) | Swarm (Phase 2) | Improvement |
|--------|---------------------|-----------------|-------------|
| Agents | 50 | 500 | 10× |
| Time | ~30s | ~8s | 4× faster |
| Cost/scan | ~$0.015 | ~$0.15 | 10× (worth it) |
| Daily scans | ~100 | ~500 | 5× more markets |
| Consensus depth | 50 samples | 500 samples | 10× statistical power |

---

## Risk Controls

1. **Cost Guardrails:**
   - Max $0.25 per scan (kill switch)
   - Daily budget: $5.00 (33 scans)
   - Alert at 80% budget

2. **Quality Gates:**
   - Critic pool must approve >70% of pod outputs
   - Inter-pod correlation <0.9 (diversity check)
   - Confidence calibration tracked weekly

3. **Fallback Chain:**
   - Swarm (500) → Reduced swarm (375) → Sequential (50) → Baseline model

---

## Implementation Files

See accompanying files:
- `src/swarm/orchestrator.ts` — Main coordination
- `src/swarm/pod-sessions.ts` — Sub-agent configs
- `src/swarm/critic-pool.ts` — Validation layer
- `src/swarm/result-merger.ts` — Conflict resolution
- `prompts/AGENT_POD.md` — Pod system prompt
- `prompts/CRITIC_POOL.md` — Critic validation prompt
- `prompts/SYNTHESIZER.md` — Final aggregation prompt

---

## Testing Protocol

1. **Unit Test:** Each pod runs standalone (125 agents)
2. **Integration Test:** Full 4-pod swarm with mock data
3. **Accuracy Validation:** Compare swarm vs sequential on same markets
4. **Stress Test:** 100 consecutive scans, measure drift
5. **Calibration Check:** Predicted vs actual probabilities weekly

---

## Next Steps

1. Implement orchestrator + pod sessions
2. Write sub-agent prompts (3 variants)
3. Test single pod (125 agents)
4. Scale to 4 pods (500 agents)
5. Validate accuracy vs Phase 1 baseline
6. Deploy to production

---

*"From 50 minds to 500 — the swarm awakens."*
