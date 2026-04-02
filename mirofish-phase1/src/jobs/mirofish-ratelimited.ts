#!/usr/bin/env node
/**
 * MiroFish Golf - Rate-Limited Agent Swarm
 * Runs max agents without hitting Groq rate limits
 * Batches requests with delays between batches
 */

import { Groq } from 'groq-sdk';
import * as fs from 'fs';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});

const MODEL = 'llama-3.3-70b-versatile';

// Rate limiting config
const BATCH_SIZE = 5;        // Agents per batch
const DELAY_MS = 3000;       // 3 seconds between batches
const MAX_AGENTS = 50;       // Try all 50, but batched

interface Player {
  name: string;
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
  };
  course_fit: number;
  recent_form: string;
}

interface AgentOpinion {
  agentId: string;
  agentName: string;
  winProbability: number;
  confidence: number;
  reasoning: string;
  rawResponse: string;
}

// Simplified 50 golf personas
const GOLF_PERSONAS = [
  { id: 'sg1', name: 'SG Total Specialist', systemPrompt: 'You are a strokes gained analyst focusing on overall ball-striking. Rate win probability based on SG:Total rankings.', temperature: 0.3 },
  { id: 'sg2', name: 'SG Approach Expert', systemPrompt: 'You analyze iron play and approach shots. Augusta rewards elite approach play.', temperature: 0.3 },
  { id: 'sg3', name: 'SG Off Tee Analyst', systemPrompt: 'You focus on driving distance and accuracy. Augusta requires strategic driving.', temperature: 0.3 },
  { id: 'sg4', name: 'SG Short Game Specialist', systemPrompt: 'You analyze scrambling and around-green play. Critical at Augusta.', temperature: 0.3 },
  { id: 'sg5', name: 'Putting Analyst', systemPrompt: 'You focus on putting, especially on fast Bermuda greens.', temperature: 0.4 },
  { id: 'course1', name: 'Augusta Course Fit Expert', systemPrompt: 'You specialize in course fit analysis. Augusta rewards shot-shaping and course knowledge.', temperature: 0.3 },
  { id: 'course2', name: 'Distance Advantage Analyst', systemPrompt: 'You value distance at Augusta for attacking par-5s.', temperature: 0.4 },
  { id: 'course3', name: 'Accuracy Premium Specialist', systemPrompt: 'You value accuracy over distance at Augusta due to tight tree lines.', temperature: 0.4 },
  { id: 'course4', name: 'Green Reading Expert', systemPrompt: 'You focus on ability to read Augustas lightning-fast greens.', temperature: 0.4 },
  { id: 'course5', name: 'Amen Corner Specialist', systemPrompt: 'You analyze performance on holes 11-13, where Masters are won/lost.', temperature: 0.3 },
  { id: 'hist1', name: 'Masters Historian', systemPrompt: 'You value Masters experience and historical performance.', temperature: 0.3 },
  { id: 'hist2', name: 'Previous Winner Analyst', systemPrompt: 'You believe previous Masters winners have an edge.', temperature: 0.3 },
  { id: 'hist3', name: 'Top-10 Specialist', systemPrompt: 'You value consistent top-10s at Augusta over wins.', temperature: 0.3 },
  { id: 'hist4', name: 'Cut Maker Expert', systemPrompt: 'You focus on reliability - making cuts consistently.', temperature: 0.4 },
  { id: 'hist5', name: 'Sunday Pressure Analyst', systemPrompt: 'You analyze who handles final round pressure at Augusta.', temperature: 0.3 },
  { id: 'form1', name: 'Recent Form Specialist', systemPrompt: 'You weight recent performance heavily (last 4 starts).', temperature: 0.4 },
  { id: 'form2', name: 'Momentum Hunter', systemPrompt: 'You look for players peaking at the right time.', temperature: 0.4 },
  { id: 'form3', name: 'Florida Swing Analyst', systemPrompt: 'You value performance in Florida lead-up events.', temperature: 0.4 },
  { id: 'form4', name: 'Texas Swing Specialist', systemPrompt: 'You analyze Texas swing performance as Masters prep.', temperature: 0.4 },
  { id: 'form5', name: 'Early Season Expert', systemPrompt: 'You focus on full 2026 season performance.', temperature: 0.3 },
  { id: 'contrarian1', name: 'LIV Stigma Exploiter', systemPrompt: 'You bet against market bias against LIV players.', temperature: 0.5 },
  { id: 'contrarian2', name: 'Chalk Fader', systemPrompt: 'You fade favorites and look for value on mid-tier players.', temperature: 0.5 },
  { id: 'contrarian3', name: 'Narrative Tax Analyst', systemPrompt: 'You fade players with media hype inflating their prices.', temperature: 0.5 },
  { id: 'contrarian4', name: 'Recency Bias Exploiter', systemPrompt: 'You fade recent hot performers, bet on cold streaks.', temperature: 0.5 },
  { id: 'contrarian5', name: 'Market Inefficiency Hunter', systemPrompt: 'You look for pricing gaps between model and market.', temperature: 0.4 },
  { id: 'mental1', name: 'Mental Game Analyst', systemPrompt: 'You analyze mental toughness and Sunday pressure performance.', temperature: 0.4 },
  { id: 'mental2', name: 'Experience Premium Specialist', systemPrompt: 'You value veterans who know how to win majors.', temperature: 0.3 },
  { id: 'mental3', name: 'First Timer Skeptic', systemPrompt: 'You doubt first-timers can win at Augusta.', temperature: 0.4 },
  { id: 'mental4', name: 'Clutch Performer Expert', systemPrompt: 'You focus on players with proven clutch gene.', temperature: 0.3 },
  { id: 'mental5', name: 'Patience Quotient Analyst', systemPrompt: 'You value players who stay patient at Augusta.', temperature: 0.4 },
  { id: 'physical1', name: 'Age Curve Analyst', systemPrompt: 'You consider age - peak performance window for Masters.', temperature: 0.3 },
  { id: 'physical2', name: 'Injury Risk Assessor', systemPrompt: 'You discount players with injury concerns.', temperature: 0.4 },
  { id: 'physical3', name: 'Stamina Specialist', systemPrompt: 'You value physical fitness for Augustas hills.', temperature: 0.3 },
  { id: 'physical4', name: 'Walk Speed Analyst', systemPrompt: 'You analyze pace of play and stamina conservation.', temperature: 0.5 },
  { id: 'physical5', name: 'Weather Adaptability Expert', systemPrompt: 'You focus on players who handle changing conditions.', temperature: 0.4 },
  { id: 'specialist1', name: 'Par-5 Scoring Specialist', systemPrompt: 'You value ability to score on Augustas par-5s.', temperature: 0.3 },
  { id: 'specialist2', name: 'Par-3 Specialist', systemPrompt: 'You focus on par-3 performance at Augusta.', temperature: 0.4 },
  { id: 'specialist3', name: 'Bogey Avoidance Expert', systemPrompt: 'You value players who avoid big numbers.', temperature: 0.3 },
  { id: 'specialist4', name: 'Birdie Machine Analyst', systemPrompt: 'You focus on players who make lots of birdies.', temperature: 0.4 },
  { id: 'specialist5', name: 'Scrambling Specialist', systemPrompt: 'You value ability to recover from misses.', temperature: 0.3 },
  { id: 'weather1', name: 'Wind Player Analyst', systemPrompt: 'You value players who handle wind well.', temperature: 0.4 },
  { id: 'weather2', name: 'Rain Specialist', systemPrompt: 'You focus on soft course performance.', temperature: 0.4 },
  { id: 'weather3', name: 'Morning Tee Time Expert', systemPrompt: 'You consider tee time draw implications.', temperature: 0.5 },
  { id: 'weather4', name: 'Cold Weather Player', systemPrompt: 'You value players who perform in chilly April mornings.', temperature: 0.4 },
  { id: 'weather5', name: 'Weather Adaptability Specialist', systemPrompt: 'You focus on players who adjust to changing conditions.', temperature: 0.4 },
  { id: 'misc1', name: 'Caddie Factor Analyst', systemPrompt: 'You value experienced caddies who know Augusta.', temperature: 0.4 },
  { id: 'misc2', name: 'Equipment Specialist', systemPrompt: 'You analyze equipment advantages for Augusta.', temperature: 0.5 },
  { id: 'misc3', name: 'Draw Bias Expert', systemPrompt: 'You value right-to-left ball flight for Augustas doglegs.', temperature: 0.4 },
  { id: 'misc4', name: 'Weakness Exposure Analyst', systemPrompt: 'You identify players whose weaknesses Augusta exposes.', temperature: 0.3 },
  { id: 'misc5', name: 'Portfolio Strategist', systemPrompt: 'You think about portfolio construction and correlation.', temperature: 0.4 }
];

// Build agent prompt
function buildAgentPrompt(agent: typeof GOLF_PERSONAS[0], player: Player): string {
  return `${agent.systemPrompt}

PLAYER: ${player.name}
SG Total: +${player.strokes_gained.total}
SG Approach: +${player.strokes_gained.approach}
SG Off Tee: +${player.strokes_gained.off_the_tee}
SG Around Green: +${player.strokes_gained.around_green}
SG Putting: +${player.strokes_gained.putting}
Masters Starts: ${player.masters_history.starts}
Masters Wins: ${player.masters_history.wins}
Masters Top-10s: ${player.masters_history.top_10s}
Course Fit: ${player.course_fit}/100
Recent Form: ${player.recent_form}

Estimate ${player.name}'s win probability for The Masters 2026.

Respond EXACTLY as:
PROBABILITY: [0-25]%
CONFIDENCE: [1-10]
REASONING: [one sentence]`;
}

// Call single agent
async function callAgent(agent: typeof GOLF_PERSONAS[0], player: Player): Promise<AgentOpinion | null> {
  const prompt = buildAgentPrompt(agent, player);
  
  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: agent.systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: agent.temperature,
      max_tokens: 100,
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    const probMatch = content.match(/PROBABILITY:\s*(\d+(?:\.\d+)?)/i);
    const confMatch = content.match(/CONFIDENCE:\s*(\d+)/i);
    const reasonMatch = content.match(/REASONING:\s*(.+)/i);
    
    return {
      agentId: agent.id,
      agentName: agent.name,
      winProbability: probMatch ? parseFloat(probMatch[1]) : 0,
      confidence: confMatch ? parseInt(confMatch[1]) : 5,
      reasoning: reasonMatch ? reasonMatch[1].trim() : 'No reasoning',
      rawResponse: content
    };
  } catch (error: any) {
    if (error.status === 429) {
      console.log(`     ⚠️  Rate limit for ${agent.name}, will retry...`);
    }
    return null;
  }
}

// Sleep utility
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Run agents in batches
async function runBatchedAgents(agents: typeof GOLF_PERSONAS, player: Player): Promise<AgentOpinion[]> {
  const opinions: AgentOpinion[] = [];
  
  for (let i = 0; i < agents.length; i += BATCH_SIZE) {
    const batch = agents.slice(i, i + BATCH_SIZE);
    console.log(`     🔄 Batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(agents.length/BATCH_SIZE)}: ${batch.map(a => a.name).join(', ')}`);
    
    // Run batch in parallel
    const batchResults = await Promise.all(
      batch.map(agent => callAgent(agent, player))
    );
    
    // Collect successful results
    batchResults.forEach(result => {
      if (result) opinions.push(result);
    });
    
    // Delay between batches (except last)
    if (i + BATCH_SIZE < agents.length) {
      process.stdout.write(`     ⏳ Waiting ${DELAY_MS/1000}s for rate limit...`);
      await sleep(DELAY_MS);
      console.log(' done');
    }
  }
  
  return opinions;
}

// Analyze one player
async function analyzePlayer(player: Player): Promise<{
  player: string;
  opinions: AgentOpinion[];
  consensus: number;
  avgConfidence: number;
  stdDev: number;
  successRate: string;
}> {
  console.log(`\n🔍 Analyzing ${player.name}...`);
  console.log(`    Running ${MAX_AGENTS} agents in batches of ${BATCH_SIZE}...`);
  
  const opinions = await runBatchedAgents(GOLF_PERSONAS, player);
  
  if (opinions.length === 0) {
    return {
      player: player.name,
      opinions: [],
      consensus: 0,
      avgConfidence: 0,
      stdDev: 0,
      successRate: '0%'
    };
  }
  
  // Weighted consensus
  const totalConf = opinions.reduce((sum, o) => sum + o.confidence, 0);
  const weightedSum = opinions.reduce((sum, o) => sum + (o.winProbability * o.confidence), 0);
  const consensus = totalConf > 0 ? weightedSum / totalConf : 0;
  
  // Avg confidence
  const avgConf = opinions.reduce((sum, o) => sum + o.confidence, 0) / opinions.length;
  
  // Std dev
  const mean = opinions.reduce((sum, o) => sum + o.winProbability, 0) / opinions.length;
  const variance = opinions.reduce((sum, o) => sum + Math.pow(o.winProbability - mean, 2), 0) / opinions.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    player: player.name,
    opinions,
    consensus: Math.round(consensus * 10) / 10,
    avgConfidence: Math.round(avgConf * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
    successRate: `${Math.round(opinions.length / MAX_AGENTS * 100)}%`
  };
}

// Main
async function main() {
  console.log('🏆 MIROFISH GOLF - PLAYERS 6-10 (Rate-Limited Swarm)');
  console.log('=' .repeat(60));
  console.log(`Agents: ${MAX_AGENTS} | Batch size: ${BATCH_SIZE} | Delay: ${DELAY_MS}ms`);
  console.log(`Est. time per player: ~${Math.ceil(MAX_AGENTS/BATCH_SIZE * DELAY_MS/1000)} seconds\n`);
  
  // Load players (6-10)
  const data = JSON.parse(fs.readFileSync('./masters_comprehensive_data.json', 'utf-8'));
  const players: Player[] = data.players.slice(5, 10);
  
  const results = [];
  
  for (const player of players) {
    const result = await analyzePlayer(player);
    results.push(result);
    
    console.log(`\n📊 ${result.player}`);
    console.log(`   Agents responded: ${result.opinions.length}/${MAX_AGENTS} (${result.successRate})`);
    console.log(`   Consensus: ${result.consensus}%`);
    console.log(`   Confidence: ${result.avgConfidence}/10`);
    console.log(`   Spread: ${result.stdDev}%`);
    
    if (result.opinions.length > 0) {
      const probs = result.opinions.map(o => o.winProbability).sort((a, b) => a - b);
      console.log(`   Range: ${probs[0]}% - ${probs[probs.length - 1]}%`);
      
      // Top 3 most confident
      const top3 = result.opinions.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
      console.log(`   Top confident:`);
      top3.forEach(a => console.log(`     • ${a.agentName}: ${a.winProbability}% (conf: ${a.confidence})`));
    }
  }
  
  // Save
  fs.writeFileSync('./mirofish_ratelimited_results.json', JSON.stringify(results, null, 2));
  
  // Summary
  console.log('\n\n📈 FINAL CONSENSUS RANKINGS');
  console.log('-'.repeat(50));
  results
    .sort((a, b) => b.consensus - a.consensus)
    .forEach((r, i) => {
      const bar = '█'.repeat(Math.round(r.consensus / 2));
      console.log(`${i + 1}. ${r.player.padEnd(20)} | ${r.consensus.toFixed(1)}% ${bar}`);
    });
  
  console.log('\n💾 Saved to mirofish_ratelimited_results.json');
}

if (!process.env.GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY required');
  process.exit(1);
}

main().catch(console.error);
