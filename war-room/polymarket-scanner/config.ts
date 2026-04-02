/**
 * Configuration for Polymarket Alpha Scanner
 */

export const config = {
  // Arbitrage settings
  arbitrage: {
    minEdge: parseFloat(process.env.MIN_ARB_EDGE || '0.005'), // 0.5% minimum
    minLiquidity: 10000, // $10k minimum liquidity
    maxMarketsToDisplay: 20,
  },

  // Whale tracking settings
  whales: {
    volumeThreshold: parseFloat(process.env.WHALE_THRESHOLD || '100000'), // $100k+
    lookbackHours: 168, // 7 days
    minTrades: 5,
  },

  // Inefficiency detection
  inefficiency: {
    mispricingThreshold: 0.15, // 15% deviation
    staleHours: 24,
    externalOddsThreshold: 0.1, // 10% difference
    lowLiquidityThreshold: 5000,
  },

  // API endpoints
  endpoints: {
    clob: 'https://clob.polymarket.com',
    gamma: 'https://gamma-api.polymarket.com',
    websocket: 'wss://ws-subscriptions-clob.polymarket.com/ws/',
  },

  // Rate limiting
  rateLimits: {
    requestsPerSecond: 10,
    maxRetries: 3,
    retryDelay: 1000,
  },

  // Display settings
  display: {
    tableWidth: 120,
    maxQuestionLength: 50,
    refreshInterval: 30, // seconds
  },
};

// Market categories and base rates for mispricing detection
export const categoryBaseRates: Record<string, number> = {
  'Sports': 0.5,
  'Politics': 0.5,
  'Crypto': 0.5,
  'Weather': 0.5,
  'Entertainment': 0.5,
  'Finance': 0.5,
  'Science': 0.5,
};

// High-signal categories (where edge is more achievable)
export const highSignalCategories = [
  'Sports',
  'Politics',
  'Crypto',
];

// Categories with external data sources for comparison
export const externallyComparableCategories = [
  'Sports',      // Compare to betting exchanges
  'Politics',    // Compare to prediction aggregators
  'Crypto',      // Compare to derivatives markets
];
