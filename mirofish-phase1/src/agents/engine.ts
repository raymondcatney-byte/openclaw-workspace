import Groq from 'groq-sdk';
import { AgentOpinion, AgentPersona, MarketContext } from '../types/index.js';
import { getPersonasForMarket } from './personas.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Rate limiter: Groq free tier = 30 RPM = 1 request per 2 seconds
class RateLimiter {
  private lastCallTime: number = 0;
  private minDelayMs: number = 2200; // 27 requests per minute (safety margin)

  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < this.minDelayMs) {
      const waitMs = this.minDelayMs - timeSinceLastCall;
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
    
    // Update timestamp BEFORE the call to prevent race conditions
    this.lastCallTime = Date.now();
  }
}

const rateLimiter = new RateLimiter();

interface AgentPromptContext {
  marketQuestion: string;
  marketDescription: string;
  currentPrice: number;
  category: string;
  news: string[];
  daysToResolution: number;
}

function buildAgentPrompt(context: AgentPromptContext): string {
  return `MARKET QUESTION: ${context.marketQuestion}

DESCRIPTION: ${context.marketDescription}

CURRENT MARKET PRICE: Yes ${(context.currentPrice * 100).toFixed(1)}¢ / No ${((1 - context.currentPrice) * 100).toFixed(1)}¢

CATEGORY: ${context.category}

DAYS TO RESOLUTION: ~${context.daysToResolution}

RECENT NEWS:
${context.news.slice(0, 5).map(n => `- ${n}`).join('\n')}

Provide your analysis in this exact format:

PROBABILITY: [number 0-100]%
CONFIDENCE: [number 0-100]%
REASONING: [2-3 sentences explaining your reasoning]
KEY_FACTORS:
- [factor 1]
- [factor 2]  
- [factor 3]

Be decisive. State your view clearly.`;
}

function parseAgentResponse(response: string, agentId: string, agentType: string): AgentOpinion {
  const probabilityMatch = response.match(/PROBABILITY:\s*(\d+(?:\.\d+)?)/i);
  const confidenceMatch = response.match(/CONFIDENCE:\s*(\d+(?:\.\d+)?)/i);
  const reasoningMatch = response.match(/REASONING:\s*([^]*?)(?=KEY_FACTORS:|$)/i);
  const factorsMatch = response.match(/KEY_FACTORS:([^]*?)$/i);
  
  const prediction = probabilityMatch ? parseFloat(probabilityMatch[1]) / 100 : 0.5;
  const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) / 100 : 0.5;
  const reasoning = reasoningMatch?.[1]?.trim() || 'No reasoning provided';
  
  const keyFactors = factorsMatch?.[1]
    ?.split('\n')
    .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
    .map(line => line.replace(/^[-•]\s*/, '').trim())
    .slice(0, 3) || [];
  
  return {
    agentId,
    agentType: agentType as any,
    prediction: Math.max(0, Math.min(1, prediction)),
    confidence: Math.max(0, Math.min(1, confidence)),
    reasoning,
    keyFactors,
    timestamp: new Date(),
  };
}

async function getAgentOpinion(
  persona: AgentPersona, 
  context: AgentPromptContext
): Promise<AgentOpinion> {
  const prompt = buildAgentPrompt(context);
  
  try {
    await rateLimiter.wait();
    
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: persona.systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: persona.temperature,
      max_tokens: 300,
    });
    
    const response = completion.choices[0]?.message?.content || '';
    return parseAgentResponse(response, persona.id, persona.type);
    
  } catch (error) {
    console.error(`Agent ${persona.id} failed:`, error);
    // Return neutral opinion on failure
    return {
      agentId: persona.id,
      agentType: persona.type,
      prediction: 0.5,
      confidence: 0.1,
      reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      keyFactors: ['API error'],
      timestamp: new Date(),
    };
  }
}

export async function simulateAgentOpinions(
  marketContext: MarketContext,
  agentCount: number = 50
): Promise<AgentOpinion[]> {
  const personas = getPersonasForMarket(marketContext.market.category, agentCount);
  
  const promptContext: AgentPromptContext = {
    marketQuestion: marketContext.market.question,
    marketDescription: marketContext.market.description,
    currentPrice: marketContext.market.outcomePrices.yes,
    category: marketContext.market.category,
    news: marketContext.news.map(n => n.title),
    daysToResolution: Math.max(1, Math.ceil(
      (marketContext.market.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )),
  };
  
  // Process in batches to control costs and rate limits
  const BATCH_SIZE = 3;
  const opinions: AgentOpinion[] = [];
  
  console.log(`  Simulating ${personas.length} agents...`);
  
  for (let i = 0; i < personas.length; i += BATCH_SIZE) {
    const batch = personas.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(persona => getAgentOpinion(persona, promptContext))
    );
    
    opinions.push(...batchResults);
    
    // Progress indicator
    if ((i + BATCH_SIZE) % 10 === 0 || i + BATCH_SIZE >= personas.length) {
      process.stdout.write(`  ${Math.min(i + BATCH_SIZE, personas.length)}/${personas.length} `);
    }
  }
  
  console.log(); // New line after progress
  
  return opinions;
}
