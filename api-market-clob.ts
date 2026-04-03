// Polymarket CLOB + Gamma API Integration
// FREE - No authentication required
// Returns ALL markets per category (not just trending)

export const runtime = 'edge';

// YOUR MONITORED CATEGORIES
const DESIRED_CATEGORIES = [
  'GEOPOLITICS', 'ECONOMY', 'FINANCE', 'TECH', 'CRYPTO', 'POLITICS'
];

// REJECT: Sports/Entertainment
const REJECT_KEYWORDS = [
  'nba', 'nfl', 'nhl', 'mlb', 'ufc', 'boxing', 'tennis', 'golf',
  'oscar', 'grammy', 'emmy', 'movie', 'celebrity', 'gta vi',
  'pregnant', 'bachelorette', 'survivor', 'reality tv'
];

function shouldReject(title: string): boolean {
  const lower = title.toLowerCase();
  return REJECT_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

// Fetch ALL markets from CLOB API (FREE, no auth)
async function fetchClobMarkets(): Promise<any[]> {
  console.log('Fetching CLOB markets...');
  
  const markets: any[] = [];
  let cursor = '';
  let hasMore = true;
  let pages = 0;
  
  // Fetch multiple pages to get all markets
  while (hasMore && pages < 5) {
    const url = `https://clob.polymarket.com/markets?active=true&closed=false${cursor ? `&next_cursor=${cursor}` : ''}&limit=100`;
    
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      cf: { cacheTtl: 60 }
    });
    
    if (!res.ok) {
      throw new Error(`CLOB API error: ${res.status}`);
    }
    
    const data = await res.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error('Invalid CLOB response structure');
    }
    
    const pageMarkets = data.data.map((m: any) => ({
      id: m.market_slug || m.condition_id,
      slug: m.market_slug,
      question: m.question || m.description || 'Unknown',
      yesPrice: parseFloat(m.yes_price || m.best_ask || 0.5),
      volume: parseFloat(m.volume || 0),
      liquidity: parseFloat(m.total_liquidity || 0),
      spread: parseFloat(m.spread || 0),
      conditionId: m.condition_id,
      description: m.description
    }));
    
    markets.push(...pageMarkets);
    
    // Check for more pages
    cursor = data.next_cursor || '';
    hasMore = !!cursor && data.data.length === 100;
    pages++;
    
    if (hasMore) {
      await new Promise(r => setTimeout(r, 200)); // Rate limit friendly
    }
  }
  
  console.log(`CLOB returned ${markets.length} markets from ${pages} pages`);
  
  return markets;
}

// Fetch market metadata from Gamma (for tags/categories)
async function fetchGammaMetadata(): Promise<Map<string, any>> {
  console.log('Fetching Gamma metadata...');
  
  const url = 'https://gamma-api.polymarket.com/events?closed=false&active=true&limit=500';
  
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cf: { cacheTtl: 120 }
  });
  
  if (!res.ok) return new Map();
  
  const data = await res.json();
  if (!Array.isArray(data)) return new Map();
  
  const metadata = new Map();
  
  for (const event of data) {
    const eventMarkets = event.markets || [];
    
    for (const m of eventMarkets) {
      const conditionId = m.conditionId || m.condition_id;
      const slug = event.slug || m.slug;
      
      const tags = event.tags?.map((t: any) => t.label?.toUpperCase()) || [];
      
      metadata.set(conditionId, {
        slug,
        tags,
        category: tags[0] || 'GENERAL',
        image: event.image,
        endDate: m.endDate || event.endDate
      });
      
      // Also map by slug
      if (slug) {
        metadata.set(slug, {
          conditionId,
          tags,
          category: tags[0] || 'GENERAL',
          image: event.image,
          endDate: m.endDate || event.endDate
        });
      }
    }
  }
  
  console.log(`Gamma metadata for ${metadata.size} markets`);
  return metadata;
}

// Combine CLOB + Gamma and filter by category
async function fetchCompleteMarkets(): Promise<any[]> {
  // Fetch in parallel
  const [clobMarkets, gammaMeta] = await Promise.all([
    fetchClobMarkets(),
    fetchGammaMetadata()
  ]);
  
  const markets: any[] = [];
  
  for (const clob of clobMarkets) {
    // Skip rejected keywords
    if (shouldReject(clob.question)) continue;
    
    // Get metadata
    const meta = gammaMeta.get(clob.conditionId) || gammaMeta.get(clob.slug) || {};
    
    const tags = meta.tags || [];
    
    // Check if matches desired categories
    const matchedCategory = DESIRED_CATEGORIES.find(cat =>
      tags.some((t: string) => t?.includes(cat))
    );
    
    // Skip if not in desired categories
    if (!matchedCategory) continue;
    
    markets.push({
      id: clob.id,
      slug: clob.slug,
      question: clob.question,
      category: matchedCategory,
      tags: tags.slice(0, 3),
      yesPrice: clob.yesPrice,
      volume: clob.volume,
      liquidity: clob.liquidity,
      spread: clob.spread,
      endDate: meta.endDate,
      image: meta.image
    });
  }
  
  // Sort by volume (highest first)
  markets.sort((a, b) => b.volume - a.volume);
  
  return markets;
}

// Get top 10 per category
function getTopPerCategory(markets: any[]): Record<string, any[]> {
  const byCategory: Record<string, any[]> = {};
  
  for (const market of markets) {
    if (!byCategory[market.category]) {
      byCategory[market.category] = [];
    }
    
    if (byCategory[market.category].length < 10) {
      byCategory[market.category].push(market);
    }
  }
  
  return byCategory;
}

// ALERT ENGINE
async function detectAlerts(markets: any[], kv: KVNamespace): Promise<any[]> {
  const alerts: any[] = [];
  const now = Date.now();
  
  for (const market of markets.slice(0, 50)) {
    const cacheKey = `clob:${market.id}`;
    const cached = await kv.get(cacheKey);
    
    if (cached) {
      const old = JSON.parse(cached);
      const priceChange = Math.abs(market.yesPrice - old.price);
      const changePercent = priceChange / old.price;
      
      let severity = null;
      let type = null;
      
      if (changePercent >= 0.10) {
        severity = 'P0';
        type = 'MAJOR_PRICE_MOVE';
      } else if (changePercent >= 0.05) {
        severity = 'P1';
        type = 'SIGNIFICANT_MOVE';
      } else if (changePercent >= 0.03) {
        severity = 'P2';
        type = 'PRICE_CHANGE';
      }
      
      if (severity) {
        alerts.push({
          id: `alert-${market.id}-${now}`,
          severity,
          type,
          title: market.question.slice(0, 80),
          description: `${market.yesPrice > old.price ? '↑' : '↓'} ${(changePercent * 100).toFixed(1)}%`,
          category: market.category,
          timestamp: new Date().toISOString(),
          data: {
            marketId: market.id,
            slug: market.slug,
            oldPrice: old.price,
            newPrice: market.yesPrice,
            change: changePercent,
            url: `https://polymarket.com/event/${market.slug}`
          }
        });
      }
    }
    
    // Update cache
    await kv.put(cacheKey, JSON.stringify({
      price: market.yesPrice,
      volume: market.volume,
      timestamp: now
    }), { expirationTtl: 86400 });
  }
  
  return alerts.sort((a, b) => {
    const order = { P0: 0, P1: 1, P2: 2 };
    return order[a.severity] - order[b.severity];
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'feed';
  
  // @ts-ignore
  const kv = (globalThis as any).POLYMARKET_KV;
  
  try {
    const markets = await fetchCompleteMarkets();
    const byCategory = getTopPerCategory(markets);
    
    // Flatten for alerts
    const allMarkets = Object.values(byCategory).flat();
    const alerts = kv ? await detectAlerts(allMarkets, kv) : [];
    
    // Store alerts
    if (alerts.length > 0 && kv) {
      const history = await kv.get('clob:alerts');
      const past = history ? JSON.parse(history) : [];
      await kv.put('clob:alerts', JSON.stringify([...alerts, ...past].slice(0, 100)), {
        expirationTtl: 604800
      });
    }
    
    switch (action) {
      case 'feed':
      default:
        return Response.json({
          ok: true,
          timestamp: new Date().toISOString(),
          source: 'CLOB + Gamma (FREE)',
          categories: DESIRED_CATEGORIES,
          summary: {
            totalMarkets: markets.length,
            perCategory: Object.fromEntries(
              Object.entries(byCategory).map(([k, v]) => [k, v.length])
            ),
            p0Alerts: alerts.filter(a => a.severity === 'P0').length,
            p1Alerts: alerts.filter(a => a.severity === 'P1').length,
            p2Alerts: alerts.filter(a => a.severity === 'P2').length,
          },
          marketsByCategory: byCategory,
          alerts: alerts.slice(0, 10)
        });
        
      case 'category':
        const cat = url.searchParams.get('name') || 'GEOPOLITICS';
        return Response.json({
          ok: true,
          category: cat,
          markets: byCategory[cat] || []
        });
        
      case 'all':
        return Response.json({
          ok: true,
          count: markets.length,
          markets: markets.slice(0, 100)
        });
        
      case 'alerts':
        const history = kv ? await kv.get('clob:alerts') : null;
        return Response.json({
          ok: true,
          active: alerts,
          history: history ? JSON.parse(history).slice(0, 50) : []
        });
    }
    
  } catch (error) {
    console.error('Error:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown',
      note: 'CLOB API is free and requires no authentication'
    }, { status: 500 });
  }
}