// components/DeFiYieldRadar.tsx - Yield farming opportunities
'use client';

import { useYieldOpportunities } from '@/hooks/useDeFiData';
import { useState } from 'react';

interface DeFiYieldRadarProps {
  enabled: boolean;
}

export function DeFiYieldRadar({ enabled }: DeFiYieldRadarProps) {
  const { pools, byRisk, isLoading } = useYieldOpportunities(1000000, 100, enabled);
  const [filter, setFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [expanded, setExpanded] = useState(false);

  if (!enabled) return null;

  if (isLoading) {
    return (
      <div className="bg-black/40 border border-zinc-800 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/3 mb-2"></div>
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-zinc-800 rounded" />)}</div>
      </div>
    );
  }

  const displayedPools = filter === 'all' ? pools : byRisk[filter];
  const topPools = expanded ? displayedPools : displayedPools.slice(0, 5);

  return (
    <div className="bg-black/40 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-xs text-green-500 uppercase tracking-wider">DeFi Yield Radar</span>
          </div>
          
          {/* Risk filter */}
          <div className="flex gap-1">
            {(['all', 'low', 'medium', 'high'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setFilter(r)}
                className={`text-[10px] px-2 py-1 rounded uppercase transition-colors ${
                  filter === r 
                    ? 'bg-zinc-700 text-white' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Pools list */}
      <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
        {topPools.map((pool) => (
          <div 
            key={pool.pool}
            className="flex items-center justify-between p-2 bg-zinc-900/30 rounded border border-zinc-800/50"
          >
            <div className="flex items-center gap-3">
              {/* Risk indicator */}
              <div className={`
                w-1 h-8 rounded-full
                ${pool.riskLevel === 'low' ? 'bg-green-500' : 
                  pool.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'}
              `} />
              
              <div>
                <div className="text-sm text-zinc-300">{pool.project} <span className="text-zinc-500">{pool.symbol}</span></div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <span>{pool.chain}</span>
                  <span>•</span>
                  <span>TVL: ${(pool.tvlUsd / 1000000).toFixed(2)}M</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className={`text-lg font-mono font-bold ${
                pool.apy > 20 ? 'text-red-400' : pool.apy > 10 ? 'text-yellow-400' : 'text-green-400'
              }`}>
                {pool.apy.toFixed(2)}%
              </div>
              <div className="text-[10px] text-zinc-500">APY</div>
            </div>
          </div>
        ))}
      </div>

      {/* Expand button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full py-2 text-xs text-zinc-500 hover:text-zinc-300 border-t border-zinc-800 transition-colors"
      >
        {expanded ? 'Show Less' : `Show All ${displayedPools.length} Pools`}
      </button>
    </div>
  );
}
