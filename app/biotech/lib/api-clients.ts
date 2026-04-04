// app/biotech/lib/api-clients.ts
// Free-tier API clients for biotech data sources

import { ResearchPaper, ClinicalTrial, CompoundData, RedditPost, RSSItem, Patent } from '../types';

// ============================================================================
// Europe PMC API (Free, no key required)
// https://europepmc.org/RestfulWebService
// ============================================================================

export async function searchEuropePMC(
  query: string,
  category: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ papers: ResearchPaper[]; total: number }> {
  // Build category-specific queries
  let searchQuery = query;
  if (category !== 'all') {
    const categoryTerms: Record<string, string> = {
      longevity: '(longevity OR aging OR lifespan OR senescence OR "cellular aging")',
      'gene-therapy': '("gene therapy" OR "gene editing" OR crispr OR "viral vector")',
      nootropics: '(nootropic OR "cognitive enhancer" OR "smart drug" OR racetam)',
      clinical: '(clinical OR therapeutic OR treatment OR efficacy)',
    };
    searchQuery = `${query} AND ${categoryTerms[category] || ''}`;
  }

  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=${encodeURIComponent(
    searchQuery
  )}&format=json&page=${page}&pageSize=${pageSize}&sort_date=y`;

  const response = await fetch(url, { next: { revalidate: 3600 } });
  
  if (!response.ok) {
    throw new Error(`Europe PMC API error: ${response.status}`);
  }

  const data = await response.json();

  const papers: ResearchPaper[] = (data.resultList?.result || []).map((item: any) => ({
    id: `epmc-${item.id}`,
    title: item.title?.replace(/<\/?[^>]+(>|$)/g, '') || 'Untitled',
    authors: item.authorString?.split(', ') || [],
    journal: item.journalTitle || 'Unknown Journal',
    year: item.pubYear || new Date().getFullYear(),
    doi: item.doi,
    abstract: item.abstractText?.replace(/<\/?[^>]+(>|$)/g, '') || '',
    category: categorizePaper(item.title + ' ' + (item.abstractText || '')),
    keywords: item.meshHeadingList?.meshHeading?.map((h: any) => h.descriptorName) || [],
    pmid: item.pmid,
    pmcid: item.pmcid,
    url: item.doi ? `https://doi.org/${item.doi}` : `https://europepmc.org/article/MED/${item.pmid}`,
    publishedAt: item.firstPublicationDate || item.pubYear,
    citationCount: item.citedByCount || 0,
  }));

  return { papers, total: data.hitCount || 0 };
}

function categorizePaper(text: string): ResearchPaper['category'] {
  const lower = text.toLowerCase();
  if (lower.includes('longevity') || lower.includes('aging') || lower.includes('lifespan')) return 'longevity';
  if (lower.includes('gene therapy') || lower.includes('crispr') || lower.includes('viral vector')) return 'gene-therapy';
  if (lower.includes('nootropic') || lower.includes('cognitive') || lower.includes('racetam')) return 'nootropics';
  if (lower.includes('clinical') || lower.includes('trial') || lower.includes('therapeutic')) return 'clinical';
  return 'general';
}

// ============================================================================
// ClinicalTrials.gov API (Free, no key required)
// https://clinicaltrials.gov/data-api/api
// ============================================================================

export async function searchClinicalTrials(
  condition: string = 'longevity',
  status: string = 'all',
  page: number = 1,
  pageSize: number = 20
): Promise<{ trials: ClinicalTrial[]; total: number }> {
  const baseUrl = 'https://clinicaltrials.gov/api/v2/studies';
  
  const params = new URLSearchParams({
    'filter.overallStatus': status === 'all' ? '' : mapTrialStatus(status),
    'query.cond': condition,
    'pageSize': pageSize.toString(),
    'pageToken': page.toString(),
    'sort': '@relevance',
  });

  const url = `${baseUrl}?${params.toString()}`;
  
  const response = await fetch(url, { 
    headers: { 'Accept': 'application/json' },
    next: { revalidate: 1800 }
  });

  if (!response.ok) {
    throw new Error(`ClinicalTrials.gov API error: ${response.status}`);
  }

  const data = await response.json();

  const trials: ClinicalTrial[] = (data.studies || []).map((study: any) => {
    const protocol = study.protocolSection || {};
    const identification = protocol.identificationModule || {};
    const status = protocol.statusModule || {};
    const description = protocol.descriptionModule || {};
    const design = protocol.designModule || {};
    const eligibility = protocol.eligibilityModule || {};
    const contacts = protocol.contactsLocationsModule || {};
    
    return {
      id: `ct-${identification.nctId}`,
      nctId: identification.nctId,
      title: identification.briefTitle || 'Untitled Trial',
      briefSummary: description.briefSummary?.replace(/<\/?[^>]+(>|$)/g, '') || '',
      phase: design.phases?.[0] || 'Not Applicable',
      status: mapCTStatus(status.overallStatus),
      condition: protocol.conditionsModule?.conditions?.[0] || 'Unknown',
      intervention: protocol.armsInterventionsModule?.interventions?.[0]?.name || 'Unknown',
      sponsor: identification.organization?.fullName || 'Unknown',
      leadSponsor: protocol.sponsorCollaboratorsModule?.leadSponsor?.name,
      locations: (contacts.locations || []).map((loc: any) => ({
        facility: loc.facility || 'Unknown',
        city: loc.city || 'Unknown',
        state: loc.state,
        country: loc.country || 'Unknown',
        zip: loc.zip,
      })),
      startDate: status.startDateStruct?.date,
      completionDate: status.completionDateStruct?.date,
      enrollmentCount: design.enrollmentInfo?.count,
      gender: eligibility.sex || 'All',
      minAge: eligibility.minimumAge,
      maxAge: eligibility.maximumAge,
      healthyVolunteers: eligibility.healthyVolunteers,
      url: `https://clinicaltrials.gov/study/${identification.nctId}`,
      lastUpdate: status.lastUpdatePostDateStruct?.date || '',
    };
  });

  return { trials, total: data.totalCount || 0 };
}

function mapTrialStatus(status: string): string {
  const mapping: Record<string, string> = {
    recruiting: 'RECRUITING',
    active: 'ACTIVE_NOT_RECRUITING',
    completed: 'COMPLETED',
  };
  return mapping[status] || '';
}

function mapCTStatus(status: string): ClinicalTrial['status'] {
  const mapping: Record<string, ClinicalTrial['status']> = {
    RECRUITING: 'recruiting',
    ACTIVE_NOT_RECRUITING: 'active',
    COMPLETED: 'completed',
    SUSPENDED: 'suspended',
    WITHDRAWN: 'withdrawn',
    TERMINATED: 'terminated',
  };
  return mapping[status] || 'active';
}

// ============================================================================
// PubChem API (Free, no key required)
// https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest
// ============================================================================

export async function searchPubChem(name: string): Promise<CompoundData | null> {
  // First, search for CID
  const searchUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(
    name
  )}/cids/JSON`;

  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) return null;

  const searchData = await searchResponse.json();
  const cid = searchData.IdentifierList?.CID?.[0];
  if (!cid) return null;

  // Get compound details
  const detailsUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/JSON`;
  const detailsResponse = await fetch(detailsUrl);
  if (!detailsResponse.ok) return null;

  const details = await detailsResponse.json();
  const pc = details.PC_Compounds?.[0];
  if (!pc) return null;

  // Get properties
  const propsUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/IUPACName,MolecularFormula,MolecularWeight,IsomericSMILES,InChI,InChIKey/JSON`;
  const propsResponse = await fetch(propsUrl);
  const props = propsResponse.ok ? await propsResponse.json() : null;
  const prop = props?.PropertyTable?.Properties?.[0];

  // Get synonyms
  const synUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/synonyms/JSON`;
  const synResponse = await fetch(synUrl);
  const synonyms = synResponse.ok 
    ? (await synResponse.json()).InformationList?.Information?.[0]?.Synonym?.slice(0, 10) || []
    : [];

  return {
    id: `pubchem-${cid}`,
    cid,
    name: name,
    iupacName: prop?.IUPACName,
    molecularFormula: prop?.MolecularFormula || 'Unknown',
    molecularWeight: prop?.MolecularWeight || 0,
    smiles: prop?.IsomericSMILES,
    inchi: prop?.InChI,
    inchiKey: prop?.InChIKey,
    synonyms,
    description: undefined, // Would need additional API call
    drugCategories: [],
    structureUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG`,
    imageUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?image_size=large`,
  };
}

// ============================================================================
// Reddit API (Free tier via .json endpoints, no auth required for public posts)
// ============================================================================

export async function fetchRedditPosts(
  subreddit: string,
  sort: 'hot' | 'new' | 'top' = 'hot',
  limit: number = 25
): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=${limit}`;
  
  const response = await fetch(url, {
    headers: { 'User-Agent': 'BiotechResearchBot/1.0' },
    next: { revalidate: 600 }
  });

  if (!response.ok) {
    throw new Error(`Reddit API error: ${response.status}`);
  }

  const data = await response.json();

  return (data.data?.children || []).map((child: any) => {
    const post = child.data;
    return {
      id: `reddit-${post.id}`,
      subreddit: post.subreddit,
      title: post.title,
      selftext: post.selftext,
      author: post.author,
      permalink: `https://reddit.com${post.permalink}`,
      url: post.url,
      score: post.score,
      numComments: post.num_comments,
      createdUtc: post.created_utc,
      isSelf: post.is_self,
      category: categorizeRedditPost(post.title + ' ' + (post.selftext || '')),
    };
  });
}

function categorizeRedditPost(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('longevity') || lower.includes('aging')) return 'longevity';
  if (lower.includes('gene') || lower.includes('crispr')) return 'gene-therapy';
  if (lower.includes('nootropic') || lower.includes('cognitive')) return 'nootropics';
  return 'general';
}

// ============================================================================
// RSS Feed Fetcher (Generic)
// ============================================================================

export async function fetchRSSFeed(feedUrl: string, sourceName: string): Promise<RSSItem[]> {
  // Use a CORS proxy or RSS-to-JSON service
  // For production, consider using rss2json.com API (free tier) or similar
  const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`;
  
  const response = await fetch(apiUrl, { next: { revalidate: 1800 } });
  
  if (!response.ok) {
    // Fallback: return empty array
    return [];
  }

  const data = await response.json();

  return (data.items || []).map((item: any, index: number) => ({
    id: `rss-${sourceName}-${index}`,
    feedSource: sourceName,
    title: item.title,
    description: item.description?.replace(/<\/?[^>]+(>|$)/g, '').substring(0, 300),
    content: item.content,
    link: item.link,
    pubDate: item.pubDate,
    author: item.author,
    categories: item.categories || [],
  }));
}

// Predefined RSS feeds
export const BIOTECH_FEEDS = [
  { name: 'FierceBiotech', url: 'https://www.fiercebiotech.com/rss.xml' },
  { name: 'Longevity.Tech', url: 'https://longevity.technology/feed/' },
];

// ============================================================================
// Patent Search (USPTO Open Data API - Free)
// https://developer.uspto.gov/api-catalog
// ============================================================================

export async function searchPatents(
  query: string = 'longevity',
  limit: number = 20
): Promise<Patent[]> {
  const baseUrl = 'https://search.patentsview.org/api/v1/patent/search';
  
  const body = {
    q: {
      _or: [
        { patent_title: query },
        { patent_abstract: query },
      ],
    },
    f: ['patent_number', 'patent_title', 'patent_abstract', 'patent_date', 'assignee_organization', 'inventor_first_name', 'inventor_last_name'],
    s: [{ patent_date: 'desc' }],
    per_page: limit,
  };

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    next: { revalidate: 3600 }
  });

  if (!response.ok) {
    // PatentsView can be flaky, return empty array on error
    return [];
  }

  const data = await response.json();

  return (data.patents || []).map((p: any) => ({
    id: `patent-${p.patent_number}`,
    patentNumber: p.patent_number,
    title: p.patent_title,
    abstract: p.patent_abstract || '',
    assignee: p.assignee_organization?.[0],
    inventors: (p.inventor_first_name || []).map((fn: string, i: number) => 
      `${fn} ${p.inventor_last_name?.[i] || ''}`
    ),
    publishedDate: p.patent_date,
    url: `https://patents.google.com/patent/US${p.patent_number}`,
  }));
}

// ============================================================================
// Groq AI for Summarization (Free tier: 1M tokens/day)
// ============================================================================

export async function summarizeWithGroq(
  text: string,
  type: 'paper' | 'compound' | 'post' | 'trial',
  apiKey?: string
): Promise<string> {
  if (!apiKey) {
    return '';
  }

  const prompts: Record<string, string> = {
    paper: 'Summarize this research paper abstract in 2-3 sentences for a biohacker audience. Focus on practical implications and mechanisms:',
    compound: 'Explain the mechanism of action of this compound in simple terms. What does it do and how does it work?',
    post: 'Summarize this discussion post. What are the key points or claims being made?',
    trial: 'Summarize this clinical trial. What is being tested, what phase, and what are the key eligibility criteria?',
  };

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a scientific research assistant specializing in biotech and longevity research. Provide clear, accurate summaries.' },
        { role: 'user', content: `${prompts[type]}\n\n${text.substring(0, 4000)}` },
      ],
      temperature: 0.3,
      max_tokens: 200,
    }),
  });

  if (!response.ok) {
    return '';
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}
