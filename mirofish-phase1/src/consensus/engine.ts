import { AgentOpinion, Consensus, OpinionCluster } from '../types/index.js';

const CLUSTER_BANDWIDTH = 0.1; // 10% bandwidth for clustering

function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
}

export function clusterOpinions(
  opinions: AgentOpinion[],
  bandwidth: number = CLUSTER_BANDWIDTH
): OpinionCluster[] {
  if (opinions.length === 0) return [];
  
  // Sort by prediction value
  const sorted = [...opinions].sort((a, b) => a.prediction - b.prediction);
  
  const clusters: { center: number; opinions: AgentOpinion[] }[] = [];
  let currentCluster: AgentOpinion[] = [sorted[0]];
  
  for (let i = 1; i < sorted.length; i++) {
    const lastPrediction = currentCluster[currentCluster.length - 1].prediction;
    const currentPrediction = sorted[i].prediction;
    
    if (currentPrediction - lastPrediction <= bandwidth) {
      currentCluster.push(sorted[i]);
    } else {
      // Start new cluster
      const center = currentCluster.reduce((sum, o) => sum + o.prediction, 0) / currentCluster.length;
      clusters.push({ center, opinions: currentCluster });
      currentCluster = [sorted[i]];
    }
  }
  
  // Don't forget the last cluster
  if (currentCluster.length > 0) {
    const center = currentCluster.reduce((sum, o) => sum + o.prediction, 0) / currentCluster.length;
    clusters.push({ center, opinions: currentCluster });
  }
  
  // Convert to OpinionCluster format with weights
  return clusters.map(cluster => {
    const avgConfidence = cluster.opinions.reduce((sum, o) => sum + o.confidence, 0) / cluster.opinions.length;
    const variance = calculateVariance(cluster.opinions.map(o => o.prediction));
    const coherence = 1 / (1 + variance * 10);
    
    return {
      center: cluster.center,
      opinions: cluster.opinions,
      weight: cluster.opinions.length * avgConfidence,
      coherence,
    };
  });
}

export function generateConsensus(
  marketId: string,
  opinions: AgentOpinion[],
  simulationTimeMs: number
): Consensus {
  const startTime = Date.now();
  
  // Cluster opinions
  const clusters = clusterOpinions(opinions);
  
  if (clusters.length === 0) {
    throw new Error('No opinions to generate consensus');
  }
  
  // Sort clusters by weight
  const sortedClusters = [...clusters].sort((a, b) => b.weight - a.weight);
  const majorityCluster = sortedClusters[0];
  
  // Calculate weighted consensus
  const totalWeight = clusters.reduce((sum, c) => sum + c.weight, 0);
  const weightedProbability = clusters.reduce(
    (sum, c) => sum + (c.center * c.weight),
    0
  ) / totalWeight;
  
  // Confidence = coherence of majority cluster × cluster dominance
  const clusterDominance = majorityCluster.weight / totalWeight;
  const overallConfidence = majorityCluster.coherence * clusterDominance;
  
  // Find dissenting opinions (outside majority cluster, high confidence)
  const majorityAgentIds = new Set(majorityCluster.opinions.map(o => o.agentId));
  const dissentingOpinions = opinions
    .filter(o => !majorityAgentIds.has(o.agentId) && o.confidence > 0.6)
    .slice(0, 5);
  
  return {
    marketId,
    probability: Math.max(0, Math.min(1, weightedProbability)),
    confidence: Math.max(0, Math.min(1, overallConfidence)),
    clusters: sortedClusters,
    majorityCluster,
    dissentingOpinions,
    timestamp: new Date(),
    agentCount: opinions.length,
    simulationTimeMs: simulationTimeMs + (Date.now() - startTime),
  };
}

export interface ConsensusValidation {
  isValid: boolean;
  issues: string[];
  recommendation: 'proceed' | 'caution' | 'reject';
}

export function validateConsensus(consensus: Consensus): ConsensusValidation {
  const issues: string[] = [];
  
  if (consensus.confidence < 0.3) {
    issues.push(`Low confidence: ${(consensus.confidence * 100).toFixed(1)}%`);
  }
  
  if (consensus.clusters.length > 3) {
    issues.push('Highly fragmented opinion');
  }
  
  const majorityWeight = consensus.majorityCluster.weight;
  const totalWeight = consensus.clusters.reduce((sum, c) => sum + c.weight, 0);
  if (majorityWeight / totalWeight < 0.6) {
    issues.push('Weak majority');
  }
  
  // Check for bimodal distribution
  if (consensus.clusters.length === 2) {
    const c1 = consensus.clusters[0];
    const c2 = consensus.clusters[1];
    const distance = Math.abs(c1.center - c2.center);
    if (distance > 0.3 && c1.weight > 0.3 * totalWeight && c2.weight > 0.3 * totalWeight) {
      issues.push('Bimodal/polarized market');
    }
  }
  
  let recommendation: 'proceed' | 'caution' | 'reject' = 'proceed';
  if (issues.length >= 2) recommendation = 'caution';
  if (issues.length >= 3 || consensus.confidence < 0.2) recommendation = 'reject';
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendation,
  };
}
