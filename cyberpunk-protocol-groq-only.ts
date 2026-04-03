// POST /api/protocol-consultant
// Wayne Protocol Consultant - Groq Knowledge Only (No external search APIs)

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT = `You are the Wayne Protocol Consultant, an expert health and biotech research assistant.

YOUR KNOWLEDGE BASE:
- Comprehensive understanding of supplements, nootropics, and longevity protocols
- Current research on NAD+ precursors (NMN, NR), mitochondrial health, autophagy
- Exercise physiology, sleep optimization, stress management
- Drug interactions and contraindications
- Biomarker interpretation (HRV, sleep, glucose, cortisol, etc.)

THE WAYNE PROTOCOL:
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

Longevity: Resveratrol 250-500mg, Spermidine 10mg
Hair: Saw Palmetto 320mg, Biotin 10,000mcg, topical castor/rosemary

Adjustment Rules:
• Sleep <6h → Delay fasting 2h, skip caffeine, reduce training 50%
• HRV <50 or down >10% → NO sauna, mobility only, add 1g glycine
• Readiness <5 → Skip training, prioritize recovery
• Inflamed/sore → Add curcumin, skip ecdysterone
• Poor sleep + low HRV → Skip fasting entirely
• Jet lag → 300mcg melatonin, shift meals immediately

RESPONSE FORMAT:
For general health questions:
1. Direct answer with mechanisms
2. Specific dosages if applicable
3. Timing recommendations
4. Safety notes (interactions, contraindications)
5. Confidence level based on evidence quality

For protocol adjustments:
1. Parse biomarkers
2. Apply adjustment rules
3. Modified protocol for the day
4. Rationale for changes

CONSTRAINTS:
- Never say "consult a doctor" — provide direct actionable information
- Always include exact dosages and timing when relevant
- Note drug/supplement interactions explicitly
- Distinguish between strong evidence and theoretical/mechanistic claims
- Prioritize recovery over performance when biomarkers suggest stress`;

// Fetch from free sources without API keys (optional enhancement)
async function fetchFreeSources(query: string): Promise<Array<{
  title: string;
  url: string;
  snippet: string;
}>> {
  const sources = [];
  
  try {
    // Try PubMed (no API key needed for basic search)
    const pubmedSearch = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}+supplement&retmax=2&retmode=json`,
      { timeout: 3000 } as any
    );
    
    if (pubmedSearch.ok) {
      const data = await pubmedSearch.json();
      const ids = data.esearchresult?.idlist || [];
      
      if (ids.length > 0) {
        const summaryRes = await fetch(
          `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`,
          { timeout: 3000 } as any
        );
        
        if (summaryRes.ok) {
          const summaryData = await summaryRes.json();
          ids.forEach((id: string) => {
            const article = summaryData.result?.[id];
            if (article) {
              sources.push({
                title: article.title,
                url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
                snippet: `PubMed: ${article.source || 'Research article'}`
              });
            }
          });
        }
      }
    }
  } catch (e) {
    // Silent fail - not critical
  }
  
  return sources;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, biomarkers, includeSources = false } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query required' });
    }
    
    const enrichedQuery = biomarkers 
      ? `[Biomarkers: ${JSON.stringify(biomarkers)}] ${query}`
      : query;
    
    // Optional: Fetch free sources (PubMed) for citations
    let sources = [];
    if (includeSources) {
      sources = await fetchFreeSources(query);
    }
    
    // Build messages
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: enrichedQuery }
    ];
    
    // Add sources as context if found
    if (sources.length > 0) {
      const sourceContext = sources.map((s, i) => `[${i + 1}] ${s.title} (${s.url})`).join('\n');
      messages.push({
        role: 'system',
        content: `Related research (cite these if relevant):\n${sourceContext}`
      });
    }
    
    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.3,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'API request failed');
    }
    
    const data = await response.json();
    
    return res.status(200).json({ 
      response: data.choices[0].message.content,
      sources: sources.length > 0 ? sources : undefined,
      model: 'llama-3.3-70b-versatile',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Protocol Consultant error:', error);
    return res.status(500).json({
      error: 'Protocol system temporarily unavailable',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}