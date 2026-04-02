# Quick Start Guide

## Option 1: Simple Scan (No Setup Required)

```bash
cd war-room/polymarket-scanner
node simple-arb.js
```

This fetches live markets and shows arbitrage opportunities immediately.

## Option 2: Full Scanner (With API Access)

### 1. Get API Keys
- Visit: https://polymarket.com/settings/api
- Generate API Key + Secret

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Install & Run
```bash
npm install
npm run build

# Single arbitrage scan
npm run arb

# Watch for opportunities
npm run arb:watch

# Full signals dashboard
npm run signals
```

## What to Look For

### ✅ Good Arbitrage Signals
- **Edge > 1%**: Worth the gas fees and effort
- **Liquidity > $10k**: Can actually fill both sides
- **Stable markets**: Avoid markets near resolution (time decay)

### ⚠️ Cautions
- **Leg Risk**: One side might not fill - use FOK orders
- **Gas Fees**: Polygon costs ~$0.007 but add up
- **Resolution Risk**: Markets can resolve unexpectedly

### 🎯 Best Opportunities
- New markets (initial pricing inefficiency)
- Low-volume sports/politics markets
- Markets after major news (lag in price updates)

## Example Output

```
💰 POLYMARKET ARBITRAGE SCANNER

Found 3 opportunities with YES + NO < $1.00

Edge     YES      NO       Sum      Profit     Liquidity   Market
--------------------------------------------------------------------
1.23%    0.420    0.550    0.970    $1.23      $45.2k      Will it rain...
0.85%    0.310    0.635    0.945    $0.85      $12.8k      Election winner...
0.52%    0.480    0.495    0.975    $0.52      $89.1k      Sports match...

💡 How to execute:
   Buy both YES and NO tokens for the same amount
   At resolution, one will be worth $1.00, the other $0
   Profit = $1.00 - (YES_price + NO_price)
```

## Next Steps

1. **Paper Trade First**: Track opportunities without executing
2. **Build Position Sizing**: Don't put more than 5% on any single market
3. **Automate**: Use the SDK to build auto-execution bots
4. **Expand**: Add whale tracking and inefficiency detection

## Integration Ideas

### War Room Dashboard
```javascript
// Fetch scanner data
const response = await fetch('http://localhost:3000/api/polymarket/signals');
const { arbs, inefficiencies, whales } = await response.json();

// Display on globe
arbs.forEach(arb => {
  globe.addMarker({
    lat: arb.location?.lat || 0,
    lng: arb.location?.lng || 0,
    type: 'ARBITRAGE',
    value: arb.edge,
    label: `${(arb.edge * 100).toFixed(2)}% edge`
  });
});
```

### Alerts
```bash
# Cron job to check every 5 minutes and alert
*/5 * * * * node /path/to/simple-arb.js | grep -A 10 "Found" | mail -s "Polymarket Arb Alert" you@email.com
```

## Support

- Polymarket API Docs: https://docs.polymarket.com/
- CLOB Client SDK: https://github.com/Polymarket/clob-client
- War Room Issues: Create a GitHub issue
