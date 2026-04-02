import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-4xl font-bold text-emerald-500">Wayne Protocol</h1>
        <p className="text-gray-400 text-lg">
          Precision protocol consultation. No logging, no tracking, just answers.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            href="/protocol"
            className="bg-gray-900 border border-gray-800 hover:border-emerald-500 rounded-lg p-6 transition-colors"
          >
            <div className="text-3xl mb-2">⚡</div>
            <h2 className="text-xl font-semibold text-white mb-2">Protocol Consultant</h2>
            <p className="text-sm text-gray-500">Biomarker input → Adjusted protocol output</p>
          </Link>
          
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 opacity-50">
            <div className="text-3xl mb-2">📊</div>
            <h2 className="text-xl font-semibold text-white mb-2">Protocol Log</h2>
            <p className="text-sm text-gray-500">Coming soon: Track history</p>
          </div>
        </div>
        
        <div className="text-xs text-gray-600 pt-8">
          Stateless mode • No persistence • Refresh = clean slate
        </div>
      </div>
    </main>
  );
}