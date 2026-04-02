// components/OnChainWhaleWatcher.tsx - Whale activity monitoring
'use client';

import { useWhaleWatcher } from '@/hooks/useDeFiData';

interface OnChainWhaleWatcherProps {
  enabled: boolean;
}

export function OnChainWhaleWatcher({ enabled }: OnChainWhaleWatcherProps) {
  const { swaps, accumulationSignals, isLoading } = useWhaleWatcher(100000, 20, enabled);

  if (!enabled) return null;

  if (isLoading) {
    return (
      <div className="bg-black/40 border border-zinc-800 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/3 mb-2"></div>
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-10 bg-zinc-800 rounded" />)}</div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
            <span className="text-xs text-amber-500 uppercase tracking-wider">On-Chain Whale Watcher</span>
          </div>
          <div className="text-xs text-zinc-500">>$100k Swaps</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
        {/* Accumulation Signals */}
        <div className="p-4 border-b lg:border-b-0 lg:border-r border-zinc-800">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">Accumulation Signals</div>
          
          {accumulationSignals.length > 0 ? (
            <div className="space-y-2">
              {accumulationSignals.slice(0, 5).map(([token, data]) => (
                <div key={token} className="flex items-center justify-between p-2 bg-zinc-900/30 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-zinc-300">{token}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-300">{data.count} buys</div>
                    <div className="text-[10px] text-green-400">${(data.totalUsd / 1000000).toFixed(2)}M</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-zinc-600">No significant accumulation detected</div>
          )}
        </div>

        {/* Recent Whale Swaps */}
        <div className="p-4 max-h-64 overflow-y-auto">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-3">Recent Whale Moves</div>
          
          <div className="space-y-2">
            {swaps.slice(0, 8).map((swap, idx) => {
              const timeAgo = Math.floor((Date.now() / 1000 - swap.timestamp) / 60);
              const isBuy = swap.token0Symbol.match(/USDC|USDT|DAI/i);
              
              return (
                <div key={idx} className="flex items-center justify-between p-2 bg-zinc-900/30 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <span className={isBuy ? 'text-green-400' : 'text-red-400'}>
                      {isBuy ? 'BUY' : 'SELL'}
                    </span>
                    <span className="text-zinc-500">{swap.token0Symbol} → {swap.token1Symbol}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-zinc-300">${(swap.amountUSD / 1000).toFixed(0)}k</div>
                    <div className="text-[10px] text-zinc-600">{timeAgo}m ago</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
