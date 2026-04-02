// lib/biotech-client.ts
// Client-side utilities for biotech search

export interface SearchOptions {
  query: string;
  category?: 'all' | 'peptides' | 'supplements' | 'nutrition' | 'research';
  limit?: number;
}

export interface SearchResult {
  sources: {
    pubmed?: {
      status: string;
      data: any[];
      count: number;
    };
    chembl?: {
      status: string;
      data: any[];
      count: number;
    };
    wikidata?: {
      status: string;
      data: any[];
      count: number;
    };
    usda?: {
      status: string;
      data: any[];
      count: number;
    };
  };
  meta: {
    latency: number;
    timestamp: string;
  };
}

export class BiotechSearchClient {
  private baseUrl: string;

  constructor(baseUrl = '/api/biotech') {
    this.baseUrl = baseUrl;
  }

  async search(options: SearchOptions): Promise<SearchResult> {
    const response = await fetch(`${this.baseUrl}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Search failed');
    }

    return response.json();
  }

  async searchWikidata(queryType: 'peptides' | 'nootropics' | 'supplements' | string) {
    const response = await fetch(`${this.baseUrl}/wikidata`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queryType })
    });

    if (!response.ok) {
      throw new Error('Wikidata search failed');
    }

    return response.json();
  }

  async getMolecule(chemblId: string) {
    const response = await fetch(`${this.baseUrl}/chembl/${chemblId}`);
    
    if (!response.ok) {
      throw new Error('Molecule not found');
    }

    return response.json();
  }

  async getAbstracts(pmids: string[]) {
    const response = await fetch(`${this.baseUrl}/pubmed/abstract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pmids })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch abstracts');
    }

    return response.json();
  }
}

// React hook for search
export function useBiotechSearch() {
  const client = new BiotechSearchClient();
  
  return {
    search: client.search.bind(client),
    searchWikidata: client.searchWikidata.bind(client),
    getMolecule: client.getMolecule.bind(client),
    getAbstracts: client.getAbstracts.bind(client)
  };
}
