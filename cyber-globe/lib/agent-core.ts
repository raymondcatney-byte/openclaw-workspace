// lib/agent-core.ts - Lightweight agent system using Groq (client-side)
// No backend required - runs entirely in browser with localStorage memory

import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY, // Free tier
  dangerouslyAllowBrowser: true
});

// ============================================
// AGENT MEMORY SYSTEM (localStorage)
// ============================================

export interface AgentMemory {
  id: string;
  timestamp: number;
  type: 'observation' | 'action' | 'reflection' | 'goal';
  content: string;
  metadata?: Record<string, any>;
}

export interface AgentState {
  goals: string[];
  activeTask: string | null;
  lastAction: string | null;
  memory: AgentMemory[];
  createdAt: number;
}

const MEMORY_KEY = 'bruce_wayne_agent_memory';
const MAX_MEMORY_ITEMS = 100;

export function getAgentState(): AgentState {
  if (typeof window === 'undefined') return createInitialState();
  
  const stored = localStorage.getItem(MEMORY_KEY);
  if (!stored) return createInitialState();
  
  try {
    return JSON.parse(stored);
  } catch {
    return createInitialState();
  }
}

function createInitialState(): AgentState {
  return {
    goals: [
      'Monitor global markets for alpha opportunities',
      'Track geopolitical developments with financial impact',
      'Optimize personal protocols for peak performance',
      'Identify sovereign wealth preservation strategies'
    ],
    activeTask: null,
    lastAction: null,
    memory: [],
    createdAt: Date.now()
  };
}

export function saveAgentState(state: AgentState) {
  if (typeof window === 'undefined') return;
  
  // Keep only recent memories
  const trimmedState = {
    ...state,
    memory: state.memory.slice(-MAX_MEMORY_ITEMS)
  };
  
  localStorage.setItem(MEMORY_KEY, JSON.stringify(trimmedState));
}

export function addMemory(type: AgentMemory['type'], content: string, metadata?: any) {
  const state = getAgentState();
  
  state.memory.push({
    id: `mem_${Date.now()}`,
    timestamp: Date.now(),
    type,
    content,
    metadata
  });
  
  saveAgentState(state);
  return state;
}

// ============================================
// AGENT TOOLS (Functions Groq can call)
// ============================================

export const AGENT_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'fetch_market_data',
      description: 'Get current crypto market data from CoinGecko',
      parameters: {
        type: 'object',
        properties: {
          asset: { type: 'string', description: 'Asset symbol (bitcoin, ethereum)' }
        },
        required: ['asset']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'check_polymarket',
      description: 'Get prediction market odds for an event',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Event to search for' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_recent_news',
      description: 'Search for recent news articles',
      parameters: {
        type: 'object',
        properties: {
          keyword: { type: 'string' }
        },
        required: ['keyword']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'log_observation',
      description: 'Log an observation to agent memory',
      parameters: {
        type: 'object',
        properties: {
          observation: { type: 'string' },
          importance: { type: 'string', enum: ['low', 'medium', 'high'] }
        },
        required: ['observation', 'importance']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'set_goal',
      description: 'Set a new goal for the agent',
      parameters: {
        type: 'object',
        properties: {
          goal: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] }
        },
        required: ['goal', 'priority']
      }
    }
  }
];

// ============================================
// AGENT EXECUTION LOOP
// ============================================

export interface AgentAction {
  thought: string;
  action: string;
  toolCalls?: any[];
  completed: boolean;
}

export async function runAgentStep(userInput?: string): Promise<AgentAction> {
  const state = getAgentState();
  
  // Build context from memory
  const recentMemories = state.memory
    .slice(-10)
    .map(m => `[${m.type}] ${new Date(m.timestamp).toLocaleTimeString()}: ${m.content}`)
    .join('\n');
  
  const systemPrompt = `You are the Bruce Wayne Operations AI - a sovereign intelligence agent running entirely in the browser.

CURRENT STATE:
- Active Goals: ${state.goals.join(', ')}
- Last Action: ${state.lastAction || 'None'}
${state.activeTask ? `- Current Task: ${state.activeTask}` : ''}

RECENT MEMORY:
${recentMemories}

INSTRUCTIONS:
1. Analyze the situation and decide on the next best action
2. Use available tools to gather information or take action
3. Log important observations to memory
4. Be concise - you are running in a browser with limited context

Respond with your thought process and any tool calls you want to make.`;

  const messages: any[] = [
    { role: 'system', content: systemPrompt }
  ];
  
  if (userInput) {
    messages.push({ role: 'user', content: userInput });
  } else {
    messages.push({ 
      role: 'user', 
      content: 'Run an autonomous check. Review current data, log observations, and suggest next actions.' 
    });
  }

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // Fast, capable, cheap
      messages,
      tools: AGENT_TOOLS,
      tool_choice: 'auto',
      max_tokens: 500
    });

    const message = response.choices[0].message;
    
    // Execute tool calls
    if (message.tool_calls) {
      for (const toolCall of message.tool_calls) {
        await executeToolCall(toolCall);
      }
    }

    // Update state
    state.lastAction = message.content || 'Tool execution';
    saveAgentState(state);

    return {
      thought: message.content || 'Executed tool calls',
      action: state.lastAction,
      toolCalls: message.tool_calls,
      completed: true
    };

  } catch (error) {
    console.error('Agent step failed:', error);
    return {
      thought: 'Error occurred',
      action: 'Retry or check API key',
      completed: false
    };
  }
}

async function executeToolCall(toolCall: any) {
  const { name, arguments: argsString } = toolCall.function;
  const args = JSON.parse(argsString);

  switch (name) {
    case 'log_observation':
      addMemory('observation', args.observation, { importance: args.importance });
      break;
      
    case 'set_goal':
      const state = getAgentState();
      state.goals.push(`[${args.priority.toUpperCase()}] ${args.goal}`);
      saveAgentState(state);
      break;
      
    case 'fetch_market_data':
      // This would call your existing crypto API
      addMemory('observation', `Market check: ${args.asset}`, { type: 'market_check' });
      break;
      
    case 'check_polymarket':
      addMemory('observation', `Polymarket query: ${args.query}`, { type: 'prediction_check' });
      break;
      
    case 'search_recent_news':
      addMemory('observation', `News search: ${args.keyword}`, { type: 'news_check' });
      break;
  }
}

// ============================================
// AUTONOMOUS MODE (Simulated with Intervals)
// ============================================

let autonomousInterval: NodeJS.Timeout | null = null;

export function startAutonomousMode(intervalMinutes: number = 5) {
  if (autonomousInterval) clearInterval(autonomousInterval);
  
  // Log start
  addMemory('observation', `Autonomous mode activated. Checking every ${intervalMinutes} minutes.`, { 
    type: 'system',
    interval: intervalMinutes 
  });
  
  autonomousInterval = setInterval(async () => {
    await runAgentStep();
  }, intervalMinutes * 60 * 1000);
  
  // Run immediately
  runAgentStep();
}

export function stopAutonomousMode() {
  if (autonomousInterval) {
    clearInterval(autonomousInterval);
    autonomousInterval = null;
    addMemory('observation', 'Autonomous mode deactivated.', { type: 'system' });
  }
}

export function isAutonomousModeActive(): boolean {
  return autonomousInterval !== null;
}
