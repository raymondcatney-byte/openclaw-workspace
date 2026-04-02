#!/bin/bash

# INTELLIGENCE SYSTEM v1.0 - Setup Script
# Run this to initialize the full architecture

echo "=== INTELLIGENCE ARCHITECTURE SETUP ==="
echo ""

# Create directory structure
echo "[1/5] Creating directory structure..."
mkdir -p workspace/archive
mkdir -p workspace/signals
mkdir -p workspace/drafts
echo "✓ Directories created"

# Verify agents exist
echo ""
echo "[2/5] Verifying agent definitions..."
AGENTS=(
  "INTELLIGENCE_ORCHESTRATOR"
  "ARCHIVIST"
  "DAILY_BRIEFING_ALFRED"
  "MACHIAVELLI_GEOSTRATEGIST"
)

for agent in "${AGENTS[@]}"; do
  if [ -f "workspace/agents/${agent}.md" ]; then
    echo "  ✓ ${agent}"
  else
    echo "  ✗ ${agent} MISSING"
  fi
done

# Initialize archive index
echo ""
echo "[3/5] Initializing archive system..."
if [ ! -f "workspace/archive/index.json" ]; then
  echo '{"entries": [], "created": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > workspace/archive/index.json
  echo "✓ Archive index created"
else
  echo "✓ Archive index exists"
fi

# Create sample monitor list
echo ""
echo "[4/5] Setting up default monitors..."
cat > workspace/signals/monitors.json << 'EOF'
{
  "active": [
    {"id": "russia-oil", "query": "Russia oil exports shadow fleet", "priority": "high"},
    {"id": "china-ai", "query": "China AI chip restrictions DeepSeek", "priority": "high"},
    {"id": "crispr-fda", "query": "FDA CRISPR gene editing approval", "priority": "medium"},
    {"id": "turkey-f35", "query": "Turkey F-35 Erdogan", "priority": "medium"},
    {"id": "fed-cbdc", "query": "Federal Reserve CBDC digital dollar", "priority": "low"}
  ],
  "created": "EOF_DATE"
}
EOF
sed -i "s/EOF_DATE/$(date -u +%Y-%m-%dT%H:%M:%SZ)/" workspace/signals/monitors.json
echo "✓ Default monitors configured"

# Setup cron jobs
echo ""
echo "[5/5] Configuring automated workflows..."

# Morning briefing (7am)
openclaw cron add --name "Morning Briefing" \
  --schedule "0 7 * * *" \
  --payload "Read workspace/agents/DAILY_BRIEFING_ALFRED.md and execute daily briefing protocol with PAST 24 HOURS filter. Archive output to workspace/archive/$(date +%Y-%m-%d)/" \
  2>/dev/null || echo "  ⚠ Morning briefing cron may already exist"

# Evening archival (9pm)
openclaw cron add --name "Evening Archive" \
  --schedule "0 21 * * *" \
  --payload "Read workspace/agents/ARCHIVIST.md and execute daily sweep. Collect all day's outputs, generate summary, update index." \
  2>/dev/null || echo "  ⚠ Evening archive cron may already exist"

echo "✓ Cron jobs configured"

echo ""
echo "=== SETUP COMPLETE ==="
echo ""
echo "Your Intelligence Architecture is ready:"
echo ""
echo "  Alfred        → Daily briefings (7am auto, or /brief command)"
echo "  Machiavelli   → Deep analysis (on-demand)"
echo "  Archivist     → Storage & retrieval (auto + /recall command)"
echo "  Orchestrator  → Routes everything intelligently"
echo ""
echo "Commands you can use:"
echo "  /brief        → Trigger Alfred immediately"
echo "  /analyze X    → Spawn Machiavelli on topic X"
echo "  /watch X      → Add X to monitoring list"
echo "  /recall X     → Search archives for X"
echo "  /status       → Show active monitors + pending tasks"
echo ""
echo "Next: Test the system with 'openclaw agent:spawn Alfred briefing'"
