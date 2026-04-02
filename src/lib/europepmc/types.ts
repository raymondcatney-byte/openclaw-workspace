/**
 * Europe PMC API Types
 * 
 * Type definitions for Europe PMC REST API responses
 * @see https://europepmc.org/RestfulWebService
 */

// ============================================================================
// Search Request Parameters
// ============================================================================

/**
 * Result type options for Europe PMC search
 * - idlist: Returns only IDs and sources
 * - lite: Returns key metadata (default)
 * - core: Returns full metadata including abstract, full text links, MeSH terms
 */
export type EuropePMCResultType = 'idlist' | 'lite' | 'core';

/**
 * Response format options
 */
export type EuropePMCFormat = 'json' | 'xml' | 'dc';

/**
 * Sort options for search results
 */
export type EuropePMCSort = 
  | 'P_PDATE_D'      // Publication date descending (default)
  | 'P_PDATE_A'      // Publication date ascending
  | 'P_RANK_D'       // Relevance descending
  | 'P_RANK_A'       // Relevance ascending
  | 'CITED_D'        // Citation count descending
  | 'CITED_A';       // Citation count ascending

/**
 * Available source databases in Europe PMC
 */
export type EuropePMCSource = 
  | 'MED'    // MEDLINE/PubMed
  | 'PMC'    // PubMed Central
  | 'PPR'    // Preprints
  | 'AGR'    // Agricola
  | 'CBA'    // Chinese Biological Abstracts
  | 'CTX'    // CiteXplore
  | 'ETH'    // ETH Zurich
  | 'HIR'    // NHS Evidence
  | 'IMR'    // Institution repositories
  | 'WOS'    // Web of Science
  | 'PAT'    // Patents
  | 'SBL'    // Swiss Institute of Bioinformatics
  | 'NBK';   // NCBI Bookshelf

/**
 * Search request parameters
 */
export interface EuropePMCSearchParams {
  /** Search query in Europe PMC syntax */
  query: string;
  /** Result type: idlist | lite | core */
  resultType?: EuropePMCResultType;
  /** Output format: json | xml | dc */
  format?: EuropePMCFormat;
  /** Number of results per page (default: 25, max: 1000) */
  pageSize?: number;
  /** Cursor for pagination (obtained from previous response) */
  cursorMark?: string;
  /** Sort order */
  sort?: EuropePMCSort;
  /** Return facets (counts by type) */
  facetqueries?: string[];
  /** Synonym expansion (default: true) */
  synonym?: boolean;
  /** Email for API contact (optional but recommended) */
  email?: string;
}

// ============================================================================
// Core API Response Types
// ============================================================================

/**
 * Main API response wrapper
 */
export interface EuropePMCResponse {
  /** API version */
  version: string;
  /** Query hit count */
  hitCount: number;
  /** Cursor for next page */
  nextCursorMark?: string;
  /** Search request details */
  request: EuropePMCRequestInfo;
  /** Search results */
  resultList: {
    result: EuropePMCResult[];
  };
  /** Facet counts if requested */
  facetList?: EuropePMCFacet[];
}

/**
 * Request information returned in response
 */
export interface EuropePMCRequestInfo {
  /** Original query string */
  query: string;
  /** Result type used */
  resultType: EuropePMCResultType;
  /** Cursor mark used */
  cursorMark: string;
  /** Page size */
  pageSize: number;
  /** Sort order */
  sort?: string;
  /** Whether synonym expansion was used */
  synonym: boolean;
}

/**
 * Individual search result
 * Fields vary based on resultType parameter
 */
export interface EuropePMCResult {
  // Identification
  id: string;
  source: EuropePMCSource;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  
  // Core metadata
  title: string;
  authorString?: string;
  authors?: EuropePMCAuthor[];
  
  // Publication info
  journalTitle?: string;
  journalVolume?: string;
  journalIssue?: string;
  pageInfo?: string;
  pubYear?: string;
  pubDate?: string;
  firstPublicationDate?: string;
  
  // Content
  abstractText?: string;
  keywords?: string[];
  
  // MeSH terms (Medical Subject Headings)
  meshHeadingList?: {
    meshHeading: EuropePMCMeSHHeading[];
  };
  
  // Chemical/compound information
  chemicalList?: {
    chemical: EuropePMCChemical[];
  };
  
  // Gene/protein information
  geneProteinList?: {
    geneProtein: EuropePMCGeneProtein[];
  };
  
  // GRIF (Gene Related Information Finder) data
  grifList?: {
    grif: EuropePMCGRIF[];
  };
  
  // Publication characteristics
  pubType?: string;
  publicationType?: string;
  publicationTypeList?: {
    publicationType: string[];
  };
  isOpenAccess: 'Y' | 'N';
  inEPMC: 'Y' | 'N';
  inPMC: 'Y' | 'N';
  hasPDF?: 'Y' | 'N';
  hasBook?: 'Y' | 'N';
  hasSuppl?: 'Y' | 'N';
  
  // Citations and references
  citedByCount: number;
  hasReferences?: 'Y' | 'N';
  referenceList?: {
    reference: EuropePMCReference[];
  };
  
  // Text mining annotations
  hasTextMinedTerms?: 'Y' | 'N';
  hasDbCrossReferences?: 'Y' | 'N';
  hasLabsLinks?: 'Y' | 'N';
  hasTMAccessionNumbers?: 'Y' | 'N';
  
  // Additional metadata
  efoList?: {
    efoTerm: EuropePMCEFOTerm[];
  };
  goList?: {
    goTerm: EuropePMCGOTerm[];
  };
  
  // Full text availability
  fullTextUrlList?: {
    fullTextUrl: EuropePMCFullTextUrl[];
  };
  
  // Comments/corrections
  commentCorrectionList?: {
    commentCorrection: EuropePMCCommentCorrection[];
  };
  
  // Dates
  firstIndexDate: string;
  versionNumber?: number;
}

/**
 * Author information
 */
export interface EuropePMCAuthor {
  fullName: string;
  firstName?: string;
  lastName?: string;
  initials?: string;
  authorId?: {
    type: string;
    value: string;
  };
  affiliation?: string;
}

/**
 * MeSH heading with qualifiers
 */
export interface EuropePMCMeSHHeading {
  majorTopic_YN: 'Y' | 'N';
  descriptorName: string;
  meshQualifierList?: {
    meshQualifier: {
      abbreviation: string;
      qualifierName: string;
      majorTopic_YN: 'Y' | 'N';
    }[];
  };
}

/**
 * Chemical/compound mention
 */
export interface EuropePMCChemical {
  name: string;
  registryNumber?: string;
}

/**
 * Gene/protein mention
 */
export interface EuropePMCGeneProtein {
  term: string;
  dbName?: string;
  dbId?: string;
}

/**
 * GRIF (Gene Related Information Finder) entry
 */
export interface EuropePMCGRIF {
  term: string;
  geneSymbol: string;
  description?: string;
}

/**
 * EFO (Experimental Factor Ontology) term
 */
export interface EuropePMCEFOTerm {
  term: string;
  uri?: string;
}

/**
 * GO (Gene Ontology) term
 */
export interface EuropePMCGOTerm {
  term: string;
  uri?: string;
  goId?: string;
}

/**
 * Reference/Citation
 */
export interface EuropePMCReference {
  id?: string;
  source?: string;
  pmid?: string;
  pmcid?: string;
  doi?: string;
  title?: string;
  authorString?: string;
  citedOrder?: number;
  publicationDate?: string;
  label?: string;
}

/**
 * Full text URL information
 */
export interface EuropePMCFullTextUrl {
  availability: string;
  availabilityCode: 'OA' | 'N' | 'S' | 'F' | 'D';
  documentStyle: string;
  site: string;
  url: string;
}

/**
 * Comment or correction to article
 */
export interface EuropePMCCommentCorrection {
  id: string;
  source: string;
  reference: string;
  type: string;
  order?: number;
}

/**
 * Facet information for result filtering
 */
export interface EuropePMCFacet {
  name: string;
  values: {
    value: EuropePMCFacetValue[];
  };
}

export interface EuropePMCFacetValue {
  value: string;
  count: number;
}

// ============================================================================
// Full Text XML Types
// ============================================================================

/**
 * Full text XML response (separate endpoint)
 * Endpoint: /{PMCID}/fullTextXML
 */
export interface EuropePMCFullTextResponse {
  pmcid: string;
  pmid?: string;
  doi?: string;
  title?: string;
  body?: string;  // XML content
  // Additional fields parsed from XML
}

// ============================================================================
// Protocol Consultant Specific Types
// ============================================================================

/**
 * Biohacking compound categories for focused search
 */
export enum CompoundCategory {
  SUPPLEMENT = 'supplement',
  PEPTIDE = 'peptide',
  VITAMIN = 'vitamin',
  MINERAL = 'mineral',
  NOOTROPIC = 'nootropic',
  CRISPR = 'crispr',
  GENE_THERAPY = 'gene_therapy',
  BIO_OPTIMIZATION = 'bio_optimization',
  HORMONE = 'hormone',
  ENZYME = 'enzyme',
}

/**
 * Search focus areas for compound research
 */
export interface ResearchFocus {
  /** Include mechanism of action studies */
  mechanismOfAction?: boolean;
  /** Include dosage/clinical studies */
  dosage?: boolean;
  /** Include safety/adverse effects */
  safety?: boolean;
  /** Include efficacy outcomes */
  efficacy?: boolean;
  /** Include bioavailability/pharmacokinetics */
  bioavailability?: boolean;
  /** Include interactions */
  interactions?: boolean;
  /** Include human studies only */
  humanStudiesOnly?: boolean;
  /** Include clinical trials */
  clinicalTrials?: boolean;
  /** Year range filter */
  yearRange?: { from?: number; to?: number };
}

/**
 * Extracted key findings from literature
 */
export interface ExtractedFindings {
  compoundName: string;
  category: CompoundCategory;
  
  /** Mechanism of action findings */
  mechanisms: {
    description: string;
    confidence: 'high' | 'medium' | 'low';
    source: string;
    pmid: string;
  }[];
  
  /** Dosage information from studies */
  dosages: {
    amount: string;
    frequency?: string;
    duration?: string;
    population?: string;
    indication?: string;
    form?: string;  // oral, IV, etc.
    studyType: 'RCT' | 'observational' | 'in-vitro' | 'animal';
    pmid: string;
  }[];
  
  /** Safety profile information */
  safety: {
    adverseEffects: string[];
    contraindications: string[];
    interactions: string[];
    warnings: string[];
    source: string;
    pmid: string;
  };
  
  /** Key efficacy outcomes */
  efficacy: {
    outcome: string;
    effect: string;
    pValue?: string;
    confidenceInterval?: string;
    population: string;
    pmid: string;
  }[];
  
  /** Total studies analyzed */
  totalStudies: number;
  /** Open access studies available */
  openAccessCount: number;
}

/**
 * API Error response
 */
export interface EuropePMCError {
  /** HTTP status code */
  statusCode: number;
  /** Error message */
  message: string;
  /** Error type */
  type: 'rate_limit' | 'network' | 'parse' | 'validation' | 'server';
  /** Original error if available */
  originalError?: unknown;
  /** Retry after timestamp (for rate limits) */
  retryAfter?: number;
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  /** Number of requests remaining */
  remaining: number;
  /** Time window in seconds */
  resetWindow: number;
  /** Whether currently rate limited */
  isLimited: boolean;
  /** Next allowed request time */
  nextRequestAt?: number;
}
