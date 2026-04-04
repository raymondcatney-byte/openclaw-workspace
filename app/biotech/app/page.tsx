'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  FileText, 
  FlaskConical, 
  Activity, 
  TrendingUp, 
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Filter,
  RefreshCw,
  Beaker,
  Dna,
  Brain,
  Microscope,
  MessageSquare,
  Rss,
  Lightbulb
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ResearchPaper, ClinicalTrial, CompoundData, RedditPost, RSSItem, Patent } from '../types';

// ============================================================================
// Utility
// ============================================================================

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Types
// ============================================================================

type Tab = 'research' | 'compounds' | 'intelligence';
type ResearchCategory = 'all' | 'longevity' | 'gene-therapy' | 'nootropics' | 'clinical';

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function BiotechDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('research');
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                <Dna className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Biotech Protocol</h1>
                <p className="text-xs text-slate-500">Research · Compounds · Intelligence</p>
              </div>
            </div>

            <nav className="flex items-center gap-1">
              {[
                { id: 'research', label: 'Research', icon: Microscope },
                { id: 'compounds', label: 'Compounds', icon: Beaker },
                { id: 'intelligence', label: 'Intelligence', icon: Activity },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'research' && <ResearchTab />}
            {activeTab === 'compounds' && <CompoundsTab />}
            {activeTab === 'intelligence' && <IntelligenceTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// ============================================================================
// Research Tab
// ============================================================================

function ResearchTab() {
  const [category, setCategory] = useState<ResearchCategory>('all');
  const [type, setType] = useState<'papers' | 'trials'>('papers');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<(ResearchPaper | ClinicalTrial)[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/biotech/api/research?type=${type}&q=${encodeURIComponent(searchQuery)}&category=${category}`
      );
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error('Failed to fetch research:', error);
    } finally {
      setIsLoading(false);
    }
  }, [type, category, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setType('papers')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
              type === 'papers'
                ? "bg-cyan-500/20 text-cyan-400"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <FileText className="w-4 h-4" />
            Papers
          </button>
          <button
            onClick={() => setType('trials')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
              type === 'trials'
                ? "bg-purple-500/20 text-purple-400"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            <FlaskConical className="w-4 h-4" />
            Trials
          </button>
        </div>

        <div className="h-6 w-px bg-slate-700" />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as ResearchCategory)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          <option value="all">All Categories</option>
          <option value="longevity">Longevity</option>
          <option value="gene-therapy">Gene Therapy</option>
          <option value="nootropics">Nootropics</option>
          <option value="clinical">Clinical</option>
        </select>

        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search research..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-50"
        >
          <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
        </button>
      </div>

      {/* Results */}
      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Microscope className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No research found</p>
          </div>
        ) : (
          items.map((item) => (
            'nctId' in item ? (
              <TrialCard key={item.id} trial={item} />
            ) : (
              <PaperCard key={item.id} paper={item} />
            )
          ))
        )}
      </div>
    </div>
  );
}

function PaperCard({ paper }: { paper: ResearchPaper }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-cyan-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-slate-100 leading-tight">{paper.title}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {paper.authors.slice(0, 3).join(', ')}{paper.authors.length > 3 && ' et al.'} · {paper.journal} · {paper.year}
              </p>
            </div>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              paper.category === 'longevity' && "bg-emerald-500/10 text-emerald-400",
              paper.category === 'gene-therapy' && "bg-purple-500/10 text-purple-400",
              paper.category === 'nootropics' && "bg-amber-500/10 text-amber-400",
              paper.category === 'clinical' && "bg-cyan-500/10 text-cyan-400",
            )}>
              {paper.category}
            </span>
          </div>

          {paper.aiSummary && (
            <div className="mt-3 p-3 bg-slate-800/50 rounded-lg border-l-2 border-emerald-500">
              <p className="text-sm text-slate-300"><span className="text-emerald-400 font-medium">AI Summary: </span>{paper.aiSummary}</p>
            </div>
          )}

          {expanded && (
            <div className="mt-3 text-sm text-slate-400 space-y-2">
              <p>{paper.abstract.substring(0, 500)}...</p>
              {paper.citationCount && (
                <p className="text-xs">Cited {paper.citationCount} times</p>
              )}
            </div>
          )}

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1"
            >
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {expanded ? 'Show less' : 'Read more'}
            </button>
            <a
              href={paper.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              View Paper
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function TrialCard({ trial }: { trial: ClinicalTrial }) {
  const statusColors: Record<string, string> = {
    recruiting: 'bg-emerald-500/10 text-emerald-400',
    active: 'bg-blue-500/10 text-blue-400',
    completed: 'bg-slate-500/10 text-slate-400',
    suspended: 'bg-amber-500/10 text-amber-400',
    terminated: 'bg-red-500/10 text-red-400',
  };

  return (
    <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-purple-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-medium text-slate-100 leading-tight">{trial.title}</h3>
              <p className="text-sm text-slate-500 mt-1">
                {trial.sponsor} · {trial.phase} · {trial.condition}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                statusColors[trial.status] || statusColors.active
              )}>
                {trial.status}
              </span>
              {trial.enrollmentCount && (
                <span className="text-xs text-slate-500">
                  N={trial.enrollmentCount.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <p className="mt-3 text-sm text-slate-400 line-clamp-2">{trial.briefSummary}</p>

          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            {trial.startDate && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Started {trial.startDate}
              </span>
            )}
            {trial.locations.length > 0 && (
              <span>{trial.locations.length} location{trial.locations.length !== 1 ? 's' : ''}</span>
            )}
            <a
              href={trial.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              ClinicalTrials.gov
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Compounds Tab
// ============================================================================

function CompoundsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [compound, setCompound] = useState<CompoundData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const search = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    
    try {
      const res = await fetch(`/biotech/api/compounds?name=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setCompound(data.compound || null);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="Search compound (e.g., Metformin, NMN, Rapamycin)..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <button
            onClick={search}
            disabled={isLoading}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
          >
            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Search'}
          </button>
        </div>
      </div>

      {/* Results */}
      {compound && <CompoundDetail compound={compound} />}
    </div>
  );
}

function CompoundDetail({ compound }: { compound: CompoundData }) {
  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Left: Structure & Basic Info */}
      <div className="lg:col-span-1 space-y-4">
        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
          <h3 className="text-lg font-semibold text-white mb-2">{compound.name}</h3>
          {compound.iupacName && (
            <p className="text-xs text-slate-500 mb-4">{compound.iupacName}</p>
          )}
          
          {compound.imageUrl && (
            <div className="aspect-square bg-slate-800 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src={compound.imageUrl} 
                alt={compound.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Molecular Properties</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Formula</span>
              <span className="text-slate-200 font-mono">{compound.molecularFormula}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Weight</span>
              <span className="text-slate-200">{compound.molecularWeight.toFixed(2)} g/mol</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">CID</span>
              <a 
                href={`https://pubchem.ncbi.nlm.nih.gov/compound/${compound.cid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300"
              >
                {compound.cid}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Details */}
      <div className="lg:col-span-2 space-y-4">
        {compound.synonyms.length > 0 && (
          <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Synonyms</h4>
            <div className="flex flex-wrap gap-2">
              {compound.synonyms.slice(0, 10).map((syn, i) => (
                <span key={i} className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400">
                  {syn}
                </span>
              ))}
            </div>
          </div>
        )}

        {compound.aiSummary && (
          <div className="p-4 bg-slate-900/50 rounded-xl border-l-2 border-emerald-500">
            <h4 className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Summary
            </h4>
            <p className="text-sm text-slate-300">{compound.aiSummary}</p>
          </div>
        )}

        {compound.pharmacology?.mechanism && (
          <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Mechanism of Action</h4>
            <p className="text-sm text-slate-400">{compound.pharmacology.mechanism}</p>
          </div>
        )}

        {compound.smiles && (
          <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
            <h4 className="text-sm font-medium text-slate-300 mb-2">SMILES</h4>
            <code className="text-xs text-slate-400 break-all">{compound.smiles}</code>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Intelligence Tab
// ============================================================================

function IntelligenceTab() {
  const [activeSource, setActiveSource] = useState<'all' | 'reddit' | 'rss' | 'patent'>('all');
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/biotech/api/intelligence?type=${activeSource}&limit=30`);
      const data = await res.json();
      
      // Combine and sort all items
      const allItems: any[] = [];
      if (data.reddit) allItems.push(...data.reddit.map((r: any) => ({ ...r, sourceType: 'reddit' })));
      if (data.rss) allItems.push(...data.rss.map((r: any) => ({ ...r, sourceType: 'rss' })));
      if (data.patents) allItems.push(...data.patents.map((p: any) => ({ ...p, sourceType: 'patent' })));
      
      // Sort by date
      allItems.sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.pubDate || a.publishedDate || 0);
        const dateB = new Date(b.publishedAt || b.pubDate || b.publishedDate || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setItems(allItems.slice(0, 30));
    } catch (error) {
      console.error('Failed to fetch intelligence:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeSource]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const sourceIcons: Record<string, any> = {
    reddit: MessageSquare,
    rss: Rss,
    patent: Lightbulb,
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-2 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
        {[
          { id: 'all', label: 'All Sources' },
          { id: 'reddit', label: 'Reddit' },
          { id: 'rss', label: 'News' },
          { id: 'patent', label: 'Patents' },
        ].map((source) => (
          <button
            key={source.id}
            onClick={() => setActiveSource(source.id as any)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              activeSource === source.id
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-slate-400 hover:text-slate-200"
            )}
          >
            {source.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="grid gap-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No intelligence items found</p>
          </div>
        ) : (
          items.map((item, index) => {
            const Icon = sourceIcons[item.sourceType] || Activity;
            
            return (
              <a
                key={index}
                href={item.url || item.link || item.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                    item.sourceType === 'reddit' && "bg-orange-500/10 text-orange-400",
                    item.sourceType === 'rss' && "bg-blue-500/10 text-blue-400",
                    item.sourceType === 'patent' && "bg-yellow-500/10 text-yellow-400",
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-500">
                        {item.sourceType === 'reddit' && `r/${item.subreddit}`}
                        {item.sourceType === 'rss' && item.feedSource}
                        {item.sourceType === 'patent' && item.assignee || 'Patent'}
                      </span>
                      <span className="text-slate-600">·</span>
                      <span className="text-xs text-slate-500">
                        {new Date(item.publishedAt || item.pubDate || item.publishedDate || Date.now()).toLocaleDateString()}
                      </span>
                      {item.score && (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="text-xs text-orange-400">⬆ {item.score}</span>
                        </>
                      )}
                    </div>

                    <h3 className="font-medium text-slate-200 group-hover:text-emerald-400 transition-colors">
                      {item.title}
                    </h3>

                    {item.aiSummary && (
                      <p className="mt-2 text-sm text-slate-400 line-clamp-2">{item.aiSummary}</p>
                    )}

                    {!item.aiSummary && item.description && (
                      <p className="mt-2 text-sm text-slate-400 line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}
