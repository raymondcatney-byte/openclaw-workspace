// Vercel Edge Function: Polymarket Feed with Category Filtering
// Whitelist categories + blacklist keywords for clean results

export const runtime = 'edge';

interface Market {
  id: string;
  slug: string;
  question: string;
  category: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  liquidity: number;
  endDate: string;
  tags?: string[];
}

// WHITELIST: Only these categories
const ALLOWED_CATEGORIES = [
  'POLITICS', 'GEOPOLITICS', 'GOVERNMENT',
  'CRYPTO', 'FINANCE', 'ECONOMY', 'BUSINESS',
  'TECH', 'TECHNOLOGY', 'AI', 'SCIENCE',
  'COMMODITIES', 'EQUITIES', 'TRADING'
];

// BLACKLIST: Reject markets containing these terms
const REJECT_KEYWORDS = [
  'NBA', 'NFL', 'NHL', 'MLB', 'FIFA', 'World Cup', 'Super Bowl',
  'UFC', 'boxing', 'tennis', 'golf', 'soccer', 'football',
  'Oscar', 'Grammy', 'Emmy', 'movie', 'actor', 'celebrity',
  'GTA', 'video game', 'gaming', 'esports',
  'Bachelorette', 'Survivor', 'reality TV'
];

// Search terms to find relevant markets
const SEARCH_TERMS = [
  'Trump', 'Biden', 'election', 'president', 'congress',
  'Bitcoin', 'Ethereum', 'crypto', 'ETF', 'SEC',
  'S&P', 'NASDAQ', 'Dow', 'gold', 'silver', 'oil', 'natural gas',
  'Fed', 'rate', 'inflation', 'recession', 'GDP',
  'war', 'Ukraine', 'Russia', 'China', 'Israel', 'Iran',
  'AI', 'AGI', 'ChatGPT', 'OpenAI',
  'FDA', 'drug', 'vaccine', 'biotech'
];

// Check if market should be rejected
function shouldReject(market: Market): boolean {
  const text = `${market.question} ${market.category} ${market.tags?.join(' ') || ''}`.toLowerCase();
  
  // Check blacklist
  for (const keyword of REJECT_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) {
      return true;
    }
  }
  
  // Check if category is in whitelist
  const catUpper = market.category.toUpperCase();
  const isAllowed = ALLOWED_CATEGORIES.some(allowed => 
    catUpper.includes(allowed) || allowed.includes(catUpper)
  );
  
  return !isAllowed;
}

// Fetch markets from Gamma API
async function fetchMarketsByTag(tagId: number, categoryName: string): Promise<Market[]> {
  const url = `https://gamma-api.polymarket.com/events?tag_id=${tagId}&closed=false&active=true&limit=30`;
  
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    cf: { cacheTtl: 60 }
  });
  
  if (!response.ok) return [];
  
  const events = await response.json();
  const markets: Market[] = [];
  
  if (!Array.isArray(events)) return [];
  
  for (const event of events) {
    const eventMarkets = event.markets || [];
    
    for (const m of eventMarkets) {
      // Parse prices
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
      
      // Get tags
      const tags = event.tags?.map((t: any) => t.label || t.name) || [];
      
      const market: Market = {
        id: m.id || m.conditionId || m.slug,
        slug: event.slug || m.slug || '',
        question: m.question || m.title || event.title || event.question || 'Unknown',
        category: categoryName,
        yesPrice,
        noPrice,
        volume: parseFloat(m.volume || m.volumeNum || 0),
        liquidity: parseFloat(m.liquidity || m.liquidityNum || 0),
        endDate: m.endDate || event.endDate || '',
        tags
      };
      
      // Apply blacklist filter
      if (!shouldReject(market)) {
        markets.push(market);
      }
    }
  }
  
  return markets;
}

// Search markets with keyword fallback
async function searchMarkets(query: string): Promise<Market[]> {
  const url = `https://gamma-api.polymarket.com/events?search=${encodeURIComponent(query)}&closed=false&limit=20`;
  
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    cf: { cacheTtl: 60 }
  });
  
  if (!response.ok) return [];
  
  const events = await response.json();
  const markets: Market[] = [];
  
  if (!Array.isArray(events)) return [];
  
  for (const event of events) {
    const eventMarkets = event.markets || [];
    const category = event.tags?.[0]?.label || 'GENERAL';
    
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
      
      const tags = event.tags?.map((t: any) => t.label || t.name) || [];
      
      const market: Market = {
        id: m.id || m.conditionId,
        slug: event.slug || m.slug,
        question: m.question || m.title || event.title || 'Unknown',
        category,
        yesPrice,
        noPrice: 1 - yesPrice,
        volume: parseFloat(m.volume || 0),
        liquidity: parseFloat(m.liquidity || 0),
        endDate: m.endDate || event.endDate || '',
        tags
      };
      
      if (!shouldReject(market)) {
        markets.push(market);
      }
    }
  }
  
  return markets;
}

// Fetch all markets with filtering
async function fetchAllMarkets(): Promise<Market[]> {
  const allMarkets = new Map<string, Market>();
  
  // Method 1: Tag-based fetching for known categories
  const TAGS = [
    { id: 100265, name: 'GEOPOLITICS' },    // Politics/Geopolitics
    { id: 100328, name: 'ECONOMY' },        // Economy
    { id: 120, name: 'FINANCE' },           // Finance
    { id: 1401, name: 'TECH' },             // Tech
    { id: 21, name: 'CRYPTO' },             // Crypto
  ];
  
  for (const tag of TAGS) {
    const markets = await fetchMarketsByTag(tag.id, tag.name);
    for (const m of markets) {
      if (!allMarkets.has(m.id)) {
        allMarkets.set(m.id, m);
      }
    }
  }
  
  // Method 2: Search for new markets (traditional assets, etc.)
  for (const term of SEARCH_TERMS) {
    const markets = await searchMarkets(term);
    for (const m of markets) {
      if (!allMarkets.has(m.id)) {
        allMarkets.set(m.id, m);
      }
    }
  }
  
  return Array.from(allMarkets.values())
    .filter(m => m.volume > 10000)
    .sort((a, b) => b.volume - a.volume);
}

// Detect price/volume alerts
async function detectAlerts(markets: Market[], kv: KVNamespace): Promise<any[]> {
  const alerts: any[] = [];
  
  for (const market of markets) {
    const cacheKey = `market:${market.id}`;
    const cached = await kv.get(cacheKey);
    
    if (cached) {
      const old = JSON.parse(cached);
      const priceChange = Math.abs(market.yesPrice - old.yesPrice);
      const changePercent = priceChange / (old.yesPrice || 0.5);
      
      if (changePercent >= 0.05) {
        const severity = changePercent >= 0.1 ? 'P0' : 'P1';
        alerts.push({
          id: `price-${market.id}-${Date.now()}`,
          type: 'PRICE_MOVEMENT',
          severity,
          title: market.question.slice(0, 80),
          description: `Price ${market.yesPrice > old.yesPrice ? '↑' : '↓'} ${(changePercent * 100).toFixed(1)}%`,
          category: market.category,
          market: {
            id: market.id,
            slug: market.slug,
            yesPrice: market.yesPrice,
            change: changePercent,
            url: `https://polymarket.com/event/${market.slug}`
          },
          timestamp: new Date().toISOString()
        });
      }
    }
    
    await kv.put(cacheKey, JSON.stringify({
      yesPrice: market.yesPrice,
      volume: market.volume,
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
  const categoryFilter = url.searchParams.get('category'); // Optional filter
  
  // @ts-ignore
  const kv = (globalThis as any).POLYMARKET_KV;
  
  if (!kv) {
    return Response.json({ error: 'KV not configured' }, { status: 500 });
  }
  
  try {
    let markets = await fetchAllMarkets();
    
    // Optional category filter from query param
    if (categoryFilter) {
      const filterUpper = categoryFilter.toUpperCase();
      markets = markets.filter(m => 
        m.category.toUpperCase().includes(filterUpper) ||
        m.tags?.some(t => t.toUpperCase().includes(filterUpper))
      );
    }
    
    const alerts = await detectAlerts(markets, kv);
    
    // Store alerts
    const history = await kv.get('alerts:history');
    const pastAlerts = history ? JSON.parse(history) : [];
    if (alerts.length > 0) {
      await kv.put('alerts:history', JSON.stringify([...alerts, ...pastAlerts].slice(0, 50)), {
        expirationTtl: 604800
      });
    }
    
    // Group by category
    const byCategory = markets.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    switch (action) {
      case 'feed':
        return Response.json({
          ok: true,
          timestamp: new Date().toISOString(),
          filters: {
            allowedCategories: ALLOWED_CATEGORIES,
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
            tags: m.tags,
            yesPrice: Math.round(m.yesPrice * 100) + '%',
            volume: `$${(m.volume / 1000).toFixed(0)}k`,
            url: `https://polymarket.com/event/${m.slug}`
          })),
          alerts: alerts.slice(0, 10)
        });
        
      case 'markets':
        return Response.json({
          ok: true,
          count: markets.length,
          byCategory,
          markets: markets.slice(0, 50)
        });
        
      case 'alerts':
        return Response.json({
          ok: true,
          alerts: [...alerts, ...pastAlerts].slice(0, 50)
        });
        
      case 'categories':
        return Response.json({
          ok: true,
          allowed: ALLOWED_CATEGORIES,
          found: byCategory
        });
        
      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Feed error:', error);
    return Response.json({
      error: 'Feed failed',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}