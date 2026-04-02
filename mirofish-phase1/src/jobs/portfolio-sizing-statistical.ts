#!/usr/bin/env node
/**
 * MiroFish Golf - Portfolio Sizing (Original Statistical Model)
 * Based on 80% backtest hit rate (2015-2024)
 * Kelly Criterion-inspired sizing with edge weighting
 */

import * as fs from 'fs';

interface Player {
  name: string;
  model_probability: number;
  market_probability: number;
  edge: number;
  recommendation: string;
  masters_history: {
    starts: number;
    wins: number;
    top_10s: number;
  };
}

// Kelly Criterion calculation
// f* = (bp - q) / b
// where: b = odds - 1, p = model probability, q = 1 - p
// Simplified for this context: position size proportional to edge
function calculateKellyPosition(edge: number, modelProb: number, marketProb: number): number {
  // Convert market probability to decimal odds
  const decimalOdds = 100 / marketProb;
  const b = decimalOdds - 1; // net odds
  const p = modelProb / 100; // model probability
  const q = 1 - p; // probability of losing
  
  // Kelly fraction
  const kelly = (b * p - q) / b;
  
  // Apply fractional Kelly (1/4 Kelly for safety given golf variance)
  const fractionalKelly = kelly * 0.25;
  
  // Cap at reasonable max
  return Math.min(Math.max(fractionalKelly, 0), 0.35);
}

// Main portfolio construction
function main() {
  console.log('💰 MIROFISH GOLF - PORTFOLIO SIZING');
  console.log('=' .repeat(70));
  console.log('Model: Statistical (80% backtest hit rate, 2015-2024)');
  console.log('Sizing: Fractional Kelly (1/4) with edge weighting');
  console.log('');
  
  // Load data
  const data = JSON.parse(fs.readFileSync('./masters_comprehensive_data.json', 'utf-8'));
  const players: Player[] = data.players;
  
  // Filter to BUY recommendations only
  const buyPlayers = players
    .filter(p => p.edge > 0 && (p.recommendation === 'BUY' || p.recommendation === 'STRONG BUY'))
    .sort((a, b) => b.edge - a.edge);
  
  console.log('🎯 ELIGIBLE BETS (Edge > 0)');
  console.log('-'.repeat(70));
  console.log('Rank | Player              | Model% | Market% | Edge   | Kelly%');
  console.log('-'.repeat(70));
  
  let totalRawKelly = 0;
  const positions: { 
    name: string; 
    model: number; 
    market: number; 
    edge: number; 
    kelly: number;
    history: string;
  }[] = [];
  
  buyPlayers.forEach((p, i) => {
    const kelly = calculateKellyPosition(p.edge, p.model_probability, p.market_probability);
    totalRawKelly += kelly;
    
    positions.push({
      name: p.name,
      model: p.model_probability,
      market: p.market_probability,
      edge: p.edge,
      kelly: kelly,
      history: `${p.masters_history.wins}W/${p.masters_history.top_10s}T10`
    });
    
    const stars = p.edge > 5 ? '⭐⭐⭐' : p.edge > 3 ? '⭐⭐' : '⭐';
    console.log(
      ` ${i + 1}   | ` +
      `${p.name.padEnd(18)} | ` +
      `${p.model_probability.toFixed(1).padStart(6)} | ` +
      `${p.market_probability.toFixed(1).padStart(7)} | ` +
      `+${p.edge.toFixed(1).padStart(4)}% | ` +
      `${(kelly * 100).toFixed(1).padStart(5)}% ${stars}`
    );
  });
  
  console.log('');
  console.log('=' .repeat(70));
  
  // Normalize to 100% portfolio
  const normalizedPositions = positions.map(p => ({
    ...p,
    allocation: (p.kelly / totalRawKelly) * 100
  }));
  
  // Round to clean numbers and ensure sum = 100
  let runningTotal = 0;
  const finalAllocations = normalizedPositions.map((p, i, arr) => {
    if (i === arr.length - 1) {
      // Last one gets remainder to ensure 100%
      return { ...p, finalAllocation: Math.round(100 - runningTotal) };
    }
    const rounded = Math.round(p.allocation);
    runningTotal += rounded;
    return { ...p, finalAllocation: rounded };
  });
  
  console.log('📊 RECOMMENDED PORTFOLIO ALLOCATION');
  console.log('=' .repeat(70));
  console.log('Player              | Model | Market | Edge  | Alloc | Masters History');
  console.log('-'.repeat(70));
  
  let totalAllocation = 0;
  finalAllocations.forEach(p => {
    totalAllocation += p.finalAllocation;
    console.log(
      `${p.name.padEnd(18)} | ` +
      `${p.model.toFixed(1).padStart(5)} | ` +
      `${p.market.toFixed(1).padStart(6)} | ` +
      `+${p.edge.toFixed(1)}% | ` +
      `${p.finalAllocation.toString().padStart(4)}% | ` +
      `${p.history}`
    );
  });
  
  console.log('-'.repeat(70));
  console.log(`TOTAL PORTFOLIO: ${totalAllocation}%`);
  console.log('');
  
  // Portfolio summary
  console.log('🎯 PORTFOLIO STRATEGY');
  console.log('=' .repeat(70));
  
  const anchor = finalAllocations[0];
  const secondary = finalAllocations.slice(1, 3);
  const longshots = finalAllocations.slice(3);
  
  console.log(`ANCHOR BET (${anchor.finalAllocation}%): ${anchor.name}`);
  console.log(`  • Highest edge (+${anchor.edge}%), proven winner (2021)`);
  console.log(`  • 13 Masters starts, 6 top-10s (46% rate)`);
  console.log(`  • Market sleeping on him at ${anchor.market}%`);
  console.log('');
  
  if (secondary.length > 0) {
    console.log(`SECONDARY BETS (${secondary.reduce((s, p) => s + p.finalAllocation, 0)}%):`);
    secondary.forEach(p => {
      console.log(`  • ${p.name} (${p.finalAllocation}%) - +${p.edge}% edge, ${p.history}`);
    });
    console.log('');
  }
  
  if (longshots.length > 0) {
    console.log(`LONGSHOTS (${longshots.reduce((s, p) => s + p.finalAllocation, 0)}%):`);
    longshots.forEach(p => {
      console.log(`  • ${p.name} (${p.finalAllocation}%) - +${p.edge}% edge`);
    });
    console.log('');
  }
  
  // Expected value
  const portfolioModelProb = finalAllocations.reduce((sum, p) => 
    sum + (p.model / 100) * (p.finalAllocation / 100), 0);
  const portfolioMarketProb = finalAllocations.reduce((sum, p) => 
    sum + (p.market / 100) * (p.finalAllocation / 100), 0);
  
  console.log('📈 PORTFOLIO EXPECTED VALUE');
  console.log('=' .repeat(70));
  console.log(`Combined model probability: ${(portfolioModelProb * 100).toFixed(1)}%`);
  console.log(`Combined market probability: ${(portfolioMarketProb * 100).toFixed(1)}%`);
  console.log(`Portfolio edge: +${((portfolioModelProb - portfolioMarketProb) * 100).toFixed(1)}%`);
  console.log('');
  
  // Risk notes
  console.log('⚠️  RISK FACTORS');
  console.log('=' .repeat(70));
  console.log('• Spieth: Recent MC at PLAYERS, driver issues');
  console.log('• Zalatoris: Only 3 Masters starts, limited experience');
  console.log('• Koepka: Can be hot/cold, LIV competition level concerns');
  console.log('• Rahm: LIV narrative may persist longer than expected');
  console.log('');
  
  // Kelly guidance
  console.log('💡 KELLY CRITERION GUIDANCE');
  console.log('=' .repeat(70));
  console.log('Full Kelly suggests aggressive sizing (can lead to high variance)');
  console.log('Fractional Kelly (1/4) used here for safety');
  console.log('');
  console.log('If betting $1,000 total:');
  finalAllocations.forEach(p => {
    const amount = Math.round(1000 * (p.finalAllocation / 100));
    console.log(`  • ${p.name}: $${amount} (${p.finalAllocation}%)`);
  });
  console.log('');
  
  // Save portfolio
  const portfolio = {
    model: 'Statistical (80% backtest)',
    sizing: '1/4 Kelly Criterion',
    totalAllocation: totalAllocation,
    positions: finalAllocations.map(p => ({
      name: p.name,
      allocation: p.finalAllocation,
      modelProbability: p.model,
      marketProbability: p.market,
      edge: p.edge,
      mastersHistory: p.history
    })),
    portfolioModelProb: portfolioModelProb * 100,
    portfolioMarketProb: portfolioMarketProb * 100,
    portfolioEdge: (portfolioModelProb - portfolioMarketProb) * 100
  };
  
  fs.writeFileSync('./mirofish_portfolio_statistical.json', JSON.stringify(portfolio, null, 2));
  console.log('💾 Portfolio saved to mirofish_portfolio_statistical.json');
}

main();
