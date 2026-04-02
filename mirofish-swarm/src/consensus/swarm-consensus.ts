import { MergedPrediction, ConsensusResult, MarketContext } from '../types/swarm';

/**
 * Swarm Consensus Engine
 * 
 * Final aggregation layer that:
 * 1. Clusters predictions by confidence level
 * 2. Calculates consensus probability (weighted average)
 * 3. Applies Kelly Criterion for position sizing
 * 4. Generates trade recommendation
 */
export class SwarmConsensus {
  private kellyFraction: number = 0.25; // Quarter-Kelly for safety

  /**
   * Synthesize final consensus from merged predictions
   */
  synthesize(
    predictions: MergedPrediction[],
    marketContext: MarketContext,
    options: { fallbackMode?: boolean } = {}
  ): ConsensusResult {
    const totalAgents = predictions.length;

    // Calculate weighted consensus
    const yesVotes = predictions.filter(p => p.prediction === 'YES');
    const noVotes = predictions.filter(p => p.prediction === 'NO');

    const yesWeight = yesVotes.reduce((sum, p) => {
      const conf = p.weightedConfidence || p.confidence;
      return sum + conf;
    }, 0);

    const noWeight = noVotes.reduce((sum, p) => {
      const conf = p.weightedConfidence || p.confidence;
      return sum + conf;
    }, 0);

    const totalWeight = yesWeight + noWeight;
    const consensusProbability = yesWeight / totalWeight;

    // Confidence metrics
    const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / totalAgents;
    const confidenceStdDev = this.calculateStdDev(predictions.map(p => p.confidence));

    // Cluster analysis
    const clusters = this.clusterPredictions(predictions);

    // Kelly sizing
    const marketOdds = this.calculateMarketOdds(marketContext);
    const edge = consensusProbability - (1 / marketOdds);
    const kellySize = Math.max(0, edge / (marketOdds - 1));
    const positionSize = kellySize * this.kellyFraction;

    // Signal strength
    const signalStrength = this.calculateSignalStrength(
      consensusProbability,
      avgConfidence,
      totalAgents,
      clusters
    );

    return {
      direction: consensusProbability > 0.5 ? 'YES' : 'NO',
      consensusProbability: Math.round(consensusProbability * 100),
      confidence: Math.round(avgConfidence),
      edge: Math.round(edge * 100),
      positionSize: Math.round(positionSize * 100), // As percentage of bankroll
      signalStrength,
      totalAgents,
      yesVotes: yesVotes.length,
      noVotes: noVotes.length,
      consensusStdDev: Math.round(confidenceStdDev),
      topFactors: this.extractTopFactors(predictions),
      contrarianView: this.extractContrarianView(predictions),
      clusters,
      recommendation: this.generateRecommendation(
        consensusProbability,
        edge,
        signalStrength,
        options.fallbackMode
      ),
    };
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Extract market-implied odds from price
   */
  private calculateMarketOdds(context: MarketContext): number {
    // Convert price to odds (e.g., 65¢ YES = 1/0.65 = 1.54 odds)
    const price = context.currentPrice;
    if (price <= 0 || price >= 1) return 2.0; // Default to even odds
    return 1 / price;
  }

  /**
   * Cluster predictions by confidence level
   */
  private clusterPredictions(predictions: MergedPrediction[]) {
    const highConfidence = predictions.filter(p => p.confidence >= 80).length;
    const mediumConfidence = predictions.filter(p => p.confidence >= 50 && p.confidence < 80).length;
    const lowConfidence = predictions.filter(p => p.confidence < 50).length;

    const highYes = predictions.filter(p => p.prediction === 'YES' && p.confidence >= 80).length;
    const highNo = predictions.filter(p => p.prediction === 'NO' && p.confidence >= 80).length;

    return {
      highConfidence: { total: highConfidence, yes: highYes, no: highNo },
      mediumConfidence,
      lowConfidence,
      highConvictionDirection: highYes > highNo ? 'YES' : 'NO',
      highConvictionStrength: Math.abs(highYes - highNo),
    };
  }

  /**
   * Calculate overall signal strength (0-100)
   */
  private calculateSignalStrength(
    consensusProb: number,
    avgConfidence: number,
    agentCount: number,
    clusters: any
  ): number {
    // Distance from 50% (stronger signal = further from random)
    const distanceFromRandom = Math.abs(consensusProb - 0.5) * 2; // 0-1

    // Confidence component
    const confidenceComponent = avgConfidence / 100; // 0-1

    // Sample size component (diminishing returns after 100 agents)
    const sampleComponent = Math.min(agentCount / 100, 1); // 0-1

    // High conviction bonus
    const convictionBonus = clusters.highConfidence.total > agentCount * 0.2 ? 0.1 : 0;

    const strength = (distanceFromRandom * 0.4 + confidenceComponent * 0.4 + sampleComponent * 0.2 + convictionBonus) * 100;

    return Math.round(Math.min(strength, 100));
  }

  /**
   * Extract top consensus factors
   */
  private extractTopFactors(predictions: MergedPrediction[]): string[] {
    const allFactors = predictions.flatMap(p => p.keyFactors || []);
    const factorCounts = new Map<string, number>();

    allFactors.forEach(f => {
      factorCounts.set(f, (factorCounts.get(f) || 0) + 1);
    });

    return Array.from(factorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([factor, count]) => `${factor} (${count})`);
  }

  /**
   * Extract contrarian viewpoint
   */
  private extractContrarianView(predictions: MergedPrediction[]): string {
    const majority = predictions.filter(p => p.prediction === 'YES').length > predictions.length / 2 ? 'YES' : 'NO';
    const minority = predictions.filter(p => p.prediction !== majority);

    if (minority.length === 0) return 'No significant opposition';

    // Get highest confidence contrarian
    const topContrarian = minority.sort((a, b) => b.confidence - a.confidence)[0];
    return `${topContrarian.prediction}: ${topContrarian.rationale.slice(0, 100)}`;
  }

  /**
   * Generate human-readable recommendation
   */
  private generateRecommendation(
    consensusProb: number,
    edge: number,
    signalStrength: number,
    fallbackMode?: boolean
  ): string {
    if (fallbackMode) {
      return 'CAUTION: Running in fallback mode with reduced agent count. Reduce position size.';
    }

    if (edge <= 0) {
      return 'NO EDGE: Market price already reflects consensus view. Skip this market.';
    }

    if (signalStrength < 40) {
      return 'WEAK SIGNAL: Low conviction or near-random distribution. Avoid or size minimally.';
    }

    if (signalStrength >= 80 && edge > 0.15) {
      return 'STRONG BUY: High conviction consensus with significant edge. Full Kelly position.';
    }

    if (signalStrength >= 60 && edge > 0.08) {
      return 'MODERATE BUY: Decent consensus with positive edge. Half-Kelly position.';
    }

    return 'SPECULATIVE: Some signal present but mixed. Quarter-Kelly or skip.';
  }
}

export { SwarmConsensus };
