// War Room Market Feed - Blacklist Approach
// Fetch ALL markets, reject only unwanted categories

export const runtime = 'edge';

// REJECT these categories/types
const REJECT_CATEGORIES = [
  'SPORTS', 'NBA', 'NFL', 'NHL', 'MLB', 'FIFA', 'UFC', 'BOXING',
  'ENTERTAINMENT', 'MOVIES', 'TV', 'CELEBRITY', 'MUSIC',
  'GAMING', 'ESPORTS', 'VIDEO GAMES'
];

// REJECT these keywords in titles
const REJECT_KEYWORDS = [
  'nba', 'nfl', 'nhl', 'mlb', 'fifa', 'world cup', 'super bowl',
  'ufc', 'boxing', 'tennis', 'golf', 'soccer match', 'football game',
  'oscar', 'grammy', 'emmy', 'golden globe', 'movie', 'actor', 'actress',
  'celebrity', 'kardashian', 'taylor swift', 'beyonce',
  'gta vi', 'video game', 'gaming', 'esports', 'lol', 'dota', 'csgo',
  'bachelorette', 'survivor', 'reality tv', 'netflix show',
  'pregnant', 'baby', 'wedding', 'divorce'
];

// Pagination for discovery
const OFFSETS = [0, 50, 100, 150, 200];

function shouldReject(event: any): boolean {
  const title = (event.title || '').toLowerCase();
  const tags = (event.tags || []).map((t: any) => (t.label || '').toLowerCase());
  
  // Check title keywords
  for (const kw of REJECT_KEYWORDS) {
    if (title.includes(kw)) return true;
  }
  
  // Check category tags
  for (const cat of REJECT_CATEGORIES) {
    if (tags.some((t: string) => t.includes(cat.toLowerCase()))) return true;
  }
  
  return false;
}

// Parse market from event
function parseMarket(event: any) {
  const m = event.markets?.[0] || {};
  
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
  
  const tags = event.tags?.map((t: any) => t.label || '').filter(Boolean) || [];
  
  return {
    id: event.id || m.id,
    slug: event.slug || m.slug,
    question: event.title || m.question || m.title || 'Unknown',
    tags: tags,
    category: tags[0] || 'General',
    yesPrice,
    volume: parseFloat(m.volume || m.volumeNum || event.volume || 0),
    liquidity: parseFloat(m.liquidity || m.liquidityNum || 0),
    endDate: m.endDate || event.endDate || ''
  };
}

// Fetch all markets at offset
async function fetchMarketsPage(offset: number): Promise<any[]> {
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
    // Skip if rejected
    if (shouldReject(event)) continue;
    
    const market = parseMarket(event);
    
    // Skip very low volume
    if (market.volume < 10000) continue;
    
    markets.push(market);
  }
  
  return markets;
}

// Fetch with rotating offset
async function fetchDynamicMarkets(): Promise<any[]> {
  // Rotate offset based on hour
  const hour = new Date().getHours();
  const offset = OFFSETS[hour % OFFSETS.length];
  
  console.log(`Fetching markets at offset ${offset}`);
  
  const allMarkets: any[] = [];
  
  // Fetch 2 pages for variety
  const [page1, page2] = await Promise.all([
    fetchMarketsPage(offset),
    fetchMarketsPage(offset + 50)
  ]);
  
  allMarkets.push(...page1, ...page2);
  
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

// Detect price alerts
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
    
    // Group by detected category
    const byCategory = markets.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {});
    
    switch (action) {
      case 'feed':
        return Response.json({
          ok: true,
          timestamp: new Date().toISOString(),
          filter: {
            type: 'blacklist',
            rejectedCategories: REJECT_CATEGORIES,
            rejectedKeywords: REJECT_KEYWORDS.length
          },
          summary: {
            totalMarkets: markets.length,
            byCategory,
            p0Alerts: alerts.filter(a => a.severity === 'P0').length,
            p1Alerts: alerts.filter(a => a.severity === 'P1').length,
          },
          markets: markets.slice(0, 30).map(m => ({
            id: m.id,
            question: m.question,
            category: m.category,
            tags: m.tags.slice(0, 3),
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
        
      case 'rejected':
        // Show what we're filtering out (for debugging)
        return Response.json({
          ok: true,
          rejectedCategories: REJECT_CATEGORIES,
          rejectedKeywords: REJECT_KEYWORDS
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