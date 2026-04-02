# CIPHER Quick Reference Card

## Commands

| Command | Description | Time |
|---------|-------------|------|
| `Scan [ASSET]` | Quick health check | 2 min |
| `Research [ASSET]` | Full 4-pillar analysis | 5 min |
| `Deep dive [ASSET]` | Maximum granularity | 10 min |
| `Compare [X] vs [Y]` | Side-by-side analysis | 8 min |
| `Risk check [ASSET]` | Risk focus only | 4 min |
| `Flow analysis [ASSET]` | Capital flow focus | 4 min |
| `Narrative [ASSET]` | Sentiment only | 3 min |

## Output Structure

```
asset
├── fundamentals
│   ├── tvl (+ change)
│   ├── revenue
│   ├── market cap / fdv
│   └── category rank
├── tokenomics
│   ├── supply metrics
│   ├── emissions
│   └── next unlock
├── sentiment
│   ├── prediction markets
│   ├── funding rates
│   └── narrative
├── risk_indicators
│   ├── audit status
│   ├── liquidation levels
│   └── concentration
├── capital_flows
│   ├── exchange flows
│   ├── smart money
│   └── bridge activity
├── recent_events
├── data_gaps
└── research_notes
```

## Source Hierarchy (Most to Least Trusted)

1. Protocol docs / GitHub
2. DeFiLlama / Token Terminal
3. Coinglass / Derivatives data
4. Polymarket (direct)
5. CoinGecko / CMC (cross-ref only)
6. Social (narrative only)

## Red Flags to Watch

- [ ] No audit listed
- [ ] Unlock >30% of float within 30 days
- [ ] Funding >0.1% (overheated)
- [ ] Smart money distributing
- [ ] TVL declining while price rising
- [ ] Revenue not growing with users
- [ ] Governance controversy active

## Data Quality Indicators

| Status | Meaning |
|--------|---------|
| `complete` | All pillars verified |
| `partial` | Some data unavailable |
| `limited` | Critical gaps, verify manually |

## Quick Start

1. BrowserOS Settings → AI → System Prompt
2. Paste CIPHER persona
3. Save
4. Type: `Scan ETH`
5. Done

---
**Crypto Research OS v1.0**
