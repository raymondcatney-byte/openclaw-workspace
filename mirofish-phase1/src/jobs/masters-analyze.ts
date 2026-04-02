import { getGolfPersonas } from '../agents/golf-personas.js';
import { AgentOpinion, Consensus } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';

interface MastersPlayer {
  name: string;
  dg_id: string;
  owgr_rank: number;
  dg_rank: number;
  dg_rating: number;
  strokes_gained: {
    total: number;
    off_the_tee: number;
    approach: number;
    around_green: number;
    putting: number;
  };
  masters_history: {
    starts: number;
    wins: number;
    top_5s: number;
    top_10s: number;
    made_cuts: number;
    best_finish: string;
    avg_finish: number;
  };
  recent_form: Array<{
    tournament: string;
    finish: string;
    score: number | null;
  }>;
  course_fit_score: number;
  notes: string;
}

interface MastersField {
  tournament: string;
  year: number;
  players: MastersPlayer[];
  course_info: {
    name: string;
    par: number;
    yardage: number;
  };
}

interface PlayerAnalysis {
  name: string;
  dg_rank: number;
  implied_probability: number;
  model_probability: number;
  edge: number;
  recommendation: 'BET' | 'FADE' | 'SKIP';
  confidence: number;
  key_factors: string[];
  concerns: string[];
}

// Load Masters field data
function loadMastersField(): MastersField {
  const filePath = path.join(process.cwd(), 'masters_field_2026.json');
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data);
}

// Calculate model win probability based on multiple factors
function calculateWinProbability(player: MastersPlayer): number {
  let probability = 0;
  
  // Base from DG rating (most important)
  // +2.0 SG = ~20% baseline, +1.0 = ~8%, +0.5 = ~3%
  const sgBase = Math.max(0, (player.dg_rating - 0.3) * 8);
  probability += sgBase * 0.35;
  
  // Augusta experience bonus
  const experienceFactor = Math.min(player.masters_history.starts / 10, 1);
  const top10Rate = player.masters_history.top_10s / Math.max(player.masters_history.starts, 1);
  probability += (experienceFactor * top10Rate * 5);
  
  // Recent form factor
  const recentTop10s = player.recent_form.filter(r => 
    r.finish.includes('T') && parseInt(r.finish.replace('T', '')) <= 10
  ).length;
  probability += recentTop10s * 1.5;
  
  // Course fit
  probability += (player.course_fit_score - 75) * 0.1;
  
  // Masters history bonus for previous wins
  if (player.masters_history.wins > 0) {
    probability += 3;
  }
  
  // Penalty for first-timers
  if (player.masters_history.starts === 0) {
    probability *= 0.3;
  } else if (player.masters_history.starts === 1) {
    probability *= 0.6;
  }
  
  // Normalize to reasonable range (0.5% to 25%)
  return Math.max(0.5, Math.min(25, probability));
}

// Analyze a player against agent criteria
function analyzePlayer(player: MastersPlayer): PlayerAnalysis {
  const modelProb = calculateWinProbability(player);
  
  // You would get this from Polymarket
  // For now, using estimated market probabilities based on rankings
  const estimatedMarketProb = Math.max(1, 26 - player.dg_rank) * 0.8;
  const impliedProb = Math.min(25, estimatedMarketProb);
  
  const edge = modelProb - impliedProb;
  
  let recommendation: 'BET' | 'FADE' | 'SKIP';
  if (edge > 3) {
    recommendation = 'BET';
  } else if (edge < -2) {
    recommendation = 'FADE';
  } else {
    recommendation = 'SKIP';
  }
  
  // Generate key factors
  const keyFactors: string[] = [];
  const concerns: string[] = [];
  
  if (player.dg_rating > 1.8) {
    keyFactors.push(`Elite SG: Total (+${player.dg_rating.toFixed(2)})`);
  }
  if (player.strokes_gained.approach > 0.8) {
    keyFactors.push(`Elite iron play (SG:APP +${player.strokes_gained.approach.toFixed(2)})`);
  }
  if (player.masters_history.wins > 0) {
    keyFactors.push(`${player.masters_history.wins}x Masters champion`);
  }
  if (player.masters_history.top_10s >= 3) {
    keyFactors.push(`${player.masters_history.top_10s} career Masters top-10s`);
  }
  if (player.course_fit_score > 85) {
    keyFactors.push(`Excellent Augusta fit (${player.course_fit_score}/100)`);
  }
  
  // Recent form
  const recentWins = player.recent_form.filter(r => r.finish === '1st').length;
  if (recentWins > 0) {
    keyFactors.push(`Won ${recentWins} tournament(s) recently`);
  }
  
  // Concerns
  if (player.masters_history.starts === 0) {
    concerns.push('First Masters appearance - steep learning curve');
  } else if (player.masters_history.starts < 3) {
    concerns.push('Limited Augusta experience');
  }
  if (player.strokes_gained.putting < 0) {
    concerns.push(`Below-average putting (SG:PUTT ${player.strokes_gained.putting.toFixed(2)})`);
  }
  if (player.strokes_gained.approach < 0.3) {
    concerns.push('Weak iron play for Augusta demands');
  }
  if (player.recent_form.some(r => r.finish === 'MC')) {
    concerns.push('Recent missed cut');
  }
  
  return {
    name: player.name,
    dg_rank: player.dg_rank,
    implied_probability: impliedProb,
    model_probability: modelProb,
    edge,
    recommendation,
    confidence: Math.min(95, Math.abs(edge) * 10 + 50),
    key_factors: keyFactors,
    concerns,
  };
}

// Run analysis
function runMastersAnalysis() {
  console.log('🔮 MIROFISH GOLF: 2026 MASTERS ANALYSIS');
  console.log('========================================\n');
  
  const field = loadMastersField();
  console.log(`Analyzing ${field.players.length} players...\n`);
  
  const analyses = field.players.map(analyzePlayer);
  
  // Sort by edge (descending)
  analyses.sort((a, b) => b.edge - a.edge);
  
  // Display results
  console.log('📊 RECOMMENDATIONS\n');
  
  const bets = analyses.filter(a => a.recommendation === 'BET');
  const fades = analyses.filter(a => a.recommendation === 'FADE');
  
  if (bets.length > 0) {
    console.log('✅ BET (Model > Market):');
    console.log('-'.repeat(80));
    bets.forEach(a => {
      console.log(`\n${a.name} (World #${a.dg_rank})`);
      console.log(`  Model: ${a.model_probability.toFixed(1)}% | Market: ~${a.implied_probability.toFixed(1)}% | Edge: +${a.edge.toFixed(1)}%`);
      console.log(`  Confidence: ${a.confidence}%`);
      console.log(`  Key factors:`);
      a.key_factors.forEach(f => console.log(`    • ${f}`));
      if (a.concerns.length > 0) {
        console.log(`  Concerns:`);
        a.concerns.forEach(c => console.log(`    ⚠️  ${c}`));
      }
    });
  }
  
  if (fades.length > 0) {
    console.log('\n\n❌ FADE (Model < Market):');
    console.log('-'.repeat(80));
    fades.slice(0, 5).forEach(a => {
      console.log(`\n${a.name} (World #${a.dg_rank})`);
      console.log(`  Model: ${a.model_probability.toFixed(1)}% | Market: ~${a.implied_probability.toFixed(1)}% | Edge: ${a.edge.toFixed(1)}%`);
      console.log(`  Concerns:`);
      a.concerns.forEach(c => console.log(`    ⚠️  ${c}`));
    });
  }
  
  console.log('\n\n📈 TOP 10 BY MODEL PROBABILITY');
  console.log('-'.repeat(80));
  analyses
    .sort((a, b) => b.model_probability - a.model_probability)
    .slice(0, 10)
    .forEach((a, i) => {
      const rec = a.recommendation === 'BET' ? '✅' : a.recommendation === 'FADE' ? '❌' : '➖';
      console.log(`${i + 1}. ${rec} ${a.name}: ${a.model_probability.toFixed(1)}%`);
    });
  
  console.log('\n\n💡 PORTFOLIO SUGGESTION');
  console.log('-'.repeat(80));
  const suggestedBets = bets.slice(0, 5);
  const totalProb = suggestedBets.reduce((sum, a) => sum + a.model_probability, 0);
  console.log(`Suggested allocation across ${suggestedBets.length} players:`);
  suggestedBets.forEach(a => {
    const allocation = (a.model_probability / totalProb * 100).toFixed(0);
    console.log(`  ${a.name}: ${allocation}% of bankroll`);
  });
  
  console.log('\n\n⚠️  IMPORTANT NOTES');
  console.log('-'.repeat(80));
  console.log('• Market probabilities are ESTIMATED - check actual Polymarket prices');
  console.log('• Update analysis when Thursday tee times are released');
  console.log('• Weather forecast can affect outcomes significantly');
  console.log('• Never bet more than you can afford to lose');
  console.log(`\nData last updated: ${new Date().toISOString().split('T')[0]}`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMastersAnalysis();
}

export { runMastersAnalysis, analyzePlayer, calculateWinProbability };
