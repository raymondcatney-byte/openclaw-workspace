// packages/kb-engine/tests/mock-data/crypto-mocks.ts
// Mock crypto data for testing KB engine

import { KBEntry } from '../../src/types';

export const cryptoMockData: KBEntry[] = [
  // === PATTERNS ===
  {
    id: 'pattern-crypto-001',
    content: 'Large whale accumulation (10k+ BTC) with exchange outflows and flat price = 72% chance of breakout within 48 hours. Average move: +12%. Smart money leading indicator.',
    metadata: {
      type: 'pattern',
      domain: 'crypto',
      asset: 'bitcoin',
      timestamp: 1704067200000,
      tags: ['whale', 'accumulation', 'exchange outflow', 'breakout']
    }
  },
  {
    id: 'pattern-crypto-002',
    content: 'ETF flow absorption pattern: Large inflows ($500M+) with muted price response (+2% or less) indicates supply exhaustion. 70% chance of delayed breakout within 48h.',
    metadata: {
      type: 'pattern',
      domain: 'crypto',
      asset: 'bitcoin',
      timestamp: 1704153600000,
      tags: ['ETF', 'inflows', 'absorption', 'breakout']
    }
  },
  {
    id: 'pattern-crypto-003',
    content: 'Funding rates >0.04% per 8hr with OI spike = crowded long positioning. Contrarian signal: 65% chance of pullback within 24h. Average pullback: -6%.',
    metadata: {
      type: 'pattern',
      domain: 'crypto',
      asset: 'ethereum',
      timestamp: 1704240000000,
      tags: ['funding', 'OI', 'crowded', 'contrarian']
    }
  },
  {
    id: 'pattern-crypto-004',
    content: 'SEC regulatory announcement typically causes -3% knee-jerk reaction followed by recovery within 48h. Pattern: sell the rumor/uncertainty, buy the clarity.',
    metadata: {
      type: 'pattern',
      domain: 'crypto',
      asset: 'bitcoin',
      timestamp: 1704326400000,
      tags: ['SEC', 'regulation', 'knee-jerk', 'recovery']
    }
  },
  {
    id: 'pattern-crypto-005',
      content: 'Extreme social sentiment divergence: sentiment >0.7 but price down = bearish. Sentiment <-0.7 but price up = bullish. 60% follow-through rate.',
    metadata: {
      type: 'pattern',
      domain: 'crypto',
      asset: 'generic_crypto',
      timestamp: 1704412800000,
      tags: ['sentiment', 'divergence', 'contrarian']
    }
  },
  
  // === EVENTS ===
  {
    id: 'event-crypto-001',
    content: 'Bitcoin: +12,400 BTC moved to cold wallets in 24h. Exchange outflows: -18,200 BTC. Whale wallets accumulating. Price only +0.8%.',
    metadata: {
      type: 'event',
      domain: 'crypto',
      asset: 'bitcoin',
      timestamp: 1711929600000, // April 1, 2024
      tags: ['whale', 'accumulation', 'outflows', 'cold wallet']
    }
  },
  {
    id: 'event-crypto-002',
    content: 'Bitcoin ETF sees +$890M inflows over 3 days. Largest since March. Price response muted: +1.2% vs typical +4-5% for this inflow size.',
    metadata: {
      type: 'event',
      domain: 'crypto',
      asset: 'bitcoin',
      timestamp: 1714521600000, // May 1, 2024
      tags: ['ETF', 'inflows', 'GBTC', 'absorption']
    }
  },
  {
    id: 'event-crypto-003',
    content: 'Ethereum funding rate spikes to +0.045% per 8hr. Open interest +15% in 24h. Social sentiment extremely bullish. Potential crowded trade.',
    metadata: {
      type: 'event',
      domain: 'crypto',
      asset: 'ethereum',
      timestamp: 1717200000000, // June 1, 2024
      tags: ['funding', 'OI', 'sentiment', 'crowded']
    }
  },
  {
    id: 'event-crypto-004',
    content: 'SEC files response in Coinbase lawsuit. Market initially drops -2.8% on headline. No new enforcement announced.',
    metadata: {
      type: 'event',
      domain: 'crypto',
      asset: 'bitcoin',
      timestamp: 1719792000000, // July 1, 2024
      tags: ['SEC', 'Coinbase', 'lawsuit', 'knee-jerk']
    }
  },
  {
    id: 'event-crypto-005',
    content: 'Solana: Social sentiment +0.82 (very bullish) but price down -4% in 24h. Sentiment-price divergence detected.',
    metadata: {
      type: 'event',
      domain: 'crypto',
      asset: 'solana',
      timestamp: 1722470400000, // Aug 1, 2024
      tags: ['sentiment', 'divergence', 'Solana']
    }
  },
  {
    id: 'event-crypto-006',
    content: 'MicroStrategy announces $500M convertible note offering to buy more Bitcoin. Treasury strategy continues.',
    metadata: {
      type: 'event',
      domain: 'crypto',
      asset: 'bitcoin',
      timestamp: 1725148800000, // Sept 1, 2024
      tags: ['MicroStrategy', 'treasury', 'buying']
    }
  },
  
  // === PREDICTIONS (Correct) ===
  {
    id: 'pred-crypto-001',
    content: 'Predicted Bitcoin breakout. Rationale: +12.4k BTC to cold wallets, -18.2k exchange outflows, price flat. Pattern: 72% breakout within 48h, avg +12%.',
    metadata: {
      type: 'prediction',
      domain: 'crypto',
      asset: 'bitcoin',
      timestamp: 1712016000000, // April 2, 2024
      outcome: 'correct',
      edge: 0.11,
      tags: ['up', 'breakout', 'whale', 'accumulation']
    }
  },
  {
    id: 'pred-crypto-002',
    content: 'Predicted Bitcoin breakout within 48h. Rationale: $890M ETF inflows with only +1.2% move = absorption. Pattern: 70% breakout rate.',
    metadata: {
      type: 'prediction',
      domain: 'crypto',
      asset: 'bitcoin',
      timestamp: 1714608000000, // May 2, 2024
      outcome: 'correct',
      edge: 0.095,
      tags: ['up', 'breakout', 'ETF', 'absorption']
    }
  },
  {
    id: 'pred-crypto-003',
    content: 'Predicted Ethereum pullback. Rationale: Funding 0.045% + OI spike + extreme sentiment = crowded long. Contrarian: 65% pullback rate.',
    metadata: {
      type: 'prediction',
      domain: 'crypto',
      asset: 'ethereum',
      timestamp: 1717286400000, // June 2, 2024
      outcome: 'correct',
      edge: 0.06,
      tags: ['down', 'pullback', 'funding', 'contrarian']
    }
  },
  {
    id: 'pred-crypto-004',
    content: 'Predicted Bitcoin recovery post-SEC knee-jerk. Rationale: -2.8% drop on SEC filing matches pattern. No new enforcement = buy clarity.',
    metadata: {
      type: 'prediction',
      domain: 'crypto',
      asset: 'bitcoin',
      timestamp: 1719888000000, // July 2, 2024
      outcome: 'correct',
      edge: 0.045,
      tags: ['up', 'recovery', 'SEC', 'knee-jerk']
    }
  },
  {
    id: 'pred-crypto-005',
    content: 'Predicted Solana bounce. Rationale: Sentiment +0.82 but price -4% = bearish divergence. Pattern: 60% follow-through for sentiment divergence.',
    metadata: {
      type: 'prediction',
      domain: 'crypto',
      asset: 'solana',
      timestamp: 1722556800000, // Aug 2, 2024
      outcome: 'correct',
      edge: 0.08,
      tags: ['down', 'divergence', 'sentiment', 'Solana']
    }
  },
  
  // === PREDICTIONS (Incorrect) ===
  {
    id: 'pred-crypto-006',
    content: 'Predicted Bitcoin rally on MicroStrategy buy announcement. Rationale: Large buyer entering market. Market already priced in, no move.',
    metadata: {
      type: 'prediction',
      domain: 'crypto',
      asset: 'bitcoin',
      timestamp: 1725235200000, // Sept 2, 2024
      outcome: 'incorrect',
      edge: -0.02,
      tags: ['up', 'MicroStrategy', 'priced in']
    }
  },
  {
    id: 'pred-crypto-007',
    content: 'Predicted altseason on Bitcoin dominance peak. Rationale: Historical rotation pattern. Rotation did not materialize, BTC continued dominance.',
    metadata: {
      type: 'prediction',
      domain: 'crypto',
      asset: 'altcoins',
      timestamp: 1712016000000,
      outcome: 'incorrect',
      edge: -0.08,
      tags: ['up', 'altseason', 'rotation']
    }
  },
  
  // === OUTCOMES ===
  {
    id: 'outcome-crypto-001',
    content: 'Bitcoin rallied from $67k to $75k (+11.9%) within 48h of whale accumulation signal. Correct prediction.',
    metadata: {
      type: 'outcome',
      domain: 'crypto',
      asset: 'bitcoin',
      timestamp: 1712361600000,
      outcome: 'correct',
      edge: 0.11
    }
  },
  {
    id: 'outcome-crypto-002',
    content: 'Bitcoin broke out +9.5% within 48h of ETF absorption signal. Correct prediction with strong edge.',
    metadata: {
      type: 'outcome',
      domain: 'crypto',
      asset: 'bitcoin',
      timestamp: 1714953600000,
      outcome: 'correct',
      edge: 0.095
    }
  },
  {
    id: 'outcome-crypto-003',
    content: 'Ethereum pulled back -5.8% within 24h of funding extreme signal. Correct contrarian call.',
    metadata: {
      type: 'outcome',
      domain: 'crypto',
      asset: 'ethereum',
      timestamp: 1717545600000,
      outcome: 'correct',
      edge: 0.06
    }
  },
  {
    id: 'outcome-crypto-004',
    content: 'Altcoins flat, Bitcoin dominance continued climbing. Incorrect altseason prediction. Lesson: Don't fight the trend.',
    metadata: {
      type: 'outcome',
      domain: 'crypto',
      asset: 'altcoins',
      timestamp: 1712534400000,
      outcome: 'incorrect',
      edge: -0.08
    }
  }
];

// Test query for crypto
export const cryptoTestQuery = {
  asset: 'bitcoin',
  priceMove: { magnitude: 0.008, timeframe: '24h' },
  domain: 'crypto' as const,
  currentMarketPrice: 0.45,
  externalEvents: [
    {
      type: 'whale_movement',
      description: '15,200 BTC moved to cold wallets, exchange outflows -22,400 BTC',
      timestamp: Date.now(),
      significance: 0.95
    },
    {
      type: 'exchange_flow',
      description: 'Largest exchange outflow in 3 weeks',
      timestamp: Date.now(),
      significance: 0.85
    }
  ]
};
