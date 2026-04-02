import { PodResult, AgentPrediction, MergedPrediction } from '../types/swarm';

/**
 * Result Merger
 * 
 * Combines outputs from multiple pods into unified prediction set.
 * Handles:
 * - Deduplication (same factor cited by multiple agents)
 * - Conflict resolution (contradictory predictions)
 * - Confidence weighting (by pod specialty)
 * - Signal aggregation (similar rationales grouped)
 */
export class ResultMerger {
  private podWeights: Record<number, number> = {
    1: 1.0,  // Fundamentalists
    2: 1.1,  // Technicians (slight edge in short-term)
    3: 0.9,  // SentimentTraders (more volatile)
    4: 1.05, // WhaleWatchers (smart money premium)
  };

  /**
   * Merge all pod results into single prediction array
   */
  merge(pods: PodResult[]): MergedPrediction[] {
    console.log(`[Merger] Merging ${pods.length} pods...`);

    // Flatten all predictions with pod metadata
    const allPredictions = this.flattenPredictions(pods);

    // Group by similar rationale (deduplication)
    const grouped = this.groupByRationale(allPredictions);

    // Resolve conflicts within groups
    const resolved = this.resolveConflicts(grouped);

    // Apply pod weights to confidence
    const weighted = this.applyWeights(resolved);

    console.log(`[Merger] Merged ${allPredictions.length} → ${weighted.length} unique predictions`);

    return weighted;
  }

  /**
   * Flatten pod results with metadata
   */
  private flattenPredictions(pods: PodResult[]): MergedPrediction[] {
    const flattened: MergedPrediction[] = [];

    pods.forEach(pod => {
      pod.predictions.forEach(pred => {
        flattened.push({
          ...pred,
          podId: pod.podId,
          podSpecialty: this.getPodSpecialty(pod.podId),
          weight: this.podWeights[pod.podId] || 1.0,
          merged: false,
          mergeGroup: null,
        });
      });
    });

    return flattened;
  }

  /**
   * Group predictions by similar rationale
   * Uses simple keyword clustering
   */
  private groupByRationale(predictions: MergedPrediction[]): Map<string, MergedPrediction[]> {
    const groups = new Map<string, MergedPrediction[]>();

    predictions.forEach(pred => {
      const keywords = this.extractKeywords(pred.rationale);
      const groupKey = keywords.sort().join('|');

      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(pred);
    });

    // Merge small groups into "misc" category
    const result = new Map<string, MergedPrediction[]>();
    let miscGroup: MergedPrediction[] = [];

    groups.forEach((preds, key) => {
      if (preds.length >= 3) {
        result.set(key, preds);
      } else {
        miscGroup = miscGroup.concat(preds);
      }
    });

    if (miscGroup.length > 0) {
      result.set('misc', miscGroup);
    }

    return result;
  }

  /**
   * Extract keywords from rationale for clustering
   */
  private extractKeywords(rationale: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being']);
    const words = rationale.toLowerCase().split(/\s+/);
    
    return words
      .filter(w => w.length > 3 && !stopWords.has(w))
      .map(w => w.replace(/[^a-z]/g, ''))
      .filter(w => w.length > 3);
  }

  /**
   * Resolve conflicts within groups
   * If group has mixed YES/NO, take weighted majority
   */
  private resolveConflicts(groups: Map<string, MergedPrediction[]>): MergedPrediction[] {
    const resolved: MergedPrediction[] = [];

    groups.forEach((predictions, groupKey) => {
      const yesVotes = predictions.filter(p => p.prediction === 'YES');
      const noVotes = predictions.filter(p => p.prediction === 'NO');

      const yesWeight = yesVotes.reduce((a, b) => a + b.confidence * b.weight, 0);
      const noWeight = noVotes.reduce((a, b) => a + b.confidence * b.weight, 0);

      // Create representative prediction for group
      const representative: MergedPrediction = {
        agentId: `GROUP_${groupKey.slice(0, 20)}`,
        prediction: yesWeight > noWeight ? 'YES' : 'NO',
        confidence: Math.round(Math.abs(yesWeight - noWeight) / Math.max(yesWeight + noWeight, 1)),
        rationale: this.synthesizeRationale(predictions),
        keyFactors: this.aggregateFactors(predictions),
        contrarianFactor: this.findContrarianFactor(predictions),
        podId: predictions[0].podId,
        podSpecialty: 'merged',
        weight: predictions.reduce((a, p) => a + p.weight, 0) / predictions.length,
        merged: true,
        mergeGroup: groupKey,
        mergedCount: predictions.length,
      };

      resolved.push(representative);
    });

    return resolved;
  }

  /**
   * Synthesize representative rationale from group
   */
  private synthesizeRationale(predictions: MergedPrediction[]): string {
    const rationales = predictions.map(p => p.rationale);
    const commonWords = this.findCommonPhrases(rationales);

    if (commonWords.length > 0) {
      return `Consensus: ${commonWords.slice(0, 5).join(', ')}`;
    }

    // Fallback to most confident rationale
    const mostConfident = predictions.sort((a, b) => b.confidence - a.confidence)[0];
    return mostConfident.rationale;
  }

  /**
   * Find common phrases across rationales
   */
  private findCommonPhrases(rationales: string[]): string[] {
    const wordCounts = new Map<string, number>();

    rationales.forEach(r => {
      const words = r.toLowerCase().split(/\s+/);
      words.forEach(w => {
        if (w.length > 4) {
          wordCounts.set(w, (wordCounts.get(w) || 0) + 1);
        }
      });
    });

    return Array.from(wordCounts.entries())
      .filter(([, count]) => count >= rationales.length * 0.3)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word);
  }

  /**
   * Aggregate key factors from all predictions
   */
  private aggregateFactors(predictions: MergedPrediction[]): string[] {
    const allFactors = predictions.flatMap(p => p.keyFactors || []);
    const factorCounts = new Map<string, number>();

    allFactors.forEach(f => {
      factorCounts.set(f, (factorCounts.get(f) || 0) + 1);
    });

    return Array.from(factorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([factor]) => factor);
  }

  /**
   * Find contrarian factor (minority view)
   */
  private findContrarianFactor(predictions: MergedPrediction[]): string {
    const yesCount = predictions.filter(p => p.prediction === 'YES').length;
    const noCount = predictions.filter(p => p.prediction === 'NO').length;

    const minority = yesCount < noCount ? 'YES' : 'NO';
    const minorityPreds = predictions.filter(p => p.prediction === minority);

    if (minorityPreds.length === 0) return 'None';

    // Return most confident minority rationale
    return minorityPreds.sort((a, b) => b.confidence - a.confidence)[0]?.rationale || 'None';
  }

  /**
   * Apply pod weights to confidence scores
   */
  private applyWeights(predictions: MergedPrediction[]): MergedPrediction[] {
    return predictions.map(p => ({
      ...p,
      weightedConfidence: Math.round(p.confidence * p.weight),
    }));
  }

  /**
   * Get specialty name for pod ID
   */
  private getPodSpecialty(podId: number): string {
    const specialties: Record<number, string> = {
      1: 'fundamental',
      2: 'technical',
      3: 'sentiment',
      4: 'whale',
    };
    return specialties[podId] || 'unknown';
  }
}

export { ResultMerger };
