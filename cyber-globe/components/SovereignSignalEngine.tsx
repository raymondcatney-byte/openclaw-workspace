// components/SovereignSignalEngine.tsx - Alpha signal correlation
'use client';

import { useSovereignSignals, useMarketOverview } from '@/hooks/useDeFiData';
import { useState } from 'react';

interface SovereignSignalEngineProps {
  enabled: boolean;
}

export function SovereignSignalEngine({ enabled }: SovereignSignalEngineProps) {
  const { signals, highConfidence, isLoading } = useSovereignSignals(enabled);
  const { fearGreed } = useMarketOverview(enabled);
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);

  if (!enabled) return null;

  if (isLoading) {
    return (
      <div className="bg-black/40 border border-zinc-800 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-zinc-800 rounded w-1/3 mb-2"></div>
        <div className="h-20 bg-zinc-800 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-zinc-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-xs text-cyan-500 uppercase tracking-wider">Sovereign Signal Engine</span>
          </div>
          
          <div className="flex items-center gap-3">
            {fearGreed && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-500">Market Sentiment:</span>
                <span className={`text-xs font-mono ${fearGreed.color}`}>{fearGreed.value}</span>
              </div>
            )}
            <div className="text-xs text-zinc-500">{signals.length} Signals</div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {signals.length === 0 ? (
          <div className="text-center py-8 text-zinc-600">
            <div className="text-sm">No high-confidence signals detected</div>
            <div className="text-xs mt-1">Monitoring Polymarket, on-chain data, and market conditions...</div>
          </div>
        ) : (
          signals.map((signal) => (
            <div 
              key={signal.id}
              className={`
                p-3 rounded border cursor-pointer transition-all
                ${selectedSignal === signal.id 
                  ? 'bg-cyan-950/30 border-cyan-500/50' 
                  : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700'}
                ${signal.confidence >= 0.8 ? 'border-l-4 border-l-green-500' : 
                  signal.confidence >= 0.7 ? 'border-l-4 border-l-yellow-500' : 
                  'border-l-4 border-l-zinc-500'}
              `}
              onClick={() => setSelectedSignal(selectedSignal === signal.id ? null : signal.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`
                      text-[10px] px-1.5 py-0.5 rounded uppercase
                      ${signal.type === 'TRADE' ? 'bg-green-500/20 text-green-400' :
                        signal.type === 'HEDGE' ? 'bg-red-500/20 text-red-400' :
                        signal.type === 'YIELD' ? 'bg-blue-500/20 text-blue-400' :
                        signal.type === 'POLITICAL_ALPHA' ? 'bg-purple-500/20 text-purple-400' :
                        'bg-yellow-500/20 text-yellow-400'}
                    `}>
                      {signal.type}
                    </span>
                    
                    <span className="text-xs text-zinc-500">
                      Confidence: {(signal.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  
                  <div className="text-sm text-zinc-300">{signal.thesis}</div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    {signal.dataSources.map((source) => (
                      <span key={source} className="text-[10px] text-zinc-600">{source}</span>
                    ))}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-zinc-500">
                    {new Date(signal.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {selectedSignal === signal.id && (
                <div className="mt-3 pt-3 border-t border-zinc-800 space-y-3">
                  <div className="text-xs text-zinc-400">{signal.summary}</div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-950/50 rounded p-2">
                      <div className="text-[10px] text-zinc-500 uppercase mb-1">Human Action</div>
                      <div className="text-xs text-cyan-400">{signal.actions.human}</div>
                    </div>
                    
                    <div className="bg-zinc-950/50 rounded p-2">
                      <div className="text-[10px] text-zinc-500 uppercase mb-1">Agent Action</div>
                      <div className="text-xs text-amber-400">{signal.actions.agent}</div>
                    </div>
                  </div>
                  
                  {signal.actions.autoExecute && (
                    <div className="flex items-center gap-2 text-xs text-green-400">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      Auto-execution enabled
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
