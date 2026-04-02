// packages/kb-engine/src/pattern-extractor.ts
// Extract patterns from historical predictions

import { KBVectorStore } from './vector-store';
import { KBEntry, Domain, ExtractedPattern } from './types';

export class PatternExtractor {
  constructor(private vectorStore: KBVectorStore) {}
  
  // Extract patterns from successful predictions
  async extractPatterns(params: {
    domain: Domain;
    minPredictions?: number;
    minWinRate?: number;
  }): Promise<ExtractedPattern[]> {
    // Get all correct predictions for this domain
    const predictions = await this.vectorStore.query({
      query: 'successful prediction patterns edge alpha',
      filters: {
        type: 'prediction',
        domain: params.domain,
        outcome: 'correct'
      },
      topK: 100
    });
    
    // Also get incorrect ones for contrast
    const incorrectPredictions = await this.vectorStore.query({
      query: 'failed prediction loss incorrect',
      filters: {
        type: 'prediction',
        domain: params.domain,
        outcome: 'incorrect'
      },
      topK: 50
    });
    
    // Group similar predictions
    const groups = await this.groupBySimilarity(predictions);
    
    // Extract patterns from each group
    const patterns: ExtractedPattern[] = [];
    
    for (const group of groups) {
      if (group.length < (params.minPredictions || 3)) continue;
      
      const pattern = await this.synthesizePattern(group, incorrectPredictions);
      if (pattern.confidence >= (params.minWinRate || 0.6)) {
        patterns.push(pattern);
      }
    }
    
    return patterns.sort((a, b) => b.supportingEvidence.correctPredictions - a.supportingEvidence.correctPredictions);
  }
  
  // Group predictions by similarity
  private async groupBySimilarity(predictions: KBEntry[]): Promise<KBEntry[][]> {
    const groups: KBEntry[][] = [];
    const used = new Set<string>();
    
    for (const pred of predictions) {
      if (used.has(pred.id)) continue;
      
      // Find similar predictions
      const similar = await this.vectorStore.query({
        query: pred.content,
        filters: {
          type: 'prediction',
          domain: pred.metadata.domain
        },
        topK: 20
      });
      
      const group = similar.filter(s => !used.has(s.id) && s.id !== pred.id);
      if (group.length >= 2) {
        groups.push([pred, ...group.slice(0, 9)]);
        group.forEach(g => used.add(g.id));
        used.add(pred.id);
      }
    }
    
    return groups;
  }
  
  // Synthesize a pattern from a group of predictions
  private async synthesizePattern(
    group: KBEntry[],
    incorrectPredictions: KBEntry[]
  ): Promise<ExtractedPattern> {
    const correctCount = group.filter(p => p.metadata.outcome === 'correct').length;
    const totalCount = group.length;
    const winRate = correctCount / totalCount;
    
    // Calculate average edge
    const avgEdge = group.reduce((sum, p) => {
      return sum + (p.metadata.edge || 0);
    }, 0) / totalCount;
    
    // Extract common conditions from content
    const conditions = this.extractConditions(group.map(p => p.content));
    
    // Contrast with incorrect predictions to find differentiators
    const differentiators = this.findDifferentiators(
      group.map(p => p.content),
      incorrectPredictions.map(p => p.content)
    );
    
    // Generate pattern description
    const pattern = this.generatePatternDescription(group, differentiators);
    
    return {
      pattern,
      confidence: winRate,
      supportingEvidence: {
        predictions: totalCount,
        correctPredictions: correctCount,
        avgEdge
      },
      conditions: [...conditions, ...differentiators],
      expectedOutcome: this.inferExpectedOutcome(group),
      timeToOutcome: this.inferTimeToOutcome(group)
    };
  }
  
  // Extract conditions from prediction descriptions
  private extractConditions(contents: string[]): string[] {
    const conditionKeywords = [
      'PDUFA', 'FDA', 'approval', 'Phase 3', 'Phase 2', 'adcom',
      'inventory', 'EIA', 'draw', 'build',
      'funding', 'whale', 'accumulation', 'ETF',
      'conflict', 'ceasefire', 'invasion',
      'benchmark', 'ELO', 'leaderboard'
    ];
    
    const conditions = new Set<string>();
    
    for (const content of contents) {
      const lower = content.toLowerCase();
      for (const keyword of conditionKeywords) {
        if (lower.includes(keyword.toLowerCase())) {
          // Extract sentence containing keyword
          const sentences = content.split(/[.!?]+/);
          for (const sentence of sentences) {
            if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
              conditions.add(sentence.trim());
            }
          }
        }
      }
    }
    
    return Array.from(conditions).slice(0, 5);
  }
  
  // Find what differentiates successful from unsuccessful predictions
  private findDifferentiators(successContents: string[], failContents: string[]): string[] {
    const successWords = this.extractCommonWords(successContents);
    const failWords = this.extractCommonWords(failContents);
    
    // Words common in success but not in failure
    const differentiators = successWords.filter(w => !failWords.includes(w));
    
    return differentiators.slice(0, 3).map(w => `Presence of: ${w}`);
  }
  
  private extractCommonWords(contents: string[]): string[] {
    const wordCounts: Record<string, number> = {};
    
    for (const content of contents) {
      const words = content.toLowerCase().match(/\b\w{4,}\b/g) || [];
      const unique = new Set(words);
      for (const word of unique) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    }
    
    return Object.entries(wordCounts)
      .filter(([_, count]) => count >= contents.length * 0.5)
      .map(([word]) => word);
  }
  
  private generatePatternDescription(group: KBEntry[], differentiators: string[]): string {
    const domain = group[0].metadata.domain;
    const assets = [...new Set(group.map(p => p.metadata.asset))];
    
    const descriptions: Record<Domain, string> = {
      biotech: `FDA approval prediction pattern for ${assets.join(', ')}: Favorable adcom vote + approaching PDUFA with limited price movement`,
      commodities: `Inventory surprise pattern for ${assets.join(', ')}: EIA report deviation from consensus leads to predictable price adjustment`,
      crypto: `Smart money accumulation pattern for ${assets.join(', ')}: Large exchange outflows + whale accumulation before price moves`,
      geopolitics: `Conflict escalation pattern: Rising intensity metrics before market prices risk premium`,
      ai: `Benchmark leaderboard pattern: Model momentum on LMSYS precedes market repricing`,
      robotics: 'Production milestone pattern: Manufacturing scale-up announcements precede valuation adjustments',
      human_optimization: 'Clinical milestone pattern: Positive trial readouts in longevity space lead to sustained price appreciation'
    };
    
    return descriptions[domain] || `Pattern detected across ${group.length} predictions in ${domain}`;
  }
  
  private inferExpectedOutcome(group: KBEntry[]): string {
    const outcomes = group.map(p => p.metadata.outcome);
    const correct = outcomes.filter(o => o === 'correct').length;
    const rate = correct / outcomes.length;
    
    return `${Math.round(rate * 100)}% win rate with average edge of ${(group.reduce((s, p) => s + (p.metadata.edge || 0), 0) / group.length * 100).toFixed(1)}%`;
  }
  
  private inferTimeToOutcome(group: KBEntry[]): string {
    // Look for time references in content
    const timePatterns = [
      { regex: /(\d+)\s*days?/i, unit: 'days' },
      { regex: /(\d+)\s*hours?/i, unit: 'hours' },
      { regex: /(\d+)\s*weeks?/i, unit: 'weeks' }
    ];
    
    const times: number[] = [];
    
    for (const pred of group) {
      for (const pattern of timePatterns) {
        const match = pred.content.match(pattern.regex);
        if (match) {
          times.push(parseInt(match[1]));
        }
      }
    }
    
    if (times.length === 0) return 'Variable';
    
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    return `~${Math.round(avg)} days`;
  }
}
