#!/usr/bin/env node
/**
 * Polymarket Unusual Activity Detector
 * Monitors 7 sectors for volume/price anomalies
 */

const CLOB_API = 'https://clob.polymarket.com';
const GAMMA_API = 'https://gamma-api.polymarket.com';

// Your 7 sectors with keywords to classify markets
const SECTORS = {
  GEOPOLITICS: ['war', 'israel', 'iran', 'ukraine', 'russia', 'china', 'taiwan', 'election', 'nato', 'sanction', 'invasion', 'ceasefire', 'treaty', 'diplomatic', 'embassy', 'terror', 'attack', 'military', 'defense', 'border'],
  AI: ['agi', 'ai ', 'gpt', 'llm', 'openai', 'anthropic', 'deepmind', 'model', 'alignment', 'safety', 'regulation', 'artificial intelligence', 'machine learning', 'neural', 'compute', 'data center', 'training'],
  DEFI: ['hack', 'exploit', 'defi', 'protocol', 'smart contract', 'dex', 'lending', 'stablecoin', 'sec', 'regulation', 'coinbase', 'binance', 'liquidation', 'oracle', 'bridge', 'token'],
  COMMODITIES: ['gold', 'silver', 'copper', 'wheat', 'corn', 'soy', 'supply chain', 'shortage', 'inventory', 'warehouse', 'agriculture', 'grain', 'metal', 'lme', 'comex'],
  ENERGY: ['oil', 'gas', 'opec', 'pipeline', 'refinery', 'nuclear', 'electricity', 'power grid', 'lng', 'crude', 'brent', 'wti', 'saudi', 'iran oil', 'gazprom', 'shale', 'drilling', 'storage', 'eia'],
  BIOTECH: ['fda', 'trial', 'drug', 'vaccine', 'pandemic', 'approval', 'pdufa', 'clinical', 'biotech', 'pharma', 'moderna', 'pfizer', 'astrazeneca', 'gene', 'therapy', 'antibody', 'pathogen'],
  MACRO: ['fed', 'cpi', 'inflation', 'unemployment', 'recession', 'interest rate', 'gdp', 'treasury', 'yield', 'dollar', 'fomc', 'powell', 'nomination', 'debt ceiling', 'government shutdown', 'jobless', 'nfp']
};

// Detection thresholds
const THRESHOLDS = {
  VOLUME_Z_SCORE: 2.5,      // 2.5 standard deviations above mean
  PRICE_CHANGE_1H: 0.10,    // 10% price move in 1 hour
  PRICE_CHANGE_24H: 0.20,   // 20% price move in 24 hours
  MIN_LIQUIDITY: 5000,      // Ignore markets below $5k liquidity
  MIN_VOLUME: 1000          // Ignore markets below $1k daily volume
};

// Store historical data for baseline (in-memory, resets on restart)
const marketHistory = new Map(); // marketId -> { prices: [], volumes: [], timestamps: [] }

function classifySector(question) {
  const q = question.toLowerCase();
  for (const [sector, keywords] of Object.entries(SECTORS)) {
    if (keywords.some(kw => q.includes(kw))) {
      return sector;
    }
  }
  return 'OTHER';
}

async function fetchMarkets() {
  try {
    // Get active markets from Gamma API
    const response = await fetch(`${GAMMA_API}/markets?active=true&closed=false&limit=500`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('❌ Failed to fetch markets:', error.message);
    return [];
  }
}

async function fetchMarketData(marketId) {
  try {
    // Get order book and recent trades
    const [bookRes, tradesRes] = await Promise.all([
      fetch(`${CLOB_API}/book/${marketId}`),
      fetch(`${CLOB_API}/trades?market=${marketId}&limit=100`)
    ]);
    
    const book = bookRes.ok ? await bookRes.json() : null;
    const trades = tradesRes.ok ? await tradesRes.json() : { trades: [] };
    
    return { book, trades: trades.trades || [] };
  } catch (error) {
    return { book: null, trades: [] };
  }
}

function calculateZScore(current, history) {
  if (history.length < 10) return 0;
  
  const mean = history.reduce((a, b) => a + b, 0) / history.length;
  const variance = history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / history.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  return (current - mean) / stdDev;
}

function calculatePriceChange(currentPrice, history) {
  if (history.length < 2) return { change1h: 0, change24h: 0 };
  
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
  
  // Find price 1 hour ago (closest timestamp)
  const price1h = history.findLast((h, i) => {
    const ts = marketHistory.timestamps?.[i];
    return ts && ts < oneHourAgo;
  }) || history[history.length - 1];
  
  // Find price 24 hours ago
  const price24h = history.find((h, i) => {
    const ts = marketHistory.timestamps?.[i];
    return ts && ts > twentyFourHoursAgo;
  }) || history[0];
  
  return {
    change1h: (currentPrice - price1h) / price1h,
    change24h: (currentPrice - price24h) / price24h
  };
}

function updateHistory(marketId, price, volume) {
  if (!marketHistory.has(marketId)) {
    marketHistory.set(marketId, { 
      prices: [], 
      volumes: [], 
      timestamps: [],
      lastAlert: 0 
    });
  }
  
  const hist = marketHistory.get(marketId);
  hist.prices.push(price);
  hist.volumes.push(volume);
  hist.timestamps.push(Date.now());
  
  // Keep last 7 days of data (assuming 30s intervals = ~20k points)
  if (hist.prices.length > 20000) {
    hist.prices.shift();
    hist.volumes.shift();
    hist.timestamps.shift();
  }
}

function shouldAlert(marketId) {
  const hist = marketHistory.get(marketId);
  if (!hist) return true;
  
  // Rate limit: max 1 alert per 30 minutes per market
  const now = Date.now();
  if (now - hist.lastAlert < 30 * 60 * 1000) return false;
  
  hist.lastAlert = now;
  return true;
}

function formatAlert(market, sector, signals) {
  const now = new Date().toLocaleTimeString();
  const signalStr = signals.map(s => {
    if (s.type === 'VOLUME_SPIKE') return `📊 Volume +${s.zScore.toFixed(1)}σ`;
    if (s.type === 'PRICE_MOVE_1H') return `📈 ${s.change > 0 ? '+' : ''}${(s.change * 100).toFixed(1)}% (1h)`;
    if (s.type === 'PRICE_MOVE_24H') return `📈 ${s.change > 0 ? '+' : ''}${(s.change * 100).toFixed(1)}% (24h)`;
    return s.type;
  }).join(' | ');
  
  const severity = signals.length >= 3 ? '🔥' : signals.length === 2 ? '⚡' : '⚠️';
  const score = Math.min(100, signals.reduce((sum, s) => sum + (s.score || 30), 0));
  
  return `
${severity} [${now}] ${sector} (${score}/100)
   Market: ${market.question.substring(0, 70)}${market.question.length > 70 ? '...' : ''}
   Signals: ${signalStr}
   Price: $${market.yesPrice?.toFixed(3) || '?'} | Volume: $${(market.volume || 0).toLocaleString()}
   Link: https://polymarket.com/event/${market.slug || market.condition_id}
`;
}

async function scan() {
  console.clear();
  console.log('🔍 Polymarket Anomaly Scanner');
  console.log('Sectors:', Object.keys(SECTORS).join(', '));
  console.log('Press Ctrl+C to stop\n');
  
  const markets = await fetchMarkets();
  console.log(`Fetched ${markets.length} active markets\n`);
  
  const alerts = [];
  
  for (const market of markets) {
    // Skip low liquidity/volume markets
    if ((market.liquidity || 0) < THRESHOLDS.MIN_LIQUIDITY) continue;
    if ((market.volume || 0) < THRESHOLDS.MIN_VOLUME) continue;
    
    // Classify sector
    const sector = classifySector(market.question);
    if (sector === 'OTHER') continue; // Skip unclassified markets
    
    // Get current price
    const yesToken = market.tokens?.find(t => t.outcome === 'Yes');
    const currentPrice = parseFloat(yesToken?.price || 0);
    const currentVolume = parseFloat(market.volume || 0);
    
    if (currentPrice === 0) continue;
    
    // Update history
    updateHistory(market.condition_id, currentPrice, currentVolume);
    const hist = marketHistory.get(market.condition_id);
    
    // Detect signals
    const signals = [];
    
    // 1. Volume spike detection
    const volumeZScore = calculateZScore(currentVolume, hist.volumes.slice(-100));
    if (volumeZScore > THRESHOLDS.VOLUME_Z_SCORE) {
      signals.push({ type: 'VOLUME_SPIKE', zScore: volumeZScore, score: Math.min(50, volumeZScore * 10) });
    }
    
    // 2. Price movement detection
    const { change1h, change24h } = calculatePriceChange(currentPrice, hist.prices);
    
    if (Math.abs(change1h) > THRESHOLDS.PRICE_CHANGE_1H) {
      signals.push({ type: 'PRICE_MOVE_1H', change: change1h, score: 40 });
    }
    
    if (Math.abs(change24h) > THRESHOLDS.PRICE_CHANGE_24H) {
      signals.push({ type: 'PRICE_MOVE_24H', change: change24h, score: 30 });
    }
    
    // Alert if signals detected and not rate limited
    if (signals.length > 0 && shouldAlert(market.condition_id)) {
      alerts.push(formatAlert(market, sector, signals));
    }
  }
  
  // Print alerts
  if (alerts.length > 0) {
    alerts.forEach(alert => console.log(alert));
    console.log(`\n🚨 ${alerts.length} anomaly(s) detected\n`);
  } else {
    console.log('✓ No anomalies detected this scan\n');
  }
  
  console.log(`Last scan: ${new Date().toLocaleTimeString()} | Markets tracked: ${marketHistory.size}`);
}

// Run immediately, then every 30 seconds
scan();
setInterval(scan, 30000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping scanner...');
  process.exit(0);
});
