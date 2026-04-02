// components/PolymarketOracleCard.tsx - Prediction market intelligence
'use client';

import { usePolymarketData } from '@/hooks/useDeFiData';
import { useState } from 'react';

interface PolymarketOracleCardProps {
  enabled: boolean;
}

export function PolymarketOracleCard({ enabled }: PolymarketOracleCardProps) {
  const { markets, isLoading } = usePolymarketData(enabled);
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!enabled) return null;

  if (isLoading) {
    return (
      <div className="bg-black/40 border border-zinc-800 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/3 mb-2"></div>
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="h-12 bg-zinc-800 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs text-purple-500 uppercase tracking-wider">Polymarket Oracle</span>
          </div>
          <div className="text-xs text-zinc-500">{markets.length} Active Markets</div>
        </div>
      </div>

      {/* Markets List */}
      <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
        {markets.slice(0, 5).map((market) => {
          const yesProb = market.outcomePrices.yes * 100;
          const noProb = market.outcomePrices.no * 100;
          const isYesDominant = yesProb > noProb;
          
          return (
            <div 
              key={market.id}
              className="bg-zinc-900/30 rounded p-3 border border-zinc-800/50 hover:border-zinc-700 transition-colors cursor-pointer"
              onClick={() => setExpanded(expanded === market.id ? null : market.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-sm text-zinc-300 leading-tight">{market.question}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-zinc-500 uppercase">{market.category}</span>
                    <span className="text-[10px] text-zinc-600">•</span>
                    <span className="text-[10px] text-zinc-500">
                      Vol: ${(market.volume / 1000000).toFixed(1)}M
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-lg font-mono font-bold ${
                    isYesDominant ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {isYesDominant ? yesProb.toFixed(1) : noProb.toFixed(1)}%
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {isYesDominant ? 'YES' : 'NO'}
                  </div>
                </div>
              </div>

              {/* Probability bar */}
              <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${isYesDominant ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${Math.max(yesProb, noProb)}%` }}
                />
              </div>

              {/* Expanded details */}
              {expanded === market.id && (
                <div className="mt-3 pt-3 border-t border-zinc-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">YES Probability:</span>
                    <span className="text-green-400">{yesProb.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">NO Probability:</span>
                    <span className="text-red-400">{noProb.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Liquidity:</span>
                    <span className="text-zinc-300">${market.liquidity.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Ends:</span>
                    <span className="text-zinc-300">{new Date(market.endDate).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-zinc-800 text-[10px] text-zinc-600">
        Data from Polymarket Gamma API • Prediction markets show crowd wisdom
      </div>
    </div>
  );
}
