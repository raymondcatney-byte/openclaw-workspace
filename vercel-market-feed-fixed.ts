// Vercel Edge Function: Fixed Polymarket Feed
// Returns readable questions, not just slugs

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
}

// Search-based fetch - finds all markets including new traditional assets
async function searchMarkets(query: string, limit = 20): Promise<Market[]> {
  const url = `https://gamma-api.polymarket.com/events?search=${encodeURIComponent(query)}&closed=false&active=true&limit=${limit}`;
  
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    cf: { cacheTtl: 60 }
  });
  
  if (!response.ok) {
    console.error('Gamma API error:', response.status);
    return [];
  }
  
  const events = await response.json();
  const markets: Market[] = [];
  
  if (!Array.isArray(events)) {
    console.error('Invalid events format');
    return [];
  }
  
  for (const event of events) {
    // Get market data from event.markets array
    const eventMarkets = event.markets || [];
    
    for (const m of eventMarkets) {
      // Parse prices safely
      let yesPrice = 0.5;
      let noPrice = 0.5;
      
      if (m.outcomePrices) {
        try {
          const prices = JSON.parse(m.outcomePrices);
          yesPrice = parseFloat(prices[0]) || 0.5;
          noPrice = parseFloat(prices[1]) || 0.5;
        } catch {
          // Fallback to direct fields
          yesPrice = parseFloat(m.yesPrice) || 0.5;
          noPrice = parseFloat(m.noPrice) || (1 - yesPrice);
        }
      } else {
        yesPrice = parseFloat(m.yesPrice) || 0.5;
        noPrice = parseFloat(m.noPrice) || (1 - yesPrice);
      }
      
      // Get readable question text
      const question = m.question 
        || m.title 
        || event.title 
        || event.question
        || 'Unknown Market';
      
      // Get category from tags
      const category = event.tags?.[0]?.label 
        || event.tags?.[0]?.name 
        || event.category 
        || 'GENERAL';
      
      markets.push({
        id: m.id || m.conditionId || m.slug || String(Math.random()),
        slug: event.slug || m.slug || '',
        question: question.slice(0, 200),
        category: category.toUpperCase(),
        yesPrice,
        noPrice,
        volume: parseFloat(m.volume || m.volumeNum || 0),
        liquidity: parseFloat(m.liquidity || m.liquidityNum || 0),
        endDate: m.endDate || event.endDate || ''
      });
    }
  }
  
  return markets;
}

// Fetch all relevant markets using search
async function fetchAllMarkets(): Promise<Market[]> {
  // Search terms that cover politics, crypto, and new traditional assets
  const searchTerms = [
    'Trump', 'Biden', 'election', 'president',
    'Bitcoin', 'Ethereum', 'crypto',
    'S&P', 'NASDAQ', 'gold', 'oil', 'commodity',
    'war', 'Ukraine', 'Russia', 'China',
    'Fed', 'rate', 'inflation', 'recession'
  ];
  
  const allMarkets = new Map<string, Market>();
  
  // Search each term
  const results = await Promise.all(
    searchTerms.map(term => searchMarkets(term, 10))
  );
  
  // Deduplicate by ID
  for (const markets of results) {
    for (const m of markets) {
      if (!allMarkets.has(m.id)) {
        allMarkets.set(m.id, m);
      }
    }
  }
  
  return Array.from(allMarkets.values())
    .filter(m => m.volume > 10000) // Min $10k volume
    .sort((a, b) => b.volume - a.volume); // Sort by volume
}

// Detect price movements
async function detectAlerts(
  markets: Market[],
  kv: KVNamespace
): Promise<any[]> {
  const alerts: any[] = [];
  
  for (const market of markets) {
    const cacheKey = `market:${market.id}`;
    const cached = await kv.get(cacheKey);
    
    if (cached) {
      const old = JSON.parse(cached);
      const priceChange = Math.abs(market.yesPrice - old.yesPrice);
      const changePercent = priceChange / (old.yesPrice || 0.5);
      
      // Alert thresholds
      const isMajorMove = changePercent >= 0.05; // 5%
      const isVolumeSpike = market.volume > (old.volume * 5); // 5x volume
      
      if (isMajorMove || isVolumeSpike) {
        const severity = changePercent >= 0.1 ? 'P0' : 
                        changePercent >= 0.05 ? 'P1' : 'P2';
        
        alerts.push({
          id: `alert-${market.id}-${Date.now()}`,
          type: isMajorMove ? 'PRICE_MOVEMENT' : 'VOLUME_SPIKE',
          severity,
          title: market.question.slice(0, 80),
          description: isMajorMove 
            ? `Price ${market.yesPrice > old.yesPrice ? '↑' : '↓'} ${(changePercent * 100).toFixed(1)}%`
            : `Volume spike ${(market.volume / old.volume).toFixed(1)}x`,
          market: {
            id: market.id,
            slug: market.slug,
            category: market.category,
            yesPrice: market.yesPrice,
            oldPrice: old.yesPrice,
            volume: market.volume,
            change: changePercent,
            url: `https://polymarket.com/event/${market.slug}`
          },
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Update cache
    await kv.put(cacheKey, JSON.stringify({
      yesPrice: market.yesPrice,
      volume: market.volume,
      timestamp: Date.now()
    }), { expirationTtl: 86400 });
  }
  
  return alerts.sort((a, b) => {
    const sevOrder = { P0: 0, P1: 1, P2: 2 };
    return sevOrder[a.severity] - sevOrder[b.severity];
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'feed';
  
  // @ts-ignore
  const kv = (globalThis as any).POLYMARKET_KV;
  
  if (!kv) {
    return Response.json({ error: 'KV not configured' }, { status: 500 });
  }
  
  try {
    // Fetch markets
    const markets = await fetchAllMarkets();
    
    // Detect alerts
    const alerts = await detectAlerts(markets, kv);
    
    // Get recent alerts history
    const history = await kv.get('alerts:history');
    const pastAlerts = history ? JSON.parse(history) : [];
    
    // Store new alerts
    if (alerts.length > 0) {
      const updated = [...alerts, ...pastAlerts].slice(0, 50);
      await kv.put('alerts:history', JSON.stringify(updated), { expirationTtl: 604800 });
    }
    
    switch (action) {
      case 'feed':
        return Response.json({
          ok: true,
          timestamp: new Date().toISOString(),
          summary: {
            totalMarkets: markets.length,
            p0Alerts: alerts.filter(a => a.severity === 'P0').length,
            p1Alerts: alerts.filter(a => a.severity === 'P1').length,
            p2Alerts: alerts.filter(a => a.severity === 'P2').length
          },
          markets: markets.slice(0, 30).map(m => ({
            id: m.id,
            question: m.question,
            category: m.category,
            yesPrice: Math.round(m.yesPrice * 100) + '%',
            volume: `$${(m.volume / 1000).toFixed(0)}k`,
            url: `https://polymarket.com/event/${m.slug}`
          })),
          alerts: alerts.slice(0, 10),
          recentAlerts: pastAlerts.slice(0, 20)
        });
        
      case 'markets':
        return Response.json({
          ok: true,
          count: markets.length,
          markets
        });
        
      case 'alerts':
        return Response.json({
          ok: true,
          alerts: [...alerts, ...pastAlerts].slice(0, 50)
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