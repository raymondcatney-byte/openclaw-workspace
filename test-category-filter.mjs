// Test category filtering on Polymarket
console.log('Testing category filtering...\n');

const TESTS = [
  // Test 1: Search + category filter
  {
    name: 'Search "Trump" + tag filter',
    url: 'https://gamma-api.polymarket.com/events?search=Trump&tag_id=100265&closed=false&limit=10'
  },
  // Test 2: Multiple tags
  {
    name: 'Multiple tags (politics + crypto)',
    url: 'https://gamma-api.polymarket.com/events?tag_ids=2,21&closed=false&limit=10'
  },
  // Test 3: Category in search query
  {
    name: 'Search with "politics" keyword',
    url: 'https://gamma-api.polymarket.com/events?search=politics+Trump&closed=false&limit=10'
  },
  // Test 4: Get all then filter by tag presence
  {
    name: 'All markets (filter by tags after)',
    url: 'https://gamma-api.polymarket.com/events?closed=false&active=true&limit=100'
  },
  // Test 5: Filter by liquidity (proxy for importance)
  {
    name: 'High liquidity markets',
    url: 'https://gamma-api.polymarket.com/events?closed=false&active=true&liquidity_min=1000000&limit=20'
  }
];

async function test(url, name) {
  console.log(`\n📊 ${name}`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (!Array.isArray(data)) {
      console.log('  Invalid response');
      return;
    }
    
    console.log(`  Results: ${data.length}`);
    
    // Show categories found
    const categories = new Set();
    data.forEach(e => {
      e.tags?.forEach(t => categories.add(t.label));
    });
    
    console.log(`  Categories: ${Array.from(categories).slice(0, 5).join(', ')}`);
    
    // Show first 3 titles
    data.slice(0, 3).forEach((e, i) => {
      console.log(`  ${i+1}. ${e.title?.slice(0, 60)}`);
    });
    
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }
}

async function main() {
  for (const t of TESTS) {
    await test(t.url, t.name);
    await new Promise(r => setTimeout(r, 500));
  }
}

main();
