// War Room Market Feed - Dynamic like Polymarket website
// Combines multiple endpoints for truly changing results

export const runtime = 'edge';

const REJECT_KEYWORDS = [
  'nba', 'nfl', 'nhl', 'mlb', 'ufc', 'golf', 'tennis',
  'oscar', 'grammy', 'pregnant', 'celebrity'
];

function isRejected(title: string): boolean {
  return REJECT_KEYWORDS.some(kw => title.toLowerCase().includes(kw));
}

// Source 1: Global high volume (what website shows on homepage)
async function fetchGlobalVolume(): Promise<any[]> {
  const url = 'https://gamma-api.polymarket.com/events?closed=false&active=true&limit=50';
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const data = await res.json();
  
  if (!Array.isArray(data)) return [];
  
  return data.map(e => {
    const m = e.markets?.[0] || {};
    return {
      id: e.id || m.id,
      slug: e.slug,
      question: e.title || m.question,
      category: e.tags?.[0]?.label || 'General',
      volume: parseFloat(m.volume || e.volume || 0),
      yesPrice: parseFloat(m.yesPrice || 0.5),
      source: 'global-volume'
    };
  }).filter(m => m.volume > 100000 && !isRejected(m.question));
}

// Source 2: Pagination offset (different markets each time)
async function fetchWithOffset(offset: number): Promise<any[]> {
  const url = `https://gamma-api.polymarket.com/events?closed=false&active=true&limit=20&offset=${offset}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const data = await res.json();
  
  if (!Array.isArray(data)) return [];
  
  return data.map(e => {
    const m = e.markets?.[0] || {};
    return {
      id: e.id || m.id,
      slug: e.slug,
      question: e.title || m.question,
      category: e.tags?.[0]?.label || 'General',
      volume: parseFloat(m.volume || e.volume || 0),
      yesPrice: parseFloat(m.yesPrice || 0.5),
      source: `offset-${offset}`
    };
  }).filter(m => m.volume > 50000 && !isRejected(m.question));
}

// Source 3: Recent markets (newly created)
async function fetchRecent(): Promise<any[]> {
  const url = 'https://gamma-api.polymarket.com/events?closed=false&active=true&limit=30&sort=createdAt';
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const data = await res.json();
  
  if (!Array.isArray(data)) return [];
  
  return data.map(e => {
    const m = e.markets?.[0] || {};
    return {
      id: e.id || m.id,
      slug: e.slug,
      question: e.title || m.question,
      category: e.tags?.[0]?.label || 'General',
      volume: parseFloat(m.volume || 0),
      yesPrice: parseFloat(m.yesPrice || 0.5),
      createdAt: e.createdAt,
      source: 'recent'
    };
  }).filter(m => !isRejected(m.question));
}

// Combine all sources, deduplicate, rank by volume
async function fetchDynamicMarkets(): Promise<any[]> {
  // Fetch from multiple sources in parallel
  const [global, offset100, offset200, recent] = await Promise.all([
    fetchGlobalVolume(),
    fetchWithOffset(100),
    fetchWithOffset(200),
    fetchRecent()
  ]);
  
  // Combine and deduplicate
  const seen = new Set();
  const all = [...global, ...offset100, ...offset200, ...recent];
  
  const unique = all.filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
  
  // Sort by volume descending
  unique.sort((a, b) => b.volume - a.volume);
  
  return unique;
}

// Detect price changes
async function detectAlerts(markets: any[], kv: KVNamespace) {
  const alerts: any[] = [];
  
  for (const market of markets.slice(0, 30)) {
    const key = `price:${market.id}`;
    const cached = await kv.get(key);
    
    if (cached) {
      const old = JSON.parse(cached);
      const change = Math.abs(market.yesPrice - old.price);
      const changePercent = change / old.price;
      
      if (changePercent >= 0.05) {
        alerts.push({
          id: `alert-${market.id}`,
          type: 'PRICE_MOVEMENT',
          severity: changePercent >= 0.1 ? 'P0' : 'P1',
          title: market.question.slice(0, 80),
          description: `${market.yesPrice > old.price ? '↑' : '↓'} ${(changePercent * 100).toFixed(1)}%`,
          category: market.category,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    await kv.put(key, JSON.stringify({
      price: market.yesPrice,
      timestamp: Date.now()
    }), { expirationTtl: 86400 });
  }
  
  return alerts;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'feed';
  
  // @ts-ignore
  const kv = (globalThis as any).POLYMARKET_KV;
  
  try {
    const markets = await fetchDynamicMarkets();
    const alerts = kv ? await detectAlerts(markets, kv) : [];
    
    // Group by source
    const bySource = markets.reduce((acc, m) => {
      acc[m.source] = (acc[m.source] || 0) + 1;
      return acc;
    }, {});
    
    switch (action) {
      case 'feed':
        return Response.json({
          ok: true,
          timestamp: new Date().toISOString(),
          meta: {
            totalMarkets: markets.length,
            sources: bySource,
            note: 'Dynamic feed - results change based on volume/pagination'
          },
          markets: markets.slice(0, 25).map(m => ({
            id: m.id,
            question: m.question,
            category: m.category,
            yesPrice: `${(m.yesPrice * 100).toFixed(0)}%`,
            volume: `$${(m.volume / 1000000).toFixed(2)}M`,
            source: m.source,
            url: `https://polymarket.com/event/${m.slug}`
          })),
          alerts: alerts.slice(0, 10)
        });
        
      case 'debug':
        return Response.json({
          ok: true,
          sources: bySource,
          topMarkets: markets.slice(0, 50).map(m => ({
            question: m.question.slice(0, 60),
            volume: m.volume,
            source: m.source
          }))
        });
        
      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }
    
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}
