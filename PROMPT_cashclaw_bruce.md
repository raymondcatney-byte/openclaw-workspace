# CashClaw Bruce — Kimi Agentic Coding Prompt

## Vibe
Bruce evolves from search engine to autonomous intelligence agent. Still tactical, still fast — but now self-directed. He detects his own work, quotes his own costs, executes without waiting, and learns from every interaction. Think special ops with a budget and a memory.

---

## Core Concept

**CashClaw Pattern Applied to Bruce:**

```
FIND          →  Detect intelligence gaps across all tabs
QUOTE         →  Estimate token cost for deep research
EXECUTE       →  Perform multi-source search + synthesis
GET PAID      →  Capture user feedback (👍/👎 = training signal)
LEARN         →  Evolve prompt patterns weekly
```

---

## Tech Stack
- Next.js 14+ App Router
- Groq API (llama-3.3-70b-versatile)
- Vercel Edge + Vercel Cron (weekly evolution)
- Upstash Redis (task queue, feedback tracking)
- LocalStorage (evolution state, user preferences)

---

## File Structure

```
app/
├── api/
│   └── bruce/
│       ├── search/route.ts      # Existing: user-initiated search
│       ├── task/route.ts        # NEW: queue autonomous task
│       └── evolve/route.ts      # NEW: weekly evolution endpoint
components/
├── bruce/
│   ├── BruceSearch.tsx          # Existing search UI
│   ├── BruceTaskQueue.tsx       # NEW: pending tasks panel
│   └── BruceFeedback.tsx        # NEW: 👍/👎 buttons on results
lib/
├── bruce/
│   ├── search.ts                # Existing search logic
│   ├── cashclaw.ts              # NEW: core agentic loop
│   ├── detector.ts              # NEW: cross-tab gap detection
│   ├── quoter.ts                # NEW: token cost estimation
│   ├── executor.ts              # NEW: multi-step execution
│   ├── evolution.ts             # NEW: weekly learning loop
│   └── types.ts                 # Extended types
hooks/
├── useBruceAgent.ts             # NEW: React hook for agentic features
└── useBruceFeedback.ts          # NEW: Feedback capture
```

---

## Core Types

```typescript
// lib/bruce/types.ts

export type TaskType = 
  | 'RESEARCH_ANOMALY'      // War Room: unusual pattern detected
  | 'RESEARCH_CONTEXT'      // War Room: data needs explanation
  | 'RESEARCH_CONFLICT'     // Protocol: supplement interaction
  | 'RESEARCH_QUERY'        // Intelligence: user question
  | 'CORRELATE_SOURCES';    // Multi-source synthesis

export interface BruceTask {
  id: string;
  type: TaskType;
  status: 'PENDING' | 'QUOTED' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'REJECTED';
  
  // Detection context
  sourceTab: 'warroom' | 'protocol' | 'intelligence';
  trigger: string;           // What triggered this task
  context: string;           // Full context
  
  // Quote phase
  estimatedTokens: number;
  estimatedCost: string;     // Human readable
  confidence: number;        // 0-1, auto-execute if >0.8
  
  // Execution
  sources: string[];         // Target sources to query
  result?: string;           // Final output
  
  // Payment (feedback)
  feedback?: 'up' | 'down' | null;
  feedbackNotes?: string;
  
  // Metadata
  createdAt: number;
  completedAt?: number;
}

export interface EvolutionState {
  generation: number;        // Week number
  patterns: PromptPattern[]; // A/B tested patterns
  performance: {
    taskType: TaskType;
    avgRating: number;
    totalTasks: number;
  }[];
}

export interface PromptPattern {
  id: string;
  name: string;
  template: string;
  usageCount: number;
  avgRating: number;
  isWinner: boolean;
}
```

---

## Cross-Tab Detection Engine

```typescript
// lib/bruce/detector.ts

import { BruceTask, TaskType } from './types';

interface DetectionContext {
  warroom?: {
    aircraft?: any[];
    satellites?: any[];
    seismic?: any[];
    lastUpdate: number;
  };
  protocol?: {
    biomarkers?: any;
    stackConflicts?: string[];
  };
  intelligence?: {
    recentQueries: string[];
  };
}

export const detectTasks = (context: DetectionContext): Partial<BruceTask>[] = {
  const tasks: Partial<BruceTask>[] = [];
  
  // WAR ROOM DETECTIONS
  if (context.warroom?.aircraft) {
    // Detect formation flights
    const formations = detectFormations(context.warroom.aircraft);
    if (formations.length > 0) {
      tasks.push({
        type: 'RESEARCH_ANOMALY',
        sourceTab: 'warroom',
        trigger: 'military_formation_detected',
        context: `${formations.length} aircraft in unusual formation near ${formations[0].location}`,
        sources: ['ADS-B history', 'NOTAM database', 'military exercise trackers'],
        estimatedTokens: 1200,
        estimatedCost: '~1,200 tokens',
        confidence: 0.75
      });
    }
    
    // Detect transponder gaps
    const darkFlights = detectTransponderGaps(context.warroom.aircraft);
    if (darkFlights.length > 0) {
      tasks.push({
        type: 'RESEARCH_ANOMALY',
        sourceTab: 'warroom',
        trigger: 'transponder_gap',
        context: `${darkFlights.length} aircraft with transponder gaps`,
        sources: ['Flight history', 'aviation forums', 'military tracking'],
        estimatedTokens: 1000,
        estimatedCost: '~1,000 tokens',
        confidence: 0.6
      });
    }
  }
  
  // Seismic anomalies
  if (context.warroom?.seismic) {
    const suspicious = context.warroom.seismic.filter(e => 
      e.depth < 10 && e.magnitude > 4
    );
    
    for (const event of suspicious) {
      tasks.push({
        type: 'RESEARCH_ANOMALY',
        sourceTab: 'warroom',
        trigger: 'suspicious_seismic',
        context: `Shallow ${event.magnitude} magnitude event at ${event.location}`,
        sources: ['USGS', 'CTBTO', 'nuclear test monitors', 'local news'],
        estimatedTokens: 1500,
        estimatedCost: '~1,500 tokens',
        confidence: 0.7
      });
    }
  }
  
  // PROTOCOL DETECTIONS
  if (context.protocol?.stackConflicts) {
    for (const conflict of context.protocol.stackConflicts) {
      tasks.push({
        type: 'RESEARCH_CONFLICT',
        sourceTab: 'protocol',
        trigger: 'supplement_interaction',
        context: `Potential interaction: ${conflict}`,
        sources: ['Examine.com', 'PubMed', 'nutrition research'],
        estimatedTokens: 800,
        estimatedCost: '~800 tokens',
        confidence: 0.85
      });
    }
  }
  
  // Biomarker gaps
  if (context.protocol?.biomarkers) {
    const b = context.protocol.biomarkers;
    if (b.sleep < 5 && !b.adjustmentMade) {
      tasks.push({
        type: 'RESEARCH_CONTEXT',
        sourceTab: 'protocol',
        trigger: 'poor_recovery_detected',
        context: `Sleep ${b.sleep}h, HRV ${b.hrv} — research recovery protocols`,
        sources: ['sleep research', 'HRV studies', 'recovery protocols'],
        estimatedTokens: 1000,
        estimatedCost: '~1,000 tokens',
        confidence: 0.8
      });
    }
  }
  
  return tasks;
};

// Helper functions
const detectFormations = (aircraft: any[]) => {
  // Group by location + time + military type
  const military = aircraft.filter(a => a.type === 'military');
  const groups = groupByProximity(military, 10); // 10km radius
  return groups.filter(g => g.length >= 3);
};

const detectTransponderGaps = (aircraft: any[]) => {
  return aircraft.filter(a => {
    const gaps = a.transponderHistory?.filter((t: any) => t.status === 'off');
    return gaps?.length > 0;
  });
};

const groupByProximity = (items: any[], radiusKm: number) => {
  // Haversine grouping logic
  const groups: any[][] = [];
  // ... implementation
  return groups;
};
```

---

## CashClaw Core Engine

```typescript
// lib/bruce/cashclaw.ts

import { BruceTask } from './types';
import { detectTasks } from './detector';
import { executeTask } from './executor';
import { recordFeedback } from './evolution';

const REDIS_URL = process.env.UPSTASH_REDIS_URL;

export class CashClawBruce {
  private userAutoApprove: boolean = false;
  private tokenBudget: number = 10000; // Daily Groq budget
  private tokensUsed: number = 0;
  
  // Main entry: scan for work
  async scan(context: DetectionContext): Promise<BruceTask[]> {
    const detected = detectTasks(context);
    const tasks: BruceTask[] = [];
    
    for (const partial of detected) {
      const task: BruceTask = {
        id: crypto.randomUUID(),
        status: 'PENDING',
        createdAt: Date.now(),
        ...partial
      } as BruceTask;
      
      // Auto-promote high confidence
      if (task.confidence > 0.8 && this.userAutoApprove) {
        task.status = 'APPROVED';
        this.execute(task);
      } else {
        task.status = 'QUOTED';
      }
      
      tasks.push(task);
      await this.saveTask(task);
    }
    
    return tasks;
  }
  
  // User approves/rejects quoted task
  async approve(taskId: string): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task || task.status !== 'QUOTED') return;
    
    task.status = 'APPROVED';
    await this.saveTask(task);
    await this.execute(task);
  }
  
  async reject(taskId: string): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) return;
    
    task.status = 'REJECTED';
    await this.saveTask(task);
    
    // Feedback: rejection is negative signal
    await recordFeedback(taskId, 'down', 'User rejected quote');
  }
  
  // Execute approved task
  private async execute(task: BruceTask): Promise<void> {
    task.status = 'EXECUTING';
    await this.saveTask(task);
    
    // Check budget
    if (this.tokensUsed + task.estimatedTokens > this.tokenBudget) {
      task.status = 'PENDING';
      task.result = 'Token budget exceeded. Resume tomorrow or upgrade.';
      await this.saveTask(task);
      return;
    }
    
    // Execute
    const result = await executeTask(task);
    
    task.result = result;
    task.status = 'COMPLETED';
    task.completedAt = Date.now();
    this.tokensUsed += task.estimatedTokens;
    
    await this.saveTask(task);
  }
  
  // Capture feedback
  async feedback(taskId: string, rating: 'up' | 'down', notes?: string): Promise<void> {
    const task = await this.getTask(taskId);
    if (!task) return;
    
    task.feedback = rating;
    task.feedbackNotes = notes;
    await this.saveTask(task);
    
    await recordFeedback(taskId, rating, notes);
  }
  
  // Storage helpers
  private async saveTask(task: BruceTask): Promise<void> {
    if (REDIS_URL) {
      await fetch(`${REDIS_URL}/set/bruce:task:${task.id}`, {
        method: 'POST',
        body: JSON.stringify(task)
      });
    } else {
      localStorage.setItem(`bruce:task:${task.id}`, JSON.stringify(task));
    }
  }
  
  private async getTask(id: string): Promise<BruceTask | null> {
    if (REDIS_URL) {
      const res = await fetch(`${REDIS_URL}/get/bruce:task:${id}`);
      return res.json();
    }
    const data = localStorage.getItem(`bruce:task:${id}`);
    return data ? JSON.parse(data) : null;
  }
  
  // Settings
  setAutoApprove(value: boolean) {
    this.userAutoApprove = value;
    localStorage.setItem('bruce:autoApprove', String(value));
  }
}

export const bruce = new CashClawBruce();
```

---

## Task Executor

```typescript
// lib/bruce/executor.ts

import { BruceTask } from './types';

export const executeTask = async (task: BruceTask): Promise<string> => {
  const prompt = buildExecutionPrompt(task);
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { 
          role: 'system', 
          content: `You are Bruce (tactical intelligence) executing a research task.
Be concise, factual, cite sources. Format as intelligence brief.` 
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: task.estimatedTokens
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
};

const buildExecutionPrompt = (task: BruceTask): string => {
  const prompts: Record<TaskType, string> = {
    RESEARCH_ANOMALY: `Research this anomaly and provide intelligence assessment:

ANOMALY: ${task.context}
TARGET SOURCES: ${task.sources.join(', ')}

Provide:
1. What this likely is
2. Historical precedents
3. Confidence level
4. Recommended action`,

    RESEARCH_CONTEXT: `Research context for operational decision:

SITUATION: ${task.context}
TARGET SOURCES: ${task.sources.join(', ')}

Provide:
1. Key facts
2. Relevant research findings
3. Recommended protocol adjustment`,

    RESEARCH_CONFLICT: `Research supplement/medication interaction:

CONCERN: ${task.context}
TARGET SOURCES: ${task.sources.join(', ')}

Provide:
1. Interaction severity (none/mild/moderate/severe)
2. Mechanism
3. Recommended timing separation
4. Confidence in data`,

    RESEARCH_QUERY: `Answer user query with multi-source synthesis:

QUERY: ${task.context}
TARGET SOURCES: ${task.sources.join(', ')}

Provide comprehensive answer with citations.`,

    CORRELATE_SOURCES: `Correlate multiple data sources:

TASK: ${task.context}
SOURCES TO CORRELATE: ${task.sources.join(', ')}

Provide:
1. Points of agreement
2. Points of conflict
3. Synthesis
4. Confidence assessment`
  };
  
  return prompts[task.type] || prompts.RESEARCH_QUERY;
};
```

---

## Evolution Engine

```typescript
// lib/bruce/evolution.ts

import { BruceTask, EvolutionState, PromptPattern } from './types';

const EVOLUTION_KEY = 'bruce:evolution';

// Weekly cron endpoint
export const runEvolution = async (): Promise<void> => {
  const state = await loadEvolutionState();
  
  // Get all completed tasks with feedback
  const tasks = await getCompletedTasksLastWeek();
  
  // Calculate performance by task type
  const performance = calculatePerformance(tasks);
  
  // Evaluate prompt patterns
  const winners = state.patterns.filter(p => p.avgRating > 0.7);
  const losers = state.patterns.filter(p => p.avgRating < 0.4);
  
  // Propagate winners
  for (const winner of winners) {
    // Create 2 variants with small mutations
    const variants = generateVariants(winner);
    state.patterns.push(...variants);
  }
  
  // Retire losers
  state.patterns = state.patterns.filter(p => p.avgRating >= 0.4);
  
  // Update state
  state.generation++;
  state.performance = performance;
  
  await saveEvolutionState(state);
};

export const recordFeedback = async (
  taskId: string, 
  rating: 'up' | 'down',
  notes?: string
): Promise<void> => {
  const score = rating === 'up' ? 1 : 0;
  
  // Update pattern performance if task used one
  const state = await loadEvolutionState();
  const task = await getTask(taskId);
  
  if (task?.patternId) {
    const pattern = state.patterns.find(p => p.id === task.patternId);
    if (pattern) {
      pattern.usageCount++;
      pattern.avgRating = ((pattern.avgRating * (pattern.usageCount - 1)) + score) / pattern.usageCount;
    }
  }
  
  await saveEvolutionState(state);
};

// Helpers
const loadEvolutionState = async (): Promise<EvolutionState> = {
  const data = localStorage.getItem(EVOLUTION_KEY);
  if (data) return JSON.parse(data);
  
  // Initial state
  return {
    generation: 1,
    patterns: [
      {
        id: 'default-anomaly',
        name: 'Default Anomaly Research',
        template: 'Research this anomaly...',
        usageCount: 0,
        avgRating: 0.5,
        isWinner: true
      }
    ],
    performance: []
  };
};

const saveEvolutionState = async (state: EvolutionState): Promise<void> => {
  localStorage.setItem(EVOLUTION_KEY, JSON.stringify(state));
};

const calculatePerformance = (tasks: BruceTask[]) => {
  const byType: Record<string, { total: number; score: number }> = {};
  
  for (const task of tasks) {
    if (!byType[task.type]) {
      byType[task.type] = { total: 0, score: 0 };
    }
    byType[task.type].total++;
    if (task.feedback === 'up') byType[task.type].score++;
  }
  
  return Object.entries(byType).map(([type, data]) => ({
    taskType: type as any,
    avgRating: data.score / data.total,
    totalTasks: data.total
  }));
};

const generateVariants = (pattern: PromptPattern): PromptPattern[] => {
  // A/B test small changes to winning patterns
  const mutations = [
    { ...pattern, template: pattern.template + '\n\nBe extra concise.', id: crypto.randomUUID() },
    { ...pattern, template: pattern.template.replace('Provide:', 'List:'), id: crypto.randomUUID() }
  ];
  
  return mutations.map(m => ({
    ...m,
    usageCount: 0,
    avgRating: 0.5,
    isWinner: false
  }));
};

const getCompletedTasksLastWeek = async (): Promise<BruceTask[]> => {
  // Fetch from Redis or localStorage
  return [];
};

const getTask = async (id: string): Promise<BruceTask | null> => {
  const data = localStorage.getItem(`bruce:task:${id}`);
  return data ? JSON.parse(data) : null;
};
```

---

## React Hook

```typescript
// hooks/useBruceAgent.ts

import { useState, useEffect, useCallback } from 'react';
import { CashClawBruce, bruce } from '@/lib/bruce/cashclaw';
import { BruceTask, DetectionContext } from '@/lib/bruce/types';

export const useBruceAgent = () => {
  const [pendingTasks, setPendingTasks] = useState<BruceTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<BruceTask[]>([]);
  const [scanning, setScanning] = useState(false);
  
  // Scan for work across tabs
  const scan = useCallback(async (context: DetectionContext) => {
    setScanning(true);
    const tasks = await bruce.scan(context);
    setPendingTasks(tasks.filter(t => t.status === 'QUOTED' || t.status === 'PENDING'));
    setCompletedTasks(tasks.filter(t => t.status === 'COMPLETED'));
    setScanning(false);
    return tasks;
  }, []);
  
  // Approve a quoted task
  const approve = useCallback(async (taskId: string) => {
    await bruce.approve(taskId);
    // Refresh lists
  }, []);
  
  // Reject a quoted task
  const reject = useCallback(async (taskId: string) => {
    await bruce.reject(taskId);
    // Refresh lists
  }, []);
  
  // Submit feedback
  const feedback = useCallback(async (taskId: string, rating: 'up' | 'down', notes?: string) => {
    await bruce.feedback(taskId, rating, notes);
  }, []);
  
  return {
    pendingTasks,
    completedTasks,
    scanning,
    scan,
    approve,
    reject,
    feedback
  };
};
```

---

## UI Components

```tsx
// components/bruce/BruceTaskQueue.tsx

'use client';

import { BruceTask } from '@/lib/bruce/types';

interface Props {
  tasks: BruceTask[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const BruceTaskQueue = ({ tasks, onApprove, onReject }: Props) => {
  const quoted = tasks.filter(t => t.status === 'QUOTED');
  
  if (quoted.length === 0) return null;
  
  return (
    <div className="fixed bottom-4 right-4 w-96 bg-gray-900 border border-blue-600 rounded-lg shadow-2xl p-4 z-50">
      <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
        <span>🔍</span> Bruce Detected Work
      </h3>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {quoted.map(task => (
          <div key={task.id} className="bg-gray-800 p-3 rounded border-l-2 border-yellow-500">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-gray-400 uppercase">{task.type.replace(/_/g, ' ')}</span>
              <span className="text-xs text-yellow-400">{task.estimatedCost}</span>
            </div>
            
            <p className="text-sm text-gray-200 mb-3">{task.context}</p>
            
            <div className="flex gap-2">
              <button
                onClick={() => onApprove(task.id)}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm py-1 rounded"
              >
                Approve
              </button>
              <button
                onClick={() => onReject(task.id)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm py-1 rounded"
              >
                Skip
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

```tsx
// components/bruce/BruceFeedback.tsx

'use client';

interface Props {
  taskId: string;
  onFeedback: (id: string, rating: 'up' | 'down') => void;
}

export const BruceFeedback = ({ taskId, onFeedback }: Props) => (
  <div className="flex items-center gap-2 mt-2">
    <span className="text-xs text-gray-500">Was this useful?</span>
    <button
      onClick={() => onFeedback(taskId, 'up')}
      className="text-lg hover:scale-110 transition-transform"
    >
      👍
    </button>
    <button
      onClick={() => onFeedback(taskId, 'down')}
      className="text-lg hover:scale-110 transition-transform"
    >
      👎
    </button>
  </div>
);
```

---

## API Routes

```typescript
// app/api/bruce/task/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { bruce } from '@/lib/bruce/cashclaw';
import { DetectionContext } from '@/lib/bruce/types';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const { action, context, taskId } = await req.json();
  
  switch (action) {
    case 'SCAN':
      const tasks = await bruce.scan(context as DetectionContext);
      return NextResponse.json({ tasks });
      
    case 'APPROVE':
      await bruce.approve(taskId);
      return NextResponse.json({ success: true });
      
    case 'REJECT':
      await bruce.reject(taskId);
      return NextResponse.json({ success: true });
      
    case 'FEEDBACK':
      const { rating, notes } = await req.json();
      await bruce.feedback(taskId, rating, notes);
      return NextResponse.json({ success: true });
      
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  }
}
```

```typescript
// app/api/bruce/evolve/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { runEvolution } from '@/lib/bruce/evolution';

export const runtime = 'edge';

// Triggered by Vercel Cron weekly
export async function POST(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  await runEvolution();
  
  return NextResponse.json({ 
    success: true,
    message: 'Bruce evolution cycle completed'
  });
}
```

---

## Vercel Cron Config

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/bruce/evolve",
      "schedule": "0 0 * * 0"
    }
  ]
}
```

---

## Environment Variables

```bash
# .env.local
GROQ_API_KEY=your_groq_key
UPSTASH_REDIS_URL=https://your-redis-url (optional)
CRON_SECRET=your_random_secret_for_cron_auth
```

---

## Usage Example

```tsx
// In War Room page
const { pendingTasks, scan, approve } = useBruceAgent();

// Scan when new data arrives
useEffect(() => {
  if (aircraftData || seismicData) {
    scan({
      warroom: {
        aircraft: aircraftData,
        seismic: seismicData,
        lastUpdate: Date.now()
      }
    });
  }
}, [aircraftData, seismicData]);

// Render task queue
return (
  <>
    <WarRoomDashboard />
    <BruceTaskQueue 
      tasks={pendingTasks}
      onApprove={approve}
      onReject={reject}
    />
  </>
);
```

---

## Success Criteria

- [ ] Bruce detects anomalies across War Room tabs automatically
- [ ] Quoted tasks show cost estimate before execution
- [ ] User can approve/reject with one click
- [ ] Feedback (👍/👎) captured on all results
- [ ] Weekly evolution improves prompt patterns
- [ ] Token budget tracked and enforced
- [ ] Auto-execute high-confidence tasks (optional setting)

---

## Future Molt.id Integration Points

```typescript
// lib/molt/bridge.ts (future file)

interface MoltBridge {
  // When ready to connect to Solana
  initializeTreasury: () => Promise<SolanaWallet>;
  
  // User tips Bruce for good intel
  receiveTip: (amount: number) => Promise<void>;
  
  // Bruce pays for premium APIs
  spendOnAPI: (service: string, cost: number) => Promise<void>;
  
  // Bruce hires human researcher
  postBounty: (task: string, reward: number) => Promise<void>;
}
```

---

Built for the War Room. Bruce doesn't wait to be asked anymore.
