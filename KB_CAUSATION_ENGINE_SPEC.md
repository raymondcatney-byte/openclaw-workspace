# KB Causation Engine
## Technical Implementation Specification
### Build This First

---

## ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                    KB CAUSATION ENGINE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│   │   INGEST     │───→│   PROCESS    │───→│   QUERY      │     │
│   │              │    │              │    │              │     │
│   │ • Events     │    │ • Pattern    │    │ • Causation  │     │
│   │ • Prices     │    │   extraction │    │ • Similarity │     │
│   │ • Sentiment  │    │ • Embedding  │    │ • Edge calc  │     │
│   │ • Your calls │    │ • Graph link │    │ • Confidence │     │
│   └──────────────┘    └──────────────┘    └──────────────┘     │
│          │                   │                   │              │
│          └───────────────────┴───────────────────┘              │
│                      │                                          │
│                      ↓                                          │
│              ┌──────────────┐                                   │
│              │  VECTOR DB   │                                   │
│              │  + GRAPH DB  │                                   │
│              │              │                                   │
│              │ • Embeddings │                                   │
│              │ • Patterns   │                                   │
│              │ • Entities   │                                   │
│              │ • Outcomes   │                                   │
│              └──────────────┘                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## WEEK 1: CORE ENGINE

### Day 1-2: Vector Store Foundation

**Technology:** Pinecone (managed) or Weaviate (self-hosted)

```typescript
// Schema: What goes into the vector store
interface KBEntry {
  id: string;
  
  // The content
  content: string;  // Natural language description
  
  // Metadata for filtering
  metadata: {
    type: 'pattern' | 'event' | 'prediction' | 'outcome';
    domain: 'biotech' | 'geopolitics' | 'commodities' | 'crypto' | 'ai' | 'robotics' | 'human_optimization';
    asset: string;  // BTC, Oil, Drug X, etc.
    timestamp: number;
    outcome?: 'correct' | 'incorrect' | 'pending';
    edge?: number;  // Actual edge realized
  };
  
  // The vector embedding
  embedding: number[];  // 1536 dimensions (OpenAI) or 768 (in-house)
}

// Example entries
const exampleEntries: KBEntry[] = [
  {
    id: 'pattern-001',
    content: 'FDA PDUFA approaching within 7 days with no price movement typically results in 15-20% volatility. Historical base rate: 68% approval.',
    metadata: {
      type: 'pattern',
      domain: 'biotech',
      asset: 'generic_biotech',
      timestamp: 1700000000
    },
    embedding: [/* vector */]
  },
  {
    id: 'event-001',
    content: 'Drug X-305 PDUFA date: March 15, 2024. Phase 3 data showed 94% efficacy. Market price: 42¢ YES.',
    metadata: {
      type: 'event',
      domain: 'biotech',
      asset: 'X-305',
      timestamp: 1700000000
    },
    embedding: [/* vector */]
  },
  {
    id: 'prediction-001',
    content: 'Predicted YES on X-305 approval. Rationale: Strong Phase 3, favorable adcom, PDUFA near.',
    metadata: {
      type: 'prediction',
      domain: 'biotech',
      asset: 'X-305',
      timestamp: 1700000000,
      outcome: 'correct',
      edge: 0.26
    },
    embedding: [/* vector */]
  },
  {
    id: 'outcome-001',
    content: 'X-305 approved March 15, 2024. Price moved from 42¢ to 100¢. Bruce prediction correct.',
    metadata: {
      type: 'outcome',
      domain: 'biotech',
      asset: 'X-305',
      timestamp: 1710000000,
      outcome: 'correct'
    },
    embedding: [/* vector */]
  }
];
```

**Implementation:**

```typescript
// packages/kb-engine/vector-store.ts

import { Pinecone } from '@pinecone-database/pinecone';

export class KBVectorStore {
  private pinecone: Pinecone;
  private index: any;
  
  constructor() {
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!
    });
    this.index = this.pinecone.index('kb-engine');
  }
  
  // Store a new pattern/event/prediction
  async store(entry: KBEntry): Promise<void> {
    // Generate embedding via OpenAI
    const embedding = await this.embed(entry.content);
    
    await this.index.upsert([{
      id: entry.id,
      values: embedding,
      metadata: entry.metadata
    }]);
  }
  
  // Semantic search
  async query(params: {
    query: string;
    filters?: Partial<KBEntry['metadata']>;
    topK?: number;
  }): Promise<KBEntry[]> {
    const embedding = await this.embed(params.query);
    
    const results = await this.index.query({
      vector: embedding,
      filter: params.filters,
      topK: params.topK || 10,
      includeMetadata: true
    });
    
    return results.matches.map(m => ({
      id: m.id,
      content: m.metadata.content,
      metadata: m.metadata,
      embedding: m.values
    }));
  }
  
  private async embed(text: string): Promise<number[]> {
    // OpenAI embedding API
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: text,
        model: 'text-embedding-3-large'
      })
    });
    
    const data = await response.json();
    return data.data[0].embedding;
  }
}
```

---

### Day 3-4: Knowledge Graph Layer

**Purpose:** Entity relationships, causal chains

```typescript
// packages/kb-engine/knowledge-graph.ts

import { Neo4j } from 'neo4j-driver';

interface Entity {
  id: string;
  type: 'drug' | 'company' | 'country' | 'commodity' | 'crypto' | 'event' | 'person';
  name: string;
  properties: Record<string, any>;
}

interface Relationship {
  from: string;  // Entity ID
  to: string;    // Entity ID
  type: 'develops' | 'affects' | 'causes' | 'precedes' | 'correlates_with';
  properties: {
    strength: number;  // 0-1 correlation strength
    timestamp?: number;
    evidence?: string;
  };
}

// Example: Drug X-305 knowledge graph
const exampleGraph = {
  entities: [
    { id: 'drug-x305', type: 'drug', name: 'X-305', properties: { indication: 'oncology', phase: 'approved' } },
    { id: 'company-abc', type: 'company', name: 'ABC Pharma', properties: { marketCap: '5B' } },
    { id: 'event-pdufa', type: 'event', name: 'X-305 PDUFA', properties: { date: '2024-03-15' } }
  ],
  relationships: [
    { from: 'company-abc', to: 'drug-x305', type: 'develops', properties: { strength: 1.0 } },
    { from: 'drug-x305', to: 'event-pdufa', type: 'precedes', properties: { strength: 1.0 } }
  ]
};

export class KBKnowledgeGraph {
  private driver: any;
  
  constructor() {
    this.driver = Neo4j.driver(
      process.env.NEO4J_URI!,
      Neo4j.auth.basic(process.env.NEO4J_USER!, process.env.NEO4J_PASSWORD!)
    );
  }
  
  async addEntity(entity: Entity): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run(`
        MERGE (e:Entity {id: $id})
        SET e.type = $type, e.name = $name, e += $properties
      `, entity);
    } finally {
      await session.close();
    }
  }
  
  async addRelationship(rel: Relationship): Promise<void> {
    const session = this.driver.session();
    try {
      await session.run(`
        MATCH (a:Entity {id: $from}), (b:Entity {id: $to})
        MERGE (a)-[r:${rel.type}]->(b)
        SET r += $properties
      `, rel);
    } finally {
      await session.close();
    }
  }
  
  // Find causal chains
  async findCausalChains(params: {
    fromEntity: string;
    toEntityType?: string;
    maxDepth?: number;
  }): Promise<any[]> {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH path = (start:Entity {id: $fromEntity})-[:causes|precedes|affects*1..${params.maxDepth || 3}]->(end)
        ${params.toEntityType ? `WHERE end.type = $toEntityType` : ''}
        RETURN path
        ORDER BY length(path) ASC
        LIMIT 10
      `, params);
      
      return result.records.map(r => r.get('path'));
    } finally {
      await session.close();
    }
  }
}
```

---

### Day 5-7: Pattern Extraction Engine

**Automatically extract patterns from your prediction history**

```typescript
// packages/kb-engine/pattern-extractor.ts

interface ExtractedPattern {
  pattern: string;
  confidence: number;
  supportingEvidence: {
    predictions: number;
    correctPredictions: number;
    avgEdge: number;
  };
  conditions: string[];  // What must be true for pattern to apply
  expectedOutcome: string;
  timeToOutcome: string;  // "48 hours", "2 weeks", etc.
}

export class PatternExtractor {
  constructor(
    private vectorStore: KBVectorStore,
    private knowledgeGraph: KBKnowledgeGraph
  ) {}
  
  async extractPatterns(params: {
    domain: Domain;
    minPredictions?: number;
    minWinRate?: number;
  }): Promise<ExtractedPattern[]> {
    // 1. Query all predictions for this domain
    const predictions = await this.vectorStore.query({
      query: 'successful predictions patterns',
      filters: {
        type: 'prediction',
        domain: params.domain,
        outcome: 'correct'
      },
      topK: 100
    });
    
    // 2. Group by similar characteristics
    const groups = this.groupBySimilarity(predictions);
    
    // 3. Extract patterns from each group
    const patterns: ExtractedPattern[] = [];
    
    for (const group of groups) {
      if (group.length < (params.minPredictions || 5)) continue;
      
      const winRate = group.filter(p => p.metadata.outcome === 'correct').length / group.length;
      if (winRate < (params.minWinRate || 0.6)) continue;
      
      const pattern = await this.synthesizePattern(group);
      patterns.push(pattern);
    }
    
    return patterns.sort((a, b) => b.supportingEvidence.correctPredictions - a.supportingEvidence.correctPredictions);
  }
  
  private groupBySimilarity(predictions: KBEntry[]): KBEntry[][] {
    // Use embeddings to cluster similar predictions
    // Return groups of predictions that are semantically similar
    // Implementation: K-means clustering or hierarchical clustering
  }
  
  private async synthesizePattern(group: KBEntry[]): Promise<ExtractedPattern> {
    // Use LLM to extract common pattern from group
    const prompt = `
      Analyze these ${group.length} successful predictions and extract the common pattern.
      
      Predictions:
      ${group.map(p => `- ${p.content}`).join('\n')}
      
      Extract:
      1. The pattern (what conditions lead to success)
      2. Required conditions
      3. Expected outcome
      4. Typical time to outcome
    `;
    
    // Call LLM to synthesize
    const synthesis = await this.llmSynthesize(prompt);
    
    return {
      pattern: synthesis.pattern,
      confidence: synthesis.confidence,
      supportingEvidence: {
        predictions: group.length,
        correctPredictions: group.filter(p => p.metadata.outcome === 'correct').length,
        avgEdge: group.reduce((sum, p) => sum + (p.metadata.edge || 0), 0) / group.length
      },
      conditions: synthesis.conditions,
      expectedOutcome: synthesis.expectedOutcome,
      timeToOutcome: synthesis.timeToOutcome
    };
  }
}
```

---

## WEEK 2: CAUSATION QUERIES

### The Core Interface

```typescript
// packages/kb-engine/causation-engine.ts

export interface CausationQuery {
  // What happened
  asset: string;
  priceMove: {
    magnitude: number;  // -0.05 = -5%
    timeframe: string;  // "24h", "1h", etc.
  };
  
  // Context
  domain: Domain;
  currentMarketPrice: number;
  externalEvents: ExternalEvent[];  // From scanners
}

export interface CausationAnalysis {
  // What caused the move
  primaryCatalyst: {
    event: string;
    confidence: number;
    evidence: string[];
  };
  
  // Secondary factors
  contributingFactors: {
    factor: string;
    weight: number;  // 0-1
  }[];
  
  // Similar historical events
  historicalMatches: {
    event: string;
    date: string;
    outcome: string;
    yourPrediction?: 'correct' | 'incorrect';
  }[];
  
  // Your edge calculation
  edgeEstimate: {
    magnitude: number;  // Expected additional move
    direction: 'up' | 'down' | 'neutral';
    confidence: number;
    reasoning: string;
  };
  
  // Actionable insight
  recommendation: {
    action: 'predict' | 'monitor' | 'dismiss';
    rationale: string;
    urgency: 'immediate' | 'hours' | 'days';
  };
}

export class CausationEngine {
  constructor(
    private vectorStore: KBVectorStore,
    private knowledgeGraph: KBKnowledgeGraph,
    private patternExtractor: PatternExtractor
  ) {}
  
  async analyze(query: CausationQuery): Promise<CausationAnalysis> {
    // 1. Query vector store for similar events
    const searchQuery = this.buildSearchQuery(query);
    const similarEvents = await this.vectorStore.query({
      query: searchQuery,
      filters: { domain: query.domain },
      topK: 20
    });
    
    // 2. Identify catalysts from external events
    const catalysts = this.identifyCatalysts(query.externalEvents, similarEvents);
    
    // 3. Query knowledge graph for causal chains
    const causalChains = await this.queryCausalChains(query.asset, catalysts);
    
    // 4. Calculate edge from historical patterns
    const edgeEstimate = this.calculateEdge(query, similarEvents);
    
    // 5. Generate recommendation
    const recommendation = this.generateRecommendation(edgeEstimate, catalysts);
    
    return {
      primaryCatalyst: catalysts[0],
      contributingFactors: catalysts.slice(1).map(c => ({ factor: c.event, weight: c.confidence * 0.5 })),
      historicalMatches: this.formatHistoricalMatches(similarEvents),
      edgeEstimate,
      recommendation
    };
  }
  
  private buildSearchQuery(query: CausationQuery): string {
    return `${query.asset} ${query.priceMove.magnitude > 0 ? 'increased' : 'decreased'} ${Math.abs(query.priceMove.magnitude)} in ${query.priceMove.timeframe}. ${query.externalEvents.map(e => e.description).join('. ')}`;
  }
  
  private identifyCatalysts(
    externalEvents: ExternalEvent[],
    similarEvents: KBEntry[]
  ): Array<{ event: string; confidence: number; evidence: string[] }> {
    // Rank external events by correlation with similar historical events
    return externalEvents.map(event => {
      const matchingEvents = similarEvents.filter(e => 
        e.content.toLowerCase().includes(event.type.toLowerCase())
      );
      
      return {
        event: event.description,
        confidence: matchingEvents.length / similarEvents.length,
        evidence: matchingEvents.slice(0, 3).map(e => e.content)
      };
    }).sort((a, b) => b.confidence - a.confidence);
  }
  
  private async queryCausalChains(asset: string, catalysts: any[]): Promise<any[]> {
    // Use knowledge graph to find how catalysts typically affect this asset
    const chains = [];
    for (const catalyst of catalysts.slice(0, 3)) {
      const chain = await this.knowledgeGraph.findCausalChains({
        fromEntity: catalyst.event,
        toEntityType: 'commodity',
        maxDepth: 3
      });
      chains.push(...chain);
    }
    return chains;
  }
  
  private calculateEdge(query: CausationQuery, similarEvents: KBEntry[]): CausationAnalysis['edgeEstimate'] {
    // Look at outcomes of similar events
    const outcomes = similarEvents.filter(e => e.metadata.outcome);
    
    if (outcomes.length === 0) {
      return {
        magnitude: 0,
        direction: 'neutral',
        confidence: 0,
        reasoning: 'No similar events in KB'
      };
    }
    
    const avgEdge = outcomes.reduce((sum, e) => sum + (e.metadata.edge || 0), 0) / outcomes.length;
    const winRate = outcomes.filter(e => e.metadata.outcome === 'correct').length / outcomes.length;
    
    return {
      magnitude: avgEdge,
      direction: query.priceMove.magnitude > 0 ? 'up' : 'down',
      confidence: winRate,
      reasoning: `Based on ${outcomes.length} similar events with ${Math.round(winRate * 100)}% win rate. Average edge: ${Math.round(avgEdge * 100)}%`
    };
  }
  
  private generateRecommendation(
    edgeEstimate: CausationAnalysis['edgeEstimate'],
    catalysts: any[]
  ): CausationAnalysis['recommendation'] {
    if (edgeEstimate.confidence > 0.7 && edgeEstimate.magnitude > 0.1) {
      return {
        action: 'predict',
        rationale: `High confidence (${Math.round(edgeEstimate.confidence * 100)}%) edge detected: ${Math.round(edgeEstimate.magnitude * 100)}%`,
        urgency: 'immediate'
      };
    } else if (edgeEstimate.confidence > 0.5) {
      return {
        action: 'monitor',
        rationale: 'Moderate confidence, wait for more confirmation',
        urgency: 'hours'
      };
    } else {
      return {
        action: 'dismiss',
        rationale: 'Low confidence or no clear edge',
        urgency: 'days'
      };
    }
  }
}
```

---

## WEEK 3: MOCK TESTING

### Test Data Setup

```typescript
// tests/mock-data/biotech-mocks.ts

export const mockBiotechData = {
  events: [
    {
      id: 'event-001',
      content: 'Drug X-305 PDUFA date approaching: March 15, 2024. Phase 3 data showed 94% efficacy. Market price: 42¢ YES.',
      metadata: {
        type: 'event',
        domain: 'biotech',
        asset: 'X-305',
        timestamp: 1700000000
      }
    },
    {
      id: 'event-002',
      content: 'FDA Advisory Committee voted 12-1 in favor of X-305. Strong endorsement.',
      metadata: {
        type: 'event',
        domain: 'biotech',
        asset: 'X-305',
        timestamp: 1705000000
      }
    }
  ],
  
  predictions: [
    {
      id: 'pred-001',
      content: 'Predicted YES on X-305 approval. Rationale: Strong Phase 3, favorable adcom, PDUFA near.',
      metadata: {
        type: 'prediction',
        domain: 'biotech',
        asset: 'X-305',
        timestamp: 1706000000,
        outcome: 'correct',
        edge: 0.26
      }
    },
    {
      id: 'pred-002',
      content: 'Predicted YES on Y-102 approval. Rationale: Similar setup to X-305.',
      metadata: {
        type: 'prediction',
        domain: 'biotech',
        asset: 'Y-102',
        timestamp: 1707000000,
        outcome: 'correct',
        edge: 0.18
      }
    },
    {
      id: 'pred-003',
      content: 'Predicted NO on Z-440 approval. Rationale: Weak Phase 2, safety concerns.',
      metadata: {
        type: 'prediction',
        domain: 'biotech',
        asset: 'Z-440',
        timestamp: 1708000000,
        outcome: 'incorrect',
        edge: -0.15
      }
    }
  ],
  
  patterns: [
    {
      id: 'pattern-001',
      content: 'FDA PDUFA approaching within 7 days with no price movement typically results in 15-20% volatility. Historical base rate: 68% approval. When adcom is favorable (>10-1 vote), approval rate increases to 85%.',
      metadata: {
        type: 'pattern',
        domain: 'biotech',
        asset: 'generic_biotech',
        timestamp: 1710000000
      }
    }
  ]
};

// Test query
const testQuery: CausationQuery = {
  asset: 'A-999',
  priceMove: { magnitude: 0.02, timeframe: '24h' },
  domain: 'biotech',
  currentMarketPrice: 0.38,
  externalEvents: [
    { type: 'adcom', description: 'FDA Advisory Committee voted 11-2 in favor', timestamp: Date.now() },
    { type: 'pdufa', description: 'PDUFA date in 5 days', timestamp: Date.now() }
  ]
};

// Expected output
const expectedAnalysis: CausationAnalysis = {
  primaryCatalyst: {
    event: 'FDA Advisory Committee voted 11-2 in favor',
    confidence: 0.92,
    evidence: ['FDA Advisory Committee voted 12-1 in favor of X-305']
  },
  historicalMatches: [
    { event: 'X-305 approval', date: '2024-03-15', outcome: 'Approved', yourPrediction: 'correct' },
    { event: 'Y-102 approval', date: '2024-04-20', outcome: 'Approved', yourPrediction: 'correct' }
  ],
  edgeEstimate: {
    magnitude: 0.22,
    direction: 'up',
    confidence: 0.78,
    reasoning: 'Based on 2 similar events with 100% win rate. Average edge: 22%. Adcom vote pattern matches historical winners.'
  },
  recommendation: {
    action: 'predict',
    rationale: 'High confidence (78%) edge detected: 22%',
    urgency: 'immediate'
  }
};
```

### Validation Tests

```typescript
// tests/causation-engine.test.ts

describe('KB Causation Engine', () => {
  let engine: CausationEngine;
  
  beforeAll(async () => {
    // Load mock data
    await seedMockData();
    engine = new CausationEngine(vectorStore, knowledgeGraph, patternExtractor);
  });
  
  test('identifies correct catalyst for biotech event', async () => {
    const analysis = await engine.analyze(testQuery);
    
    expect(analysis.primaryCatalyst.event).toContain('Advisory Committee');
    expect(analysis.primaryCatalyst.confidence).toBeGreaterThan(0.8);
  });
  
  test('finds similar historical events', async () => {
    const analysis = await engine.analyze(testQuery);
    
    expect(analysis.historicalMatches.length).toBeGreaterThan(0);
    expect(analysis.historicalMatches[0].yourPrediction).toBe('correct');
  });
  
  test('calculates edge from historical performance', async () => {
    const analysis = await engine.analyze(testQuery);
    
    expect(analysis.edgeEstimate.magnitude).toBeGreaterThan(0.1);
    expect(analysis.edgeEstimate.confidence).toBeGreaterThan(0.5);
  });
  
  test('recommends action based on edge', async () => {
    const analysis = await engine.analyze(testQuery);
    
    expect(['predict', 'monitor', 'dismiss']).toContain(analysis.recommendation.action);
  });
});
```

---

## INTEGRATION: SCANNER INTERFACE

Once KB engine works with mock data, scanners feed into it:

```typescript
// How a scanner uses the KB engine

class CommodityScanner {
  constructor(private kbEngine: CausationEngine) {}
  
  async scan(market: PolymarketMarket): Promise<Alert | null> {
    // 1. Get raw data
    const inventoryData = await fetchEIAData();
    const priceData = await fetchPriceData(market.asset);
    
    // 2. Build causation query
    const query: CausationQuery = {
      asset: market.asset,
      priceMove: {
        magnitude: priceData.change24h,
        timeframe: '24h'
      },
      domain: 'commodities',
      currentMarketPrice: market.yesPrice,
      externalEvents: inventoryData.events
    };
    
    // 3. Ask KB: Why did this happen? What's the edge?
    const analysis = await this.kbEngine.analyze(query);
    
    // 4. Generate alert if edge detected
    if (analysis.recommendation.action === 'predict') {
      return {
        type: 'kb_causation',
        severity: analysis.edgeEstimate.confidence > 0.8 ? 'critical' : 'high',
        title: `${market.asset}: ${analysis.primaryCatalyst.event}`,
        description: analysis.edgeEstimate.reasoning,
        edge: analysis.edgeEstimate.magnitude,
        metadata: {
          catalyst: analysis.primaryCatalyst,
          historicalMatches: analysis.historicalMatches,
          recommendation: analysis.recommendation
        }
      };
    }
    
    return null;
  }
}
```

---

## FILE STRUCTURE

```
packages/kb-engine/
├── src/
│   ├── index.ts                    # Main export
│   ├── vector-store.ts             # Pinecone/Weaviate wrapper
│   ├── knowledge-graph.ts          # Neo4j graph operations
│   ├── pattern-extractor.ts        # Auto-extract from history
│   ├── causation-engine.ts         # Core query interface
│   └── types.ts                    # All interfaces
├── tests/
│   ├── mock-data/                  # Test fixtures
│   │   ├── biotech-mocks.ts
│   │   ├── commodity-mocks.ts
│   │   └── crypto-mocks.ts
│   └── causation-engine.test.ts    # Validation suite
└── README.md                       # Usage examples
```

---

## SUCCESS CRITERIA (Week 3)

- [ ] Vector store stores/retrieves embeddings correctly
- [ ] Knowledge graph links entities and finds causal chains
- [ ] Pattern extractor identifies patterns from mock predictions
- [ ] Causation engine returns analysis with >80% accuracy on mock tests
- [ ] Edge calculation matches expected values
- [ ] Ready for real scanner integration

---

## IMMEDIATE START

**Today:**
1. Set up Pinecone/Weaviate account
2. Create vector store schema
3. Seed with mock biotech data

**Tomorrow:**
1. Build query interface
2. Test semantic search
3. Validate similarity matching

Want me to write the seeding script with your actual historical predictions? Or should we use generic mock data first?
