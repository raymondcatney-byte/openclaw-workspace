import { PodConfig, AgentPersona } from '../types/swarm';

/**
 * Pod Session Configurations
 * 
 * 4 pods × 125 agents = 500 total agents
 * Distributed by specialty with internal diversity
 */

const BASE_PERSONAS: Record<string, AgentPersona[]> = {
  fundamental: [
    { name: 'ValueHunter', style: 'Deep value, margin of safety', timeframe: '2-4 weeks', conviction: 'high' },
    { name: 'EarningsEdge', style: 'Earnings surprise prediction', timeframe: '1-2 weeks', conviction: 'high' },
    { name: 'MacroMaven', style: 'Fed policy, rates, inflation', timeframe: '1-3 months', conviction: 'medium' },
    { name: 'DCFModeler', style: 'Discounted cash flow purist', timeframe: '1 month', conviction: 'high' },
    { name: 'SectorRotator', style: 'Industry cycle timing', timeframe: '2-6 weeks', conviction: 'medium' },
    { name: 'CatalystChaser', style: 'Event-driven, binary outcomes', timeframe: '1-2 weeks', conviction: 'high' },
    { name: 'QualityInvestor', style: 'ROIC, moats, management', timeframe: '1-3 months', conviction: 'medium' },
    { name: 'GrowthAtPrice', style: 'PEG ratios, runway analysis', timeframe: '3-6 weeks', conviction: 'medium' },
    { name: 'ContrarianValue', style: 'Hated names, turnaround', timeframe: '1-2 months', conviction: 'high' },
    { name: 'DividendDetective', style: 'Yield sustainability', timeframe: '2-4 weeks', conviction: 'low' },
  ],
  technical: [
    { name: 'Chartist', style: 'Support/resistance, patterns', timeframe: '2-7 days', conviction: 'high' },
    { name: 'MomentumRider', style: 'RSI, MACD, trend following', timeframe: '3-10 days', conviction: 'high' },
    { name: 'FlowAnalyzer', style: 'Options flow, volume profile', timeframe: '1-3 days', conviction: 'high' },
    { name: 'VolatilityTrader', style: 'VIX, vol surface, skew', timeframe: '1-7 days', conviction: 'medium' },
    { name: 'VolumeSleuth', style: 'Unusual volume, accumulation', timeframe: '2-5 days', conviction: 'high' },
    { name: 'BreakoutHunter', style: 'Range breaks, momentum ignition', timeframe: '1-4 days', conviction: 'high' },
    { name: 'MeanReverter', style: 'Overbought/oversold extremes', timeframe: '3-7 days', conviction: 'medium' },
    { name: 'StructureTrader', style: 'Market structure, liquidity', timeframe: '1-5 days', conviction: 'high' },
  ],
  sentiment: [
    { name: 'NarrativeTracker', style: 'Story momentum, media cycle', timeframe: '3-10 days', conviction: 'high' },
    { name: 'SocialSurfer', style: 'Twitter/X sentiment velocity', timeframe: '1-5 days', conviction: 'medium' },
    { name: 'NewsVelocity', style: 'Headline sentiment, surprise', timeframe: '1-3 days', conviction: 'high' },
    { name: 'InfluencerTracker', style: 'Key opinion leader moves', timeframe: '2-7 days', conviction: 'medium' },
    { name: 'RedditRadar', style: 'Crowd positioning, cohorts', timeframe: '3-10 days', conviction: 'medium' },
    { name: 'FearGreed', style: 'CNN index, sentiment extremes', timeframe: '1-2 weeks', conviction: 'medium' },
    { name: 'MemeMomentum', style: 'Viral narrative, FOMO waves', timeframe: '1-5 days', conviction: 'high' },
    { name: 'ContrarianSentiment', style: 'Fade the crowd', timeframe: '1-2 weeks', conviction: 'high' },
  ],
  whale: [
    { name: 'WalletWatcher', style: 'Smart money tracking', timeframe: '1-7 days', conviction: 'high' },
    { name: 'ExchangeFlow', style: 'Inflow/outflow analysis', timeframe: '1-3 days', conviction: 'high' },
    { name: 'WhaleAccumulator', style: 'Large holder patterns', timeframe: '1-2 weeks', conviction: 'high' },
    { name: 'InstitutionalTracker', style: '13F, fund flows', timeframe: '2-6 weeks', conviction: 'medium' },
  ],
  behavioral: [
    { name: 'AnchoringBias', style: 'Price anchoring effects', timeframe: '1-2 weeks', conviction: 'medium' },
    { name: 'LossAversion', style: 'Support holding patterns', timeframe: '1-3 weeks', conviction: 'medium' },
    { name: 'RecencyBias', style: 'Recent event overweighting', timeframe: '1-2 weeks', conviction: 'high' },
    { name: 'HerdingDetector', style: 'Crowd panic/euphoria', timeframe: '3-10 days', conviction: 'high' },
    { name: 'Overconfidence', style: 'Aggressive positioning extremes', timeframe: '2-4 weeks', conviction: 'medium' },
    { name: 'DispositionEffect', style: 'Sell winners, hold losers', timeframe: '2-4 weeks', conviction: 'medium' },
    { name: 'SunkCostFallacy', style: 'Commitment escalation', timeframe: '1-3 weeks', conviction: 'low' },
    { name: 'ConfirmationBias', style: 'Echo chamber strength', timeframe: '1-2 weeks', conviction: 'high' },
    { name: 'AvailabilityCascade', style: 'Vivid event salience', timeframe: '1-2 weeks', conviction: 'medium' },
    { name: 'EndowmentEffect', style: 'Ownership bias in prediction', timeframe: '2-3 weeks', conviction: 'low' },
    { name: 'MentalAccounting', style: 'Portfolio compartmentalization', timeframe: '2-4 weeks', conviction: 'low' },
    { name: 'BandwagonEffect', style: 'Social proof cascades', timeframe: '3-10 days', conviction: 'high' },
  ],
};

/**
 * Generate 125 agents for a pod by mixing base personas with variations
 */
function generatePodAgents(
  baseTypes: string[],
  podSpecialty: string
): AgentPersona[] {
  const agents: AgentPersona[] = [];
  const agentsPerType = Math.floor(125 / baseTypes.length);

  baseTypes.forEach(type => {
    const basePersonas = BASE_PERSONAS[type] || [];

    for (let i = 0; i < agentsPerType; i++) {
      const base = basePersonas[i % basePersonas.length];
      const variation = i >= basePersonas.length ? `_${Math.floor(i / basePersonas.length)}` : '';

      agents.push({
        name: `${base.name}${variation}`,
        style: base.style,
        timeframe: base.timeframe,
        conviction: base.conviction,
        specialty: podSpecialty,
      });
    }
  });

  // Fill remainder with diversified mix
  while (agents.length < 125) {
    const randomType = baseTypes[Math.floor(Math.random() * baseTypes.length)];
    const randomBase = BASE_PERSONAS[randomType][0];
    agents.push({
      name: `${randomBase.name}_Extra${agents.length}`,
      style: randomBase.style,
      timeframe: randomBase.timeframe,
      conviction: 'medium',
      specialty: 'flex',
    });
  }

  return agents.slice(0, 125);
}

/**
 * Pod configurations
 */
export const POD_CONFIGS: PodConfig[] = [
  {
    id: 1,
    name: 'Fundamentalists',
    specialty: 'Earnings, macro, valuation models',
    agentCount: 125,
    baseTypes: ['fundamental'],
    agents: generatePodAgents(['fundamental'], 'value'),
  },
  {
    id: 2,
    name: 'Technicians',
    specialty: 'Chart patterns, indicators, flow',
    agentCount: 125,
    baseTypes: ['technical'],
    agents: generatePodAgents(['technical'], 'momentum'),
  },
  {
    id: 3,
    name: 'SentimentTraders',
    specialty: 'Social, news, narrative velocity',
    agentCount: 125,
    baseTypes: ['sentiment'],
    agents: generatePodAgents(['sentiment'], 'narrative'),
  },
  {
    id: 4,
    name: 'WhaleWatchers',
    specialty: 'On-chain, crowd psychology, contrarian',
    agentCount: 125,
    baseTypes: ['whale', 'behavioral'],
    agents: generatePodAgents(['whale', 'behavioral'], 'smart-money'),
  },
];

export { generatePodAgents };
