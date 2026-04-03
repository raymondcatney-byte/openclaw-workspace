// app/api/regime/route.ts
// Edge runtime API for current market regime

export const runtime = 'edge';

const REGIMES = [
  { id: 'expansion_risk_on', label: 'Expansion (Risk On)', emoji: '🚀', color: '#22c55e' },
  { id: 'contraction_risk_off', label: 'Contraction (Risk Off)', emoji: '🛡️', color: '#ef4444' },
  { id: 'dollar_dominance', label: 'Dollar Dominance', emoji: '💵', color: '#3b82f6' },
  { id: 'inflation_hedge', label: 'Inflation Hedge', emoji: '🥇', color: '#f59e0b' },
  { id: 'geopolitical_stress', label: 'Geopolitical Stress', emoji: '⚠️', color: '#f97316' },
  { id: 'tech_momentum', label: 'Tech Momentum', emoji: '💻', color: '#8b5cf6' },
  { id: 'crypto_spring', label: 'Crypto Spring', emoji: '🌱', color: '#10b981' },
  { id: 'crypto_winter', label: 'Crypto Winter', emoji: '❄️', color: '#06b6d4' },
  { id: 'choppy_neutral', label: 'Choppy Neutral', emoji: '〰️', color: '#64748b' },
  { id: 'unclear', label: 'Unclear', emoji: '❓', color: '#94a3b8' },
];

export async function GET() {
  // In production, calculate from actual price correlations
  // For now, return current regime with metadata
  
  const currentRegime = REGIMES[5]; // tech_momentum as default
  
  return Response.json({
    regime: {
      id: currentRegime.id,
      label: currentRegime.label,
      emoji: currentRegime.emoji,
      color: currentRegime.color,
      confidence: 0.78,
      duration: 1800, // seconds in current regime
    },
    allRegimes: REGIMES,
    generatedAt: new Date().toISOString(),
    source: 'MarketAnomalyScanner',
  });
}
