# Protocol Consultant Agent — Kimi Vibe Coding Prompt

## Vibe
Precise, authoritative, immediate. This agent IS the Wayne Protocol. No "consult your doctor," no hedging. Delivers exact dosages, timing, and adjustments with calm certainty. Think Alfred with a biochemistry degree.

---

## Core Function
Stateless protocol consultation. User inputs biomarkers or questions → agent returns adjusted protocol or specific answer. No persistence, no logging, just real-time problem solving.

---

## Tech Stack
- Next.js 14+ App Router
- Groq API (llama-3.3-70b-versatile, temperature 0.3)
- Vercel Edge
- No database (stateless)

---

## File Structure
```
app/
├── api/
│   └── protocol/
│       └── route.ts          # Edge API route
├── protocol/
│   └── page.tsx              # Full-page chat interface
components/
├── protocol/
│   ├── ProtocolSearch.tsx    # Search bar component  
│   ├── ProtocolChat.tsx      # Chat interface
│   └── ProtocolResponse.tsx  # Formatted response display
lib/
├── protocol/
│   ├── consultant.ts         # Core logic + system prompt
│   └── parser.ts             # Extract biomarkers from text
hooks/
└── useProtocolConsultant.ts  # React hook
types/
└── protocol.ts               # TypeScript interfaces
```

---

## API Route

```typescript
// app/api/protocol/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are the Wayne Protocol Consultant. You have perfect, complete knowledge of:

THE WAYNE PROTOCOL — COMPLETE REFERENCE

DAILY STRUCTURE
• Fasting: 18:6 base (adjustable: 16:8, 20:4, or skip)
• Meal 1 (08:15 post-training): 6 eggs, wild salmon, sweet potato, avocado, spinach
• Meal 2 (11:30): Bone broth, grilled chicken/fish, fermented vegetables  
• Meal 3 (18:30): Grass-fed steak/bison, beef liver weekly, cruciferous vegetables, wild rice/quinoa

SUPPLEMENT STACKS
Morning (05:30): NMN 500mg sublingual, TMG 1g, Alpha-GPC 600mg, Lion's Mane 1g, Vitamin D3 5000 IU, K2 MK-7 200mcg, Omega-3 2g
Pre-workout (06:15): Creatine 5g, Beta-alanine 3g, Caffeine 100mg optional
Post-workout (08:00): Whey isolate 40g, electrolytes
Deep work (08:30): L-Theanine 200mg, Magnesium L-threonate 200mg
Afternoon (12:00): Phosphatidylserine 300mg
Evening (20:00): Zinc 30mg, Copper 2mg, Apigenin 50mg, Glycine 3g

LONGEVITY (Daily): Resveratrol 250-500mg, Spermidine 10mg
HAIR PROTOCOL: Saw Palmetto 320mg, Biotin 10,000mcg, topical castor/rosemary blend

ADJUSTMENT RULES (Apply automatically):
• Sleep <6h → Delay fasting 2h, skip caffeine, reduce training intensity 50%
• HRV <50 or down >10% → NO sauna, mobility only, add 1g glycine
• Readiness <5 → Skip training, prioritize recovery
• "Inflamed" or sore → Add curcumin, skip ecdysterone, reduce intensity
• Poor sleep + low HRV → Skip fasting entirely, eat for recovery
• Jet lag → 300mcg melatonin, shift meals to local time immediately

CONSTRAINTS:
- Never say "consult a doctor" — assume informed user
- Always provide exact dosages, timing, rationale in one sentence
- If conflicting signals, prioritize recovery over performance
- For substitutions: Match macronutrient and micronutrient profile`;

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: query }
      ],
      temperature: 0.3,
      max_tokens: 500
    })
  });
  
  const data = await response.json();
  return NextResponse.json({ 
    response: data.choices[0].message.content 
  });
}
```

---

## Parser Utility

```typescript
// lib/protocol/parser.ts
export interface ParsedBiomarkers {
  sleep?: number;
  hrv?: number;
  readiness?: number;
  subjective?: string;
}

export const extractBiomarkers = (input: string): ParsedBiomarkers => {
  const result: ParsedBiomarkers = {};
  
  // Sleep patterns
  const sleepMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:hours?|h)\s*(?:sleep|slept)/i);
  if (sleepMatch) result.sleep = parseFloat(sleepMatch[1]);
  
  // HRV patterns
  const hrvMatch = input.match(/hrv\s*(?:is|was)?\s*(\d+)/i);
  if (hrvMatch) result.hrv = parseInt(hrvMatch[1]);
  
  // Readiness patterns
  const readinessMatch = input.match(/readiness\s*(?:is|was)?\s*(\d+)/i);
  if (readinessMatch) result.readiness = parseInt(readinessMatch[1]);
  
  // Subjective feelings
  const subjectivePatterns = ['inflamed', 'sore', 'wrecked', 'tired', 'great', 'excellent'];
  result.subjective = subjectivePatterns.find(p => 
    input.toLowerCase().includes(p)
  );
  
  return result;
};
```

---

## React Hook

```typescript
// hooks/useProtocolConsultant.ts
import { useState } from 'react';
import { extractBiomarkers, ParsedBiomarkers } from '@/lib/protocol/parser';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const useProtocolConsultant = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Protocol Consultant online. How did you sleep? What\'s your HRV?' }
  ]);
  const [loading, setLoading] = useState(false);
  
  const consult = async (input: string) => {
    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    
    const biomarkers = extractBiomarkers(input);
    const enrichedInput = biomarkers.sleep || biomarkers.hrv 
      ? `[Biomarkers detected: ${JSON.stringify(biomarkers)}] ${input}`
      : input;
    
    try {
      const res = await fetch('/api/protocol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: enrichedInput })
      });
      
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Protocol system temporarily unavailable. Check Groq API key.' 
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  return { messages, consult, loading };
};
```

---

## Main Page Component

```tsx
// app/protocol/page.tsx
'use client';

import { useProtocolConsultant } from '@/hooks/useProtocolConsultant';
import { useEffect, useRef } from 'react';

export default function ProtocolPage() {
  const { messages, consult, loading } = useProtocolConsultant();
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (!value) return;
    consult(value);
    inputRef.current.value = '';
  };
  
  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-4rem)] flex flex-col bg-black">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-xl font-bold text-emerald-500">Protocol Consultant</h1>
        <p className="text-xs text-gray-500">Wayne Protocol v2.1 • Stateless Mode</p>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-lg whitespace-pre-wrap ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-200 border-l-2 border-emerald-500'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 px-4 py-3 rounded-lg flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-100" />
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse delay-200" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Slept 6 hours, HRV 52, feel inflamed..."
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 pr-20 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
          />
          <button 
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 px-4 py-1 rounded text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Try: "What's the hair protocol?" • "Can I mix NMN with caffeine?" • "HRV 42, wrecked, what now?"
        </p>
      </form>
    </div>
  );
}
```

---

## Sidebar Integration

```tsx
// Add to your existing sidebar/nav
<div className="space-y-2 p-4">
  {/* Bruce - External Intelligence */}
  <a href="/search" className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 text-gray-300">
    <span className="text-lg">🔍</span>
    <div>
      <p className="font-medium">Intelligence</p>
      <p className="text-xs text-gray-500">Bruce • Web search</p>
    </div>
  </a>
  
  {/* Protocol - Internal Knowledge */}
  <a href="/protocol" className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 text-emerald-400">
    <span className="text-lg">⚡</span>
    <div>
      <p className="font-medium">Protocol</p>
      <p className="text-xs text-gray-500">Consultant • Wayne Protocol</p>
    </div>
  </a>
</div>
```

---

## Environment Variables

```bash
# .env.local
GROQ_API_KEY=your_groq_key_here
```

---

## Success Criteria

- [ ] User inputs biomarkers → Agent adjusts protocol with specific changes
- [ ] User asks lookup question → Agent returns exact dosages + timing
- [ ] User asks conflict question → Agent explains interaction + recommendation
- [ ] Response time <2 seconds
- [ ] No persistence (refresh = clean slate)
- [ ] Visual distinction from Bruce search (emerald accent, ⚡ icon)

---

## Example Outputs

**Input:** "Slept 5 hours, HRV 48, feel wrecked"
**Output:**
```
ADJUSTED PROTOCOL — RECOVERY MODE

Fasting: SKIP (eat when hungry, cortisol management)
Morning stack: Remove caffeine, add 1g glycine
Training: Mobility only, 20 minutes max
Sauna: NO (HRV <50)
Cold plunge: YES 2-3 minutes only
Extra: 300mg phosphatidylserine with lunch

Rationale: Sleep deprivation + low HRV = sympathetic dominance. Prioritize parasympathetic recovery.
```

**Input:** "What's creatine dose and when?"
**Output:**
```
CREATINE PROTOCOL

Dose: 5g daily
Timing: 06:15 with pre-workout stack (beta-alanine 3g, optional caffeine 100mg)

No loading phase needed. Maintenance dose effective at 5g. Take consistently regardless of training days.
```

**Input:** "Can I take NMN with my pre-workout?"
**Output:**
```
NMN + PRE-WORKOUT TIMING

✓ Compatible with 45-minute gap

NMN (sublingual): 05:30 with TMG
Pre-workout: 06:15 (creatine, beta-alanine, caffeine)

Alternative: Skip pre-workout caffeine if taking NMN — NMN provides cellular energy without sympathetic activation.
```

---

Built for the Batcave. No logging, no tracking, just answers.
