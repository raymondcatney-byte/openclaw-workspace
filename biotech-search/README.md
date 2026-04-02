# Biotech Search Engine

Free, serverless biotech search engine aggregating PubMed, ChEMBL, Wikidata, USDA, and ClinicalTrials.gov.

## Features

- **Multi-source search**: Query across 5 major biomedical databases simultaneously
- **Zero cost**: Uses only free APIs and Vercel's free tier
- **Edge-deployed**: Global low-latency via Vercel Edge Functions
- **Cached**: Smart caching reduces API calls and improves speed
- **CORS-free**: Wrapper handles APIs that don't support browser CORS

## Data Sources

| Source | Data Type | CORS | Requires Key |
|--------|-----------|------|--------------|
| PubMed | Research papers | ❌ | No |
| ChEMBL | Molecules, bioactivity | ✅ | No |
| Wikidata | Knowledge graph | ✅ | No |
| USDA | Nutrition data | ❌ | Yes (free) |
| ClinicalTrials.gov | Clinical trials | ✅ | No |

## Setup

1. **Clone and install:**
```bash
git clone <your-repo>
cd biotech-search
npm install
```

2. **Set environment variables (optional):**
```bash
# For USDA nutrition data (get free key at https://fdc.nal.usda.gov/api-key-signup.html)
USDA_API_KEY=your_key_here
```

3. **Deploy to Vercel:**
```bash
npm i -g vercel
vercel --prod
```

## API Usage

### Search All Sources
```bash
POST /api/biotech/search
Content-Type: application/json

{
  "query": "caffeine",
  "category": "all",
  "limit": 20
}
```

### Search Wikidata Only
```bash
POST /api/biotech/wikidata
Content-Type: application/json

{
  "queryType": "nootropics"
}
```

### Get ChEMBL Molecule Details
```bash
GET /api/biotech/chembl/CHEMBL1946170
```

## Cost

**$0/month** on Vercel Free Tier:
- 1,000,000 Edge Function executions
- 1,000 GB-hours execution time
- 100 GB bandwidth

## Architecture

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Browser   │────▶│  Vercel Edge    │────▶│   PubMed API    │
│             │◀────│  (CORS + Cache) │◀────│   (no CORS)     │
└─────────────┘     └─────────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌─────────────────┐
                    │  ChEMBL API     │
                    │  (cached)       │
                    └─────────────────┘
```
