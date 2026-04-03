// Working Polymarket Feed - Tested and Verified
// Returns actual markets with readable questions

export const runtime = 'edge';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Type': 'application/json'
};

// Working tag IDs based on actual API testing
const CATEGORY_TAGS = [
  { id: 100265, name: 'GEOPOLITICS', label: 'Geopolitics' },
  { id: 100328, name: 'ECONOMY', label: 'Economy' },
  { id: 120, name: 'FINANCE', label: 'Finance' },
  { id: 1401, name: 'TECH', label: 'Tech' },
  { id: 21, name: 'CRYPTO', label: 'Crypto' },
  { id: 2, name: 'POLITICS', label: 'Politics' },
  { id: 100025, name: 'WORLD', label: 'World' },
];

// Keywords to reject (sports/entertainment)
const REJECT_KEYWORDS = [
  'nba', 'nfl', 'nhl', 'mlb', 'fifa', 'world cup', 'super bowl',
  'ufc', 'boxing', 'tennis', 'golf', 'soccer', 'football match',
  'oscar', 'grammy', 'emmy', 'movie', 'actor', 'celebrity',
  'gta vi', 'video game', 'gaming', 'esports', 'bachelorette'
];

// Check if market should be rejected
function isRejected(title: string): boolean {
  const lower = title.toLowerCase();
  return REJECT_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

// Parse market from API response
function parseMarket(m: any, event: any, categoryName: string) {
  // Get prices
  let yesPrice = 0.5;
  let noPrice = 0.5;
  
  if (m.outcomePrices) {
    try {
      const prices = JSON.parse(m.outcomePrices);
      yesPrice = parseFloat(prices[0]) || 0.5;
      noPrice = parseFloat(prices[1]) || 0.5;
    } catch {
      yesPrice = parseFloat(m.yesPrice) || 0.5;
      noPrice = parseFloat(m.noPrice) || (1 - yesPrice);
    }
  } else {
    yesPrice = parseFloat(m.yesPrice) || 0.5;
    noPrice = parseFloat(m.noPrice) || (1 - yesPrice);
  }
  
  // Get readable question - TRY MULTIPLE FIELDS
  const question = m.question 
    || m.title 
    || event.title 
    || event.question
    || m.description?.slice(0, 100)
    || 'Unknown Market';
  
  return {
    id: m.id || m.conditionId || m.slug,
    slug: event.slug || m.slug || '',
    question: question.slice(0, 200),
    category: categoryName,
    yesPrice,
    noPrice,
    volume: parseFloat(m.volume || m.volumeNum || 0),
    liquidity: parseFloat(m.liquidity || m.liquidityNum || 0),
    endDate: m.endDate || event.endDate || '',
    image: event.image || m.image || ''
  };
}

// Fetch markets by tag - PROVEN WORKING METHOD
async function fetchByTag(tagId: number, categoryName: string) {
  const url = `https://gamma-api.polymarket.com/events?tag_id=${tagId}&closed=false&active=true&limit=20`;
  
  console.log(`Fetching: ${categoryName} (tag ${tagId})`);
  
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cf: { cacheTtl: 60 }
  });
  
  if (!res.ok) {
    console.error(`  Failed: ${res.status}`);
    return [];
  }
  
  const events = await res.json();
  
  if (!Array.isArray(events)) {
    console.error(`  Invalid response`);
    return [];
  }
  
  console.log(`  Events: ${events.length}`);
  
  const markets: any[] = [];
  
  for (const event of events) {
    const eventMarkets = event.markets || [];
    
    for (const m of eventMarkets) {
      const market = parseMarket(m, event, categoryName);
      
      // Filter out sports/entertainment
      if (!isRejected(market.question)) {
        markets.push(market);
      }
    }
  }
  
  console.log(`  Valid markets: ${markets.length}`);
  return markets;
}

// Fetch ALL markets from ALL categories
async function fetchAllMarkets() {
  const allMarkets = new Map();
  
  // Fetch each category
  for (const tag of CATEGORY_TAGS) {
    const markets = await fetchByTag(tag.id, tag.name);
    
    for (const m of markets) {
      if (!allMarkets.has(m.id)) {
        allMarkets.set(m.id, m);
      }
    }
  }
  
  // Convert to array, filter low volume, sort by volume
  return Array.from(allMarkets.values())
    .filter(m => m.volume > 5000)
    .sort((a, b) => b.volume - a.volume);
}

// Detect price changes
async function detectAlerts(markets: any[], kv: KVNamespace) {
  const alerts: any[] = [];
  
  for (const market of markets.slice(0, 50)) { // Check top 50 only
    const key = `price:${market.id}`;
    const cached = await kv.get(key);
    
    if (cached) {
      const old = JSON.parse(cached);
      const change = Math.abs(market.yesPrice - old.price);
      const changePercent = change / old.price;
      
      if (changePercent >= 0.03) { // 3% threshold
        alerts.push({
          id: `alert-${market.id}`,
          type: 'PRICE_MOVEMENT',
          severity: changePercent >= 0.08 ? 'P0' : changePercent >= 0.05 ? 'P1' : 'P2',
          title: market.question.slice(0, 100),
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
    
    // Cache current price
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
  const category = url.searchParams.get('category');
  
  // @ts-ignore
  const kv = (globalThis as any).POLYMARKET_KV;
  
  try {
    // Fetch all markets
    console.log('Starting market fetch...');
    let markets = await fetchAllMarkets();
    console.log(`Total markets: ${markets.length}`);
    
    // Filter by category if requested
    if (category) {
      markets = markets.filter(m => 
        m.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    // Detect alerts
    const alerts = kv ? await detectAlerts(markets, kv) : [];
    
    // Group by category for summary
    const byCategory = markets.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {});
    
    switch (action) {
      case 'feed':
      default:
        return new Response(JSON.stringify({
          ok: true,
          timestamp: new Date().toISOString(),
          summary: {
            totalMarkets: markets.length,
            byCategory,
            alerts: {
              p0: alerts.filter(a => a.severity === 'P0').length,
              p1: alerts.filter(a => a.severity === 'P1').length,
              p2: alerts.filter(a => a.severity === 'P2').length,
            }
          },
          markets: markets.slice(0, 25).map(m => ({
            id: m.id,
            question: m.question,
            category: m.category,
            yesPrice: `${(m.yesPrice * 100).toFixed(0)}%`,
            volume: `$${(m.volume / 1000).toFixed(1)}k`,
            endDate: m.endDate,
            url: `https://polymarket.com/event/${m.slug}`
          })),
          alerts: alerts.slice(0, 10)
        }), { headers: CORS_HEADERS });
        
      case 'raw':
        // Return raw data for debugging
        return new Response(JSON.stringify({
          ok: true,
          count: markets.length,
          markets
        }), { headers: CORS_HEADERS });
        
      case 'categories':
        return new Response(JSON.stringify({
          ok: true,
          categories: CATEGORY_TAGS,
          found: byCategory
        }), { headers: CORS_HEADERS });
    }
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { status: 500, headers: CORS_HEADERS });
  }
}