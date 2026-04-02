// packages/kb-engine/src/causation-engine.ts
// Core engine: Why did this happen? What's the edge?

import { KBVectorStore } from './vector-store';
import { PatternExtractor } from './pattern-extractor';
import { 
  CausationQuery, 
  CausationAnalysis, 
  KBEntry,
  Domain,
  Alert 
} from './types';

export class CausationEngine {
  constructor(
    private vectorStore: KBVectorStore,
    private patternExtractor: PatternExtractor
  ) {}
  
  // Main entry point: Analyze why something happened
  async analyze(query: CausationQuery): Promise<CausationAnalysis> {
    // 1. Find similar historical events
    const similarEvents = await this.findSimilarEvents(query);
    
    // 2. Identify the primary catalyst
    const catalysts = await this.identifyCatalysts(query.externalEvents, similarEvents);
    
    // 3. Find relevant patterns
    const patterns = await this.findRelevantPatterns(query);
    
    // 4. Calculate edge from history
    const edgeEstimate = this.calculateEdge(query, similarEvents, patterns);
    
    // 5. Generate recommendation
    const recommendation = this.generateRecommendation(edgeEstimate, catalysts);
    
    return {
      primaryCatalyst: catalysts[0] || {
        event: 'No clear catalyst identified',
        confidence: 0,
        evidence: []
      },
      contributingFactors: catalysts.slice(1).map(c => ({
        factor: c.event,
        weight: c.confidence * 0.5
      })),
      historicalMatches: this.formatHistoricalMatches(similarEvents),
      edgeEstimate,
      recommendation
    };
  }
  
  // Find events similar to current situation
  private async findSimilarEvents(query: CausationQuery): Promise<KBEntry[]> {
    const searchQuery = this.buildSearchQuery(query);
    
    // Query for events and outcomes in same domain
    const events = await this.vectorStore.query({
      query: searchQuery,
      filters: { domain: query.domain },
      topK: 20
    });
    
    // Also query for patterns
    const patterns = await this.vectorStore.query({
      query: searchQuery,
      filters: { type: 'pattern', domain: query.domain },
      topK: 5
    });
    
    return [...patterns, ...events];
  }
  
  // Build search query from current situation
  private buildSearchQuery(query: CausationQuery): string {
    const direction = query.priceMove.magnitude > 0 ? 'increase' : 'decrease';
    const magnitude = Math.abs(query.priceMove.magnitude);
    
    let search = `${query.asset} ${direction} ${(magnitude * 100).toFixed(1)}% ${query.priceMove.timeframe}`;
    
    // Add external events
    for (const event of query.externalEvents) {
      search += ` ${event.type} ${event.description}`;
    }
    
    return search;
  }
  
  // Identify which external event is the primary catalyst
  private async identifyCatalysts(
    externalEvents: CausationQuery['externalEvents'],
    similarEvents: KBEntry[]
  ): Promise<Array<{ event: string; confidence: number; evidence: string[] }>> {
    if (externalEvents.length === 0) {
      return [{
        event: 'No external events provided',
        confidence: 0.3,
        evidence: ['Price move may be technical or sentiment-driven']
      }];
    }
    
    // Score each external event by correlation with similar historical events
    const scored = externalEvents.map(event => {
      // Count how many similar events mention this type
      const matchingEvents = similarEvents.filter(e => {
        const content = e.content.toLowerCase();
        const eventType = event.type.toLowerCase();
        const eventDesc = event.description.toLowerCase();
        return content.includes(eventType) || content.includes(eventDesc);
      });
      
      const confidence = Math.min(matchingEvents.length / 5, 0.95);
      
      return {
        event: `${event.type}: ${event.description}`,
        confidence,
        evidence: matchingEvents.slice(0, 3).map(e => {
          const date = new Date(e.metadata.timestamp).toLocaleDateString();
          return `[${date}] ${e.content.substring(0, 100)}...`;
        })
      };
    });
    
    return scored.sort((a, b) => b.confidence - a.confidence);
  }
  
  // Find patterns relevant to current situation
  private async findRelevantPatterns(query: CausationQuery): Promise<KBEntry[]> {
    return await this.vectorStore.query({
      query: `${query.asset} ${query.domain} pattern edge`,
      filters: { type: 'pattern', domain: query.domain },
      topK: 5
    });
  }
  
  // Calculate expected edge from historical data
  private calculateEdge(
    query: CausationQuery,
    similarEvents: KBEntry[],
    patterns: KBEntry[]
  ): CausationAnalysis['edgeEstimate'] {
    // Get outcomes from similar events
    const outcomes = similarEvents.filter(e => e.metadata.outcome);
    
    if (outcomes.length === 0) {
      return {
        magnitude: 0,
        direction: 'neutral',
        confidence: 0,
        reasoning: 'No similar events in knowledge base'
      };
    }
    
    // Calculate statistics
    const correctOutcomes = outcomes.filter(e => e.metadata.outcome === 'correct');
    const winRate = correctOutcomes.length / outcomes.length;
    
    const edges = outcomes
      .map(e => e.metadata.edge)
      .filter((e): e is number => e !== undefined);
    
    const avgEdge = edges.length > 0 
      ? edges.reduce((a, b) => a + b, 0) / edges.length 
      : 0;
    
    // Determine direction
    const direction = query.priceMove.magnitude > 0 
      ? 'up' 
      : query.priceMove.magnitude < 0 
        ? 'down' 
        : 'neutral';
    
    // Build reasoning
    const patternEvidence = patterns.length > 0 
      ? `Relevant pattern: ${patterns[0].content.substring(0, 100)}...`
      : 'No specific patterns matched';
    
    const reasoning = `Based on ${outcomes.length} similar events with ${Math.round(winRate * 100)}% win rate. ` +
      `Average historical edge: ${(avgEdge * 100).toFixed(1)}%. ${patternEvidence}`;
    
    // Adjust magnitude by confidence
    const adjustedMagnitude = avgEdge * winRate;
    
    return {
      magnitude: Math.abs(adjustedMagnitude),
      direction,
      confidence: winRate,
      reasoning
    };
  }
  
  // Generate actionable recommendation
  private generateRecommendation(
    edgeEstimate: CausationAnalysis['edgeEstimate'],
    catalysts: Array<{ event: string; confidence: number }
003e
  ): CausationAnalysis['recommendation'] {
    const hasStrongCatalyst = catalysts[0]?.confidence > 0.7;
    const hasHighEdge = edgeEstimate.magnitude > 0.1 && edgeEstimate.confidence > 0.6;
    const hasMediumEdge = edgeEstimate.magnitude > 0.05 && edgeEstimate.confidence > 0.4;
    
    if (hasStrongCatalyst && hasHighEdge) {
      return {
        action: 'predict',
        rationale: `High confidence (${Math.round(edgeEstimate.confidence * 100)}%) edge of ${(edgeEstimate.magnitude * 100).toFixed(1)}% detected with clear catalyst`,
        urgency: 'immediate'
      };
    } else if (hasMediumEdge || (hasStrongCatalyst && edgeEstimate.confidence > 0.5)) {
      return {
        action: 'monitor',
        rationale: 'Moderate edge detected, wait for additional confirmation',
        urgency: 'hours'
      };
    } else {
      return {
        action: 'dismiss',
        rationale: edgeEstimate.confidence < 0.4 
          ? 'Low confidence in edge calculation'
          : 'Edge magnitude too small to be actionable',
        urgency: 'days'
      };
    }
  }
  
  // Format historical matches for display
  private formatHistoricalMatches(events: KBEntry[]): CausationAnalysis['historicalMatches'] {
    return events
      .filter(e => e.metadata.outcome)
      .slice(0, 5)
      .map(e => ({
        event: e.content.substring(0, 80) + '...',
        date: new Date(e.metadata.timestamp).toLocaleDateString(),
        outcome: e.metadata.outcome === 'correct' ? 'Success' : 'Failure',
        yourPrediction: e.metadata.outcome,
        edge: e.metadata.edge
      }));
  }
  
  // Generate an alert from analysis
  async generateAlert(query: CausationQuery, analysis: CausationAnalysis): Promise<Alert | null> {
    if (analysis.recommendation.action !== 'predict') {
      return null;
    }
    
    return {
      id: `kb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'kb_causation',
      severity: analysis.edgeEstimate.confidence > 0.8 ? 'critical' : 'high',
      title: `${query.asset}: ${analysis.primaryCatalyst.event.substring(0, 50)}...`,
      description: analysis.edgeEstimate.reasoning,
      edge: analysis.edgeEstimate.magnitude,
      timestamp: Date.now(),
      metadata: {
        catalyst: analysis.primaryCatalyst,
        historicalMatches: analysis.historicalMatches,
        recommendation: analysis.recommendation,
        asset: query.asset,
        domain: query.domain
      }
    };
  }
}
