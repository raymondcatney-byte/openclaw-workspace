#!/usr/bin/env node
/**
 * MAKAVELI INTELLIGENCE FEED SYSTEM v1.0
 * Enhanced data inputs + Three-Degree Probability Framework
 * Preserves Makaveli's voice and strategic synthesis
 */

import * as fs from 'fs';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface IntelligenceReport {
  scenario: string;
  timestamp: string;
  sources: SourceAssessment[];
  swarmFeeds: SwarmFeed[];
  threeDegreeProb: ThreeDegreeProbability;
  confidenceMetrics: ConfidenceMetrics;
  indicators: WatchIndicator[];
  makaveliSynthesis?: string; // Makaveli writes this
}

interface SourceAssessment {
  name: string;
  reliability: number; // 1-10
  bias: 'pro-west' | 'pro-iran' | 'neutral' | 'unknown';
  lastUpdate: string;
  keyClaims: Claim[];
}

interface Claim {
  statement: string;
  confidence: number; // Makaveli assesses this
  entropy: number; // Uncertainty metric
}

interface SwarmFeed {
  agentType: 'resource' | 'alliance' | 'military' | 'economic' | 'sentiment';
  attentionWeight: number; // Dynamic based on scenario
  dataPoints: DataPoint[];
  anomalies: Anomaly[];
}

interface DataPoint {
  metric: string;
  value: string | number;
  timestamp: string;
  source: string;
}

interface Anomaly {
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  expectedValue: string;
  actualValue: string;
  makaveliNote?: string; // Flag for Makaveli's attention
}

interface ThreeDegreeProbability {
  primary: ProbabilityBranch;   // Most likely (50-70%)
  secondary: ProbabilityBranch; // Alternative (20-40%)
  tertiary: ProbabilityBranch;  // Tail risk (5-15%)
  bayesianHistory: BayesianUpdate[];
}

interface ProbabilityBranch {
  label: string;
  probability: number; // 0-100
  description: string;
  keyDrivers: string[];
  entropy: number; // Uncertainty within this branch
  makaveliAssessment?: string;
}

interface BayesianUpdate {
  timestamp: string;
  event: string;
  priorPrimary: number;
  posteriorPrimary: number;
  likelihoodRatio: number;
  notes: string;
}

interface ConfidenceMetrics {
  overall: number; // 1-10
  dataCompleteness: number; // 1-10
  sourceReliability: number; // 1-10
  modelEntropy: number; // Shannon entropy in bits
  keyUncertainties: string[];
}

interface WatchIndicator {
  name: string;
  currentStatus: string;
  threshold: string;
  trend: 'improving' | 'stable' | 'deteriorating' | 'uncertain';
  timeToThreshold?: string;
  makaveliPriority: 'critical' | 'high' | 'medium' | 'low';
}

// ============================================================================
// SWARM AGENT SIMULATORS (Data Gathering Layer)
// ============================================================================

class ResourceAnalyst {
  analyze(scenario: string): SwarmFeed {
    // In production: Real API calls to energy data, satellite imagery
    return {
      agentType: 'resource',
      attentionWeight: this.calculateRelevance(scenario),
      dataPoints: [
        { metric: 'Hormuz throughput', value: '12% of normal', timestamp: new Date().toISOString(), source: 'satellite_tracking' },
        { metric: 'Brent crude', value: '$94.50/bbl', timestamp: new Date().toISOString(), source: 'market_data' },
        { metric: 'Iran oil exports', value: '0.8mbpd (down from 1.4mbpd)', timestamp: new Date().toISOString(), source: 'tanker_tracking' },
        { metric: 'SPR drawdown rate', value: '1.2M bbl/day', timestamp: new Date().toISOString(), source: 'IEA' }
      ],
      anomalies: [
        {
          description: 'Kharg Island export terminal showing thermal signatures consistent with repair operations despite official claims of total destruction',
          severity: 'medium',
          expectedValue: 'No activity (per official statements)',
          actualValue: 'Active thermal signatures detected',
          makaveliNote: 'Possible deception operation or partial functionality'
        },
        {
          description: 'Chinese tanker traffic rerouting to avoid Hormuz at 3x normal rate',
          severity: 'high',
          expectedValue: 'Normal routing patterns',
          actualValue: 'Massive diversion to Cape route'
        }
      ]
    };
  }
  
  private calculateRelevance(scenario: string): number {
    if (scenario.toLowerCase().includes('hormuz') || 
        scenario.toLowerCase().includes('oil') || 
        scenario.toLowerCase().includes('energy')) {
      return 2.8;
    }
    if (scenario.toLowerCase().includes('sanctions') || 
        scenario.toLowerCase().includes('economic')) {
      return 2.2;
    }
    return 0.6;
  }
}

class AllianceTracker {
  analyze(scenario: string): SwarmFeed {
    return {
      agentType: 'alliance',
      attentionWeight: this.calculateRelevance(scenario),
      dataPoints: [
        { metric: 'Saudi-Pakistan SMDA activation status', value: 'Standby (not triggered)', timestamp: new Date().toISOString(), source: 'diplomatic_chatter' },
        { metric: 'GCC emergency session', value: 'Scheduled March 18', timestamp: new Date().toISOString(), source: 'diplomatic_cables' },
        { metric: 'Turkish naval deployment', value: '2 frigates to Eastern Med', timestamp: new Date().toISOString(), source: 'maritime_tracking' },
        { metric: 'Russian diplomatic engagement', value: 'Backchannel offers to Iran', timestamp: new Date().toISOString(), source: 'intelligence_assessment' }
      ],
      anomalies: [
        {
          description: 'UAE officials privately signaling openness to Hormuz reopening while publicly supporting closure',
          severity: 'high',
          expectedValue: 'Unified GCC stance',
          actualValue: 'UAE bifurcated messaging'
        }
      ]
    };
  }
  
  private calculateRelevance(scenario: string): number {
    if (scenario.toLowerCase().includes('alliance') || 
        scenario.toLowerCase().includes('saudi') || 
        scenario.toLowerCase().includes('gcc') ||
        scenario.toLowerCase().includes('pakistan')) {
      return 2.5;
    }
    return 0.8;
  }
}

class MilitaryObserver {
  analyze(scenario: string): SwarmFeed {
    return {
      agentType: 'military',
      attentionWeight: this.calculateRelevance(scenario),
      dataPoints: [
        { metric: 'U.S. sortie rate', value: '180/day (down from 240/day)', timestamp: new Date().toISOString(), source: 'CENTCOM' },
        { metric: 'Iranian missile inventory', value: 'Estimated 60% depleted', timestamp: new Date().toISOString(), source: 'intelligence_estimate' },
        { metric: 'Israeli interceptor stocks', value: 'Critical (<200 Arrow missiles)', timestamp: new Date().toISOString(), source: 'IDF_assessment' },
        { metric: 'THAAD redeployment', value: '2 batteries from Korea to UAE', timestamp: new Date().toISOString(), source: 'DoD' }
      ],
      anomalies: [
        {
          description: 'Iranian IRGC command structure showing coordination despite claimed decapitation',
          severity: 'critical',
          expectedValue: 'Degraded command and control',
          actualValue: 'Continued operational coherence'
        },
        {
          description: 'Hezbollah rocket fire intensity declining faster than inventory depletion suggests',
          severity: 'medium',
          expectedValue: 'Sustained fire rate',
          actualValue: '30% reduction in launches'
        }
      ]
    };
  }
  
  private calculateRelevance(scenario: string): number {
    if (scenario.toLowerCase().includes('military') || 
        scenario.toLowerCase().includes('strike') || 
        scenario.toLowerCase().includes('escalation') ||
        scenario.toLowerCase().includes('war')) {
      return 2.5;
    }
    return 0.7;
  }
}

class EconomicSensor {
  analyze(scenario: string): SwarmFeed {
    return {
      agentType: 'economic',
      attentionWeight: this.calculateRelevance(scenario),
      dataPoints: [
        { metric: 'Asian LNG price', value: '$18.50/MMBtu (+54%)', timestamp: new Date().toISOString(), source: 'commodity_markets' },
        { metric: 'Iranian rial vs USD', value: '580,000 (black market)', timestamp: new Date().toISOString(), source: 'currency_trackers' },
        { metric: 'Global shipping insurance', value: '+340% for Gulf routes', timestamp: new Date().toISOString(), source: 'Lloyd\'s' },
        { metric: 'Iranian inflation (unofficial)', value: '89% annualized', timestamp: new Date().toISOString(), source: 'economic_monitoring' }
      ],
      anomalies: [
        {
          description: 'Iranian central bank injecting foreign currency at unsustainable rate despite sanctions',
          severity: 'high',
          expectedValue: 'Currency collapse',
          actualValue: 'Managed float holding'
        }
      ]
    };
  }
  
  private calculateRelevance(scenario: string): number {
    if (scenario.toLowerCase().includes('economic') || 
        scenario.toLowerCase().includes('sanctions') || 
        scenario.toLowerCase().includes('financial')) {
      return 2.0;
    }
    return 0.6;
  }
}

// ============================================================================
// PROBABILITY CALCULATION ENGINE
// ============================================================================

class ProbabilityEngine {
  calculateThreeDegree(scenario: string, feeds: SwarmFeed[]): ThreeDegreeProbability {
    // This is where Makaveli's judgment would integrate
    // For now, algorithmic baseline that Makaveli can override
    
    const baseProbabilities = this.getBaseProbabilities(scenario);
    const adjusted = this.applySwarmAdjustments(baseProbabilities, feeds);
    
    return {
      primary: {
        label: adjusted.primary.label,
        probability: adjusted.primary.prob,
        description: adjusted.primary.desc,
        keyDrivers: adjusted.primary.drivers,
        entropy: this.calculateBranchEntropy(adjusted.primary.prob),
        makaveliAssessment: '[To be written by Makaveli]'
      },
      secondary: {
        label: adjusted.secondary.label,
        probability: adjusted.secondary.prob,
        description: adjusted.secondary.desc,
        keyDrivers: adjusted.secondary.drivers,
        entropy: this.calculateBranchEntropy(adjusted.secondary.prob),
        makaveliAssessment: '[To be written by Makaveli]'
      },
      tertiary: {
        label: adjusted.tertiary.label,
        probability: adjusted.tertiary.prob,
        description: adjusted.tertiary.desc,
        keyDrivers: adjusted.tertiary.drivers,
        entropy: this.calculateBranchEntropy(adjusted.tertiary.prob),
        makaveliAssessment: '[To be written by Makaveli]'
      },
      bayesianHistory: this.getBayesianHistory(scenario)
    };
  }
  
  private getBaseProbabilities(scenario: string) {
    // Iran conflict defaults based on Makaveli's analysis
    if (scenario.toLowerCase().includes('iran')) {
      return {
        primary: {
          label: 'Protracted Attrition',
          prob: 45,
          desc: 'War continues for months with no clear victory',
          drivers: ['Iranian resilience', 'U.S. resource constraints', 'Regional escalation']
        },
        secondary: {
          label: 'Negotiated Settlement',
          prob: 25,
          desc: 'Exhaustion leads to diplomatic resolution',
          drivers: ['Economic pressure', 'Humanitarian catastrophe', 'Third-party mediation']
        },
        tertiary: {
          label: 'Regime Collapse or Wider War',
          prob: 15,
          desc: 'Internal uprising OR Pakistan/Turkey entry',
          drivers: ['Leadership fragility', 'Treaty obligations', 'Miscalculation']
        }
      };
    }
    
    // Generic framework
    return {
      primary: { label: 'Status Quo Continues', prob: 50, desc: 'Current trajectory persists', drivers: ['Institutional inertia'] },
      secondary: { label: 'Gradual Escalation', prob: 30, desc: 'Stepwise increase in tensions', drivers: ['Retaliatory dynamics'] },
      tertiary: { label: 'Sudden Break', prob: 10, desc: 'Black swan event', drivers: ['Miscalculation', 'Systemic shock'] }
    };
  }
  
  private applySwarmAdjustments(base: any, feeds: SwarmFeed[]) {
    // Adjust based on swarm data
    let primaryAdj = base.primary.prob;
    let secondaryAdj = base.secondary.prob;
    
    // Example adjustments based on swarm feeds
    feeds.forEach(feed => {
      if (feed.agentType === 'military' && feed.anomalies.some(a => a.severity === 'critical')) {
        primaryAdj -= 5; // Iranian command resilience lowers attrition probability
        secondaryAdj += 5; // Increases negotiated settlement chance
      }
      
      if (feed.agentType === 'resource' && feed.anomalies.some(a => a.description.includes('Kharg Island'))) {
        // Deception operation detected - uncertainty increases
      }
    });
    
    // Normalize to sum to 85% (leaving 15% for other scenarios)
    const total = primaryAdj + secondaryAdj + base.tertiary.prob;
    const factor = 85 / total;
    
    return {
      primary: { ...base.primary, prob: Math.round(primaryAdj * factor) },
      secondary: { ...base.secondary, prob: Math.round(secondaryAdj * factor) },
      tertiary: base.tertiary
    };
  }
  
  private calculateBranchEntropy(probability: number): number {
    const p = probability / 100;
    const q = 1 - p;
    if (p === 0 || p === 1) return 0;
    return -(p * Math.log2(p) + q * Math.log2(q));
  }
  
  private getBayesianHistory(scenario: string): BayesianUpdate[] {
    // Would come from persistent storage in production
    return [
      {
        timestamp: '2026-03-08T00:00:00Z',
        event: 'Initial U.S. strikes on Iranian leadership',
        priorPrimary: 30,
        posteriorPrimary: 55,
        likelihoodRatio: 1.83,
        notes: 'Rapid escalation shifted probabilities toward prolonged conflict'
      },
      {
        timestamp: '2026-03-12T00:00:00Z',
        event: 'Mojtaba Khamenei succession; Hormuz closure',
        priorPrimary: 55,
        posteriorPrimary: 45,
        likelihoodRatio: 0.82,
        notes: 'Regime cohesion higher than expected; attrition now baseline'
      },
      {
        timestamp: '2026-03-15T00:00:00Z',
        event: 'Regional expansion to GCC states; U.S. resource strain evident',
        priorPrimary: 45,
        posteriorPrimary: 48,
        likelihoodRatio: 1.07,
        notes: 'Slight increase in attrition probability as war widens'
      }
    ];
  }
}

// ============================================================================
// INTELLIGENCE REPORT GENERATOR
// ============================================================================

class MakaveliIntelligenceFeed {
  private resourceAnalyst = new ResourceAnalyst();
  private allianceTracker = new AllianceTracker();
  private militaryObserver = new MilitaryObserver();
  private economicSensor = new EconomicSensor();
  private probabilityEngine = new ProbabilityEngine();
  
  generateReport(scenario: string): IntelligenceReport {
    console.log(`\n🔮 MAKAVELI INTELLIGENCE FEED: ${scenario}`);
    console.log('=' .repeat(70));
    
    // Gather swarm intelligence
    const feeds = [
      this.resourceAnalyst.analyze(scenario),
      this.allianceTracker.analyze(scenario),
      this.militaryObserver.analyze(scenario),
      this.economicSensor.analyze(scenario)
    ];
    
    // Calculate three-degree probabilities
    const threeDegreeProb = this.probabilityEngine.calculateThreeDegree(scenario, feeds);
    
    // Calculate confidence metrics
    const confidenceMetrics = this.calculateConfidence(feeds, threeDegreeProb);
    
    // Generate watch indicators
    const indicators = this.generateIndicators(scenario, feeds);
    
    const report: IntelligenceReport = {
      scenario,
      timestamp: new Date().toISOString(),
      sources: [], // Would be populated in production
      swarmFeeds: feeds,
      threeDegreeProb,
      confidenceMetrics,
      indicators,
      makaveliSynthesis: undefined // Makaveli writes this
    };
    
    this.displayReport(report);
    return report;
  }
  
  private calculateConfidence(feeds: SwarmFeed[], probs: ThreeDegreeProbability): ConfidenceMetrics {
    const dataPoints = feeds.reduce((sum, f) => sum + f.dataPoints.length, 0);
    const anomalies = feeds.reduce((sum, f) => sum + f.anomalies.length, 0);
    
    // Calculate overall entropy from the three-degree probabilities
    const totalEntropy = probs.primary.entropy + probs.secondary.entropy + probs.tertiary.entropy;
    const normalizedEntropy = totalEntropy / 3; // Average entropy per branch
    
    return {
      overall: Math.round((dataPoints / (anomalies + 1)) * 2), // Rough heuristic
      dataCompleteness: Math.min(10, Math.round(dataPoints / 2)),
      sourceReliability: 6, // Would be calculated from actual source ratings
      modelEntropy: Math.round(normalizedEntropy * 100) / 100,
      keyUncertainties: [
        'Mojtaba Khamenei health and operational status',
        'True extent of Iranian command and control degradation',
        'Pakistan SMDA treaty trigger thresholds',
        'U.S. THAAD/Patriot inventory depletion rates'
      ]
    };
  }
  
  private generateIndicators(scenario: string, feeds: SwarmFeed[]): WatchIndicator[] {
    return [
      {
        name: 'Mojtaba Khamenei Public Appearance',
        currentStatus: 'No visual confirmation since March 9',
        threshold: 'First public appearance or verified recording',
        trend: 'deteriorating',
        makaveliPriority: 'critical'
      },
      {
        name: 'Hormuz Mine Clearance Progress',
        currentStatus: 'Mining ongoing; U.S. escort mission announced',
        threshold: 'Sustained tanker traffic resumption',
        trend: 'stable',
        makaveliPriority: 'critical'
      },
      {
        name: 'Israeli Interceptor Inventory',
        currentStatus: '<200 Arrow missiles (critical)',
        threshold: 'Emergency procurement arrives or depletion',
        trend: 'deteriorating',
        makaveliPriority: 'high'
      },
      {
        name: 'Pakistan Military Mobilization',
        currentStatus: 'No activation of SMDA treaty',
        threshold: 'Troops to Saudi border or Iranian border',
        trend: 'stable',
        timeToThreshold: 'Unknown - event dependent',
        makaveliPriority: 'high'
      },
      {
        name: 'Saudi Retaliatory Posture',
        currentStatus: 'Defensive preparations only',
        threshold: 'Strikes on Iranian territory',
        trend: 'uncertain',
        makaveliPriority: 'high'
      }
    ];
  }
  
  private displayReport(report: IntelligenceReport) {
    // Display Three-Degree Probabilities
    console.log('\n📊 THREE-DEGREE PROBABILITY FRAMEWORK');
    console.log('-'.repeat(70));
    
    const { primary, secondary, tertiary } = report.threeDegreeProb;
    
    console.log(`\n🎯 PRIMARY (${primary.probability}%): ${primary.label}`);
    console.log(`   ${primary.description}`);
    console.log(`   Entropy: ${primary.entropy.toFixed(2)} bits | Confidence: ${primary.entropy < 0.5 ? 'High' : primary.entropy < 0.8 ? 'Medium' : 'Low'}`);
    console.log(`   Key Drivers:`);
    primary.keyDrivers.forEach(d => console.log(`      • ${d}`));
    
    console.log(`\n🔄 SECONDARY (${secondary.probability}%): ${secondary.label}`);
    console.log(`   ${secondary.description}`);
    console.log(`   Entropy: ${secondary.entropy.toFixed(2)} bits`);
    console.log(`   Key Drivers:`);
    secondary.keyDrivers.forEach(d => console.log(`      • ${d}`));
    
    console.log(`\n⚠️  TERTIARY (${tertiary.probability}%): ${tertiary.label}`);
    console.log(`   ${tertiary.description}`);
    console.log(`   Entropy: ${tertiary.entropy.toFixed(2)} bits`);
    
    // Display Confidence Metrics
    console.log('\n📈 CONFIDENCE METRICS');
    console.log('-'.repeat(70));
    console.log(`   Overall Confidence:      ${report.confidenceMetrics.overall}/10`);
    console.log(`   Data Completeness:       ${report.confidenceMetrics.dataCompleteness}/10`);
    console.log(`   Source Reliability:      ${report.confidenceMetrics.sourceReliability}/10`);
    console.log(`   Model Entropy:           ${report.confidenceMetrics.modelEntropy} bits`);
    console.log(`   Interpretation:          ${report.confidenceMetrics.modelEntropy > 1.0 ? 'High uncertainty - fog of war' : 'Moderate clarity - patterns emerging'}`);
    console.log('\n   Key Uncertainties:');
    report.confidenceMetrics.keyUncertainties.forEach(u => console.log(`      • ${u}`));
    
    // Display Swarm Feeds
    console.log('\n🕸️  SWARM INTELLIGENCE FEEDS');
    console.log('-'.repeat(70));
    report.swarmFeeds.forEach(feed => {
      const attention = '★'.repeat(Math.round(feed.attentionWeight));
      console.log(`\n   ${feed.agentType.toUpperCase()} ANALYST ${attention} (weight: ${feed.attentionWeight}x)`);
      console.log(`   Data Points (${feed.dataPoints.length}):`);
      feed.dataPoints.slice(0, 3).forEach(dp => {
        console.log(`      • ${dp.metric}: ${dp.value}`);
      });
      if (feed.anomalies.length > 0) {
        console.log(`   ⚠️  Anomalies (${feed.anomalies.length}):`);
        feed.anomalies.forEach(a => {
          console.log(`      [${a.severity.toUpperCase()}] ${a.description.substring(0, 80)}...`);
          if (a.makaveliNote) {
            console.log(`      📝 Makaveli Note: "${a.makaveliNote}"`);
          }
        });
      }
    });
    
    // Display Bayesian History
    console.log('\n📉 BAYESIAN PROBABILITY TRACKING');
    console.log('-'.repeat(70));
    console.log('   Date          | Event                           | Primary Prob | Shift');
    console.log('   '.padEnd(70, '-'));
    report.threeDegreeProb.bayesianHistory.forEach(h => {
      const shift = h.posteriorPrimary - h.priorPrimary;
      const arrow = shift > 0 ? '↑' : shift < 0 ? '↓' : '→';
      console.log(`   ${h.timestamp.substring(5, 10)}     | ${h.event.substring(0, 31).padEnd(31)} | ${h.priorPrimary}% → ${h.posteriorPrimary}% | ${arrow}${Math.abs(shift)}%`);
    });
    
    // Display Watch Indicators
    console.log('\n👁️  WATCH INDICATORS');
    console.log('-'.repeat(70));
    console.log('   Priority  | Indicator                    | Status                  | Trend');
    console.log('   '.padEnd(70, '-'));
    report.indicators.forEach(ind => {
      const icon = ind.makaveliPriority === 'critical' ? '🔴' : ind.makaveliPriority === 'high' ? '🟠' : '🟡';
      const trendIcon = ind.trend === 'deteriorating' ? '↓' : ind.trend === 'improving' ? '↑' : '→';
      console.log(`   ${icon} ${ind.makaveliPriority.padEnd(8)} | ${ind.name.substring(0, 28).padEnd(28)} | ${ind.currentStatus.substring(0, 23).padEnd(23)} | ${trendIcon}`);
    });
    
    // Display Makaveli Output Section
    console.log('\n🎭 MAKAVELI SYNTHESIS SECTION');
    console.log('=' .repeat(70));
    console.log('   [Makaveli writes his analysis here using the above intelligence]');
    console.log('   ');
    console.log('   Suggested opening based on data:');
    const highEntropy = report.confidenceMetrics.modelEntropy > 1.0;
    if (highEntropy) {
      console.log('   "The prince who surveys this battlefield sees not clarity but fog.');
      console.log(`   The entropy of ${report.confidenceMetrics.modelEntropy} bits suggests the adversary himself is undecided..."`);
    } else {
      console.log('   "The prince who reads the signs sees patterns emerging from chaos.');
      console.log(`   The entropy of ${report.confidenceMetrics.modelEntropy} bits suggests the die is cast..."`);
    }
    
    // Save report
    const filename = `makaveli_intel_${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(report, null, 2));
    console.log(`\n💾 Report saved to ${filename}`);
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

const feed = new MakaveliIntelligenceFeed();

// Generate report for Iran scenario
feed.generateReport('Iran Conflict - March 2026');

console.log('\n\n✅ Makaveli Intelligence Feed System Ready');
console.log('Makaveli retains full control of synthesis and strategic judgment.');
console.log('Swarm provides data, probabilities, and confidence metrics only.');
