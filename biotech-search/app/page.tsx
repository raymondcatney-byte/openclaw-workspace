// app/page.tsx
import { BiotechSearch } from '@/components/BiotechSearch';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Biotech Search Engine</h1>
          <p className="text-gray-600 mt-1">
            Search across PubMed, ChEMBL, Wikidata, USDA, and ClinicalTrials.gov
          </p>
        </div>
      </header>
      
      <div className="py-8">
        <BiotechSearch />
      </div>
      
      <footer className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-gray-500">
        <p>Free, open-source biotech search • No API keys required for most sources</p>
        <p className="mt-1">Data from NIH, EMBL-EBI, Wikimedia, USDA</p>
      </footer>
    </main>
  );
}
