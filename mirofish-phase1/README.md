# 🐟 MiroFish Phase 1

**50-Agent Paper Trading System for Polymarket**

Replicates the architecture that made $1.49M — adapted for your constraints.

---

## 🎯 What This Is

A minimal but complete implementation of multi-agent prediction market intelligence:

- **50 agents** with distinct personas (fundamental, technical, sentiment, whale, behavioral)
- **Consensus engine** using clustering and weighted aggregation
- **Kelly criterion** position sizing for risk management
- **Paper trading** to prove edge before real money
- **SQLite database** to log every prediction from day 1

**Cost:** ~$0.42/day (Groq free tier)

---

## 📁 Structure

```
mirofish-phase1/
├── src/
│   ├── types/           # TypeScript interfaces
│   ├── agents/          # Agent personas + simulation engine
│   ├── consensus/       # Clustering + consensus generation
│   ├── execution/       # Kelly criterion position sizing
│   ├── data/            # Polymarket + news data fetchers
│   ├── database/        # SQLite schema + connection
│   └── jobs/            # Daily scan job
├── scripts/             # Setup + utilities
├── package.json
├── tsconfig.json
└── drizzle.config.ts
```

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd mirofish-phase1
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your keys
```

**Required:**
- `GROQ_API_KEY` — Get free at [console.groq.com](https://console.groq.com/keys)

**Optional:**
- `NEWSAPI_KEY` — For real news (100 requests/day free)

### 3. Setup Database

```bash
npm run setup
```

### 4. Run Dry Scan (Test Mode)

```bash
npm run scan:dry
```

This runs the full simulation without saving to database. Check output looks good.

### 5. Run Live Scan

```bash
npm run scan
```

Logs all predictions to SQLite database for tracking.

---

## ⚙️ Configuration

Edit `.env` to customize:

| Variable | Default | Description |
|----------|---------|-------------|
| `PAPER_BANKROLL` | 10000 | Starting paper money ($) |
| `KELLY_FRACTION` | 0.25 | Conservative Kelly (0.25 = quarter Kelly) |
| `MIN_EDGE` | 0.05 | Minimum edge to trade (5%) |
| `MIN_CONFIDENCE` | 0.30 | Minimum consensus confidence (30%) |
| `AGENT_COUNT` | 50 | Number of agents to simulate |
| `MAX_MARKETS_PER_RUN` | 20 | Markets to analyze per scan |

---

## 📊 Understanding Output

```
🔮 MIROFISH DAILY SCAN
======================
Config: 50 agents, $10000 bankroll, 0.25 Kelly

📈 Fetching markets...
Found 12 markets

[1/12]
📊 Will JD Vance win the 2028 US Presidential Election?...
   Market: 50.0¢ Yes / $500,000 liquidity
   Simulating 50 agents... 50/50
   Consensus: 58.3% (confidence: 72.1%)
   ✅ POSITION: YES $423.50 @ 50.0¢ (edge: 8.3%)

📊 SCAN COMPLETE
=================
Markets analyzed: 12
Positions: 3
Total exposure: $892.45
Time: 45.2s
Est. cost: $0.252
```

**What this means:**
- Your agents think Vance has 58.3% chance
- Market prices it at 50%
- 8.3% edge detected → enter position
- Quarter Kelly says bet $423.50

---

## 🗄️ Database Schema

**predictions table:**
- Every prediction logged with timestamp
- Consensus probability + confidence
- Market price at time of prediction
- Edge calculation
- Recommended position (direction + size)
- Actual position taken (when you execute)
- Resolution outcome (when market closes)
- P&L calculation

**Query examples:**

```bash
# View recent predictions
npm run db:studio

# Or use sqlite3 directly
sqlite3 mirofish.db "SELECT * FROM predictions ORDER BY timestamp DESC LIMIT 10;"
```

---

## 📈 Success Metrics (30 Days)

| Week | Target | How to Check |
|------|--------|--------------|
| 1 | 50+ predictions logged | `SELECT COUNT(*) FROM predictions;` |
| 2 | First markets resolve | `SELECT * FROM predictions WHERE resolved = true;` |
| 3 | >52% accuracy | Calculate `correct_predictions / total_resolved` |
| 4 | >55% accuracy + positive paper P&L | Compare predicted vs actual outcomes |

**Success = 30 days of logged predictions with >52% accuracy**

---

## 🔄 From Paper to Real Money

### When to Go Live

1. **Accuracy >55%** over 100+ predictions
2. **Calibration good** (predicted confidence ≈ actual accuracy)
3. **Positive paper P&L**
4. **Understand your edge**

### Gradual Live Deployment

```
Week 5-6:  $100 positions (1% of bankroll)
Week 7-8:  $500 positions (5% of bankroll)  
Week 9-12: Full Kelly sizing
Month 4+:  Scale bankroll with profits
```

---

## 🧪 Testing

```bash
# Unit tests
npm test

# Manual test with mock data
DRY_RUN=true npm run scan

# Single market analysis
npm run scan -- --market-id mock-1
```

---

## 🛠️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Market    │────▶│  50 Agents  │────▶│  Consensus  │
│   Data      │     │  (Groq LLM) │     │  Engine     │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   SQLite    │◀────│   Paper     │◀────│    Kelly    │
│   Database  │     │   Trade     │     │   Sizing    │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 🎓 How It Works

1. **Fetch Markets** — Get active Polymarket markets with liquidity
2. **Build Context** — Gather news + data for each market
3. **Simulate Agents** — 50 agents with different personas analyze
4. **Cluster Opinions** — Group similar predictions
5. **Generate Consensus** — Weighted average of clusters
6. **Calculate Edge** — Compare consensus to market price
7. **Size Position** — Kelly criterion for risk management
8. **Log Everything** — Store for performance tracking

---

## 💰 Cost Breakdown

| Component | Cost |
|-----------|------|
| Groq API (50 agents × 20 markets) | ~$0.42/day |
| NewsAPI (optional) | Free tier (100 req/day) |
| SQLite | Free (local) |
| **Total** | **~$12.60/month** |

Groq free tier: 10K tokens/day  
Your usage: ~8K tokens/day  
Well within limits.

---

## 🚨 Troubleshooting

**"GROQ_API_KEY not set"**
→ Get key at https://console.groq.com/keys, add to .env

**"No markets found"**
→ Polymarket API may be rate limited. Uses mock data automatically.

**"Low confidence consensus"**
→ Normal. Agents disagree. Only trade high-confidence opportunities.

**"Kelly suggests 0 position"**
→ Edge too small or negative EV. This is correct behavior.

---

## 🗺️ Roadmap

**Phase 1 (Now):** Paper trading, 50 agents, prove edge  
**Phase 2:** Add critic model (learn which agents to trust)  
**Phase 3:** Scale to 500+ agents  
**Phase 4:** Live trading with small positions  
**Phase 5:** Oracle of When integration (biological timing)  
**Phase 6:** ASAE autonomous treasury

---

## 📝 License

MIT — Use at your own risk. This is experimental software for educational purposes.

---

**Built to replicate $1.49M in Polymarket profits. Your move.** 🎯
