-- Database schema for Biotech Protocol Tab
-- Compatible with Neon Postgres

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Research papers cache
CREATE TABLE IF NOT EXISTS research_papers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  authors TEXT[],
  journal TEXT,
  year INTEGER,
  doi TEXT,
  abstract TEXT,
  ai_summary TEXT,
  category TEXT CHECK (category IN ('longevity', 'gene-therapy', 'nootropics', 'clinical', 'general')),
  keywords TEXT[],
  pmid TEXT,
  pmcid TEXT,
  url TEXT,
  published_at TIMESTAMP,
  citation_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Clinical trials cache
CREATE TABLE IF NOT EXISTS clinical_trials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nct_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  brief_summary TEXT,
  phase TEXT,
  status TEXT CHECK (status IN ('recruiting', 'active', 'completed', 'suspended', 'withdrawn', 'terminated')),
  condition TEXT,
  intervention TEXT,
  sponsor TEXT,
  lead_sponsor TEXT,
  locations JSONB,
  start_date DATE,
  completion_date DATE,
  enrollment_count INTEGER,
  gender TEXT,
  min_age TEXT,
  max_age TEXT,
  healthy_volunteers BOOLEAN,
  url TEXT,
  last_update DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Compounds cache
CREATE TABLE IF NOT EXISTS compounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cid INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  iupac_name TEXT,
  molecular_formula TEXT,
  molecular_weight NUMERIC,
  smiles TEXT,
  inchi TEXT,
  inchi_key TEXT,
  synonyms TEXT[],
  description TEXT,
  mechanism_of_action TEXT,
  ai_summary TEXT,
  drug_categories TEXT[],
  pharmacology JSONB,
  fda_info JSONB,
  structure_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Intelligence items cache
CREATE TABLE IF NOT EXISTS intelligence_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id TEXT UNIQUE NOT NULL,
  type TEXT CHECK (type IN ('reddit', 'rss', 'patent')),
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  url TEXT NOT NULL,
  published_at TIMESTAMP,
  engagement JSONB,
  ai_summary TEXT,
  category TEXT CHECK (category IN ('longevity', 'gene-therapy', 'nootropics', 'general')),
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_papers_category ON research_papers(category);
CREATE INDEX IF NOT EXISTS idx_papers_published ON research_papers(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_trials_status ON clinical_trials(status);
CREATE INDEX IF NOT EXISTS idx_trials_phase ON clinical_trials(phase);
CREATE INDEX IF NOT EXISTS idx_compounds_name ON compounds(name);
CREATE INDEX IF NOT EXISTS idx_intelligence_type ON intelligence_items(type);
CREATE INDEX IF NOT EXISTS idx_intelligence_published ON intelligence_items(published_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_papers_updated_at ON research_papers;
CREATE TRIGGER update_papers_updated_at BEFORE UPDATE ON research_papers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_trials_updated_at ON clinical_trials;
CREATE TRIGGER update_trials_updated_at BEFORE UPDATE ON clinical_trials 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_compounds_updated_at ON compounds;
CREATE TRIGGER update_compounds_updated_at BEFORE UPDATE ON compounds 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_intelligence_updated_at ON intelligence_items;
CREATE TRIGGER update_intelligence_updated_at BEFORE UPDATE ON intelligence_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
