# Masters Price Monitor

Daily tracking of Polymarket odds vs MiroFish model predictions.

## Quick Start

```bash
# Run once manually
cd /root/.openclaw/workspace/mirofish-phase1
npx tsx src/jobs/masters-monitor.ts

# Or use the runner
./monitor.sh
```

## Setup Daily Monitoring (Cron)

```bash
# Edit crontab
crontab -e

# Add this line to run daily at 9 AM:
0 9 * * * cd /root/.openclaw/workspace/mirofish-phase1 && ./monitor.sh >> monitor.log 2>&1

# Or use 6 PM for evening check:
0 18 * * * cd /root/.openclaw/workspace/mirofish-phase1 && ./monitor.sh >> monitor.log 2>&1
```

## What It Tracks

### Portfolio Players (Your Bets)
| Player | Model | Target Edge | Alert If |
|--------|-------|-------------|----------|
| Hideki Matsuyama | 12.5% | +5.0% | Edge drops below 5% |
| Jordan Spieth | 8.6% | +4.0% | Edge drops below 4% |
| Will Zalatoris | 6.8% | +3.0% | Edge drops below 3% |
| Jon Rahm | 11.4% | +2.0% | Edge drops below 2% |
| Brooks Koepka | 7.1% | +2.0% | Edge drops below 2% |

### Alerts Generated
- 📈 Edge improves by 2%+
- 📉 Edge declines by 2%+
- 🎯 New STRONG BUY (edge crosses +5%)
- ⚠️ Value evaporates (edge drops below -3%)
- 💰 Price moves 1.5¢+ in either direction

## Output Files

| File | Purpose |
|------|---------|
| `masters_price_history.json` | Daily price snapshots |
| `monitor.log` | Cron job logs |
| Console output | Daily summary |

## Sample Output

```
🔮 MIROFISH GOLF - MASTERS PRICE MONITOR
==================================================
Run time: 2026-03-18T09:00:00.000Z

📊 PORTFOLIO TRACKING

Player                 | Model | Market | Edge  | Change
-----------------------------------------------------------------
Hideki Matsuyama       | 12.5% |  5.2%  | +7.3% | 📈 +0.5%
Jordan Spieth          |  8.6% |  2.9%  | +5.7% | ➖ -0.1%
Will Zalatoris         |  6.8% |  2.4%  | +4.4% | 📈 +0.2%
Jon Rahm               | 11.4% |  7.8%  | +3.6% | 📉 -0.3%
Brooks Koepka          |  7.1% |  3.8%  | +3.3% | ➖ 0.0%

📈 TOP VALUES TODAY

1. Hideki Matsuyama: +7.3% edge (STRONG BUY)
2. Jordan Spieth: +5.7% edge (STRONG BUY)
3. Will Zalatoris: +4.4% edge (BUY)
4. Jon Rahm: +3.6% edge (BUY)
5. Brooks Koepka: +3.3% edge (BUY)

🚨 ALERTS

📈 Hideki Matsuyama: Edge improved by +0.5% (now +7.3%)

📋 SUMMARY

Best value: Hideki Matsuyama (+7.3%)
Biggest move: Ludvig Åberg (-0.8¢)
Market avg edge: +1.2%

💾 Data saved to masters_price_history.json
📊 2 days of history recorded
```

## Advanced: Connect to Real Polymarket API

The current script uses simulated prices. To connect to live data:

1. Get Polymarket API access
2. Update `fetchPolymarketPrices()` in `masters-monitor.ts`:

```typescript
async function fetchPolymarketPrices(): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  
  for (const [name, marketId] of Object.entries(MARKET_IDS)) {
    const response = await fetch(
      `https://gamma-api.polymarket.com/markets/${marketId}`
    );
    const data = await response.json();
    prices[name] = parseFloat(data.outcomePrices[0]); // YES price
  }
  
  return prices;
}
```

## Price History Analysis

View trends over time:

```bash
# See price history
cat masters_price_history.json | jq '.[].date'

# Check Matsuyama's edge trend
cat masters_price_history.json | jq '.[].players["Hideki Matsuyama"].edge'
```

## Manual Price Update

If you get live odds from elsewhere (Discord, website), update manually:

```bash
# Edit the data file and run monitor
# It will detect changes and alert
```

## Important Dates to Watch

| Date | Event | Monitor Frequency |
|------|-------|-------------------|
| April 1-2 | Final data refresh | Daily |
| April 7 | Tee times released | Check immediately |
| April 8 | Practice rounds | Daily |
| April 9-12 | Tournament | Every hour |

## Telegram/Discord Alerts (Optional)

Add webhook to `generateAlerts()`:

```typescript
// Send to Discord
await fetch('YOUR_WEBHOOK_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: alertMessage })
});
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Cannot find module" | Run `npm install` |
| "Permission denied" | Run `chmod +x monitor.sh` |
| Cron not running | Check `crontab -l`, verify path |
| Old data shown | Delete `masters_price_history.json` to reset |

## License

Part of MiroFish Golf Analysis System.
