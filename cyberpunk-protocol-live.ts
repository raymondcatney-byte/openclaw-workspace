// POST /api/protocol-consultant
// Wayne Protocol Consultant with Live PubMed Research + Groq Synthesis

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const WAYNE_PROTOCOL = `THE WAYNE PROTOCOL — COMPLETE REFERENCE

Daily Structure:
• Fasting: 18:6 base (16:8, 20:4, or skip as needed)
• Meal 1 (08:15): 6 eggs, wild salmon, sweet potato, avocado, spinach
• Meal 2 (11:30): Bone broth, grilled chicken/fish, fermented vegetables  
• Meal 3 (18:30): Grass-fed steak/bison, beef liver weekly, cruciferous vegetables

Supplement Stacks:
Morning: NMN 500mg sublingual, TMG 1g, Alpha-GPC 600mg, Lion's Mane 1g, Vitamin D3 5000 IU, K2 200mcg, Omega-3 2g
Pre-workout: Creatine 5g, Beta-alanine 3g, Caffeine 100mg optional
Post-workout: Whey isolate 40g
Deep work: L-Theanine 200mg, Magnesium L-threonate 200mg
Afternoon: Phosphatidylserine 300mg
Evening: Zinc 30mg, Copper 2mg, Apigenin 50mg, Glycine 3g

Adjustment Rules:
• Sleep <6h → Delay fasting 2h, skip caffeine, reduce training 50%
• HRV <50 or down >10% → NO sauna, mobility only, add 1g glycine
• Readiness <5 → Skip training, prioritize recovery`;

// Fetch live research from PubMed
async function fetchPubMedResearch(query: string, maxResults = 5): Promise<Array<{
  id: string;
  title: string;
  source: string;
  pubDate: string;
  url: string;
}>> {
  try {
    // Search PubMed
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&sort=date`;
    const searchRes = await fetch(searchUrl, { timeout: 5000 } as any);
    
    if (!searchRes.ok) return [];
    
    const searchData = await searchRes.json();
    const ids = searchData.esearchresult?.idlist || [];
    
    if (ids.length === 0) return [];
    
    // Fetch article details
    const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
    const summaryRes = await fetch(summaryUrl, { timeout: 5000 } as any);
    
    if (!summaryRes.ok) return [];
    
    const summaryData = await summaryRes.json();
    
    return ids.map((id: string) => {
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
    console.error('PubMed fetch error:', e);
    return [];
  }
}

// Synthesize research + protocol knowledge through Groq
async function synthesizeWithGroq(
  query: string,
  research: Array<{ id: string; title: string; source: string; pubDate: string; url: string }>,
  biomarkers: any,
  apiKey: string
): Promise<{ answer: string; confidence: number }> {
  
  const researchContext = research.length > 0
    ? `\n\nCURRENT RESEARCH (PubMed):\n${research.map((r, i) => 
        `[${i + 1}] ${r.title}\n    Source: ${r.source}${r.pubDate ? ` (${r.pubDate})` : ''}\n    ${r.url}`
      ).join('\n\n')}`
    : '\n\n(No current research found for this query)';
  
  const biomarkerContext = biomarkers 
    ? `\n\nUSER BIOMARKERS: ${JSON.stringify(biomarkers)}`
    : '';
  
  const synthesisPrompt = `You are the Wayne Protocol Consultant. Answer the user's question using your knowledge base AND the current research provided.

WAYNE PROTOCOL KNOWLEDGE:
${WAYNE_PROTOCOL}${researchContext}${biomarkerContext}

USER QUESTION: ${query}

INSTRUCTIONS:
1. Synthesize a comprehensive answer using the research provided
2. Cite sources using [1], [2], etc. when referencing research
3. Include mechanisms, dosages, and timing where relevant
4. Note the publication dates of research (more recent = more relevant)
5. State your confidence level (0-100%) based on evidence quality
6. Format clearly with sections if needed

Provide your response:`;

  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: synthesisPrompt }],
      temperature: 0.3,
      max_tokens: 1200
    })
  });
  
  if (!response.ok) {
    throw new Error('Groq synthesis failed');
  }
  
  const data = await response.json();
  const answer = data.choices[0].message.content;
  
  // Extract confidence if stated
  const confidenceMatch = answer.match(/confidence[:\s]+(\d+)/i);
  const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 70;
  
  return { answer, confidence };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, biomarkers, includeResearch = true } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }
    
    const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
    }
    
    // Fetch live research
    let research: any[] = [];
    if (includeResearch) {
      research = await fetchPubMedResearch(query, 5);
    }
    
    // Synthesize through Groq
    const { answer, confidence } = await synthesizeWithGroq(
      query,
      research,
      biomarkers,
      apiKey
    );
    
    return res.status(200).json({
      response: answer,
      research: research.length > 0 ? research : undefined,
      confidence,
      sourcesCount: research.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Protocol Consultant error:', error);
    return res.status(500).json({
      error: 'Protocol system error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}