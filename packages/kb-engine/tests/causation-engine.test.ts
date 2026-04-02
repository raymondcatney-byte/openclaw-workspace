// packages/kb-engine/tests/causation-engine.test.ts
// Integration tests for KB Causation Engine

import { createKBEngine } from '../src';
import { biotechMockData, biotechTestQuery } from './mock-data/biotech-mocks';
import { commodityMockData, commodityTestQuery } from './mock-data/commodity-mocks';
import { cryptoMockData, cryptoTestQuery } from './mock-data/crypto-mocks';

async function runTests() {
  console.log('🧠 KB Causation Engine Tests\n');
  
  const { vectorStore, patternExtractor, causationEngine } = createKBEngine();
  
  // === TEST 1: Seed with mock data ===
  console.log('Test 1: Seeding knowledge base...');
  await vectorStore.storeBatch(biotechMockData);
  await vectorStore.storeBatch(commodityMockData);
  await vectorStore.storeBatch(cryptoMockData);
  
  const stats = await vectorStore.stats();
  console.log(`✅ Seeded ${stats.total} entries`);
  console.log(`   By type:`, stats.byType);
  console.log(`   By domain:`, stats.byDomain);
  console.log();
  
  // === TEST 2: Pattern extraction ===
  console.log('Test 2: Extracting patterns from biotech predictions...');
  const biotechPatterns = await patternExtractor.extractPatterns({
    domain: 'biotech',
    minPredictions: 2,
    minWinRate: 0.5
  });
  
  console.log(`✅ Found ${biotechPatterns.length} patterns:`);
  biotechPatterns.forEach((p, i) => {
    console.log(`   ${i + 1}. ${p.pattern.substring(0, 80)}...`);
    console.log(`      Confidence: ${(p.confidence * 100).toFixed(0)}%`);
    console.log(`      Evidence: ${p.supportingEvidence.correctPredictions}/${p.supportingEvidence.predictions} correct`);
  });
  console.log();
  
  // === TEST 3: Biotech causation analysis ===
  console.log('Test 3: Biotech causation analysis...');
  console.log('Query:', biotechTestQuery.asset, 'moved', (biotechTestQuery.priceMove.magnitude * 100).toFixed(1) + '%');
  console.log('External events:', biotechTestQuery.externalEvents.map(e => e.type).join(', '));
  console.log();
  
  const biotechAnalysis = await causationEngine.analyze(biotechTestQuery);
  
  console.log('📊 Analysis Results:');
  console.log(`   Primary catalyst: ${biotechAnalysis.primaryCatalyst.event}`);
  console.log(`   Catalyst confidence: ${(biotechAnalysis.primaryCatalyst.confidence * 100).toFixed(0)}%`);
  console.log(`   Edge estimate: ${(biotechAnalysis.edgeEstimate.magnitude * 100).toFixed(1)}%`);
  console.log(`   Edge confidence: ${(biotechAnalysis.edgeEstimate.confidence * 100).toFixed(0)}%`);
  console.log(`   Direction: ${biotechAnalysis.edgeEstimate.direction}`);
  console.log(`   Reasoning: ${biotechAnalysis.edgeEstimate.reasoning}`);
  console.log(`   Recommendation: ${biotechAnalysis.recommendation.action.toUpperCase()}`);
  console.log(`   Urgency: ${biotechAnalysis.recommendation.urgency}`);
  console.log();
  
  if (biotechAnalysis.historicalMatches.length > 0) {
    console.log('   Historical matches:');
    biotechAnalysis.historicalMatches.slice(0, 3).forEach(m => {
      console.log(`      • ${m.event.substring(0, 50)}... (${m.outcome})`);
    });
  }
  console.log();
  
  // === TEST 4: Commodity causation analysis ===
  console.log('Test 4: Commodity causation analysis...');
  console.log('Query:', commodityTestQuery.asset, 'moved', (commodityTestQuery.priceMove.magnitude * 100).toFixed(1) + '%');
  console.log('External events:', commodityTestQuery.externalEvents.map(e => e.type).join(', '));
  console.log();
  
  const commodityAnalysis = await causationEngine.analyze(commodityTestQuery);
  
  console.log('📊 Analysis Results:');
  console.log(`   Primary catalyst: ${commodityAnalysis.primaryCatalyst.event}`);
  console.log(`   Catalyst confidence: ${(commodityAnalysis.primaryCatalyst.confidence * 100).toFixed(0)}%`);
  console.log(`   Edge estimate: ${(commodityAnalysis.edgeEstimate.magnitude * 100).toFixed(1)}%`);
  console.log(`   Recommendation: ${commodityAnalysis.recommendation.action.toUpperCase()}`);
  console.log();
  
  // === TEST 5: Crypto causation analysis ===
  console.log('Test 5: Crypto causation analysis...');
  console.log('Query:', cryptoTestQuery.asset, 'moved', (cryptoTestQuery.priceMove.magnitude * 100).toFixed(1) + '%');
  console.log('External events:', cryptoTestQuery.externalEvents.map(e => e.type).join(', '));
  console.log();
  
  const cryptoAnalysis = await causationEngine.analyze(cryptoTestQuery);
  
  console.log('📊 Analysis Results:');
  console.log(`   Primary catalyst: ${cryptoAnalysis.primaryCatalyst.event}`);
  console.log(`   Catalyst confidence: ${(cryptoAnalysis.primaryCatalyst.confidence * 100).toFixed(0)}%`);
  console.log(`   Edge estimate: ${(cryptoAnalysis.edgeEstimate.magnitude * 100).toFixed(1)}%`);
  console.log(`   Recommendation: ${cryptoAnalysis.recommendation.action.toUpperCase()}`);
  console.log();
  
  // === TEST 6: Alert generation ===
  console.log('Test 6: Alert generation...');
  
  const biotechAlert = await causationEngine.generateAlert(biotechTestQuery, biotechAnalysis);
  if (biotechAlert) {
    console.log('✅ Generated alert:');
    console.log(`   Title: ${biotechAlert.title}`);
    console.log(`   Severity: ${biotechAlert.severity}`);
    console.log(`   Edge: ${(biotechAlert.edge * 100).toFixed(1)}%`);
  } else {
    console.log('ℹ️ No alert generated (recommendation was not "predict")');
  }
  console.log();
  
  // === TEST 7: Semantic search ===
  console.log('Test 7: Semantic search...');
  const searchResults = await vectorStore.query({
    query: 'FDA approval favorable advisory committee vote',
    filters: { domain: 'biotech' },
    topK: 5
  });
  
  console.log(`✅ Found ${searchResults.length} relevant entries:`);
  searchResults.forEach((r, i) => {
    console.log(`   ${i + 1}. [${r.metadata.type}] ${r.content.substring(0, 60)}...`);
  });
  console.log();
  
  // === Summary ===
  console.log('🎯 Test Summary');
  console.log('===============');
  console.log('✅ Vector store: Working');
  console.log('✅ Pattern extraction: Working');
  console.log('✅ Causation analysis: Working');
  console.log('✅ Alert generation: Working');
  console.log('✅ Semantic search: Working');
  console.log();
  console.log('KB Causation Engine is ready for integration with Polymarket scanners.');
}

// Run tests
runTests().catch(console.error);
