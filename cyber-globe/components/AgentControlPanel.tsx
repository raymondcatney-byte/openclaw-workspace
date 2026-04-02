// components/AgentControlPanel.tsx - Control the agentic system
'use client';

import { useState, useEffect } from 'react';
import { 
  getAgentState, 
  runAgentStep, 
  startAutonomousMode, 
  stopAutonomousMode,
  isAutonomousModeActive,
  addMemory,
  AgentMemory
} from '@/lib/agent-core';

export function AgentControlPanel() {
  const [state, setState] = useState(getAgentState());
  const [isAuto, setIsAuto] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [input, setInput] = useState('');
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Sync with localStorage on mount
  useEffect(() => {
    setState(getAgentState());
    setIsAuto(isAutonomousModeActive());
  }, []);

  const handleManualRun = async () => {
    setIsThinking(true);
    const result = await runAgentStep(input || undefined);
    setState(getAgentState());
    setLastAction(result.thought);
    setInput('');
    setIsThinking(false);
  };

  const toggleAutonomous = () => {
    if (isAuto) {
      stopAutonomousMode();
    } else {
      startAutonomousMode(5); // Check every 5 minutes
    }
    setIsAuto(!isAuto);
    setState(getAgentState());
  };

  const clearMemory = () => {
    localStorage.removeItem('bruce_wayne_agent_memory');
    setState(getAgentState());
  };

  return (
    <div className="bg-black/40 border border-cyan-500/30 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-cyan-500/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isAuto ? 'animate-pulse bg-green-500' : 'bg-zinc-500'}`} />
            <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-cyan-500 uppercase tracking-wider">Ghost Protocol Agent</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500">{state.memory.length} memories</span>
            <button
              onClick={toggleAutonomous}
              className={`text-[10px] px-2 py-1 rounded transition-colors ${
                isAuto 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
              }`}
            >
              {isAuto ? 'Auto: ON' : 'Auto: OFF'}
            </button>
          </div>        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Active Goals */}
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Active Goals</div>
          <div className="space-y-1">
            {state.goals.slice(0, 3).map((goal, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="text-cyan-500">→</span>
                <span className="text-zinc-300">{goal}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Manual Input */}
        <div className="space-y-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the agent to analyze something..."
            className="w-full bg-zinc-900/50 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50"
            onKeyDown={(e) => e.key === 'Enter' && handleManualRun()}
          />
          
          <div className="flex gap-2">
            <button
              onClick={handleManualRun}
              disabled={isThinking}
              className="flex-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded px-3 py-2 text-xs hover:bg-cyan-500/30 transition-colors disabled:opacity-50"
            >
              {isThinking ? 'Thinking...' : 'Run Analysis'}
            </button>
            
            <button
              onClick={clearMemory}
              className="px-3 py-2 text-xs text-zinc-500 hover:text-red-400 transition-colors"
              title="Clear memory"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Last Action */}
        {lastAction && (
          <div className="bg-zinc-900/30 rounded p-3 border border-zinc-800">
            <div className="text-[10px] text-zinc-500 uppercase mb-1">Last Action</div>
            <div className="text-xs text-zinc-300">{lastAction}</div>
          </div>
        )}

        {/* Recent Memory */}
        <div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2">Recent Activity</div>
          
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {state.memory.slice(-5).reverse().map((mem) => (
              <div key={mem.id} className="flex items-start gap-2 text-xs">
                <span className={`
                  text-[10px] px-1 rounded
                  ${mem.type === 'observation' ? 'bg-blue-500/20 text-blue-400' :
                    mem.type === 'action' ? 'bg-green-500/20 text-green-400' :
                    mem.type === 'goal' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-zinc-700 text-zinc-400'}
                `}
                >
                  {mem.type}
                </span>
                <span className="text-zinc-400 flex-1 truncate">{mem.content}</span>
                <span className="text-[10px] text-zinc-600">
                  {new Date(mem.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between text-[10px] text-zinc-600 pt-2 border-t border-zinc-800">
          <span>Memory: {state.memory.length} / 100</span>
          <span>{isAuto ? 'Checking every 5 min' : 'Manual mode'}</span>
        </div>
      </div>
    </div>
  );
}
