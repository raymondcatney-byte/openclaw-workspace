# MAKAVELI DARK SIGNALS - IMPLEMENTATION GUIDE

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR MAKAVELI APP                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Groq API   │  │ Dark Signals │  │  Makaveli Synthesis  │  │
│  │  (Web/Data)  │  │   Pipeline   │  │     (Your Code)      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         └─────────────────┼──────────────────────┘              │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Telegram API │  │   RIPE Atlas  │  │  Iridium API  │
│   (MTProto)   │  │  (DNS/Infra)  │  │  (SatPhone)   │
└───────────────┘  └───────────────┘  └───────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   Swift Data  │  │   Dark Web    │  │   AIS/Marine  │
│   (Partners)  │  │  (Intel Svcs) │  │   (Orbcomm)   │
└───────────────┘  └───────────────┘  └───────────────┘
```

## Option 1: Real-Time API Integration (Production)

### Telegram/WhatsApp Intelligence
```typescript
// Using GramJS (Telegram MTProto client)
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

class RealTelegramMonitor {
  private client: TelegramClient;
  
  async connect(apiId: number, apiHash: string, session: string) {
    this.client = new TelegramClient(
      new StringSession(session),
      apiId,
      apiHash,
      { connectionRetries: 5 }
    );
    await this.client.connect();
  }
  
  async gatherIntel(channels: string[]): Promise<TelegramIntel> {
    const messages = [];
    
    for (const channel of channels) {
      const history = await this.client.getMessages(channel, { limit: 100 });
      messages.push(...history);
    }
    
    // Sentiment analysis using your existing Groq API
    const sentiment = await this.analyzeSentiment(messages);
    
    return {
      messageVolume: messages.length,
      sentimentShifts: sentiment.shifts,
      geographicClusters: this.extractLocations(messages),
      // ...
    };
  }
  
  private async analyzeSentiment(messages: any[]) {
    // Send to Groq for Persian sentiment analysis
    const prompt = `Analyze sentiment of these Persian Telegram messages...`;
    return await groq.chat.completions.create({ messages: [{ role: 'user', content: prompt }] });
  }
}
```

### Infrastructure Monitoring (RIPE Atlas)
```typescript
// Using RIPE Atlas API (free for researchers)
class RealInfrastructureMonitor {
  private apiKey: string;
  
  async gatherIntel(): Promise<InfrastructureIntel> {
    // DNS measurements from Iran
    const dnsMeasurements = await this.fetchRIPEAtlasMeasurements(
      'iran-dns-probes', 
      ['irandataportal.sbiran.ir', 'bankmelli.ir', 'sepahnews.ir']
    );
    
    // Traceroute analysis
    const routes = await this.fetchTraceroutes('iran-probes', 'international-targets');
    
    // Detect partitioning
    const partitioned = this.detectPartitioning(routes);
    
    return {
      dnsStatus: this.parseDNSStatus(dnsMeasurements),
      networkLayers: this.analyzeLayers(routes),
      anomalies: this.detectAnomalies(dnsMeasurements, routes)
    };
  }
  
  private async fetchRIPEAtlasMeasurements(probeSet: string, targets: string[]) {
    const response = await fetch(
      `https://atlas.ripe.net/api/v2/measurements/?key=${this.apiKey}`,
      {
        method: 'POST',
        body: JSON.stringify({
          definitions: targets.map(target => ({
            type: 'dns',
            target,
            probes: [{ value: probeSet, type: 'probeset' }]
          }))
        })
      }
    );
    return response.json();
  }
}
```

### Satellite Phone (Iridium/Inmarsat)
```typescript
// Requires commercial partnership with Iridium
class RealSatelliteMonitor {
  private apiKey: string;
  
  async gatherIntel(): Promise<SatellitePhoneIntel> {
    // This requires Iridium Edge Pro or partner API access
    // Not publicly available - requires government or commercial contract
    
    const data = await fetch('https://api.iridium.com/v1/terminals/activity', {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    
    return this.parseSatelliteData(data);
  }
}

// Alternative: Open satellite tracking
class PublicSatelliteMonitor {
  async gatherIntel(): Promise<Partial<SatellitePhoneIntel>> {
    // MarineTraffic or VesselFinder for maritime sat terminals
    // Only works for vessels broadcasting AIS + satphone correlation
    
    const vessels = await fetch('https://api.marinetraffic.com/vessels/iran-flagged');
    const satActivity = this.correlateAISWithSatphone(vessels);
    
    return { maritimeTerminalsActive: satActivity.count };
  }
}
```

### SWIFT Data (Commercial Intelligence)
```typescript
// Requires subscription to SWIFT data providers
// Options: Refinitiv, IHS Markit, or Bloomberg

class RealSwiftMonitor {
  private refinitivKey: string;
  
  async gatherIntel(): Promise<SwiftIntel> {
    // SWIFT message data (anonymized/aggregated)
    const data = await fetch('https://api.refinitiv.com/swift/v1/messages', {
      headers: { 'X-API-Key': this.refinitivKey },
      body: JSON.stringify({
        corridors: ['IR-CN', 'IR-RU', 'IR-TR'],
        timeframe: '7d',
        aggregation: 'daily'
      })
    });
    
    return this.parseSwiftData(data);
  }
}

// Alternative: Public sanctions tracking
class PublicSwiftMonitor {
  async gatherIntel(): Promise<Partial<SwiftIntel>> {
    // OFAC SDN list changes
    const sanctions = await fetch('https://www.treasury.gov/ofac/downloads/sdnlist.txt');
    
    // FATF reports
    const fatf = await fetch('https://www.fatf-gafi.org/publications/high-risk-and-other-monitored-jurisdictions.html');
    
    return this.parsePublicSanctionsData(sanctions, fatf);
  }
}
```

### Dark Web (Commercial Intelligence Services)
```typescript
// Options: Flashpoint, Recorded Future, Mandiant

class RealDarkWebMonitor {
  private flashpointKey: string;
  
  async gatherIntel(): Promise<DarkWebIntel> {
    const [leaks, chatter, cyber] = await Promise.all([
      this.fetchFlashpointLeaks(),
      this.fetchFlashpointChatter(),
      this.fetchFlashpointCyber()
    ]);
    
    return {
      documentLeaks: leaks,
      chatter: chatter,
      cyberActivity: cyber
    };
  }
  
  private async fetchFlashpointLeaks() {
    const response = await fetch('https://api.flashpoint.io/intelligence/leaks', {
      headers: { 'Authorization': `Bearer ${this.flashpointKey}` },
      body: JSON.stringify({
        query: 'iran OR irgc OR mojtaba',
        timeframe: '7d',
        confidence: 'medium'
      })
    });
    return response.json();
  }
}

// Alternative: Public dark web monitoring
class PublicDarkWebMonitor {
  async gatherIntel(): Promise<Partial<DarkWebIntel>> {
    // Ransomware tracker sites (public)
    const ransomTracker = await fetch('https://ransomwatch.telemetry.ltd/');
    
    // Cryptocurrency tracking (public APIs)
    const bitcoinFlows = await fetch('https://api.blockchain.info/charts/n-transactions?timespan=7days');
    
    return this.parsePublicDarkWebData(ransomTracker, bitcoinFlows);
  }
}
```

## Option 2: Hybrid Approach (Recommended)

Combine free/public sources with selective commercial feeds:

```typescript
class HybridDarkSignalsFeed {
  private telegram = new RealTelegramMonitor();      // Free (Telegram API)
  private infrastructure = new RealInfrastructureMonitor(); // Free (RIPE Atlas)
  private satellite = new PublicSatelliteMonitor();  // Free (AIS correlation)
  private swift = new PublicSwiftMonitor();          // Free (OFAC/FATF)
  private darkWeb = new RealDarkWebMonitor();        // PAID (Flashpoint ~$2k/mo)
  
  async generateReport(scenario: string): Promise<DarkSignalsReport> {
    const [telegram, infra, sat, swift, dark] = await Promise.all([
      this.telegram.gatherIntel(TEHRAN_CHANNELS),
      this.infrastructure.gatherIntel(),
      this.satellite.gatherIntel(),
      this.swift.gatherIntel(),
      this.darkWeb.gatherIntel().catch(() => null) // Optional
    ]);
    
    return {
      telegramIntel: telegram,
      infrastructureIntel: infra,
      satellitePhoneIntel: sat,
      swiftIntel: swift,
      darkWebIntel: dark || { lastScrape: new Date().toISOString(), marketsMonitored: [] }
    };
  }
}
```

## Option 3: Simple Integration (Start Here)

If you want to test the concept first:

```typescript
// In your existing Makaveli app

interface MakaveliContext {
  webSearchResults: any[];        // Existing Groq search
  darkSignals?: DarkSignalsReport; // New
}

async function enhanceMakaveliPrompt(scenario: string): Promise<string> {
  // 1. Your existing Groq search
  const webData = await groqWebSearch(scenario);
  
  // 2. NEW: Fetch dark signals
  const darkSignals = await fetchDarkSignals(scenario);
  
  // 3. Build enhanced prompt
  return `
# SCENARIO: ${scenario}

## WEB INTELLIGENCE (via Groq API)
${formatWebData(webData)}

## DARK SIGNALS INTELLIGENCE
${formatDarkSignals(darkSignals)}

## YOUR TASK
Analyze this scenario using the combined intelligence above.
Pay special attention to gaps between official narratives (web) and ground truth (dark signals).

Provide your analysis in standard Makaveli format:
1. Executive Assessment
2. Strategic Deconstruction
3. Multi-Move Forecasting
4. Critical Vulnerabilities
5. Recommended Indicators
6. Makaveli's Synthesis
`;
}

function formatDarkSignals(signals: DarkSignalsReport): string {
  return `
### GROUND TRUTH (Telegram/WhatsApp)
- Message volume: ${signals.telegramIntel.messageVolume.currentHour}/hr (trend: ${signals.telegramIntel.messageVolume.trend})
- Sentiment shifts: ${signals.telegramIntel.sentimentShifts.map(s => 
    `${s.topic}: ${s.previousSentiment} → ${s.currentSentiment}`
  ).join(', ')}
- Viral claims: ${signals.telegramIntel.unverifiedClaims.map(c => c.claim).join('; ')}

### INFRASTRUCTURE STATUS
- Internet: ${signals.infrastructureIntel.dnsStatus.nameServerHealth}
- Regime services: ${signals.infrastructureIntel.governmentServices.map(s => 
    `${s.service}: ${s.status}`
  ).join(', ')}
- Key anomaly: ${signals.infrastructureIntel.anomalies[0]?.interpretation}

### SATELLITE PHONE ACTIVITY
- Active terminals: ${signals.satellitePhoneIntel?.iridiumData?.totalActiveTerminals || 'N/A'}
- Off-peak calls: ${signals.satellitePhoneIntel?.iridiumData?.callVolume?.offPeakActivity || 'N/A'} (SIGINT avoidance?)
- High-value targets: ${signals.satellitePhoneIntel?.iridiumData?.highValueTargets?.length || 0} tracked

### FINANCIAL FLOWS
- SWIFT participation: ${signals.swiftIntel?.messageVolume?.iranianBankParticipation || 'N/A'}% of pre-crisis
- Currency trends: ${signals.swiftIntel?.currencyFlows?.map(c => 
    `${c.currency}: ${c.trend}`
  ).join(', ')}

### DARK WEB
- Leaks: ${signals.darkWebIntel?.documentLeaks?.length || 0} documents
- Cyber threats: ${signals.darkWebIntel?.cyberActivity?.filter(c => c.threatLevel === 'critical').length || 0} critical
`;
}
```

## Data Source Costs

| Source | Cost | Difficulty | Value |
|--------|------|------------|-------|
| Telegram API | Free | Medium | HIGH |
| RIPE Atlas | Free | Low | MEDIUM |
| Iridium/Inmarsat | $$$$ (contract) | Hard | HIGH |
| AIS Marine | Free-$50/mo | Easy | MEDIUM |
| Flashpoint | ~$2000/mo | Easy | HIGH |
| Recorded Future | ~$5000/mo | Easy | VERY HIGH |
| Refinitiv SWIFT | $$$$ (enterprise) | Hard | MEDIUM |
| OFAC/FATF (public) | Free | Easy | LOW |

## Quick Start (5 minutes)

```bash
# 1. Install dependencies
npm install telegram gramjs ripe-atlas

# 2. Set up Telegram API credentials
# Get from https://my.telegram.org/apps
export TELEGRAM_API_ID=your_id
export TELEGRAM_API_HASH=your_hash

# 3. Join key channels (manually or via API)
# @manabourse_ir (economic)
# @iranprotests (activist)
# @irannews (various)

# 4. Run collector
npx ts-node scripts/collect-telegram.ts

# 5. Feed into Makaveli
npx ts-node scripts/enhance-makaveli.ts --scenario "iran conflict"
```

## Recommended First Steps

1. **Start with Telegram** (free, immediate value)
2. **Add RIPE Atlas** (free, technical validation)
3. **Subscribe to Flashpoint** if budget allows ($2k/mo, huge value)
4. **Skip Iridium/SWIFT** unless government/commercial partnerships available

## Makaveli Integration Example

```typescript
// Your existing Makaveli function
async function makaveliAnalysis(scenario: string) {
  
  // OLD WAY:
  // const webData = await searchGroq(scenario);
  // const prompt = buildPrompt(scenario, webData);
  
  // NEW WAY:
  const [webData, darkSignals] = await Promise.all([
    searchGroq(scenario),
    collectDarkSignals(scenario) // NEW
  ]);
  
  const prompt = buildEnhancedPrompt(scenario, webData, darkSignals);
  
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7
  });
  
  return response.choices[0].message.content;
}
```

## Next Steps

1. **Which data source interests you most?**
2. **What's your budget?** (Free, $500/mo, $5000/mo)
3. **Do you have Telegram API access?**
4. **Do you read Persian/Farsi?** (needed for Telegram validation)

I can build the specific integration once you decide on the approach.
