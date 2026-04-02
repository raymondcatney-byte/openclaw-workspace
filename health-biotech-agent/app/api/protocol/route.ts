/**
 * Protocol API — Personal protocol consultation with knowledge graph
 * Combines Wayne Protocol rules + interaction checking + memory
 */

import { NextRequest, NextResponse } from 'next/server';
import { KnowledgeGraphSkill } from '@/lib/skills/knowledge-graph';
import { VectorMemorySkill } from '@/lib/skills/vector-memory';

export const runtime = 'edge';

// Wayne Protocol base knowledge (from original spec)
const WAYNE_PROTOCOL = `
DAILY STRUCTURE
• Fasting: 18:6 base (adjustable: 16:8, 20:4, or skip)
• Meal 1 (08:15 post-training): 6 eggs, wild salmon, sweet potato, avocado, spinach
• Meal 2 (11:30): Bone broth, grilled chicken/fish, fermented vegetables  
• Meal 3 (18:30): Grass-fed steak/bison, beef liver weekly, cruciferous vegetables

SUPPLEMENT STACKS
Morning (05:30): NMN 500mg sublingual, TMG 1g, Alpha-GPC 600mg, Lion's Mane 1g, Vitamin D3 5000 IU, K2 MK-7 200mcg, Omega-3 2g
Pre-workout (06:15): Creatine 5g, Beta-alanine 3g, Caffeine 100mg optional
Post-workout (08:00): Whey isolate 40g, electrolytes
Deep work (08:30): L-Theanine 200mg, Magnesium L-threonate 200mg
Afternoon (12:00): Phosphatidylserine 300mg
Evening (20:00): Zinc 30mg, Copper 2mg, Apigenin 50mg, Glycine 3g

ADJUSTMENT RULES:
• Sleep <6h → Delay fasting 2h, skip caffeine, reduce training 50%
• HRV <50 or down >10% → NO sauna, mobility only, add 1g glycine
• Readiness <5 → Skip training, prioritize recovery
• "Inflamed" or sore → Add curcumin, skip ecdysterone, reduce intensity
`;

interface ParsedBiomarkers {
  sleep?: number;
  hrv?: number;
  readiness?: number;
  subjective?: string;
  supplements?: string[];
}

function parseBiomarkers(input: string): ParsedBiomarkers {
  const result: ParsedBiomarkers = {};
  
  const sleepMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:hours?|h)\s*(?:sleep|slept)/i);
  if (sleepMatch) result.sleep = parseFloat(sleepMatch[1]);
  
  const hrvMatch = input.match(/hrv\s*(?:is|was)?\s*(\d+)/i);
  if (hrvMatch) result.hrv = parseInt(hrvMatch[1]);
  
  const readinessMatch = input.match(/readiness\s*(?:is|was)?\s*(\d+)/i);
  if (readinessMatch) result.readiness = parseInt(readinessMatch[1]);
  
  const subjectivePatterns = ['inflamed', 'sore', 'wrecked', 'tired', 'great', 'excellent'];
  result.subjective = subjectivePatterns.find(p => 
    input.toLowerCase().includes(p)
  );
  
  // Extract supplement mentions
  const commonSupplements = ['nmn', 'creatine', 'magnesium', 'zinc', 'caffeine', 'glycine'];
  result.supplements = commonSupplements.filter(s => 
    input.toLowerCase().includes(s)
  );
  
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const { query, userId, checkInteractions = true } = await req.json();
    
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      );
    }
    
    const biomarkers = parseBiomarkers(query);
    
    // Check for supplement interactions if mentioned
    let interactionWarnings: any[] = [];
    
    if (checkInteractions && biomarkers.supplements && biomarkers.supplements.length >= 2) {
      try {
        const kg = new KnowledgeGraphSkill();
        
        // Check pairwise interactions
        for (let i = 0; i < biomarkers.supplements.length; i++) {
          for (let j = i + 1; j < biomarkers.supplements.length; j++) {
            const check = await kg.checkInteraction(
              biomarkers.supplements[i],
              biomarkers.supplements[j]
            );
            if (check.hasInteraction) {
              interactionWarnings.push({
                substances: [biomarkers.supplements[i], biomarkers.supplements[j]],
                warnings: check.interactions
              });
            }
          }
        }
        
        await kg.close();
      } catch (e) {
        console.warn('Knowledge graph check failed:', e);
      }
    }
    
    // Get personal context from memory
    let personalContext = '';
    try {
      if (process.env.PINECONE_API_KEY) {
        const memory = new VectorMemorySkill();
        personalContext = await memory.getPersonalContext(query, userId);
      }
    } catch (e) {
      console.warn('Memory fetch failed:', e);
    }
    
    // Build enhanced prompt
    const enrichedInput = `
${biomarkers.sleep || biomarkers.hrv ? `[Biomarkers: ${JSON.stringify(biomarkers)}]` : ''}
${interactionWarnings.length > 0 ? `[Interaction Warnings: ${JSON.stringify(interactionWarnings)}]` : ''}
${personalContext ? `[Personal Context: ${personalContext}]` : ''}

User Query: ${query}
`;
    
    const systemPrompt = `You are the Wayne Protocol Consultant. 

BASE KNOWLEDGE:
${WAYNE_PROTOCOL}

INSTRUCTIONS:
- Consider biomarkers and adjust protocols accordingly
- Respect interaction warnings
- Use personal context if relevant
- Always provide exact dosages and timing
- Never say "consult a doctor"
- Prioritize recovery over performance when conflicting signals`;
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: enrichedInput }
        ],
        temperature: 0.3,
        max_tokens: 600
      })
    });
    
    const data = await response.json();
    
    return NextResponse.json({
      response: data.choices[0].message.content,
      biomarkers,
      interactionWarnings: interactionWarnings.length > 0 ? interactionWarnings : undefined,
      hasPersonalContext: !!personalContext,
      meta: {
        timestamp: Date.now(),
        userId: userId || 'anonymous'
      }
    });
    
  } catch (error) {
    console.error('Protocol API error:', error);
    return NextResponse.json(
      { error: 'Protocol system error' },
      { status: 500 }
    );
  }
}