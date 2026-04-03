// POST /api/protocol-consultant
// Wayne Protocol Consultant with Web Research + Knowledge Synthesis

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

// Web search for current research
async function searchWeb(query: string): Promise<Array<{
  title: string;
  url: string;
  snippet: string;
  source: string;
}>> {
  try {
    // Use Brave Search API if available
    const braveKey = process.env.BRAVE_API_KEY;
    if (braveKey) {
      const response = await fetch(
        `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query + ' health research')}&count=5`,
        {
          headers: {
            'X-Subscription-Token': braveKey,
            'Accept': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.web?.results?.map((r: any) => ({
          title: r.title,
          url: r.url,
          snippet: r.description,
          source: new URL(r.url).hostname
        })) || [];
      }
    }
    
    // Fallback: PubMed search for health queries
    const pubmedResponse = await fetch(
      `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=3&retmode=json`
    );
    
    if (pubmedResponse.ok) {
      const data = await pubmedResponse.json();
      const ids = data.esearchresult?.idlist || [];
      
      if (ids.length > 0) {
        const summaryRes = await fetch(
          `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`
        );
        const summaryData = await summaryRes.json();
        
        return ids.map((id: string) => {
          const article = summaryData.result?.[id];
          return {
            title: article?.title || 'PubMed Article',
            url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
            snippet: article?.source || '',
            source: 'pubmed.ncbi.nlm.nih.gov'
          };
        });
      }
    }
    
    return [];
  } catch (err) {
    console.error('Search error:', err);
    return [];
  }
}

// Synthesize search results into knowledge
async function synthesizeKnowledge(
  query: string,
  sources: Array<{ title: string; snippet: string; source: string }>,
  wayneProtocol: string
): Promise<string> {
  if (sources.length === 0) {
    return "No current research found. Using protocol knowledge base only.";
  }
  
  const context = sources
    .map((s, i) => `[${i + 1}] ${s.title}\n${s.snippet}\nSource: ${s.source}`)
    .join('\n\n');
  
  const prompt = `You are a health research analyst. Answer the question using the provided sources and your protocol knowledge.

WAYNE PROTOCOL KNOWLEDGE:
${wayneProtocol}

CURRENT RESEARCH:
${context}

USER QUESTION: ${query}

Provide a comprehensive answer that:
1. Synthesizes the research into clear recommendations
2. Cites sources using [1], [2] format
3. Notes any conflicts between sources
4. Includes specific dosages/mechanisms where available
5. States confidence level based on evidence quality

Answer in a clear, structured format.`;

  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
}

const WAYNE_PROTOCOL = `THE WAYNE PROTOCOL — COMPLETE REFERENCE

DAILY STRUCTURE
• Fasting: 18:6 base (adjustable: 16:8, 20:4, or skip)
• Meal 1 (08:15 post-training): 6 eggs, wild salmon, sweet potato, avocado, spinach
• Meal 2 (11:30): Bone broth, grilled chicken/fish, fermented vegetables  
• Meal 3 (18:30): Grass-fed steak/bison, beef liver weekly, cruciferous vegetables, wild rice/quinoa

SUPPLEMENT STACKS
Morning (05:30): NMN 500mg sublingual, TMG 1g, Alpha-GPC 600mg, Lion's Mane 1g, Vitamin D3 5000 IU, K2 MK-7 200mcg, Omega-3 2g
Pre-workout (06:15): Creatine 5g, Beta-alanine 3g, Caffeine 100mg optional
Post-workout (08:00): Whey isolate 40g, electrolytes
Deep work (08:30): L-Theanine 200mg, Magnesium L-threonate 200mg
Afternoon (12:00): Phosphatidylserine 300mg
Evening (20:00): Zinc 30mg, Copper 2mg, Apigenin 50mg, Glycine 3g

LONGEVITY (Daily): Resveratrol 250-500mg, Spermidine 10mg
HAIR PROTOCOL: Saw Palmetto 320mg, Biotin 10,000mcg, topical castor/rosemary blend

ADJUSTMENT RULES (Apply automatically):
• Sleep <6h → Delay fasting 2h, skip caffeine, reduce training intensity 50%
• HRV <50 or down >10% → NO sauna, mobility only, add 1g glycine
• Readiness <5 → Skip training, prioritize recovery
• "Inflamed" or sore → Add curcumin, skip ecdysterone, reduce intensity
• Poor sleep + low HRV → Skip fasting entirely, eat for recovery
• Jet lag → 300mcg melatonin, shift meals to local time immediately`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, biomarkers, mode = 'auto' } = req.body;
    
    // Determine if this needs web research
    const needsResearch = mode === 'research' || 
      query.match(/study|research|evidence|clinical|trial|paper|pubmed|examine/i);
    
    let response: string;
    let sources: any[] = [];
    
    if (needsResearch) {
      // Fetch current research
      sources = await searchWeb(query);
      
      // Synthesize with protocol knowledge
      response = await synthesizeKnowledge(query, sources, WAYNE_PROTOCOL);
    } else {
      // Use static protocol knowledge only
      const enrichedQuery = biomarkers 
        ? `[Biomarkers detected: ${JSON.stringify(biomarkers)}] ${query}`
        : query;
      
      const groqResponse = await fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: `You are the Wayne Protocol Consultant.\n\n${WAYNE_PROTOCOL}\n\nCONSTRAINTS:\n- Never say "consult a doctor"\n- Always provide exact dosages, timing, rationale\n- Prioritize recovery over performance when conflicting signals` },
            { role: 'user', content: enrichedQuery }
          ],
          temperature: 0.3,
          max_tokens: 800
        })
      });
      
      const data = await groqResponse.json();
      response = data.choices[0].message.content;
    }
    
    return res.status(200).json({ 
      response,
      sources: sources.length > 0 ? sources : undefined,
      mode: needsResearch ? 'research' : 'protocol',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Protocol Consultant error:', error);
    return res.status(500).json(
      { error: 'Protocol system temporarily unavailable. Check API configuration.' }
    );
  }
}