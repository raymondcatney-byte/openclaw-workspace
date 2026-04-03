// Find the actual trending/hot markets endpoint
console.log('🔥 Finding trending markets endpoint...\n');

const TESTS = [
  {
    name: '/events/active (default ordering)',
    url: 'https://gamma-api.polymarket.com/events/active?closed=false&limit=20'
  },
  {
    name: '/events with order=volume',
    url: 'https://gamma-api.polymarket.com/events?closed=false&active=true&limit=20&order=volume'
  },
  {
    name: '/events with order=liquidityNum',
    url: 'https://gamma-api.polymarket.com/events?closed=false&active=true&limit=20&order=liquidityNum'
  },
  {
    name: '/markets (CLOB) by volume',
    url: 'https://clob.polymarket.com/markets?active=true&limit=20'
  },
  {
    name: '/events with offset (pagination)',
    url: 'https://gamma-api.polymarket.com/events?closed=false&active=true&limit=20&offset=100'
  },
  {
    name: 'All events no filter (highest volume global)',
    url: 'https://gamma-api.polymarket.com/events?closed=false&active=true&limit=50'
  },
  {
    name: 'Markets directly (not events)',
    url: 'https://gamma-api.polymarket.com/markets?closed=false&active=true&limit=20'
  }
];

async function testEndpoint(name, url) {
  console.log(`\n📈 ${name}`);
  
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    const text = await res.text();
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.log(`  ❌ Not JSON: ${text.slice(0, 100)}`);
      return;
    }
    
    if (!Array.isArray(data)) {
      console.log(`  ❌ Not array: ${typeof data}`);
      return;
    }
    
    console.log(`  ✅ Results: ${data.length}`);
    
    // Show top 5 by volume
    const withVolume = data.map(e => {
      const m = e.markets?.[0] || e;
      return {
        title: e.title || m.question || 'Unknown',
        volume: parseFloat(m.volume || m.volumeNum || e.volume || 0),
        liquidity: parseFloat(m.liquidity || m.liquidityNum || 0)
      };
    }).filter(x => x.volume > 0);
    
    // Sort by volume
    withVolume.sort((a, b) => b.volume - a.volume);
    
    console.log('  Top by volume:');
    withVolume.slice(0, 5).forEach((x, i) => {
      console.log(`    ${i+1}. ${x.title.slice(0, 45)}... ($${(x.volume/1000000).toFixed(2)}M)`);
    });
    
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }
}

async function main() {
  for (const test of TESTS) {
    await testEndpoint(test.name, test.url);
    await new Promise(r => setTimeout(r, 600));
  }
  console.log('\n✅ Done');
}

main().catch(console.error);
