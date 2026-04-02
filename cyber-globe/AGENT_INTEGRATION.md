# Agentic Integration Guide

## Overview
Your dashboard now has agentic capabilities while remaining 100% free and client-side (mostly).

## Architecture

### 1. Browser Agent (lib/agent-core.ts)
- **Runs entirely in browser** using localStorage for memory
- **Groq API** for LLM reasoning (free tier, fast)
- **Autonomous mode** checks every 5 minutes
- **Manual mode** for on-demand analysis

### 2. Vercel Cron (vercel.json + api/agent-cron)
- **Scheduled tasks** every 5 minutes
- **Runs on edge** (fast, included in free tier)
- **Scans**: Polymarket, yields, market data

### 3. GitHub Actions (.github/workflows/agent-tasks.yml)
- **Heavy processing** offloaded from browser
- **2,000 free minutes/month**
- **Runs**: Deep analysis, correlations, reports

## Setup Instructions

### 1. Environment Variables
Add to Vercel:
```
NEXT_PUBLIC_GROQ_API_KEY=your_groq_key_here
CRON_SECRET=random_string_for_cron_auth
```

### 2. Enable GitHub Actions
- Push the `.github/workflows/agent-tasks.yml` file
- Actions will start running automatically
- Check "Actions" tab in GitHub repo

### 3. Integrate Components

```tsx
// In your main layout or dashboard page
import { AgentControlPanel } from '@/components/AgentControlPanel';

// Add to sidebar or dedicated "Agent" tab
<AgentControlPanel />
```

## How It Works

### User Experience
1. **Dashboard loads** → AgentControlPanel shows current goals, memory
2. **User enables Auto** → Agent checks every 5 min, logs observations
3. **User asks question** → Agent thinks, uses tools, logs result
4. **Memory persists** → Across sessions in localStorage

### Agent Capabilities
- ✅ Log observations (market moves, geopolitical events)
- ✅ Set goals and priorities
- ✅ Query Polymarket, CoinGecko
- ✅ Remember context across conversations
- ✅ Run autonomously in background

### Vercel Cron Capabilities
- ✅ Scheduled data collection
- ✅ High-confidence Polymarket alerts
- ✅ Yield opportunity scans
- ✅ Market health checks

### GitHub Actions Capabilities
- ✅ Deep research (1x/day)
- ✅ Multi-source correlation
- ✅ Generate reports
- ✅ Archive data for analysis

## Free Tier Limits

| Service | Limit | Your Usage |
|---------|-------|------------|
| Groq API | 1M tokens/day (generous) | ~10k/day |
| Vercel Cron | 10 cron jobs | 2 |
| Vercel API Routes | 100GB bandwidth | ~1GB/month |
| GitHub Actions | 2,000 min/month | ~60 min/month |

## Monetization Path

Once this is working:

1. **Premium tier**: Earlier agent signals (from Vercel Cron)
2. **Daily briefing**: GitHub Actions generates report, emails subscribers
3. **Agent API**: Others pay to use your agent's insights
4. **Auto-trading**: Agent signals → execute trades (future)

## Next Steps

1. **Test the agent**: Click "Run Analysis" in AgentControlPanel
2. **Enable autonomous**: Toggle Auto mode, leave tab open
3. **Check GitHub Actions**: Verify workflows running
4. **Add more tools**: Extend AGENT_TOOLS in lib/agent-core.ts

## Files Created

- `lib/agent-core.ts` - Agent brain + memory
- `components/AgentControlPanel.tsx` - UI controls
- `app/api/agent-cron/route.ts` - Scheduled tasks
- `vercel.json` - Cron configuration
- `.github/workflows/agent-tasks.yml` - Heavy processing
