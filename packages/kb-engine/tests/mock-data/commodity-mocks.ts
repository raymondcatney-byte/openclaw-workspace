// packages/kb-engine/tests/mock-data/commodity-mocks.ts
// Mock commodity data for testing KB engine

import { KBEntry } from '../../src/types';

export const commodityMockData: KBEntry[] = [
  // === PATTERNS ===
  {
    id: 'pattern-comm-001',
    content: 'EIA crude oil inventory draws larger than 3M barrels vs consensus typically result in 6-8% price move over 48 hours. Market underreacts in first 4 hours by 40-50%.',
    metadata: {
      type: 'pattern',
      domain: 'commodities',
      asset: 'crude_oil',
      timestamp: 1704067200000,
      tags: ['EIA', 'inventory', 'draw', 'underreaction']
    }
  },
  {
    id: 'pattern-comm-002',
    content: 'Strait of Hormuz shipping disruptions lasting more than 48 hours result in 8-12% Brent premium. Market initially prices generic risk-on, not specific supply threat.',
    metadata: {
      type: 'pattern',
      domain: 'commodities',
      asset: 'brent',
      timestamp: 1704153600000,
      tags: ['Strait of Hormuz', 'supply disruption', 'premium']
    }
  },
  {
    id: 'pattern-comm-003',
    content: 'Drought conditions during wheat flowering stage (May-June) in Kansas/Oklahoma lead to 15-25% price impact if sustained 14+ days. USDA reports lag actual conditions by 7-10 days.',
    metadata: {
      type: 'pattern',
      domain: 'commodities',
      asset: 'wheat',
      timestamp: 1704240000000,
      tags: ['drought', 'wheat', 'flowering', 'USDA lag']
    }
  },
  {
    id: 'pattern-comm-004',
    content: 'Large ETF inflows + flat price = supply absorption pattern. 70% chance of delayed breakout within 48 hours. Typical move: +8-12% once selling pressure exhausted.',
    metadata: {
      type: 'pattern',
      domain: 'commodities',
      asset: 'gold',
      timestamp: 1704326400000,
      tags: ['ETF', 'inflows', 'absorption', 'breakout']
    }
  },
  
  // === EVENTS ===
  {
    id: 'event-comm-001',
    content: 'EIA weekly petroleum status report: Crude oil inventory draw of 4.2M barrels vs consensus estimate of 1.5M. Cushing stocks at 6-month low.',
    metadata: {
      type: 'event',
      domain: 'commodities',
      asset: 'wti',
      timestamp: 1711929600000, // April 1, 2024
      tags: ['EIA', 'inventory', 'draw', 'surprise']
    }
  },
  {
    id: 'event-comm-002',
    content: 'Two tankers delayed at Strait of Hormuz due to reported drone activity. Shipping rates spike 15%. Incident ongoing 36+ hours.',
    metadata: {
      type: 'event',
      domain: 'commodities',
      asset: 'brent',
      timestamp: 1714521600000, // May 1, 2024
      tags: ['Strait of Hormuz', 'tanker', 'delay', 'drone']
    }
  },
  {
    id: 'event-comm-003',
    content: 'USDA crop progress report: Kansas wheat crop condition rated 42% poor/very poor vs 28% last year. Drought expanding in western Kansas.',
    metadata: {
      type: 'event',
      domain: 'commodities',
      asset: 'wheat',
      timestamp: 1717200000000, // June 1, 2024
      tags: ['USDA', 'wheat', 'drought', 'Kansas']
    }
  },
  {
    id: 'event-comm-004',
    content: 'Gold ETF (GLD) sees $890M inflow over 3 days. Largest inflow since March 2024. Gold price barely moved +1.2% despite inflows.',
    metadata: {
      type: 'event',
      domain: 'commodities',
      asset: 'gold',
      timestamp: 1719792000000, // July 1, 2024
      tags: ['ETF', 'inflow', 'GLD', 'absorption']
    }
  },
  {
    id: 'event-comm-005',
    content: 'Copper inventories at LME fall to 18-year low. Chinese stimulus rumors circulating. Price up 3% but inventories suggest more upside.',
    metadata: {
      type: 'event',
      domain: 'commodities',
      asset: 'copper',
      timestamp: 1722470400000, // Aug 1, 2024
      tags: ['LME', 'inventory', 'copper', 'China']
    }
  },
  
  // === PREDICTIONS (Correct) ===
  {
    id: 'pred-comm-001',
    content: 'Predicted WTI continues up post-EIA. Rationale: 4.2M draw vs 1.5M expected = large surprise. Pattern: 6-8% move over 48h. Market only +2.3% in first 4h = underreaction.',
    metadata: {
      type: 'prediction',
      domain: 'commodities',
      asset: 'wti',
      timestamp: 1712016000000, // April 2, 2024
      outcome: 'correct',
      edge: 0.045,
      tags: ['up', 'EIA', 'underreaction', 'inventory']
    }
  },
  {
    id: 'pred-comm-002',
    content: 'Predicted Brent premium expands. Rationale: Hormuz delay 36h+ matches pattern for 8-12% premium. Market pricing generic risk, not specific threat.',
    metadata: {
      type: 'prediction',
      domain: 'commodities',
      asset: 'brent',
      timestamp: 1714608000000, // May 2, 2024
      outcome: 'correct',
      edge: 0.065,
      tags: ['up', 'Hormuz', 'supply disruption']
    }
  },
  {
    id: 'pred-comm-003',
    content: 'Predicted gold breakout within 48h. Rationale: $890M ETF inflows with flat price = absorption pattern. 70% historical breakout rate.',
    metadata: {
      type: 'prediction',
      domain: 'commodities',
      asset: 'gold',
      timestamp: 1719888000000, // July 2, 2024
      outcome: 'correct',
      edge: 0.095,
      tags: ['up', 'ETF', 'absorption', 'breakout']
    }
  },
  {
    id: 'pred-comm-004',
    content: 'Predicted wheat price surge. Rationale: Drought at flowering + USDA lag = 15-25% impact pattern. Market not yet pricing severity.',
    metadata: {
      type: 'prediction',
      domain: 'commodities',
      asset: 'wheat',
      timestamp: 1717286400000, // June 2, 2024
      outcome: 'correct',
      edge: 0.12,
      tags: ['up', 'drought', 'USDA lag', 'wheat']
    }
  },
  
  // === PREDICTIONS (Incorrect) ===
  {
    id: 'pred-comm-005',
    content: 'Predicted copper rally on Chinese stimulus. Rationale: Inventory lows + stimulus rumors typically bullish. Stimulus did not materialize.',
    metadata: {
      type: 'prediction',
      domain: 'commodities',
      asset: 'copper',
      timestamp: 1722556800000, // Aug 2, 2024
      outcome: 'incorrect',
      edge: -0.04,
      tags: ['up', 'copper', 'China', 'stimulus']
    }
  },
  {
    id: 'pred-comm-006',
    content: 'Predicted natural gas spike on hurricane threat. Rationale: Gulf production at risk. Hurricane veered away, no impact.',
    metadata: {
      type: 'prediction',
      domain: 'commodities',
      asset: 'natural_gas',
      timestamp: 1725148800000, // Sept 1, 2024
      outcome: 'incorrect',
      edge: -0.06,
      tags: ['up', 'hurricane', 'Gulf', 'weather']
    }
  },
  
  // === OUTCOMES ===
  {
    id: 'outcome-comm-001',
    content: 'WTI rose from $78 to $82.50 over 48h post-EIA report. Correct prediction with 4.5% additional edge captured.',
    metadata: {
      type: 'outcome',
      domain: 'commodities',
      asset: 'wti',
      timestamp: 1712284800000,
      outcome: 'correct',
      edge: 0.045
    }
  },
  {
    id: 'outcome-comm-002',
    content: 'Brent premium expanded +6.5% over 3 days during Hormuz delays. Correct prediction.',
    metadata: {
      type: 'outcome',
      domain: 'commodities',
      asset: 'brent',
      timestamp: 1714953600000,
      outcome: 'correct',
      edge: 0.065
    }
  },
  {
    id: 'outcome-comm-003',
    content: 'Gold broke out +9.5% within 48h of ETF absorption signal. Correct prediction with strong edge.',
    metadata: {
      type: 'outcome',
      domain: 'commodities',
      asset: 'gold',
      timestamp: 1720137600000,
      outcome: 'correct',
      edge: 0.095
    }
  },
  {
    id: 'outcome-comm-004',
    content: 'Copper flat after stimulus rumors faded. Incorrect prediction. Lesson: Wait for confirmation before trading rumors.',
    metadata: {
      type: 'outcome',
      domain: 'commodities',
      asset: 'copper',
      timestamp: 1722816000000,
      outcome: 'incorrect',
      edge: -0.04
    }
  }
];

// Test query for commodities
export const commodityTestQuery = {
  asset: 'wti',
  priceMove: { magnitude: 0.023, timeframe: '4h' },
  domain: 'commodities' as const,
  currentMarketPrice: 0.42,
  externalEvents: [
    {
      type: 'EIA_inventory',
      description: 'Weekly crude draw -5.1M barrels vs -2.0M expected',
      timestamp: Date.now(),
      significance: 0.9
    },
    {
      type: 'Cushing',
      description: 'Cushing stocks at 8-month low',
      timestamp: Date.now(),
      significance: 0.7
    }
  ]
};
