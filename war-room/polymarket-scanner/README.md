# Polymarket Alpha Scanner

Real-time scanner for Polymarket arbitrage opportunities, whale tracking, and market inefficiencies.

## Features

- **Arbitrage Detection**: Find markets where YES + NO < $1.00
- **Whale Tracking**: Monitor high-performing wallets
- **Inefficiency Scanner**: Detect mispriced, stale, and lagging markets
- **Real-time Signals**: Combined dashboard for all alpha sources
- **War Room Integration**: Export data for your existing systems

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env with your API keys

# Build
npm run build

# Run arbitrage scanner
npm run arb

# Watch for opportunities
npm run arb:watch

# Full signals dashboard
npm run signals
```

## Commands

### `arb` - Arbitrage Scanner
Find risk-free arbitrage where YES + NO < $1.00
```bash
npm run arb                    # Single scan
npm run arb:watch             # Continuous monitoring
npm run arb -- --min-edge 1.0 # 1% minimum edge
```

### `whales` - Whale Tracker
Track high-performing wallets
```bash
npm run whales
npm run whales -- --top 20    # Show top 20 whales
npm run whales -- --category Sports
```

### `inefficiencies` - Market Inefficiencies
Find mispriced markets
```bash
npm run inefficiencies
npm run inefficiencies -- --severity HIGH
npm run inefficiencies:watch
```

### `signals` - Combined Dashboard
All alpha signals in one view
```bash
npm run signals
npm run signals -- --interval 60  # 60-second refresh
```

## Environment Variables

```env
POLYMARKET_API_KEY=your_api_key
POLYMARKET_SECRET=your_secret
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

## Alpha Signal Types

### Arbitrage
- **Trigger**: YES + NO < 1.00
- **Edge**: Guaranteed profit at resolution
- **Execution**: Fill-or-Kill orders recommended
- **Risk**: Leg risk if one side doesn't fill

### Mispriced Markets
- **Trigger**: Odds deviate >15% from historical base rate
- **Example**: 70% favorite when base rate is 55%
- **Signal**: Mean reversion opportunity

### Stale Odds
- **Trigger**: No price update in 24+ hours with high volume
- **Cause**: Information not yet priced in
- **Signal**: Early mover advantage

### Information Lag
- **Trigger**: Polymarket odds differ >10% from external sources
- **Sources**: Sportsbooks, betting exchanges, prediction aggregators
- **Signal**: Cross-market arbitrage

### Low Liquidity
- **Trigger**: High volume but thin order book
- **Opportunity**: Whale can move market significantly
- **Risk**: Slippage on exit

## Integration with War Room

### Export Data
```bash
# JSON for API ingestion
npm run export -- --format json > war-room-data.json

# CSV for analysis
npm run export -- --format csv > opportunities.csv
```

### Programmatic Usage
```typescript
import { PolymarketScanner } from './scanner';

const scanner = new PolymarketScanner(apiKey, secret, supabaseUrl, supabaseKey);

// Get all signals
const markets = await scanner.fetchMarkets();
const arbs = await scanner.detectArbitrage(markets);
const ineffs = await scanner.detectInefficiencies(markets);
const whales = await scanner.identifyWhales();

// Feed into your system
warRoom.ingest({ arbs, ineffs, whales });
```

## Database Schema (Supabase)

```sql
-- Trades table for whale tracking
create table trades (
  id text primary key,
  market_id text not null,
  trader text not null,
  side text not null,
  size numeric not null,
  price numeric not null,
  timestamp timestamp not null,
  transaction_hash text not null
);

-- Create indexes for performance
create index idx_trades_trader on trades(trader);
create index idx_trades_timestamp on trades(timestamp);
create index idx_trades_market on trades(market_id);
```

## Risk Disclaimer

This scanner identifies opportunities but does not guarantee:
- Order fills (especially for arbitrage)
- Profitability (markets can stay irrational)
- Regulatory compliance (know your jurisdiction)

Always verify with your own due diligence.

## License

MIT
