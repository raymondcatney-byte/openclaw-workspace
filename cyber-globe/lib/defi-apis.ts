// lib/defi-apis.ts - DeFi, Polymarket, and on-chain intelligence APIs
// All free, client-side accessible

// ============================================
// POLYMARKET ORACLE - Prediction Market Intelligence
// ============================================

export interface PolymarketEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  endDate: string;
  liquidity: number;
  volume: number;
  markets: PolymarketMarket[];
}

export interface PolymarketMarket {
  id: string;
  question: string;
  outcomePrices: {
    yes: number;
    no: number;
  };
  volume: number;
  liquidity: number;
  category: string;
  endDate: string;
}

// Polymarket Gamma API (community endpoint)
export async function getPolymarketEvents(limit: number = 20): Promise<PolymarketEvent[]> {
  try {
    const response = await fetch(
      `https://gamma-api.polymarket.com/events?limit=${limit}&active=true&archived=false`
    );
    if (!response.ok) throw new Error('Polymarket API error');
    return response.json();
  } catch (error) {
    console.error('Polymarket fetch failed:', error);
    return [];
  }
}

export async function getPolymarketMarketById(marketId: string): Promise<PolymarketMarket | null> {
  try {
    const response = await fetch(`https://gamma-api.polymarket.com/markets/${marketId}`);
    if (!response.ok) throw new Error('Market not found');
    return response.json();
  } catch (error) {
    return null;
  }
}

// High-value political/financial markets for Bruce Wayne persona
export async function getSovereignRelevantMarkets(): Promise<PolymarketMarket[]> {
  const keywords = ['trump', 'election', 'fed', 'rate', 'war', 'crypto', 'etf'];
  const allEvents = await getPolymarketEvents(50);
  
  return allEvents
    .flatMap(e => e.markets || [])
    .filter(m => {
      const text = (m.question + ' ' + m.category).toLowerCase();
      return keywords.some(k => text.includes(k));
    })
    .sort((a, b) => b.liquidity - a.liquidity)
    .slice(0, 10);
}

// ============================================
// DEFILLAMA - DeFi Yield & TVL Intelligence
// ============================================

export interface YieldPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase: number;
  apyReward: number;
  apy: number;
  rewardTokens: string[];
  pool: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ProtocolTVL {
  name: string;
  tvl: number;
  tvlChange24h: number;
  category: string;
  chains: string[];
}

// Get highest yield opportunities
export async function getYieldOpportunities(
  minTvl: number = 1000000,
  maxApy: number = 100 // Filter out insane APYs (rug pulls)
): Promise<YieldPool[]> {
  try {
    const response = await fetch('https://yields.llama.fi/pools');
    if (!response.ok) throw new Error('DeFiLlama yields error');
    const data = await response.json();
    
    return data.data
      .filter((pool: YieldPool) => 
        pool.tvlUsd >= minTvl && 
        pool.apy <= maxApy && 
        pool.apy > 0
      )
      .map((pool: YieldPool) => ({
        ...pool,
        riskLevel: calculateRiskLevel(pool)
      }))
      .sort((a: YieldPool, b: YieldPool) => b.apy - a.apy)
      .slice(0, 20);
  } catch (error) {
    console.error('Yield fetch failed:', error);
    return [];
  }
}

// Get protocol TVL rankings
export async function getTopProtocols(limit: number = 20): Promise<ProtocolTVL[]> {
  try {
    const response = await fetch('https://api.llama.fi/protocols');
    if (!response.ok) throw new Error('DeFiLlama protocols error');
    const data = await response.json();
    
    return data
      .sort((a: any, b: any) => b.tvl - a.tvl)
      .slice(0, limit)
      .map((p: any) => ({
        name: p.name,
        tvl: p.tvl,
        tvlChange24h: p.change_1d || 0,
        category: p.category,
        chains: p.chains || []
      }));
  } catch (error) {
    console.error('Protocol fetch failed:', error);
    return [];
  }
}

// Get stablecoin flows (macro signal)
export async function getStablecoinData() {
  try {
    const response = await fetch('https://stablecoins.llama.fi/stablecoins');
    if (!response.ok) throw new Error('Stablecoin data error');
    return response.json();
  } catch (error) {
    return null;
  }
}

// Risk scoring based on TVL, APY, and project maturity
function calculateRiskLevel(pool: YieldPool): 'low' | 'medium' | 'high' {
  if (pool.tvlUsd > 100000000 && pool.apy < 10) return 'low';
  if (pool.tvlUsd > 10000000 && pool.apy < 30) return 'medium';
  return 'high';
}

// ============================================
// THE GRAPH - On-Chain Data (Free Subgraphs)
// ============================================

const UNISWAP_V3_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/uniswap/uniswap-v3';
const AAVE_V3_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/aave/protocol-v3';

export interface WhaleSwap {
  timestamp: number;
  token0Symbol: string;
  token1Symbol: string;
  amountUSD: number;
  origin: string;
  transactionHash: string;
}

// Query large Uniswap swaps (>$100k)
export async function getWhaleSwaps(minUsd: number = 100000, limit: number = 20): Promise<WhaleSwap[]> {
  const query = `
    {
      swaps(
        first: ${limit}
        orderBy: amountUSD
        orderDirection: desc
        where: { amountUSD_gt: ${minUsd} }
      ) {
        timestamp
        amountUSD
        origin
        transaction {
          id
        }
        pool {
          token0 {
            symbol
          }
          token1 {
            symbol
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(UNISWAP_V3_SUBGRAPH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    
    const data = await response.json();
    return data.data.swaps.map((swap: any) => ({
      timestamp: parseInt(swap.timestamp),
      token0Symbol: swap.pool.token0.symbol,
      token1Symbol: swap.pool.token1.symbol,
      amountUSD: parseFloat(swap.amountUSD),
      origin: swap.origin,
      transactionHash: swap.transaction.id
    }));
  } catch (error) {
    console.error('Whale swap fetch failed:', error);
    return [];
  }
}

// Get Aave liquidation data
export async function getLiquidationData(limit: number = 10) {
  const query = `
    {
      liquidationCalls(
        first: ${limit}
        orderBy: timestamp
        orderDirection: desc
      ) {
        timestamp
        collateralAsset {
          symbol
        }
        debtAsset {
          symbol
        }
        liquidatedCollateralAmount
        debtToCover
      }
    }
  `;

  try {
    const response = await fetch(AAVE_V3_SUBGRAPH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    
    return await response.json();
  } catch (error) {
    return null;
  }
}

// ============================================
// COINGECKO - Market Data (Extended)
// ============================================

export async function getGlobalMarketData() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/global');
    return response.json();
  } catch (error) {
    return null;
  }
}

export async function getTopGainersLosers(vsCurrency: string = 'usd', duration: string = '24h') {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${vsCurrency}&order=market_cap_desc&per_page=250&sparkline=false&price_change_percentage=24h`
    );
    const data = await response.json();
    
    return {
      gainers: data
        .filter((c: any) => c.price_change_percentage_24h > 0)
        .sort((a: any, b: any) => b.price_change_percentage_24h - a.price_change_percentage_24h)
        .slice(0, 10),
      losers: data
        .filter((c: any) => c.price_change_percentage_24h < 0)
        .sort((a: any, b: any) => a.price_change_percentage_24h - b.price_change_percentage_24h)
        .slice(0, 10)
    };
  } catch (error) {
    return { gainers: [], losers: [] };
  }
}

// ============================================
// SOVEREIGN SIGNAL ENGINE - Data Correlation
// ============================================

export interface SovereignSignal {
  id: string;
  timestamp: number;
  confidence: number;
  type: 'TRADE' | 'HEDGE' | 'YIELD' | 'RISK_ALERT' | 'POLITICAL_ALPHA';
  thesis: string;
  summary: string;
  actions: {
    human: string;
    agent: string;
    autoExecute: boolean;
  };
  dataSources: string[];
  metadata: {
    polymarketProbability?: number;
    whaleAccumulation?: boolean;
    yieldOpportunity?: YieldPool;
    tvlChange?: number;
  };
}

// Generate alpha signals by correlating data sources
export async function generateSovereignSignals(): Promise<SovereignSignal[]> {
  const signals: SovereignSignal[] = [];
  
  try {
    // Parallel data fetching
    const [polyMarkets, yields, whaleSwaps, marketData] = await Promise.all([
      getSovereignRelevantMarkets(),
      getYieldOpportunities(5000000, 50),
      getWhaleSwaps(500000, 10),
      getGlobalMarketData()
    ]);

    // Signal 1: Political Alpha from Polymarket
    const highConfidencePolitical = polyMarkets.find(m => 
      m.outcomePrices.yes > 0.7 || m.outcomePrices.no > 0.7
    );
    
    if (highConfidencePolitical) {
      const isYes = highConfidencePolitical.outcomePrices.yes > 0.7;
      signals.push({
        id: `poly-${Date.now()}`,
        timestamp: Date.now(),
        confidence: isYes ? highConfidencePolitical.outcomePrices.yes : highConfidencePolitical.outcomePrices.no,
        type: 'POLITICAL_ALPHA',
        thesis: `Polymarket shows ${(isYes ? highConfidencePolitical.outcomePrices.yes : highConfidencePolitical.outcomePrices.no * 100).toFixed(1)}% confidence: "${highConfidencePolitical.question}"`,
        summary: `Market expects ${isYes ? 'YES' : 'NO'} outcome. Position accordingly.`,
        actions: {
          human: `Consider ${isYes ? 'long' : 'short'} positions in affected sectors`,
          agent: 'Monitor correlated assets for entry',
          autoExecute: false
        },
        dataSources: ['Polymarket'],
        metadata: { polymarketProbability: isYes ? highConfidencePolitical.outcomePrices.yes : highConfidencePolitical.outcomePrices.no }
      });
    }

    // Signal 2: Whale Accumulation + Yield Opportunity
    const recentWhaleBuy = whaleSwaps.find(s => 
      s.token0Symbol === 'USDC' || s.token0Symbol === 'USDT'
    );
    
    if (recentWhaleBuy && yields.length > 0) {
      const topYield = yields[0];
      signals.push({
        id: `yield-${Date.now()}`,
        timestamp: Date.now(),
        confidence: 0.75,
        type: 'YIELD',
        thesis: `Whale moved $${recentWhaleBuy.amountUSD.toLocaleString()} into ${recentWhaleBuy.token1Symbol}. Top yield: ${topYield.project} at ${topYield.apy.toFixed(2)}% APY.`,
        summary: 'Smart money flowing + yield available = opportunity',
        actions: {
          human: `Evaluate ${topYield.project} ${topYield.symbol} pool`,
          agent: 'Simulate position sizing',
          autoExecute: false
        },
        dataSources: ['The Graph (Uniswap)', 'DeFiLlama'],
        metadata: { 
          whaleAccumulation: true,
          yieldOpportunity: topYield
        }
      });
    }

    // Signal 3: Market Fear/Greed
    const marketCapChange = marketData?.data?.market_cap_change_percentage_24h_usd || 0;
    if (Math.abs(marketCapChange) > 5) {
      signals.push({
        id: `macro-${Date.now()}`,
        timestamp: Date.now(),
        confidence: 0.8,
        type: marketCapChange > 0 ? 'TRADE' : 'RISK_ALERT',
        thesis: `Global crypto market cap ${marketCapChange > 0 ? 'up' : 'down'} ${Math.abs(marketCapChange).toFixed(2)}% in 24h`,
        summary: marketCapChange > 0 ? 'Risk-on environment' : 'Risk-off environment',
        actions: {
          human: marketCapChange > 0 ? 'Consider taking profits' : 'Look for dip-buying opportunities',
          agent: 'Adjust position sizing',
          autoExecute: false
        },
        dataSources: ['CoinGecko'],
        metadata: { tvlChange: marketCapChange }
      });
    }

  } catch (error) {
    console.error('Signal generation failed:', error);
  }

  return signals.sort((a, b) => b.confidence - a.confidence);
}

// ============================================
// POLLING CONFIGURATION
// ============================================

export const DEFI_POLLING_INTERVALS = {
  polymarket: 30000,    // 30 seconds
  yields: 300000,       // 5 minutes
  whaleSwaps: 60000,    // 1 minute
  protocols: 300000,    // 5 minutes
  signals: 60000        // 1 minute
};
