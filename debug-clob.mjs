// Debug CLOB API
console.log('Debugging CLOB API...\n');

async function testClobVariants() {
  const TESTS = [
    'https://clob.polymarket.com/markets',
    'https://clob.polymarket.com/markets?active=true',
    'https://clob.polymarket.com/markets?active=true&closed=false',
    'https://clob.polymarket.com/markets?limit=100',
    'https://clob.polymarket.com/markets/active',
  ];
  
  for (const url of TESTS) {
    console.log(`\nTesting: ${url}`);
    try {
      const res = await fetch(url);
      console.log(`  Status: ${res.status}`);
      
      const data = await res.json();
      console.log(`  Keys: ${Object.keys(data).join(', ')}`);
      
      if (data.markets) {
        console.log(`  Markets count: ${data.markets.length}`);
      } else if (Array.isArray(data)) {
        console.log(`  Array length: ${data.length}`);
      } else {
        console.log(`  Data preview: ${JSON.stringify(data).slice(0, 200)}`);
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
}

testClobVariants();
