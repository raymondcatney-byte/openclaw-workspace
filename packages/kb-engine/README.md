# KB Causation Engine

**Knowledge Base engine for CIPHER prediction market intelligence.**

Answers: *"Why did the price move? What's the edge?"*

## Core Concept

Traditional systems tell you prices moved. The KB engine tells you **why** by:
1. Matching current events to historical patterns
2. Calculating edge from your past predictions
3. Identifying the primary catalyst vs noise

## Quick Start

```typescript
import { createKBEngine } from '@cipher/kb-engine';

const { vectorStore, causationEngine } = createKBEngine();

// Seed with your prediction history
await vectorStore.storeBatch(yourHistoricalPredictions);

// Analyze a price move
const analysis = await causationEngine.analyze({
  asset: 'X-305',
  priceMove: { magnitude: 0.15, timeframe: '24h' },
  domain: 'biotech',
  currentMarketPrice: 0.42,
  externalEvents: [
    { 
      type: 'adcom', 
      description: 'FDA Advisory Committee voted 12-1 in favor',
      timestamp: Date.now(),
      significance: 0.9
    }
  ]
});

console.log(analysis.recommendation.action); // 'predict' | 'monitor' | 'dismiss'
console.log(analysis.edgeEstimate.magnitude); // Expected edge: 0.12 = 12%
```

## API Reference

### `CausationEngine.analyze(query)`

Returns structured analysis of a price movement:

```typescript
interface CausationAnalysis {
  primaryCatalyst: {
    event: string;           // "adcom: FDA Advisory Committee voted 12-1 in favor"
    confidence: number;      // 0-1
    evidence: string[];      // Historical matches
  };
  contributingFactors: Array<{
    factor: string;
    weight: number;
  }>;
  historicalMatches: Array<{
    event: string;
    date: string;
    outcome: 'Success' | 'Failure';
    edge?: number;
  }>;
  edgeEstimate: {
    magnitude: number;       // Expected edge (0.12 = 12%)
    direction: 'up' | 'down' | 'neutral';
    confidence: number;      // Based on win rate of similar events
    reasoning: string;       // Human-readable explanation
  };
  recommendation: {
    action: 'predict' | 'monitor' | 'dismiss';
    rationale: string;
    urgency: 'immediate' | 'hours' | 'days';
  };
}
```

### Recommendation Logic

| Condition | Action | Urgency |
|-----------|--------|---------|
| Edge > 10% + Confidence > 60% + Strong Catalyst | `predict` | immediate |
| Edge 5-10% OR Moderate Confidence | `monitor` | hours |
| Edge < 5% OR Low Confidence | `dismiss` | days |

### `PatternExtractor.extractPatterns()`

Discovers patterns from your correct predictions:

```typescript
const patterns = await patternExtractor.extractPatterns({
  domain: 'biotech',
  minPredictions: 3,
  minWinRate: 0.6
});

// Returns:
// {
//   pattern: "FDA approval with favorable adcom vote",
//   confidence: 0.85,
//   supportingEvidence: { predictions: 5, correctPredictions: 4, avgEdge: 0.18 },
//   conditions: ["adcom vote >10-1", "PDUFA within 14 days"],
//   expectedOutcome: "85% win rate with 18% avg edge"
// }
```

## Data Model

### KBEntry Types

```typescript
type KBEntryType = 'pattern' | 'event' | 'prediction' | 'outcome';

interface KBEntry {
  id: string;
  content: string;  // Human-readable description
  metadata: {
    type: KBEntryType;
    domain: 'biotech' | 'geopolitics' | 'commodities' | 'crypto' | 'ai' | ...;
    asset: string;
    timestamp: number;
    outcome?: 'correct' | 'incorrect' | 'pending';
    edge?: number;  // Actual edge captured (for outcomes)
    tags?: string[];
  };
}
```

### Example Entries

```typescript
// Pattern
{
  id: 'pattern-bio-001',
  content: 'FDA PDUFA approaching with favorable adcom vote. 85% approval rate.',
  metadata: { type: 'pattern', domain: 'biotech', asset: 'generic', timestamp: Date.now() }
}

// Your prediction
{
  id: 'pred-001',
  content: 'Predicted YES on X-305. Strong Phase 3, favorable adcom.',
  metadata: { 
    type: 'prediction', 
    domain: 'biotech', 
    asset: 'X-305',
    outcome: 'correct',
    edge: 0.26 
  }
}

// External event
{
  id: 'event-001',
  content: 'FDA Advisory Committee voted 12-1 in favor of X-305 approval.',
  metadata: { type: 'event', domain: 'biotech', asset: 'X-305', timestamp: Date.now() }
}
```

## Testing

```bash
cd packages/kb-engine
node tests/test-runner.js
```

## Architecture Notes

- **Vector Store**: In-memory with cosine similarity (swap for Pinecone/Weaviate in prod)
- **Embeddings**: Simple word hashing (swap for OpenAI embeddings in prod)
- **Pattern Extraction**: Groups similar predictions, extracts common conditions
- **Edge Calculation**: `avg_edge * win_rate` (conservative estimate)

## Integration Flow

```
Domain Scanner (EIA/FDA/Glassnode)
         ↓
    ExternalEvent
         ↓
CausationEngine.analyze()
         ↓
    [Similar patterns?]
         ↓
    [Calculate edge]
         ↓
    [Generate alert?]
         ↓
   Alert → Bruce/Makaveli
```

## Next Steps

1. Seed with your historical predictions
2. Connect to real data sources
3. Track predicted vs actual edge
4. Iterate on pattern extraction
