---
name: polymarket
version: "3.0.0"
description: "Polymarket prediction markets at your fingertips - check odds, track portfolios, research markets with AI-powered analysis, compare markets, and trade. Covers all 4 Polymarket APIs: Gamma, CLOB, Data API, RTDS WebSocket, and Bridge. Read-only works instantly (no setup). The most comprehensive prediction markets skill on ClawHub."
author: mvanhorn
license: MIT
repository: https://github.com/mvanhorn/clawdbot-skill-polymarket
homepage: https://polymarket.com
metadata:
  openclaw:
    emoji: "📊"
    tags:
      - prediction-markets
      - polymarket
      - trading
      - odds
      - betting
      - forecasting
      - probabilities
      - portfolio
      - research
      - crypto
      - politics
      - sports
      - finance
      - websocket
      - bridge
      - data-api
    triggers:
      - polymarket
      - prediction market
      - prediction markets
      - what are the odds
      - market odds
      - betting odds
      - check odds
      - trending markets
      - market research
      - compare markets
      - portfolio positions
      - open positions
      - trade on polymarket
      - buy shares
      - sell shares
      - polymarket leaderboard
      - polymarket deposit
      - polymarket withdraw
      - crypto prices live
---

# Polymarket

Query [Polymarket](https://polymarket.com) prediction markets and trade from the terminal. Browse odds, research events, compare markets, track your portfolio, stream live data, bridge funds, and execute trades - all through natural language.

Polymarket exposes 4 separate APIs plus the Gamma convenience layer. This skill covers all of them.

## Setup

**Read-only commands work immediately** (no install needed). Browsing, searching, trending, categories, market research, and comparison mode all use the public Gamma API.

For trading, order books, price history, and advanced features, install the [Polymarket CLI](https://github.com/Polymarket/polymarket-cli) (Rust binary, v0.1.5+):

```bash
brew install polymarket/tap/polymarket-cli
```

For trading, set up a wallet:

```bash
polymarket wallet create
polymarket approve set
```

Or manually configure `~/.config/polymarket/config.json` with your private key. See the [CLI docs](https://github.com/Polymarket/polymarket-cli) for details.

The CLI also provides an interactive REPL:

```bash
polymarket shell
```

Use `--output json` on any CLI command for machine-readable output suitable for scripting and piping.

## Commands

### Browse Markets (no CLI needed)

```bash
# Trending/active markets (sorted by 24h volume)
python3 {baseDir}/scripts/polymarket.py trending

# Trending with more results
python3 {baseDir}/scripts/polymarket.py trending --limit 20

# Search markets by keyword
python3 {baseDir}/scripts/polymarket.py search "trump"

# Get specific event by slug
python3 {baseDir}/scripts/polymarket.py event "fed-decision-in-october"

# Get markets by category
python3 {baseDir}/scripts/polymarket.py category politics
python3 {baseDir}/scripts/polymarket.py category crypto
python3 {baseDir}/scripts/polymarket.py category sports
python3 {baseDir}/scripts/polymarket.py category tech
python3 {baseDir}/scripts/polymarket.py category entertainment
python3 {baseDir}/scripts/polymarket.py category science
python3 {baseDir}/scripts/polymarket.py category business
```

### Market Research Mode (no CLI needed)

Market research combines Polymarket odds with contextual analysis. When the user asks to "research" a market or wants deeper analysis beyond just odds:

1. **Fetch the market data** using search or event commands
2. **Analyze the odds** - what does the market imply? Is there an edge?
3. **Provide context** - use your knowledge to explain what drives the odds
4. **Show historical movement** - if CLI is available, pull price history
5. **Compare to consensus** - how do Polymarket odds compare to polls, expert opinion, or other prediction markets?

```bash
# Step 1: Find the market
python3 {baseDir}/scripts/polymarket.py search "fed rate cut"

# Step 2: Get detailed event data
python3 {baseDir}/scripts/polymarket.py event "fed-rate-decision-march-2026"

# Step 3: If CLI available, get price history to show trend
python3 {baseDir}/scripts/polymarket.py price-history TOKEN_ID --interval 1d

# Step 4: Check order book depth for liquidity assessment
python3 {baseDir}/scripts/polymarket.py book TOKEN_ID
```

### Market Comparison Mode (no CLI needed)

Compare related markets side-by-side. Useful for finding arbitrage, understanding conditional probabilities, or just seeing how different outcomes relate.

```bash
# Compare two or more related markets by searching for each
python3 {baseDir}/scripts/polymarket.py search "trump 2028"
python3 {baseDir}/scripts/polymarket.py search "desantis 2028"
python3 {baseDir}/scripts/polymarket.py search "newsom 2028"
```

### Portfolio Dashboard (CLI + wallet required)

View your complete portfolio with positions, P&L, and open orders in one view.

```bash
# View all open positions
python3 {baseDir}/scripts/polymarket.py positions

# Check USDC balance
python3 {baseDir}/scripts/polymarket.py wallet-balance

# List all open orders
python3 {baseDir}/scripts/polymarket.py orders
```

### Order Book & Prices (CLI required, no wallet)

```bash
# Order book for a token
python3 {baseDir}/scripts/polymarket.py book TOKEN_ID

# Price history (intervals: 1m, 1h, 6h, 1d, 1w, max)
python3 {baseDir}/scripts/polymarket.py price-history TOKEN_ID --interval 1d
```

### Trading (CLI + wallet required)

All trades require `--confirm` to execute. Without it, the order is previewed only.

```bash
# Preview a limit order (no --confirm = preview only)
python3 {baseDir}/scripts/polymarket.py trade buy --token TOKEN_ID --price 0.50 --size 10

# Execute a limit order
python3 {baseDir}/scripts/polymarket.py --confirm trade buy --token TOKEN_ID --price 0.50 --size 10

# Market order: buy $5 worth at current price
python3 {baseDir}/scripts/polymarket.py --confirm trade buy --token TOKEN_ID --market-order --amount 5
```

### Orders & Positions (CLI + wallet required)

```bash
# List open orders
python3 {baseDir}/scripts/polymarket.py orders

# Cancel a specific order
python3 {baseDir}/scripts/polymarket.py --confirm orders --cancel ORDER_ID

# Cancel all orders
python3 {baseDir}/scripts/polymarket.py --confirm orders --cancel all
```

## API Reference

Polymarket exposes 4 distinct APIs:

1. **Gamma API** (gamma-api.polymarket.com) - Public, browsing/search
2. **CLOB API** (clob.polymarket.com) - Trading, order books
3. **Data API** (data-api.polymarket.com) - Portfolio, analytics
4. **RTDS WebSocket** (wss://ws-live-data.polymarket.com) - Real-time streaming
5. **Bridge API** (bridge.polymarket.com) - Cross-chain deposits/withdrawals

## Safety Notes

- **Real money.** Trades execute on Polygon with real USDC.
- **All trades require `--confirm`.** Without it, you get a preview only.
- **The CLI is experimental.** Use at your own risk.
- **Private key security.** Never share your private key.
- **Gas fees.** On-chain operations require MATIC for gas.

## Usage Examples

**Quick odds check:**
```bash
python3 {baseDir}/scripts/polymarket.py search "trump 2028 president"
```

**Trending markets:**
```bash
python3 {baseDir}/scripts/polymarket.py trending
```

**Portfolio view:**
```bash
python3 {baseDir}/scripts/polymarket.py positions
```

## License

MIT
