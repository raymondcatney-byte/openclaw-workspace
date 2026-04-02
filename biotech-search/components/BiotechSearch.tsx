// components/BiotechSearch.tsx
'use client';

import { useState } from 'react';
import { BiotechSearchClient } from '@/lib/biotech-client';

export function BiotechSearch() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | 'peptides' | 'supplements' | 'nutrition' | 'research'>('all');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = new BiotechSearchClient();

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const data = await client.search({ query, category, limit: 20 });
      setResults(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search peptides, supplements, nutrition..."
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="px-4 py-2 border rounded-lg"
          >
            <option value="all">All</option>
            <option value="peptides">Peptides</option>
            <option value="supplements">Supplements</option>
            <option value="nutrition">Nutrition</option>
            <option value="research">Research</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
          Error: {error}
        </div>
      )}

      {results && (
        <div className="mt-6 space-y-6">
          <div className="text-sm text-gray-600">
            Found results in {Object.keys(results.sources).length} sources 
            ({results.meta.latency}ms)
          </div>

          {/* ChEMBL Results */}
          {results.sources.chembl?.status === 'success' && results.sources.chembl.count > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-2">Compounds (ChEMBL)</h3>
              <div className="grid gap-2">
                {results.sources.chembl.data.map((mol: any) => (
                  <div key={mol.id} className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium">{mol.name}</div>
                    <div className="text-sm text-gray-600">
                      {mol.formula} | MW: {mol.mw} | Phase: {mol.max_phase}
                    </div>
                    {mol.therapeutic_flag && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                        Therapeutic
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* PubMed Results */}
          {results.sources.pubmed?.status === 'success' && results.sources.pubmed.count > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-2">Research (PubMed)</h3>
              <div className="space-y-3">
                {results.sources.pubmed.data.map((paper: any) => (
                  <div key={paper.id} className="p-3 bg-gray-50 rounded border">
                    <a 
                      href={paper.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {paper.title}
                    </a>
                    <div className="text-sm text-gray-600">
                      {paper.authors.slice(0, 3).join(', ')}
                      {paper.authors.length > 3 && ' et al.'} • {paper.year}
                    </div>
                    <div className="text-sm text-gray-500">{paper.journal}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Wikidata Results */}
          {results.sources.wikidata?.status === 'success' && results.sources.wikidata.count > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-2">Knowledge Graph (Wikidata)</h3>
              <div className="grid gap-2">
                {results.sources.wikidata.data.map((item: any) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded border">
                    <a 
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {item.label}
                    </a>
                    <div className="text-sm text-gray-600">{item.description}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* USDA Results */}
          {results.sources.usda?.status === 'success' && results.sources.usda.count > 0 && (
            <section>
              <h3 className="text-lg font-semibold mb-2">Nutrition (USDA)</h3>
              <div className="grid gap-2">
                {results.sources.usda.data.map((food: any) => (
                  <div key={food.id} className="p-3 bg-gray-50 rounded border">
                    <div className="font-medium">{food.description}</div>
                    {food.brand && <div className="text-sm text-gray-600">{food.brand}</div>}
                    <div className="text-sm text-gray-500">{food.category}</div>
                    {food.nutrients && (
                      <div className="text-xs text-gray-500 mt-1">
                        {food.nutrients.map((n: any) => `${n.name}: ${n.value}${n.unit}`).join(' | ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
