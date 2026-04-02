# MiroFish × War Room Integration Spec

## Overview

This document specifies the integration of MiroFish (multi-agent swarm intelligence engine) with the War Room intelligence dashboard. The goal is to evolve from reactive monitoring to predictive simulation.

**Version**: 1.0  
**Status**: Implementation Ready  
**Dependencies**: MiroFish (CAMEL-AI OASIS), War Room existing infrastructure

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         WAR ROOM 2.0: PREDICTIVE TWIN                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  LAYER 1: DATA INGESTION (Existing)                                         │
│  ├── ADS-B Stream (aircraft positions, formations)                          │
│  ├── Seismic Feed (USGS events, suspicious patterns)                        │
│  ├── Satellite Imagery (ship movements, infrastructure)                     │
│  ├── News/Social (sentiment, escalation rhetoric)                           │
│  └── Polymarket (prediction market odds)                                    │
│                              ↓                                              │
│  LAYER 2: ANOMALY DETECTION (Bruce Enhancement)                             │
│  ├── FormationDetector: Unusual flight patterns                             │
│  ├── SeismicAnalyzer: Artificial vs natural indicators                      │
│  ├── SentimentShift: Rapid opinion changes                                  │
│  └── CorrelationEngine: Cross-signal anomalies                              │
│                              ↓                                              │
│  LAYER 3: SEED CONSTRUCTION (New)                                           │
│  ├── EntityExtractor: Pull actors, locations, relationships                 │
│  ├── ContextBuilder: Enrich with background knowledge                       │
│  └── ScenarioGenerator: Create "what-if" variants                           │
│                              ↓                                              │
│  LAYER 4: DIGITAL TWIN SIMULATION (MiroFish Core)                           │
│  ├── AgentFactory: Spawn 1000s of region-specific agents                    │
│  │   ├── Military agents (strategic decision makers)                        │
│  │   ├── Economic agents (market reactors)                                  │
│  │   ├── Diplomatic agents (negotiation behavior)                           │
│  │   └── Social agents (citizen sentiment)                                  │
│  ├── ParallelTimeline: Run 30-day simulations                               │
│  ├── VariableInjection: "What if X happens?"                                │
│  └── EmergenceObserver: Track unexpected behaviors                          │
│                              ↓                                              │
│  LAYER 5: VALIDATION (Makaveli Enhancement)                                 │
│  ├── AssumptionChallenger: Question sim parameters                          │
│  ├── BlindSpotFinder: Identify missing agents/contexts                      │
│  └── StressTester: Worst-case scenario analysis                             │
│                              ↓                                              │
│  LAYER 6: SYNTHESIS & ACTION (Integrated Output)                            │
│  ├── PredictionReport: Probabilities, timelines, confidence                 │
│  ├── MarketImpact: Asset-specific forecasts                                 │
│  ├── ProtocolAdjust: Personal stress/health recommendations                 │
│  └── PolymarketStrategy: Optimal position sizing                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
lib/
├── mirofish/
│   ├── client.ts              # HTTP client for MiroFish API
│   ├── types.ts               # TypeScript interfaces
│   ├── seed-builder.ts        # Construct simulation seed from War Room data
│   ├── agent-factory.ts       # Generate agent configurations
│   ├── scenario-engine.ts     # Create "what-if" scenarios
│   └── result-parser.ts       # Parse sim output to War Room format
├── warroom/
│   ├── detectors/
│   │   ├── formation.ts       # Detect aircraft formations
│   │   ├── seismic.ts         # Flag suspicious seismic events
│   │   └── sentiment.ts       # Monitor sentiment shifts
│   └── enrichers/
│       ├── entity-extractor.ts
│       └── context-builder.ts
├── synthesis/
│   ├── predictor.ts           # Combine sim + validation → prediction
│   └── confidence.ts          # Calculate confidence scores
├── integration/
│   ├── anomaly-to-sim.ts      # Trigger sim from War Room anomaly
│   └── sim-to-action.ts       # Convert sim output to actionable items
└── api/
    └── mirofish/
        ├── simulate/route.ts       # Main simulation endpoint
        ├── scenarios/route.ts      # List available scenarios
        ├── agents/route.ts         # Agent configuration
        └── results/[id]/route.ts   # Retrieve simulation results

app/
├── (dashboard)/
│   └── warroom/
│       ├── page.tsx           # Existing War Room
│       └── predictions/       # NEW: Prediction panel
│           ├── page.tsx
│           ├── SimulationCard.tsx
│           ├── AgentNetwork.tsx
│           └── PredictionTimeline.tsx

components/
├── predictions/
│   ├── SimulationTrigger.tsx  # Button to run sim from anomaly
│   ├── AgentVisualization.tsx # D3.js network graph of agents
│   ├── ProbabilityHeatmap.tsx # Risk visualization
│   ├── TimelineScrubber.tsx   # Scroll through simulation days
│   └── ConfidenceBadge.tsx    # Trust indicator
```

---

## Type Definitions

```typescript
// lib/mirofish/types.ts

// Input: What triggers a simulation
interface SimulationTrigger {
  id: string;
  source: 'aircraft' | 'seismic' | 'sentiment' | 'market' | 'manual';
  region: string;
  timestamp: number;
  anomalyData: any;  // Raw War Room data
  userQuery?: string;  // Natural language prediction request
}

// Seed: What feeds into MiroFish
interface SimulationSeed {
  entities: Entity[];
  relationships: Relationship[];
  events: Event[];
  context: Context;
  query: string;
}

interface Entity {
  id: string;
  type: 'nation' | 'military' | 'economic' | 'media' | 'population';
  name: string;
  attributes: Record<string, any>;
  initialSentiment: number;  // -1 to 1
}

interface Relationship {
  source: string;
  target: string;
  type: 'alliance' | 'conflict' | 'trade' | 'influence';
  strength: number;  // 0 to 1
}

interface Event {
  timestamp: number;
  type: string;
  description: string;
  impact: number;
}

interface Context {
  region: string;
  timeframe: string;
  historicalBackground: string;
  currentTensions: number;  // 0 to 10
}

// Agent Configuration
interface AgentConfig {
  role: 'military' | 'economic' | 'diplomatic' | 'social';
  count: number;
  personalityDistribution: PersonalityProfile[];
  memoryConfig: MemoryConfig;
}

interface PersonalityProfile {
  type: string;
  percentage: number;
  traits: {
    aggression: number;
    rationality: number;
    riskTolerance: number;
    influence: number;
  };
}

interface MemoryConfig {
  individualDepth: number;  // Days of personal memory
  collectiveDepth: number;  // Days of shared history
  graphRagEnabled: boolean;
}

// Simulation Output
interface SimulationResult {
  id: string;
  triggerId: string;
  status: 'running' | 'completed' | 'failed';
  timeline: DayResult[];
  finalState: WorldState;
  predictions: Prediction[];
  confidence: number;
  dataPoints: number;
  processingTime: number;
}

interface DayResult {
  day: number;
  events: SimulatedEvent[];
  sentiment: Record<string, number>;
  keyDecisions: Decision[];
}

interface WorldState {
  entities: EntityState[];
  globalTension: number;
  marketImpact: Record<string, number>;
  socialMetrics: SocialMetrics;
}

interface Prediction {
  type: 'conflict' | 'economic' | 'political' | 'social';
  probability: number;
  timeframe: string;
  description: string;
  indicators: string[];
}

// War Room Integration
interface PredictionAction {
  type: 'alert' | 'position' | 'protocol' | 'research';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  automated?: boolean;
  payload?: any;
}
```

---

## Core Implementation

### 1. MiroFish Client

```typescript
// lib/mirofish/client.ts

import { SimulationTrigger, SimulationSeed, SimulationResult, AgentConfig } from './types';

export class MiroFishClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = 'http://localhost:8000', apiKey?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey || process.env.MIROFISH_API_KEY!;
  }

  // Main simulation entry point
  async simulate(seed: SimulationSeed, config?: SimulationConfig): Promise<SimulationResult> {
    const response = await fetch(`${this.baseUrl}/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ seed, config })
    });

    if (!response.ok) {
      throw new Error(`MiroFish simulation failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Check simulation status
  async getStatus(simulationId: string): Promise<SimulationResult> {
    const response = await fetch(`${this.baseUrl}/simulations/${simulationId}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return response.json();
  }

  // Get available agent templates for a region
  async getAgentTemplates(region: string): Promise<AgentConfig[]> {
    const response = await fetch(`${this.baseUrl}/templates/agents?region=${region}`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    return response.json();
  }
}

interface SimulationConfig {
  duration: number;  // Days
  agentCount: number;
  parallelRuns: number;
  scenarios: string[];
}

export const mirofish = new MiroFishClient();
```

### 2. Seed Builder

```typescript
// lib/mirofish/seed-builder.ts

import { ADSBData, SeismicEvent, NewsItem, PolymarketData } from '@/lib/warroom/types';
import { SimulationSeed, Entity, Relationship, Event } from './types';

export class SeedBuilder {
  
  // Build seed from War Room aircraft anomaly
  static fromAircraftData(
    aircraft: ADSBData[],
    region: string,
    query: string
  ): SimulationSeed {
    const entities: Entity[] = [
      {
        id: 'us-military',
        type: 'military',
        name: 'US Military Forces',
        attributes: { strength: 0.9, techLevel: 0.95 },
        initialSentiment: 0.2
      },
      {
        id: 'china-military',
        type: 'military',
        name: 'PLA Forces',
        attributes: { strength: 0.85, techLevel: 0.88 },
        initialSentiment: -0.1
      },
      {
        id: 'regional-actors',
        type: 'nation',
        name: 'Regional Nations',
        attributes: { influence: 0.6 },
        initialSentiment: 0
      }
    ];

    const relationships: Relationship[] = [
      { source: 'us-military', target: 'china-military', type: 'conflict', strength: 0.7 },
      { source: 'regional-actors', target: 'us-military', type: 'alliance', strength: 0.6 },
      { source: 'regional-actors', target: 'china-military', type: 'trade', strength: 0.8 }
    ];

    const events: Event[] = aircraft.map(a => ({
      timestamp: a.timestamp,
      type: 'aircraft_movement',
      description: `${a.callsign} detected at ${a.latitude}, ${a.longitude}`,
      impact: a.military ? 0.7 : 0.3
    }));

    return {
      entities,
      relationships,
      events,
      context: {
        region,
        timeframe: '30d',
        historicalBackground: this.getRegionalContext(region),
        currentTensions: this.calculateTension(aircraft)
      },
      query
    };
  }

  // Build seed from seismic anomaly
  static fromSeismicData(
    event: SeismicEvent,
    region: string,
    query: string
  ): SimulationSeed {
    const entities: Entity[] = [
      {
        id: 'detected-nation',
        type: 'nation',
        name: event.detectedIn,
        attributes: { nuclearCapability: true, testingHistory: true },
        initialSentiment: -0.3
      },
      {
        id: 'international-community',
        type: 'nation',
        name: 'UN Security Council',
        attributes: { influence: 0.9 },
        initialSentiment: -0.5
      }
    ];

    return {
      entities,
      relationships: [
        { source: 'international-community', target: 'detected-nation', type: 'conflict', strength: 0.6 }
      ],
      events: [{
        timestamp: event.time,
        type: 'seismic_event',
        description: `Magnitude ${event.magnitude} event at ${event.location}`,
        impact: event.artificialProbability || 0.5
      }],
      context: {
        region,
        timeframe: '14d',
        historicalBackground: 'Nuclear test suspicion based on seismic signature',
        currentTensions: event.magnitude > 5 ? 8 : 5
      },
      query
    };
  }

  // Build seed from Polymarket shift
  static fromMarketData(
    market: PolymarketData,
    news: NewsItem[],
    query: string
  ): SimulationSeed {
    // Extract entities from market title and news
    const entities = this.extractEntitiesFromText(market.title + ' ' + news.map(n => n.title).join(' '));
    
    return {
      entities,
      relationships: this.inferRelationships(entities),
      events: news.map(n => ({
        timestamp: n.publishedAt,
        type: 'news_event',
        description: n.title,
        impact: n.sentiment === 'negative' ? -0.5 : 0.5
      })),
      context: {
        region: 'global',
        timeframe: '7d',
        historicalBackground: `Market: ${market.title}`,
        currentTensions: market.probability > 0.7 ? 7 : 4
      },
      query
    };
  }

  private static getRegionalContext(region: string): string {
    const contexts: Record<string, string> = {
      'taiwan-strait': 'Long-standing tensions between China and Taiwan, US strategic ambiguity',
      'ukraine': 'Ongoing conflict with Russia, NATO support, energy implications',
      'middle-east': 'Complex alliances, oil interests, historical conflicts',
      'korean-peninsula': 'Nuclear tensions, US-South Korea alliance, China influence'
    };
    return contexts[region] || 'Regional geopolitical tensions';
  }

  private static calculateTension(aircraft: ADSBData[]): number {
    const militaryCount = aircraft.filter(a => a.military).length;
    return Math.min(10, 3 + (militaryCount * 0.5));
  }

  private static extractEntitiesFromText(text: string): Entity[] {
    // Use NER or LLM to extract entities
    // Simplified for spec
    return [];
  }

  private static inferRelationships(entities: Entity[]): Relationship[] {
    // Infer relationships based on entity types and known patterns
    return [];
  }
}
```

### 3. Agent Factory

```typescript
// lib/mirofish/agent-factory.ts

import { AgentConfig, PersonalityProfile } from './types';

export class AgentFactory {
  
  // Generate agent configurations for a region
  static forRegion(region: string): AgentConfig[] {
    const configs: Record<string, AgentConfig[]> = {
      'taiwan-strait': [
        {
          role: 'military',
          count: 100,
          personalityDistribution: [
            { type: 'hawk', percentage: 0.3, traits: { aggression: 0.8, rationality: 0.6, riskTolerance: 0.7, influence: 0.6 } },
            { type: 'dove', percentage: 0.2, traits: { aggression: 0.2, rationality: 0.8, riskTolerance: 0.3, influence: 0.5 } },
            { type: 'pragmatist', percentage: 0.5, traits: { aggression: 0.5, rationality: 0.9, riskTolerance: 0.5, influence: 0.8 } }
          ],
          memoryConfig: { individualDepth: 30, collectiveDepth: 365, graphRagEnabled: true }
        },
        {
          role: 'economic',
          count: 200,
          personalityDistribution: [
            { type: 'bull', percentage: 0.4, traits: { aggression: 0.6, rationality: 0.7, riskTolerance: 0.8, influence: 0.5 } },
            { type: 'bear', percentage: 0.4, traits: { aggression: 0.4, rationality: 0.7, riskTolerance: 0.4, influence: 0.5 } },
            { type: 'analyst', percentage: 0.2, traits: { aggression: 0.3, rationality: 0.95, riskTolerance: 0.5, influence: 0.7 } }
          ],
          memoryConfig: { individualDepth: 90, collectiveDepth: 730, graphRagEnabled: true }
        },
        {
          role: 'diplomatic',
          count: 50,
          personalityDistribution: [
            { type: 'negotiator', percentage: 0.6, traits: { aggression: 0.3, rationality: 0.9, riskTolerance: 0.4, influence: 0.8 } },
            { type: 'hardliner', percentage: 0.4, traits: { aggression: 0.7, rationality: 0.6, riskTolerance: 0.6, influence: 0.6 } }
          ],
          memoryConfig: { individualDepth: 180, collectiveDepth: 1095, graphRagEnabled: true }
        },
        {
          role: 'social',
          count: 1000,
          personalityDistribution: [
            { type: 'activist', percentage: 0.15, traits: { aggression: 0.6, rationality: 0.5, riskTolerance: 0.7, influence: 0.4 } },
            { type: 'moderate', percentage: 0.6, traits: { aggression: 0.3, rationality: 0.6, riskTolerance: 0.4, influence: 0.3 } },
            { type: 'apathetic', percentage: 0.25, traits: { aggression: 0.1, rationality: 0.4, riskTolerance: 0.2, influence: 0.1 } }
          ],
          memoryConfig: { individualDepth: 7, collectiveDepth: 90, graphRagEnabled: false }
        }
      ]
    };

    return configs[region] || configs['taiwan-strait'];
  }

  // Generate agent configurations for a scenario
  static forScenario(scenario: string): AgentConfig[] {
    const scenarios: Record<string, AgentConfig[]> = {
      'nuclear-test': [
        {
          role: 'diplomatic',
          count: 100,
          personalityDistribution: [
            { type: 'sanctions-advocate', percentage: 0.5, traits: { aggression: 0.5, rationality: 0.8, riskTolerance: 0.4, influence: 0.7 } },
            { type: 'appeaser', percentage: 0.3, traits: { aggression: 0.2, rationality: 0.6, riskTolerance: 0.3, influence: 0.5 } },
            { type: 'military-option', percentage: 0.2, traits: { aggression: 0.9, rationality: 0.5, riskTolerance: 0.8, influence: 0.4 } }
          ],
          memoryConfig: { individualDepth: 180, collectiveDepth: 1825, graphRagEnabled: true }
        }
      ]
    };

    return scenarios[scenario] || [];
  }
}
```

### 4. API Routes

```typescript
// app/api/mirofish/simulate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { mirofish } from '@/lib/mirofish/client';
import { SeedBuilder } from '@/lib/mirofish/seed-builder';
import { AgentFactory } from '@/lib/mirofish/agent-factory';
import { SimulationTrigger } from '@/lib/mirofish/types';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const trigger: SimulationTrigger = await req.json();
    
    // 1. Build seed based on trigger type
    let seed;
    switch (trigger.source) {
      case 'aircraft':
        seed = SeedBuilder.fromAircraftData(trigger.anomalyData, trigger.region, trigger.userQuery || '');
        break;
      case 'seismic':
        seed = SeedBuilder.fromSeismicData(trigger.anomalyData, trigger.region, trigger.userQuery || '');
        break;
      case 'market':
        seed = SeedBuilder.fromMarketData(trigger.anomalyData.market, trigger.anomalyData.news, trigger.userQuery || '');
        break;
      default:
        return NextResponse.json({ error: 'Unknown trigger source' }, { status: 400 });
    }

    // 2. Generate agent configs
    const agents = AgentFactory.forRegion(trigger.region);

    // 3. Run simulation
    const result = await mirofish.simulate(seed, {
      duration: 30,
      agentCount: agents.reduce((sum, a) => sum + a.count, 0),
      parallelRuns: 5,
      scenarios: ['status_quo', 'escalation', 'external_intervention']
    });

    // 4. Store result reference (for async polling)
    // await storeSimulationResult(result);

    return NextResponse.json({
      success: true,
      simulationId: result.id,
      status: result.status,
      estimatedCompletion: 120000 // 2 minutes
    });

  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json(
      { error: 'Simulation failed', message: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}

// GET: Check simulation status
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'Simulation ID required' }, { status: 400 });
  }

  try {
    const result = await mirofish.getStatus(id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch status' }, { status: 500 });
  }
}
```

### 5. War Room Integration

```typescript
// lib/integration/anomaly-to-sim.ts

import { FormationDetector, SeismicAnalyzer } from '@/lib/warroom/detectors';
import { mirofish } from '@/lib/mirofish/client';
import { SimulationTrigger } from '@/lib/mirofish/types';

export class AnomalySimulator {
  
  // Auto-trigger simulation on high-confidence anomaly
  static async onAircraftFormation(aircraft: ADSBData[]) {
    const confidence = FormationDetector.analyze(aircraft);
    
    if (confidence > 0.8) {
      const trigger: SimulationTrigger = {
        id: crypto.randomUUID(),
        source: 'aircraft',
        region: FormationDetector.inferRegion(aircraft),
        timestamp: Date.now(),
        anomalyData: aircraft,
        userQuery: `What is the strategic intent behind this ${aircraft.length}-aircraft formation? Predict 30-day outcomes.`
      };

      // Queue for user approval (or auto-execute if configured)
      return this.queueSimulation(trigger);
    }
  }

  static async onSeismicEvent(event: SeismicEvent) {
    const analysis = await SeismicAnalyzer.analyze(event);
    
    if (analysis.artificialProbability > 0.6) {
      const trigger: SimulationTrigger = {
        id: crypto.randomUUID(),
        source: 'seismic',
        region: event.location,
        timestamp: Date.now(),
        anomalyData: event,
        userQuery: `If this is a nuclear test, what are the diplomatic and market implications?`
      };

      return this.queueSimulation(trigger);
    }
  }

  private static async queueSimulation(trigger: SimulationTrigger) {
    // Store in pending queue for user approval
    // or auto-execute based on settings
    const response = await fetch('/api/mirofish/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trigger)
    });

    return response.json();
  }
}
```

### 6. Synthesis & Action

```typescript
// lib/synthesis/predictor.ts

import { SimulationResult, Prediction, PredictionAction } from '@/lib/mirofish/types';

export class PredictionSynthesizer {
  
  // Combine simulation results into actionable predictions
  static synthesize(result: SimulationResult, userContext?: UserContext): PredictionAction[] {
    const actions: PredictionAction[] = [];

    // 1. Alert actions for high-probability events
    result.predictions
      .filter(p => p.probability > 0.7)
      .forEach(p => {
        actions.push({
          type: 'alert',
          priority: p.probability > 0.9 ? 'critical' : 'high',
          description: `High confidence prediction: ${p.description}`,
          automated: false
        });
      });

    // 2. Market position recommendations
    const marketImpact = result.finalState.marketImpact;
    Object.entries(marketImpact).forEach(([asset, impact]) => {
      if (Math.abs(impact) > 0.1) {
        actions.push({
          type: 'position',
          priority: Math.abs(impact) > 0.2 ? 'high' : 'medium',
          description: `${asset}: ${impact > 0 ? 'Long' : 'Short'} opportunity (${(impact * 100).toFixed(1)}% projected)`,
          payload: { asset, direction: impact > 0 ? 'long' : 'short', confidence: result.confidence }
        });
      }
    });

    // 3. Protocol adjustments based on predicted stress
    const globalTension = result.finalState.globalTension;
    if (globalTension > 7 && userContext?.biomarkers) {
      actions.push({
        type: 'protocol',
        priority: 'medium',
        description: `High geopolitical tension predicted. Recommend stress protocol: more glycine, reduce fasting.`,
        automated: false
      });
    }

    // 4. Research tasks for uncertain predictions
    result.predictions
      .filter(p => p.probability > 0.4 && p.probability < 0.7)
      .forEach(p => {
        actions.push({
          type: 'research',
          priority: 'low',
          description: `Uncertain prediction requires monitoring: ${p.type}`,
          payload: { indicators: p.indicators }
        });
      });

    return actions;
  }
}

interface UserContext {
  biomarkers?: {
    hrv: number;
    sleep: number;
    readiness: number;
  };
  positions?: string[];
}
```

---

## UI Components

### SimulationTrigger

```tsx
// components/predictions/SimulationTrigger.tsx

'use client';

import { useState } from 'react';
import { SimulationTrigger as TriggerType } from '@/lib/mirofish/types';

interface Props {
  anomaly: any;
  source: 'aircraft' | 'seismic' | 'market';
  region: string;
}

export function SimulationTrigger({ anomaly, source, region }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [simulationId, setSimulationId] = useState<string | null>(null);

  const handleSimulate = async () => {
    setIsLoading(true);
    
    const trigger: TriggerType = {
      id: crypto.randomUUID(),
      source,
      region,
      timestamp: Date.now(),
      anomalyData: anomaly,
      userQuery: getDefaultQuery(source)
    };

    const response = await fetch('/api/mirofish/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trigger)
    });

    const data = await response.json();
    setSimulationId(data.simulationId);
    setIsLoading(false);
  };

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-amber-400">Anomaly Detected</h4>
          <p className="text-sm text-amber-300/70">
            {source === 'aircraft' && 'Unusual aircraft formation'}
            {source === 'seismic' && 'Suspicious seismic signature'}
            {source === 'market' && 'Significant market shift'}
          </p>
        </div>
        <button
          onClick={handleSimulate}
          disabled={isLoading}
          className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50"
        >
          {isLoading ? 'Starting...' : 'Run Simulation'}
        </button>
      </div>
      {simulationId && (
        <p className="mt-2 text-xs text-amber-300/50">
          Simulation started: {simulationId.slice(0, 8)}...
        </p>
      )}
    </div>
  );
}

function getDefaultQuery(source: string): string {
  const queries: Record<string, string> = {
    aircraft: 'What is the strategic intent? Predict 30-day outcomes.',
    seismic: 'If nuclear test, what are diplomatic and market implications?',
    market: 'What drives this shift? Predict 7-day trajectory.'
  };
  return queries[source];
}
```

### PredictionPanel

```tsx
// app/(dashboard)/warroom/predictions/page.tsx

import { SimulationCard } from './SimulationCard';
import { AgentNetwork } from './AgentNetwork';
import { PredictionTimeline } from './PredictionTimeline';

export default function PredictionsPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Predictive Simulations</h1>
        <div className="text-sm text-slate-400">
          Powered by MiroFish swarm intelligence
        </div>
      </div>

      {/* Active Simulations */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-200">Active Simulations</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SimulationCard id="sim-001" region="taiwan-strait" status="running" progress={65} />
          <SimulationCard id="sim-002" region="ukraine" status="completed" confidence={0.82} />
        </div>
      </section>

      {/* Agent Network Visualization */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="mb-4 text-lg font-semibold text-slate-200">Agent Network</h2>
        <AgentNetwork simulationId="sim-001" />
      </section>

      {/* Prediction Timeline */}
      <section className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="mb-4 text-lg font-semibold text-slate-200">Timeline Projection</h2>
        <PredictionTimeline simulationId="sim-001" />
      </section>
    </div>
  );
}
```

---

## Environment Configuration

```bash
# .env.local

# MiroFish Configuration
MIROFISH_API_URL=http://localhost:8000
MIROFISH_API_KEY=your-api-key
MIROFISH_TIMEOUT=300000  # 5 minutes

# Simulation Defaults
DEFAULT_SIMULATION_DAYS=30
DEFAULT_AGENT_COUNT=1500
PARALLEL_RUNS=5

# Auto-trigger Settings
AUTO_TRIGGER_ENABLED=true
AUTO_TRIGGER_CONFIDENCE_THRESHOLD=0.8

# Cache & Storage
SIMULATION_CACHE_TTL=3600  # 1 hour
UPSTASH_REDIS_URL=...
UPSTASH_REDIS_TOKEN=...
```

---

## Deployment

### Local Development

```bash
# 1. Clone MiroFish
git clone https://github.com/666ghj/MiroFish.git
cd MiroFish

# 2. Install dependencies
pip install -r requirements.txt
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your LLM API keys

# 4. Start MiroFish
python app.py

# 5. In another terminal, start War Room
npm run dev
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  mirofish:
    build: ./MiroFish
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ZEP_API_KEY=${ZEP_API_KEY}
    volumes:
      - mirofish-data:/app/data

  warroom:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MIROFISH_API_URL=http://mirofish:8000
      - NEXT_PUBLIC_MIROFISH_ENABLED=true
    depends_on:
      - mirofish
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  mirofish-data:
```

---

## Success Metrics

- [ ] Simulations trigger within 5 seconds of anomaly detection
- [ ] 30-day simulation completes in <5 minutes
- [ ] Prediction confidence >0.7 for 60% of outcomes
- [ ] Market impact predictions within 10% of actual (backtest)
- [ ] User approval rate for auto-triggered sims >80%

---

## Future Enhancements

1. **BrowserOS Widget**: Offer predictions as paid service to other agents
2. **Molt.id Integration**: Self-funding simulation agent with treasury
3. **Cross-Simulation Learning**: Train Bruce on MiroFish outcomes
4. **Real-Time Updates**: Streaming simulation progress to UI

---

*Built for the predictive age. War Room evolves from reactive to prescient.*
