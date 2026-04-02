import { sessions_spawn } from '../lib/openclaw';
import { PodConfig, PodResult, SwarmOutput, AgentPrediction } from '../types/swarm';
import { POD_CONFIGS } from './pod-sessions';
import { CriticPool } from './critic-pool';
import { ResultMerger } from './result-merger';
import { SwarmConsensus } from '../consensus/swarm-consensus';

interface OrchestratorConfig {
  maxCostPerScan: number;      // USD
  maxTimePerPod: number;       // milliseconds
  criticThreshold: number;     // 0-1, min approval rate
  enableFallback: boolean;     // Use reduced swarm on failure
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  maxCostPerScan: 0.25,
  maxTimePerPod: 15000,        // 15s timeout per pod
  criticThreshold: 0.70,
  enableFallback: true,
};

/**
 * MiroFish Swarm Orchestrator
 * 
 * Coordinates 4 parallel sub-agent pods (500 agents total)
 * Manages lifecycle, handles failures, validates outputs
 */
export class SwarmOrchestrator {
  private config: OrchestratorConfig;
  private criticPool: CriticPool;
  private resultMerger: ResultMerger;
  private consensusEngine: SwarmConsensus;
  private costTracker: number = 0;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.criticPool = new CriticPool();
    this.resultMerger = new ResultMerger();
    this.consensusEngine = new SwarmConsensus();
  }

  /**
   * Main entry: Run full swarm scan on a market
   */
  async runSwarmScan(
    marketId: string,
    marketContext: MarketContext
  ): Promise<SwarmOutput> {
    console.log(`[Swarm] Starting scan for ${marketId}...`);
    const startTime = Date.now();

    try {
      // Phase 1: Spawn all 4 pods in parallel
      const podPromises = POD_CONFIGS.map(podConfig =>
        this.spawnPod(podConfig, marketId, marketContext)
      );

      const podResults = await Promise.allSettled(podPromises);

      // Phase 2: Process results, handle failures
      const successfulPods = this.processPodResults(podResults);

      // Phase 3: Fallback if needed
      if (successfulPods.length < 3 && this.config.enableFallback) {
        console.log(`[Swarm] Only ${successfulPods.length} pods succeeded, triggering fallback...`);
        return this.handleFallback(marketId, marketContext, successfulPods);
      }

      // Phase 4: Critic validation
      const validatedPods = await this.criticPool.validatePods(successfulPods);
      const approvalRate = validatedPods.length / successfulPods.length;

      if (approvalRate < this.config.criticThreshold) {
        console.warn(`[Swarm] Critic approval ${approvalRate.toFixed(2)} below threshold`);
      }

      // Phase 5: Merge and synthesize
      const mergedPredictions = this.resultMerger.merge(validatedPods);
      const consensus = this.consensusEngine.synthesize(
        mergedPredictions,
        marketContext
      );

      const duration = Date.now() - startTime;
      console.log(`[Swarm] Scan complete in ${duration}ms, cost: $${this.costTracker.toFixed(3)}`);

      return {
        marketId,
        timestamp: new Date().toISOString(),
        duration,
        cost: this.costTracker,
        podCount: successfulPods.length,
        agentCount: mergedPredictions.length,
        predictions: mergedPredictions,
        consensus,
        metadata: {
          criticApprovalRate: approvalRate,
          fallbackTriggered: false,
        }
      };

    } catch (error) {
      console.error('[Swarm] Critical error:', error);
      throw new SwarmError('Orchestrator failed', error);
    }
  }

  /**
   * Spawn a single pod as isolated sub-agent session
   */
  private async spawnPod(
    podConfig: PodConfig,
    marketId: string,
    marketContext: MarketContext
  ): Promise<PodResult> {
    const prompt = this.buildPodPrompt(podConfig, marketId, marketContext);

    const session = await sessions_spawn({
      task: prompt,
      agentId: 'kimi-coding/k2p5',
      timeoutSeconds: Math.ceil(this.config.maxTimePerPod / 1000),
      thinking: 'high',  // K2.5 reasoning mode
    });

    // Track cost (approximate: $0.03 per 1K tokens)
    this.costTracker += 0.03;

    return this.parsePodOutput(session.result, podConfig);
  }

  /**
   * Build system prompt for pod sub-agent
   */
  private buildPodPrompt(
    podConfig: PodConfig,
    marketId: string,
    context: MarketContext
  ): string {
    return `
You are Pod ${podConfig.id}: ${podConfig.name}
Specialty: ${podConfig.specialty}

TASK: Analyze prediction market ${marketId} using ${podConfig.agentCount} agent personas.

MARKET CONTEXT:
${JSON.stringify(context, null, 2)}

YOUR AGENTS (${podConfig.agentCount} total):
${podConfig.agents.map(a => `- ${a.name}: ${a.style}, ${a.timeframe}`).join('\n')}

Execute all agents in parallel within this session.
For each agent, output:
{
  "agentId": "string",
  "prediction": "YES" | "NO",
  "confidence": 0-100,
  "rationale": "string (max 100 chars)",
  "keyFactors": ["string"],
  "contrarianFactor": "string"
}

Return valid JSON array of all ${podConfig.agentCount} predictions.
Be decisive. Avoid 50% confidence. Commit to a direction.
`;
  }

  /**
   * Process pod results, filter successes from failures
   */
  private processPodResults(
    results: PromiseSettledResult<PodResult>[]
  ): PodResult[] {
    const successful: PodResult[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        console.error(`[Swarm] Pod ${index + 1} failed:`, result.reason);
      }
    });

    return successful;
  }

  /**
   * Handle fallback scenarios
   */
  private async handleFallback(
    marketId: string,
    context: MarketContext,
    availablePods: PodResult[]
  ): Promise<SwarmOutput> {
    if (availablePods.length === 0) {
      throw new SwarmError('All pods failed, no fallback possible');
    }

    // Use available pods + run sequential baseline
    console.log(`[Swarm] Fallback: Using ${availablePods.length} pods + baseline`);

    const mergedPredictions = this.resultMerger.merge(availablePods);
    const consensus = this.consensusEngine.synthesize(
      mergedPredictions,
      context,
      { fallbackMode: true }
    );

    return {
      marketId,
      timestamp: new Date().toISOString(),
      duration: 0,
      cost: this.costTracker,
      podCount: availablePods.length,
      agentCount: mergedPredictions.length,
      predictions: mergedPredictions,
      consensus,
      metadata: {
        criticApprovalRate: 0,
        fallbackTriggered: true,
      }
    };
  }

  private parsePodOutput(output: string, config: PodConfig): PodResult {
    try {
      const predictions: AgentPrediction[] = JSON.parse(output);
      return {
        podId: config.id,
        predictions,
        agentCount: predictions.length,
        timestamp: new Date().toISOString(),
      };
    } catch (e) {
      throw new SwarmError(`Pod ${config.id} returned invalid JSON`, e);
    }
  }
}

class SwarmError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'SwarmError';
  }
}

// Types
interface MarketContext {
  currentPrice: number;
  volume24h: number;
  newsHeadlines: string[];
  onChainMetrics?: Record<string, number>;
}

export { SwarmOrchestrator, SwarmError };
export type { OrchestratorConfig, MarketContext };
