#!/bin/bash
# Polymarket Monitor - Run monitoring cycle

cd "$(dirname "$0")"

echo "=== Polymarket Market Monitor ==="
echo "Started: $(date)"
echo ""

# Run monitoring
python3 monitor.py monitor

echo ""
echo "=== Feed Summary ==="
python3 api.py nerv | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'Events: {d[\"count\"]}'); print(f'Critical: {len([e for e in d[\"events\"] if e[\"severity\"]==\"critical\"])}'); print(f'High: {len([e for e in d[\"events\"] if e[\"severity\"]==\"high\"])}')"

echo ""
echo "Completed: $(date)"
