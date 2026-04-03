// Vercel Edge Function: Polymarket Monitor with Alerts
// Deploy: Add to api/market-feed/route.ts in your Next.js app
// No localhost dependencies - runs entirely on Vercel Edge

export const runtime = 'edge';
export const preferredRegion = 'iad1'; // US East for low latency

interface Market {
  id: string;
  slug: string;
  question: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity: number;
  change24h?: number;
  alertType?: 'PRICE_MOVEMENT' | 'VOLUME_SPIKE' | 'TREND_SURGE' | 'TREND_CRASH';
  severity?: 'P0' | 'P1' | 'P2';
}

interface NervEvent {
  id: string;
  type: 'MARKET_ALERT' | 'PRICE_MOVEMENT' | 'VOLUME_SPIKE';
  severity: 'P0' | 'P1' | 'P2';
  title: string;
  description: string;
  timestamp: string;
  data: {
    marketId: string;
    category: string;
    oldPrice?: number;
    newPrice: number;
    change?: number;
    volume?: number;
    volumeChange?: number;
    url: string;
  };
}

// Categories to monitor with their tag IDs
const MONITORED_CATEGORIES = [
  { name: 'GEOPOLITICS', tagId: 100265, threshold: 0.03 },
  { name: 'ECONOMY', tagId: 100328, threshold: 0.03 },
  { name: 'FINANCE', tagId: 120, threshold: 0.02 },
  { name: 'TECH', tagId: 1401, threshold: 0.04 },
  { name: 'CRYPTO', tagId: 21, threshold: 0.05 },
];

// Fetch markets from Polymarket Gamma API
async function fetchMarkets(tagId: number, limit = 20): Promise<Market[]> {
  const url = `https://gamma-api.polymarket.com/events?tag_id=${tagId}&closed=false&active=true&limit=${limit}`;
  
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    cf: { cacheTtl: 60 } // Cache 60 seconds
  });
  
  if (!response.ok) return [];
  
  const events = await response.json();
  const markets: Market[] = [];
  
  for (const event of events) {
    const eventMarkets = event.markets || [];
    for (const m of eventMarkets) {
      if (!m.outcomePrices) continue;
      
      const prices = JSON.parse(m.outcomePrices);
      markets.push({
        id: m.id || m.conditionId,
        slug: m.slug || event.slug,
        question: m.question || event.title,
        category: event.tags?.[0]?.label || 'GENERAL',
        yesPrice: parseFloat(prices[0]) || 0.5,
        noPrice: parseFloat(prices[1]) || 0.5,
        volume: parseFloat(m.volume || 0),
        liquidity: parseFloat(m.liquidity || 0)
      });
    }
  }
  
  return markets;
}

// Fetch all markets across categories
async function fetchAllMarkets(): Promise<Market[]> {
  const allMarkets: Market[] = [];
  
  await Promise.all(
    MONITORED_CATEGORIES.map(async (cat) => {
      const markets = await fetchMarkets(cat.tagId, 15);
      markets.forEach(m => {
        m.category = cat.name;
        allMarkets.push(m);
      });
    })
  );
  
  // Deduplicate by ID
  const seen = new Set();
  return allMarkets.filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
}

// Detect price movements by comparing to cached values
async function detectPriceMovements(
  markets: Market[],
  kv: KVNamespace
): Promise<NervEvent[]> {
  const alerts: NervEvent[] = [];
  
  for (const market of markets) {
    const cacheKey = `price:${market.id}`;
    const cached = await kv.get(cacheKey);
    
    if (cached) {
      const oldData = JSON.parse(cached);
      const priceChange = Math.abs(market.yesPrice - oldData.yesPrice);
      const changePercent = priceChange / oldData.yesPrice;
      
      const threshold = MONITORED_CATEGORIES.find(
        c => c.name === market.category
      )?.threshold || 0.03;
      
      if (changePercent >= threshold) {
        const direction = market.yesPrice > oldData.yesPrice ? 'surged' : 'dropped';
        const severity = changePercent >= 0.1 ? 'P0' : changePercent >= 0.05 ? 'P1' : 'P2';
        
        alerts.push({
          id: `price-${market.id}-${Date.now()}`,
          type: 'PRICE_MOVEMENT',
          severity,
          title: `${market.category}: ${market.question.slice(0, 60)}...`,
          description: `Price ${direction} ${(changePercent * 100).toFixed(1)}%`,
          timestamp: new Date().toISOString(),
          data: {
            marketId: market.id,
            category: market.category,
            oldPrice: oldData.yesPrice,
            newPrice: market.yesPrice,
            change: changePercent,
            url: `https://polymarket.com/event/${market.slug}`
          }
        });
      }
    }
    
    // Update cache
    await kv.put(cacheKey, JSON.stringify({
      yesPrice: market.yesPrice,
      timestamp: Date.now()
    }), { expirationTtl: 86400 }); // 24 hour TTL
  }
  
  return alerts;
}

// Detect volume spikes
async function detectVolumeSpikes(
  markets: Market[],
  kv: KVNamespace
): Promise<NervEvent[]> {
  const alerts: NervEvent[] = [];
  
  // Calculate mean volume
  const volumes = markets.map(m => m.volume).filter(v => v > 0);
  const meanVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
  
  for (const market of markets) {
    const cacheKey = `volume:${market.id}`;
    const cached = await kv.get(cacheKey);
    
    if (cached) {
      const oldVolume = JSON.parse(cached).volume;
      const volumeChange = market.volume - oldVolume;
      const volumeMultiplier = volumeChange / (oldVolume || 1);
      
      // Volume spike: 5x average volume OR 10x previous reading
      const isSpike = volumeChange > meanVolume * 2 || volumeMultiplier > 10;
      
      if (isSpike && volumeChange > 10000) { // Min $10k volume change
        alerts.push({
          id: `volume-${market.id}-${Date.now()}`,
          type: 'VOLUME_SPIKE',
          severity: volumeMultiplier > 20 ? 'P0' : 'P1',
          title: `Volume Spike: ${market.question.slice(0, 50)}...`,
          description: `Volume increased ${(volumeMultiplier).toFixed(1)}x ($${(volumeChange/1000).toFixed(0)}k)`,
          timestamp: new Date().toISOString(),
          data: {
            marketId: market.id,
            category: market.category,
            volume: market.volume,
            volumeChange,
            url: `https://polymarket.com/event/${market.slug}`
          }
        });
      }
    }
    
    // Update cache
    await kv.put(cacheKey, JSON.stringify({
      volume: market.volume,
      timestamp: Date.now()
    }), { expirationTtl: 86400 });
  }
  
  return alerts;
}

// Store alerts for history
async function storeAlerts(alerts: NervEvent[], kv: KVNamespace) {
  const existing = await kv.get('alerts:history');
  const history = existing ? JSON.parse(existing) : [];
  
  // Add new alerts, keep last 100
  const updated = [...alerts, ...history].slice(0, 100);
  
  await kv.put('alerts:history', JSON.stringify(updated), {
    expirationTtl: 604800 // 7 days
  });
}

// Main handler
export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'feed';
  
  // @ts-ignore - KV binding
  const kv = (globalThis as any).POLYMARKET_KV;
  
  if (!kv) {
    return Response.json(
      { error: 'KV not configured' },
      { status: 500 }
    );
  }
  
  try {
    switch (action) {
      case 'feed': {
        // Get current markets
        const markets = await fetchAllMarkets();
        
        // Detect anomalies
        const [priceAlerts, volumeAlerts] = await Promise.all([
          detectPriceMovements(markets, kv),
          detectVolumeSpikes(markets, kv)
        ]);
        
        const allAlerts = [...priceAlerts, ...volumeAlerts]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        // Store for history
        if (allAlerts.length > 0) {
          await storeAlerts(allAlerts, kv);
        }
        
        // Return NERV-compatible format
        return Response.json({
          ok: true,
          timestamp: new Date().toISOString(),
          summary: {
            totalMarkets: markets.length,
            p0Alerts: allAlerts.filter(a => a.severity === 'P0').length,
            p1Alerts: allAlerts.filter(a => a.severity === 'P1').length,
            p2Alerts: allAlerts.filter(a => a.severity === 'P2').length
          },
          markets: markets.slice(0, 20).map(m => ({
            id: m.id,
            question: m.question,
            category: m.category,
            yesPrice: m.yesPrice,
            volume: m.volume,
            url: `https://polymarket.com/event/${m.slug}`
          })),
          events: allAlerts,
          meta: {
            source: 'polymarket-gamma-api',
            updateInterval: '60s',
            nextRefresh: new Date(Date.now() + 60000).toISOString()
          }
        });
      }
      
      case 'alerts': {
        // Get alert history
        const history = await kv.get('alerts:history');
        const alerts = history ? JSON.parse(history) : [];
        
        return Response.json({
          ok: true,
          alerts: alerts.slice(0, 50),
          count: alerts.length
        });
      }
      
      case 'watchtower': {
        // Get only critical alerts (P0/P1)
        const history = await kv.get('alerts:history');
        const alerts = history ? JSON.parse(history) : [];
        const critical = alerts.filter((a: NervEvent) => 
          a.severity === 'P0' || a.severity === 'P1'
        );
        
        return Response.json({
          ok: true,
          criticalCount: critical.length,
          alerts: critical.slice(0, 20)
        });
      }
      
      default:
        return Response.json(
          { error: 'Unknown action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Market feed error:', error);
    return Response.json(
      { 
        error: 'Feed generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}