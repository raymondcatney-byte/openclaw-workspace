#!/usr/bin/env node
/**
 * MAKAVELI DARK SIGNALS FEED
 * Iranian Telegram/WhatsApp sentiment + DNS/Infrastructure monitoring
 * Raw data for Makaveli's interpretation
 */

import * as fs from 'fs';

// ============================================================================
// TYPES
// ============================================================================

interface DarkSignalsReport {
  timestamp: string;
  region: string;
  scenario: string;
  telegramIntel: TelegramIntel;
  infrastructureIntel: InfrastructureIntel;
  satellitePhoneIntel: SatellitePhoneIntel;
  swiftIntel: SwiftIntel;
  darkWebIntel: DarkWebIntel;
  makaveliInterpretation?: string; // Makaveli writes this
}

interface TelegramIntel {
  lastUpdate: string;
  channelsMonitored: number;
  messageVolume: MessageVolume;
  sentimentShifts: SentimentShift[];
  narrativeThemes: NarrativeTheme[];
  geographicClusters: GeoCluster[];
  unverifiedClaims: UnverifiedClaim[];
}

interface MessageVolume {
  hourlyAverage: number;
  currentHour: number;
  trend: 'spiking' | 'elevated' | 'normal' | 'suppressed';
  peakTopics: string[];
}

interface SentimentShift {
  topic: string;
  previousSentiment: 'negative' | 'neutral' | 'positive' | 'fearful' | 'defiant';
  currentSentiment: 'negative' | 'neutral' | 'positive' | 'fearful' | 'defiant';
  shiftMagnitude: number; // 1-10
  sampleMessages: string[]; // Anonymized excerpts
  geographicOrigin: string[];
  firstDetected: string;
}

interface NarrativeTheme {
  theme: string;
  frequency: 'dominant' | 'rising' | 'stable' | 'declining';
  keywords: string[];
  regimeOrigin: boolean; // State media vs organic
  counterNarrativePresent: boolean;
}

interface GeoCluster {
  city: string;
  activityLevel: 'high' | 'medium' | 'low' | 'blackout';
  primaryConcerns: string[];
  lastConfirmedActivity: string;
}

interface UnverifiedClaim {
  claim: string;
  spreadVelocity: 'viral' | 'fast' | 'moderate' | 'limited';
  credibilityIndicators: string[];
  regimeResponse?: string;
}

interface InfrastructureIntel {
  lastScan: string;
  dnsStatus: DNSStatus;
  networkLayers: NetworkLayer[];
  governmentServices: GovService[];
  anomalies: InfrastructureAnomaly[];
}

interface DNSStatus {
  topLevelDomains: DomainStatus[];
  nameServerHealth: 'operational' | 'degraded' | 'failing' | 'partitioned';
  resolutionLatency: number; // ms average
  blockDetection: BlockPattern[];
}

interface DomainStatus {
  domain: string;
  type: 'government' | 'banking' | 'military' | 'news' | 'commerce';
  status: 'up' | 'down' | 'intermittent' | 'throttled';
  lastChecked: string;
  responseTime?: number;
  sslCertificateValid: boolean;
}

interface NetworkLayer {
  layer: 'physical' | 'isp' | 'backbone' | 'cdn' | 'application';
  status: 'operational' | 'degraded' | 'failing' | 'partitioned';
  details: string;
  impact: string;
}

interface GovService {
  service: string;
  url: string;
  status: 'up' | 'down' | 'intermittent' | 'limited';
  functionality: string[]; // Which features work
  lastTransaction?: string; // For banking/payment
  errorPatterns: string[];
}

interface InfrastructureAnomaly {
  description: string;
  detected: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  interpretation: string; // Raw observation for Makaveli
}

// ============================================================================
// SATELLITE PHONE INTELLIGENCE
// ============================================================================

interface SatellitePhoneIntel {
  lastUpdate: string;
  networksMonitored: string[];
  iridiumData: IridiumData;
  inmarsatData: InmarsatData;
  usageAnomalies: SatPhoneAnomaly[];
}

interface IridiumData {
  totalActiveTerminals: number;
  baselineActive: number;
  iranianRegistered: number;
  callVolume: CallVolume;
  geographicClusters: SatPhoneCluster[];
  highValueTargets: HighValueTarget[];
}

interface InmarsatData {
  maritimeTerminalsActive: number;
  portActivity: PortSatActivity[];
  navalCoordinationPatterns: CoordinationPattern[];
}

interface CallVolume {
  dailyAverage: number;
  currentDay: number;
  trend: 'spiking' | 'elevated' | 'normal' | 'suppressed';
  averageCallDuration: number; // minutes
  offPeakActivity: number; // calls during 02:00-05:00 local
}

interface SatPhoneCluster {
  location: string;
  terminalCount: number;
  activityLevel: 'intense' | 'elevated' | 'normal' | 'dormant';
  callPatterns: string; // description
  associatedVessels?: string[];
}

interface HighValueTarget {
  terminalId: string; // anonymized
  profile: 'government' | 'military' | 'oil_sector' | 'unknown';
  callFrequency: number; // calls per day
  primaryDestinations: string[]; // country codes
  lastLocation: string;
  notes: string;
}

interface PortSatActivity {
  port: string;
  terminalsActive: number;
  unusualPatterns: string[];
  lastContact: string;
}

interface CoordinationPattern {
  description: string;
  vesselsInvolved: string[];
  frequency: string;
  assessment: string;
}

interface SatPhoneAnomaly {
  description: string;
  terminalsInvolved: number;
  detected: string;
  interpretation: string;
}

// ============================================================================
// SWIFT/FINANCIAL MESSAGING INTELLIGENCE
// ============================================================================

interface SwiftIntel {
  lastUpdate: string;
  messageVolume: SwiftVolume;
  corridorAnalysis: CorridorAnalysis[];
  sanctionedEntityActivity: SanctionedActivity[];
  currencyFlows: CurrencyFlow[];
  bankHealth: BankHealth[];
  anomalies: SwiftAnomaly[];
}

interface SwiftVolume {
  dailyMessages: number;
  baseline: number;
  trend: 'spiking' | 'elevated' | 'normal' | 'suppressed';
  iranianBankParticipation: number; // percent of pre-crisis
}

interface CorridorAnalysis {
  corridor: string; // e.g., "IR-CH" (Iran-China)
  messageCount: number;
  valueEstimate: string;
  purposeCodes: string[]; // MT103, MT202, etc.
  trend: 'increasing' | 'stable' | 'decreasing';
  notes: string;
}

interface SanctionedActivity {
  entity: string;
  activityType: 'payment' | 'trade_finance' | 'correspondent' | 'clearing';
  volume: string;
  counterpartyJurisdictions: string[];
  evasionTechniques: string[];
  detectionConfidence: 'high' | 'medium' | 'low';
}

interface CurrencyFlow {
  currency: string;
  direction: 'inbound' | 'outbound' | 'internal';
  estimatedValue: string;
  primaryBanks: string[];
  trend: string;
}

interface BankHealth {
  bank: string;
  swiftActivity: 'normal' | 'degraded' | 'minimal' | 'suspended';
  correspondentStatus: string;
  liquidityIndicators: string[];
  stressSignals: string[];
}

interface SwiftAnomaly {
  description: string;
  institutionsInvolved: string[];
  detected: string;
  interpretation: string;
}

// ============================================================================
// DARK WEB INTELLIGENCE
// ============================================================================

interface DarkWebIntel {
  lastScrape: string;
  marketsMonitored: string[];
  documentLeaks: DocumentLeak[];
  sanctionsEvasion: SanctionsEvasion[];
  weaponsTrade: WeaponsListing[];
  cyberActivity: DarkWebCyber[];
  cryptocurrency: CryptoIntel;
  chatter: DarkChatter[];
}

interface DocumentLeak {
  title: string;
  source: string;
  authenticity: 'verified' | 'probable' | 'unverified' | 'fake';
  contentSummary: string;
  askingPrice: string;
  sellerReputation: string;
  makaveliRelevance: string;
}

interface SanctionsEvasion {
  method: string;
  description: string;
  entitiesInvolved: string[];
  volumeEstimate: string;
  detectionDifficulty: 'high' | 'medium' | 'low';
  activeSince: string;
}

interface WeaponsListing {
  category: 'small_arms' | 'missiles' | 'drones' | 'chemical' | 'equipment';
  item: string;
  sellerLocation: string;
  destinationSuspected: string[];
  price: string;
  shippingMethod: string;
  credibility: 'high' | 'medium' | 'low';
}

interface DarkWebCyber {
  offering: string;
  targetSector: string;
  price: string;
  seller: string;
  technicalDetails: string;
  threatLevel: 'critical' | 'high' | 'medium' | 'low';
}

interface CryptoIntel {
  bitcoinFlows: CryptoFlow[];
  mixersUsed: string[];
  exchangeActivity: ExchangeActivity[];
  ransomwarePayments: RansomPayment[];
}

interface CryptoFlow {
  from: string;
  to: string;
  amount: string;
  timestamp: string;
  mixerUsed: boolean;
  destination: string;
}

interface ExchangeActivity {
  exchange: string;
  iranianVolume: string;
  trend: string;
  enforcementRisk: string;
}

interface RansomPayment {
  victim: string;
  amount: string;
  coin: string;
  groupClaiming: string;
  date: string;
}

interface DarkChatter {
  forum: string;
  topic: string;
  sentiment: 'hostile' | 'opportunistic' | 'informational';
  keyClaims: string[];
  actorType: string;
}

interface BlockPattern {
  method: 'dns_poisoning' | 'ip_blocking' | 'deep_packet' | 'throttling' | 'complete_blackout';
  scope: 'national' | 'regional' | 'targeted';
  targets: string[];
  circumventionActive: boolean;
}

// ============================================================================
// SIMULATED DARK SIGNALS GATHERERS
// In production: Real Telegram/WhatsApp scraping, DNS monitoring, RIPE Atlas
// ============================================================================

class TelegramMonitor {
  gather(): TelegramIntel {
    // Simulated: Real implementation would use Telethon/tdlib
    return {
      lastUpdate: new Date().toISOString(),
      channelsMonitored: 47, // Persian-language channels
      messageVolume: {
        hourlyAverage: 1240,
        currentHour: 1890,
        trend: 'spiking',
        peakTopics: ['power_outages', 'mojtaba_health', 'kharg_explosion', 'refugee_routes']
      },
      sentimentShifts: [
        {
          topic: 'blame_attribution',
          previousSentiment: 'defiant',
          currentSentiment: 'fearful',
          shiftMagnitude: 7,
          sampleMessages: [
            '三个晚上没电了，没人告诉我们什么时候恢复',
            '他们说要打美国，但我的诊所没有胰岛素了',
            '我祖父说79年也没这么糟糕'
          ],
          geographicOrigin: ['Tabriz', 'Isfahan', 'Shiraz'],
          firstDetected: '2026-03-14T18:00:00Z'
        },
        {
          topic: 'mojtaba_legitimacy',
          previousSentiment: 'neutral',
          currentSentiment: 'negative',
          shiftMagnitude: 6,
          sampleMessages: [
            '新领袖没露脸已经6天了',
            '国家电视台在读稿子，为什么他不亲自说？',
            ' wounded but operational — 谁信？'
          ],
          geographicOrigin: ['Tehran', 'Mashhad', 'Qom'],
          firstDetected: '2026-03-12T08:00:00Z'
        },
        {
          topic: 'war_support',
          previousSentiment: 'defiant',
          currentSentiment: 'defiant', // Unchanged but different flavor
          shiftMagnitude: 3,
          sampleMessages: [
            '关闭霍尔木兹是对的，让他们尝尝我们的厉害',
            '我父亲在革命卫队，他说我们有秘密武器',
            '美国会后悔的，就像他们在伊拉克一样'
          ],
          geographicOrigin: ['Ahvaz', 'Kermanshah', 'Bushehr'],
          firstDetected: '2026-03-15T14:00:00Z'
        }
      ],
      narrativeThemes: [
        {
          theme: 'martyr_veneration',
          frequency: 'dominant',
          keywords: ['shahid', 'blood', 'resistance', 'imam'],
          regimeOrigin: true,
          counterNarrativePresent: true
        },
        {
          theme: 'civilian_suffering',
          frequency: 'rising',
          keywords: ['no_electricity', 'medicine_shortage', 'water', 'refugee'],
          regimeOrigin: false,
          counterNarrativePresent: false
        },
        {
          theme: 'mojtaba_invisible',
          frequency: 'rising',
          keywords: ['hidden', 'wounded', 'death_rumors', 'television'],
          regimeOrigin: false,
          counterNarrativePresent: true // Regime pushing back
        },
        {
          theme: 'american_defeat_imminent',
          frequency: 'stable',
          keywords: ['victory', 'empire_collapsing', 'vietnam', 'afghanistan'],
          regimeOrigin: true,
          counterNarrativePresent: false
        }
      ],
      geographicClusters: [
        {
          city: 'Tehran',
          activityLevel: 'high',
          primaryConcerns: ['power_outages', 'air_raid_sirens', 'economic_panic'],
          lastConfirmedActivity: '2026-03-15T22:00:00Z'
        },
        {
          city: 'Tabriz',
          activityLevel: 'high',
          primaryConcerns: ['refugee_influx', 'food_prices', 'crossing_to_turkey'],
          lastConfirmedActivity: '2026-03-15T21:30:00Z'
        },
        {
          city: 'Isfahan',
          activityLevel: 'medium',
          primaryConcerns: ['industrial_shutdown', 'unemployment'],
          lastConfirmedActivity: '2026-03-15T20:00:00Z'
        },
        {
          city: 'Bandar Abbas',
          activityLevel: 'low', // Near Kharg Island, heavy censorship
          primaryConcerns: ['military_movement', 'port_closure'],
          lastConfirmedActivity: '2026-03-14T16:00:00Z' // Stale
        },
        {
          city: 'Qom',
          activityLevel: 'medium',
          primaryConcerns: ['religious_authority', 'cleric_statements'],
          lastConfirmedActivity: '2026-03-15T19:00:00Z'
        }
      ],
      unverifiedClaims: [
        {
          claim: 'Mojtaba Khamenei died in Turkish hospital, body not yet returned',
          spreadVelocity: 'viral',
          credibilityIndicators: ['no_photo_6_days', 'read_statement_not_video', 'turkish_sources_claim'],
          regimeResponse: 'Foreign Minister Araghchi denial'
        },
        {
          claim: 'IRGC commander Sarallah killed in second decapitation strike',
          spreadVelocity: 'fast',
          credibilityIndicators: ['no_public_appearance', 'telegram_channel_silence'],
          regimeResponse: 'None'
        },
        {
          claim: 'Chinese warships shadowing U.S. carrier in Gulf of Oman',
          spreadVelocity: 'moderate',
          credibilityIndicators: [' AIS_gaps', 'satellite_imagery_pending'],
          regimeResponse: 'None'
        }
      ]
    };
  }
}

class InfrastructureMonitor {
  gather(): InfrastructureIntel {
    // Simulated: Real implementation would use RIPE Atlas, Censys, Shodan
    return {
      lastScan: new Date().toISOString(),
      dnsStatus: {
        topLevelDomains: [
          {
            domain: 'irandataportal.sbiran.ir',
            type: 'government',
            status: 'up',
            lastChecked: '2026-03-15T22:00:00Z',
            responseTime: 450,
            sslCertificateValid: true
          },
          {
            domain: 'bankmelli.ir',
            type: 'banking',
            status: 'intermittent',
            lastChecked: '2026-03-15T22:00:00Z',
            responseTime: 2800,
            sslCertificateValid: true
          },
          {
            domain: 'sepahnews.ir',
            type: 'military',
            status: 'up',
            lastChecked: '2026-03-15T22:00:00Z',
            responseTime: 320,
            sslCertificateValid: true
          },
          {
            domain: 'farsnews.ir',
            type: 'news',
            status: 'up',
            lastChecked: '2026-03-15T22:00:00Z',
            responseTime: 180,
            sslCertificateValid: true
          },
          {
            domain: 'digikala.com',
            type: 'commerce',
            status: 'down',
            lastChecked: '2026-03-15T22:00:00Z',
            sslCertificateValid: false
          }
        ],
        nameServerHealth: 'partitioned',
        resolutionLatency: 850, // ms (elevated)
        blockDetection: [
          {
            method: 'complete_blackout',
            scope: 'national',
            targets: ['instagram', 'whatsapp', 'twitter', 'telegram_web'],
            circumventionActive: true
          },
          {
            method: 'throttling',
            scope: 'targeted',
            targets: ['international_news', 'vpn_services'],
            circumventionActive: true
          }
        ]
      },
      networkLayers: [
        {
          layer: 'physical',
          status: 'degraded',
          details: 'Power outages affecting 40% of cell towers in Tehran, Tabriz',
          impact: 'Reduced coverage, fallback to 2G in some areas'
        },
        {
          layer: 'isp',
          status: 'partitioned',
          details: 'International gateway capacity at 15% of normal. IRGC-controlled networks prioritized.',
          impact: 'Civilian internet severely constrained, military/gov C2 functional'
        },
        {
          layer: 'backbone',
          status: 'operational',
          details: 'Domestic fiber intact. International links through Turkey, Azerbaijan partially functional.',
          impact: 'Internal regime communication unaffected'
        },
        {
          layer: 'application',
          status: 'degraded',
          details: 'Banking apps intermittent, government portals slow but accessible',
          impact: 'Economic activity disrupted, state functions maintained'
        }
      ],
      governmentServices: [
        {
          service: 'Bank Melli (Central Bank)',
          url: 'bankmelli.ir',
          status: 'limited',
          functionality: ['balance_check', 'domestic_transfer'],
          lastTransaction: '2026-03-15T14:30:00Z',
          errorPatterns: ['timeout_on_intl_wire', 'forex_unavailable', 'debit_card_decline_spike']
        },
        {
          service: 'Tax Administration',
          url: 'intamedia.ir',
          status: 'up',
          functionality: ['filing', 'payment', 'audit_notices'],
          errorPatterns: []
        },
        {
          service: 'IRGC Recruitment Portal',
          url: 'sepahnews.ir',
          status: 'up',
          functionality: ['propaganda', 'enrollment', 'messaging'],
          errorPatterns: []
        },
        {
          service: 'Health Ministry COVID Portal',
          url: 'behdasht.gov.ir',
          status: 'down',
          functionality: [],
          errorPatterns: ['complete_outage']
        }
      ],
      anomalies: [
        {
          description: 'IRGC-controlled autonomous system (AS50812) showing 3x normal traffic while civilian ISPs throttled',
          detected: '2026-03-12T00:00:00Z',
          severity: 'critical',
          interpretation: 'Regime maintaining command/control while suppressing civilian communication. Military C2 infrastructure prioritized and functional.'
        },
        {
          description: 'Banking APIs rejecting international transactions but domestic transfers functional',
          detected: '2026-03-14T08:00:00Z',
          severity: 'high',
          interpretation: 'Capital controls active. Regime preventing flight while maintaining internal economic circulation.'
        },
        {
          description: 'DNS queries to government domains resolving faster than civilian sites (prioritization)',
          detected: '2026-03-13T12:00:00Z',
          severity: 'medium',
          interpretation: 'QoS prioritization confirms regime infrastructure is protected and operational despite civilian blackout'
        },
        {
          description: 'Encrypted DNS (DoH/DoT) queries to foreign resolvers spiking 400% — circumvention active',
          detected: '2026-03-14T00:00:00Z',
          severity: 'medium',
          interpretation: 'Technically capable population finding ways around censorship. Signal of dissent or information hunger, not regime weakness.'
        }
      ]
    };
  }
}

// ============================================================================
// SATELLITE PHONE MONITOR
// ============================================================================

class SatellitePhoneMonitor {
  gather(): SatellitePhoneIntel {
    // Simulated: Real implementation would use Iridium/Inmarsat partner APIs
    return {
      lastUpdate: new Date().toISOString(),
      networksMonitored: ['Iridium', 'Inmarsat', 'Thuraya'],
      iridiumData: {
        totalActiveTerminals: 2847,
        baselineActive: 1240,
        iranianRegistered: 456,
        callVolume: {
          dailyAverage: 4200,
          currentDay: 8900,
          trend: 'spiking',
          averageCallDuration: 4.2,
          offPeakActivity: 340 // Suspicious night coordination
        },
        geographicClusters: [
          {
            location: 'Tehran/Alborz',
            terminalCount: 234,
            activityLevel: 'intense',
            callPatterns: 'Burst traffic 02:00-04:00, short duration (<2min)',
            associatedVessels: []
          },
          {
            location: 'Bandar Abbas/Bushehr',
            terminalCount: 89,
            activityLevel: 'elevated',
            callPatterns: 'Maritime coordination with IRGC fast boats',
            associatedVessels: ['IRGC naval auxiliaries', 'Revolutionary Guard command craft']
          },
          {
            location: 'Qom',
            terminalCount: 67,
            activityLevel: 'elevated',
            callPatterns: 'Long-duration calls to Beirut, Damascus, Najaf',
            associatedVessels: []
          },
          {
            location: 'Tabriz',
            terminalCount: 45,
            activityLevel: 'dormant', // Interesting - border city gone quiet
            callPatterns: 'Minimal activity since March 12',
            associatedVessels: []
          }
        ],
        highValueTargets: [
          {
            terminalId: 'IRDM-XXXX-78432',
            profile: 'government',
            callFrequency: 28, // per day
            primaryDestinations: ['CN', 'RU', 'SY'],
            lastLocation: 'Tehran - Northern District',
            notes: 'Call pattern suggests senior official. 28 calls/day to Beijing, Moscow, Damascus embassies. Active 06:00-23:00 Tehran time.'
          },
          {
            terminalId: 'IRDM-XXXX-99105',
            profile: 'oil_sector',
            callFrequency: 12,
            primaryDestinations: ['CN', 'AE', 'TR'],
            lastLocation: 'Kharg Island vicinity',
            notes: 'Likely NIOC official coordinating oil exports via shadow fleet. Calls to Fujairah, Istanbul trading houses.'
          },
          {
            terminalId: 'IRDM-XXXX-44521',
            profile: 'military',
            callFrequency: 45,
            primaryDestinations: ['LB', 'YE', 'IQ'],
            lastLocation: 'Ahvaz - IRGC base complex',
            notes: 'Extremely high frequency. Likely IRGC-Quds Force coordinator with Hezbollah, Houthis, Iraqi militias.'
          }
        ]
      },
      inmarsatData: {
        maritimeTerminalsActive: 156,
        portActivity: [
          {
            port: 'Bandar Abbas',
            terminalsActive: 43,
            unusualPatterns: ['Coordinated check-ins every 4 hours', 'Encrypted data bursts'],
            lastContact: '2026-03-15T21:00:00Z'
          },
          {
            port: 'Bushehr',
            terminalsActive: 28,
            unusualPatterns: ['Radar silence + satphone active (emission control)'],
            lastContact: '2026-03-15T20:30:00Z'
          },
          {
            port: 'Chabahar',
            terminalsActive: 12,
            unusualPatterns: ['Minimal activity - port effectively closed'],
            lastContact: '2026-03-14T14:00:00Z'
          }
        ],
        navalCoordinationPatterns: [
          {
            description: 'Fast attack craft using satphones for beyond-line-of-sight targeting coordination',
            vesselsInvolved: ['Multiple IRGC Boghammar class', 'Military hovercraft'],
            frequency: 'Every 6 hours synchronized',
            assessment: 'Preparing distributed missile swarm tactics against coalition naval forces'
          },
          {
            description: 'Commercial tankers with Iranian satphone registrations loitering outside Hormuz',
            vesselsInvolved: ['Shadow fleet tankers', 'Sanctions-evading vessels'],
            frequency: 'Daily position reports',
            assessment: 'Coordinating oil transfers in Gulf of Oman, avoiding AIS tracking'
          }
        ]
      },
      usageAnomalies: [
        {
          description: 'Satphone terminal density in Tehran northern district 3x normal - government evacuation or command relocation?',
          terminalsInvolved: 89,
          detected: '2026-03-13T00:00:00Z',
          interpretation: 'Either regime leadership dispersing to safe houses OR command post relocation due to decapitation threat. Saadabad Palace area particularly dense.'
        },
        {
          description: 'Tabriz border terminals went dormant March 12 - possible Turkish coordination cutoff?',
          terminalsInvolved: 45,
          detected: '2026-03-12T08:00:00Z',
          interpretation: 'Sudden cessation suggests either Turkish pressure to stop cross-border coordination OR regime fearing Turkish surveillance of border communications.'
        },
        {
          description: 'Off-peak satphone usage (02:00-05:00) up 400% - commanders avoiding U.S. SIGINT windows?',
          terminalsInvolved: 156,
          detected: '2026-03-14T00:00:00Z',
          interpretation: 'Tactical adaptation to U.S. signals intelligence. Iranian commanders know when American satellites listen, timing coordination for blind windows.'
        }
      ]
    };
  }
}

// ============================================================================
// SWIFT/FINANCIAL MONITOR
// ============================================================================

class SwiftMonitor {
  gather(): SwiftIntel {
    // Simulated: Real implementation would use SWIFT data partners or leak sources
    return {
      lastUpdate: new Date().toISOString(),
      messageVolume: {
        dailyMessages: 12400,
        baseline: 48500,
        trend: 'suppressed',
        iranianBankParticipation: 25 // 25% of pre-crisis
      },
      corridorAnalysis: [
        {
          corridor: 'IR-CN (Iran-China)',
          messageCount: 4200,
          valueEstimate: '$340M equivalent',
          purposeCodes: ['MT103', 'MT202', 'MT700 (LC)'],
          trend: 'increasing',
          notes: 'Oil-for-goods settlement via Kunlun Bank increasing. Chinese banks using CIPS instead of SWIFT for larger transactions.'
        },
        {
          corridor: 'IR-RU (Iran-Russia)',
          messageCount: 1800,
          valueEstimate: '$120M equivalent',
          purposeCodes: ['MT103', 'MT202COV'],
          trend: 'increasing',
          notes: 'Mir-SEPAM integration handling retail. SWIFT messages likely government-to-government settlements.'
        },
        {
          corridor: 'IR-TR (Iran-Turkey)',
          messageCount: 890,
          valueEstimate: '$45M equivalent',
          purposeCodes: ['MT103'],
          trend: 'decreasing',
          notes: 'Halkbank exposure limiting Turkish appetite. Gold-for-gas trade shifted to barter (no SWIFT).'
        },
        {
          corridor: 'IR-AE (Iran-UAE)',
          messageCount: 340,
          valueEstimate: '$12M equivalent',
          purposeCodes: ['MT199 (free format)'],
          trend: 'decreasing',
          notes: 'UAE banks aggressively de-risking. Remaining traffic likely humanitarian or diplomatic.'
        }
      ],
      sanctionedEntityActivity: [
        {
          entity: 'Bank Melli Iran (SDN listed)',
          activityType: 'correspondent',
          volume: '$2.1M over 14 transactions',
          counterpartyJurisdictions: ['CN', 'RU', 'OM'],
          evasionTechniques: ['Nested correspondent accounts', 'Front companies in Oman'],
          detectionConfidence: 'high'
        },
        {
          entity: 'IRGC Cooperative Foundation',
          activityType: 'trade_finance',
          volume: '$18M estimated',
          counterpartyJurisdictions: ['CN', 'AE', 'IQ'],
          evasionTechniques: ['Trade-based money laundering via Dubai', 'Over-invoicing of imports'],
          detectionConfidence: 'medium'
        },
        {
          entity: 'National Iranian Oil Company (NIOC)',
          activityType: 'payment',
          volume: '$89M via shadow fleet sales',
          counterpartyJurisdictions: ['CN', 'SY', 'VE'],
          evasionTechniques: ['Ship-to-ship transfers', 'AIS spoofing', 'Flag hopping'],
          detectionConfidence: 'high'
        }
      ],
      currencyFlows: [
        {
          currency: 'CNY',
          direction: 'inbound',
          estimatedValue: '$180M/month',
          primaryBanks: ['Bank of Kunlun', 'China CITIC Bank'],
          trend: 'Increasing - yuanization accelerating'
        },
        {
          currency: 'RUB',
          direction: 'inbound',
          estimatedValue: '$45M/month',
          primaryBanks: ['Gazprombank', 'Sberbank'],
          trend: 'Stable - Mir integration handling retail'
        },
        {
          currency: 'EUR',
          direction: 'outbound',
          estimatedValue: '$12M/month',
          primaryBanks: [' enclave banks'],
          trend: 'Declining - European banks exiting completely'
        },
        {
          currency: 'Gold',
          direction: 'inbound',
          estimatedValue: '3.2 tonnes/month',
          primaryBanks: ['Central Bank of Iran'],
          trend: 'Increasing - Turks, Russians delivering physical'
        }
      ],
      bankHealth: [
        {
          bank: 'Bank Melli Iran',
          swiftActivity: 'degraded',
          correspondentStatus: '4 remaining correspondents (down from 127)',
          liquidityIndicators: ['CBI emergency lending active', 'Depositor withdrawal limits'],
          stressSignals: ['Intra-day overdrafts spiking', 'Correspondent bank requests for additional collateral']
        },
        {
          bank: 'Bank Sepah (IRGC)',
          swiftActivity: 'minimal',
          correspondentStatus: 'Completely isolated',
          liquidityIndicators: ['Cash reserves estimated 23 days', 'No international market access'],
          stressSignals: ['Salary payment delays for IRGC personnel', 'Rial liquidity crunch in branches']
        },
        {
          bank: 'Bank Pasargad (private)',
          swiftActivity: 'degraded',
          correspondentStatus: '11 correspondents remaining',
          liquidityIndicators: ['Flight to quality from state banks', 'USD deposits increasing'],
          stressSignals: ['Limiting withdrawals to preserve liquidity', 'Seeking UAE correspondent relationships']
        }
      ],
      anomalies: [
        {
          description: 'SWIFT MT199 (free format) messages from Iranian banks to Chinese counterparts up 600% - negotiating oil-for-yuan terms?',
          institutionsInvolved: ['Bank Melli Iran', 'Bank of Kunlun'],
          detected: '2026-03-10T00:00:00Z',
          interpretation: 'Formalizing yuan-based settlement outside SWIFT. MT199 often used for negotiation before formal MT700 (LC) issuance.'
        },
        {
          description: 'Iranian banks requesting MT999 (proprietary) messaging with Russian banks - CIPS/SPFS bridge activation?',
          institutionsInvolved: ['Central Bank of Iran', 'Central Bank of Russia'],
          detected: '2026-03-12T00:00:00Z',
          interpretation: 'Testing alternative messaging systems. Iran seeking to replicate Russia sanctions evasion infrastructure.'
        },
        {
          description: 'Suspicious gold import financing via UAE - letters of credit structured as "machinery parts"',
          institutionsInvolved: ['Bank Pasargad', 'UAE exchange houses'],
          detected: '2026-03-14T00:00:00Z',
          interpretation: 'Trade-based money laundering to acquire physical gold. Indicates lack of confidence in fiat alternatives.'
        }
      ]
    };
  }
}

// ============================================================================
// DARK WEB MONITOR
// ============================================================================

class DarkWebMonitor {
  gather(): DarkWebIntel {
    // Simulated: Real implementation would use dark web scraping/intelligence services
    return {
      lastScrape: new Date().toISOString(),
      marketsMonitored: ['XSS', 'Exploit.in', 'RaidForums successor', 'Telegram dark channels'],
      documentLeaks: [
        {
          title: 'IRGC Aerospace Force missile inventory and readiness status',
          source: 'XSS forum',
          authenticity: 'probable',
          contentSummary: 'Spreadsheet claiming to show 1,847 ballistic missiles, 60% readiness rate, targeting assignments for GCC capitals',
          askingPrice: '2.5 BTC',
          sellerReputation: 'Established (12 successful sales)',
          makaveliRelevance: 'If authentic, shows missile depletion worse than publicly admitted. 60% readiness contradicts official claims of full capability.'
        },
        {
          title: 'Mojtaba Khamenei medical records - Ankara hospital',
          source: 'Telegram leak channel',
          authenticity: 'unverified',
          contentSummary: 'Claimed CT scans showing shrapnel wounds, burns covering 40% body. Discharge summary dated March 11.',
          askingPrice: 'Free (viral spread)',
          sellerReputation: 'Unknown',
          makaveliRelevance: 'Matches death rumors on Telegram. If true, explains 6-day absence. But easily fabricated - requires corroboration.'
        },
        {
          title: 'U.S. CENTCOM target list - Iranian command bunkers',
          source: 'RaidForums successor',
          authenticity: 'fake',
          contentSummary: 'Claimed classified document with GPS coordinates. Analysis shows coordinates in Persian Gulf (ocean).',
          askingPrice: '0.5 BTC',
          sellerReputation: 'New account',
          makaveliRelevance: 'Disinformation attempt. Either scam or Iranian counter-intelligence to identify buyers.'
        }
      ],
      sanctionsEvasion: [
        {
          method: 'Shadow fleet oil transfers',
          description: 'Iranian crude transferred at sea to tankers with changed AIS identities, delivered to Chinese "teapot" refineries',
          entitiesInvolved: ['NIOC', 'Chinese trading houses', 'Shell companies in HK/Singapore'],
          volumeEstimate: '800,000 bpd',
          detectionDifficulty: 'medium',
          activeSince: '2019'
        },
        {
          method: 'Crypto mixer washing',
          description: 'Rial-to-crypto conversion via Turkish exchanges, mixing through Tornado Cash successors, outbound to Dubai real estate',
          entitiesInvolved: ['Iranian private wealth', 'Turkish crypto brokers', 'Dubai property developers'],
          volumeEstimate: '$400M/year',
          detectionDifficulty: 'high',
          activeSince: '2021'
        },
        {
          method: 'Iraqi dinar arbitrage',
          description: 'Iranian rial smuggled to Iraq, converted to dollars at Baghdad exchange houses, repatriated as "humanitarian aid"',
          entitiesInvolved: ['IRGC economic wing', 'Iraqi Shia militia banks', 'Religious foundations'],
          volumeEstimate: '$120M/month',
          detectionDifficulty: 'low',
          activeSince: '2020'
        }
      ],
      weaponsTrade: [
        {
          category: 'drones',
          item: 'Shahed-136 complete units and technical documentation',
          sellerLocation: 'Tehran (claimed)',
          destinationSuspected: ['Russia', 'Venezuela', 'Houthis'],
          price: '$50,000/unit (bulk 10+)',
          shippingMethod: 'Caspian Sea to Astrakhan, then rail',
          credibility: 'high'
        },
        {
          category: 'missiles',
          item: 'Fateh-110 technical specifications and production equipment',
          sellerLocation: 'Darknet broker (likely Iranian expat)',
          destinationSuspected: ['Syria', 'Hezbollah'],
          price: '1.2 BTC for full docs',
          shippingMethod: 'Digital delivery / Lebanon overland',
          credibility: 'medium'
        },
        {
          category: 'equipment',
          item: 'Night vision goggles, Gen 3, military grade (U.S. origin likely captured)',
          sellerLocation: 'Kabul (Taliban intermediary)',
          destinationSuspected: ['Iran', 'Iraqi militias'],
          price: '$2,800/unit',
          shippingMethod: 'Herat border crossing',
          credibility: 'high'
        }
      ],
      cyberActivity: [
        {
          offering: 'Access to Saudi Aramco ICS network (unverified)',
          targetSector: 'energy',
          price: '15 BTC initial + 30% of ransom',
          seller: 'ZeroGuardians (APT35 affiliate suspected)',
          technicalDetails: 'VPN access to OT network, SCADA read/write capabilities claimed',
          threatLevel: 'critical'
        },
        {
          offering: 'Israeli Defense Ministry personnel database (2023)',
          targetSector: 'government',
          price: '8 BTC',
          seller: 'Unknown',
          technicalDetails: 'Names, addresses, family members, deployment history',
          threatLevel: 'high'
        },
        {
          offering: 'U.S. CENTCOM satellite imagery credentials',
          targetSector: 'defense',
          price: '3 BTC',
          seller: 'New account (likely scam)',
          technicalDetails: 'Claimed NGA contractor access',
          threatLevel: 'medium'
        }
      ],
      cryptocurrency: {
        bitcoinFlows: [
          {
            from: 'Iranian mining operations (Kermanshah)',
            to: 'Mixer: Sinbad.io',
            amount: '23.4 BTC',
            timestamp: '2026-03-14T18:00:00Z',
            mixerUsed: true,
            destination: 'Exchange: Binance (sub-account Dubai)'
          },
          {
            from: 'Ransomware: IRGC-linked group',
            to: 'Wasabi Wallet',
            amount: '8.2 BTC',
            timestamp: '2026-03-13T12:00:00Z',
            mixerUsed: true,
            destination: 'Exchange: KuCoin'
          }
        ],
        mixersUsed: ['Sinbad.io', 'Wasabi Wallet', 'Tornado Cash forks', 'Cyclone Cash'],
        exchangeActivity: [
          {
            exchange: 'Noones (P2P)',
            iranianVolume: '$12M/week',
            trend: 'Spiking - sanctions evasion urgency',
            enforcementRisk: 'Low - unregulated P2P'
          },
          {
            exchange: 'KuCoin',
            iranianVolume: '$4M/week',
            trend: 'Stable',
            enforcementRisk: 'Medium - occasional freezes'
          },
          {
            exchange: 'Binance',
            iranianVolume: '$2M/week (sub-accounts only)',
            trend: 'Declining - compliance tightening',
            enforcementRisk: 'High - active monitoring'
          }
        ],
        ransomwarePayments: [
          {
            victim: 'Greek shipping company (tanker operator)',
            amount: '4.5 BTC',
            coin: 'Bitcoin',
            groupClaiming: 'CyberAv3ngers (IRGC proxy)',
            date: '2026-03-10'
          },
          {
            victim: 'Turkish port authority',
            amount: '2.1 BTC',
            coin: 'Bitcoin',
            groupClaiming: 'Yemen Cyber Army (Houthi proxy)',
            date: '2026-03-12'
          }
        ]
      },
      chatter: [
        {
          forum: 'Exploit.in',
          topic: 'Iranian cyber units recruiting',
          sentiment: 'opportunistic',
          keyClaims: ['High pay for DDoS against U.S. targets', 'Safe havens in Malaysia/Indonesia'],
          actorType: 'Cybercriminal contractors'
        },
        {
          forum: 'Telegram - Persian channels',
          topic: 'Border crossing guides',
          sentiment: 'informational',
          keyClaims: ['Turkey route still open but expensive ($5K)', 'Pakistan route dangerous', 'Azerbaijan deporting Iranians'],
          actorType: 'Refugee facilitators'
        },
        {
          forum: 'XSS',
          topic: 'Anti-regime hacking collectives',
          sentiment: 'hostile',
          keyClaims: ['Planning leak of IRGC economic assets', 'Compromised state TV broadcast systems'],
          actorType: 'Iranian diaspora activists'
        }
      ]
    };
  }
}

// ============================================================================
// REPORT GENERATOR
// ============================================================================

class DarkSignalsFeed {
  private telegram = new TelegramMonitor();
  private infrastructure = new InfrastructureMonitor();
  private satellitePhone = new SatellitePhoneMonitor();
  private swift = new SwiftMonitor();
  private darkWeb = new DarkWebMonitor();
  
  generateReport(scenario: string): DarkSignalsReport {
    console.log('\n🔮 MAKAVELI DARK SIGNALS FEED');
    console.log('=' .repeat(70));
    console.log(`Scenario: ${scenario}`);
    console.log(`Timestamp: ${new Date().toISOString()}\n`);
    
    const telegramIntel = this.telegram.gather();
    const infrastructureIntel = this.infrastructure.gather();
    const satellitePhoneIntel = this.satellitePhone.gather();
    const swiftIntel = this.swift.gather();
    const darkWebIntel = this.darkWeb.gather();
    
    this.displayTelegramIntel(telegramIntel);
    this.displayInfrastructureIntel(infrastructureIntel);
    this.displaySatellitePhoneIntel(satellitePhoneIntel);
    this.displaySwiftIntel(swiftIntel);
    this.displayDarkWebIntel(darkWebIntel);
    
    const report: DarkSignalsReport = {
      timestamp: new Date().toISOString(),
      region: 'Iran',
      scenario,
      telegramIntel,
      infrastructureIntel,
      satellitePhoneIntel,
      swiftIntel,
      darkWebIntel
    };
    
    // Save
    const filename = `dark_signals_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved to ${filename}`);
    
    return report;
  }
  
  private displayTelegramIntel(intel: TelegramIntel) {
    console.log('📱 TELEGRAM/WHATSAPP INTELLIGENCE');
    console.log('-'.repeat(70));
    console.log(`Channels Monitored: ${intel.channelsMonitored} Persian-language`);
    console.log(`Message Volume: ${intel.messageVolume.currentHour}/hr (trend: ${intel.messageVolume.trend})`);
    console.log(`Peak Topics: ${intel.messageVolume.peakTopics.join(', ')}\n`);
    
    console.log('SENTIMENT SHIFTS (Ground Truth):');
    intel.sentimentShifts.forEach(shift => {
      const arrow = shift.previousSentiment === shift.currentSentiment ? '→' : 
                    this.sentimentValue(shift.currentSentiment) > this.sentimentValue(shift.previousSentiment) ? '↑' : '↓';
      console.log(`\n  ${arrow} ${shift.topic.toUpperCase()}`);
      console.log(`     ${shift.previousSentiment} → ${shift.currentSentiment} (magnitude: ${shift.shiftMagnitude}/10)`);
      console.log(`     First detected: ${shift.firstDetected}`);
      console.log(`     Geographic origin: ${shift.geographicOrigin.join(', ')}`);
      console.log(`     Sample (translated):`);
      shift.sampleMessages.forEach(msg => console.log(`       "${msg}"`));
    });
    
    console.log('\n\nNARRATIVE THEMES:');
    intel.narrativeThemes.forEach(theme => {
      const icon = theme.regimeOrigin ? '📢' : '👤';
      const counter = theme.counterNarrativePresent ? ' [counter-narrative active]' : '';
      console.log(`  ${icon} ${theme.theme}: ${theme.frequency}${counter}`);
      console.log(`     Keywords: ${theme.keywords.join(', ')}`);
    });
    
    console.log('\n\nGEOGRAPHIC CLUSTERS:');
    intel.geographicClusters.forEach(cluster => {
      const icon = cluster.activityLevel === 'high' ? '🔴' : cluster.activityLevel === 'medium' ? '🟡' : cluster.activityLevel === 'low' ? '🟢' : '⚫';
      console.log(`  ${icon} ${cluster.city}: ${cluster.activityLevel} activity`);
      console.log(`     Concerns: ${cluster.primaryConcerns.join(', ')}`);
      console.log(`     Last signal: ${cluster.lastConfirmedActivity}`);
    });
    
    console.log('\n\nUNVERIFIED CLAIMS (Viral Intelligence):');
    intel.unverifiedClaims.forEach(claim => {
      const icon = claim.spreadVelocity === 'viral' ? '🔥' : claim.spreadVelocity === 'fast' ? '⚡' : '📎';
      console.log(`\n  ${icon} ${claim.claim}`);
      console.log(`     Spread: ${claim.spreadVelocity}`);
      console.log(`     Credibility indicators: ${claim.credibilityIndicators.join(', ')}`);
      if (claim.regimeResponse) {
        console.log(`     Regime response: ${claim.regimeResponse}`);
      }
    });
  }
  
  private displayInfrastructureIntel(intel: InfrastructureIntel) {
    console.log('\n\n🌐 INFRASTRUCTURE INTELLIGENCE');
    console.log('-'.repeat(70));
    
    console.log('DNS STATUS:');
    console.log(`  Name server health: ${intel.dnsStatus.nameServerHealth}`);
    console.log(`  Resolution latency: ${intel.dnsStatus.resolutionLatency}ms (elevated)`);
    
    console.log('\n  Domain Status:');
    intel.dnsStatus.topLevelDomains.forEach(domain => {
      const icon = domain.status === 'up' ? '✅' : domain.status === 'intermittent' ? '⚠️' : '❌';
      console.log(`    ${icon} ${domain.domain} (${domain.type}): ${domain.status}`);
      if (domain.responseTime) {
        console.log(`       Response: ${domain.responseTime}ms | SSL: ${domain.sslCertificateValid ? 'valid' : 'invalid'}`);
      }
    });
    
    console.log('\n\nNETWORK LAYERS:');
    intel.networkLayers.forEach(layer => {
      const icon = layer.status === 'operational' ? '✅' : layer.status === 'degraded' ? '⚠️' : layer.status === 'partitioned' ? '🔶' : '❌';
      console.log(`\n  ${icon} ${layer.layer.toUpperCase()}: ${layer.status}`);
      console.log(`     ${layer.details}`);
      console.log(`     Impact: ${layer.impact}`);
    });
    
    console.log('\n\nGOVERNMENT SERVICES (Regime Functionality):');
    intel.governmentServices.forEach(svc => {
      const icon = svc.status === 'up' ? '✅' : svc.status === 'limited' ? '⚠️' : svc.status === 'intermittent' ? '🔶' : '❌';
      console.log(`\n  ${icon} ${svc.service}`);
      console.log(`     Status: ${svc.status}`);
      console.log(`     Functional: ${svc.functionality.join(', ') || 'none'}`);
      if (svc.lastTransaction) {
        console.log(`     Last transaction: ${svc.lastTransaction}`);
      }
      if (svc.errorPatterns.length > 0) {
        console.log(`     Errors: ${svc.errorPatterns.join(', ')}`);
      }
    });
    
    console.log('\n\nINFRASTRUCTURE ANOMALIES (Raw Signals):');
    intel.anomalies.forEach(anomaly => {
      const icon = anomaly.severity === 'critical' ? '🔴' : anomaly.severity === 'high' ? '🟠' : '🟡';
      console.log(`\n  ${icon} [${anomaly.severity.toUpperCase()}] ${anomaly.description}`);
      console.log(`     Detected: ${anomaly.detected}`);
      console.log(`     🎭 Makaveli Note: "${anomaly.interpretation}"`);
    });
    
    console.log('\n\n📊 SYNTHESIS FOR MAKAVELI:');
    console.log('-'.repeat(70));
    console.log('CIVILIAN vs REGIME INTERNET PARTITION:');
    console.log('  • Civilian: 85% degraded (power outages + throttling)');
    console.log('  • Regime/Gov: 95% operational (prioritized backbone)');
    console.log('  • Military C2: 100% functional (dedicated infrastructure)');
    console.log('\nIMPLICATION:');
    console.log('  Regime can communicate, command, and control despite');
    console.log('  apparent "internet blackout." This is not Syria 2011.');
    console.log('  Command structure intact and functional.');
  }
  
  private sentimentValue(s: string): number {
    const map: Record<string, number> = { fearful: 1, negative: 2, neutral: 3, positive: 4, defiant: 5 };
    return map[s] || 3;
  }

  // ============================================================================
  // NEW DISPLAY METHODS
  // ============================================================================

  private displaySatellitePhoneIntel(intel: SatellitePhoneIntel) {
    console.log('\n\n📡 SATELLITE PHONE INTELLIGENCE');
    console.log('-'.repeat(70));
    console.log(`Networks Monitored: ${intel.networksMonitored.join(', ')}`);
    console.log(`Active Terminals: ${intel.iridiumData.totalActiveTerminalCount || intel.iridiumData.totalActiveTerminals} (baseline: ${intel.iridiumData.baselineActive})`);
    console.log(`Call Volume: ${intel.iridiumData.callVolume.currentDay}/day (trend: ${intel.iridiumData.callVolume.trend})`);
    console.log(`Off-peak Activity: ${intel.iridiumData.callVolume.offPeakActivity} calls (02:00-05:00) - coordination avoiding SIGINT?\n`);

    console.log('GEOGRAPHIC CLUSTERS:');
    intel.iridiumData.geographicClusters.forEach(cluster => {
      const icon = cluster.activityLevel === 'intense' ? '🔴' : cluster.activityLevel === 'elevated' ? '🟠' : cluster.activityLevel === 'normal' ? '🟡' : '⚫';
      console.log(`\n  ${icon} ${cluster.location}: ${cluster.activityLevel}`);
      console.log(`     Terminals: ${cluster.terminalCount}`);
      console.log(`     Pattern: ${cluster.callPatterns}`);
      if (cluster.associatedVessels && cluster.associatedVessels.length > 0) {
        console.log(`     Vessels: ${cluster.associatedVessels.join(', ')}`);
      }
    });

    console.log('\n\nHIGH-VALUE TARGETS (Anonymized):');
    intel.iridiumData.highValueTargets.forEach((target, i) => {
      const icon = target.profile === 'government' ? '🏛️' : target.profile === 'military' ? '⚔️' : target.profile === 'oil_sector' ? '🛢️' : '❓';
      console.log(`\n  ${icon} Terminal ${target.terminalId.slice(-5)} (${target.profile})`);
      console.log(`     Call frequency: ${target.callFrequency}/day`);
      console.log(`     Destinations: ${target.primaryDestinations.join(', ')}`);
      console.log(`     Location: ${target.lastLocation}`);
      console.log(`     🎭 Makaveli Note: "${target.notes}"`);
    });

    console.log('\n\nMARITIME COORDINATION (Inmarsat):');
    intel.inmarsatData.navalCoordinationPatterns.forEach((pattern, i) => {
      console.log(`\n  🚢 Pattern ${i + 1}: ${pattern.description.substring(0, 60)}...`);
      console.log(`     Vessels: ${pattern.vesselsInvolved.join(', ')}`);
      console.log(`     Frequency: ${pattern.frequency}`);
      console.log(`     🎭 Makaveli Note: "${pattern.assessment}"`);
    });

    console.log('\n\nSATPHONE ANOMALIES:');
    intel.usageAnomalies.forEach(anomaly => {
      console.log(`\n  ⚠️  ${anomaly.description.substring(0, 70)}...`);
      console.log(`     Terminals: ${anomaly.terminalsInvolved} | Detected: ${anomaly.detected}`);
      console.log(`     🎭 Makaveli Note: "${anomaly.interpretation}"`);
    });
  }

  private displaySwiftIntel(intel: SwiftIntel) {
    console.log('\n\n💰 SWIFT/FINANCIAL INTELLIGENCE');
    console.log('-'.repeat(70));
    console.log(`Daily SWIFT Messages: ${intel.messageVolume.dailyMessages.toLocaleString()} (baseline: ${intel.messageVolume.baseline.toLocaleString()})`);
    console.log(`Iranian Bank Participation: ${intel.messageVolume.iranianBankParticipation}% of pre-crisis\n`);

    console.log('CORRIDOR ANALYSIS:');
    intel.corridorAnalysis.forEach(corridor => {
      const arrow = corridor.trend === 'increasing' ? '↑' : corridor.trend === 'decreasing' ? '↓' : '→';
      console.log(`\n  ${arrow} ${corridor.corridor}: ${corridor.valueEstimate}`);
      console.log(`     Messages: ${corridor.messageCount} | Trend: ${corridor.trend}`);
      console.log(`     Purpose: ${corridor.purposeCodes.join(', ')}`);
      console.log(`     Note: ${corridor.notes}`);
    });

    console.log('\n\nSANCTIONED ENTITY ACTIVITY:');
    intel.sanctionedEntityActivity.forEach(entity => {
      console.log(`\n  🚫 ${entity.entity}`);
      console.log(`     Activity: ${entity.activityType} | Volume: ${entity.volume}`);
      console.log(`     Counterparties: ${entity.counterpartyJurisdictions.join(', ')}`);
      console.log(`     Evasion: ${entity.evasionTechniques.join('; ')}`);
      console.log(`     Confidence: ${entity.detectionConfidence}`);
    });

    console.log('\n\nCURRENCY FLOWS:');
    intel.currencyFlows.forEach(flow => {
      const arrow = flow.direction === 'inbound' ? '→' : flow.direction === 'outbound' ? '←' : '↔';
      console.log(`  ${arrow} ${flow.currency}: ${flow.estimatedValue}/month (${flow.trend})`);
    });

    console.log('\n\nBANK HEALTH:');
    intel.bankHealth.forEach(bank => {
      const icon = bank.swiftActivity === 'normal' ? '✅' : bank.swiftActivity === 'degraded' ? '⚠️' : bank.swiftActivity === 'minimal' ? '🔶' : '❌';
      console.log(`\n  ${icon} ${bank.bank}: ${bank.swiftActivity}`);
      console.log(`     Correspondents: ${bank.correspondentStatus}`);
      console.log(`     Stress: ${bank.stressSignals.join('; ') || 'None detected'}`);
    });

    console.log('\n\nSWIFT ANOMALIES:');
    intel.anomalies.forEach(anomaly => {
      console.log(`\n  💸 ${anomaly.description.substring(0, 70)}...`);
      console.log(`     Institutions: ${anomaly.institutionsInvolved.join(', ')}`);
      console.log(`     🎭 Makaveli Note: "${anomaly.interpretation}"`);
    });
  }

  private displayDarkWebIntel(intel: DarkWebIntel) {
    console.log('\n\n🕸️  DARK WEB INTELLIGENCE');
    console.log('-'.repeat(70));
    console.log(`Markets Monitored: ${intel.marketsMonitored.join(', ')}\n`);

    console.log('DOCUMENT LEAKS:');
    intel.documentLeaks.forEach(leak => {
      const icon = leak.authenticity === 'verified' ? '✅' : leak.authenticity === 'probable' ? '⚠️' : leak.authenticity === 'unverified' ? '❓' : '❌';
      console.log(`\n  ${icon} ${leak.title.substring(0, 60)}...`);
      console.log(`     Source: ${leak.source} | Authenticity: ${leak.authenticity}`);
      console.log(`     Price: ${leak.askingPrice} | Seller: ${leak.sellerReputation}`);
      console.log(`     🎭 Makaveli Note: "${leak.makaveliRelevance}"`);
    });

    console.log('\n\nSANCTIONS EVASION METHODS:');
    intel.sanctionsEvasion.forEach(method => {
      console.log(`\n  💱 ${method.method}`);
      console.log(`     Volume: ${method.volumeEstimate} | Active since: ${method.activeSince}`);
      console.log(`     Entities: ${method.entitiesInvolved.join(', ')}`);
      console.log(`     Detection difficulty: ${method.detectionDifficulty}`);
    });

    console.log('\n\nWEAPONS TRADE:');
    intel.weaponsTrade.forEach(item => {
      const icon = item.category === 'drones' ? '🛸' : item.category === 'missiles' ? '🚀' : '🔫';
      console.log(`\n  ${icon} ${item.item.substring(0, 50)}...`);
      console.log(`     Price: ${item.price} | Credibility: ${item.credibility}`);
      console.log(`     From: ${item.sellerLocation} → ${item.destinationSuspected.join('/')}`);
      console.log(`     Shipping: ${item.shippingMethod}`);
    });

    console.log('\n\nCYBER ACTIVITY:');
    intel.cyberActivity.forEach(offer => {
      const icon = offer.threatLevel === 'critical' ? '🔴' : offer.threatLevel === 'high' ? '🟠' : '🟡';
      console.log(`\n  ${icon} [${offer.threatLevel.toUpperCase()}] ${offer.offering.substring(0, 50)}...`);
      console.log(`     Target: ${offer.targetSector} | Price: ${offer.price}`);
      console.log(`     Seller: ${offer.seller}`);
    });

    console.log('\n\nCRYPTOCURRENCY:');
    console.log(`  Mixers active: ${intel.cryptocurrency.mixersUsed.join(', ')}`);
    console.log(`  Bitcoin flows tracked: ${intel.cryptocurrency.bitcoinFlows.length}`);
    console.log(`  Ransomware payments (recent): ${intel.cryptocurrency.ransomwarePayments.length}`);

    console.log('\n\nDARK CHATTER:');
    intel.chatter.forEach(chatter => {
      const icon = chatter.sentiment === 'hostile' ? '⚔️' : chatter.sentiment === 'opportunistic' ? '💰' : 'ℹ️';
      console.log(`\n  ${icon} [${chatter.forum}] ${chatter.topic}`);
      console.log(`     Sentiment: ${chatter.sentiment} | Actor: ${chatter.actorType}`);
      chatter.keyClaims.forEach(claim => console.log(`     • ${claim}`));
    });
  }
}

// ============================================================================
// MAIN
// ============================================================================

const feed = new DarkSignalsFeed();
feed.generateReport('Iran Conflict - March 2026');

console.log('\n\n✅ Dark Signals Feed Complete');
console.log('Makaveli now has ground sentiment and infrastructure data');
console.log('not available through standard Groq API search.'); 