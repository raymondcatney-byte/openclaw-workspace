// War Room Market Feed - Category-curated + Paginated Discovery
// Combines: Your chosen categories + Dynamic pagination for discovery

export const runtime = 'edge';

// YOUR CHOSEN CATEGORIES (whitelist)
const MONITORED_CATEGORIES = [
  { id: 100265, name: 'GEOPOLITICS' },
  { id: 100328, name: 'ECONOMY' },
  { id: 120, name: 'FINANCE' },
  { id: 1401, name: 'TECH' },
  { id: 21, name: 'CRYPTO' },
  { id: 2, name: 'POLITICS' },
];

// Pagination offsets for discovery (cycles through these)
const DISCOVERY_OFFSETS = [0, 20, 40, 60, 80, 100];

// Blacklist keywords
const REJECT_KEYWORDS = [
  'nba', 'nfl', 'nhl', 'mlb', 'ufc', 'golf', 'tennis', 'boxing',
  'oscar', 'grammy', 'emmy', 'celebrity', 'pregnant', 'bachelorette',
  'gta vi', 'video game', 'gaming', 'esports'
];

function isRejected(title: string): boolean {
  return REJECT_KEYWORDS.some(kw => title.toLowerCase().includes(kw.toLowerCase()));
}

// Fetch ONE category with offset (for discovery)
async function fetchCategoryPage(
  tagId: number, 
  categoryName: string, 
  offset: number
): Promise<any[]> {
  const url = `https://gamma-api.polymarket.com/events?tag_id=${tagId}&closed=false&active=true&limit=20&offset=${offset}`;
  
  console.log(`Fetching ${categoryName} (offset ${offset})`);
  
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cf: { cacheTtl: 60 }
  });
  
  if (!res.ok) {
    console.error(`  Failed: ${res.status}`);
    return [];
  }
  
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  
  const markets: any[] = [];
  
  for (const event of data) {
    const eventMarkets = event.markets || [];
    
    for (const m of eventMarkets) {
      // Parse prices
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
      
      const market = {
        id: m.id || m.conditionId,
        slug: event.slug || m.slug,
        question: m.question || m.title || event.title || 'Unknown',
        category: categoryName,
        yesPrice,
        volume: parseFloat(m.volume || m.volumeNum || 0),
        liquidity: parseFloat(m.liquidity || m.liquidityNum || 0),
        offset, // Track which offset this came from
        fetchedAt: new Date().toISOString()
      };
      
      if (!isRejected(market.question) && market.volume > 10000) {
        markets.push(market);
      }
    }
  }
  
  console.log(`  Found ${markets.length} valid markets`);
  return markets;
}

// Fetch all categories with rotating offset (for discovery)
async function fetchDiscoveredMarkets(): Promise<any[]> {
  // Get current offset index from KV or use time-based rotation
  const hour = new Date().getHours();
  const offsetIndex = hour % DISCOVERY_OFFSETS.length; // Rotate hourly
  const offset = DISCOVERY_OFFSETS[offsetIndex];
  
  console.log(`\n🔄 Discovery mode: Using offset ${offset} (rotates hourly)`);
  
  const allMarkets: any[] = [];
  
  // Fetch each category at the current offset
  for (const cat of MONITORED_CATEGORIES) {
    const markets = await fetchCategoryPage(cat.id, cat.name, offset);
    allMarkets.push(...markets);
    
    // Small delay to be nice to the API
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Also fetch offset+20 for more variety (second page)
  const nextOffset = offset + 20;
  for (const cat of MONITORED_CATEGORIES.slice(0, 3)) { // Just top 3 categories for second page
    const markets = await fetchCategoryPage(cat.id, cat.name, nextOffset);
    allMarkets.push(...markets);
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Deduplicate
  const seen = new Set();
  const unique = allMarkets.filter(m => {
    if (seen.has(m.id)) return false;
    seen.add(m.id);
    return true;
  });
  
  // Sort by volume
  unique.sort((a, b) => b.volume - a.volume);
  
  return unique;
}

// Also fetch top volume from each category (baseline)
async function fetchTopFromEachCategory(): Promise<any[]> {
  const allMarkets: any[] = [];
  
  for (const cat of MONITORED_CATEGORIES) {
    const markets = await fetchCategoryPage(cat.id, cat.name, 0);
    // Take top 5 from each category
    allMarkets.push(...markets.slice(0, 5));
  }
  
  return allMarkets;
}

// Detect price changes
async function detectAlerts(markets: any[], kv: KVNamespace) {
  const alerts: any[] = [];
  
  for (const market of markets.slice(0, 40)) {
    const key = `price:${market.id}`;
    const cached = await kv.get(key);
    
    if (cached) {
      const old = JSON.parse(cached);
      const change = Math.abs(market.yesPrice - old.price);
      const changePercent = change / old.price;
      
      if (changePercent >= 0.03) {
        alerts.push({
          id: `alert-${market.id}`,
          type: 'PRICE_MOVEMENT',
          severity: changePercent >= 0.08 ? 'P0' : changePercent >= 0.05 ? 'P1' : 'P2',
          title: market.question.slice(0, 80),
          description: `${market.yesPrice > old.price ? '↑' : '↓'} ${(changePercent * 100).toFixed(1)}%`,
          category: market.category,
          timestamp: new Date().toISOString(),
          data: {
            marketId: market.id,
            change: changePercent,
            url: `https://polymarket.com/event/${market.slug}`
          }
        });
      }
    }
    
    await kv.put(key, JSON.stringify({
      price: market.yesPrice,
      timestamp: Date.now()
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
  const mode = url.searchParams.get('mode') || 'discovery'; // 'discovery' or 'top'
  
  // @ts-ignore
  const kv = (globalThis as any).POLYMARKET_KV;
  
  try {
    let markets: any[];
    
    if (mode === 'top') {
      // Just top markets from each category
      markets = await fetchTopFromEachCategory();
    } else {
      // Discovery mode with pagination
      markets = await fetchDiscoveredMarkets();
    }
    
    const alerts = kv ? await detectAlerts(markets, kv) : [];
    
    // Group by category
    const byCategory = markets.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {});
    
    switch (action) {
      case 'feed':
        return Response.json({
          ok: true,
          timestamp: new Date().toISOString(),
          mode,
          discovery: mode === 'discovery' ? {
            currentOffset: DISCOVERY_OFFSETS[new Date().getHours() % DISCOVERY_OFFSETS.length],
            rotatesEvery: '1 hour',
            nextRotation: new Date(Date.now() + 3600000).toISOString()
          } : undefined,
          categories: MONITORED_CATEGORIES.map(c => c.name),
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
            url: `https://polymarket.com/event/${m.slug}`
          })),
          alerts: alerts.slice(0, 10)
        });
        
      case 'raw':
        return Response.json({
          ok: true,
          count: markets.length,
          markets: markets.slice(0, 50)
        });
        
      case 'categories':
        return Response.json({
          ok: true,
          monitored: MONITORED_CATEGORIES,
          discovered: byCategory
        });
        
      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}
