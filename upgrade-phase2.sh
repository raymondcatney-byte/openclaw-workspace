#!/bin/bash

# PHASE 2 UPGRADE: Advanced Intelligence Capabilities
# Adds Pattern Detection and Synthesis to existing architecture

echo "=== PHASE 2 UPGRADE: Pattern Detection & Synthesis ==="
echo ""

# Verify new agents
echo "[1/4] Adding new agents to architecture..."
NEW_AGENTS=(
  "PATTERN_DETECTOR"
  "SYNTHESIS_ENGINE"
)

for agent in "${NEW_AGENTS[@]}"; do
  if [ -f "workspace/agents/${agent}.md" ]; then
    echo "  ✓ ${agent} ready"
  else
    echo "  ✗ ${agent} MISSING - Run agent creation first"
    exit 1
  fi
done

# Update cron jobs with new capabilities
echo ""
echo "[2/4] Adding pattern detection workflows..."

# Weekly pattern scan (Fridays at 6pm)
openclaw cron add --name "Weekly Pattern Scan" \
  --schedule "0 18 * * 5" \
  --payload "Read workspace/agents/PATTERN_DETECTOR.md and execute weekly pattern analysis. Scan past 7 days of archives. Report escalations, correlations, anomalies to user." \
  2>/dev/null || echo "  ⚠ Pattern scan cron may already exist"

# Monthly synthesis (Last day of month at 8pm)
openclaw cron add --name "Monthly Synthesis" \
  --schedule "0 20 28-31 * *" \
  --payload "Read workspace/agents/SYNTHESIS_ENGINE.md and generate monthly strategic assessment. Synthesize Alfred briefings, Machiavelli analyses, and Pattern Detector findings from past 30 days." \
  2>/dev/null || echo "  ⚠ Monthly synthesis cron may already exist"

# Real-time pattern alert check (every 6 hours)
openclaw cron add --name "Pattern Alert Check" \
  --schedule "0 */6 * * *" \
  --payload "Read workspace/agents/PATTERN_DETECTOR.md and check for threshold breaches. If high-confidence pattern detected, alert user immediately." \
  2>/dev/null || echo "  ⚠ Pattern alert cron may already exist"

echo "✓ Advanced workflows configured"

# Create workflow triggers
echo ""
echo "[3/4] Setting up workflow triggers..."

mkdir -p workspace/workflows

cat > workspace/workflows/enhanced-routing.json << 'EOF'
{
  "version": "2.0",
  "workflows": [
    {
      "name": "Daily Enhanced Briefing",
      "trigger": "07:00",
      "steps": [
        {"agent": "Alfred", "action": "briefing", "output": "archive"},
        {"agent": "PatternDetector", "action": "daily_scan", "input": "alfred_output"},
        {"agent": "Synthesis", "action": "cross_domain", "if": "pattern_detected"}
      ]
    },
    {
      "name": "Deep Analysis Pipeline",
      "trigger": "on_demand",
      "steps": [
        {"agent": "Machiavelli", "action": "analyze", "output": "archive"},
        {"agent": "PatternDetector", "action": "correlate", "input": "machiavelli_topic"},
        {"agent": "Synthesis", "action": "integrate", "inputs": ["machiavelli", "patterns", "history"]}
      ]
    },
    {
      "name": "Retrospective Intelligence",
      "trigger": "on_demand",
      "steps": [
        {"agent": "Archivist", "action": "retrieve", "query": "user_input"},
        {"agent": "PatternDetector", "action": "trend_analysis", "input": "archive_span"},
        {"agent": "Synthesis", "action": "temporal", "inputs": ["archives", "patterns"]}
      ]
    }
  ]
}
EOF

echo "✓ Workflows configured"

# Update user guide
echo ""
echo "[4/4] Creating Phase 2 command reference..."

cat > workspace/PHASE2_COMMANDS.md << 'EOF'
# PHASE 2: Advanced Commands

## Pattern Detection

| Command | Function |
|---------|----------|
| `/patterns` | Show current pattern report (last 7 days) |
| `/trend [entity]` | Track specific entity over time |
| `/correlate [A] [B]` | Find connections between topics |
| `/anomalies` | List recent anomalies detected |
| `/predict [topic]` | 30-day forecast based on patterns |

## Cross-Agent Synthesis

| Command | Function |
|---------|----------|
| `/synthesize [topic]` | Full synthesis across all agents |
| `/briefing+` | Alfred briefing + synthesis layer |
| `/connect [A] [B]` | Cross-domain connection analysis |
| `/scenarios [situation]` | Generate probability-weighted futures |
| `/retrospective [date]` | "What did we know when?" analysis |

## Automated Reports

| Report | Schedule | Content |
|--------|----------|---------|
| Daily Briefing | 7:00 AM | Alfred + Pattern highlights |
| Pattern Scan | Friday 6:00 PM | Weekly trend analysis |
| Monthly Synthesis | Last day 8:00 PM | Strategic assessment |
| Alert Check | Every 6 hours | Threshold breach monitoring |

## Example Workflows

### Example 1: Russia-Ukraine Deep Dive
```
User: /analyze Russia-Ukraine peace talks

Orchestrator:
  → Machiavelli: Full geopolitical analysis
  → PatternDetector: Scan for Russia-Ukraine trends
  → Synthesis: Combine + generate scenarios

Output: Strategic assessment with 4 scenarios + probabilities
```

### Example 2: Weekly Intelligence Review
```
User: /patterns

Orchestrator:
  → PatternDetector: 7-day scan
  → Synthesis: Cross-domain connections
  → Archivist: Historical context

Output: Escalations, correlations, predictions
```

### Example 3: Retrospective Analysis
```
User: /retrospective 2026-02-15

Orchestrator:
  → Archivist: Retrieve briefings from Feb 15
  → PatternDetector: What trends were emerging?
  → Synthesis: What did we get right/wrong?

Output: Intelligence accuracy assessment
```
EOF

echo "✓ Command reference created"

echo ""
echo "=== PHASE 2 UPGRADE COMPLETE ==="
echo ""
echo "New Capabilities:"
echo ""
echo "  PATTERN DETECTOR"
echo "  ├── Frequency analysis (escalations, trends)"
echo "  ├── Sentiment trajectory"
echo "  ├── Correlation discovery"
echo "  └── Anomaly detection"
echo ""
echo "  SYNTHESIS ENGINE"
echo "  ├── Cross-domain synthesis"
echo "  ├── Temporal analysis"
echo "  ├── Agent fusion (Alfred + Machiavelli + Patterns)"
echo "  └── Scenario builder"
echo ""
echo "  AUTOMATED WORKFLOWS"
echo "  ├── Daily: Enhanced briefing (7am)"
echo "  ├── 6-hourly: Pattern alert check"
echo "  ├── Weekly: Pattern scan (Fridays 6pm)"
echo "  └── Monthly: Strategic synthesis (last day 8pm)"
echo ""
echo "New Commands:"
echo "  /patterns, /trend, /correlate, /synthesize, /scenarios, /retrospective"
echo ""
echo "See: workspace/PHASE2_COMMANDS.md for full reference"
