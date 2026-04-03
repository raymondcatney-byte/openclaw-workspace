// Working solution: Multiple tag IDs + client-side category filter
export const runtime = 'edge';

// YOUR DESIRED CATEGORIES
const DESIRED_TAGS = [
  { id: 100265, name: 'GEOPOLITICS' },
  { id: 100328, name: 'ECONOMY' },
  { id: 120, name: 'FINANCE' },
  { id: 1401, name: 'TECH' },
  { id: 21, name: 'CRYPTO' },
  { id: 2, name: 'POLITICS' },
];

// Build comma-separated tag string
const TAG_IDS = DESIRED_TAGS.map(t => t.id).join(',');

// Reject sports/entertainment keywords
const REJECT_KEYWORDS = [
  'nba', 'nfl', 'nhl', 'mlb', 'ufc', 'boxing',
  'oscar', 'grammy', 'movie', 'celebrity', 'gta vi'
];

function shouldReject(title: string): boolean {
  const lower = title.toLowerCase();
  return REJECT_KEYWORDS.some(kw => lower.includes(kw));
}

// Fetch markets from specific tags
async function fetchMarkets(): Promise<any[]> {
  // Use tag_ids (plural) for multiple categories
  const url = `https://gamma-api.polymarket.com/events?tag_ids=${TAG_IDS}&closed=false&active=true&limit=100`;
  
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    cf: { cacheTtl: 60 }
  });
  
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  
  const markets: any[] = [];
  
  for (const event of data) {
    const m = event.markets?.[0] || {};
    
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
    
    // Get tags for category detection
    const tags = event.tags?.map((t: any) => t.label?.toUpperCase()) || [];
    
    // Find which desired category this matches
    const matchedCategory = DESIRED_TAGS.find(t =>
      tags.some(tag => tag?.includes(t.name))
    )?.name || tags[0] || 'General';
    
    const market = {
      id: event.id || m.id,
      slug: event.slug || m.slug,
      question: event.title || m.question || 'Unknown',
      category: matchedCategory,
      tags: tags.slice(0, 3),
      yesPrice,
      volume: parseFloat(m.volume || 0),
      liquidity: parseFloat(m.liquidity || 0)
    };
    
    if (!shouldReject(market.question) && market.volume > 10000) {
      markets.push(market);
    }
  }
  
  // Sort by volume
  markets.sort((a, b) => b.volume - a.volume);
  
  return markets;
}

export async function GET(request: Request) {
  try {
    const markets = await fetchMarkets();
    
    // Group by category
    const byCategory = markets.reduce((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + 1;
      return acc;
    }, {});
    
    return Response.json({
      ok: true,
      timestamp: new Date().toISOString(),
      method: 'tag_ids filter',
      categoriesRequested: DESIRED_TAGS.map(t => t.name),
      summary: {
        totalMarkets: markets.length,
        byCategory
      },
      markets: markets.slice(0, 30).map(m => ({
        id: m.id,
        question: m.question,
        category: m.category,
        yesPrice: `${(m.yesPrice * 100).toFixed(0)}%`,
        volume: `$${(m.volume / 1000).toFixed(0)}k`,
        url: `https://polymarket.com/event/${m.slug}`
      }))
    });
    
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}