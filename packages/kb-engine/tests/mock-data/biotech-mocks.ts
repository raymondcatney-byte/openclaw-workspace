// packages/kb-engine/tests/mock-data/biotech-mocks.ts
// Mock biotech data for testing KB engine

import { KBEntry } from '../../src/types';

export const biotechMockData: KBEntry[] = [
  // === PATTERNS ===
  {
    id: 'pattern-bio-001',
    content: 'FDA PDUFA approaching within 7 days with no price movement typically results in 15-20% volatility. Historical base rate: 68% approval. When adcom is favorable (>10-1 vote), approval rate increases to 85%.',
    metadata: {
      type: 'pattern',
      domain: 'biotech',
      asset: 'generic_biotech',
      timestamp: 1704067200000, // Jan 1, 2024
      tags: ['PDUFA', 'FDA', 'approval', 'volatility']
    }
  },
  {
    id: 'pattern-bio-002',
    content: 'Phase 3 topline readout with p<0.001 and clear primary endpoint hit leads to 80%+ probability of approval. Market typically underreacts by 10-15% in first 24 hours.',
    metadata: {
      type: 'pattern',
      domain: 'biotech',
      asset: 'generic_biotech',
      timestamp: 1704153600000,
      tags: ['Phase 3', 'topline', 'readout', 'underreaction']
    }
  },
  {
    id: 'pattern-bio-003',
    content: 'FDA Advisory Committee unanimous or near-unanimous vote (>10-1) strongly predicts approval. Market still prices 20-30% doubt post-adcom. Edge: +15-20%.',
    metadata: {
      type: 'pattern',
      domain: 'biotech',
      asset: 'generic_biotech',
      timestamp: 1704240000000,
      tags: ['adcom', 'unanimous', 'approval', 'edge']
    }
  },
  
  // === EVENTS ===
  {
    id: 'event-bio-001',
    content: 'Drug X-305 PDUFA date approaching: March 15, 2024. Phase 3 data showed 94% efficacy in primary endpoint. No safety signals. Market price: 42¢ YES.',
    metadata: {
      type: 'event',
      domain: 'biotech',
      asset: 'X-305',
      timestamp: 1709251200000, // March 1, 2024
      tags: ['PDUFA', 'Phase 3', 'efficacy']
    }
  },
  {
    id: 'event-bio-002',
    content: 'FDA Advisory Committee voted 12-1 in favor of X-305 approval. Committee cited strong efficacy data and acceptable safety profile. Market moved to 58¢ YES.',
    metadata: {
      type: 'event',
      domain: 'biotech',
      asset: 'X-305',
      timestamp: 1709337600000, // March 2, 2024
      tags: ['adcom', 'vote', 'favorable']
    }
  },
  {
    id: 'event-bio-003',
    content: 'Drug Y-102 Phase 3 topline results: Primary endpoint met with p<0.001. 89% efficacy observed. No serious adverse events. Stock up 12% premarket.',
    metadata: {
      type: 'event',
      domain: 'biotech',
      asset: 'Y-102',
      timestamp: 1711929600000, // April 1, 2024
      tags: ['Phase 3', 'topline', 'primary endpoint']
    }
  },
  {
    id: 'event-bio-004',
    content: 'Drug Z-440 Phase 2b results: Mixed efficacy, higher than expected discontinuation rate due to side effects. FDA expresses concerns.',
    metadata: {
      type: 'event',
      domain: 'biotech',
      asset: 'Z-440',
      timestamp: 1714521600000, // May 1, 2024
      tags: ['Phase 2b', 'mixed', 'safety concerns']
    }
  },
  {
    id: 'event-bio-005',
    content: 'Drug A-999 PDUFA date: June 30, 2024. Adcom scheduled for June 15. Phase 3 data strong but limited patient population. Market price: 38¢ YES.',
    metadata: {
      type: 'event',
      domain: 'biotech',
      asset: 'A-999',
      timestamp: 1717200000000, // June 1, 2024
      tags: ['PDUFA', 'adcom', 'limited population']
    }
  },
  
  // === PREDICTIONS (Correct) ===
  {
    id: 'pred-bio-001',
    content: 'Predicted YES on X-305 approval. Rationale: Strong Phase 3 (94% efficacy), favorable adcom (12-1 vote), PDUFA near. Pattern match: 85% approval rate with favorable adcom. Market 42¢ undervalues this.',
    metadata: {
      type: 'prediction',
      domain: 'biotech',
      asset: 'X-305',
      timestamp: 1709424000000, // March 3, 2024
      outcome: 'correct',
      edge: 0.26,
      tags: ['YES', 'approval', 'adcom', 'undervalued']
    }
  },
  {
    id: 'pred-bio-002',
    content: 'Predicted YES on Y-102 approval. Rationale: Phase 3 topline p<0.001 with 89% efficacy matches pattern of 80%+ approval probability. Market initial 35¢ response underreacts.',
    metadata: {
      type: 'prediction',
      domain: 'biotech',
      asset: 'Y-102',
      timestamp: 1712016000000, // April 2, 2024
      outcome: 'correct',
      edge: 0.18,
      tags: ['YES', 'Phase 3', 'topline', 'underreaction']
    }
  },
  {
    id: 'pred-bio-003',
    content: 'Predicted YES on W-221 approval. Rationale: Orphan drug status, fast track designation, small patient population but unmet need. Historical 75% approval for similar profile.',
    metadata: {
      type: 'prediction',
      domain: 'biotech',
      asset: 'W-221',
      timestamp: 1714608000000, // May 2, 2024
      outcome: 'correct',
      edge: 0.22,
      tags: ['YES', 'orphan', 'fast track']
    }
  },
  {
    id: 'pred-bio-004',
    content: 'Predicted YES on V-188 approval. Rationale: Biosimilar with demonstrated equivalence, no immunogenicity concerns. 90%+ approval rate for approved biosimilars.',
    metadata: {
      type: 'prediction',
      domain: 'biotech',
      asset: 'V-188',
      timestamp: 1717200000000, // June 1, 2024
      outcome: 'correct',
      edge: 0.15,
      tags: ['YES', 'biosimilar', 'equivalence']
    }
  },
  
  // === PREDICTIONS (Incorrect) ===
  {
    id: 'pred-bio-005',
    content: 'Predicted NO on Z-440 approval. Rationale: Mixed Phase 2b, safety concerns, discontinuation rate high. Thought FDA would require additional trial.',
    metadata: {
      type: 'prediction',
      domain: 'biotech',
      asset: 'Z-440',
      timestamp: 1714608000000, // May 2, 2024
      outcome: 'incorrect',
      edge: -0.15,
      tags: ['NO', 'safety', 'mixed data']
    }
  },
  {
    id: 'pred-bio-006',
    content: 'Predicted NO on T-775 approval. Rationale: Small sample size, single-arm trial, questionable statistical significance. Surprised by approval.',
    metadata: {
      type: 'prediction',
      domain: 'biotech',
      asset: 'T-775',
      timestamp: 1719792000000, // July 1, 2024
      outcome: 'incorrect',
      edge: -0.12,
      tags: ['NO', 'small sample', 'surprise']
    }
  },
  
  // === OUTCOMES ===
  {
    id: 'outcome-bio-001',
    content: 'X-305 approved by FDA on March 15, 2024. Price moved from 42¢ to 100¢. Bruce prediction correct with 26% edge.',
    metadata: {
      type: 'outcome',
      domain: 'biotech',
      asset: 'X-305',
      timestamp: 1710460800000, // March 15, 2024
      outcome: 'correct',
      edge: 0.26,
      tags: ['approved', 'correct prediction']
    }
  },
  {
    id: 'outcome-bio-002',
    content: 'Y-102 approved by FDA April 30, 2024. Price moved from 35¢ to 95¢ post-topline. Bruce prediction correct with 18% edge.',
    metadata: {
      type: 'outcome',
      domain: 'biotech',
      asset: 'Y-102',
      timestamp: 1714521600000,
      outcome: 'correct',
      edge: 0.18,
      tags: ['approved', 'correct prediction']
    }
  },
  {
    id: 'outcome-bio-003',
    content: 'Z-440 received Complete Response Letter May 30, 2024. FDA requested additional safety data. Bruce predicted NO but it was rejected. Prediction incorrect.',
    metadata: {
      type: 'outcome',
      domain: 'biotech',
      asset: 'Z-440',
      timestamp: 1717027200000,
      outcome: 'incorrect',
      edge: -0.15,
      tags: ['CRL', 'rejected', 'incorrect prediction']
    }
  }
];

// Test query for biotech
export const biotechTestQuery = {
  asset: 'A-999',
  priceMove: { magnitude: 0.02, timeframe: '24h' },
  domain: 'biotech' as const,
  currentMarketPrice: 0.38,
  externalEvents: [
    {
      type: 'adcom',
      description: 'FDA Advisory Committee voted 11-2 in favor',
      timestamp: Date.now(),
      significance: 0.9
    },
    {
      type: 'pdufa',
      description: 'PDUFA date in 5 days',
      timestamp: Date.now() + 5 * 24 * 60 * 60 * 1000,
      significance: 0.8
    }
  ]
};
