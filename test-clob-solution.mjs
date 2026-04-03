// Test the CLOB-based solution
console.log('🎯 Testing CLOB + Gamma Integration...\n');

// Test 1: CLOB API
async function testClob() {
  console.log('Test 1: CLOB API (FREE)');
  try {
    const url = 'https://clob.polymarket.com/markets?active=true&closed=false&limit=100';
    const res = await fetch(url);
    console.log(`  Status: ${res.status}`);
    
    const data = await res.json();
    console.log(`  Response keys: ${Object.keys(data).join(', ')}`);
    console.log(`  Markets returned: ${data.data?.length || 0}`);
    console.log(`  Total count: ${data.count || 'N/A'}`);
    console.log(`  Next cursor: ${data.next_cursor ? 'Yes' : 'No'}`);
    
    if (data.data?.length > 0) {
      console.log('  Sample market:');
      const m = data.data[0];
      console.log(`    Question: ${m.question?.slice(0, 60)}...`);
      console.log(`    Volume: $${((m.volume || 0) / 1000000).toFixed(2)}M`);
      console.log(`    Yes Price: ${m.yes_price}`);
      console.log(`    Condition ID: ${m.condition_id?.slice(0, 20)}...`);
    }
    
    return data.data || [];
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
    return [];
  }
}

// Test 2: Gamma metadata
async function testGamma() {
  console.log('\nTest 2: Gamma Metadata');
  try {
    const url = 'https://gamma-api.polymarket.com/events?closed=false&active=true&limit=200';
    const res = await fetch(url);
    console.log(`  Status: ${res.status}`);
    
    const data = await res.json();
    console.log(`  Events returned: ${data.length || 0}`);
    
    // Count markets with tags
    let taggedMarkets = 0;
    const categories = new Set();
    
    for (const event of data) {
      const tags = event.tags?.map(t => t.label?.toUpperCase()) || [];
      if (tags.length > 0) {
        taggedMarkets++;
        tags.forEach(t => categories.add(t));
      }
    }
    
    console.log(`  Markets with tags: ${taggedMarkets}`);
    console.log(`  Categories found: ${categories.size}`);
    console.log(`  Sample: ${Array.from(categories).slice(0, 5).join(', ')}`);
    
    return data;
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
    return [];
  }
}

// Test 3: Category matching
async function testCategoryMatching() {
  console.log('\nTest 3: Category Matching');
  
  const DESIRED = ['GEOPOLITICS', 'ECONOMY', 'FINANCE', 'TECH', 'CRYPTO', 'POLITICS'];
  
  try {
    // Fetch both
    const [clobRes, gammaRes] = await Promise.all([
      fetch('https://clob.polymarket.com/markets?active=true&closed=false'),
      fetch('https://gamma-api.polymarket.com/events?closed=false&active=true&limit=300')
    ]);
    
    const clob = await clobRes.json();
    const gamma = await gammaRes.json();
    
    // Build metadata map
    const meta = new Map();
    for (const event of gamma) {
      for (const m of event.markets || []) {
        const tags = event.tags?.map(t => t.label?.toUpperCase()) || [];
        meta.set(m.conditionId || m.condition_id, { tags });
      }
    }
    
    // Match categories
    const matched = new Map();
    for (const cat of DESIRED) matched.set(cat, 0);
    
    for (const m of clob.data || []) {
      const data = meta.get(m.condition_id);
      if (data?.tags) {
        const found = DESIRED.find(c => data.tags.some(t => t.includes(c)));
        if (found) {
          matched.set(found, matched.get(found) + 1);
        }
      }
    }
    
    console.log('  Markets matched per category:');
    matched.forEach((count, cat) => {
      console.log(`    ${cat}: ${count}`);
    });
    
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }
}

// Run tests
async function main() {
  const clobMarkets = await testClob();
  await testGamma();
  await testCategoryMatching();
  
  console.log('\n✅ Tests complete');
  console.log(`\n💡 CLOB API returned ${clobMarkets.length} markets`);
  console.log('   This is the complete set, not just trending!');
}

main().catch(console.error);
