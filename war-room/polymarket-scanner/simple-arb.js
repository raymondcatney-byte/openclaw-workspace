#!/usr/bin/env node
/**
 * Simple Polymarket Arbitrage Scanner (No Database Required)
 * 
 * Quick start script that fetches current markets and shows
 * arbitrage opportunities without needing Supabase setup.
 */

const CLOB_API = 'https://clob.polymarket.com';

interface Market {
  condition_id: string;
  question: string;
  market_slug: string;
  category: string;
  volume: string;
  liquidity: string;
  tokens: Array<{
    token_id: string;
    outcome: string;
    price: string;
  }>;
}

interface ArbOpportunity {
  question: string;
  slug: string;
  yesPrice: number;
  noPrice: number;
  sum: number;
  edge: number;
  profitPer100: number;
  volume: number;
  liquidity: number;
}

async function fetchMarkets(): Promise<Market[]> {
  console.log('📡 Fetching markets from Polymarket...\n');
  
  try {
    const response = await fetch(`${CLOB_API}/markets`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('❌ Failed to fetch markets:', error);
    process.exit(1);
  }
}

function findArbitrage(markets: Market[]): ArbOpportunity[] {
  const opportunities: ArbOpportunity[] = [];
  
  for (const market of markets) {
    if (!market.tokens || market.tokens.length !== 2) continue;
    
    const yesToken = market.tokens.find(t => t.outcome === 'Yes');
    const noToken = market.tokens.find(t => t.outcome === 'No');
    
    if (!yesToken || !noToken) continue;
    
    const yesPrice = parseFloat(yesToken.price);
    const noPrice = parseFloat(noToken.price);
    const sum = yesPrice + noPrice;
    const edge = 1.0 - sum;
    
    // Minimum 0.5% edge and $5k liquidity
    if (edge > 0.005 && parseFloat(market.liquidity) > 5000) {
      opportunities.push({
        question: market.question,
        slug: market.market_slug,
        yesPrice,
        noPrice,
        sum,
        edge,
        profitPer100: edge * 100,
        volume: parseFloat(market.volume),
        liquidity: parseFloat(market.liquidity),
      });
    }
  }
  
  return opportunities.sort((a, b) => b.edge - a.edge);
}

function formatOutput(arbs: ArbOpportunity[]) {
  console.log('='.repeat(100));
  console.log('💰 POLYMARKET ARBITRAGE SCANNER');
  console.log('='.repeat(100));
  console.log(`Found ${arbs.length} opportunities with YES + NO < $1.00\n`);
  
  if (arbs.length === 0) {
    console.log('No arbitrage opportunities currently available.');
    console.log('Markets are efficiently priced.');
    return;
  }
  
  // Header
  console.log(
    'Edge'.padEnd(8),
    'YES'.padEnd(8),
    'NO'.padEnd(8),
    'Sum'.padEnd(8),
    'Profit'.padEnd(10),
    'Liquidity'.padEnd(12),
    'Market'
  );
  console.log('-'.repeat(100));
  
  for (const arb of arbs.slice(0, 20)) {
    const edgeStr = `${(arb.edge * 100).toFixed(2)}%`;
    const profitStr = `$${arb.profitPer100.toFixed(2)}`;
    const liqStr = `$${(arb.liquidity / 1000).toFixed(1)}k`;
    
    // Color coding (using ANSI codes)
    const edgeColor = arb.edge > 0.02 ? '\x1b[32m' : // Green
                     arb.edge > 0.01 ? '\x1b[33m' : // Yellow
                     '\x1b[37m'; // White
    const reset = '\x1b[0m';
    
    console.log(
      `${edgeColor}${edgeStr.padEnd(8)}${reset}`,
      arb.yesPrice.toFixed(3).padEnd(8),
      arb.noPrice.toFixed(3).padEnd(8),
      arb.sum.toFixed(3).padEnd(8),
      profitStr.padEnd(10),
      liqStr.padEnd(12),
      arb.question.substring(0, 35) + (arb.question.length > 35 ? '...' : '')
    );
  }
  
  console.log('\n' + '='.repeat(100));
  console.log('💡 How to execute:');
  console.log('   Buy both YES and NO tokens for the same amount');
  console.log('   At resolution, one will be worth $1.00, the other $0');
  console.log('   Profit = $1.00 - (YES_price + NO_price)');
  console.log('='.repeat(100));
}

async function main() {
  const markets = await fetchMarkets();
  const arbs = findArbitrage(markets);
  formatOutput(arbs);
}

main().catch(console.error);
