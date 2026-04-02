# Health & Biotech Research Agent

A comprehensive health research interface combining:
- **Live web research** (web-search-pro pattern)
- **Vector memory** (elite-longterm-memory pattern)
- **Knowledge graph** (graphiti pattern for interactions)
- **Academic deep research** (multi-cycle literature review)

## Architecture

```
app/
├── api/
│   ├── research/route.ts          # Web search + synthesis
│   ├── protocol/route.ts          # Personal protocol consultation
│   └── memory/route.ts            # Store/query past interactions
├── research/page.tsx              # General health/biotech research
├── protocol/page.tsx              # Personal protocol (Wayne Protocol)
lib/
├── skills/
│   ├── web-search.ts              # web-search-pro implementation
│   ├── vector-memory.ts           # elite-longterm-memory implementation
│   └── knowledge-graph.ts         # graphiti-style interactions
├── knowledge/
│   ├── supplement-interactions.ts # Drug/supplement contraindications
│   └── medical-sources.ts         # Trusted source weighting
└── search/
    ├── academic-search.ts         # PubMed, arXiv, etc.
    └── synthesis.ts               # Multi-source synthesis
```

## Data Sources

| Source | Type | Use Case |
|--------|------|----------|
| Examine.com | Supplement research | Evidence-based supplement info |
| PubMed | Academic papers | Clinical trials, mechanisms |
| FDA | Regulatory | Drug approvals, safety alerts |
| WHO | Guidelines | Global health recommendations |

## Environment Variables

```bash
# Required
GROQ_API_KEY=                # LLM inference
PINECONE_API_KEY=            # Vector memory
PINECONE_INDEX=              # Memory index name
NEO4J_URI=                   # Knowledge graph
NEO4J_USER=
NEO4J_PASSWORD=

# Optional
OPENAI_API_KEY=              # Fallback embeddings
BRAVE_API_KEY=               # Web search (alternative)
```

## Deployment

```bash
npm install
npm run build
vercel --prod
```

## Usage Modes

### 1. Research Mode (`/research`)
Ask any health/biotech question. Agent performs:
1. Web search for latest research
2. Synthesis with knowledge graph
3. Confidence scoring
4. Citation-backed response

### 2. Protocol Mode (`/protocol`)
Personal protocol consultation:
1. Biomarker parsing
2. Personal history lookup (memory)
3. Interaction checking (graph)
4. Tailored recommendation

## Memory System

Stores:
- Query → Response → Outcome
- Source reliability scores
- Personal response patterns
- Supplement/drug interactions observed

## Knowledge Graph

Nodes: Supplements, Drugs, Conditions, Mechanisms
Edges: interacts_with, contraindicated_for, treats, affects

Example query: "Can I take NMN with metformin?"
→ Traverses graph: NMN → [affects] → NAD+ → [interacts_with] → Metformin
→ Returns: Mechanism + clinical evidence + confidence