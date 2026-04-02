---
name: polymarket-bot
description: Automate Polymarket bot operations including fetching market data, placing trades, and implementing strategies like arbitrage. Use when users need to build or run bots for prediction markets, monitor prices, or execute trades on the Polygon blockchain.
metadata: {"clawdbot":{"emoji":"📊","requires":{"bins":["python3","pip"]}}}
allowed-tools: Bash(polymarket-bot:*)
---

# Polymarket Bot

## Overview

This Skill provides a modular framework to build, test, and run Polymarket trading bots on Polygon. It includes scripts for:
- Fetching active markets (`fetch_markets.py`)
- Authentication (`auth_setup.py`)
- Strategy implementation (`strategy_logic.py`)
- Full bot integration (`bot_integration.py`)

## Features

- Polymarket API integration (Gamma, CLOB, Data)
- Web3.py support
- Live market monitoring
- Price alerts
- Order placement
- Arbitrage and custom strategy templates
- Rate-limit and fee mitigation guidance
- Test/deploy utilities

## Quick Start

1. **Setup authentication:**
   ```bash
   python3 scripts/auth_setup.py
   ```

2. **Fetch markets:**
   ```bash
   python3 scripts/fetch_markets.py
   ```

3. **Run strategy:**
   ```bash
   python3 scripts/bot_integration.py
   ```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `POLYMARKET_API_KEY` | Your Polymarket API key |
| `POLYMARKET_PRIVATE_KEY` | Wallet private key for trading |
| `POLYGON_RPC_URL` | Polygon network RPC endpoint |

## Safety Notes

- Start with small amounts for testing
- Use testnet first if available
- Monitor rate limits
- Keep private keys secure
- This is experimental software — use at your own risk

## APIs Covered

- **Gamma API** — Market browsing, events
- **CLOB API** — Order book, trading
- **Data API** — Historical data, analytics

## Use Cases

- Automated arbitrage detection
- Market-making strategies
- Portfolio monitoring
- Research-driven execution
- Price alerts and notifications

## License

See repository for license details.
