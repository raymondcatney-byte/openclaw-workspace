#!/usr/bin/env node
/**
 * TRUE MiroFish Golf - Agent Swarm Implementation
 * Runs 50 ACTUAL separate LLM calls (not pretend agents)
 * Uses Groq API for fast, cheap inference
 * Cost: ~$0.03 per player, ~$0.60 for full field
 */

import { Groq } from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'your-api-key-here'
});

const MODEL = 'llama-3.3-70b-versatile';

// Load the 50 golf personas
import { GOLF_PERSONAS } from '../agents/golf-personas.js';

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

// Build agent-specific prompt
function buildAgentPrompt(agent: typeof GOLF_PERSONAS[0], player: Player): string {
  return `${agent.systemPrompt}

---

PLAYER TO ANALYZE: ${player.name}

DATA:
- Strokes Gained Total: +${player.strokes_gained.total}
- SG Approach (irons): +${player.strokes_gained.approach}
- SG Off the Tee: +${player.strokes_gained.off_the_tee}
- SG Around Green: +${player.strokes_gained.around_green}
- SG Putting: +${player.strokes_gained.putting}

MASTERS HISTORY:
- Starts: ${player.masters_history.starts}
- Wins: ${player.masters_history.wins}
- Top-10s: ${player.masters_history.top_10s}
- Course Fit Score: ${player.course_fit}/100

RECENT FORM: ${player.recent_form}

YOUR TASK:
Estimate ${player.name}'s win probability for The Masters 2026.

Respond in this exact format:
PROBABILITY: [number between 0-25]%
CONFIDENCE: [1-10]
REASONING: [one sentence explaining your thinking]`;
}

// Call a single agent
async function callAgent(agent: typeof GOLF_PERSONAS[0], player: Player): Promise<AgentOpinion> {
  const prompt = buildAgentPrompt(agent, player);
  
  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: agent.systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: agent.temperature,
      max_tokens: 150,
    });
    
    const content = response.choices[0]?.message?.content || '';
    
    // Parse the response
    const probMatch = content.match(/PROBABILITY:\s*(\d+(?:\.\d+)?)/i);
    const confMatch = content.match(/CONFIDENCE:\s*(\d+)/i);
    const reasonMatch = content.match(/REASONING:\s*(.+)/i);
    
    return {
      agentId: agent.id,
      agentName: agent.name,
      winProbability: probMatch ? parseFloat(probMatch[1]) : 0,
      confidence: confMatch ? parseInt(confMatch[1]) : 5,
      reasoning: reasonMatch ? reasonMatch[1].trim() : 'No reasoning provided',
      rawResponse: content
    };
  } catch (error) {
    console.error(`Error with agent ${agent.name}:`, error);
    return {
      agentId: agent.id,
      agentName: agent.name,
      winProbability: 0,
      confidence: 0,
      reasoning: 'Error',
      rawResponse: String(error)
    };
  }
}

// Run all 50 agents for one player
async function analyzePlayer(player: Player, agentCount: number = 50): Promise<{
  player: string;
  opinions: AgentOpinion[];
  consensus: number;
  avgConfidence: number;
  stdDev: number;
}> {
  console.log(`\n🔍 Analyzing ${player.name} with ${agentCount} agents...`);
  
  // Select agents (use first N)
  const agents = GOLF_PERSONAS.slice(0, agentCount);
  
  // Run all agents in parallel
  const opinions = await Promise.all(
    agents.map(agent => callAgent(agent, player))
  );
  
  // Calculate consensus (weighted average by confidence)
  const totalConfidence = opinions.reduce((sum, o) => sum + o.confidence, 0);
  const weightedSum = opinions.reduce((sum, o) => sum + (o.winProbability * o.confidence), 0);
  const consensus = totalConfidence > 0 ? weightedSum / totalConfidence : 0;
  
  // Calculate average confidence
  const avgConfidence = opinions.reduce((sum, o) => sum + o.confidence, 0) / opinions.length;
  
  // Calculate standard deviation
  const mean = opinions.reduce((sum, o) => sum + o.winProbability, 0) / opinions.length;
  const variance = opinions.reduce((sum, o) => sum + Math.pow(o.winProbability - mean, 2), 0) / opinions.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    player: player.name,
    opinions,
    consensus: Math.round(consensus * 10) / 10,
    avgConfidence: Math.round(avgConfidence * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10
  };
}

// Main execution
async function main() {
  console.log('🏆 TRUE MIROFISH GOLF - AGENT SWARM');
  console.log('=' .repeat(60));
  console.log(`Model: ${MODEL}`);
  console.log(`Agents: ${GOLF_PERSONAS.length}`);
  console.log(`Estimated cost: ~$0.60 for full analysis\n`);
  
  // Load players
  const data = JSON.parse(fs.readFileSync('./masters_comprehensive_data.json', 'utf-8'));
  const players: Player[] = data.players.slice(0, 5); // Top 5 for testing
  
  const results = [];
  
  for (const player of players) {
    const result = await analyzePlayer(player, 50);
    results.push(result);
    
    // Show summary
    console.log(`\n📊 ${result.player}`);
    console.log(`   Consensus: ${result.consensus}%`);
    console.log(`   Confidence: ${result.avgConfidence}/10`);
    console.log(`   Spread (std dev): ${result.stdDev}%`);
    
    // Show range of opinions
    const probs = result.opinions.map(o => o.winProbability).sort((a, b) => a - b);
    console.log(`   Range: ${probs[0]}% - ${probs[probs.length - 1]}%`);
    
    // Show top 3 most confident agents
    const topAgents = result.opinions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);
    console.log(`   Top confident agents:`);
    topAgents.forEach(a => {
      console.log(`     • ${a.agentName}: ${a.winProbability}% (conf: ${a.confidence})`);
    });
    
    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 1000));
  }
  
  // Save full results
  const outputPath = './mirofish_swarm_results.json';
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\n💾 Full results saved to ${outputPath}`);
  
  // Summary table
  console.log('\n📈 CONSENSUS RANKINGS');
  console.log('-'.repeat(50));
  results
    .sort((a, b) => b.consensus - a.consensus)
    .forEach((r, i) => {
      console.log(`${i + 1}. ${r.player.padEnd(20)} | ${r.consensus.toFixed(1)}%`);
    });
}

// Check for API key
if (!process.env.GROQ_API_KEY) {
  console.error('❌ Error: GROQ_API_KEY environment variable required');
  console.error('   Set it with: export GROQ_API_KEY=your_key_here');
  process.exit(1);
}

main().catch(console.error);
