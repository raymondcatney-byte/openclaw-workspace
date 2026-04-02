# Protocol Consultant

Wayne Protocol Consultant — Stateless protocol consultation using Groq LLM.

## Features

- **Biomarker parsing**: Extracts sleep hours, HRV, readiness, subjective state from natural language
- **Groq-powered**: Uses llama-3.3-70b-versatile for fast, deterministic responses (temperature 0.3)
- **Stateless**: No database, no logging — refresh for clean slate
- **Edge-deployed**: Vercel Edge functions for global low latency

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local and add your Groq API key
   ```

3. **Run locally:**
   ```bash
   npm run dev
   ```

4. **Deploy to Vercel:**
   ```bash
   npm run build
   vercel --prod
   ```

## Usage

Visit `/protocol` to access the consultant.

**Example inputs:**
- "Slept 5 hours, HRV 48, feel wrecked"
- "What's the hair protocol?"
- "Can I mix NMN with caffeine?"

**Response format:**
Exact dosages, timing, and rationale. No hedging, no "consult your doctor."

## Architecture

```
app/
├── api/protocol/route.ts      # Edge API → Groq
├── protocol/page.tsx          # Chat interface
├── layout.tsx                 # Root layout
└── page.tsx                   # Home/landing
lib/protocol/parser.ts         # Biomarker extraction
hooks/useProtocolConsultant.ts # React state management
types/protocol.ts              # TypeScript interfaces
```

## Protocol Rules (Hardcoded)

- Sleep <6h → Delay fasting 2h, skip caffeine, reduce training 50%
- HRV <50 or down >10% → NO sauna, mobility only, add 1g glycine
- Readiness <5 → Skip training, prioritize recovery
- "Inflamed" or sore → Add curcumin, skip ecdysterone, reduce intensity
- Poor sleep + low HRV → Skip fasting entirely
- Jet lag → 300mcg melatonin, shift meals immediately

## Tech Stack

- Next.js 14+ App Router
- TypeScript
- Tailwind CSS
- Groq API (llama-3.3-70b-versatile)
- Vercel Edge Runtime