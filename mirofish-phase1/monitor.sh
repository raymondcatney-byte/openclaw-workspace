#!/bin/bash
# Masters Price Monitor - Daily Runner
# Add to crontab: 0 9 * * * cd /root/.openclaw/workspace/mirofish-phase1 && ./monitor.sh

cd /root/.openclaw/workspace/mirofish-phase1

echo "========================================"
echo "Masters Monitor - $(date)"
echo "========================================"

# Run the monitor
npx tsx src/jobs/masters-monitor.ts

echo ""
echo "Monitor complete at $(date)"
