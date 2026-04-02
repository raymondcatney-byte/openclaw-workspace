Implement a complete KB Causation Engine for prediction market intelligence. This is a single-file TypeScript implementation.

## REQUIREMENTS

Answer "WHY did the price move?" and "What's the expected edge?" by matching current events to historical patterns using semantic search.

## COMPLETE IMPLEMENTATION

```typescript
// ============================================
// TYPES
// ============================================
export type Domain = 'biotech' | 'geopolitics' | 'commodities' | 'crypto' | 'ai' | 'robotics' | 'human_optimization';
export type KBEntryType = 'pattern' | 'event' | 'prediction' | 'outcome';

export interface KBEntry {
  id: string;
  content: string;
  metadata: {
    type: KBEntryType;
    domain: Domain;
    asset: string;
    timestamp: number;
    outcome?: 'correct' | 'incorrect' | 'pending';
    edge?: number;
    tags?: string[];
  };
  embedding?: number[];
}

export interface ExternalEvent {
  type: string;
  description: string;
  timestamp: number;
  significance?: number;
}

export interface CausationQuery {
  asset: string;
  priceMove: { magnitude: number; timeframe: string };
  domain: Domain;
  currentMarketPrice: number;
  externalEvents: ExternalEvent[];
}

export interface CausationAnalysis {
  primaryCatalyst: { event: string; confidence: number; evidence: string[] };
  contributingFactors: Array<{ factor: string; weight: number }>;
  historicalMatches: Array<{ event: string; date: string; outcome: string; edge?: number }>;
  edgeEstimate: { magnitude: number; direction: 'up' | 'down' | 'neutral'; confidence: number; reasoning: string };
  recommendation: { action: 'predict' | 'monitor' | 'dismiss'; rationale: string; urgency: 'immediate' | 'hours' | 'days' };
}

// ============================================
// VECTOR STORE
// ============================================
export class KBVectorStore {
  private entries = new Map<string, KBEntry>();
  private embeddings = new Map<string, number[]>();

  async embed(text: string): Promise<number[]> {
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(384).fill(0);
    words.forEach((word, idx) => {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash) + word.charCodeAt(i);
        hash = hash & hash;
      }
      embedding[Math.abs(hash) % 384] = 1 + (idx / words.length);
    });
    const magnitude = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0));
    return embedding.map(v => v / (magnitude || 1));
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
  }

  async store(entry: KBEntry): Promise<void> {
    const emb = await this.embed(entry.content);
    this.entries.set(entry.id, { ...entry, embedding: emb });
    this.embeddings.set(entry.id, emb);
  }

  async storeBatch(entries: KBEntry[]): Promise<void> {
    for (const e of entries) await this.store(e);
  }

  async query(params: {
    query: string;
    filters?: { type?: KBEntryType; domain?: Domain; asset?: string; outcome?: string };
    topK?: number;
  }): Promise<KBEntry[]> {
    const qEmb = await this.embed(params.query);
    const scored = Array.from(this.entries.entries())
      .map(([id, entry]) => ({
        entry,
        similarity: this.cosineSimilarity(qEmb, this.embeddings.get(id)!)
      }))
      .filter(({ entry }) => {
        if (params.filters?.type && entry.metadata.type !== params.filters.type) return false;
        if (params.filters?.domain && entry.metadata.domain !== params.filters.domain) return false;
        if (params.filters?.asset && entry.metadata.asset !== params.filters.asset) return false;
        return true;
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, params.topK || 10);
    return scored.map(s => s.entry);
  }

  async stats() {
    const byType: Record<string, number> = {};
    const byDomain: Record<string, number> = {};
    for (const e of this.entries.values()) {
      byType[e.metadata.type] = (byType[e.metadata.type] || 0) + 1;
      byDomain[e.metadata.domain] = (byDomain[e.metadata.domain] || 0) + 1;
    }
    return { total: this.entries.size, byType, byDomain };
  }
}

// ============================================
// CAUSATION ENGINE
// ============================================
export class CausationEngine {
  constructor(private vectorStore: KBVectorStore) {}

  async analyze(query: CausationQuery): Promise<CausationAnalysis> {
    const searchQuery = `${query.asset} ${query.priceMove.magnitude > 0 ? 'increase' : 'decrease'} ${Math.abs(query.priceMove.magnitude * 100).toFixed(1)}% ${query.externalEvents.map(e => e.type + ' ' + e.description).join(' ')}`;
    
    const events = await this.vectorStore.query({ query: searchQuery, filters: { domain: query.domain }, topK: 20 });
    const patterns = await this.vectorStore.query({ query: searchQuery, filters: { type: 'pattern', domain: query.domain }, topK: 5 });

    const catalysts = query.externalEvents.map(ev => ({
      event: `${ev.type}: ${ev.description}`,
      confidence: Math.min(ev.significance || 0.5, 0.95),
      evidence: [`Significance: ${ev.significance}`]
    })).sort((a, b) => b.confidence - a.confidence);

    const outcomes = events.filter(e => e.metadata.outcome);
    const winRate = outcomes.length ? outcomes.filter(e => e.metadata.outcome === 'correct').length / outcomes.length : 0;
    const edges = outcomes.map(e => e.metadata.edge).filter((e): e is number => e !== undefined);
    const avgEdge = edges.length ? edges.reduce((a, b) => a + b, 0) / edges.length : 0;
    const adjustedMagnitude = avgEdge * winRate;

    const hasStrongCatalyst = catalysts[0]?.confidence > 0.7;
    const hasHighEdge = adjustedMagnitude > 0.05 && winRate > 0.5;

    return {
      primaryCatalyst: catalysts[0] || { event: 'No clear catalyst', confidence: 0.3, evidence: [] },
      contributingFactors: catalysts.slice(1).map(c => ({ factor: c.event, weight: c.confidence * 0.5 })),
      historicalMatches: events.slice(0, 5).map(e => ({
        event: e.content.substring(0, 60) + '...',
        date: new Date(e.metadata.timestamp).toLocaleDateString(),
        outcome: e.metadata.outcome === 'correct' ? 'Success' : 'Failure',
        edge: e.metadata.edge
      })),
      edgeEstimate: {
        magnitude: Math.abs(adjustedMagnitude),
        direction: query.priceMove.magnitude > 0 ? 'up' : 'down',
        confidence: winRate,
        reasoning: `Based on ${outcomes.length} similar events with ${Math.round(winRate * 100)}% win rate`
      },
      recommendation: {
        action: hasStrongCatalyst && hasHighEdge ? 'predict' : hasHighEdge ? 'monitor' : 'dismiss',
        rationale: hasStrongCatalyst && hasHighEdge ? 'High edge with clear catalyst' : 'Conditions not met',
        urgency: hasStrongCatalyst && hasHighEdge ? 'immediate' : 'hours'
      }
    };
  }
}

// ============================================
// FACTORY
// ============================================
export function createKBEngine() {
  const vectorStore = new KBVectorStore();
  const causationEngine = new CausationEngine(vectorStore);
  return { vectorStore, causationEngine };
}

// ============================================
// TEST DATA
// ============================================
const mockData: KBEntry[] = [
  {
    id: 'pattern-001',
    content: 'FDA PDUFA approaching within 7 days with favorable adcom vote. 85% approval rate.',
    metadata: { type: 'pattern', domain: 'biotech', asset: 'generic', timestamp: 1704067200000 }
  },
  {
    id: 'pred-001',
    content: 'Predicted YES on X-305 approval. Strong Phase 3 (94% efficacy), favorable adcom (12-1 vote).',
    metadata: { type: 'prediction', domain: 'biotech', asset: 'X-305', timestamp: 1709424000000, outcome: 'correct', edge: 0.26 }
  },
  {
    id: 'pred-002',
    content: 'Predicted YES on Y-102 approval. Phase 3 topline p<0.001 with 89% efficacy.',
    metadata: { type: 'prediction', domain: 'biotech', asset: 'Y-102', timestamp: 1712016000000, outcome: 'correct', edge: 0.18 }
  },
  {
    id: 'pred-003',
    content: 'Predicted NO on Z-440 approval. Mixed Phase 2b, safety concerns.',
    metadata: { type: 'prediction', domain: 'biotech', asset: 'Z-440', timestamp: 1714608000000, outcome: 'incorrect', edge: -0.15 }
  },
  {
    id: 'pred-004',
    content: 'Predicted YES on W-221 approval. Orphan drug, fast track, unmet need.',
    metadata: { type: 'prediction', domain: 'biotech', asset: 'W-221', timestamp: 1714608000000, outcome: 'correct', edge: 0.22 }
  }
];

const testQuery: CausationQuery = {
  asset: 'A-999',
  priceMove: { magnitude: 0.02, timeframe: '24h' },
  domain: 'biotech',
  currentMarketPrice: 0.38,
  externalEvents: [
    { type: 'adcom', description: 'FDA Advisory Committee voted 11-2 in favor', timestamp: Date.now(), significance: 0.9 },
    { type: 'pdufa', description: 'PDUFA date in 5 days', timestamp: Date.now(), significance: 0.8 }
  ]
};

// ============================================
// TEST RUNNER
// ============================================
async function runTests() {
  console.log('🧠 KB Causation Engine Tests\n');
  const { vectorStore, causationEngine } = createKBEngine();
  
  await vectorStore.storeBatch(mockData);
  console.log('✅ Seeded:', await vectorStore.stats());
  
  const result = await causationEngine.analyze(testQuery);
  
  console.log('\n📊 Analysis Results:');
  console.log('Primary Catalyst:', result.primaryCatalyst.event);
  console.log('Edge:', (result.edgeEstimate.magnitude * 100).toFixed(1) + '%');
  console.log('Confidence:', (result.edgeEstimate.confidence * 100).toFixed(0) + '%');
  console.log('Recommendation:', result.recommendation.action.toUpperCase());
  
  return result;
}

runTests();
```

## EXPECTED OUTPUT

```
🧠 KB Causation Engine Tests

✅ Seeded: { total: 5, byType: { pattern: 1, prediction: 4 }, byDomain: { biotech: 5 } }

📊 Analysis Results:
Primary Catalyst: adcom: FDA Advisory Committee voted 11-2 in favor
Edge: 9.6%
Confidence: 75%
Recommendation: PREDICT
```

## KEY LOGIC

1. **Embeddings**: Word hashing to 384-dim vectors (replace with OpenAI in production)
2. **Search**: Cosine similarity between query and stored entries
3. **Edge Calculation**: `avg_edge * win_rate` (conservative)
4. **Recommendation**: 
   - `predict`: edge >5% + win rate >50% + strong catalyst
   - `monitor`: moderate conditions
   - `dismiss`: low confidence or small edge

## EXTENSION POINTS

- Swap `embed()` for OpenAI API call
- Swap `KBVectorStore` for Pinecone/Weaviate
- Add `PatternExtractor` class for automated pattern discovery
- Add more domains (commodities, crypto, geopolitics)

Provide the complete working code as a single runnable TypeScript file.