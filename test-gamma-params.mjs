// Test different Gamma API parameters to find trending/volume sorting
// Run: node test-gamma-params.mjs

console.log('🔍 Testing Gamma API for trending/volume sorting...\n');

// Test different sorting parameters
const TESTS = [
  {
    name: 'Default (no sort)',
    url: 'https://gamma-api.polymarket.com/events?tag_id=100265&closed=false&active=true&limit=10'
  },
  {
    name: 'Sort by volume',
    url: 'https://gamma-api.polymarket.com/events?tag_id=100265&closed=false&active=true&limit=10&sort=volume'
  },
  {
    name: 'Sort by liquidity',
    url: 'https://gamma-api.polymarket.com/events?tag_id=100265&closed=false&active=true&limit=10&sort=liquidity'
  },
  {
    name: 'Sort by trending',
    url: 'https://gamma-api.polymarket.com/events?tag_id=100265&closed=false&active=true&limit=10&sort=trending'
  },
  {
    name: 'Sort by star count',
    url: 'https://gamma-api.polymarket.com/events?tag_id=100265&closed=false&active=true&limit=10&sort=starCount'
  },
  {
    name: 'Sort by createdAt',
    url: 'https://gamma-api.polymarket.com/events?tag_id=100265&closed=false&active=true&limit=10&sort=createdAt'
  },
  {
    name: 'Sort by end date',
    url: 'https://gamma-api.polymarket.com/events?tag_id=100265&closed=false&active=true&limit=10&sort=endDate'
  },
  {
    name: 'Data API - markets by volume',
    url: 'https://data-api.polymarket.com/markets?tag_id=100265&closed=false&active=true&limit=20&sort=volume'
  },
  {
    name: 'Events with volume filter',
    url: 'https://gamma-api.polymarket.com/events?tag_id=100265&closed=false&active=true&limit=10&min_volume=100000'
  },
  {
    name: 'Trending endpoint (no tag)',
    url: 'https://gamma-api.polymarket.com/events?closed=false&active=true&limit=10&trending=true'
  }
];

async function testEndpoint(name, url) {
  console.log(`\n📊 ${name}`);
  console.log(`URL: ${url.substring(0, 80)}...`);
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!Array.isArray(data)) {
      console.log(`  ❌ Invalid response: ${typeof data}`);
      return;
    }
    
    console.log(`  ✅ Results: ${data.length}`);
    
    if (data.length > 0) {
      // Show first 3 results with volume
      data.slice(0, 3).forEach((e, i) => {
        const firstMarket = e.markets?.[0];
        const volume = firstMarket?.volume || e.volume || 0;
        console.log(`    ${i+1}. ${e.title?.slice(0, 50) || 'No title'} (Vol: $${(volume/1000).toFixed(0)}k)`);
      });
      
      // Show volume range
      const volumes = data.map(e => {
        const m = e.markets?.[0];
        return parseFloat(m?.volume || e.volume || 0);
      }).filter(v => v > 0);
      
      if (volumes.length > 0) {
        const max = Math.max(...volumes);
        const min = Math.min(...volumes);
        console.log(`    Volume range: $${(min/1000).toFixed(0)}k - $${(max/1000000).toFixed(2)}M`);
      }
    }
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }
}

async function main() {
  for (const test of TESTS) {
    await testEndpoint(test.name, test.url);
    await new Promise(r => setTimeout(r, 500)); // Rate limit friendly
  }
  
  console.log('\n✅ Done');
}

main().catch(console.error);
