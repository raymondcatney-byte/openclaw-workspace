# Makaveli Free Dark Signals

**Zero-cost alternative intelligence for Makaveli's geopolitical analysis.**

Feeds ground truth data that Groq API search cannot access.

## What It Does

| Source | What You Get | Cost |
|--------|--------------|------|
| **Telegram/WhatsApp** | Persian sentiment, viral rumors, ground truth | Free |
| **DNS/RIPE Atlas** | Iranian infrastructure health, outages | Free |
| **AIS Marine** | Persian Gulf vessel tracking | Free tier |
| **OFAC/FATF** | Sanctions status, financial isolation | Free |

## Quick Start

```bash
# 1. Setup
./setup.sh

# 2. Get Telegram API credentials
# → https://my.telegram.org/apps

# 3. Edit .env with your credentials

# 4. Run collection
npm run collect
```

## Example Output

```
🔮 MAKAVELI FREE DARK SIGNALS FEED
======================================================================
Scenario: Iran Conflict - March 2026
Mode: FREE TIER (Zero Cost)

📊 MAKAVELI SUMMARY
----------------------------------------------------------------------
Telegram: 1,247 messages analyzed across 5 channels. 
Dominant sentiment: fearful. 
Top topics: power_outages(234), economic_crisis(189), war_developments(156).
Infrastructure: 3/4 key domains online. 
Government and military infrastructure online. 
Sanctions: 847 Iran-related SDN entries. Iran on FATF grey list.

📱 TELEGRAM INTELLIGENCE
- Channels: 5
- Messages: 1,247
- Sentiment: { fearful: 523, defiant: 412, negative: 198, neutral: 89 }
- Top Topics:
  • power_outages: 234 mentions
  • economic_crisis: 189 mentions
  • war_developments: 156 mentions

🌐 INFRASTRUCTURE STATUS
✅ irandataportal.sbiran.ir (government): up (450ms)
⚠️ bankmelli.ir (banking): up (2800ms)
✅ sepahnews.ir (military): up (320ms)
❌ digikala.com (commerce): down
```

## Integration

Add to your Makaveli app:

```typescript
import { FreeDarkSignalsFeed } from './makaveli-free-dark-signals';

// Collect dark signals
const darkSignals = await new FreeDarkSignalsFeed().generateReport(scenario);

// Include in Makaveli prompt
const prompt = `
Web Intelligence: ${webData}
Dark Signals: ${darkSignals.makaveliSummary}

Analyze both layers...
`;
```

## File Structure

```
├── makaveli-free-dark-signals.ts   # Main collector
├── makaveli-dark-signals.ts        # Full implementation (with paid options)
├── makaveli-parallels-engine.ts    # Historical parallels (optional)
├── setup.sh                        # One-command setup
├── package.json
├── INTEGRATION_FREE.md             # Full integration guide
├── IMPLEMENTATION_GUIDE.md         # Complete architecture guide
└── makaveli_intel/                 # Output directory
    ├── dark_signals_1234567890.json
    └── latest.json
```

## Data Sources

### Telegram (MTProto API)
- **Cost**: Free
- **Setup**: API credentials from my.telegram.org
- **Channels**: Persian-language news, economic, activist
- **Data**: Sentiment, topics, viral messages, geographic mentions

### RIPE Atlas
- **Cost**: Free
- **Setup**: Optional API key
- **Data**: DNS resolution, connectivity tests, routing

### AIS/Marine
- **Cost**: Free tier (50 req/day)
- **Setup**: Optional VesselFinder API key
- **Data**: Persian Gulf vessel positions, Iranian-flagged ships

### Sanctions Data
- **Cost**: Free
- **Setup**: None
- **Data**: OFAC SDN, FATF grey list, UNSC consolidated

## Automation

```bash
# Collect every 30 minutes
crontab -e
*/30 * * * * cd /path/to/app && npm run collect >> cron.log 2>&1
```

## Security

- `.env` file contains sensitive session strings
- Never commit `.env` to git
- Telegram channels are public - monitoring is legal
- Your phone number is only for initial auth

## License

MIT - Use freely for Makaveli's intelligence needs.

## Support

For issues:
1. Check TELEGRAM_API_ID and TELEGRAM_API_HASH are set
2. Run `npm run test` to verify connections
3. Check `makaveli_intel/latest.json` for outputs
