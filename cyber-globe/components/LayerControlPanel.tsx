// components/LayerControlPanel.tsx - Enhanced with financial layers
'use client';

import { useState } from 'react';

// Original data layer config
export interface LayerConfig {
  aircraft: boolean;
  satellites: boolean;
  earthquakes: boolean;
  weather: boolean;
}

// Financial layer config
export interface FinancialLayerConfig {
  polymarket: boolean;
  yields: boolean;
  whales: boolean;
  signals: boolean;
}

interface LayerControlPanelProps {
  config: LayerConfig;
  onChange: (config: LayerConfig) => void;
}

interface FinancialLayerControlProps {
  config: FinancialLayerConfig;
  onChange: (config: FinancialLayerConfig) => void;
}

const dataLayers: { key: keyof LayerConfig; label: string; description: string; color: string }[] = [
  { key: 'aircraft', label: 'Military Aircraft', description: 'Real-time ADS-B tracking via adsb.lol', color: 'bg-amber-500' },
  { key: 'satellites', label: 'Orbital Assets', description: '2000+ active satellites (CelesTrak)', color: 'bg-blue-500' },
  { key: 'earthquakes', label: 'Seismic Activity', description: 'USGS real-time earthquake feed', color: 'bg-red-500' },
  { key: 'weather', label: 'Environmental', description: 'Weather & air quality (Open-Meteo)', color: 'bg-cyan-500' }
];

const financialLayers: { key: keyof FinancialLayerConfig; label: string; description: string; color: string }[] = [
  { key: 'polymarket', label: 'Polymarket Oracle', description: 'Prediction market intelligence', color: 'bg-purple-500' },
  { key: 'yields', label: 'DeFi Yield Radar', description: 'Highest yield opportunities', color: 'bg-green-500' },
  { key: 'whales', label: 'Whale Watcher', description: 'On-chain smart money tracking', color: 'bg-amber-500' },
  { key: 'signals', label: 'Signal Engine', description: 'Correlated alpha signals', color: 'bg-cyan-500' }
];

export function LayerControlPanel({ config, onChange }: LayerControlPanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleLayer = (key: keyof LayerConfig) => {
    onChange({ ...config, [key]: !config[key] });
  };

  const activeCount = Object.values(config).filter(Boolean).length;

  return (
    <div className="absolute bottom-4 right-4 z-50">
      <div className="bg-black/90 border border-zinc-700 rounded-lg overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 7m0 13V7m0 0L9 4" />
            </svg>
            <span className="text-xs text-zinc-300 uppercase tracking-wider">Intelligence Layers</span>
            {activeCount > 0 && (
              <span className="text-[10px] bg-zinc-700 text-white px-1.5 py-0.5 rounded">{activeCount}</span>
            )}
          </div>
          <svg 
            className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Layer toggles */}
        {isOpen && (
          <div className="p-2 space-y-1 border-t border-zinc-800">
            {dataLayers.map(({ key, label, description, color }) => (
              <button
                key={key}
                onClick={() => toggleLayer(key)}
                className={`w-full px-3 py-2 rounded text-left transition-colors ${
                  config[key] ? 'bg-zinc-800/50' : 'hover:bg-zinc-800/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-4 h-4 rounded border flex items-center justify-center mt-0.5 transition-colors
                    ${config[key] ? `${color} border-transparent` : 'border-zinc-600 bg-transparent'}
                  `}>
                    {config[key] && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`text-xs ${config[key] ? 'text-white' : 'text-zinc-400'}`}>{label}</div>
                    <div className="text-[10px] text-zinc-500">{description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Financial layers control panel
export function FinancialLayerControl({ config, onChange }: FinancialLayerControlProps) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleLayer = (key: keyof FinancialLayerConfig) => {
    onChange({ ...config, [key]: !config[key] });
  };

  const activeCount = Object.values(config).filter(Boolean).length;

  return (
    <div className="absolute bottom-4 left-4 z-50">
      <div className="bg-black/90 border border-zinc-700 rounded-lg overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-xs text-cyan-400 uppercase tracking-wider">Financial Intelligence</span>
            {activeCount > 0 && (
              <span className="text-[10px] bg-cyan-900 text-cyan-300 px-1.5 py-0.5 rounded">{activeCount}</span>
            )}
          </div>
          <svg 
            className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Layer toggles */}
        {isOpen && (
          <div className="p-2 space-y-1 border-t border-zinc-800">
            {financialLayers.map(({ key, label, description, color }) => (
              <button
                key={key}
                onClick={() => toggleLayer(key)}
                className={`w-full px-3 py-2 rounded text-left transition-colors ${
                  config[key] ? 'bg-zinc-800/50' : 'hover:bg-zinc-800/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-4 h-4 rounded border flex items-center justify-center mt-0.5 transition-colors
                    ${config[key] ? `${color} border-transparent` : 'border-zinc-600 bg-transparent'}
                  `}
                  >
                    {config[key] && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`text-xs ${config[key] ? 'text-white' : 'text-zinc-400'}`}>{label}</div>
                    <div className="text-[10px] text-zinc-500">{description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
