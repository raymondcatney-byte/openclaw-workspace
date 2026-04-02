# Polymarket Engine

Cloud-hosted search + anomaly detection for Polymarket. Indexes 7 sectors (GEOPOLITICS, AI, DeFi, COMMODITIES, ENERGY, BIOTECH, MACRO) and detects unusual volume/price movements.

## Architecture

```
┌─────────────────────────────────────────────┐
│  Vercel (Next.js + API Routes)             │
│  ├─ /api/cron/index (runs every 5 min)     │
│  ├─ /api/markets (search)                  │
│  ├─ /api/market/[id] (details)             │
│  ├─ /api/alerts (stored alerts)            │
│  ├─ /api/anomalies (real-time detection)   │
│  └─ /api/sectors (stats)                   │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│  Supabase (Postgres)                        │
│  ├─ markets (current state)                 │
│  ├─ price_history (time series)             │
│  └─ alerts (detected anomalies)             │
└─────────────────────────────────────────────┘
```

## Deploy in 5 Minutes

### 1. Create Supabase Project

```bash
# Sign up at https://supabase.com
# Create new project
# Copy Project URL and Service Role Key
```

Run the schema:
```bash
# In Supabase SQL Editor, paste contents of supabase/schema.sql
```

### 2. Deploy to Vercel

```bash
# Clone this repo or create new project
git init
git add .
git commit -m "Initial commit"

# Deploy to Vercel
npm i -g vercel
vercel --prod
```

### 3. Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
CRON_SECRET=any_random_string_here
```

**Important**: Use `SUPABASE_SERVICE_ROLE_KEY` (not anon key) - the indexer needs to bypass RLS.

### 4. Trigger First Index

```bash
# Manually trigger indexer
curl "https://your-app.vercel.app/api/cron/index?secret=your_cron_secret"
```

The cron will run automatically every 5 minutes after this.

## API Endpoints

### Search Markets
```
GET /api/markets?sector=ENERGY&min_price=0.2&max_price=0.8&min_volume=10000&search=oil
```

**Query Parameters:**
- `sector`: One of GEOPOLITICS, AI, DeFi, COMMODITIES, ENERGY, BIOTECH, MACRO
- `min_price`, `max_price`: Price range filter
- `min_volume`: Minimum daily volume
- `search`: Full-text search in market question
- `ending_soon`: Boolean, markets closing in 24h

**Response:**
```json
{
  "markets": [
    {
      "condition_id": "0x...",
      "question": "Will oil exceed $100 by June?",
      "slug": "will-oil-exceed-100",
      "sector": "ENERGY",
      "yes_price": 0.42,
      "volume": 450000,
      "liquidity": 120000
    }
  ],
  "count": 1
}
```

### Get Market Details
```
GET /api/market/0x...
```

**Response:**
```json
{
  "market": { ... },
  "price_history": [
    { "yes_price": 0.40, "volume": 400000, "timestamp": "2026-03-21T10:00:00Z" },
    { "yes_price": 0.42, "volume": 450000, "timestamp": "2026-03-21T11:00:00Z" }
  ]
}
```

### Get Alerts
```
GET /api/alerts?sector=GEOPOLITICS&min_severity=80
```

**Response:**
```json
{
  "alerts": [
    {
      "id": 1,
      "sector": "GEOPOLITICS",
      "alert_type": "VOLUME_SPIKE",
      "severity": 94,
      "description": "Volume +3.2σ | +18.5%",
      "timestamp": "2026-03-21T14:23:07Z",
      "market": { ... }
    }
  ]
}
```

### Get Real-time Anomalies
```
GET /api/anomalies
```

Calculates anomalies on-demand using 7-day baseline. Returns markets with score ≥ 50.

### Get Sector Stats
```
GET /api/sectors
```

**Response:**
```json
{
  "sectors": [
    { "name": "ENERGY", "market_count": 45, "avg_volume": 120000, "alerts_today": 3 }
  ],
  "total_markets": 312,
  "total_alerts_today": 12
}
```

## War Room Integration

Your dashboard calls the API:

```javascript
// Fetch all GEOPOLITICS markets
const res = await fetch('https://your-app.vercel.app/api/markets?sector=GEOPOLITICS');
const { markets } = await res.json();

// Display on globe
markets.forEach(m => {
  globe.addMarker({
    lat: getLatForSector(m.sector), // You map this
    lng: getLngForSector(m.sector),
    value: m.yes_price,
    sector: m.sector,
    volume: m.volume
  });
});

// Poll for anomalies every 30s
setInterval(async () => {
  const res = await fetch('https://your-app.vercel.app/api/anomalies');
  const { anomalies } = await res.json();
  
  anomalies.forEach(a => {
    if (a.total_score >= 80) {
      globe.pulseRed(a.market.sector);
      showAlert(a);
    }
  });
}, 30000);
```

## Sector Classification

Markets are auto-classified by keywords:

| Sector | Keywords |
|--------|----------|
| GEOPOLITICS | war, israel, iran, ukraine, russia, china, election, nato |
| AI | agi, ai, gpt, llm, openai, anthropic, model, regulation |
| DeFi | hack, exploit, defi, protocol, dex, stablecoin, sec |
| COMMODITIES | gold, silver, copper, wheat, supply chain, shortage |
| ENERGY | oil, gas, opec, pipeline, refinery, nuclear, electricity |
| BIOTECH | fda, trial, drug, vaccine, pandemic, approval, pharma |
| MACRO | fed, cpi, inflation, unemployment, recession, interest rate |

## Detection Logic

| Signal | Threshold | Score |
|--------|-----------|-------|
| Volume spike | >2.5σ above market's baseline | 12×σ (max 50) |
| Price move (1h) | >±10% | 40 |
| Price move (24h) | >±20% | 30 |

**Total Score:** Sum of all signals (capped at 100)  
**Alert Threshold:** Score ≥ 50  
**Rate Limit:** 1 alert per 30 minutes per market

## File Structure

```
polymarket-engine/
├── app/
│   └── api/
│       ├── cron/index/route.ts      # Indexer (every 5 min)
│       ├── markets/route.ts          # Search markets
│       ├── market/[id]/route.ts      # Market details
│       ├── alerts/route.ts           # Get alerts
│       ├── anomalies/route.ts        # Real-time detection
│       └── sectors/route.ts          # Sector stats
├── lib/
│   ├── supabase.ts                   # Database client
│   ├── classifier.ts                 # Sector classification
│   └── anomalies.ts                  # Detection logic
├── types/
│   └── index.ts                      # TypeScript types
├── supabase/
│   └── schema.sql                    # Database schema
├── vercel.json                       # Cron config
├── package.json
└── README.md
```

## Monitoring

Check indexer runs in Vercel Logs:
```
Vercel Dashboard → Your Project → Logs
```

Check Supabase data:
```sql
-- Count markets by sector
select sector, count(*) from markets group by sector;

-- Recent alerts
select * from alerts order by timestamp desc limit 10;

-- Price history for a market
select * from price_history 
where condition_id = '0x...' 
order by timestamp desc limit 100;
```

## Troubleshooting

**Indexer not running:**
- Check `CRON_SECRET` is set
- Verify Supabase credentials
- Check Vercel Logs for errors

**No alerts:**
- Wait 2+ hours (needs baseline data)
- Check `price_history` has data: `select count(*) from price_history;`

**CORS errors from dashboard:**
- Add CORS headers in API routes (not needed if same domain)

## Cost

| Service | Free Tier | Paid (if exceeded) |
|---------|-----------|-------------------|
| Vercel | 100GB bandwidth, 10s functions | $20/mo |
| Supabase | 500MB DB, 2GB egress | $25/mo |
| **Total** | **Free for most use** | **~$45/mo** |

## License

MIT
