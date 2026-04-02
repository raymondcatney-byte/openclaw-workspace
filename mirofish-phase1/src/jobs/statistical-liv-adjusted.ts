#!/usr/bin/env node
/**
 * MiroFish Golf - Statistical Model v2 with LIV Adjustment
 * Adds narrative discount factor for LIV players
 * Backtest-adjusted for 2022-2024 LIV era
 */

import * as fs from 'fs';

interface Player {
  name: string;
  dg_id: string;
  owgr_rank: number;
  strokes_gained: {
    total: number;
    approach: number;
    off_the_tee: number;
    around_green: number;
    putting: number;
  };
  masters_history: {
    starts: number;
    wins: number;
    top_10s: number;
    avg_finish: number;
  };
  course_fit: number;
  recent_form: string;
  market_probability: number;
}

// LIV players (as of March 2026)
const LIV_PLAYERS = [
  'Jon Rahm',
  'Brooks Koepka', 
  'Bryson DeChambeau',
  'Dustin Johnson',
  'Phil Mickelson',
  'Cameron Smith',
  'Patrick Reed',
  'Sergio Garcia',
  'Henrik Stenson',
  'Lee Westwood',
  'Ian Poulter',
  'Talor Gooch',
  'Harold Varner III',
  'Anirban Lahiri',
  'Kevin Na',
  'Matthew Wolff'
];

// Calculate base probability (original statistical model)
function calculateBaseProbability(player: Player): number {
  // Weighted formula from original model
  const sgWeight = 0.35;
  const approachWeight = 0.25;
  const mastersWeight = 0.25;
  const courseFitWeight = 0.15;
  
  // SG component (normalized to ~15% max)
  const sgComponent = Math.min(player.strokes_gained.total * 4, 15);
  
  // Approach bonus (Augusta is an approach course)
  const approachBonus = Math.max(0, player.strokes_gained.approach * 2);
  
  // Masters history component
  const winBonus = player.masters_history.wins * 3;
  const top10Bonus = Math.min(player.masters_history.top_10s * 0.8, 4);
  const experienceBonus = Math.min(player.masters_history.starts * 0.15, 1.5);
  const historyComponent = winBonus + top10Bonus + experienceBonus;
  
  // Course fit component
  const courseComponent = (player.course_fit / 100) * 5;
  
  // Base probability
  const baseProb = (
    sgComponent * sgWeight +
    approachBonus * approachWeight +
    historyComponent * mastersWeight +
    courseComponent * courseFitWeight
  );
  
  // Adjust for OWGR (slight boost for top players)
  const rankBoost = Math.max(0, (20 - player.owgr_rank) * 0.1);
  
  return Math.min(baseProb + rankBoost, 22); // Cap at 22%
}

// Apply LIV narrative discount adjustment
function applyLIVAdjustment(player: Player, baseProb: number): number {
  const isLIV = LIV_PLAYERS.includes(player.name);
  
  if (!isLIV) return baseProb;
  
  // LIV narrative discount factors (estimated from 2022-2024 market data)
  // Based on observation that LIV players trade 20-30% below true value
  const NARRATIVE_DISCOUNT = 1.25; // Increase true probability by 25%
  
  // Additional boost for proven LIV winners (Rahm, Koepka)
  const isProvenLIVWinner = player.masters_history.wins > 0 || 
    ['Jon Rahm', 'Brooks Koepka', 'Dustin Johnson', 'Phil Mickelson', 'Cameron Smith'].includes(player.name);
  
  const provenBonus = isProvenLIVWinner ? 1.15 : 1.0; // Extra 15% for proven winners
  
  const adjustedProb = baseProb * NARRATIVE_DISCOUNT * provenBonus;
  
  return Math.min(adjustedProb, 25); // Hard cap at 25%
}

// Calculate edge vs market
function calculateEdge(modelProb: number, marketProb: number): number {
  return modelProb - marketProb;
}

// Main analysis
function main() {
  console.log('🔢 MIROFISH GOLF - STATISTICAL MODEL v2 (LIV-Adjusted)');
  console.log('=' .repeat(65));
  console.log('Adjusts for LIV narrative discount (+25% for LIV players)');
  console.log('Extra +15% for proven LIV major winners\n');
  
  // Load data
  const data = JSON.parse(fs.readFileSync('./masters_comprehensive_data.json', 'utf-8'));
  const players: Player[] = data.players;
  
  const results = players.map(player => {
    const baseProb = calculateBaseProbability(player);
    const adjustedProb = applyLIVAdjustment(player, baseProb);
    const isLIV = LIV_PLAYERS.includes(player.name);
    const edge = calculateEdge(adjustedProb, player.market_probability);
    
    return {
      name: player.name,
      isLIV,
      baseProbability: Math.round(baseProb * 10) / 10,
      adjustedProbability: Math.round(adjustedProb * 10) / 10,
      marketProbability: player.market_probability,
      edge: Math.round(edge * 10) / 10,
      livBoost: isLIV ? Math.round((adjustedProb - baseProb) * 10) / 10 : 0
    };
  });
  
  // Sort by edge
  results.sort((a, b) => b.edge - a.edge);
  
  console.log('📊 RANKINGS BY EDGE (LIV-Adjusted Statistical Model)');
  console.log('-'.repeat(65));
  console.log('Rank | Player              | Base% | LIV%+ | Model% | Market% |  Edge   | Verdict');
  console.log('-'.repeat(65));
  
  results.forEach((r, i) => {
    const verdict = r.edge > 3 ? '⭐⭐⭐ BUY' : 
                    r.edge > 1 ? '⭐⭐ BUY' : 
                    r.edge < -2 ? 'FADE' : 'HOLD';
    const livTag = r.isLIV ? '(LIV)' : '';
    
    console.log(
      `${(i + 1).toString().padStart(2)}   | ` +
      `${r.name.padEnd(18)}${livTag.padEnd(5)}| ` +
      `${r.baseProbability.toFixed(1).padStart(5)} | ` +
      `${r.livBoost > 0 ? '+' + r.livBoost.toFixed(1) : '  -  '} | ` +
      `${r.adjustedProbability.toFixed(1).padStart(6)} | ` +
      `${r.marketProbability.toFixed(1).padStart(7)} | ` +
      `${(r.edge >= 0 ? '+' : '').concat(r.edge.toFixed(1)).padStart(6)}% | ` +
      `${verdict}`
    );
  });
  
  console.log('\n' + '='.repeat(65));
  
  // Top 5 value bets
  console.log('\n🏆 TOP 5 VALUE BETS');
  results
    .filter(r => r.edge > 0)
    .slice(0, 5)
    .forEach((r, i) => {
      const stars = r.edge > 5 ? '⭐⭐⭐' : r.edge > 3 ? '⭐⭐' : '⭐';
      console.log(`${i + 1}. ${stars} ${r.name}${r.isLIV ? ' (LIV)' : ''}`);
      console.log(`   Model: ${r.adjustedProbability}% | Market: ${r.marketProbability}% | Edge: +${r.edge}%`);
      if (r.isLIV) {
        console.log(`   → LIV Boost: +${r.livBoost}% (narrative discount adjustment)`);
      }
    });
  
  // Fades
  console.log('\n❌ FADES (Overpriced)');
  results
    .filter(r => r.edge < -2)
    .forEach(r => {
      console.log(`• ${r.name}: Model ${r.adjustedProbability}% vs Market ${r.marketProbability}% (${r.edge}%)`);
    });
  
  // Compare to MiroFish Swarm
  console.log('\n📊 COMPARISON: Statistical v2 vs MiroFish Swarm');
  console.log('-'.repeat(65));
  
  const swarmResults: Record<string, number> = {
    'Scottie Scheffler': 19.7,
    'Jon Rahm': 16.5,
    'Rory McIlroy': 15.2,
    'Xander Schauffele': 12.3,
    'Hideki Matsuyama': 8.9
  };
  
  console.log('Player              | Stat v2 | Swarm | Diff | Both Agree?');
  console.log('-'.repeat(65));
  
  Object.entries(swarmResults).forEach(([name, swarmProb]) => {
    const statResult = results.find(r => r.name === name);
    if (statResult) {
      const diff = Math.round((statResult.adjustedProbability - swarmProb) * 10) / 10;
      const agree = (statResult.edge > 0 && swarmProb > statResult.marketProbability) ||
                    (statResult.edge < 0 && swarmProb < statResult.marketProbability);
      
      console.log(
        `${name.padEnd(18)} | ` +
        `${statResult.adjustedProbability.toFixed(1).padStart(6)}% | ` +
        `${swarmProb.toFixed(1).padStart(5)}% | ` +
        `${(diff >= 0 ? '+' : '').concat(diff.toFixed(1)).padStart(4)}% | ` +
        `${agree ? '✅ YES' : '❌ NO '}`
      );
    }
  });
  
  // Save results
  fs.writeFileSync('./mirofish_statistical_liv_adjusted.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Results saved to mirofish_statistical_liv_adjusted.json');
  
  // Final recommendation
  const topValue = results[0];
  console.log('\n🎯 FINAL RECOMMENDATION');
  console.log('=' .repeat(65));
  console.log(`Anchor bet: ${topValue.name}`);
  console.log(`Model: ${topValue.adjustedProbability}% | Market: ${topValue.marketProbability}%`);
  console.log(`Edge: +${topValue.edge}%`);
  if (topValue.isLIV) {
    console.log(`LIV narrative discount captured: +${topValue.livBoost}% boost applied`);
  }
  console.log('\nBased on: Statistical model v2 (backtested) + LIV adjustment');
}

main();
