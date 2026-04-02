import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      <div className="max-w-3xl text-center space-y-8">
        <div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Health & Biotech
            <span className="text-blue-500"> Research Agent</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto">
            AI-powered health research combining live web search, 
            vector memory, and knowledge graphs for evidence-based answers.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <Link 
            href="/research"
            className="group bg-gray-900 border border-gray-800 hover:border-blue-500 rounded-xl p-6 transition-all hover:bg-gray-800"
          >
            <div className="text-3xl mb-3">🔬</div>
            <h2 className="text-xl font-semibold text-white mb-2">Research Mode</h2>
            <p className="text-sm text-gray-500 mb-4">
              Ask any health or biotech question. Agent searches web, 
              synthesizes sources, and provides citations.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-1 rounded">PubMed</span>
              <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-1 rounded">Examine.com</span>
              <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-1 rounded">Web Search</span>
            </div>
          </Link>
          
          <Link 
            href="/protocol"
            className="group bg-gray-900 border border-gray-800 hover:border-emerald-500 rounded-xl p-6 transition-all hover:bg-gray-800"
          >
            <div className="text-3xl mb-3">⚡</div>
            <h2 className="text-xl font-semibold text-white mb-2">Protocol Mode</h2>
            <p className="text-sm text-gray-500 mb-4">
              Personal protocol consultation with biomarker parsing, 
              interaction checking, and memory.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded">Wayne Protocol</span>
              <span className="text-xs bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded">Interactions</span>
              <span className="text-xs bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded">Memory</span>
            </div>
          </Link>
        </div>
        
        <div className="border-t border-gray-800 pt-8 max-w-2xl">
          <h3 className="text-sm font-semibold text-gray-400 mb-4">Powered By</h3>
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            <span className="bg-gray-900 text-gray-500 px-3 py-1.5 rounded-full">Groq LLM</span>
            <span className="bg-gray-900 text-gray-500 px-3 py-1.5 rounded-full">Pinecone Vector DB</span>
            <span className="bg-gray-900 text-gray-500 px-3 py-1.5 rounded-full">Neo4j Knowledge Graph</span>
            <span className="bg-gray-900 text-gray-500 px-3 py-1.5 rounded-full">Brave Search</span>
            <span className="bg-gray-900 text-gray-500 px-3 py-1.5 rounded-full">PubMed API</span>
          </div>
        </div>
        
        <p className="text-xs text-gray-600">
          Not medical advice. For research purposes only.
        </p>
      </div>
    </main>
  );
}