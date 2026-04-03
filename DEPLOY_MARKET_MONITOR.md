# Polymarket Market Monitor - Vercel Deployment Guide

Zero-localhost solution for price alerts, volume spike detection, and NERV-compatible feeds.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Polymarket API │────▶│  Vercel Edge    │────▶│  War Room Globe │
│  (Gamma/Data)   │     │  Function       │     │  (NERV UI)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Vercel KV      │
                        │  (Price/Volume  │
                        │   History)      │
                        └─────────────────┘
```

## Files

| File | Destination | Purpose |
|------|-------------|---------|
| `vercel-market-feed.ts` | `api/market-feed/route.ts` | Edge function for market monitoring |
| `hooks-useMarketFeed.ts` | `hooks/useMarketFeed.ts` | React hook for data fetching |
| `MarketLayer.tsx` | `components/MarketLayer.tsx` | NERV-styled market panel |

## Deployment Steps

### 1. Copy Files

```bash
# From this workspace to your NERV project
cp vercel-market-feed.ts your-project/app/api/market-feed/route.ts
cp hooks-useMarketFeed.ts your-project/hooks/useMarketFeed.ts
cp MarketLayer.tsx your-project/components/MarketLayer.tsx
```

### 2. Install Vercel KV (Required for Price History)

```bash
cd your-project
npm install @vercel/kv

# Or use Vercel CLI
vercel kv create
```

### 3. Configure Environment

Add to `.env.local`:

```bash
# Optional: Only if you want Redis instead of Vercel KV
# KV_URL=redis://...
# KV_REST_API_URL=...
# KV_REST_API_TOKEN=...
```

For Vercel KV, run:
```bash
vercel env pull
```

### 4. Update vercel.json (Cron Job for Automatic Monitoring)

```json
{
  "crons": [
    {
      "path": "/api/market-feed?action=feed",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

This runs every 5 minutes to detect price movements.

### 5. Deploy

```bash
vercel --prod
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/market-feed?action=feed` | Full market feed + alerts |
| `GET /api/market-feed?action=alerts` | Alert history |
| `GET /api/market-feed?action=watchtower` | Critical alerts only (P0/P1) |

## Response Format

```json
{
  "ok": true,
  "timestamp": "2026-04-03T06:35:00Z",
  "summary": {
    "totalMarkets": 45,
    "p0Alerts": 2,
    "p1Alerts": 3,
    "p2Alerts": 8
  },
  "markets": [...],
  "events": [
    {
      "id": "price-abc123-1712121300000",
      "type": "PRICE_MOVEMENT",
      "severity": "P0",
      "title": "CRYPTO: Bitcoin ETF approval odds...",
      "description": "Price surged 12.5%",
      "timestamp": "2026-04-03T06:30:00Z",
      "data": {
        "marketId": "abc123",
        "category": "CRYPTO",
        "oldPrice": 0.45,
        "newPrice": 0.506,
        "change": 0.125,
        "url": "https://polymarket.com/event/..."
      }
    }
  ]
}
```

## Integration with War Room Globe

Add to your `war-room-integrated.tsx`:

```tsx
import { MarketLayer } from '@/components/MarketLayer';

// In your sidebar
<MarketLayer />
```

Or as a data layer for markers on the globe:

```tsx
const { feed } = useMarketFeed();

// Convert alerts to globe markers
const marketMarkers = feed?.events.map(event => ({
  lat: getCategoryLat(event.data.category), // Your coordinate logic
  lng: getCategoryLng(event.data.category),
  severity: event.severity,
  title: event.title,
  type: 'MARKET_ALERT'
}));
```

## Alert Thresholds

| Category | Price Movement | Volume Spike |
|----------|---------------|--------------|
| CRYPTO | 5% | 10x average |
| TECH | 4% | 5x average |
| FINANCE | 2% | 5x average |
| GEOPOLITICS | 3% | 5x average |
| ECONOMY | 3% | 5x average |

## Cost

- **Vercel Edge**: Free tier (1M requests/month)
- **Vercel KV**: Free tier (250MB storage, 10K ops/day)
- **Polymarket API**: Free (no rate limit for read-only)

Total: **$0/month** for typical usage.

## Monitoring Categories

Currently monitors:
- GEOPOLITICS (tag 100265)
- ECONOMY (tag 100328)
- FINANCE (tag 120)
- TECH (tag 1401)
- CRYPTO (tag 21)

To add more categories, edit the `MONITORED_CATEGORIES` array in `route.ts`.

## No Localhost Dependencies

✅ Vercel Edge Functions (serverless)
✅ Vercel KV (cloud storage)
✅ Polymarket Gamma API (public)
✅ No background processes
✅ No local files
✅ No scheduled tasks on your machine

Everything runs in Vercel's infrastructure.