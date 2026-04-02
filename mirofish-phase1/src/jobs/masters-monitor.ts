#!/usr/bin/env node
/**
 * Masters Price Monitor
 * Tracks Polymarket odds vs Model predictions daily
 * Alerts on significant price movements or value changes
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Configuration
const CONFIG = {
  dataFile: './masters_comprehensive_data.json',
  historyFile: './masters_price_history.json',
  alertThresholds: {
    edgeChange: 2.0,        // Alert if edge changes by 2%+
    priceDrift: 0.015,      // Alert if price moves 1.5¢+
    newStrongBuy: true,     // Alert if player becomes STRONG BUY
    newStrongFade: true,    // Alert if player becomes STRONG FADE
  },
  portfolio: [
    { name: 'Hideki Matsuyama', targetEdge: 5.0 },
    { name: 'Jordan Spieth', targetEdge: 4.0 },
    { name: 'Will Zalatoris', targetEdge: 3.0 },
    { name: 'Jon Rahm', targetEdge: 2.0 },
    { name: 'Brooks Koepka', targetEdge: 2.0 },
  ]
};

// Player market IDs on Polymarket
const MARKET_IDS: Record<string, string> = {
  'Scottie Scheffler': '568640',
  'Rory McIlroy': '568641',
  'Xander Schauffele': '568634',
  'Ludvig Åberg': '568635',
  'Jon Rahm': '568642',
  'Collin Morikawa': '568643',
  'Viktor Hovland': '568644',
  'Hideki Matsuyama': '568645',
  'Patrick Cantlay': '568646',
  'Brooks Koepka': '568647',
  'Bryson DeChambeau': '568648',
  'Jordan Spieth': '568649',
  'Justin Thomas': '568650',
  'Will Zalatoris': '568651',
  'Tommy Fleetwood': '568652',
  'Matt Fitzpatrick': '568653',
  'Cameron Young': '568654',
  'Sahith Theegala': '568655',
  'Shane Lowry': '568656',
  'Russell Henley': '568657',
};

interface PlayerData {
  name: string;
  model_probability: number;
  market_probability: number;
  edge: number;
  recommendation: string;
}

interface PriceSnapshot {
  timestamp: string;
  date: string;
  players: Record<string, {
    price: number;
    impliedProbability: number;
    edge: number;
    edgeChange: number;
    priceChange24h: number;
  }>;
  alerts: string[];
  summary: {
    totalVolume: number;
    totalLiquidity: number;
    avgEdge: number;
    bestValue: string;
    biggestDrift: string;
  };
}

// Simulated price fetch (replace with actual Polymarket API call)
async function fetchPolymarketPrices(): Promise<Record<string, number>> {
  // In production, this would call:
  // https://gamma-api.polymarket.com/markets/{market_id}
  
  // For now, simulate with slight variations from baseline
  const baseline: Record<string, number> = {
    'Scottie Scheffler': 0.185,
    'Rory McIlroy': 0.158,
    'Xander Schauffele': 0.098,
    'Ludvig Åberg': 0.087,
    'Jon Rahm': 0.076,
    'Collin Morikawa': 0.065,
    'Viktor Hovland': 0.054,
    'Hideki Matsuyama': 0.051,
    'Patrick Cantlay': 0.048,
    'Brooks Koepka': 0.039,
    'Bryson DeChambeau': 0.036,
    'Jordan Spieth': 0.028,
    'Justin Thomas': 0.042,
    'Will Zalatoris': 0.025,
    'Tommy Fleetwood': 0.031,
    'Matt Fitzpatrick': 0.034,
    'Cameron Young': 0.055,
    'Sahith Theegala': 0.022,
    'Shane Lowry': 0.019,
    'Russell Henley': 0.017,
  };
  
  // Add random noise to simulate market movement
  const prices: Record<string, number> = {};
  for (const [name, basePrice] of Object.entries(baseline)) {
    const noise = (Math.random() - 0.5) * 0.02; // ±1% noise
    prices[name] = Math.max(0.005, Math.min(0.35, basePrice + noise));
  }
  
  return prices;
}

// Load model data
function loadModelData(): PlayerData[] {
  const dataPath = path.join(process.cwd(), CONFIG.dataFile);
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  return data.players;
}

// Load price history
function loadPriceHistory(): PriceSnapshot[] {
  try {
    const historyPath = path.join(process.cwd(), CONFIG.historyFile);
    if (!fs.existsSync(historyPath)) return [];
    return JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
  } catch {
    return [];
  }
}

// Save price history
function savePriceHistory(history: PriceSnapshot[]) {
  const historyPath = path.join(process.cwd(), CONFIG.historyFile);
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
}

// Calculate edge change vs previous day
function calculateEdgeChange(
  currentEdge: number,
  playerName: string,
  history: PriceSnapshot[]
): number {
  if (history.length === 0) return 0;
  const yesterday = history[history.length - 1];
  const yesterdayEdge = yesterday.players[playerName]?.edge || currentEdge;
  return currentEdge - yesterdayEdge;
}

// Generate alerts
function generateAlerts(
  players: Record<string, any>,
  history: PriceSnapshot[]
): string[] {
  const alerts: string[] = [];
  
  for (const [name, data] of Object.entries(players)) {
    const edgeChange = data.edgeChange;
    const priceChange = data.priceChange24h;
    
    // Alert on significant edge improvement
    if (edgeChange >= CONFIG.alertThresholds.edgeChange) {
      alerts.push(`📈 ${name}: Edge improved by +${edgeChange.toFixed(1)}% (now ${data.edge.toFixed(1)}%)`);
    }
    
    // Alert on significant edge decline
    if (edgeChange <= -CONFIG.alertThresholds.edgeChange) {
      alerts.push(`📉 ${name}: Edge declined by ${edgeChange.toFixed(1)}% (now ${data.edge.toFixed(1)}%)`);
    }
    
    // Alert on new STRONG BUY
    if (data.edge >= 5 && data.edge - edgeChange < 5) {
      alerts.push(`🎯 ${name}: Now STRONG BUY (edge: +${data.edge.toFixed(1)}%)`);
    }
    
    // Alert on value evaporating
    if (data.edge <= -3 && data.edge - edgeChange > -3) {
      alerts.push(`⚠️  ${name}: Value gone (now ${data.edge.toFixed(1)}% edge)`);
    }
    
    // Alert on big price drift
    if (Math.abs(priceChange) >= CONFIG.alertThresholds.priceDrift) {
      const direction = priceChange > 0 ? 'up' : 'down';
      alerts.push(`💰 ${name}: Price ${direction} ${Math.abs(priceChange * 100).toFixed(1)}¢`);
    }
  }
  
  return alerts;
}

// Main monitoring function
async function runMonitor() {
  console.log('🔮 MIROFISH GOLF - MASTERS PRICE MONITOR');
  console.log('=' .repeat(50));
  console.log(`Run time: ${new Date().toISOString()}\n`);
  
  // Load data
  const modelData = loadModelData();
  const history = loadPriceHistory();
  const currentPrices = await fetchPolymarketPrices();
  
  // Build snapshot
  const snapshot: PriceSnapshot = {
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0],
    players: {},
    alerts: [],
    summary: {
      totalVolume: 45816706,
      totalLiquidity: 2130064,
      avgEdge: 0,
      bestValue: '',
      biggestDrift: '',
    }
  };
  
  let totalEdge = 0;
  let bestEdge = -999;
  let bestValuePlayer = '';
  let biggestDrift = 0;
  let biggestDriftPlayer = '';
  
  // Process each player
  for (const player of modelData) {
    const marketPrice = currentPrices[player.name] || player.market_probability / 100;
    const impliedProb = marketPrice * 100;
    const edge = player.model_probability - impliedProb;
    const edgeChange = calculateEdgeChange(edge, player.name, history);
    const priceChange24h = marketPrice - (player.market_probability / 100);
    
    snapshot.players[player.name] = {
      price: marketPrice,
      impliedProbability: impliedProb,
      edge,
      edgeChange,
      priceChange24h,
    };
    
    totalEdge += edge;
    
    if (edge > bestEdge) {
      bestEdge = edge;
      bestValuePlayer = player.name;
    }
    
    if (Math.abs(priceChange24h) > Math.abs(biggestDrift)) {
      biggestDrift = priceChange24h;
      biggestDriftPlayer = player.name;
    }
  }
  
  // Update summary
  snapshot.summary.avgEdge = totalEdge / modelData.length;
  snapshot.summary.bestValue = `${bestValuePlayer} (+${bestEdge.toFixed(1)}%)`;
  snapshot.summary.biggestDrift = `${biggestDriftPlayer} (${biggestDrift > 0 ? '+' : ''}${(biggestDrift * 100).toFixed(1)}¢)`;
  
  // Generate alerts
  snapshot.alerts = generateAlerts(snapshot.players, history);
  
  // Display results
  console.log('📊 PORTFOLIO TRACKING\n');
  console.log('Player                 | Model | Market | Edge  | Change');
  console.log('-'.repeat(65));
  
  for (const target of CONFIG.portfolio) {
    const data = snapshot.players[target.name];
    if (data) {
      const changeStr = data.edgeChange >= 0 ? `+${data.edgeChange.toFixed(1)}%` : `${data.edgeChange.toFixed(1)}%`;
      const changeEmoji = data.edgeChange >= 1 ? '📈' : data.edgeChange <= -1 ? '📉' : '➖';
      console.log(
        `${target.name.padEnd(22)} | ${target.name === 'Hideki Matsuyama' ? '12.5%' : target.name === 'Jordan Spieth' ? ' 8.6%' : target.name === 'Will Zalatoris' ? ' 6.8%' : target.name === 'Jon Rahm' ? '11.4%' : ' 7.1%'} |  ${data.impliedProbability.toFixed(1)}%  | ${data.edge >= 0 ? '+' : ''}${data.edge.toFixed(1)}% | ${changeEmoji} ${changeStr}`
      );
    }
  }
  
  console.log('\n📈 TOP VALUES TODAY\n');
  const sortedByEdge = Object.entries(snapshot.players)
    .sort((a, b) => b[1].edge - a[1].edge)
    .slice(0, 5);
  
  sortedByEdge.forEach(([name, data], i) => {
    const rec = data.edge >= 5 ? 'STRONG BUY' : data.edge >= 2 ? 'BUY' : data.edge <= -2 ? 'FADE' : 'HOLD';
    console.log(`${i + 1}. ${name}: ${data.edge >= 0 ? '+' : ''}${data.edge.toFixed(1)}% edge (${rec})`);
  });
  
  if (snapshot.alerts.length > 0) {
    console.log('\n🚨 ALERTS\n');
    snapshot.alerts.forEach(alert => console.log(alert));
  } else {
    console.log('\n✅ No significant changes today');
  }
  
  console.log('\n📋 SUMMARY\n');
  console.log(`Best value: ${snapshot.summary.bestValue}`);
  console.log(`Biggest move: ${snapshot.summary.biggestDrift}`);
  console.log(`Market avg edge: ${snapshot.summary.avgEdge >= 0 ? '+' : ''}${snapshot.summary.avgEdge.toFixed(1)}%`);
  
  // Save to history
  history.push(snapshot);
  savePriceHistory(history);
  
  console.log(`\n💾 Data saved to ${CONFIG.historyFile}`);
  console.log(`📊 ${history.length} days of history recorded`);
  
  return snapshot;
}

// Export for use in other scripts
export { runMonitor, fetchPolymarketPrices, loadModelData };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMonitor().catch(console.error);
}
