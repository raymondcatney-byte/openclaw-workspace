# CIPHER Market Intelligence Engine
## Domain-Specific Scanner Architecture
### Cross-Market Sophistication Layer

---

## EXECUTIVE ARCHITECTURE

Each market type gets **custom external data ingestion**, **domain-specific misprice detection**, and **persona-tagged alerts**.

```
┌─────────────────────────────────────────────────────────────────┐
│                    UNIFIED SCANNER FRAMEWORK                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Polymarket Markets → Classifier → Domain Router → Enrichment  │
│                                         ↓                        │
│                              ┌─────────┴─────────┐              │
│                              ↓                   ↓              │
│                    External APIs         Knowledge Base         │
│                              ↓                   ↓              │
│                              └─────────┬─────────┘              │
│                                        ↓                        │
│                              Misprice Detection                 │
│                                        ↓                        │
│                              Alert Generation                   │
│                                        ↓                        │
│                              Persona Tagging                    │
│                                        ↓                        │
│                              War Room Display                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## DOMAIN 1: BIOTECH (Bruce Primary)

### External Data Sources

```typescript
interface BiotechDataSources {
  // FDA Calendar
  fdaCalendar: {
    source: 'FDA.gov + FDAcalendar.com';
    events: ['PDUFA dates', 'Adcom meetings', 'Approval decisions'];
    refresh: 'hourly';
  };
  
  // Clinical Trials
  clinicalTrials: {
    source: 'clinicaltrials.gov API';
    data: ['Enrollment status', 'Phase transitions', 'Primary completion dates'];
    refresh: '6 hours';
  };
  
  // Trial Results
  trialResults: {
    source: ['ArXiv medrxiv', 'company press releases', 'Kashi biotech feed'];
    alerts: ['Top-line readouts', 'Interim analyses', 'Safety signals'];
    refresh: 'real-time';
  };
  
  // Analyst Coverage
  analystData: {
    source: ['Briefing.com', 'Kashi sentiment', 'Twitter biotech accounts'];
    metrics: ['Price targets', 'Upgrade/downgrade velocity', 'Consensus shifts'];
    refresh: '4 hours';
  };
}
```

### Misprice Detection Logic

```typescript
const biotechMispriceDetectors = {
  // Pattern 1: PDUFA approaching, no price movement
  pdufaTimeline: (market, data) => {
    const daysToPDUFA = daysUntil(data.fdaCalendar.pdufaDate);
    const priceStaleness = priceChange(market, '7d');
    
    if (daysToPDUFA < 14 && Math.abs(priceStaleness) < 0.05) {
      return {
        type: 'timeline_misprice',
        severity: daysToPDUFA < 7 ? 'critical' : 'high',
        edge: calculateTimelineEdge(daysToPDUFA, data.baseRate),
        reasoning: `PDUFA in ${daysToPDUFA} days but price hasn't moved. Historical volatility: ${data.historicalVolatility}`
      };
    }
  },
  
  // Pattern 2: Trial readout surprise
  trialSurprise: (market, data) => {
    const recentNews = data.trialResults.last24h;
    const sentimentShift = data.analystData.sentimentDelta;
    
    if (recentNews.significance > 0.8 && market.priceChange24h < 0.1) {
      return {
        type: 'news_lag',
        severity: 'high',
        edge: sentimentShift * 0.3,
        reasoning: `Major trial news (${recentNews.headline}) not yet priced in. Sentiment shifted +${sentimentShift}`
      };
    }
  },
  
  // Pattern 3: Adcom probability vs market
  adcomMismatch: (market, data) => {
    const historicalAdcomRate = data.kb.baseRates.adcomApproval;
    const marketImplied = market.yesPrice;
    const drugRiskProfile = data.clinicalTrials.safetySignals;
    
    const adjustedProbability = adjustForRiskProfile(historicalAdcomRate, drugRiskProfile);
    const edge = adjustedProbability - marketImplied;
    
    if (Math.abs(edge) > 0.15) {
      return {
        type: 'probability_misprice',
        severity: edge > 0.2 ? 'critical' : 'high',
        edge,
        reasoning: `Market ${marketImplied} vs adjusted base rate ${adjustedProbability}. Risk: ${drugRiskProfile}`
      };
    }
  }
};
```

### War Room Display

```
┌─────────────────────────────────────────────────────────────────┐
│  BRUCE: Biotech Intelligence                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔴 CRITICAL: PDUFA in 5 Days, No Price Movement                │
│  ├─ Drug: X-305 (Oncology)                                     │
│  ├─ Market: Approval by June?                                  │
│  ├─ Current: 42¢ │ Historical PDUFA: 68%                       │
│  ├─ Edge: +26%                                                 │
│  └─ [View Trial Data] [FDA Calendar] [Predict]                 │
│                                                                  │
│  🟡 HIGH: Trial Readout Surprise Not Priced                     │
│  ├─ Drug: Y-102 (Immunology)                                   │
│  ├─ News: "Phase 3 meets primary endpoint" (2 hours ago)       │
│  ├─ Market: Still 35¢ │ Analysts upgraded to 75%               │
│  └─ [Read ArXiv] [Check Analyst Notes] [Predict]               │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  UPCOMING PDUFA DATES          │  RECENT TRIAL READOUTS        │
│  • X-305: 5 days (ALERT)       │  • Y-102: +++ (not priced)   │
│  • Z-440: 12 days (monitor)    │  • A-201: --- (overreaction?) │
│  • B-881: 18 days (watch)      │  • C-305: +++ (fully priced) │
│                                                                  │
│  [View Full FDA Calendar] [Export to Calendar]                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## DOMAIN 2: GEOPOLITICS (Makaveli Primary)

### External Data Sources

```typescript
interface GeopoliticsDataSources {
  // Conflict Tracking
  conflictData: {
    source: ['ACLED', 'CrisisWatch', 'Kashi geopolitical feed'];
    metrics: ['Incident intensity', 'Geographic spread', 'Casualty trends'];
    refresh: 'hourly';
  };
  
  // Energy Correlation
  energyMarkets: {
    source: ['Brent crude API', 'Henry Hub gas', 'ElectricityMaps'];
    correlation: 'conflict intensity → energy price';
    refresh: '15 minutes';
  };
  
  // Diplomatic Signals
  diplomatic: {
    source: ['UN meetings', 'G7/G20 statements', 'Bilateral summit calendar'];
    indicators: ['Sanctions announcements', 'Ceasefire negotiations', 'Arms shipments'];
    refresh: '4 hours';
  };
  
  // OSINT/Social
  osint: {
    source: ['Twitter/X conflict accounts', 'Telegram channels', 'Kashi'];
    verification: 'cross-reference with satellite (Maxar)';
    refresh: 'real-time';
  };
}
```

### Misprice Detection Logic

```typescript
const geopoliticsMispriceDetectors = {
  // Pattern 1: Conflict intensity rising, market complacent
  intensityDivergence: (market, data) => {
    const conflictIndex = data.conflictData.weeklyIntensity;
    const marketImplied = market.yesPrice;
    const baselineIndex = data.kb.baselines[market.country];
    
    if (conflictIndex > baselineIndex * 1.5 && marketImplied < 0.3) {
      return {
        type: 'intelligence_lag',
        severity: 'critical',
        edge: 0.25,
        reasoning: `Conflict intensity ${conflictIndex} vs baseline ${baselineIndex}, but market only ${marketImplied}`
      };
    }
  },
  
  // Pattern 2: Energy price spike + conflict market disconnect
  energyConflictGap: (market, data) => {
    const oilSpike = data.energyMarkets.brentChange24h;
    const isEnergyRelevant = market.question.includes('oil', 'gas', 'energy');
    
    if (oilSpike > 0.15 && !isEnergyRelevant) {
      // Check if conflict could affect energy
      const energyExposure = data.kb.energyExposure[market.country];
      if (energyExposure > 0.6) {
        return {
          type: 'secondary_effect',
          severity: 'high',
          edge: oilSpike * energyExposure * 0.5,
          reasoning: `Oil +${oilSpike}%, ${market.country} is ${energyExposure} energy-exposed, market not pricing`          
        };
      }
    }
  },
  
  // Pattern 3: Ceasefire timeline pressure
  ceasefireTimeline: (market, data) => {
    const daysLeft = daysUntil(market.resolutionDate);
    const negotiationStatus = data.diplomatic.ceasefireTalks;
    
    if (daysLeft < 7 && negotiationStatus === 'stalled' && market.yesPrice > 0.6) {
      return {
        type: 'timeline_pressure',
        severity: 'high',
        edge: -0.2,
        reasoning: `Ceasefire unlikely in ${daysLeft} days, talks stalled, but market ${market.yesPrice} optimistic`
      };
    }
  }
};
```

### War Room Display

```
┌─────────────────────────────────────────────────────────────────┐
│  MAKAVELI: Geopolitical Intelligence                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔴 CRITICAL: Conflict Escalating, Market Asleep                │
│  ├─ Region: Eastern Europe                                     │
│  ├─ Market: Ceasefire by end of month?                         │
│  ├─ Conflict Index: 187 (↑ 45% this week)                      │
│  ├─ Market: 28% YES │ Intel suggests: 65% NO                   │
│  ├─ Oil: +12% (secondary pressure)                             │
│  └─ [Satellite Imagery] [Diplomatic Timeline] [Predict]        │
│                                                                  │
│  🟡 HIGH: Energy-Conflict Disconnect                            │
│  ├─ Market: Iran sanctions eased?                              │
│  ├─ Brent: +18% (supply risk pricing)                          │
│  ├─ Market: 45% │ Energy correlation: 72%                      │
│  └─ Edge: +15% (market lagging energy signal)                  │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  CONFLICT HEATMAP              │  DIPLOMATIC CALENDAR          │
│  🔴🔴🔴 East Europe            │  • G7 Meeting: 3 days         │
│  🟡🟡⚪ Middle East            │  • UN Security Council: 7 days│
│  🟢⚪⚪ Southeast Asia          │  • Bilateral Summit: 12 days  │
│                                                                  │
│  [View Full Intel] [Track Energy Correlation]                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## DOMAIN 3: BLOCKCHAIN/CRYPTO

### External Data Sources

```typescript
interface BlockchainDataSources {
  // On-Chain Analytics
  onChain: {
    source: ['Glassnode', 'Dune Analytics', 'Nansen'];
    metrics: ['Exchange flows', 'Whale accumulation', 'Network activity'];
    refresh: '15 minutes';
  };
  
  // Funding Rates
  funding: {
    source: ['Binance', 'dYdX', 'Aave'];
    metrics: ['Perp funding rates', 'borrow demand', 'liquidation levels'];
    refresh: '1 hour';
  };
  
  // Protocol Metrics
  protocols: {
    source: ['DefiLlama', 'Token Terminal'];
    metrics: ['TVL changes', 'Revenue', 'User growth', 'Token unlocks'];
    refresh: '1 hour';
  };
  
  // Mempool/Flow
  mempool: {
    source: ['EigenPhi', 'Flashbots'];
    metrics: ['MEV activity', 'Large pending txs', 'Bridge flows'];
    refresh: 'real-time';
  };
}
```

### Misprice Detection Logic

```typescript
const blockchainMispriceDetectors = {
  // Pattern 1: ETF/approval event + on-chain divergence
  etfFlowDivergence: (market, data) => {
    const etfFlows = data.onChain.etfNetFlows;
    const marketImplied = market.yesPrice;
    const historicalCorrelation = data.kb.etfPriceCorrelation;
    
    const predictedProbability = normalize(etfFlows, historicalCorrelation);
    const edge = predictedProbability - marketImplied;
    
    if (Math.abs(edge) > 0.12) {
      return {
        type: 'flow_misprice',
        severity: 'high',
        edge,
        reasoning: `ETF flows ${etfFlows} imply ${predictedProbability}, market at ${marketImplied}`
      };
    }
  },
  
  // Pattern 2: Funding rate extremes
  fundingExtreme: (market, data) => {
    const funding = data.funding.avgRate;
    
    if (Math.abs(funding) > 0.01) {  // >1% funding
      return {
        type: 'funding_signal',
        severity: 'medium',
        signal: funding > 0 ? 'overheated_longs' : 'overheated_shorts',
        reasoning: `Funding ${funding}% suggests crowded positioning, contrarian opportunity`
      };
    }
  },
  
  // Pattern 3: Whale accumulation vs market price
  whaleAccumulation: (market, data) => {
    const whaleFlows = data.onChain.whaleNetFlows30d;
    const priceChange = market.priceChange30d;
    
    if (whaleFlows > 10000 && priceChange < 0.1) {
      return {
        type: 'smart_money_divergence',
        severity: 'high',
        reasoning: `Whales accumulating ${whaleFlows} BTC, price flat. Smart money leading?`
      };
    }
  }
};
```

---

## DOMAIN 4: AGENTIC CODING / AI

### External Data Sources

```typescript
interface AgenticCodingDataSources {
  // Benchmark Leaderboards
  benchmarks: {
    source: ['LMSYS Chatbot Arena', 'Aider coding leaderboard', 'SWE-bench'];
    metrics: ['ELO scores', 'Win rates', 'Coding task completion'];
    refresh: '6 hours';
  };
  
  // Release Velocity
  releases: {
    source: ['GitHub releases', 'company blogs', 'ArXiv', 'Twitter AI accounts'];
    metrics: ['Model announcements', 'Feature drops', 'API changes'];
    refresh: 'hourly';
  };
  
  // Developer Sentiment
  devSentiment: {
    source: ['GitHub stars velocity', 'Hacker News', 'Red r/MachineLearning'];
    metrics: ['Adoption curves', 'Hype cycles', 'Criticism spikes'];
    refresh: '4 hours';
  };
  
  // Usage Metrics
  usage: {
    source: ['SimilarWeb', 'Kashi developer chatter'];
    metrics: ['API traffic', 'Developer tool downloads', 'Documentation traffic'];
    refresh: 'daily';
  };
}
```

### Misprice Detection Logic

```typescript
const agenticCodingMispriceDetectors = {
  // Pattern 1: Benchmark leaderboard change not priced
  leaderboardShift: (market, data) => {
    const currentLeader = data.benchmarks.currentLeader;
    const marketLeader = getMarketLeader(market);
    const momentum = data.benchmarks.momentum7d;
    
    if (currentLeader !== marketLeader && momentum[currentLeader] > 20) {
      return {
        type: 'leaderboard_change',
        severity: 'high',
        edge: 0.2,
        reasoning: `${currentLeader} overtaking ${marketLeader} on LMSYS (+${momentum[currentLeader]} ELO), market not adjusted`
      };
    }
  },
  
  // Pattern 2: Release announcement + historical pattern
  releaseCatalyst: (market, data) => {
    const upcomingReleases = data.releases.next30Days;
    const company = extractCompany(market);
    
    if (upcomingReleases.includes(company)) {
      const historicalImpact = data.kb.releaseImpacts[company];
      return {
        type: 'catalyst_approach',
        severity: 'medium',
        expectedMove: historicalImpact.avgPriceMove,
        reasoning: `${company} release expected, historically moves ${historicalImpact.avgPriceMove}`
      };
    }
  },
  
  // Pattern 3: Developer sentiment divergence
  sentimentDivergence: (market, data) => {
    const devSentiment = data.devSentiment.score;
    const marketPrice = market.yesPrice;
    
    if (devSentiment > 0.7 && marketPrice < 0.4) {
      return {
        type: 'sentiment_lag',
        severity: 'high',
        edge: 0.25,
        reasoning: `Developer sentiment strongly positive (${devSentiment}), market skeptical (${marketPrice})`
      };
    }
  }
};
```

---

## DOMAIN 5: ROBOTICS

### External Data Sources

```typescript
interface RoboticsDataSources {
  // Industry Metrics
  industry: {
    source: ['IFR World Robotics', 'RIA', 'Kashi robotics feed'];
    metrics: ['Unit sales', 'Adoption curves', 'Price points'];
    refresh: 'weekly';
  };
  
  // Company-Specific
  companyData: {
    source: ['Earnings calls', 'Production updates', 'Patent filings'];
    metrics: ['Delivery numbers', 'Manufacturing scale', 'New product announcements'];
    refresh: 'daily';
  };
  
  // Demonstrations/Videos
  demos: {
    source: ['YouTube', 'Twitter/X', 'Company channels'];
    metrics: ['Viral robotics videos', 'Capability demonstrations', 'Public reaction'];
    refresh: 'real-time';
  };
  
  // Regulatory
  regulatory: {
    source: ['FDA (medical robots)', 'DOT (autonomous vehicles)', 'OSHA'];
    metrics: ['Approval timelines', 'Safety incidents', 'Regulatory clarity'];
    refresh: 'weekly';
  };
}
```

---

## DOMAIN 6: HUMAN OPTIMIZATION

### External Data Sources

```typescript
interface HumanOptimizationDataSources {
  // Scientific Studies
  studies: {
    source: ['PubMed', 'PubMed Central', 'Kashi longevity feed'];
    metrics: ['New trials', 'Breakthrough papers', 'Meta-analyses'];
    refresh: 'daily';
  };
  
  // Product/Commercial
  products: {
    source: ['Company announcements', 'Clinical trial registries', 'FDA approvals'];
    metrics: ['Launch dates', 'Efficacy data', 'Safety profiles'];
    refresh: 'weekly';
  };
  
  // Cultural Trends
  trends: {
    source: ['Google Trends', 'Reddit communities', 'Kashi'];
    metrics: ['Search interest', 'Adoption curves', 'Influencer mentions'];
    refresh: 'daily';
  };
  
  // Expert Consensus
  expertConsensus: {
    source: ['Expert surveys', 'Conference proceedings', 'Key opinion leaders'];
    metrics: ['Confidence levels', 'Timeline estimates', 'Risk assessments'];
    refresh: 'monthly';
  };
}
```

---

## DOMAIN 7: COMMODITIES

### External Data Sources

```typescript
interface CommodityDataSources {
  // Price Feeds
  prices: {
    source: ['Bloomberg API', 'TradingEconomics', 'FRED', 'Kashi commodity feed'];
    commodities: ['Oil (Brent/WTI)', 'Natural Gas', 'Gold', 'Copper', 'Wheat', 'Lumber'];
    granularity: ['tick', '1min', '5min', 'hourly', 'daily'];
    refresh: 'real-time';
  };
  
  // Inventory/Supply Data
  inventories: {
    source: ['EIA (US)', 'IEA', 'OPEC', 'CFTC COT reports'];
    data: ['Crude stocks', 'Strategic reserves', 'Production forecasts', 'Rig counts'];
    refresh: 'weekly';
  };
  
  // Weather/Crop
  agWeather: {
    source: ['NOAA', 'USDA', 'European weather models'];
    data: ['Drought indices', 'Planting conditions', 'Harvest forecasts', 'Frost warnings'];
    refresh: 'daily';
  };
  
  // Geopolitical Supply Risk
  supplyRisk: {
    source: ['Shipping trackers', 'Strait monitoring', 'Sanctions news'];
    data: ['Tanker routes', 'Port closures', 'Export bans', 'Shipping rates'];
    refresh: 'hourly';
  };
  
  // Dollar Correlation
  dollarIndex: {
    source: ['DXY real-time'];
    correlation: 'commodity inverse correlation tracking';
    refresh: 'real-time';
  };
}
```

### Sentiment Causation Detection

```typescript
const commoditySentimentDetectors = {
  // Pattern 1: Price move + supply shock NOT in market
  supplyShockLag: (market, data) => {
    const priceMove = data.prices.priceChange24h;
    const supplyEvent = data.supplyRisk.recentEvents;
    
    // Detect if market is pricing generic move, not specific cause
    if (Math.abs(priceMove) > 0.05 && !supplyEvent.pricedIn) {
      const kbInsight = knowledgeBase.query({
        entity: market.commodity,
        pattern: 'supply_shock_response'
      });
      
      return {
        type: 'causation_opportunity',
        severity: 'high',
        edge: kbInsight.historicalAlpha,
        reasoning: `${market.commodity} moved ${priceMove}%, likely due to ${supplyEvent.type}. KB suggests ${kbInsight.typicalOvershoot} overshoot pattern.`,
        catalyst: supplyEvent.description,
        historicalAnalog: kbInsight.similarEvents[0]
      };
    }
  },
  
  // Pattern 2: Inventory report surprise
  inventorySurprise: (market, data) => {
    const report = data.inventories.latest;
    const consensus = data.inventories.consensus;
    const surprise = report.actual - consensus;
    
    if (Math.abs(surprise) > consensus.stdDev * 2) {
      const kbContext = knowledgeBase.query({
        entity: market.commodity,
        event: 'inventory_report',
        surpriseDirection: surprise > 0 ? 'build' : 'draw'
      });
      
      return {
        type: 'data_surprise',
        severity: 'critical',
        surprise: `${report.actual} vs ${consensus.expected}`,
        reasoning: `Inventory ${surprise > 0 ? 'build' : 'draw'} surprised market. Your KB: ${kbContext.typicalMarketResponse}`,
        edge: kbContext.edgeEstimate,
        timeWindow: '4-6 hours post-report'
      };
    }
  },
  
  // Pattern 3: Weather event not priced in ag markets
  weatherCatalyst: (market, data) => {
    const weatherAlert = data.agWeather.criticalAlerts[0];
    const growingRegion = market.deliveryRegion;
    
    if (weatherAlert.affectsRegion(growingRegion) && !weatherAlert.pricedIn) {
      const kbPattern = knowledgeBase.query({
        commodity: market.commodity,
        weather: weatherAlert.type,
        growthStage: data.agWeather.currentGrowthStage
      });
      
      return {
        type: 'weather_alpha',
        severity: weatherAlert.severity,
        catalyst: weatherAlert.description,
        reasoning: `${weatherAlert.type} hitting ${growingRegion} during ${kbPattern.growthStage}. Historical: ${kbPattern.priceImpact}`,
        edge: kbPattern.expectedMove,
        urgency: 'next 24-48 hours'
      };
    }
  },
  
  // Pattern 4: Dollar move divergence
  dollarDivergence: (market, data) => {
    const dxyMove = data.dollarIndex.change24h;
    const commodityMove = data.prices.change24h;
    const expectedCorrelation = -0.75; // Typical inverse
    
    const expectedCommodityMove = dxyMove * expectedCorrelation;
    const divergence = commodityMove - expectedCommodityMove;
    
    if (Math.abs(divergence) > 0.03) {
      // Something besides dollar is moving this commodity
      const fundamentalFactor = detectFundamentalDriver(market, data);
      
      return {
        type: 'divergence_signal',
        severity: 'medium',
        reasoning: `${market.commodity} moved ${commodityMove} vs expected ${expectedCommodityMove} from dollar. Real driver: ${fundamentalFactor}`,
        edge: Math.abs(divergence) * 0.5,
        catalyst: fundamentalFactor
      };
    }
  }
};
```

### War Room Display

```
┌─────────────────────────────────────────────────────────────────┐
│  COMMODITY SENTIMENT INTELLIGENCE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔴 CRITICAL: Inventory Surprise Not Fully Priced               │
│  ├─ Commodity: Crude Oil (WTI)                                 │
│  ├─ Event: EIA Report - 4.2M draw vs 1.5M expected             │
│  ├─ Market Response: +2.3% (likely underreaction)              │
│  ├─ KB Pattern: "Large draws typically see 6-8% over 2 days"   │
│  ├─ Your Edge: +4.5% additional move expected                  │
│  └─ [View Inventory Data] [Historical Pattern] [Predict]       │
│                                                                  │
│  🟡 HIGH: Supply Shock in Strait of Hormuz                    │
│  ├─ Commodity: Brent Crude                                     │
│  ├─ Catalyst: Shipping delay reports (12 hours old)            │
│  ├─ Price Action: +1.8% (generic "risk on" move)               │
│  ├─ KB Insight: "Strait delays typically = 8-12% if sustained" │
│  └─ Edge: Market pricing generic move, not specific cause      │
│                                                                  │
│  🟢 MONITORING: Weather Catalyst Developing                     │
│  ├─ Commodity: Wheat (Chicago)                                 │
│  ├─ Alert: Drought conditions expanding in Kansas              │
│  ├─ Growth Stage: Critical flowering period                    │
│  ├─ KB: "Drought at flowering = 15-25% price impact"           │
│  └─ [Track USDA Reports] [Monitor Radar]                       │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  LIVE PRICE BOARD              │  INVENTORY CALENDAR            │
│  Brent: $84.23 ▲ +2.4%         │  • EIA Oil: Wed 10:30am       │
│  WTI: $80.15 ▲ +2.1%           │  • NatGas: Thu 10:30am        │
│  Gold: $2,340 ▼ -0.3%          │  • USDA Crop: Mon 4pm         │
│  Copper: $4.12 ▲ +1.8%         │  • COT Report: Fri 3:30pm     │
│                                                                  │
│  [View Correlation Matrix] [Set Price Alerts]                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## DOMAIN 8: CRYPTO ASSETS

### External Data Sources

```typescript
interface CryptoDataSources {
  // Price & Volume
  priceData: {
    source: ['CoinGecko', 'CoinMarketCap', 'Binance API'];
    metrics: ['Spot price', 'Volume', 'Volatility', 'OI (futures)'];
    refresh: 'real-time';
  };
  
  // On-Chain Intelligence
  onChain: {
    source: ['Glassnode', 'Santiment', 'Nansen', 'Arkham'];
    metrics: [
      'Exchange flows (in/out)',
      'Whale wallet movements',
      'Network activity (active addresses)',
      'Miner behavior',
      'Staking flows'
    ];
    refresh: 'hourly';
  };
  
  // Derivatives/Funding
  derivatives: {
    source: ['Coinglass', 'Bybit', 'dYdX'];
    metrics: [
      'Funding rates',
      'Liquidation heatmap',
      'Open interest changes',
      'Options skew'
    ];
    refresh: '15 minutes';
  };
  
  // Regulatory/Legal
  regulatory: {
    source: ['SEC filings', 'Court docs', 'Kashi crypto feed'];
    alerts: ['ETF decisions', 'Enforcement actions', 'Exchange lawsuits', 'Legislative moves'];
    refresh: 'hourly';
  };
  
  // Social/Sentiment
  social: {
    source: ['LunarCrush', 'Twitter/X', 'Reddit', 'Kashi'];
    metrics: ['Social volume', 'Sentiment score', 'Influencer mentions', 'Fear/Greed index'];
    refresh: 'hourly';
  };
  
  // Institutional Flows
  institutional: {
    source: ['ETF fund flows', 'CME futures', 'MicroStrategy tracking'];
    metrics: ['Daily ETF net flows', 'CME basis', 'Corporate treasury buys'];
    refresh: 'daily';
  };
}
```

### Sentiment Causation Detection

```typescript
const cryptoSentimentDetectors = {
  // Pattern 1: On-chain smart money moving, price hasn't reacted
  smartMoneyDivergence: (market, data) => {
    const whaleFlows = data.onChain.whaleNetFlows24h;
    const exchangeOutflows = data.onChain.exchangeFlows.out;
    const priceChange = data.priceData.change24h;
    
    // Large accumulation + exchange outflows (hodling) but price flat
    if (whaleFlows > threshold.large && exchangeOutflows > threshold.large && Math.abs(priceChange) < 0.02) {
      const kbPattern = knowledgeBase.query({
        asset: market.asset,
        pattern: 'whale_accumulation_before_move'
      });
      
      return {
        type: 'smart_money_lead',
        severity: 'high',
        catalyst: `${whaleFlows} BTC accumulated, ${exchangeOutflows} moved off exchanges`,
        reasoning: `Smart money positioning while price flat. Your KB: "${kbPattern.description}" - avg ${kbPattern.timeToMove} delay, ${kbPattern.typicalMove} move`,
        edge: kbPattern.edgeEstimate,
        timeWindow: kbPattern.timeToMove
      };
    }
  },
  
  // Pattern 2: Funding rate extreme + positioning
  fundingExtreme: (market, data) => {
    const funding = data.derivatives.fundingRate;
    const oiChange = data.derivatives.openInterestChange24h;
    
    if (Math.abs(funding) > 0.01) { // >1% per 8hr = extreme
      const positioning = funding > 0 ? 'overwhelmingly_long' : 'overwhelmingly_short';
      const kbSignal = knowledgeBase.query({
        asset: market.asset,
        signal: 'funding_extreme',
        direction: funding > 0 ? 'positive' : 'negative'
      });
      
      return {
        type: 'contrarian_extreme',
        severity: 'high',
        funding: `${funding}% per 8hr`,
        oiChange: `${oiChange}% OI change`,
        reasoning: `Extreme ${positioning} funding suggests crowded trade. KB: ${kbPattern.crowdedTradeResolution}`,
        edge: kbPattern.contrarianEdge,
        catalyst: 'Positioning exhaustion'
      };
    }
  },
  
  // Pattern 3: Regulatory catalyst with market lag
  regulatoryLag: (market, data) => {
    const regulatoryEvent = data.regulatory.latest;
    const marketResponse = data.priceData.changeSinceEvent;
    
    // Event happened but market hasn't fully digested
    if (regulatoryEvent.significance > 0.8 && marketResponse < 0.05) {
      const kbAnalysis = knowledgeBase.query({
        eventType: regulatoryEvent.type,
        asset: market.asset,
        similarCases: true
      });
      
      return {
        type: 'regulatory_alpha',
        severity: regulatoryEvent.impact > 0.7 ? 'critical' : 'high',
        catalyst: regulatoryEvent.description,
        reasoning: `${regulatoryEvent.type} for ${market.asset}. Your KB tracked ${kbAnalysis.similarCases.length} similar events. Typical response: ${kbAnalysis.typicalPriceMove}`,
        edge: kbAnalysis.edgeEstimate,
        urgency: '4-12 hours before full market digestion'
      };
    }
  },
  
  // Pattern 4: ETF flow divergence
  etfDivergence: (market, data) => {
    if (market.asset !== 'BTC' && market.asset !== 'ETH') return null;
    
    const etfFlows = data.institutional.etfNetFlows;
    const spotPrice = data.priceData.current;
    const expectedCorrelation = 0.85;
    
    // Large inflows but price not moving = supply absorption
    if (etfFlows > 500_000_000 && data.priceData.change24h < 0.02) {
      return {
        type: 'absorption_signal',
        severity: 'high',
        catalyst: `$${etfFlows/1e6}M ETF inflows`,
        reasoning: 'Institutional buying absorbing supply without price spike. Either latent selling pressure or coiled spring.',
        edge: 0.15,
        kbNote: 'Your pattern: "Large ETF inflows + flat price = 70% chance of delayed breakout within 48h"'
      };
    }
  },
  
  // Pattern 5: Social sentiment divergence
  socialDivergence: (market, data) => {
    const socialSentiment = data.social.sentimentScore;
    const socialVolume = data.social.volumeChange;
    const priceAction = data.priceData.change24h;
    
    // Extremely positive sentiment but price down = bearish divergence
    // Extremely negative sentiment but price up = bullish divergence
    const divergence = (socialSentiment > 0.7 && priceAction < -0.05) ||
                      (socialSentiment < -0.7 && priceAction > 0.05);
    
    if (divergence) {
      const kbPattern = knowledgeBase.query({
        asset: market.asset,
        pattern: 'sentiment_price_divergence',
        direction: priceAction > 0 ? 'bullish' : 'bearish'
      });
      
      return {
        type: 'sentiment_divergence',
        severity: 'medium',
        sentiment: socialSentiment,
        price: priceAction,
        reasoning: `Sentiment ${socialSentiment} vs price ${priceAction}. KB suggests ${kbPattern.typicalResolution}`,
        edge: kbPattern.edgeEstimate
      };
    }
  }
};
```

### War Room Display

```
┌─────────────────────────────────────────────────────────────────┐
│  CRYPTO SENTIMENT INTELLIGENCE                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔴 CRITICAL: Smart Money Accumulation Not Priced               │
│  ├─ Asset: Bitcoin                                             │
│  ├─ On-Chain: +12,400 BTC to cold wallets (24h)               │
│  ├─ Exchange Outflows: -18,200 BTC (hodling signal)           │
│  ├─ Price: +0.8% (barely moved despite accumulation)          │
│  ├─ KB Pattern: "Whale accumulation + flat price = breakout"   │
│  │              "72% within 48h, avg move +12%"                │
│  ├─ Your Edge: +10-15% expected move                          │
│  └─ [View Arkham] [Check Liquidations] [Predict]               │
│                                                                  │
│  🟡 HIGH: ETF Flow Absorption Pattern                           │
│  ├─ Asset: Bitcoin                                             │
│  ├─ ETF Inflows: +$890M (largest in 2 weeks)                  │
│  ├─ Price Response: +1.2% (muted vs typical +4-5%)            │
│  ├─ Interpretation: Supply absorption, sellers exhausted       │
│  ├─ KB Note: You flagged similar pattern Mar 2024 → +18% run   │
│  └─ [Track Flows] [View OI] [Set Alert at $70k]               │
│                                                                  │
│  🟠 MEDIUM: Funding Extreme (Contrarian Signal)                 │
│  ├─ Asset: Ethereum                                            │
│  ├─ Funding: +0.045% per 8hr (very high)                      │
│  ├─ OI: +15% (new longs opening)                              │
│  ├─ Sentiment: Extremely bullish on social                    │
│  ├─ KB Warning: "Funding >0.04% + OI spike = crowded long"     │
│  │              "Avg pullback within 24h: -6%"                 │
│  └─ Contrarian opportunity: Short squeeze potential or dump    │
│                                                                  │
│  ─────────────────────────────────────────────────────────────  │
│  SMART MONEY TRACKING          │  FUNDING & POSITIONING         │
│  ┌─────────────────────────┐   │  BTC Funding: +0.012% (norm)  │
│  │ BTC: Accumulating ▲▲▲  │   │  ETH Funding: +0.045% 🔥 (high)│
│  │ ETH: Distributing ▼▲   │   │  SOL Funding: +0.008% (low)   │
│  │ SOL: Accumulating ▲▲   │   │                                │
│  └─────────────────────────┘   │  ETF Flows (7d): +$2.1B       │
│                                │  GBTC Outflows: Slowing       │
│  [View Whale Wallets]          │  [View Liquidation Map]       │
│                                                                  │
│  REGULATORY RADAR:                                               │
│  • SEC response due: 2 days (your KB: "typically -3% knee-jerk")│
│  • ETH ETF decision pending (no date set)                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## KB EDGE DETECTION FRAMEWORK

### How Knowledge Base Creates Alpha

```typescript
interface KBEdgeDetection {
  // The core value: WHY sentiment changed, not just THAT it changed
  
  queryPattern: {
    // Example: Oil price moved 5%
    whatHappened: 'WTI +5% in 24h',
    
    // KB tells you WHY
    causationQuery: {
      timeframe: 'last 24h',
      events: scanNews(),
      correlation: checkInventoryReports(),
      geopolitical: checkSupplyDisruptions()
    },
    
    // KB tells you HISTORICAL PATTERN
    historicalMatch: {
      similarEvent: '2022-03-02 supply shock',
      yourPrediction: 'YES overreaction',
      outcome: 'Correct - retraced 60% in 3 days',
      alphaGenerated: '+8%'
    },
    
    // KB tells you CURRENT MARKET POSITIONING
    marketContext: {
      currentSentiment: 'extreme_fear',
      positioning: 'overwhelmingly_short',
      contrarianOpportunity: true
    }
  };
  
  // Alert generation
  generateAlert: () => ({
    title: 'Oil supply shock - market overreacting?',
    yourEdge: 'KB pattern suggests 60% retrace likely',
    recommendedAction: 'Predict NO on "Oil above $X by Y date"',
    confidence: 0.72,
    historicalWinRate: 0.78
  });
}
```

### Persona-KB Matching

| Persona | KB Strengths | Typical Alpha Sources |
|---------|--------------|---------------------|
| **Bruce** | Biotech trial patterns, FDA timelines, regulatory history | PDUFA surprises, trial readout overreactions |
| **Makaveli** | Conflict escalation patterns, energy supply shocks, geopolitical catalysts | Ceasefire mispricings, war premium timing |
| **Both** | Crypto on-chain patterns, AI benchmark correlations, commodity inventory cycles | Smart money divergence, sentiment disconnects |

---

## UNIFIED ARCHITECTURE

### Market Classifier

```typescript
interface MarketClassifier {
  // Categorize any Polymarket market
  classify: (market: PolymarketMarket) => Domain | null;
  
  domains: {
    biotech: {
      keywords: ['FDA', 'approval', 'clinical', 'drug', 'therapeutic', 'vaccine'],
      extractors: ['drugName', 'company', 'eventType', 'timeline']
    },
    geopolitics: {
      keywords: ['war', 'election', 'sanctions', 'conflict', 'ceasefire', 'invasion'],
      extractors: ['country', 'eventType', 'stakeholders']
    },
    blockchain: {
      keywords: ['Bitcoin', 'Ethereum', 'ETF', 'crypto', 'blockchain', 'SEC'],
      extractors: ['asset', 'eventType', 'regulatoryBody']
    },
    agenticCoding: {
      keywords: ['AI model', 'coding', 'benchmark', 'LLM', 'GPT', 'Claude'],
      extractors: ['company', 'metric', 'timeline']
    },
    robotics: {
      keywords: ['robot', 'humanoid', 'automation', 'Tesla Bot', 'Figure AI'],
      extractors: ['company', 'capability', 'timeline']
    },
    humanOptimization: {
      keywords: ['longevity', 'lifespan', 'healthspan', 'aging', 'metformin'],
      extractors: ['intervention', 'metric', 'timeline']
    }
  };
}
```

### Alert Prioritization Engine

```typescript
interface AlertPrioritization {
  // Score each alert for user attention
  calculatePriority: (alert: Alert) => number;
  
  factors: {
    edge: number;              // Basis points of edge
    confidence: number;        // 0-1 confidence in edge calculation
    timeUrgency: number;       // Days until resolution/catalyst
    personaMatch: number;      // How well it matches Bruce/Makaveli focus
    kbRelevance: number;       // How much KB context exists
    liquidity: number;         // Can you actually trade this
    historicalWinRate: number; // Your track record on similar setups
  };
  
  // Sort: High edge + high confidence + urgent + good track record
  sort: (alerts: Alert[]) => Alert[];
}
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Foundation
- [ ] Market classifier (extract domain from question text)
- [ ] Domain router (send to appropriate scanner)
- [ ] Base alert structure

### Phase 2: Domain Scanners (Priority Order)
- [ ] **Biotech** (Bruce primary) - FDA calendar integration
- [ ] **Geopolitics** (Makaveli primary) - ACLED/conflict data
- [ ] **Agentic Coding** - LMSYS leaderboard integration
- [ ] **Blockchain/Crypto** - On-chain data + funding rates
- [ ] **Commodities** - EIA + inventory data + weather
- [ ] **Robotics** - Industry metrics
- [ ] **Human Optimization** - Study tracking

### Phase 3: Enrichment Layer
- [ ] Kashi integration for all domains
- [ ] Knowledge base pattern matching
- [ ] Historical base rate database

### Phase 4: Alert Engine
- [ ] Misprice detection algorithms per domain
- [ ] Momentum tracking
- [ ] Prioritization scoring

### Phase 5: War Room UI
- [ ] Domain-specific display panels
- [ ] External data inline
- [ ] One-click prediction logging

### Phase 6: Sentiment Causation
- [ ] **Commodity causation**: Inventory surprise detection
- [ ] **Commodity causation**: Weather catalyst tracking
- [ ] **Commodity causation**: Dollar divergence signals
- [ ] **Crypto causation**: Smart money divergence (on-chain)
- [ ] **Crypto causation**: Funding extreme contrarian signals
- [ ] **Crypto causation**: ETF flow absorption patterns
- [ ] **KB causation engine**: Why sentiment changed, not just that it changed

---

## IMMEDIATE NEXT STEPS

**Today:**
1. Build market classifier (regex + NLP for domain detection)
2. Set up Polymarket CLOB WebSocket for live data
3. Create Bruce scanner with FDA calendar integration

**This Week:**
1. LMSYS leaderboard scraper for AI model markets
2. ACLED API for geopolitical conflict data
3. Kashi integration for cross-domain sentiment

**Priority Markets to Test:**
1. AI model rankings (LMSYS data)
2. FDA approvals (FDA calendar)
3. Conflict/ceasefire (ACLED + energy correlation)
4. Crypto ETF flows (on-chain data)

Which domain scanner do you want to build first?
