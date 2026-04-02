---
name: polymarket-monitor
description: Automated market monitoring system for Polymarket prediction markets. Tracks price movements, generates alerts, and outputs NERV-dashboard compatible feeds. Monitors crypto, geopolitics, AI, biotech, and general markets.
metadata:
  openclaw:
    emoji: "📡"
    tags:
      - polymarket
      - monitoring
      - alerts
      - dashboard
      - markets
      - prediction-markets
---

# Polymarket Market Monitor

Automated monitoring system for Polymarket prediction markets with price movement alerts and NERV dashboard integration.

## Quick Start

```bash
# Run full monitoring cycle
python3 ~/.openclaw/skills/polymarket-monitor/monitor.py

# Or use the wrapper script
~/.openclaw/skills/polymarket-monitor/run.sh
```

## Features

- **Automated Monitoring**: Tracks 10+ markets across crypto, geopolitics, AI, biotech
- **Price Alerts**: Triggers on 3-5% movements (configurable per market)
- **Trend Detection**: Identifies surging/crashing patterns
- **History Tracking**: Maintains price history for change calculations
- **NERV Integration**: Outputs in dashboard-compatible format

## Commands

### Run Monitoring
```bash
python3 ~/.openclaw/skills/polymarket-monitor/monitor.py monitor
```
Fetches all market data, calculates changes, generates alerts, saves feed.

### Get Dashboard Feed
```bash
python3 ~/.openclaw/skills/polymarket-monitor/api.py nerv
```
Outputs markets formatted as NERV intel events.

### Get Watchtower Alerts
```bash
python3 ~/.openclaw/skills/polymarket-monitor/api.py watchtower
```
Outputs recent alerts for the Watchtower feed.

### View Raw Data
```bash
python3 ~/.openclaw/skills/polymarket-monitor/api.py raw
```
Outputs raw market feed with all fields.

### Add New Market
```bash
python3 ~/.openclaw/skills/polymarket-monitor/monitor.py add geopolitics "market-slug" "Market Name"
```

## Configuration

Edit `markets.json` to customize tracked markets:

```json
{
  "category": [
    {
      "id": "market-slug",
      "name": "Display Name",
      "threshold": 0.05,
      "description": "What this market tracks"
    }
  ]
}
```

**Threshold**: Price change % required to trigger alert (0.05 = 5%)

## Output Files

| File | Purpose |
|------|---------|
| `market_feed.json` | Current market snapshot |
| `alerts.json` | Generated alerts history |
| `price_history.json` | Historical price data |

## NERV Dashboard Integration

### API Route (Vercel)
Add to your `/api/` folder:

```typescript
// api/market-feed.ts
import { execSync } from 'child_process';

export default function handler(req, res) {
  const output = execSync(
    'python3 ~/.openclaw/skills/polymarket-monitor/api.py nerv'
  );
  const data = JSON.parse(output);
  res.status(200).json(data);
}
```

### Frontend Integration
```typescript
// In your Overwatch or War Room tab
const [marketEvents, setMarketEvents] = useState([]);

useEffect(() => {
  fetch('/api/market-feed')
    .then(r => r.json())
    .then(data => setMarketEvents(data.events));
}, []);
```

## Scheduled Monitoring

Add to crontab for automatic updates:

```bash
# Every 15 minutes
*/15 * * * * ~/.openclaw/skills/polymarket-monitor/run.sh >> /var/log/market-monitor.log 2>&1
```

Or use Vercel Cron:

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/market-monitor",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

## Alert Types

| Type | Trigger | Severity |
|------|---------|----------|
| PRICE_MOVEMENT | > threshold change in 1h | medium/high |
| TREND_ALERT | surging/crashing detected | high/critical |

## Default Markets Tracked

**Crypto**: BTC > $150K, ETH ATH, SOL vs ETH  
**Geopolitics**: Trump 2028, Fed Rate Cut, Ukraine Ceasefire  
**AI**: AGI Milestone, AI Regulation  
**Biotech**: FDA Approval, CRISPR Breakthrough  
**Markets**: S&P 500 ATH, Recession 2026

## Troubleshooting

**"Failed to fetch data"**
- Check internet connection
- Verify market slug exists on polymarket.com
- Check Gamma API availability

**No alerts generated**
- Normal when markets are stable
- Check `alerts.json` for history
- Lower threshold in `markets.json` for more sensitivity

**Empty feed**
- Run `monitor.py monitor` first to populate data
- Check `market_feed.json` exists

## Files

- `monitor.py` - Core monitoring logic
- `api.py` - API/formatting layer  
- `run.sh` - Convenience runner
- `markets.json` - Market configuration
- `SKILL.md` - This file
