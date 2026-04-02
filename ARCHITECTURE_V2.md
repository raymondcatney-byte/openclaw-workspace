# INTELLIGENCE ARCHITECTURE v2.0
## Phase 2: Pattern Detection & Synthesis

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTELLIGENCE ARCHITECTURE v2.0               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  INPUT LAYER                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  News/APIs  │  │  User Query │  │  Scheduled  │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                      │
│         └────────────────┴────────────────┘                      │
│                          │                                       │
│  ┌───────────────────────▼───────────────────────┐              │
│  │              ORCHESTRATOR v2.0                │              │
│  │         (Routing & Coordination)              │              │
│  └───────────────────────┬───────────────────────┘              │
│                          │                                       │
│  ┌───────────────────────┼───────────────────────┐              │
│  │                       │                       │              │
│  ▼                       ▼                       ▼              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │    ALFRED   │  │ MACHIAVELLI │  │    PATTERN  │             │
│  │  (7am auto) │  │ (on-demand) │  │  DETECTOR   │             │
│  │  Daily      │  │ Deep        │  │ (6hr scan)  │             │
│  │  briefings  │  │ analysis    │  │ Trend       │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
│         │                │                │                      │
│         └────────────────┴────────────────┘                      │
│                          │                                       │
│  ┌───────────────────────▼───────────────────────┐              │
│  │           SYNTHESIS ENGINE v2.0               │              │
│  │      (Cross-agent integration)                │              │
│  │                                               │              │
│  │  • Cross-domain connections                   │              │
│  │  • Temporal trajectories                      │              │
│  │  • Scenario generation                        │              │
│  │  • Agent fusion                               │              │
│  └───────────────────────┬───────────────────────┘              │
│                          │                                       │
│         ┌────────────────┼────────────────┐                      │
│         │                │                │                      │
│         ▼                ▼                ▼                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  EXECUTIVE  │  │  STRATEGIC  │  │  SCENARIO   │             │
│  │  SUMMARY    │  │ ASSESSMENT  │  │  PORTFOLIO  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│         ┌────────────────┴────────────────┐                      │
│         │                                 │                      │
│         ▼                                 ▼                      │
│  ┌─────────────┐                   ┌─────────────┐             │
│  │  TELEGRAM   │                   │  ARCHIVIST  │             │
│  │  (delivery) │                   │ (storage)   │             │
│  └─────────────┘                   └─────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## What Changed in Phase 2

### Added Agents

| Agent | Function | Trigger |
|-------|----------|---------|
| **Pattern Detector** | Trend analysis, anomaly detection, correlation discovery | 6-hour scan + on-demand |
| **Synthesis Engine** | Cross-domain integration, scenario building, agent fusion | Post-analysis + scheduled |

### Enhanced Workflows

**Before (v1.0):**
```
Alfred → Briefing → Archive
Machiavelli → Analysis → Archive
```

**After (v2.0):**
```
Alfred → Briefing → Pattern Scan → Synthesis → Enhanced Briefing
Machiavelli → Analysis → Pattern Correlation → Synthesis → Strategic Assessment
Raw Signals → Anomaly Detection → Alert if threshold breached
```

## Capabilities Matrix

| Capability | v1.0 | v2.0 |
|------------|------|------|
| Daily briefings | ✅ | ✅ Enhanced |
| Deep analysis | ✅ | ✅ Enhanced |
| Archive/search | ✅ | ✅ |
| Pattern detection | ❌ | ✅ NEW |
| Trend analysis | ❌ | ✅ NEW |
| Anomaly alerts | ❌ | ✅ NEW |
| Cross-domain synthesis | ❌ | ✅ NEW |
| Scenario generation | ❌ | ✅ NEW |
| Retrospective analysis | ❌ | ✅ NEW |

## Use Cases

### Use Case 1: Early Warning

**Scenario:** Something important is happening but you haven't noticed yet.

**v1.0:** Wait for Alfred's 7am briefing, hope it's covered.

**v2.0:** Pattern Detector scans every 6 hours. Detects 500% spike in Turkey mentions. Alerts immediately. Synthesis Engine generates scenario. You know before the briefing.

### Use Case 2: Connection Discovery

**Scenario:** Three separate developments seem unrelated.

**v1.0:** Alfred mentions each in separate domains. No connection drawn.

**v2.0:** Pattern Detector finds correlation: Russia oil ↓ + India tariffs ↑ + China AI chips = resource nationalism surge. Synthesis explains the meta-pattern.

### Use Case 3: Strategic Planning

**Scenario:** You need to make a decision with incomplete information.

**v1.0:** Machiavelli analyzes current situation. Good for now, no foresight.

**v2.0:** Scenario Builder generates 4 probability-weighted futures with triggers. Action Matrix tells you what to do in each case.

### Use Case 4: Intelligence Review

**Scenario:** You want to know what you got right/wrong.

**v1.0:** Manually search archives. Time-consuming.

**v2.0:** `/retrospective 2026-02-01` → Archivist retrieves briefings. Pattern Detector analyzes predictions vs. outcomes. Synthesis generates accuracy report.

## New Commands

### Pattern Detection
- `/patterns` - Weekly pattern report
- `/trend [entity]` - Entity trajectory
- `/correlate [A] [B]` - Find connections
- `/anomalies` - Recent anomalies
- `/predict [topic]` - 30-day forecast

### Synthesis
- `/synthesize [topic]` - Full cross-agent analysis
- `/briefing+` - Enhanced Alfred with synthesis
- `/scenarios [situation]` - Probability-weighted futures
- `/connect [A] [B]` - Cross-domain analysis
- `/retrospective [date]` - Historical accuracy review

## Automated Schedule

| Time | Agent | Output |
|------|-------|--------|
| 07:00 | Alfred + Synthesis | Enhanced daily briefing |
| Every 6 hours | Pattern Detector | Threshold breach check |
| Friday 18:00 | Pattern Detector | Weekly pattern report |
| Last day 20:00 | Synthesis Engine | Monthly strategic assessment |

## Architecture Philosophy

**v1.0** was about **collection** - gathering intelligence from multiple domains.

**v2.0** is about **connection** - finding patterns across domains, synthesizing meaning, predicting trajectories.

The intelligence is no longer just what you know. It's what you see coming.

## Next: Phase 3

v3.0 will add:
- **Autonomous operation** (agents act without triggers)
- **Self-improvement** (agents refine their own prompts)
- **Predictive briefing** ("Tomorrow you'll want to know about X")

But first, master v2.0.

## Activation

```bash
./upgrade-phase2.sh
```

Then test:
```
/patterns
/synthesize Russia-Ukraine
/trend Turkey
```

The system is now seeing patterns. Use it.
