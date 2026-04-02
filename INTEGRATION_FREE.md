# MAKAVELI FREE DARK SIGNALS - INTEGRATION GUIDE

## Quick Start (5 Minutes)

### 1. Install
```bash
cd /path/to/your/makaveli/app
npm install telegram dotenv
```

### 2. Get Telegram API Credentials (Free)
1. Go to https://my.telegram.org/apps
2. Log in with your phone number
3. Click "API development tools"
4. Create new application (any name works)
5. Copy **api_id** and **api_hash**

### 3. Environment Variables
```bash
# Add to your .env file
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=your_hash_here
TELEGRAM_SESSION=      # Leave empty, will be generated
```

### 4. First Run (Interactive)
```bash
npx tsx makaveli-free-dark-signals.ts
```

This will:
- Connect to Telegram
- Ask for your phone number
- Send you a login code
- Generate a session string
- **Save the session string to your .env file**

### 5. Integration Code

Add this to your existing Makaveli app:

```typescript
// makaveli-enhanced.ts
import { FreeDarkSignalsFeed } from './makaveli-free-dark-signals';

async function enhancedMakaveliAnalysis(scenario: string) {
  
  // 1. Your existing Groq search
  const webData = await groqWebSearch(scenario);
  
  // 2. NEW: Collect free dark signals
  const darkSignals = await collectFreeDarkSignals(scenario);
  
  // 3. Build enhanced prompt
  const enhancedPrompt = `
# SCENARIO: ${scenario}

## WEB INTELLIGENCE (via Groq API)
${formatWebData(webData)}

## DARK SIGNALS INTELLIGENCE (Free Sources)
${formatDarkSignalsForMakaveli(darkSignals)}

## ANALYSIS INSTRUCTIONS
Analyze using BOTH intelligence layers. 
Note contradictions between official narratives (web) and ground truth (dark signals).

Provide standard Makaveli output format.
`;

  // 4. Send to Groq
  return await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: enhancedPrompt }]
  });
}

async function collectFreeDarkSignals(scenario: string) {
  const feed = new FreeDarkSignalsFeed();
  return await feed.generateReport(scenario);
}

function formatDarkSignalsForMakaveli(signals: any): string {
  return `
### TELEGRAM GROUND TRUTH (Persian Channels)
- Messages analyzed: ${signals.sources.telegram.summary?.messagesAnalyzed || 'N/A'}
- Dominant sentiment: ${signals.sources.telegram.summary?.dominantSentiment || 'unknown'}
- Sentiment distribution: ${JSON.stringify(signals.sources.telegram.summary?.sentimentDistribution || {})}
- Top topics: ${signals.sources.telegram.topTopics?.map((t: any) => `${t.topic}(${t.count})`).join(', ')}
- Viral claims: ${signals.sources.telegram.viralMessages?.length || 0}

### INFRASTRUCTURE STATUS (DNS/RIPE Atlas)
${signals.sources.infrastructure.dnsTests?.map((t: any) => 
  `- ${t.domain}: ${t.status}${t.responseTime ? ` (${t.responseTime}ms)` : ''}`
).join('\n')}

Interpretation: ${signals.sources.infrastructure.interpretation}

### MARITIME/AIS (Open Data)
${signals.sources.ais.sources?.length ? 
  signals.sources.ais.sources.map((s: any) => 
    `- ${s.source}: ${s.vesselCount} vessels tracked`
  ).join('\n') : 
  '- AIS data not available (optional)'
}

### SANCTIONS STATUS (Public Data)
- OFAC SDN: ${signals.sources.sanctions.ofac?.iranRelatedEntries || 'N/A'} Iran entries
- FATF: ${signals.sources.sanctions.fatf?.status || 'N/A'}
`;
}
```

### 6. Schedule Automatic Collection

```bash
# Add to crontab (runs every 30 minutes)
crontab -e

# Add this line:
*/30 * * * * cd /path/to/your/app && npx tsx makaveli-free-dark-signals.ts >> cron.log 2>&1
```

Or use the built-in scheduler:

```typescript
// scheduler.ts
import { FreeDarkSignalsFeed } from './makaveli-free-dark-signals';

async function runScheduler() {
  const feed = new FreeDarkSignalsFeed();
  
  // Collect every 30 minutes
  setInterval(async () => {
    console.log('[' + new Date().toISOString() + '] Collecting dark signals...');
    await feed.generateReport('Iran Conflict');
  }, 30 * 60 * 1000);
  
  // Run immediately
  await feed.generateReport('Iran Conflict');
}

runScheduler();
```

## What You Get (Free)

| Source | Data | Update Frequency |
|--------|------|------------------|
| **Telegram** | Persian sentiment, viral messages, topic trends | Real-time |
| **DNS/RIPE** | Iranian infrastructure health | Every 30 min |
| **AIS/Marine** | Persian Gulf vessel tracking | Hourly (if API key) |
| **OFAC/FATF** | Sanctions status | Daily |

## Example Output

```json
{
  "scenario": "Iran Conflict",
  "timestamp": "2026-03-17T15:30:00Z",
  "sources": {
    "telegram": {
      "status": "active",
      "summary": {
        "channelsMonitored": 5,
        "messagesAnalyzed": 1247,
        "dominantSentiment": "fearful",
        "sentimentDistribution": {
          "fearful": 523,
          "defiant": 412,
          "negative": 198,
          "neutral": 89,
          "positive": 25
        }
      },
      "topTopics": [
        { "topic": "power_outages", "count": 234 },
        { "topic": "economic_crisis", "count": 189 },
        { "topic": "war_developments", "count": 156 },
        { "topic": "leadership", "count": 98 },
        { "topic": "refugees", "count": 76 }
      ]
    },
    "infrastructure": {
      "dnsTests": [
        { "domain": "irandataportal.sbiran.ir", "status": "up", "responseTime": 450 },
        { "domain": "bankmelli.ir", "status": "up", "responseTime": 2800 },
        { "domain": "sepahnews.ir", "status": "up", "responseTime": 320 },
        { "domain": "digikala.com", "status": "down" }
      ],
      "interpretation": "Government and military infrastructure online. Commercial sites degraded."
    }
  },
  "makaveliSummary": "Telegram: 1247 messages analyzed across 5 channels. Dominant sentiment: fearful. Top topics: power_outages, economic_crisis, war_developments. Infrastructure: 3/4 key domains online. Government and military infrastructure online. Commercial sites degraded. Maritime: No AIS data available. Add VESSELFINDER_API_KEY for vessel tracking. Sanctions: 847 Iran-related SDN entries. Iran on FATF grey list."
}
```

## Troubleshooting

### Telegram Connection Issues
```bash
# Reset session
rm -rf session_files/
# Re-run to get new session string
npx tsx makaveli-free-dark-signals.ts
```

### Rate Limits
- Telegram: 30 requests/second (generous)
- RIPE Atlas: No limit for public data
- DNS over HTTPS: 1000 requests/day (Cloudflare)

### Persian Text Not Displaying
```bash
# Install Persian fonts
sudo apt-get install fonts-noto-core fonts-noto-cjk  # Linux
brew install font-noto-sans  # macOS
```

## Security Notes

1. **Never commit .env file** - contains your Telegram session
2. **Session string is sensitive** - treat like a password
3. **Telegram channels are public** - no privacy issues monitoring them
4. **Your phone number** - used only for initial auth, not stored

## Customization

### Add More Telegram Channels
Edit the `channels` array in `makaveli-free-dark-signals.ts`:

```typescript
channels: [
  'manabourse_ir',      // Economic
  'irannews',           // News
  'iranprotest',        // Activist
  'YOUR_CHANNEL_HERE',  // Add your own
]
```

### Change Monitoring Frequency
```typescript
// In scheduler
setInterval(collectData, 15 * 60 * 1000);  // Every 15 minutes
```

### Filter Specific Topics
Add to `analyzeMessages()`:
```typescript
if (text.includes('mojtaba') && text.includes('dead')) {
  analysis.criticalClaims.push(msg);
}
```

## Next Steps

1. ✅ Run `npm run collect` to test
2. ✅ Integrate into your Makaveli app
3. ✅ Set up cron job for automatic collection
4. ✅ Monitor the `makaveli_intel/` directory for JSON outputs
5. ✅ Feed outputs into Makaveli prompts

## Questions?

- Telegram API: https://core.telegram.org/api
- RIPE Atlas: https://atlas.ripe.net/
- Persian channels: Search Telegram for Iran-related news
