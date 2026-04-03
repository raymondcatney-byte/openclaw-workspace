// Test hybrid approach
console.log('🎯 Testing Hybrid: Per-category pagination...\n');

const DESIRED_CATEGORIES = [
  { id: 100265, name: 'GEOPOLITICS' },
  { id: 100328, name: 'ECONOMY' },
  { id: 120, name: 'FINANCE' },
  { id: 1401, name: 'TECH' },
  { id: 21, name: 'CRYPTO' },
  { id: 2, name: 'POLITICS' },
];

async function testCategory(tagId, name) {
  console.log(`\n📊 ${name} (tag ${tagId})`);
  
  try {
    const url = `https://gamma-api.polymarket.com/events?tag_id=${tagId}&closed=false&active=true&limit=50`;
    const res = await fetch(url);
    
    if (!res.ok) {
      console.log(`  ❌ Status ${res.status}`);
      return 0;
    }
    
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.log(`  ❌ Invalid response`);
      return 0;
    }
    
    console.log(`  Events: ${data.length}`);
    
    // Count markets
    let marketCount = 0;
    let totalVolume = 0;
    const sampleMarkets = [];
    
    for (const event of data) {
      const markets = event.markets || [];
      marketCount += markets.length;
      
      for (const m of markets) {
        const vol = parseFloat(m.volume || 0);
        totalVolume += vol;
        
        if (sampleMarkets.length < 3) {
          sampleMarkets.push({
            q: (event.title || m.question)?.slice(0, 50),
            vol: vol
          });
        }
      }
    }
    
    console.log(`  Markets: ${marketCount}`);
    console.log(`  Total volume: $${(totalVolume / 1000000).toFixed(2)}M`);
    console.log('  Sample:');
    sampleMarkets.forEach((m, i) => {
      console.log(`    ${i+1}. ${m.q}... ($${(m.vol/1000).toFixed(0)}k)`);
    });
    
    return marketCount;
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
    return 0;
  }
}

async function main() {
  let total = 0;
  
  for (const cat of DESIRED_CATEGORIES) {
    const count = await testCategory(cat.id, cat.name);
    total += count;
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log(`\n✅ Total markets across all categories: ${total}`);
  console.log('   (Top 10 per category will be returned after sorting by volume)');
}

main().catch(console.error);
