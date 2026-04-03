# Dashboard-Only Architecture (No Localhost)

## Overview
This is a **client-side only** market intelligence dashboard. No servers running on localhost. All data fetched directly from live APIs via browser/Edge runtime.

## Data Sources (Live APIs Only)
| Source | Endpoint | Auth | Type |
|--------|----------|------|------|
| Polymarket RTDS | `wss://ws-live-data.polymarket.com` | None | WebSocket |
| Polymarket Gamma | `https://gamma-api.polymarket.com` | None | REST |
| Open-Meteo | `https://api.open-meteo.com` | None | REST |
| CoinGecko | `https://api.coingecko.com` | None | REST |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   User Browser                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  useRTDS    │  │usePolymarket│  │ useCrossAsset   │ │
│  │  (WebSocket)│  │   (REST)    │  │   (Analysis)    │ │
│  └──────┬──────┘  └──────┬──────┘  └─────────────────┘ │
│         │                │                              │
│         ▼                ▼                              │
│  wss://ws-live      https://gamma-api                   │
│  -data.polymarket   .polymarket.com                     │
│         .com                                            │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Next.js Edge Runtime (Vercel)         │   │
│  │  ┌─────────────┐  ┌─────────────┐              │   │
│  │  │ /api/signals│  │ /api/prices │              │   │
│  │  │  (HTTP SSE) │  │   (REST)    │              │   │
│  │  └─────────────┘  └─────────────┘              │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
                    Other Agents (Optional)
                    via HTTPS endpoints
```

## No Localhost Means:
- ❌ No `python a2a_server.py` running locally
- ❌ No `localhost:8000` endpoints
- ❌ No WebSocket servers you host
- ✅ All WebSocket connections go to **external** services (Polymarket)
- ✅ Your code runs in **Vercel Edge** or **browser**
- ✅ Optional: HTTP endpoints for agent-to-agent via Next.js API routes

## File Structure
```
app/
├── page.tsx                    # Dashboard UI
├── api/
│   ├── signals/
│   │   └── route.ts            # GET /api/signals (SSE stream)
│   ├── prices/
│   │   └── route.ts            # GET /api/prices (current prices)
│   ├── regime/
│   │   └── route.ts            # GET /api/regime (current regime)
│   └── movements/
│       └── route.ts            # GET /api/movements (alerts)
components/
├── AgentDashboard.tsx          # Main UI
├── RTDSMarketPanel.tsx         # Price display
├── SovereignSignalCorrelator.tsx # PM divergence
└── ...
hooks/
├── useRTDS.ts                  # Browser WebSocket to Polymarket
├── usePolymarket.ts            # REST to Gamma API
└── ...
```

## For Other Agents (Optional)
If other agents need your signals, they call your **deployed** endpoints:
```
https://your-app.vercel.app/api/signals     (SSE stream)
https://your-app.vercel.app/api/prices      (JSON snapshot)
https://your-app.vercel.app/api/regime      (Current regime)
```

NOT `http://localhost:8000/...`

## Deployment
1. Push to GitHub
2. Import to Vercel
3. Set environment variables (if any)
4. Deploy — done. No servers to manage.

## Environment Variables
None required for core functionality. Optional:
- `GROQ_API_KEY` — If adding AI synthesis
- `UPSTASH_REDIS_URL` — If caching (not needed)

## A2A Server Status
The `a2a_server.py` file exists in the repo as **reference** but is **not running**. It's a blueprint for if you ever want to deploy a standalone A2A server later. For now, the dashboard itself exposes signals via HTTPS.
