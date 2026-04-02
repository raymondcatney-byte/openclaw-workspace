/**
 * Web Search Skill — web-search-pro pattern
 * Multi-source search with synthesis
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  credibility: number; // 0-1
  publishedDate?: string;
}

export interface ResearchQuery {
  query: string;
  sources?: ('examine' | 'pubmed' | 'fda' | 'who' | 'general')[];
  depth?: 'quick' | 'standard' | 'deep';
  recency?: 'any' | 'year' | 'month';
}

export class WebSearchSkill {
  private braveApiKey?: string;
  
  constructor() {
    this.braveApiKey = process.env.BRAVE_API_KEY;
  }
  
  async search(params: ResearchQuery): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    // Parallel search across sources
    const searches: Promise<SearchResult[]>[] = [];
    
    if (!params.sources || params.sources.includes('general')) {
      searches.push(this.searchBrave(params.query));
    }
    
    if (params.sources?.includes('examine')) {
      searches.push(this.searchExamine(params.query));
    }
    
    if (params.sources?.includes('pubmed')) {
      searches.push(this.searchPubMed(params.query));
    }
    
    const allResults = await Promise.all(searches);
    
    // Flatten and dedupe
    const seen = new Set<string>();
    for (const batch of allResults) {
      for (const result of batch) {
        const key = result.url.toLowerCase().replace(/[?#].*$/, '');
        if (!seen.has(key)) {
          seen.add(key);
          results.push(result);
        }
      }
    }
    
    // Score and rank
    return results
      .map(r => ({ ...r, credibility: this.scoreCredibility(r) }))
      .sort((a, b) => b.credibility - a.credibility)
      .slice(0, params.depth === 'deep' ? 20 : params.depth === 'standard' ? 10 : 5);
  }
  
  private async searchBrave(query: string): Promise<SearchResult[]> {
    if (!this.braveApiKey) {
      // Fallback: return empty, rely on other sources
      return [];
    }
    
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`,
      {
        headers: {
          'X-Subscription-Token': this.braveApiKey,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    return data.web?.results?.map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.description,
      source: new URL(r.url).hostname,
      credibility: 0.5 // Base score
    })) || [];
  }
  
  private async searchExamine(query: string): Promise<SearchResult[]> {
    // Examine doesn't have a public API, but we can search via site:
    // In production, this would scrape or use their API if available
    return [{
      title: `Examine.com: ${query}`,
      url: `https://examine.com/search/?q=${encodeURIComponent(query)}`,
      snippet: 'Search Examine.com for evidence-based supplement research',
      source: 'examine.com',
      credibility: 0.95
    }];
  }
  
  private async searchPubMed(query: string): Promise<SearchResult[]> {
    const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=5&retmode=json`;
    
    const searchRes = await fetch(esearchUrl);
    const searchData = await searchRes.json();
    const ids = searchData.esearchresult?.idlist || [];
    
    if (ids.length === 0) return [];
    
    // Fetch summaries
    const esummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(',')}&retmode=json`;
    const summaryRes = await fetch(esummaryUrl);
    const summaryData = await summaryRes.json();
    
    return ids.map((id: string) => {
      const article = summaryData.result?.[id];
      return {
        title: article?.title || 'PubMed Article',
        url: `https://pubmed.ncbi.nlm.nih.gov/${id}/`,
        snippet: article?.source || '',
        source: 'pubmed.ncbi.nlm.nih.gov',
        credibility: 0.9,
        publishedDate: article?.pubdate
      };
    });
  }
  
  private scoreCredibility(result: SearchResult): number {
    const trustedDomains: Record<string, number> = {
      'ncbi.nlm.nih.gov': 0.95,
      'pubmed.ncbi.nlm.nih.gov': 0.95,
      'examine.com': 0.95,
      'fda.gov': 0.95,
      'who.int': 0.95,
      'mayoclinic.org': 0.85,
      'harvard.edu': 0.85,
      'healthline.com': 0.7,
      'webmd.com': 0.65
    };
    
    const domain = new URL(result.url).hostname.toLowerCase();
    const baseScore = trustedDomains[domain] || result.credibility || 0.5;
    
    // Boost for recency
    if (result.publishedDate) {
      const year = parseInt(result.publishedDate);
      if (year >= 2023) return Math.min(baseScore + 0.1, 1.0);
    }
    
    return baseScore;
  }
  
  /**
   * Synthesize search results into coherent answer
   */
  async synthesize(
    query: string, 
    results: SearchResult[],
    groqApiKey: string
  ): Promise<{
    answer: string;
    confidence: number;
    sources: SearchResult[];
    reasoning: string;
  }> {
    const context = results
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nSource: ${r.source} (credibility: ${r.credibility})`)
      .join('\n\n');
    
    const prompt = `You are a health research analyst. Synthesize the following sources to answer the question.

QUESTION: ${query}

SOURCES:
${context}

Provide:
1. A clear, evidence-based answer
2. Your confidence level (0-1) based on source quality and agreement
3. Any caveats or limitations
4. Citations using [1], [2] format

Be precise. If sources disagree, acknowledge this. If evidence is weak, say so.`;
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 800
      })
    });
    
    const data = await response.json();
    const answer = data.choices[0].message.content;
    
    // Extract confidence from answer or calculate from sources
    const confidenceMatch = answer.match(/confidence[:\s]+(0?\.\d+|1\.0|1)/i);
    const confidence = confidenceMatch 
      ? parseFloat(confidenceMatch[1]) 
      : results.reduce((sum, r) => sum + r.credibility, 0) / results.length;
    
    return {
      answer,
      confidence,
      sources: results.slice(0, 5),
      reasoning: `Based on ${results.length} sources with avg credibility ${(results.reduce((s, r) => s + r.credibility, 0) / results.length).toFixed(2)}`
    };
  }
}