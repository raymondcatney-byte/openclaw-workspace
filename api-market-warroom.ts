// POLYMARKET WAR ROOM FEED - Production Solution
// Combines: Multi-source fetch + Real-time price tracking + Alert engine

export const runtime = 'edge';

// YOUR MONITORED CATEGORIES (whitelist approach)
const MONITORED_TAGS = [
  { id: 100265, name: 'GEOPOLITICS' },
  { id: 100328, name: 'ECONOMY' },
  { id: 120, name: 'FINANCE' },
  { id: 1401, name: 'TECH' },
  { id: 21, name: 'CRYPTO' },
  { id: 2, name: 'POLITICS' },
];

// REJECT: Sports/Entertainment (blacklist approach)
const REJECT_KEYWORDS = [
  'nba', 'nfl', 'nhl', 'mlb', 'ufc', 'boxing', 'tennis', 'golf',
  'oscar', 'grammy', 'emmy', 'movie', 'celebrity', 'gta vi',
  'pregnant', 'bachelorette', 'survivor'
];

// Pagination strategy for discovery
const OFFSETS = [0, 20, 40, 60, 80, 100, 150, 200];

function shouldReject(title: string): boolean {
  const lower = title.toLowerCase();
  return REJECT_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

// Fetch ONE page from Gamma API
async function fetchPage(offset: number): Promise<any[]> {
  const url = `https://gamma-api.polymarket.com/events?closed=false&active=true&limit=50&offset=${offset}`;
  
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cf: { cacheTtl: 60 }
  });
  
  if (!res.ok) return [];
  
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  
  const markets: any[] = [];
  
  for (const event of data) {
    // Skip rejected categories
    if (shouldReject(event.title || '')) continue;
    
    const eventMarkets = event.markets || [];
    const tags = event.tags?.map((t: any) => t.label?.toUpperCase()) || [];
    
    // Check if this event matches monitored categories
    const isMonitored = MONITORED_TAGS.some(tag =>
      tags.some((t: string) => t?.includes(tag.name))
    );
    
    // Skip if not in monitored categories (whitelist)
    if (!isMonitored) continue;
    
    for (const m of eventMarkets) {
      let yesPrice = 0.5;
      if (m.outcomePrices) {
        try {
          const prices = JSON.parse(m.outcomePrices);
          yesPrice = parseFloat(prices[0]) || 0.5;
        } catch {
          yesPrice = parseFloat(m.yesPrice) || 0.5;
        }
      } else {
        yesPrice = parseFloat(m.yesPrice) || 0.5;
      }
      
      // Find matched category
      const matchedCategory = MONITORED_TAGS.find(tag =>
        tags.some((t: string) => t?.includes(tag.name))
      )?.name || 'GENERAL';
      
      markets.push({
        id: m.id || m.conditionId || event.id,
        slug: event.slug || m.slug,
        question: event.title || m.question || m.title || 'Unknown',
        category: matchedCategory,
        tags: tags.slice(0, 3),
        yesPrice,
        volume: parseFloat(m.volume || m.volumeNum || 0),
        liquidity: parseFloat(m.liquidity || m.liquidityNum || 0),
        endDate: m.endDate || event.endDate,
        offset // Track where this came from
      });
    }
  }
  
  return markets;
}

// Fetch ALL monitored markets across multiple pages
async function fetchAllMarkets(): Promise<any[]> {
  // Use time-based offset rotation for discovery
  const hour = new Date().getHours();
  const primaryOffset = OFFSETS[hour % OFFSETS.length];
  const secondaryOffset = OFFSETS[(hour + 2) % OFFSETS.length];
  
  console.log(`Fetching offsets: ${primaryOffset}, ${secondaryOffset}`);
  
  const [page1, page2] = await Promise.all([
    fetchPage(primaryOffset),
    fetchPage(secondaryOffset)
  ]);
  
  const allMarkets = [...page1, ...page2];
  
  // Deduplicate
  const seen = new Set();
  const unique = allMarkets.filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
  
  // Sort by volume (highest first)
  unique.sort((a, b) => b.volume - a.volume);
  
  return unique;
}

// ALERT ENGINE: Detect significant changes
async function detectAlerts(markets: any[], kv: KVNamespace): Promise<any[]> {
  const alerts: any[] = [];
  const now = Date.now();
  
  for (const market of markets.slice(0, 50)) { // Check top 50
    const cacheKey = `market:${market.id}`;
    const cached = await kv.get(cacheKey);
    
    let alert: any = null;
    
    if (cached) {
      const old = JSON.parse(cached);
      const priceChange = Math.abs(market.yesPrice - old.price);
      const priceChangePercent = priceChange / old.price;
      
      // Calculate volume change
      const volumeChange = market.volume - old.volume;
      const volumeChangePercent = volumeChange / (old.volume || 1);
      
      // P0: Major price movement (>10%)
      if (priceChangePercent >= 0.10) {
        alert = {
          id: `p0-price-${market.id}-${now}`,
          severity: 'P0',
          type: 'PRICE_SPIKE',
          title: market.question.slice(0, 80),
          description: `${market.yesPrice > old.price ? '↑' : '↓'} ${(priceChangePercent * 100).toFixed(1)}% price move`,
          category: market.category,
          timestamp: new Date().toISOString(),
          data: {
            marketId: market.id,
            slug: market.slug,
            oldPrice: old.price,
            newPrice: market.yesPrice,
            change: priceChangePercent,
            volume: market.volume,
            url: `https://polymarket.com/event/${market.slug}`
          }
        };
      }
      // P1: Significant price (>5%) OR volume spike (>100%)
      else if (priceChangePercent >= 0.05 || volumeChangePercent >= 1.0) {
        alert = {
          id: `p1-${priceChangePercent >= 0.05 ? 'price' : 'volume'}-${market.id}-${now}`,
          severity: 'P1',
          type: priceChangePercent >= 0.05 ? 'PRICE_MOVEMENT' : 'VOLUME_SPIKE',
          title: market.question.slice(0, 80),
          description: priceChangePercent >= 0.05
            ? `${market.yesPrice > old.price ? '↑' : '↓'} ${(priceChangePercent * 100).toFixed(1)}%`
            : `Volume ↑ ${(volumeChangePercent * 100).toFixed(0)}%`,
          category: market.category,
          timestamp: new Date().toISOString(),
          data: {
            marketId: market.id,
            slug: market.slug,
            oldPrice: old.price,
            newPrice: market.yesPrice,
            oldVolume: old.volume,
            newVolume: market.volume,
            url: `https://polymarket.com/event/${market.slug}`
          }
        };
      }
      // P2: Notable price (>3%)
      else if (priceChangePercent >= 0.03) {
        alert = {
          id: `p2-price-${market.id}-${now}`,
          severity: 'P2',
          type: 'PRICE_CHANGE',
          title: market.question.slice(0, 80),
          description: `${market.yesPrice > old.price ? '↑' : '↓'} ${(priceChangePercent * 100).toFixed(1)}%`,
          category: market.category,
          timestamp: new Date().toISOString(),
          data: {
            marketId: market.id,
            slug: market.slug,
            change: priceChangePercent,
            url: `https://polymarket.com/event/${market.slug}`
          }
        };
      }
    }
    
    if (alert) {
      alerts.push(alert);
    }
    
    // Update cache
    await kv.put(cacheKey, JSON.stringify({
      price: market.yesPrice,
      volume: market.volume,
      timestamp: now
    }), { expirationTtl: 86400 });
  }
  
  // Sort by severity
  const severityOrder = { P0: 0, P1: 1, P2: 2 };
  return alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'feed';
  
  // @ts-ignore
  const kv = (globalThis as any).POLYMARKET_KV;
  
  if (!kv && action !== 'markets') {
    return Response.json({ 
      error: 'KV not configured',
      setup: 'Add POLYMARKET_KV binding in Vercel dashboard'
    }, { status: 500 });
  }
  
  try {
    const markets = await fetchAllMarkets();
    const alerts = kv ? await detectAlerts(markets, kv) : [];
    
    // Store alert history
    if (alerts.length > 0 && kv) {
      const historyKey = 'alerts:history';
      const existing = await kv.get(historyKey);
      const history = existing ? JSON.parse(existing) : [];
      history.unshift(...alerts);
      await kv.put(historyKey, JSON.stringify(history.slice(0, 100)), { expirationTtl: 604800 });
    }
    
    // Group by category
    const byCategory = markets.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {});
    
    switch (action) {
      case 'feed':
      default:
        return Response.json({
          ok: true,
          timestamp: new Date().toISOString(),
          discovery: {
            method: 'paginated-scan',
            offsetsRotated: 'hourly',
            monitoredCategories: MONITORED_TAGS.map(t => t.name)
          },
          summary: {
            totalMarkets: markets.length,
            byCategory,
            p0Alerts: alerts.filter(a => a.severity === 'P0').length,
            p1Alerts: alerts.filter(a => a.severity === 'P1').length,
            p2Alerts: alerts.filter(a => a.severity === 'P2').length,
          },
          markets: markets.slice(0, 30).map(m => ({
            id: m.id,
            question: m.question,
            category: m.category,
            yesPrice: `${(m.yesPrice * 100).toFixed(0)}%`,
            volume: `$${(m.volume / 1000).toFixed(0)}k`,
            liquidity: `$${(m.liquidity / 1000).toFixed(0)}k`,
            endDate: m.endDate,
            url: `https://polymarket.com/event/${m.slug}`
          })),
          alerts: alerts.slice(0, 10)
        });
        
      case 'alerts':
        const history = kv ? await kv.get('alerts:history') : null;
        return Response.json({
          ok: true,
          active: alerts,
          history: history ? JSON.parse(history).slice(0, 50) : []
        });
        
      case 'markets':
        return Response.json({
          ok: true,
          count: markets.length,
          markets: markets.slice(0, 50)
        });
        
      case 'debug':
        return Response.json({
          ok: true,
          config: {
            monitoredTags: MONITORED_TAGS,
            rejectKeywords: REJECT_KEYWORDS,
            offsets: OFFSETS
          },
          foundCategories: byCategory
        });
    }
    
  } catch (error) {
    console.error('Error:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}