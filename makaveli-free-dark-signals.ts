#!/usr/bin/env node
/**
 * MAKAVELI FREE DARK SIGNALS - PRODUCTION IMPLEMENTATION
 * Zero-cost data sources only
 */

import * as fs from 'fs';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram/tl';

// ============================================================================
// CONFIGURATION (Fill these in)
// ============================================================================

const CONFIG = {
  // Get from https://my.telegram.org/apps
  telegram: {
    apiId: parseInt(process.env.TELEGRAM_API_ID || '0'),
    apiHash: process.env.TELEGRAM_API_HASH || '',
    sessionString: process.env.TELEGRAM_SESSION || '',
    // Persian-language channels to monitor
    channels: [
      'manabourse_ir',      // Economic news
      'irannews',           // General news
      'iranprotest',        // Activist chatter
      'akhbar_eghtesadi',   // Economic updates
      'boursetime',         // Market sentiment
    ]
  },
  
  // Free RIPE Atlas API (https://atlas.ripe.net/)
  ripeAtlas: {
    apiKey: process.env.RIPE_API_KEY || '', // Optional but recommended
  },
  
  // Free AIS/Marine tracking
  ais: {
    // MarineTraffic free tier (50 requests/day)
    // OR OpenAIS / AISHub (free with registration)
  },
  
  // Output settings
  outputDir: './makaveli_intel',
  refreshIntervalMinutes: 30
};

// ============================================================================
// FREE TELEGRAM MONITOR (MTProto)
// ============================================================================

class FreeTelegramMonitor {
  private client: TelegramClient | null = null;
  private messageCache: Map<string, any[]> = new Map();
  
  async connect(): Promise<void> {
    if (!CONFIG.telegram.apiId || !CONFIG.telegram.apiHash) {
      console.log('⚠️  Telegram API credentials not configured. Skipping Telegram.');
      console.log('   Get credentials at: https://my.telegram.org/apps');
      return;
    }
    
    this.client = new TelegramClient(
      new StringSession(CONFIG.telegram.sessionString),
      CONFIG.telegram.apiId,
      CONFIG.telegram.apiHash,
      { connectionRetries: 5 }
    );
    
    await this.client.connect();
    
    if (!CONFIG.telegram.sessionString) {
      console.log('🔐 First run - generating session string...');
      await this.client.start({
        phoneNumber: async () => await askQuestion('Enter your phone number: '),
        password: async () => await askQuestion('Enter your 2FA password (if any): '),
        phoneCode: async () => await askQuestion('Enter the code you received: '),
        onError: (err) => console.log(err),
      });
      
      const sessionString = this.client.session.save() as unknown as string;
      console.log('💾 Save this session string to TELEGRAM_SESSION env var:');
      console.log(sessionString);
    }
    
    console.log('✅ Telegram connected');
  }
  
  async gather(): Promise<any> {
    if (!this.client) {
      return { status: 'not_configured', message: 'Add TELEGRAM_API_ID and TELEGRAM_API_HASH to use Telegram intel' };
    }
    
    const results = {
      timestamp: new Date().toISOString(),
      channels: [] as any[],
      sentiment: { positive: 0, negative: 0, neutral: 0, fearful: 0, defiant: 0 },
      keyTopics: new Map<string, number>(),
      viralMessages: [] as any[],
      geographicMentions: new Map<string, number>()
    };
    
    for (const channelName of CONFIG.telegram.channels) {
      try {
        const messages = await this.fetchChannelMessages(channelName);
        const analysis = this.analyzeMessages(messages, channelName);
        
        results.channels.push({
          name: channelName,
          messagesAnalyzed: messages.length,
          lastMessage: messages[0]?.date || null,
          analysis
        });
        
        // Aggregate sentiment
        Object.entries(analysis.sentiment).forEach(([k, v]) => {
          results.sentiment[k as keyof typeof results.sentiment] += v;
        });
        
        // Aggregate topics
        analysis.topics.forEach((count, topic) => {
          results.keyTopics.set(topic, (results.keyTopics.get(topic) || 0) + count);
        });
        
        // Collect viral messages
        results.viralMessages.push(...analysis.viral);
        
      } catch (err) {
        console.log(`⚠️  Error fetching ${channelName}:`, err.message);
      }
    }
    
    return this.formatTelegramIntel(results);
  }
  
  private async fetchChannelMessages(channelName: string, limit = 100): Promise<any[]> {
    try {
      const entity = await this.client!.getEntity(channelName);
      const messages = await this.client!.getMessages(entity, { limit });
      return messages.filter(m => m.message).map(m => ({
        id: m.id,
        text: m.message,
        date: m.date,
        views: m.views || 0,
        forwards: m.forwards || 0,
        replies: m.replies?.replies || 0
      }));
    } catch (err) {
      return [];
    }
  }
  
  private analyzeMessages(messages: any[], channelName: string) {
    const analysis = {
      sentiment: { positive: 0, negative: 0, neutral: 0, fearful: 0, defiant: 0 },
      topics: new Map<string, number>(),
      viral: [] as any[],
      cities: new Map<string, number>()
    };
    
    // Persian sentiment keywords
    const sentimentPatterns = {
      fearful: ['ترس', 'نگران', 'بحران', 'بد', 'فاجعه', 'blackout', 'power'],
      defiant: ['مقاومت', 'پیروزی', 'انتقام', 'شهید', 'war', 'resistance'],
      negative: ['مشکل', 'قطع', 'نداریم', 'problem', 'shortage'],
      positive: ['خوب', 'امید', 'کمک', 'good', 'hope']
    };
    
    const topicPatterns = {
      'power_outages': ['برق', 'قطع برق', 'blackout', 'electricity'],
      'economic_crisis': ['اقتصاد', 'تورم', 'گرانی', 'dollar', 'rial'],
      'war_developments': ['جنگ', 'حمله', 'موشک', 'war', 'strike', 'missile'],
      'leadership': ['رهبر', 'خامنه', 'mojtaba', 'leader', 'khamenei'],
      'refugees': ['فرار', 'مرز', 'ترکیه', 'refugee', 'border', 'turkey'],
      'oil_gas': ['نفت', 'گاز', 'oil', 'gas', 'hormuz']
    };
    
    const cities = ['tehran', 'tabriz', 'isfahan', 'mashhad', 'shiraz', 'ahvaz', 'qom', 'bandar'];
    
    messages.forEach(msg => {
      const text = msg.text.toLowerCase();
      
      // Sentiment detection
      let detectedSentiment = 'neutral';
      for (const [sentiment, keywords] of Object.entries(sentimentPatterns)) {
        if (keywords.some(k => text.includes(k))) {
          detectedSentiment = sentiment;
          break;
        }
      }
      analysis.sentiment[detectedSentiment as keyof typeof analysis.sentiment]++;
      
      // Topic detection
      for (const [topic, keywords] of Object.entries(topicPatterns)) {
        if (keywords.some(k => text.includes(k))) {
          analysis.topics.set(topic, (analysis.topics.get(topic) || 0) + 1);
        }
      }
      
      // Viral detection (high engagement)
      const engagement = (msg.views || 0) + (msg.forwards || 0) * 10;
      if (engagement > 10000) {
        analysis.viral.push({
          text: msg.text.substring(0, 200),
          views: msg.views,
          forwards: msg.forwards,
          channel: channelName
        });
      }
      
      // Geographic mentions
      cities.forEach(city => {
        if (text.includes(city)) {
          analysis.cities.set(city, (analysis.cities.get(city) || 0) + 1);
        }
      });
    });
    
    return analysis;
  }
  
  private formatTelegramIntel(results: any): any {
    const totalMessages = results.channels.reduce((sum: number, c: any) => sum + c.messagesAnalyzed, 0);
    const dominantSentiment = Object.entries(results.sentiment)
      .sort((a: any, b: any) => b[1] - a[1])[0];
    
    const topTopics = Array.from(results.keyTopics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    return {
      status: 'active',
      timestamp: results.timestamp,
      summary: {
        channelsMonitored: results.channels.length,
        messagesAnalyzed: totalMessages,
        dominantSentiment: dominantSentiment?.[0] || 'unknown',
        sentimentDistribution: results.sentiment
      },
      topTopics: topTopics.map(([topic, count]) => ({ topic, count })),
      viralMessages: results.viralMessages.slice(0, 10),
      geographicActivity: Array.from(results.geographicMentions.entries())
        .sort((a: any, b: any) => b[1] - a[1]),
      rawChannels: results.channels
    };
  }
}

// ============================================================================
// FREE INFRASTRUCTURE MONITOR (RIPE Atlas + Public DNS)
// ============================================================================

class FreeInfrastructureMonitor {
  private cache: Map<string, any> = new Map();
  
  async gather(): Promise<any> {
    const results = {
      timestamp: new Date().toISOString(),
      dnsTests: await this.testDNS(),
      pingTests: await this.testConnectivity(),
      ripeMeasurements: await this.fetchRIPEMeasurements(),
      interpretation: ''
    };
    
    results.interpretation = this.generateInterpretation(results);
    return results;
  }
  
  private async testDNS(): Promise<any[]> {
    const targets = [
      { domain: 'irandataportal.sbiran.ir', type: 'government' },
      { domain: 'bankmelli.ir', type: 'banking' },
      { domain: 'sepahnews.ir', type: 'military' },
      { domain: 'farsnews.ir', type: 'news' },
      { domain: 'digikala.com', type: 'commerce' },
    ];
    
    const results = [];
    for (const target of targets) {
      try {
        const start = Date.now();
        // Using public DNS over HTTPS (free)
        const response = await fetch(
          `https://cloudflare-dns.com/dns-query?name=${target.domain}&type=A`,
          {
            headers: { 'Accept': 'application/dns-json' },
            signal: AbortSignal.timeout(10000)
          }
        );
        
        const data = await response.json();
        const latency = Date.now() - start;
        
        results.push({
          domain: target.domain,
          type: target.type,
          status: data.Answer ? 'up' : 'down',
          responseTime: latency,
          ips: data.Answer?.map((a: any) => a.data) || [],
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        results.push({
          domain: target.domain,
          type: target.type,
          status: 'error',
          error: err.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  }
  
  private async testConnectivity(): Promise<any[]> {
    // Test basic connectivity to Iranian networks
    const targets = [
      { host: '185.143.234.1', name: 'IranCell', location: 'Tehran' },
      { host: '5.200.64.1', name: 'MCI', location: 'Tehran' },
      { host: '178.22.120.1', name: 'ParsOnline', location: 'Tehran' }
    ];
    
    // Note: Actual ping requires raw socket privileges
    // For free tier, we use HTTP probe instead
    const results = [];
    for (const target of targets) {
      try {
        const start = Date.now();
        await fetch(`http://${target.host}`, { 
          mode: 'no-cors',
          signal: AbortSignal.timeout(5000)
        });
        results.push({
          target: target.name,
          location: target.location,
          status: 'reachable',
          latency: Date.now() - start
        });
      } catch (err) {
        results.push({
          target: target.name,
          location: target.location,
          status: 'unreachable',
          error: err.message
        });
      }
    }
    
    return results;
  }
  
  private async fetchRIPEMeasurements(): Promise<any> {
    // Free RIPE Atlas API - no key required for public data
    try {
      // Fetch recent measurements from Iran-based probes
      const response = await fetch(
        'https://atlas.ripe.net/api/v2/measurements/?status=ongoing&country=IR&type=ping',
        { signal: AbortSignal.timeout(10000) }
      );
      
      if (!response.ok) return { status: 'api_error' };
      
      const data = await response.json();
      
      return {
        status: 'success',
        activeProbes: data.count || 0,
        measurements: data.results?.slice(0, 5).map((m: any) => ({
          id: m.id,
          target: m.target,
          type: m.type,
          status: m.status
        })) || []
      };
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  }
  
  private generateInterpretation(results: any): string {
    const dnsUp = results.dnsTests.filter((d: any) => d.status === 'up').length;
    const dnsTotal = results.dnsTests.length;
    
    if (dnsUp === dnsTotal) {
      return 'All tested domains resolving normally. Government and military infrastructure online.';
    } else if (dnsUp >= dnsTotal * 0.7) {
      return 'Most domains online. Possible selective blocking or regional outages.';
    } else {
      return 'Significant DNS failures detected. Possible widespread infrastructure degradation.';
    }
  }
}

// ============================================================================
// FREE MARINE/AIS MONITOR
// ============================================================================

class FreeAISMonitor {
  async gather(): Promise<any> {
    // Free AIS sources
    const results = {
      timestamp: new Date().toISOString(),
      sources: [],
      vessels: []
    };
    
    try {
      // OpenAIS (free tier)
      const openAIS = await this.fetchOpenAIS();
      if (openAIS) results.sources.push(openAIS);
    } catch (err) {
      console.log('OpenAIS fetch failed:', err.message);
    }
    
    try {
      // VesselFinder free API (limited)
      const vf = await this.fetchVesselFinder();
      if (vf) results.sources.push(vf);
    } catch (err) {
      console.log('VesselFinder fetch failed:', err.message);
    }
    
    return results;
  }
  
  private async fetchOpenAIS(): Promise<any | null> {
    // OpenAIS API - free with registration
    // https://documentation.opensis.org/
    try {
      const response = await fetch(
        'https://api.opensis.org/v1/vessels?region=persian_gulf',
        { signal: AbortSignal.timeout(10000) }
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return {
        source: 'OpenAIS',
        vesselCount: data.vessels?.length || 0,
        iranianFlagged: data.vessels?.filter((v: any) => v.flag === 'IR').length || 0,
        stationary: data.vessels?.filter((v: any) => v.speed < 1).length || 0,
        sample: data.vessels?.slice(0, 5).map((v: any) => ({
          name: v.name,
          type: v.type,
          flag: v.flag,
          speed: v.speed,
          destination: v.destination
        }))
      };
    } catch (err) {
      return null;
    }
  }
  
  private async fetchVesselFinder(): Promise<any | null> {
    // VesselFinder free tier (50 requests/day)
    const apiKey = process.env.VESSELFINDER_API_KEY;
    if (!apiKey) return null;
    
    try {
      const response = await fetch(
        `https://api.vesselfinder.com/vessels?key=${apiKey}&region=IR`,
        { signal: AbortSignal.timeout(10000) }
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      return {
        source: 'VesselFinder',
        vesselCount: data.length || 0
      };
    } catch (err) {
      return null;
    }
  }
}

// ============================================================================
// FREE SANCTIONS/PUBLIC DATA MONITOR
// ============================================================================

class FreeSanctionsMonitor {
  async gather(): Promise<any> {
    return {
      timestamp: new Date().toISOString(),
      ofac: await this.fetchOFAC(),
      fatf: await this.fetchFATF(),
      un: await this.fetchUNSanctions()
    };
  }
  
  private async fetchOFAC(): Promise<any> {
    try {
      // OFAC SDN list (text format, updated daily)
      const response = await fetch(
        'https://www.treasury.gov/ofac/downloads/sdnlist.txt',
        { signal: AbortSignal.timeout(30000) }
      );
      
      const text = await response.text();
      
      // Count Iran-related entries
      const iranEntries = text.split('\n').filter(line => 
        line.toLowerCase().includes('iran') && 
        (line.includes('Entity') || line.includes('Individual'))
      ).length;
      
      // Check for recent additions (within last 30 days by checking file modification)
      return {
        source: 'OFAC SDN List',
        totalEntries: text.split('Entity').length,
        iranRelatedEntries: iranEntries,
        lastUpdated: 'See https://www.treasury.gov/ofac/downloads/',
        keyEntities: this.extractKeyIranEntities(text)
      };
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  }
  
  private extractKeyIranEntities(text: string): string[] {
    const lines = text.split('\n');
    const entities = [];
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('IRAN') && lines[i].includes('Entity')) {
        // Entity name is usually a few lines before
        entities.push(lines[Math.max(0, i - 2)]?.trim());
      }
      if (entities.length >= 10) break;
    }
    
    return entities.filter(e => e && e.length > 3);
  }
  
  private async fetchFATF(): Promise<any> {
    // FATF grey list (high-risk jurisdictions)
    try {
      const response = await fetch(
        'https://www.fatf-gafi.org/content/fatf-gafi/en/publications/high-risk-and-other-monitored-jurisdictions.html',
        { signal: AbortSignal.timeout(10000) }
      );
      
      const text = await response.text();
      const onGreyList = text.toLowerCase().includes('iran');
      
      return {
        source: 'FATF',
        iranOnGreyList: onGreyList,
        status: onGreyList ? 'High-risk jurisdiction (call for action)' : 'Not on grey list',
        url: 'https://www.fatf-gafi.org'
      };
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  }
  
  private async fetchUNSanctions(): Promise<any> {
    // UN Security Council sanctions
    try {
      // UNSC consolidated list
      const response = await fetch(
        'https://scsanctions.un.org/resources/xml/en/consolidated.xml',
        { signal: AbortSignal.timeout(30000) }
      );
      
      const text = await response.text();
      const iranMentions = (text.match(/Iran/gi) || []).length;
      
      return {
        source: 'UNSC Consolidated List',
        iranRelatedMentions: iranMentions,
        note: 'See https://www.un.org/securitycouncil/content/un-sc-consolidated-list'
      };
    } catch (err) {
      return { status: 'error', message: err.message };
    }
  }
}

// ============================================================================
// MAIN FREE FEED ORCHESTRATOR
// ============================================================================

class FreeDarkSignalsFeed {
  private telegram = new FreeTelegramMonitor();
  private infrastructure = new FreeInfrastructureMonitor();
  private ais = new FreeAISMonitor();
  private sanctions = new FreeSanctionsMonitor();
  
  async generateReport(scenario: string): Promise<any> {
    console.log('\n🔮 MAKAVELI FREE DARK SIGNALS FEED');
    console.log('=' .repeat(70));
    console.log(`Scenario: ${scenario}`);
    console.log(`Mode: FREE TIER (Zero Cost)`);
    console.log(`Timestamp: ${new Date().toISOString()}\n`);
    
    // Run all monitors in parallel
    const [telegramData, infraData, aisData, sanctionsData] = await Promise.all([
      this.telegram.gather(),
      this.infrastructure.gather(),
      this.ais.gather(),
      this.sanctions.gather()
    ]);
    
    const report = {
      scenario,
      timestamp: new Date().toISOString(),
      sources: {
        telegram: telegramData,
        infrastructure: infraData,
        ais: aisData,
        sanctions: sanctionsData
      },
      makaveliSummary: this.generateMakaveliSummary({
        telegram: telegramData,
        infrastructure: infraData,
        ais: aisData,
        sanctions: sanctionsData
      })
    };
    
    this.displayReport(report);
    this.saveReport(report);
    
    return report;
  }
  
  private generateMakaveliSummary(data: any): string {
    const parts = [];
    
    // Telegram summary
    if (data.telegram.status === 'active') {
      parts.push(`Telegram: ${data.telegram.summary.messagesAnalyzed} messages analyzed across ${data.telegram.summary.channelsMonitored} channels. Dominant sentiment: ${data.telegram.summary.dominantSentiment}. Top topics: ${data.telegram.topTopics.slice(0, 3).map((t: any) => t.topic).join(', ')}.`);
    }
    
    // Infrastructure summary
    const dnsUp = data.infrastructure.dnsTests.filter((d: any) => d.status === 'up').length;
    parts.push(`Infrastructure: ${dnsUp}/${data.infrastructure.dnsTests.length} key domains online. ${data.infrastructure.interpretation}`);
    
    // AIS summary
    if (data.ais.sources.length > 0) {
      const vessels = data.ais.sources.reduce((sum: number, s: any) => sum + (s.vesselCount || 0), 0);
      parts.push(`Maritime: ${vessels} vessels tracked in Persian Gulf.`);
    }
    
    // Sanctions summary
    parts.push(`Sanctions: ${data.sanctions.ofac.iranRelatedEntries} Iran-related SDN entries. Iran ${data.sanctions.fatf.iranOnGreyList ? 'on' : 'not on'} FATF grey list.`);
    
    return parts.join(' ');
  }
  
  private displayReport(report: any) {
    console.log('\n📊 MAKAVELI SUMMARY');
    console.log('-'.repeat(70));
    console.log(report.makaveliSummary);
    
    console.log('\n\n📱 TELEGRAM INTELLIGENCE');
    console.log('-'.repeat(70));
    if (report.sources.telegram.status === 'active') {
      console.log(`Channels: ${report.sources.telegram.summary.channelsMonitored}`);
      console.log(`Messages: ${report.sources.telegram.summary.messagesAnalyzed}`);
      console.log(`Sentiment: ${JSON.stringify(report.sources.telegram.summary.sentimentDistribution, null, 2)}`);
      console.log('\nTop Topics:');
      report.sources.telegram.topTopics.forEach((t: any) => {
        console.log(`  • ${t.topic}: ${t.count} mentions`);
      });
      if (report.sources.telegram.viralMessages.length > 0) {
        console.log('\nViral Messages:');
        report.sources.telegram.viralMessages.slice(0, 3).forEach((m: any, i: number) => {
          console.log(`  ${i + 1}. ${m.text.substring(0, 100)}... (${m.views} views, ${m.forwards} forwards)`);
        });
      }
    } else {
      console.log(report.sources.telegram.message);
    }
    
    console.log('\n\n🌐 INFRASTRUCTURE STATUS');
    console.log('-'.repeat(70));
    report.sources.infrastructure.dnsTests.forEach((test: any) => {
      const icon = test.status === 'up' ? '✅' : '❌';
      console.log(`${icon} ${test.domain} (${test.type}): ${test.status}${test.responseTime ? ` (${test.responseTime}ms)` : ''}`);
    });
    console.log(`\nInterpretation: ${report.sources.infrastructure.interpretation}`);
    
    console.log('\n\n🚢 MARITIME/AIS');
    console.log('-'.repeat(70));
    if (report.sources.ais.sources.length === 0) {
      console.log('No AIS data available. Add VESSELFINDER_API_KEY for vessel tracking.');
    } else {
      report.sources.ais.sources.forEach((s: any) => {
        console.log(`${s.source}: ${s.vesselCount} vessels (${s.iranianFlagged || 0} Iranian-flagged)`);
      });
    }
    
    console.log('\n\n💰 SANCTIONS/PUBLIC DATA');
    console.log('-'.repeat(70));
    console.log(`OFAC SDN: ${report.sources.sanctions.ofac.iranRelatedEntries} Iran-related entries`);
    console.log(`FATF Status: ${report.sources.sanctions.fatf.status}`);
    console.log(`UNSC Mentions: ${report.sources.sanctions.un.iranRelatedMentions}`);
  }
  
  private saveReport(report: any) {
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }
    
    const filename = `${CONFIG.outputDir}/dark_signals_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved to ${filename}`);
    
    // Also save latest for easy access
    fs.writeFileSync(
      `${CONFIG.outputDir}/latest.json`,
      JSON.stringify(report, null, 2)
    );
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function askQuestion(question: string): Promise<string> {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer: string) => {
      rl.close();
      resolve(answer);
    });
  });
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

async function main() {
  const scenario = process.argv[2] || 'Iran Conflict - March 2026';
  
  const feed = new FreeDarkSignalsFeed();
  
  // Connect Telegram (requires interactive auth first time)
  const telegram = new FreeTelegramMonitor();
  await telegram.connect();
  
  // Generate report
  const report = await feed.generateReport(scenario);
  
  console.log('\n\n✅ FREE DARK SIGNALS COLLECTION COMPLETE');
  console.log('This data feeds into Makaveli\'s analysis pipeline.');
  console.log(`\nNext steps:`);
  console.log(`1. Read the JSON output from ${CONFIG.outputDir}/latest.json`);
  console.log(`2. Include it in your Makaveli prompt as "Dark Signals Intelligence"`);
  console.log(`3. Run on schedule: cron every 30 minutes`);
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { FreeDarkSignalsFeed, FreeTelegramMonitor, FreeInfrastructureMonitor };
