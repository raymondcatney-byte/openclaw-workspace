import 'dotenv/config';
import { getActiveMarkets } from '../data/polymarket.js';
import { getNewsForQuery, analyzeSentiment } from '../data/news.js';
import { simulateAgentOpinions } from '../agents/engine.js';
import { generateConsensus, validateConsensus } from '../consensus/engine.js';
import { generatePosition } from '../execution/kelly.js';
import { db, initDatabase } from '../database/index.js';
import { predictions } from '../database/schema.js';
import { Market, MarketContext, Consensus, Position, ScanResult, MarketScanResult } from '../types/index.js';

const CONFIG = {
  minLiquidity: parseInt(process.env.MIN_LIQUIDITY || '10000'),
  maxMarketsPerRun: parseInt(process.env.MAX_MARKETS_PER_RUN || '20'),
  categories: (process.env.CATEGORIES || 'politics,crypto').split(','),
  paperBankroll: parseInt(process.env.PAPER_BANKROLL || '10000'),
  kellyFraction: parseFloat(process.env.KELLY_FRACTION || '0.25'),
  minEdge: parseFloat(process.env.MIN_EDGE || '0.05'),
  minConfidence: parseFloat(process.env.MIN_CONFIDENCE || '0.30'),
  agentCount: parseInt(process.env.AGENT_COUNT || '50'),
  dryRun: process.env.DRY_RUN === 'true',
};

async function analyzeMarket(market: Market): Promise<MarketScanResult> {
  const startTime = Date.now();
  
  console.log(`\n📊 ${market.question.slice(0, 70)}...`);
  console.log(`   Market: ${(market.outcomePrices.yes * 100).toFixed(1)}¢ Yes / $${market.liquidity.toLocaleString()} liquidity`);
  
  // Build context
  const news = await getNewsForQuery(market.question);
  const context: MarketContext = {
    market,
    news,
    sentiment: analyzeSentiment(news),
    timestamp: new Date(),
  };
  
  // Generate agent opinions
  const opinions = await simulateAgentOpinions(context, CONFIG.agentCount);
  const agentTime = Date.now() - startTime;
  
  // Generate consensus
  const consensus = generateConsensus(market.id, opinions, agentTime);
  console.log(`   Consensus: ${(consensus.probability * 100).toFixed(1)}% (confidence: ${(consensus.confidence * 100).toFixed(1)}%)`);
  
  // Validate
  const validation = validateConsensus(consensus);
  if (validation.recommendation === 'reject') {
    console.log(`   ❌ Rejected: ${validation.issues.join(', ')}`);
    return { market, consensus, position: null, reason: validation.issues.join(', ') };
  }
  if (validation.recommendation === 'caution') {
    console.log(`   ⚠️  Caution: ${validation.issues.join(', ')}`);
  }
  
  // Generate position
  const position = generatePosition(market, consensus, CONFIG.paperBankroll, {
    kellyFraction: CONFIG.kellyFraction,
    minEdge: CONFIG.minEdge,
    minConfidence: CONFIG.minConfidence,
  });
  
  // Log to database (unless dry run)
  if (!CONFIG.dryRun) {
    await db.insert(predictions).values({
      id: `pred-${Date.now()}-${market.id.slice(0, 8)}`,
      timestamp: new Date(),
      marketId: market.id,
      marketSlug: market.slug,
      marketQuestion: market.question,
      marketCategory: market.category,
      consensusProbability: consensus.probability,
      consensusConfidence: consensus.confidence,
      agentCount: consensus.agentCount,
      simulationTimeMs: consensus.simulationTimeMs,
      marketPriceYes: market.outcomePrices.yes,
      marketPriceNo: market.outcomePrices.no,
      marketVolume: market.volume,
      edge: position?.edge || Math.abs(consensus.probability - market.outcomePrices.yes),
      edgeDirection: consensus.probability > market.outcomePrices.yes ? 'yes' : 'no',
      recommendedDirection: position?.direction || 'skip',
      recommendedSize: position?.size || 0,
      kellyFraction: position?.kellyFraction || 0,
      agentOpinionsJson: JSON.stringify(opinions.slice(0, 10)), // Store subset
      consensusClustersJson: JSON.stringify(consensus.clusters),
    });
  }
  
  if (position) {
    console.log(`   ✅ POSITION: ${position.direction.toUpperCase()} $${position.size.toFixed(2)} @ ${(position.entryPrice * 100).toFixed(1)}¢ (edge: ${(position.edge * 100).toFixed(1)}%)`);
  } else {
    console.log(`   ⏭️  No position: ${validation.issues.length > 0 ? validation.issues[0] : 'No edge detected'}`);
  }
  
  return {
    market,
    consensus,
    position,
    reason: position ? 'Edge detected' : 'No tradeable edge',
  };
}

async function runDailyScan(): Promise<ScanResult> {
  console.log('🔮 MIROFISH DAILY SCAN');
  console.log('======================');
  console.log(`Config: ${CONFIG.agentCount} agents, $${CONFIG.paperBankroll} bankroll, ${CONFIG.kellyFraction} Kelly`);
  console.log(`Mode: ${CONFIG.dryRun ? 'DRY RUN' : 'LIVE'}`);
  
  const startTime = Date.now();
  
  // Init database
  await initDatabase();
  
  // Get markets
  console.log('\n📈 Fetching markets...');
  const markets = await getActiveMarkets({
    minLiquidity: CONFIG.minLiquidity,
    maxMarkets: CONFIG.maxMarketsPerRun,
    categories: CONFIG.categories,
  });
  
  console.log(`Found ${markets.length} markets`);
  
  // Analyze each
  const results: MarketScanResult[] = [];
  
  for (let i = 0; i < markets.length; i++) {
    console.log(`\n[${i + 1}/${markets.length}]`);
    try {
      const result = await analyzeMarket(markets[i]);
      results.push(result);
    } catch (error) {
      console.error(`   💥 Error: ${error}`);
      results.push({
        market: markets[i],
        position: null,
        reason: `Error: ${error}`,
        error: String(error),
      });
    }
  }
  
  // Summary
  const scanTime = Date.now() - startTime;
  const positions = results.filter(r => r.position).map(r => r.position!);
  const totalSize = positions.reduce((sum, p) => sum + p.size, 0);
  
  console.log('\n📊 SCAN COMPLETE');
  console.log('=================');
  console.log(`Markets analyzed: ${markets.length}`);
  console.log(`Positions: ${positions.length}`);
  console.log(`Total exposure: $${totalSize.toFixed(2)}`);
  console.log(`Time: ${(scanTime / 1000).toFixed(1)}s`);
  console.log(`Est. cost: $${(results.length * CONFIG.agentCount * 0.00042).toFixed(3)}`);
  
  if (positions.length > 0) {
    console.log('\n🎯 RECOMMENDED POSITIONS:');
    positions.forEach(p => {
      console.log(`  ${p.direction.toUpperCase()} $${p.size.toFixed(0)} | Edge: ${(p.edge * 100).toFixed(1)}%`);
    });
  }
  
  return {
    timestamp: new Date(),
    scanTimeMs: scanTime,
    marketsAnalyzed: markets.length,
    positionsRecommended: positions.length,
    totalRecommendedSize: totalSize,
    positions,
    skipped: results.filter(r => !r.position && !r.error).length,
    errors: results.filter(r => r.error).length,
    estimatedCost: results.length * CONFIG.agentCount * 0.00042,
  };
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDailyScan()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

export { runDailyScan };
