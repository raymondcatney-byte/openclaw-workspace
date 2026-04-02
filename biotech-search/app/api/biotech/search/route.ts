// app/api/biotech/search/route.ts
// Main search aggregator - Vercel Edge Runtime

export const runtime = 'edge';
export const preferredRegion = 'iad1'; // US East for lowest latency to NIH/USDA

interface SearchRequest {
  query: string;
  category: 'all' | 'peptides' | 'supplements' | 'nutrition' | 'research';
  limit?: number;
}

export async function POST(request: Request) {
  const start = Date.now();
  
  try {
    const body: SearchRequest = await request.json();
    const { query, category = 'all', limit = 20 } = body;
    
    if (!query || query.length < 2) {
      return Response.json(
        { error: 'Query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Parallel searches based on category
    const searchPromises: Promise<any>[] = [];
    
    if (category === 'all' || category === 'research') {
      searchPromises.push(searchPubMed(query, limit));
    }
    
    if (category === 'all' || category === 'peptides' || category === 'supplements') {
      searchPromises.push(searchChEMBL(query, limit));
      searchPromises.push(searchWikidata(query, limit, 'compound'));
    }
    
    if (category === 'all' || category === 'nutrition') {
      searchPromises.push(searchUSDA(query, limit));
    }
    
    if (category === 'all') {
      searchPromises.push(searchClinicalTrials(query, limit));
    }

    const results = await Promise.allSettled(searchPromises);
    
    // Aggregate results
    const aggregated = {
      query,
      category,
      sources: {} as Record<string, any>,
      meta: {
        latency: Date.now() - start,
        timestamp: new Date().toISOString(),
      }
    };

    results.forEach((result, index) => {
      const sourceNames = ['pubmed', 'chembl', 'wikidata', 'usda', 'clinicaltrials'].slice(0, searchPromises.length);
      const name = sourceNames[index];
      
      if (result.status === 'fulfilled') {
        aggregated.sources[name] = {
          status: 'success',
          data: result.value,
          count: Array.isArray(result.value) ? result.value.length : 0
        };
      } else {
        aggregated.sources[name] = {
          status: 'error',
          error: result.reason?.message || 'Unknown error'
        };
      }
    });

    return Response.json(aggregated, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        'X-Edge-Latency': `${Date.now() - start}ms`
      }
    });

  } catch (error) {
    return Response.json(
      { error: 'Search failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}

// PubMed E-utilities wrapper
async function searchPubMed(query: string, limit: number) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodedQuery}&retmax=${limit}&retmode=json&sort=relevance`;
  
  const response = await fetchWithTimeout(url, 5000);
  const data = await response.json();
  
  if (!data.esearchresult?.idlist?.length) {
    return [];
  }

  // Fetch summaries for IDs
  const ids = data.esearchresult.idlist.slice(0, limit).join(',');
  const summaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids}&retmode=json`;
  
  const summaryResponse = await fetchWithTimeout(summaryUrl, 5000);
  const summaryData = await summaryResponse.json();
  
  return Object.values(summaryData.result || {})
    .filter((item: any) => item.uid)
    .map((item: any) => ({
      id: item.uid,
      title: item.title,
      authors: item.authors?.map((a: any) => a.name) || [],
      journal: item.fulljournalname || item.source,
      year: item.pubdate?.split(' ')[0],
      doi: item.articleids?.find((id: any) => id.idtype === 'doi')?.value,
      url: `https://pubmed.ncbi.nlm.nih.gov/${item.uid}/`
    }));
}

// ChEMBL API wrapper (has CORS, but we add caching)
async function searchChEMBL(query: string, limit: number) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.ebi.ac.uk/chembl/api/data/molecule/search?q=${encodedQuery}&limit=${limit}&format=json`;
  
  const response = await fetchWithTimeout(url, 5000);
  const data = await response.json();
  
  return (data.molecules || []).map((mol: any) => ({
    id: mol.molecule_chembl_id,
    name: mol.pref_name || mol.molecule_structures?.canonical_smiles?.slice(0, 30) + '...',
    smiles: mol.molecule_structures?.canonical_smiles,
    formula: mol.molecule_properties?.full_molformula,
    mw: mol.molecule_properties?.full_mwt,
    max_phase: mol.max_phase, // 4 = approved drug
    first_approval: mol.first_approval,
    therapeutic_flag: mol.therapeutic_flag,
    url: `https://www.ebi.ac.uk/chembl/compound_report_card/${mol.molecule_chembl_id}/`
  }));
}

// Wikidata SPARQL wrapper
async function searchWikidata(query: string, limit: number, type: string) {
  const sparqlQuery = `
    SELECT DISTINCT ?item ?itemLabel ?description ?typeLabel
    WHERE {
      ?item wdt:P31 ?type ;
            rdfs:label ?label .
      FILTER(CONTAINS(LCASE(?label), "${query.toLowerCase()}"))
      FILTER(LANG(?label) = "en")
      OPTIONAL { ?item schema:description ?description . FILTER(LANG(?description) = "en") }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" . }
    }
    LIMIT ${limit}
  `;
  
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
  
  const response = await fetchWithTimeout(url, 8000);
  const data = await response.json();
  
  return (data.results?.bindings || []).map((binding: any) => ({
    id: binding.item?.value?.split('/').pop(),
    label: binding.itemLabel?.value,
    description: binding.description?.value,
    type: binding.typeLabel?.value,
    url: binding.item?.value
  }));
}

// USDA FoodData Central wrapper (requires API key)
async function searchUSDA(query: string, limit: number) {
  const apiKey = process.env.USDA_API_KEY || 'DEMO_KEY';
  const encodedQuery = encodeURIComponent(query);
  const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodedQuery}&pageSize=${limit}&api_key=${apiKey}`;
  
  const response = await fetchWithTimeout(url, 5000);
  const data = await response.json();
  
  return (data.foods || []).map((food: any) => ({
    id: food.fdcId,
    description: food.description,
    brand: food.brandName,
    category: food.foodCategory,
    nutrients: (food.foodNutrients || []).slice(0, 5).map((n: any) => ({
      name: n.nutrientName,
      value: n.value,
      unit: n.unitName
    })),
    dataType: food.dataType
  }));
}

// ClinicalTrials.gov wrapper
async function searchClinicalTrials(query: string, limit: number) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodedQuery}&pageSize=${limit}&format=json`;
  
  const response = await fetchWithTimeout(url, 5000);
  const data = await response.json();
  
  return (data.studies || []).map((study: any) => ({
    id: study.protocolSection?.identificationModule?.nctId,
    title: study.protocolSection?.identificationModule?.briefTitle,
    status: study.protocolSection?.statusModule?.overallStatus,
    phase: study.protocolSection?.designModule?.phases?.join(', '),
    conditions: study.protocolSection?.conditionsModule?.conditions,
    interventions: study.protocolSection?.armsInterventionsModule?.interventions?.map((i: any) => i.name),
    url: `https://clinicaltrials.gov/study/${study.protocolSection?.identificationModule?.nctId}`
  }));
}

// Utility: fetch with timeout
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}
