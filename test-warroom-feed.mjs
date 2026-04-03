// Test the War Room feed solution
console.log('🎯 Testing War Room Polymarket Feed...\n');

const TEST_URL = 'https://gamma-api.polymarket.com/events?closed=false&active=true&limit=50&offset=0';

// Test 1: Basic connectivity
async function testConnection() {
  console.log('Test 1: API Connectivity');
  try {
    const res = await fetch(TEST_URL);
    console.log(`  Status: ${res.status}`);
    const data = await res.json();
    console.log(`  Events returned: ${Array.isArray(data) ? data.length : 'Not array'}`);
    return Array.isArray(data);
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
    return false;
  }
}

// Test 2: Category detection
async function testCategoryDetection() {
  console.log('\nTest 2: Category Detection');
  
  const MONITORED_TAGS = [
    { id: 100265, name: 'GEOPOLITICS' },
    { id: 100328, name: 'ECONOMY' },
    { id: 120, name: 'FINANCE' },
    { id: 1401, name: 'TECH' },
    { id: 21, name: 'CRYPTO' },
    { id: 2, name: 'POLITICS' },
  ];
  
  try {
    const res = await fetch(TEST_URL);
    const data = await res.json();
    
    if (!Array.isArray(data)) {
      console.log('  ❌ Invalid response');
      return;
    }
    
    let foundCategories = new Set();
    let matchedCount = 0;
    
    for (const event of data) {
      const tags = event.tags?.map(t => t.label?.toUpperCase()) || [];
      
      const isMonitored = MONITORED_TAGS.some(tag =>
        tags.some(t => t?.includes(tag.name))
      );
      
      if (isMonitored) {
        matchedCount++;
        const matched = MONITORED_TAGS.find(tag =>
          tags.some(t => t?.includes(tag.name))
        )?.name;
        if (matched) foundCategories.add(matched);
      }
    }
    
    console.log(`  Total events: ${data.length}`);
    console.log(`  Matched monitored categories: ${matchedCount}`);
    console.log(`  Categories found: ${Array.from(foundCategories).join(', ')}`);
    
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }
}

// Test 3: Volume sorting
async function testVolumeSorting() {
  console.log('\nTest 3: Volume Data');
  
  try {
    const res = await fetch(TEST_URL);
    const data = await res.json();
    
    if (!Array.isArray(data)) return;
    
    const volumes = [];
    
    for (const event of data) {
      const m = event.markets?.[0];
      if (m?.volume) {
        volumes.push(parseFloat(m.volume));
      }
    }
    
    volumes.sort((a, b) => b - a);
    
    console.log(`  Markets with volume data: ${volumes.length}`);
    console.log(`  Highest volume: $${(volumes[0] / 1000000).toFixed(2)}M`);
    console.log(`  Top 5 volumes:`);
    volumes.slice(0, 5).forEach((v, i) => {
      console.log(`    ${i+1}. $${(v / 1000000).toFixed(2)}M`);
    });
    
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
  }
}

// Test 4: Multiple offsets
async function testMultipleOffsets() {
  console.log('\nTest 4: Multiple Offsets (Discovery)');
  
  const offsets = [0, 50, 100];
  const results = new Map();
  
  for (const offset of offsets) {
    const url = `https://gamma-api.polymarket.com/events?closed=false&active=true&limit=30&offset=${offset}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        results.set(offset, data.length);
      }
      
      await new Promise(r => setTimeout(r, 300)); // Rate limit friendly
    } catch (e) {
      console.log(`  Offset ${offset}: Error`);
    }
  }
  
  console.log('  Results:');
  results.forEach((count, offset) => {
    console.log(`    Offset ${offset}: ${count} events`);
  });
}

// Run all tests
async function main() {
  const connected = await testConnection();
  if (!connected) {
    console.log('\n❌ API not responding. Check connection.');
    return;
  }
  
  await testCategoryDetection();
  await testVolumeSorting();
  await testMultipleOffsets();
  
  console.log('\n✅ Tests complete');
}

main().catch(console.error);
