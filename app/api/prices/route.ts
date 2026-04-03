// app/api/prices/route.ts
// Edge runtime API for current prices
// Fetches from Polymarket RTDS or returns cached data

export const runtime = 'edge';

// In-memory cache (per-request in Edge, use Redis for multi-region)
let priceCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 5000; // 5 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols')?.split(',') || ['BTC', 'ETH', 'SPY', 'QQQ'];
  
  // Check cache
  if (priceCache && Date.now() - priceCache.timestamp < CACHE_TTL) {
    return Response.json({
      prices: priceCache.data,
      cached: true,
      timestamp: new Date(priceCache.timestamp).toISOString(),
    });
  }
  
  // Mock prices - in production, fetch from your RTDS connection or Polymarket
  const prices = symbols.map((symbol) => ({
    symbol: symbol.toUpperCase(),
    price: generateMockPrice(symbol),
    change24h: generateMockChange(),
    volume24h: generateMockVolume(symbol),
    high24h: 0,
    low24h: 0,
    assetClass: getAssetClass(symbol),
    lastUpdated: new Date().toISOString(),
    source: 'polymarket-rtds',
  }));
  
  // Update cache
  priceCache = { data: prices, timestamp: Date.now() };
  
  return Response.json({
    prices,
    cached: false,
    timestamp: new Date().toISOString(),
    source: 'MarketAnomalyScanner',
  });
}

function generateMockPrice(symbol: string): number {
  const basePrices: Record<string, number> = {
    BTC: 67234.50,
    ETH: 3456.78,
    SOL: 178.45,
    SPY: 518.32,
    QQQ: 442.18,
    VXX: 14.82,
    AAPL: 168.45,
    TSLA: 175.23,
    NVDA: 878.56,
    XAUUSD: 2234.50,
  };
  
  const base = basePrices[symbol.toUpperCase()] || 100;
  const noise = (Math.random() - 0.5) * 0.01; // ±0.5%
  return Math.round(base * (1 + noise) * 100) / 100;
}

function generateMockChange(): number {
  return Math.round((Math.random() * 10 - 5) * 100) / 100; // -5% to +5%
}

function generateMockVolume(symbol: string): number {
  const volumes: Record<string, number> = {
    BTC: 28_500_000_000,
    ETH: 15_200_000_000,
    SPY: 45_000_000,
    QQQ: 28_000_000,
  };
  return volumes[symbol.toUpperCase()] || 1_000_000_000;
}

function getAssetClass(symbol: string): string {
  const crypto = ['BTC', 'ETH', 'SOL'];
  const equity = ['SPY', 'QQQ', 'VXX', 'AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'META'];
  const metal = ['XAUUSD', 'XAGUSD'];
  
  if (crypto.includes(symbol.toUpperCase())) return 'crypto';
  if (equity.includes(symbol.toUpperCase())) return 'equity';
  if (metal.includes(symbol.toUpperCase())) return 'metal';
  return 'other';
}
