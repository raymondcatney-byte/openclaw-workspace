// Debug script: Test Polymarket Gamma API directly
// Run: node debug-polymarket.mjs

console.log('🔍 Testing Polymarket Gamma API...\n');

// Test 1: Tag-based fetch (most reliable)
async function testTagFetch() {
  console.log('Test 1: Tag-based fetch (tag_id=100265 - GEOPOLITICS)');
  const url = 'https://gamma-api.polymarket.com/events?tag_id=100265&closed=false&active=true&limit=5';
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    console.log(`  Status: ${res.status}`);
    console.log(`  Events returned: ${Array.isArray(data) ? data.length : 'Not an array'}`);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log(`  First event: ${data[0].title || 'No title'}`);
      console.log(`  Markets in first event: ${data[0].markets?.length || 0}`);
      if (data[0].markets?.[0]) {
        console.log(`  First market question: ${data[0].markets[0].question || 'No question'}`);
      }
    }
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }
  console.log('');
}

// Test 2: Search-based fetch
async function testSearchFetch() {
  console.log('Test 2: Search-based fetch (query="Trump")');
  const url = 'https://gamma-api.polymarket.com/events?search=Trump&closed=false&limit=5';
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    console.log(`  Status: ${res.status}`);
    console.log(`  Events returned: ${Array.isArray(data) ? data.length : 'Not an array'}`);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log(`  First event: ${data[0].title || 'No title'}`);
    }
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }
  console.log('');
}

// Test 3: No filters (all active markets)
async function testAllMarkets() {
  console.log('Test 3: All active markets (no filters)');
  const url = 'https://gamma-api.polymarket.com/events?closed=false&active=true&limit=10';
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    console.log(`  Status: ${res.status}`);
    console.log(`  Events returned: ${Array.isArray(data) ? data.length : 'Not an array'}`);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('\n  Sample events:');
      data.slice(0, 5).forEach((e, i) => {
        console.log(`    ${i+1}. ${e.title || 'No title'}`);
        console.log(`       Tags: ${e.tags?.map(t => t.label).join(', ') || 'None'}`);
      });
    }
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }
  console.log('');
}

// Test 4: Categories endpoint
async function testCategories() {
  console.log('Test 4: Available categories/tags');
  const url = 'https://gamma-api.polymarket.com/tags?limit=20';
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    
    console.log(`  Status: ${res.status}`);
    console.log(`  Tags returned: ${Array.isArray(data) ? data.length : 'Not an array'}`);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('\n  Available tags:');
      data.slice(0, 10).forEach(t => {
        console.log(`    - ${t.label} (ID: ${t.id})`);
      });
    }
  } catch (e) {
    console.log(`  Error: ${e.message}`);
  }
  console.log('');
}

// Run all tests
async function main() {
  await testTagFetch();
  await testSearchFetch();
  await testAllMarkets();
  await testCategories();
  
  console.log('✅ Debug complete');
}

main().catch(console.error);
