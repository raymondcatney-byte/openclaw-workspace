// Debug condition ID matching
console.log('Debugging condition ID matching...\n');

async function debugMatching() {
  // Fetch a sample from both APIs
  const [clobRes, gammaRes] = await Promise.all([
    fetch('https://clob.polymarket.com/markets?active=true&closed=false&limit=10'),
    fetch('https://gamma-api.polymarket.com/events?closed=false&active=true&limit=10')
  ]);
  
  const clob = await clobRes.json();
  const gamma = await gammaRes.json();
  
  console.log('CLOB sample condition IDs:');
  clob.data?.slice(0, 3).forEach((m, i) => {
    console.log(`  ${i+1}. ${m.condition_id}`);
    console.log(`     Question: ${m.question?.slice(0, 50)}...`);
  });
  
  console.log('\nGamma sample condition IDs:');
  for (const event of gamma.slice(0, 3)) {
    for (const m of event.markets?.slice(0, 1) || []) {
      console.log(`  ${m.conditionId || m.condition_id}`);
      console.log(`     Question: ${(m.question || event.title)?.slice(0, 50)}...`);
    }
  }
  
  // Try matching by question text instead
  console.log('\nTrying question-based matching...');
  const clobQuestions = new Set(clob.data?.map(m => m.question?.toLowerCase().slice(0, 50)));
  
  let matches = 0;
  for (const event of gamma) {
    const q = (event.title || event.markets?.[0]?.question)?.toLowerCase().slice(0, 50);
    if (clobQuestions.has(q)) {
      matches++;
    }
  }
  
  console.log(`  Matched by question: ${matches}`);
}

debugMatching();
