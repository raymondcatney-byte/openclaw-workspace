// Test script: GLP-1 addiction research March 2024
// Run: node test-glp1.mjs

const GROQ_KEY = process.env.GROQ_API_KEY;

if (!GROQ_KEY) {
  console.error('Set GROQ_API_KEY environment variable');
  process.exit(1);
}

// Fetch PubMed research
async function fetchPubMedResearch(query, maxResults = 5) {
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&sort=date`;
    const searchRes = await fetch(searchUrl);
    
    if (!searchRes.ok) return [];
    
    const searchData = await searchRes.json();
    const ids = searchData.esearchresult?.idlist || [];
    
    if (ids.length === 0) return [];
    
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
    const summaryRes = await fetch(summaryUrl);
    
    if (!summaryRes.ok) return [];
    
    const summaryData = await summaryRes.json();
    
    return ids.map((id) => {
      const article = summaryData.result?.[id];
      return {
        id,
        title: article?.title || 'Untitled',
        source: article?.source || 'PubMed',
        pubDate: article?.pubdate || '',
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`
      };
    });
  } catch (e) {
    console.error('PubMed error:', e);
    return [];
  }
}

// Synthesize with Groq
async function synthesize(query, research, apiKey) {
  const researchContext = research.length > 0
    ? `\n\nCURRENT RESEARCH (PubMed):\n${research.map((r, i) => 
        `[${i + 1}] ${r.title}\n    Source: ${r.source}${r.pubDate ? ` (${r.pubDate})` : ''}\n    ${r.url}`
      ).join('\n\n')}`
    : '\n\n(No current research found)';
  
  const prompt = `You are a health research analyst. Answer the question using the provided research.

${researchContext}

USER QUESTION: ${query}

INSTRUCTIONS:
1. Synthesize a comprehensive answer using the research
2. Cite sources using [1], [2], etc.
3. Note publication dates (more recent = more relevant)
4. State confidence level (0-100%)
5. Format clearly with sections

Response:`;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1200
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}

// Run test
async function main() {
  console.log('🔍 Searching PubMed for GLP-1 addiction research...\n');
  
  const query = 'GLP-1 addiction March 2024';
  const research = await fetchPubMedResearch(query, 5);
  
  console.log(`Found ${research.length} research articles:\n`);
  research.forEach((r, i) => {
    console.log(`${i + 1}. ${r.title}`);
    console.log(`   ${r.source} (${r.pubDate})`);
    console.log(`   ${r.url}\n`);
  });
  
  console.log('🧠 Synthesizing with Groq...\n');
  console.log('─'.repeat(60));
  
  const answer = await synthesize(query, research, GROQ_KEY);
  
  console.log(answer);
  console.log('─'.repeat(60));
}

main().catch(console.error);
