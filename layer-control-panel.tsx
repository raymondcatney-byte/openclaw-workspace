import React from 'react';
import { motion } from 'framer-motion';
import { 
  Satellite, 
  Plane, 
  Activity, 
  TrendingUp,
  Radio,
  Eye,
  EyeOff,
  Layers
} from 'lucide-react';

const NERV = {
  orange: '#FF9800',
  amber: '#E8A03C',
  rust: '#8B5A2B',
  brown: '#5C3A1E',
  void: '#050505',
  alert: '#C9302C'
};

interface LayerControl {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  count?: number;
}

interface LayerControlPanelProps {
  activeLayers: {
    satellites: boolean;
    aircraft: boolean;
    earthquakes: boolean;
    markets: boolean;
    intel: boolean;
  };
  onToggle: (layer: keyof LayerControlPanelProps['activeLayers']) => void;
  counts?: {
    satellites: number;
    aircraft: number;
    earthquakes: number;
    markets: number;
    intel: number;
  };
}

export const LayerControlPanel: React.FC<LayerControlPanelProps> = ({
  activeLayers,
  onToggle,
  counts = { satellites: 0, aircraft: 0, earthquakes: 0, markets: 0, intel: 0 }
}) => {
  const layers: LayerControl[] = [
    {
      id: 'satellites',
      label: 'SATELLITES',
      icon: <Satellite size={16} />,
      color: '#4FC3F7',
      count: counts.satellites
    },
    {
      id: 'aircraft',
      label: 'AIRCRAFT',
      icon: <Plane size={16} />,
      color: '#81C784',
      count: counts.aircraft
    },
    {
      id: 'earthquakes',
      label: 'SEISMIC',
      icon: <Activity size={16} />,
      color: NERV.alert,
      count: counts.earthquakes
    },
    {
      id: 'markets',
      label: 'POLYMARKET',
      icon: <TrendingUp size={16} />,
      color: NERV.orange,
      count: counts.markets
    },
    {
      id: 'intel',
      label: 'INTEL FEED',
      icon: <Radio size={16} />,
      color: NERV.amber,
      count: counts.intel
    }
  ];

  return (
    <div 
      className="p-4 rounded-lg font-mono"
      style={{ 
        background: 'rgba(5, 5, 5, 0.9)',
        border: `2px solid ${NERV.rust}`,
        boxShadow: `0 0 20px rgba(232, 160, 60, 0.1)`
      }}
    >
      <div 
        className="flex items-center gap-2 mb-4 pb-2"
        style={{ borderBottom: `1px solid ${NERV.rust}` }}
      >
        <Layers size={18} color={NERV.amber} />
        <span className="text-sm tracking-widest" style={{ color: NERV.amber }}>
          DATA LAYERS
        </span>
      </div>
      
      <div className="space-y-2">
        {layers.map((layer) => {
          const isActive = activeLayers[layer.id as keyof typeof activeLayers];
          
          return (
            <motion.button
              key={layer.id}
              onClick={() => onToggle(layer.id as keyof typeof activeLayers)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-between p-3 rounded transition-all"
              style={{
                background: isActive ? 'rgba(232, 160, 60, 0.1)' : 'transparent',
                border: `1px solid ${isActive ? layer.color : NERV.rust}`,
                opacity: isActive ? 1 : 0.6
              }}
            >
              <div className="flex items-center gap-3">
                <span style={{ color: layer.color }}>
                  {layer.icon}
                </span>
                <span 
                  className="text-xs tracking-wider"
                  style={{ color: isActive ? NERV.amber : NERV.rust }}
                >
                  {layer.label}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {layer.count !== undefined && layer.count > 0 && (
                  <span 
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ 
                      background: isActive ? layer.color : NERV.rust,
                      color: NERV.void
                    }}
                  >
                    {layer.count}
                  </span>
                )}
                
003cspan style={{ color: isActive ? layer.color : NERV.rust }}>
                  {isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
      
      {/* Legend */}
      <div 
        className="mt-4 pt-4 space-y-2 text-xs"
        style={{ borderTop: `1px solid ${NERV.rust}`, color: NERV.rust }}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ background: NERV.alert }}
          />
          <span>CRITICAL</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ background: NERV.orange }}
          />
          <span>HIGH</span>
        </div>
        <div className="flex items-center gap-2">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ background: NERV.amber }}
          />
          <span>MEDIUM</span>
        </div>
      </div>
    </div>
  );
};
