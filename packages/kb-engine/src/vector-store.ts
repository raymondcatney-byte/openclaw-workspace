// packages/kb-engine/src/vector-store.ts
// Vector database operations for semantic search

import { KBEntry, Domain, KBEntryType } from './types';

// In-memory implementation for development
// Replace with Pinecone/Weaviate in production

export class KBVectorStore {
  private entries: Map<string, KBEntry> = new Map();
  private embeddings: Map<string, number[]> = new Map();
  
  // Simple embedding simulation using word hashing
  // In production, use OpenAI embeddings API
  async embed(text: string): Promise<number[]> {
    // Simple bag-of-words embedding for demo
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);
    
    words.forEach((word, idx) => {
      // Hash word to position
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(i);
        hash = hash & hash;
      }
      const position = Math.abs(hash) % 384;
      embedding[position] = 1 + (idx / words.length); // Weight by position
    });
    
    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    return embedding.map(v => v / (magnitude || 1));
  }
  
  // Cosine similarity between two vectors
  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
  }
  
  // Store a new entry
  async store(entry: KBEntry): Promise<void> {
    const embedding = await this.embed(entry.content);
    this.entries.set(entry.id, { ...entry, embedding });
    this.embeddings.set(entry.id, embedding);
  }
  
  // Store multiple entries
  async storeBatch(entries: KBEntry[]): Promise<void> {
    for (const entry of entries) {
      await this.store(entry);
    }
  }
  
  // Semantic search with optional filters
  async query(params: {
    query: string;
    filters?: {
      type?: KBEntryType;
      domain?: Domain;
      asset?: string;
      outcome?: 'correct' | 'incorrect' | 'pending';
    };
    topK?: number;
  }): Promise<KBEntry[]> {
    const queryEmbedding = await this.embed(params.query);
    
    // Score all entries
    const scored = Array.from(this.entries.entries())
      .map(([id, entry]) => {
        const embedding = this.embeddings.get(id)!;
        const similarity = this.cosineSimilarity(queryEmbedding, embedding);
        return { entry, similarity };
      })
      .filter(({ entry }) => {
        // Apply filters
        if (params.filters?.type && entry.metadata.type !== params.filters.type) return false;
        if (params.filters?.domain && entry.metadata.domain !== params.filters.domain) return false;
        if (params.filters?.asset && entry.metadata.asset !== params.filters.asset) return false;
        if (params.filters?.outcome && entry.metadata.outcome !== params.filters.outcome) return false;
        return true;
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, params.topK || 10);
    
    return scored.map(s => s.entry);
  }
  
  // Get entry by ID
  async get(id: string): Promise<KBEntry | null> {
    return this.entries.get(id) || null;
  }
  
  // Get all entries for a domain
  async getByDomain(domain: Domain): Promise<KBEntry[]> {
    return Array.from(this.entries.values())
      .filter(e => e.metadata.domain === domain);
  }
  
  // Get all entries for an asset
  async getByAsset(asset: string): Promise<KBEntry[]> {
    return Array.from(this.entries.values())
      .filter(e => e.metadata.asset === asset);
  }
  
  // Get patterns extracted from predictions
  async getPatterns(domain: Domain): Promise<KBEntry[]> {
    return Array.from(this.entries.values())
      .filter(e => e.metadata.type === 'pattern' && e.metadata.domain === domain);
  }
  
  // Clear all entries (useful for testing)
  async clear(): Promise<void> {
    this.entries.clear();
    this.embeddings.clear();
  }
  
  // Get store stats
  async stats(): Promise<{ total: number; byType: Record<string, number>; byDomain: Record<string, number> }> {
    const byType: Record<string, number> = {};
    const byDomain: Record<string, number> = {};
    
    for (const entry of this.entries.values()) {
      byType[entry.metadata.type] = (byType[entry.metadata.type] || 0) + 1;
      byDomain[entry.metadata.domain] = (byDomain[entry.metadata.domain] || 0) + 1;
    }
    
    return {
      total: this.entries.size,
      byType,
      byDomain
    };
  }
}
