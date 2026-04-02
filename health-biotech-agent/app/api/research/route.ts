/**
 * Research API — Combines web-search-pro + vector-memory + synthesis
 * Edge-compatible for Vercel deployment
 */

import { NextRequest, NextResponse } from 'next/server';
import { WebSearchSkill } from '@/lib/skills/web-search';
import { VectorMemorySkill } from '@/lib/skills/vector-memory';

export const runtime = 'edge';

// Initialize skills (lazy load to avoid edge issues)
let webSearch: WebSearchSkill | null = null;
let vectorMemory: VectorMemorySkill | null = null;

function getSkills() {
  if (!webSearch) webSearch = new WebSearchSkill();
  if (!vectorMemory && process.env.PINECONE_API_KEY) {
    try {
      vectorMemory = new VectorMemorySkill();
    } catch (e) {
      console.warn('Vector memory not available:', e);
    }
  }
  return { webSearch, vectorMemory };
}

export async function POST(req: NextRequest) {
  try {
    const { 
      query, 
      sources = ['general', 'pubmed'],
      depth = 'standard',
      userId,
      includeMemory = true
    } = await req.json();
    
    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }
    
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      );
    }
    
    const { webSearch, vectorMemory } = getSkills();
    
    // Step 1: Check memory for similar queries
    let memoryContext = '';
    let similarExperiences: any = null;
    
    if (includeMemory && vectorMemory) {
      try {
        similarExperiences = await vectorMemory.findSimilarExperiences(query);
        memoryContext = await vectorMemory.getPersonalContext(query, userId);
      } catch (e) {
        console.warn('Memory query failed:', e);
      }
    }
    
    // Step 2: Perform web research
    const searchResults = await webSearch!.search({
      query,
      sources: sources as any,
      depth: depth as any
    });
    
    // Step 3: Synthesize with memory context
    const synthesis = await webSearch!.synthesize(query, searchResults, groqApiKey);
    
    // Step 4: Store interaction
    if (vectorMemory) {
      try {
        await vectorMemory.storeInteraction({
          query,
          response: synthesis.answer,
          sources: synthesis.sources.map(s => s.url),
          confidence: synthesis.confidence,
          userId
        });
      } catch (e) {
        console.warn('Failed to store interaction:', e);
      }
    }
    
    return NextResponse.json({
      query,
      answer: synthesis.answer,
      confidence: synthesis.confidence,
      sources: synthesis.sources,
      reasoning: synthesis.reasoning,
      memory: {
        similarQueries: similarExperiences?.similarQueries || [],
        avgOutcome: similarExperiences?.avgOutcome || 0,
        hasPriorContext: !!memoryContext
      },
      meta: {
        sourcesSearched: searchResults.length,
        depth,
        timestamp: Date.now()
      }
    });
    
  } catch (error) {
    console.error('Research API error:', error);
    return NextResponse.json(
      { error: 'Research system error', message: (error as Error).message },
      { status: 500 }
    );
  }
}