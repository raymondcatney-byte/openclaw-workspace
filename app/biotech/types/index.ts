// app/biotech/types/index.ts
// Biotech Protocol Tab type definitions

export interface ResearchPaper {
  id: string;
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi?: string;
  abstract: string;
  aiSummary?: string;
  category: 'longevity' | 'gene-therapy' | 'nootropics' | 'clinical' | 'general';
  keywords: string[];
  pmid?: string;
  pmcid?: string;
  url: string;
  publishedAt: string;
  citationCount?: number;
}

export interface ClinicalTrial {
  id: string;
  nctId: string;
  title: string;
  briefSummary: string;
  phase: 'Phase 1' | 'Phase 2' | 'Phase 3' | 'Phase 4' | 'Early Phase 1' | 'Not Applicable';
  status: 'recruiting' | 'active' | 'completed' | 'suspended' | 'withdrawn' | 'terminated';
  condition: string;
  intervention: string;
  sponsor: string;
  leadSponsor?: string;
  locations: TrialLocation[];
  startDate?: string;
  completionDate?: string;
  enrollmentCount?: number;
  gender: 'All' | 'Male' | 'Female';
  minAge?: string;
  maxAge?: string;
  healthyVolunteers?: boolean;
  url: string;
  lastUpdate: string;
}

export interface TrialLocation {
  facility: string;
  city: string;
  state?: string;
  country: string;
  zip?: string;
}

export interface CompoundData {
  id: string;
  cid: number; // PubChem CID
  name: string;
  iupacName?: string;
  molecularFormula: string;
  molecularWeight: number;
  smiles?: string;
  inchi?: string;
  inchiKey?: string;
  synonyms: string[];
  description?: string;
  mechanismOfAction?: string;
  aiSummary?: string;
  drugCategories: string[];
  pharmacology?: {
    indication?: string;
    pharmacodynamics?: string;
    mechanism?: string;
    absorption?: string;
    toxicity?: string;
  };
  fdaInfo?: {
    brandNames: string[];
    genericName?: string;
    drugClass?: string;
    indication?: string;
    dosageForm?: string;
    route?: string;
    warnings?: string[];
  };
  structureUrl?: string;
  imageUrl?: string;
}

export interface IntelligenceItem {
  id: string;
  type: 'reddit' | 'rss' | 'patent';
  source: string;
  title: string;
  content: string;
  url: string;
  publishedAt: string;
  engagement?: {
    score?: number;
    comments?: number;
    upvotes?: number;
  };
  aiSummary?: string;
  category: 'longevity' | 'gene-therapy' | 'nootropics' | 'general';
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  selftext?: string;
  author: string;
  permalink: string;
  url: string;
  score: number;
  numComments: number;
  createdUtc: number;
  isSelf: boolean;
  aiSummary?: string;
  category: string;
}

export interface RSSItem {
  id: string;
  feedSource: string;
  title: string;
  description?: string;
  content?: string;
  link: string;
  pubDate?: string;
  author?: string;
  categories?: string[];
  aiSummary?: string;
}

export interface Patent {
  id: string;
  patentNumber: string;
  title: string;
  abstract: string;
  assignee?: string;
  inventors: string[];
  filedDate?: string;
  publishedDate?: string;
  url: string;
  claims?: string[];
  aiSummary?: string;
}

export type ResearchCategory = 'all' | 'longevity' | 'gene-therapy' | 'nootropics' | 'clinical';
export type TrialStatus = 'all' | 'recruiting' | 'active' | 'completed';
export type IntelligenceType = 'all' | 'reddit' | 'rss' | 'patent';

export interface BiotechFeedFilters {
  researchCategory: ResearchCategory;
  trialStatus: TrialStatus;
  intelligenceType: IntelligenceType;
  dateRange: '24h' | '7d' | '30d' | 'all';
  searchQuery?: string;
}

export interface BiotechStats {
  totalPapers: number;
  activeTrials: number;
  recruitingTrials: number;
  compoundsTracked: number;
  intelligenceItems24h: number;
  lastUpdate: string;
}
