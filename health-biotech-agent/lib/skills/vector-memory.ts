/**
 * Vector Memory Skill — elite-longterm-memory pattern
 * Pinecone-based semantic memory for queries and outcomes
 */

import { Pinecone } from '@pinecone-database/pinecone';

export interface MemoryEntry {
  id: string;
  content: string;
  metadata: {
    type: 'query' | 'response' | 'interaction' | 'source_feedback';
    query?: string;
    response?: string;
    outcome?: 'helpful' | 'unhelpful' | 'neutral';
    userId?: string;
    timestamp: number;
    sources?: string[];
    confidence?: number;
    tags?: string[];
  };
}

export class VectorMemorySkill {
  private pinecone: Pinecone;
  private index: any;
  private openaiApiKey: string;
  
  constructor() {
    const apiKey = process.env.PINECONE_API_KEY;
    const indexName = process.env.PINECONE_INDEX || 'health-agent-memory';
    
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY required for memory');
    }
    
    this.pinecone = new Pinecone({ apiKey });
    this.index = this.pinecone.index(indexName);
    this.openaiApiKey = process.env.OPENAI_API_KEY || '';
  }
  
  /**
   * Store a memory entry
   */
  async store(entry: Omit<MemoryEntry, 'id'>): Promise<string> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate embedding
    const embedding = await this.embed(entry.content);
    
    await this.index.upsert([{
      id,
      values: embedding,
      metadata: entry.metadata
    }]);
    
    return id;
  }
  
  /**
   * Query similar memories
   */
  async query(params: {
    query: string;
    filters?: Partial<MemoryEntry['metadata']>;
    topK?: number;
  }): Promise<MemoryEntry[]> {
    const embedding = await this.embed(params.query);
    
    const results = await this.index.query({
      vector: embedding,
      filter: this.buildFilter(params.filters),
      topK: params.topK || 5,
      includeMetadata: true
    });
    
    return results.matches?.map((m: any) => ({
      id: m.id,
      content: m.metadata.content || params.query,
      metadata: m.metadata
    })) || [];
  }
  
  /**
   * Store query-response pair with outcome tracking
   */
  async storeInteraction(params: {
    query: string;
    response: string;
    sources: string[];
    confidence: number;
    userId?: string;
    outcome?: 'helpful' | 'unhelpful' | 'neutral';
  }): Promise<string> {
    const content = `Q: ${params.query}\nA: ${params.response}`;
    
    return this.store({
      content,
      metadata: {
        type: 'interaction',
        query: params.query,
        response: params.response,
        sources: params.sources,
        confidence: params.confidence,
        outcome: params.outcome,
        userId: params.userId,
        timestamp: Date.now(),
        tags: this.extractTags(params.query)
      }
    });
  }
  
  /**
   * Find similar past queries and their outcomes
   */
  async findSimilarExperiences(query: string): Promise<{
    similarQueries: string[];
    avgOutcome: number;
    bestResponse?: string;
  }> {
    const memories = await this.query({
      query,
      filters: { type: 'interaction' },
      topK: 10
    });
    
    const interactions = memories.filter(m => m.metadata.type === 'interaction');
    
    if (interactions.length === 0) {
      return { similarQueries: [], avgOutcome: 0 };
    }
    
    const outcomes: number[] = interactions.map(m => {
      if (m.metadata.outcome === 'helpful') return 1;
      if (m.metadata.outcome === 'unhelpful') return -1;
      return 0;
    });
    
    const avgOutcome = outcomes.reduce((a, b) => a + b, 0) / outcomes.length;
    
    // Find best response
    const best = interactions
      .filter(m => m.metadata.outcome === 'helpful')
      .sort((a, b) => (b.metadata.confidence || 0) - (a.metadata.confidence || 0))[0];
    
    return {
      similarQueries: interactions.map(m => m.metadata.query!).filter(Boolean),
      avgOutcome,
      bestResponse: best?.metadata.response
    };
  }
  
  /**
   * Get personalized context for a query
   */
  async getPersonalContext(query: string, userId?: string): Promise<string> {
    const memories = await this.query({
      query,
      filters: userId ? { userId } : undefined,
      topK: 3
    });
    
    if (memories.length === 0) return '';
    
    const context = memories
      .filter(m => m.metadata.outcome === 'helpful')
      .map(m => `Previously, when asking about "${m.metadata.query}", the response was: ${m.metadata.response}`)
      .join('\n\n');
    
    return context;
  }
  
  private async embed(text: string): Promise<number[]> {
    // Use OpenAI embeddings (or fallback to simple hash for demo)
    if (!this.openaiApiKey) {
      // Fallback: return zero vector (will still work for metadata filtering)
      return new Array(1536).fill(0);
    }
    
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-small'
      })
    });
    
    const data = await response.json();
    return data.data[0].embedding;
  }
  
  private buildFilter(filters?: Partial<MemoryEntry['metadata']>): any {
    if (!filters) return undefined;
    
    const conditions: any = {};
    
    if (filters.type) conditions.type = { $eq: filters.type };
    if (filters.userId) conditions.userId = { $eq: filters.userId };
    if (filters.outcome) conditions.outcome = { $eq: filters.outcome };
    
    return Object.keys(conditions).length > 0 ? conditions : undefined;
  }
  
  private extractTags(query: string): string[] {
    const tags: string[] = [];
    
    // Extract supplement names
    const supplements = ['NMN', 'creatine', 'magnesium', 'zinc', 'omega-3', 'vitamin d', 'curcumin'];
    supplements.forEach(s => {
      if (query.toLowerCase().includes(s.toLowerCase())) tags.push(s);
    });
    
    // Extract biomarkers
    const biomarkers = ['HRV', 'sleep', 'glucose', 'cortisol'];
    biomarkers.forEach(b => {
      if (query.toLowerCase().includes(b.toLowerCase())) tags.push(b);
    });
    
    return tags;
  }
}