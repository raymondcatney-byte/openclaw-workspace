import { CyberEvent, EVENT_COLORS, EVENT_TYPE_LABELS, formatTimestamp } from '../utils/eventData';

interface EventPanelProps {
  events: CyberEvent[];
}

export default function EventPanel({ events }: EventPanelProps) {
  // Calculate statistics
  const stats = events.reduce((acc, event) => {
    acc[event.type] = (acc[event.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalEvents = events.length;
  const avgIntensity = events.reduce((sum, e) => sum + e.intensity, 0) / totalEvents;

  return (
    <div className="absolute top-4 right-4 z-10 w-80 bg-slate-900/80 backdrop-blur-md rounded-lg border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-transparent">
        <h2 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Live Cyber Events
        </h2>
      </div>

      {/* Statistics */}
      <div className="px-4 py-3 border-b border-cyan-500/20">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-800/50 rounded p-2">
            <span className="text-slate-400">Active Events: </span>
            <span className="text-cyan-400 font-mono font-bold">{totalEvents}</span>
          </div>
          <div className="bg-slate-800/50 rounded p-2">
            <span className="text-slate-400">Avg Intensity: </span>
            <span className="text-cyan-400 font-mono font-bold">{(avgIntensity * 100).toFixed(0)}%</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {Object.entries(stats).map(([type, count]) => (
            <span
              key={type}
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: `${EVENT_COLORS[type as CyberEvent['type']]}20`,
                color: EVENT_COLORS[type as CyberEvent['type']],
                border: `1px solid ${EVENT_COLORS[type as CyberEvent['type']]}40`,
              }}
            >
              {EVENT_TYPE_LABELS[type as CyberEvent['type']]}: {count}
            </span>
          ))}
        </div>
      </div>

      {/* Event List */}
      <div className="max-h-64 overflow-y-auto">
        {events.map((event) => (
          <div
            key={event.id}
            className="px-4 py-2 border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: EVENT_COLORS[event.type] }}
                />
                <span className="text-xs font-medium text-slate-200">
                  {event.city}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {formatTimestamp(event.timestamp)}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span
                className="text-[10px] font-medium"
                style={{ color: EVENT_COLORS[event.type] }}
              >
                {EVENT_TYPE_LABELS[event.type]}
              </span>
              <div className="flex items-center gap-1">
                <div className="w-12 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${event.intensity * 100}%`,
                      backgroundColor: EVENT_COLORS[event.type],
                    }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {(event.intensity * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-cyan-500/20 bg-slate-800/30">
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span>System Online • Auto-updating</span>
        </div>
      </div>
    </div>
  );
}
