// Hybrid: Use Gamma API with pagination per category
export const runtime = 'edge';

const DESIRED_CATEGORIES = [
  { id: 100265, name: 'GEOPOLITICS' },
  { id: 100328, name: 'ECONOMY' },
  { id: 120, name: 'FINANCE' },
  { id: 1401, name: 'TECH' },
  { id: 21, name: 'CRYPTO' },
  { id: 2, name: 'POLITICS' },
];

const REJECT_KEYWORDS = [
  'nba', 'nfl', 'nhl', 'mlb', 'ufc', 'boxing', 'tennis', 'golf',
  'ncaab', 'ncaaf', 'soccer', 'football match',
  'oscar', 'grammy', 'emmy', 'movie', 'celebrity', 'gta vi',
  'pregnant', 'bachelorette', 'survivor', 'reality tv'
];

function shouldReject(title: string): boolean {
  const lower = title.toLowerCase();
  return REJECT_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

// Fetch markets for ONE category with pagination
async function fetchCategoryMarkets(tagId: number, categoryName: string): Promise<any[]> {
  const markets: any[] = [];
  let offset = 0;
  const limit = 50;
  
  // Fetch up to 3 pages (150 markets) per category
  for (let page = 0; page < 3; page++) {
    const url = `https://gamma-api.polymarket.com/events?tag_id=${tagId}&closed=false&active=true&limit=${limit}&offset=${offset}`;
    
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      cf: { cacheTtl: 60 }
    });
    
    if (!res.ok) break;
    
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    
    for (const event of data) {
      const eventMarkets = event.markets || [];
      
      for (const m of eventMarkets) {
        // Skip rejected
        if (shouldReject(event.title || m.question || '')) continue;
        
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
        
        markets.push({
          id: m.id || m.conditionId,
          slug: event.slug || m.slug,
          question: event.title || m.question || m.title || 'Unknown',
          category: categoryName,
          yesPrice,
          volume: parseFloat(m.volume || m.volumeNum || 0),
          liquidity: parseFloat(m.liquidity || m.liquidityNum || 0),
          endDate: m.endDate || event.endDate,
        });
      }
    }
    
    offset += limit;
    
    // Small delay
    if (page < 2) await new Promise(r => setTimeout(r, 200));
  }
  
  // Sort by volume and take top 10
  markets.sort((a, b) => b.volume - a.volume);
  return markets.slice(0, 10);
}

// Fetch all categories
async function fetchAllMarkets(): Promise<Record<string, any[]>> {
  const result: Record<string, any[]> = {};
  
  for (const cat of DESIRED_CATEGORIES) {
    console.log(`Fetching ${cat.name}...`);
    result[cat.name] = await fetchCategoryMarkets(cat.id, cat.name);
  }
  
  return result;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'feed';
  
  try {
    const byCategory = await fetchAllMarkets();
    
    // Calculate totals
    const totalMarkets = Object.values(byCategory).flat().length;
    
    switch (action) {
      case 'feed':
      default:
        return Response.json({
          ok: true,
          timestamp: new Date().toISOString(),
          source: 'Gamma API (FREE)',
          method: 'per-category-pagination',
          summary: {
            totalMarkets,
            perCategory: Object.fromEntries(
              Object.entries(byCategory).map(([k, v]) => [k, v.length])
            ),
          },
          marketsByCategory: byCategory,
        });
        
      case 'category':
        const cat = url.searchParams.get('name') || 'GEOPOLITICS';
        return Response.json({
          ok: true,
          category: cat,
          markets: byCategory[cat] || []
        });
    }
    
  } catch (error) {
    console.error('Error:', error);
    return Response.json({
      error: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 });
  }
}