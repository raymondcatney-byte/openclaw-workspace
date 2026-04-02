# INTELLIGENCE ARCHITECTURE v1.0
## Quick Start Guide

### What You Just Built

An autonomous intelligence system with 4 specialized agents:

```
┌─────────────────────────────────────────┐
│         INTELLIGENCE SYSTEM v1.0        │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐    ┌──────────────┐  │
│  │    ALFRED    │    │ MACHIAVELLI  │  │
│  │   (7am auto) │    │  (on-demand) │  │
│  └──────┬───────┘    └──────┬───────┘  │
│         │                    │          │
│         └────────┬───────────┘          │
│                  │                      │
│         ┌────────▼────────┐             │
│         │  ORCHESTRATOR   │             │
│         │   (router)      │             │
│         └────────┬────────┘             │
│                  │                      │
│         ┌────────▼────────┐             │
│         │   ARCHIVIST     │             │
│         │ (9pm auto-save) │             │
│         └─────────────────┘             │
│                                         │
└─────────────────────────────────────────┘
```

### Installation

```bash
cd /root/.openclaw/workspace
./setup-intelligence-system.sh
```

This creates:
- Archive directory structure
- Monitor configuration
- Cron jobs for automation

### How to Use

#### 1. Daily Briefing (Automatic)
**When:** Every day at 7:00 AM  
**What:** Alfred scans 7 domains, delivers briefing to Telegram  
**Manual trigger:** Type `/brief` in Telegram

#### 2. Deep Analysis (On-Demand)
**Command:** `/analyze [topic]`  
**Example:** `/analyze Cuba fuel reserves`  
**Result:** Machiavelli delivers full 6-section geopolitical analysis

#### 3. Archive & Recall
**Save something:** `/save [content]`  
**Search archives:** `/recall [query]`  
**Example:** `/recall Turkey F-35` → Shows all mentions

#### 4. Monitor Setup
**Add tracker:** `/watch [keyword]`  
**Check status:** `/status`  
**Example:** `/watch BRICS currency` → Adds to monitoring list

### Manual Testing

Test each agent:

```bash
# Test Alfred
openclaw agent:spawn DAILY_BRIEFING_ALFRED briefing

# Test Machiavelli  
openclaw agent:spawn MACHIAVELLI_GEOSTRATEGIST "Analyze South China Sea tensions"

# Test Archivist
openclaw agent:spawn ARCHIVIST "Store this analysis to today's archive"
```

### File Locations

| Component | Path |
|-----------|------|
| Agent definitions | `workspace/agents/*.md` |
| Daily archives | `workspace/archive/YYYY-MM-DD/` |
| Active monitors | `workspace/signals/monitors.json` |
| Master index | `workspace/archive/index.json` |

### Customization

#### Change briefing time
Edit cron: `openclaw cron list` → `openclaw cron update [id] --schedule "0 8 * * *"`

#### Add new domain to Alfred
Edit `workspace/agents/DAILY_BRIEFING_ALFRED.md` → Add to knowledge domains list

#### Create new specialist agent
1. Copy template from existing agent
2. Define role, voice, output format
3. Save to `workspace/agents/NEW_AGENT.md`
4. Add to Orchestrator's routing matrix

### Troubleshooting

**Briefing didn't arrive:**
- Check: `openclaw cron list` (is job enabled?)
- Check: `openclaw gateway status` (is gateway running?)
- Manual test: Run `/brief` in Telegram

**Agent not found:**
- Verify: `ls workspace/agents/`
- Check filename matches exactly

**Archive empty:**
- Evening sweep runs at 9pm
- Check: `ls workspace/archive/`

### Evolution Roadmap

**v1.1 (Next week):**
- Pattern detection ("You've mentioned Turkey 5 times this week")
- Auto-queue deep dives on high-frequency signals

**v1.2 (Month 2):**
- Cross-agent synthesis (Alfred + Machiavelli combine outputs)
- Predictive briefing ("Tomorrow you'll want to know about X")

**v2.0 (Month 3):**
- Full autonomy (proactive briefings without triggers)
- Self-improving prompts based on your feedback

### Your Next Steps

1. **Run setup:** `./setup-intelligence-system.sh`
2. **Test manually:** Trigger each agent once
3. **Wait for 7am:** See first automated briefing
4. **Iterate:** Tell me what works, what doesn't

The system is live. Start using it.
