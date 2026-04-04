# Biotech Protocol Tab

**Biohacking research, compound database, and intelligence dashboard.**

Cloud-native architecture — all data from free-tier external APIs, no localhost dependencies.

## Features

### 1. Research Feed
- **Europe PMC API** — 40M+ biomedical papers
- **ClinicalTrials.gov** — 400K+ active trials
- Auto-categorized: Longevity, Gene Therapy, Nootropics, Clinical
- AI summaries (Groq)

### 2. Compound Lookup
- **PubChem API** — 110M+ chemical structures
- **FDA API** — Drug labels and approvals
- Molecular visualization (client-side RDKit)
- AI mechanism summaries

### 3. Intelligence Dashboard
- **Reddit** — r/longevity, r/Biohackers hot posts
- **RSS** — FierceBiotech, Longevity.Tech feeds
- **Patents** — USPTO longevity filings
- Sentiment analysis

## Architecture

```
Next.js 14 App Router (Vercel Edge)
├── app/biotech/
│   ├── api/research      → Europe PMC + ClinicalTrials.gov
│   ├── api/compounds     → PubChem + Groq AI
│   ├── api/intelligence  → Reddit + RSS + Patents
│   ├── app/page.tsx      → Main dashboard
│   └── lib/api-clients.ts
├── Neon Postgres         → Caching layer
└── Upstash Redis         → Rate limiting
```

## External APIs (All Free Tier)

| Source | Endpoint | Limit |
|--------|----------|-------|
| Europe PMC | `https://www.ebi.ac.uk/europepmc/webservices/rest/` | No limit |
| ClinicalTrials.gov | `https://clinicaltrials.gov/api/v2/` | No limit |
| PubChem | `https://pubchem.ncbi.nlm.nih.gov/rest/pug/` | 5 req/sec |
| Reddit | `https://www.reddit.com/r/{sub}/hot.json` | 30 req/min |
| USPTO Patents | `https://search.patentsview.org/api/v1/` | 45 req/min |
| Groq AI | `https://api.groq.com/openai/v1/` | 1M tokens/day |

## Environment Variables

```bash
# Database (Neon Postgres)
DATABASE_URL="postgresql://user:pass@ep-xyz.us-east-1.aws.neon.tech/dbname?sslmode=require"

# Cache (Upstash Redis)
UPSTASH_REDIS_REST_URL="https://your-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# AI Summarization (Optional)
GROQ_API_KEY="gsk_..."
```

## Deployment

### 1. Database Setup (Neon)
```bash
# Connect to Neon and run schema
psql $DATABASE_URL -f app/biotech/schema.sql
```

### 2. Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or use GitHub integration:
1. Push to GitHub
2. Import on vercel.com
3. Add environment variables
4. Deploy

## API Routes

| Endpoint | Description |
|----------|-------------|
| `GET /biotech/api/research?type=papers&q=longevity` | Research papers |
| `GET /biotech/api/research?type=trials&category=recruiting` | Clinical trials |
| `GET /biotech/api/compounds?name=Metformin` | Compound lookup |
| `POST /biotech/api/compounds?action=summarize` | AI summarization |
| `GET /biotech/api/intelligence?type=reddit` | Intelligence feed |

## UI Features

- Cyberpunk dark theme (slate/emerald palette)
- Tabbed interface: Research / Compounds / Intelligence
- Paper cards with AI summaries
- Trial status indicators (recruiting/active/completed)
- Compound structure viewer
- Reddit/News/Patent unified feed

## Rate Limiting

Redis-backed rate limiting configured per source:
- Europe PMC: 100 req/min (no actual limit, just courtesy)
- PubChem: 5 req/sec
- Reddit: 30 req/min
- USPTO: 45 req/min

## Caching Strategy

| Data Type | Cache Duration |
|-----------|---------------|
| Research papers | 1 hour |
| Clinical trials | 30 minutes |
| Compound data | 24 hours |
| Intelligence feed | 10 minutes |

## Future Enhancements

- [ ] Vector search for papers (Pinecone)
- [ ] 3D molecule viewer (NGLView)
- [ ] Drug interaction checker
- [ ] Personal protocol builder
- [ ] Push notifications for trials

## License

MIT
