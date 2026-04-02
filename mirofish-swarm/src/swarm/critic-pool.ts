import { PodResult, ValidationResult } from '../types/swarm';

/**
 * Critic Pool
 * 
 * Validates pod outputs for:
 * 1. Internal coherence (do agents within pod agree reasonably?)
 * 2. Output quality (valid JSON, required fields present)
 * 3. Outlier detection (flag extreme predictions for review)
 * 
 * 25 critic agents distributed across validation tasks
 */
export class CriticPool {
  private criticCount: number = 25;

  /**
   * Validate all pod outputs
   */
  async validatePods(pods: PodResult[]): Promise<PodResult[]> {
    const validationPromises = pods.map(pod => this.validatePod(pod));
    const results = await Promise.all(validationPromises);

    return results
      .filter(r => r.approved)
      .map(r => r.pod);
  }

  /**
   * Validate single pod through critic lens
   */
  private async validatePod(pod: PodResult): Promise<ValidationResult> {
    const checks = {
      structure: this.checkStructure(pod),
      coherence: this.checkCoherence(pod),
      diversity: this.checkDiversity(pod),
      extremes: this.checkExtremes(pod),
    };

    const approvalScore = Object.values(checks).reduce((a, b) => a + b, 0) / 4;
    const approved = approvalScore >= 0.6; // 60% threshold

    if (!approved) {
      console.warn(`[Critic] Pod ${pod.podId} rejected:`, checks);
    }

    return {
      pod,
      approved,
      score: approvalScore,
      checks,
    };
  }

  /**
   * Check 1: Structure validation
   * - All predictions have required fields
   * - Confidence values in valid range
   * - No duplicate agent IDs
   */
  private checkStructure(pod: PodResult): number {
    const predictions = pod.predictions;
    const requiredFields = ['agentId', 'prediction', 'confidence', 'rationale'];

    let validCount = 0;
    const seenIds = new Set<string>();

    for (const p of predictions) {
      const hasFields = requiredFields.every(f => f in p);
      const validConfidence = p.confidence >= 0 && p.confidence <= 100;
      const uniqueId = !seenIds.has(p.agentId);

      if (hasFields && validConfidence && uniqueId) {
        validCount++;
        seenIds.add(p.agentId);
      }
    }

    return validCount / predictions.length;
  }

  /**
   * Check 2: Coherence validation
   * - Pod shouldn't have 100% agreement (groupthink)
   * - Pod shouldn't have 50/50 split (no conviction)
   * - Ideal: 60-80% consensus with minority dissent
   */
  private checkCoherence(pod: PodResult): number {
    const predictions = pod.predictions;
    const yesCount = predictions.filter(p => p.prediction === 'YES').length;
    const ratio = yesCount / predictions.length;

    // Ideal range: 60-80% consensus
    if (ratio >= 0.6 && ratio <= 0.8) return 1.0;
    if (ratio >= 0.5 && ratio <= 0.9) return 0.7;
    if (ratio >= 0.3 && ratio <= 0.95) return 0.4;
    return 0.1; // Extreme consensus or no consensus
  }

  /**
   * Check 3: Diversity validation
   * - Variety of confidence levels (not all 75%)
   * - Variety of rationales (not copy-paste)
   */
  private checkDiversity(pod: PodResult): number {
    const predictions = pod.predictions;

    // Confidence diversity
    const confidences = predictions.map(p => p.confidence);
    const uniqueConfidences = new Set(confidences).size;
    const confidenceScore = Math.min(uniqueConfidences / 10, 1); // At least 10 unique values

    // Rationale diversity (simple heuristic: unique first 20 chars)
    const rationales = predictions.map(p => p.rationale?.slice(0, 20));
    const uniqueRationales = new Set(rationales).size;
    const rationaleScore = uniqueRationales / predictions.length;

    return (confidenceScore + rationaleScore) / 2;
  }

  /**
   * Check 4: Extremes detection
   * - Flag pods with >20% 95%+ confidence predictions (overconfidence)
   * - Flag pods with >20% 10%- confidence predictions (underconfidence)
   */
  private checkExtremes(pod: PodResult): number {
    const predictions = pod.predictions;
    const highConfidence = predictions.filter(p => p.confidence >= 95).length;
    const lowConfidence = predictions.filter(p => p.confidence <= 10).length;

    const highRatio = highConfidence / predictions.length;
    const lowRatio = lowConfidence / predictions.length;

    // Penalize if >20% are extreme
    if (highRatio > 0.2 || lowRatio > 0.2) return 0.5;
    if (highRatio > 0.1 || lowRatio > 0.1) return 0.8;
    return 1.0;
  }

  /**
   * Get outlier predictions for manual review
   */
  getOutliers(pods: PodResult[]): OutlierReport {
    const outliers: OutlierPrediction[] = [];

    pods.forEach(pod => {
      const predictions = pod.predictions;
      const avgConfidence = predictions.reduce((a, b) => a + b.confidence, 0) / predictions.length;

      predictions.forEach(p => {
        const deviation = Math.abs(p.confidence - avgConfidence);
        if (deviation > 30) {
          outliers.push({
            podId: pod.podId,
            agentId: p.agentId,
            prediction: p.prediction,
            confidence: p.confidence,
            avgPodConfidence: avgConfidence,
            deviation,
            rationale: p.rationale,
          });
        }
      });
    });

    return {
      totalOutliers: outliers.length,
      outliers: outliers.sort((a, b) => b.deviation - a.deviation).slice(0, 20),
    };
  }
}

interface OutlierPrediction {
  podId: number;
  agentId: string;
  prediction: string;
  confidence: number;
  avgPodConfidence: number;
  deviation: number;
  rationale: string;
}

interface OutlierReport {
  totalOutliers: number;
  outliers: OutlierPrediction[];
}

export { OutlierPrediction, OutlierReport };
