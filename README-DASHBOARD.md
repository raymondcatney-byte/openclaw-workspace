# Market Anomaly Scanner — Dashboard-Only Mode

**Cloud-native market intelligence. No localhost servers.**

## Architecture
- **Frontend**: Next.js 14 (App Router) + React
- **Runtime**: Vercel Edge (no Node.js servers to manage)
- **Data Sources**: Direct connections to live APIs
- **External Access**: HTTPS endpoints (not localhost)

## Live Data Sources
| Source | Connection | Auth Required |
|--------|-----------|---------------|
| Polymarket RTDS | WebSocket (`wss://ws-live-data...`) | ❌ No |
| Polymarket Gamma | REST (`https://gamma-api...`) | ❌ No |
| Open-Meteo | REST (`https://api.open-meteo.com`) | ❌ No |
| CoinGecko | REST (`https://api.coingecko.com`) | ❌ No |

## What Runs Where

```
┌─────────────────────────────────────────────────────┐
│  Vercel Edge (Your Deployment)                      │
│  ├── Next.js Pages (Dashboard UI)                   │
│  ├── API Routes (/api/*) — Edge Runtime             │
│  └── Static Assets                                  │
└─────────────────────────────────────────────────────┘
           │
           │ HTTPS / WebSocket
           ▼
┌─────────────────────────────────────────────────────┐
│  External APIs (You don't host these)               │
│  ├── Polymarket RTDS (WebSocket)                    │
│  ├── Polymarket Gamma API (REST)                    │
│  └── Other data sources                             │
└─────────────────────────────────────────────────────┘
```

## A2A Server Note
The `a2a_server.py` file exists as **reference documentation** but is **not running**. 
If you need A2A compatibility, use the HTTPS endpoints below instead of `localhost:8000`.

## API Endpoints (For Other Agents)

Once deployed to Vercel, other agents can call:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/signals?format=sse` | GET | Server-Sent Events stream |
| `/api/signals?format=json` | GET | One-time JSON snapshot |
| `/api/prices?symbols=BTC,ETH,SPY` | GET | Current prices |
| `/api/regime` | GET | Current market regime |
| `/api/movements` | GET | Unusual movement alerts |

Example:
```bash
curl https://your-app.vercel.app/api/prices?symbols=BTC,ETH,SPY
```

## Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Dashboard-only architecture"
git push origin main
```

### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or use GitHub integration:
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Framework preset: Next.js
4. Deploy

### 3. Done
No servers to manage. No localhost. Just a URL.

## Environment Variables
None required for core functionality.

Optional:
- `GROQ_API_KEY` — If adding AI synthesis features

## File Structure
```
app/
├── page.tsx                 # Dashboard UI
├── api/
│   ├── signals/route.ts     # GET /api/signals
│   ├── prices/route.ts      # GET /api/prices
│   ├── regime/route.ts      # GET /api/regime
│   └── movements/route.ts   # GET /api/movements
components/
├── AgentDashboard.tsx       # Main UI
├── RTDSMarketPanel.tsx      # Price display
├── SovereignSignalCorrelator.tsx
└── ...
hooks/
├── useRTDS.ts              # WebSocket to Polymarket
├── usePolymarket.ts        # REST to Gamma API
└── ...
ARCHITECTURE.md             # This architecture doc
a2a_server.py               # Reference only (not running)
```

## No Localhost Means
✅ **Yes**:
- WebSocket to external services (Polymarket RTDS)
- REST to external APIs (Gamma, CoinGecko)
- Edge runtime (Vercel)
- Browser client-side code

❌ **No**:
- `python a2a_server.py` running locally
- `localhost:8000` endpoints
- Self-hosted WebSocket servers
- Docker containers on your machine

## License
MIT
