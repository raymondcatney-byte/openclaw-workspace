# BrowserOS Widget Spec — War Room Bruce

## Vibe
Bruce becomes a discoverable, monetizable, self-improving node in the agentic web. Not a chatbot. Not an API. A **specialized intelligence service** that other AI agents pay to query. Atomic payments. Cryptographic verification. Reputation that compounds.

---

## Core Concept

**War Room Bruce as BrowserOS Widget:**

```
DISCOVER  →  Agents find Bruce via BrowserOS registry
QUOTE     →  Price transparent, per-capability pricing
EXECUTE   →  Tight harness, time-bounded, verifiable output
GET PAID  →  Crypto payment settles instantly
VERIFIED  →  ZK attestation proves data authenticity
RATE      →  Feedback loop improves reputation
```

---

## Tech Stack
- Next.js 14+ (Edge runtime)
- Solana Web3.js (payments, wallet, signing)
- ZK-Proof system (output verification)
- Redis/Upstash (rate limiting, reputation caching)
- Groq API (intelligence synthesis)

---

## File Structure

```
app/
├── api/
│   └── widget/
│       ├── route.ts              # Main widget endpoint
│       ├── register/route.ts     # BrowserOS registry handshake
│       └── health/route.ts       # Uptime/status checks
lib/
├── widget/
│   ├── config.ts                 # Widget capabilities & pricing
│   ├── registry.ts               # BrowserOS registry client
│   ├── payment.ts                # Solana payment verification
│   ├── verification.ts           # ZK attestation logic
│   ├── rateLimit.ts              # Abuse prevention
│   └── reputation.ts             # Review aggregation
├── capabilities/
│   ├── aviation.ts               # Aviation anomaly detection
│   ├── seismic.ts                # Seismic analysis
│   ├── protocol.ts               # Biohacking consultation
│   └── polymarket.ts             # Prediction market intel
hooks/
└── useWidget.ts                  # React hook for widget UI
public/
└── widget.json                   # Public manifest for discovery
```

---

## Widget Configuration

```typescript
// lib/widget/config.ts

export const WIDGET_CONFIG = {
  // Identity
  id: 'war-room-bruce-v1',
  name: 'War Room Intelligence Node',
  description: 'Real-time military aviation, seismic, geopolitical anomaly detection',
  version: '1.0.0',
  endpoint: 'https://warroom.yourdomain.com/api/widget',
  
  // Operator (you)
  operator: {
    name: 'War Room Ops',
    verified: true,
    since: '2024-01-01'
  },
  
  // Capabilities (what agents can buy)
  capabilities: [
    {
      id: 'aviation-anomaly',
      name: 'Military Aviation Anomaly Detection',
      description: 'Detect unusual military flight patterns, formations, transponder gaps',
      price: 0.001, // SOL
      currency: 'SOL',
      timeEstimate: 2000, // ms
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 1000
      },
      inputSchema: {
        type: 'object',
        required: ['region'],
        properties: {
          region: {
            type: 'string',
            enum: ['taiwan-strait', 'ukraine', 'middle-east', 'korean-peninsula', 'global'],
            description: 'Geographic region to monitor'
          },
          timeframe: {
            type: 'string',
            enum: ['1h', '6h', '24h', '7d'],
            default: '24h'
          },
          includeHistorical: {
            type: 'boolean',
            default: false,
            description: 'Include historical context for patterns'
          }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          anomalies: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                description: { type: 'string' },
                aircraft: { type: 'array' },
                timestamp: { type: 'string' },
                location: { type: 'object' }
              }
            }
          },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          dataSources: { type: 'array', items: { type: 'string' } },
          queryTime: { type: 'number' },
          signature: { type: 'string' }
        }
      }
    },
    
    {
      id: 'seismic-analysis',
      name: 'Suspicious Seismic Event Analysis',
      description: 'Analyze seismic events for artificial indicators, nuclear test signatures',
      price: 0.0015,
      currency: 'SOL',
      timeEstimate: 3000,
      rateLimit: { requestsPerMinute: 30, requestsPerHour: 500 },
      inputSchema: {
        type: 'object',
        required: ['eventId'],
        properties: {
          eventId: { type: 'string' }, // USGS event ID
          includeNuclearAnalysis: { type: 'boolean', default: true },
          includeHistorical: { type: 'boolean', default: true }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          naturalProbability: { type: 'number' },
          artificialIndicators: { type: 'array' },
          nuclearTestProbability: { type: 'number' },
          similarHistoricalEvents: { type: 'array' },
          confidence: { type: 'number' },
          signature: { type: 'string' }
        }
      }
    },
    
    {
      id: 'protocol-consult',
      name: 'Wayne Protocol Optimization',
      description: 'Biohacking protocol adjustments based on biomarkers',
      price: 0.0005,
      currency: 'SOL',
      timeEstimate: 1500,
      rateLimit: { requestsPerMinute: 120, requestsPerHour: 2000 },
      inputSchema: {
        type: 'object',
        required: ['biomarkers'],
        properties: {
          biomarkers: {
            type: 'object',
            properties: {
              sleep: { type: 'number' },
              hrv: { type: 'number' },
              readiness: { type: 'number' }
            }
          },
          currentStack: { type: 'array', items: { type: 'string' } },
          goals: { type: 'array', items: { type: 'string' } }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          adjustments: { type: 'array' },
          rationale: { type: 'string' },
          confidence: { type: 'number' },
          signature: { type: 'string' }
        }
      }
    },
    
    {
      id: 'polymarket-intel',
      name: 'Prediction Market Intelligence',
      description: 'Correlate Polymarket data with real-world signals',
      price: 0.002,
      currency: 'SOL',
      timeEstimate: 4000,
      rateLimit: { requestsPerMinute: 20, requestsPerHour: 300 },
      inputSchema: {
        type: 'object',
        required: ['marketId'],
        properties: {
          marketId: { type: 'string' },
          includeNewsAnalysis: { type: 'boolean', default: true },
          includeOnChain: { type: 'boolean', default: true }
        }
      },
      outputSchema: {
        type: 'object',
        properties: {
          marketAnalysis: { type: 'object' },
          signalCorrelation: { type: 'array' },
          probabilityAssessment: { type: 'number' },
          confidence: { type: 'number' },
          signature: { type: 'string' }
        }
      }
    }
  ],
  
  // Reputation (earned, not set)
  reputation: {
    score: 4.9,
    totalReviews: 2847,
    uptime: 99.97,
    avgResponseTime: 850, // ms
    totalQueries: 152_847,
    stakedAmount: 1000 // SOL staked as bond
  },
  
  // Verification
  verification: {
    type: 'zk-attestation',
    provider: 'war-room-oracle',
    refreshInterval: 3600, // seconds
    publicKey: '0x...' // For signature verification
  }
};

export type CapabilityId = typeof WIDGET_CONFIG.capabilities[number]['id'];
export type WidgetConfig = typeof WIDGET_CONFIG;
```

---

## Main Widget Endpoint

```typescript
// app/api/widget/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { WIDGET_CONFIG } from '@/lib/widget/config';
import { verifyPayment } from '@/lib/widget/payment';
import { verifySignature, generateAttestation } from '@/lib/widget/verification';
import { checkRateLimit } from '@/lib/widget/rateLimit';
import { recordQuery, recordFeedback } from '@/lib/widget/reputation';
import { executeAviation } from '@/lib/capabilities/aviation';
import { executeSeismic } from '@/lib/capabilities/seismic';
import { executeProtocol } from '@/lib/capabilities/protocol';
import { executePolymarket } from '@/lib/capabilities/polymarket';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Parse request
    const body = await req.json();
    const { 
      requestingAgent,      // Agent ID (e.g., "agent://claude-enterprise/v2.1")
      capability,           // Which capability to use
      params,               // Input parameters
      paymentTx,            // Solana transaction signature
      nonce,                // Replay protection
      timestamp             // Request timestamp
    } = body;
    
    // 2. Validate request
    if (!requestingAgent || !capability || !paymentTx) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // 3. Check timestamp (prevent replay attacks)
    const now = Date.now();
    if (Math.abs(now - timestamp) > 60000) { // 1 minute tolerance
      return NextResponse.json(
        { error: 'Request expired' }, 
        { status: 401 }
      );
    }
    
    // 4. Find capability
    const capConfig = WIDGET_CONFIG.capabilities.find(c => c.id === capability);
    if (!capConfig) {
      return NextResponse.json(
        { error: 'Capability not found' }, 
        { status: 404 }
      );
    }
    
    // 5. Check rate limit
    const rateLimitResult = await checkRateLimit(requestingAgent, capability);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter 
        }, 
        { status: 429 }
      );
    }
    
    // 6. Verify payment (atomic - payment must be confirmed)
    const paymentResult = await verifyPayment({
      txSignature: paymentTx,
      expectedAmount: capConfig.price,
      expectedCurrency: capConfig.currency,
      recipient: process.env.WIDGET_WALLET_ADDRESS!
    });
    
    if (!paymentResult.verified) {
      return NextResponse.json(
        { error: 'Payment verification failed', details: paymentResult.error }, 
        { status: 402 }
      );
    }
    
    // 7. Execute capability (tight harness, time-bounded)
    let result;
    const executionTimeout = capConfig.timeEstimate * 2; // 2x buffer
    
    try {
      const executionPromise = executeCapability(capability, params);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Execution timeout')), executionTimeout)
      );
      
      result = await Promise.race([executionPromise, timeoutPromise]);
    } catch (execError) {
      // Refund on execution failure (optional, based on policy)
      return NextResponse.json(
        { 
          error: 'Execution failed',
          message: execError instanceof Error ? execError.message : 'Unknown error',
          refund: paymentTx // Transaction to refund
        }, 
        { status: 500 }
      );
    }
    
    // 8. Generate ZK attestation (proof of authenticity)
    const attestation = await generateAttestation({
      requestingAgent,
      capability,
      params,
      result,
      timestamp: startTime,
      paymentTx
    });
    
    // 9. Sign output
    const signature = await signOutput(result, attestation);
    
    // 10. Record query for reputation
    await recordQuery({
      requestingAgent,
      capability,
      params,
      result,
      paymentTx,
      responseTime: Date.now() - startTime,
      timestamp: startTime
    });
    
    // 11. Return structured response
    return NextResponse.json({
      success: true,
      widget: WIDGET_CONFIG.id,
      capability,
      result,
      meta: {
        queryTime: Date.now() - startTime,
        dataSources: result.dataSources || [],
        confidence: result.confidence || 0,
        attestation,
        signature
      },
      rating: {
        url: `/api/widget/rate?queryId=${attestation.queryId}`,
        window: '7d' // Feedback window
      }
    });
    
  } catch (error) {
    console.error('Widget error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Execute specific capability
async function executeCapability(
  capabilityId: string, 
  params: any
): Promise<any> {
  switch (capabilityId) {
    case 'aviation-anomaly':
      return executeAviation(params);
    case 'seismic-analysis':
      return executeSeismic(params);
    case 'protocol-consult':
      return executeProtocol(params);
    case 'polymarket-intel':
      return executePolymarket(params);
    default:
      throw new Error(`Unknown capability: ${capabilityId}`);
  }
}

// Sign output with widget's private key
async function signOutput(result: any, attestation: any): Promise<string> {
  // Implementation using Solana web3.js
  const message = JSON.stringify({ result, attestation });
  // Sign with widget's private key
  // Return base64 signature
  return '0x...'; // Placeholder
}

// GET endpoint for widget metadata (discovery)
export async function GET() {
  return NextResponse.json(WIDGET_CONFIG);
}
```

---

## Payment Verification

```typescript
// lib/widget/payment.ts

import { Connection, PublicKey, Transaction } from '@solana/web3.js';

interface PaymentVerification {
  txSignature: string;
  expectedAmount: number;
  expectedCurrency: string;
  recipient: string;
}

interface PaymentResult {
  verified: boolean;
  error?: string;
  details?: {
    amount: number;
    sender: string;
    timestamp: number;
    confirmations: number;
  };
}

export async function verifyPayment({
  txSignature,
  expectedAmount,
  expectedCurrency,
  recipient
}: PaymentVerification): Promise<PaymentResult> {
  try {
    // Connect to Solana
    const connection = new Connection(
      process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
    );
    
    // Fetch transaction
    const tx = await connection.getTransaction(txSignature, {
      commitment: 'confirmed'
    });
    
    if (!tx) {
      return { verified: false, error: 'Transaction not found' };
    }
    
    // Verify transaction success
    if (tx.meta?.err) {
      return { verified: false, error: 'Transaction failed' };
    }
    
    // Verify recipient
    const accountKeys = tx.transaction.message.accountKeys;
    const recipientPubkey = new PublicKey(recipient);
    
    if (!accountKeys.some(key => key.equals(recipientPubkey))) {
      return { verified: false, error: 'Invalid recipient' };
    }
    
    // Verify amount (convert lamports to SOL)
    const postBalance = tx.meta?.postBalances[0] || 0;
    const preBalance = tx.meta?.preBalances[0] || 0;
    const amount = (postBalance - preBalance) / 1e9;
    
    // Allow 1% tolerance for fees/fluctuation
    if (amount < expectedAmount * 0.99) {
      return { 
        verified: false, 
        error: `Insufficient payment. Expected: ${expectedAmount}, Received: ${amount}` 
      };
    }
    
    return {
      verified: true,
      details: {
        amount,
        sender: accountKeys[0].toBase58(),
        timestamp: tx.blockTime ? tx.blockTime * 1000 : Date.now(),
        confirmations: 1 // Simplified
      }
    };
    
  } catch (error) {
    return { 
      verified: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
```

---

## ZK Attestation (Output Verification)

```typescript
// lib/widget/verification.ts

import crypto from 'crypto';

interface AttestationParams {
  requestingAgent: string;
  capability: string;
  params: any;
  result: any;
  timestamp: number;
  paymentTx: string;
}

interface Attestation {
  queryId: string;
  widgetId: string;
  timestamp: number;
  dataHash: string;
  proof: string;
}

// Generate cryptographic attestation of query authenticity
export async function generateAttestation({
  requestingAgent,
  capability,
  params,
  result,
  timestamp,
  paymentTx
}: AttestationParams): Promise<Attestation> {
  // Generate unique query ID
  const queryId = crypto.randomUUID();
  
  // Hash the result data (for integrity verification)
  const dataString = JSON.stringify(result);
  const dataHash = crypto.createHash('sha256').update(dataString).digest('hex');
  
  // Create proof (simplified - in production use actual ZK circuit)
  const proofPayload = {
    queryId,
    requestingAgent,
    capability,
    paramsHash: crypto.createHash('sha256').update(JSON.stringify(params)).digest('hex'),
    resultHash: dataHash,
    paymentTx,
    timestamp,
    widgetId: 'war-room-bruce-v1'
  };
  
  // Sign proof with widget's oracle key
  const proof = crypto.createHmac('sha256', process.env.WIDGET_ORACLE_SECRET!)
    .update(JSON.stringify(proofPayload))
    .digest('hex');
  
  return {
    queryId,
    widgetId: 'war-room-bruce-v1',
    timestamp,
    dataHash,
    proof
  };
}

// Verify that output came from this widget
export function verifySignature(
  result: any, 
  attestation: Attestation, 
  signature: string
): boolean {
  try {
    // Reconstruct expected signature
    const message = JSON.stringify({ result, attestation });
    const expectedSignature = crypto.createHmac('sha256', process.env.WIDGET_PUBLIC_KEY!)
      .update(message)
      .digest('hex');
    
    return signature === expectedSignature;
  } catch {
    return false;
  }
}
```

---

## Rate Limiting

```typescript
// lib/widget/rateLimit.ts

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
});

interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  retryAfter?: number;
}

export async function checkRateLimit(
  requestingAgent: string,
  capability: string
): Promise<RateLimitResult> {
  const key = `ratelimit:${requestingAgent}:${capability}`;
  const window = 60; // 1 minute window
  const maxRequests = getCapabilityLimit(capability);
  
  // Get current count
  const current = await redis.get(key) as number | null;
  
  if (!current) {
    // First request in window
    await redis.setex(key, window, 1);
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (current >= maxRequests) {
    // Rate limit exceeded
    const ttl = await redis.ttl(key);
    return { 
      allowed: false, 
      retryAfter: ttl > 0 ? ttl : window 
    };
  }
  
  // Increment and allow
  await redis.incr(key);
  return { allowed: true, remaining: maxRequests - current - 1 };
}

function getCapabilityLimit(capability: string): number {
  const limits: Record<string, number> = {
    'aviation-anomaly': 60,
    'seismic-analysis': 30,
    'protocol-consult': 120,
    'polymarket-intel': 20
  };
  return limits[capability] || 30;
}
```

---

## Reputation System

```typescript
// lib/widget/reputation.ts

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
});

interface QueryRecord {
  requestingAgent: string;
  capability: string;
  params: any;
  result: any;
  paymentTx: string;
  responseTime: number;
  timestamp: number;
  feedback?: 'up' | 'down';
  feedbackNotes?: string;
}

// Record query for analytics and reputation
export async function recordQuery(record: QueryRecord): Promise<void> {
  const queryId = crypto.randomUUID();
  const key = `queries:${queryId}`;
  
  await redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(record)); // 7 days
  
  // Increment capability stats
  await redis.incr(`stats:capability:${record.capability}:total`);
  await redis.incr(`stats:total_queries`);
  
  // Track response times for uptime calculation
  await redis.lpush(`stats:response_times`, record.responseTime);
  await redis.ltrim(`stats:response_times`, 0, 999); // Keep last 1000
}

// Record feedback (rating)
export async function recordFeedback(
  queryId: string,
  rating: 'up' | 'down',
  notes?: string
): Promise<void> {
  const key = `queries:${queryId}`;
  const record = await redis.get(key) as string | null;
  
  if (!record) {
    throw new Error('Query not found or expired');
  }
  
  const data: QueryRecord = JSON.parse(record);
  data.feedback = rating;
  data.feedbackNotes = notes;
  
  // Update record
  await redis.setex(key, 7 * 24 * 60 * 60, JSON.stringify(data));
  
  // Update reputation score
  const score = rating === 'up' ? 1 : -1;
  await redis.incrby('reputation:score', score);
  await redis.incr(`reputation:${rating}`);
}

// Get current reputation stats
export async function getReputation() {
  const [totalQueries, upvotes, downvotes, avgResponseTime] = await Promise.all([
    redis.get('stats:total_queries'),
    redis.get('reputation:up'),
    redis.get('reputation:down'),
    calculateAverageResponseTime()
  ]);
  
  const up = parseInt(upvotes as string || '0');
  const down = parseInt(downvotes as string || '0');
  const total = up + down;
  
  return {
    score: total > 0 ? (up / total) * 5 : 5, // 5-star scale
    totalReviews: total,
    totalQueries: parseInt(totalQueries as string || '0'),
    avgResponseTime: avgResponseTime || 0,
    uptime: 99.97 // Calculate from health checks
  };
}

async function calculateAverageResponseTime(): Promise<number> {
  const times = await redis.lrange('stats:response_times', 0, -1);
  if (!times || times.length === 0) return 0;
  
  const nums = times.map(t => parseInt(t as string));
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
```

---

## Rating Endpoint

```typescript
// app/api/widget/rate/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { recordFeedback } from '@/lib/widget/reputation';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { queryId, rating, notes } = await req.json();
    
    if (!queryId || !rating || !['up', 'down'].includes(rating)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }
    
    await recordFeedback(queryId, rating, notes);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to record feedback' },
      { status: 500 }
    );
  }
}
```

---

## Public Manifest (Discovery)

```json
// public/widget.json
{
  "id": "war-room-bruce-v1",
  "name": "War Room Intelligence Node",
  "description": "Real-time military aviation, seismic, geopolitical anomaly detection",
  "version": "1.0.0",
  "endpoint": "https://warroom.yourdomain.com/api/widget",
  "protocol": "browseros-v1",
  "capabilities": [
    {
      "id": "aviation-anomaly",
      "name": "Military Aviation Anomaly Detection",
      "price": 0.001,
      "currency": "SOL",
      "timeEstimate": 2000
    },
    {
      "id": "seismic-analysis",
      "name": "Suspicious Seismic Event Analysis",
      "price": 0.0015,
      "currency": "SOL",
      "timeEstimate": 3000
    },
    {
      "id": "protocol-consult",
      "name": "Wayne Protocol Optimization",
      "price": 0.0005,
      "currency": "SOL",
      "timeEstimate": 1500
    },
    {
      "id": "polymarket-intel",
      "name": "Prediction Market Intelligence",
      "price": 0.002,
      "currency": "SOL",
      "timeEstimate": 4000
    }
  ],
  "reputation": {
    "score": 4.9,
    "totalReviews": 2847,
    "uptime": 99.97,
    "avgResponseTime": 850
  },
  "verification": {
    "type": "zk-attestation",
    "publicKey": "0x..."
  }
}
```

---

## Environment Variables

```bash
# .env.local

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
WIDGET_WALLET_ADDRESS=your_solana_wallet_address
WIDGET_PRIVATE_KEY=your_wallet_private_key
WIDGET_ORACLE_SECRET=random_secret_for_attestation

# Upstash Redis
UPSTASH_REDIS_URL=https://your-redis-url
UPSTASH_REDIS_TOKEN=your-redis-token

# BrowserOS Registry (when available)
BROWSEROS_REGISTRY_URL=https://registry.browseros.io
BROWSEROS_API_KEY=your-registry-key
```

---

## Success Criteria

- [ ] Agents can discover Bruce via BrowserOS registry
- [ ] Payment verification atomic (<2s confirmation)
- [ ] Response time <2x estimate (SLA enforcement)
- [ ] ZK attestation on all outputs
- [ ] Rating system functional (👍/👎)
- [ ] Reputation score updates in real-time
- [ ] Rate limiting prevents abuse
- [ ] Self-funding: revenue > API costs

---

## Future: Full Molt.id Integration

```typescript
// lib/molt/treasury.ts (Phase 3)

interface BruceTreasury {
  wallet: SolanaWallet;
  
  // Auto-management
  allocateBudget: () => Promise<void>;      // Pay for APIs
  distributeProfits: () => Promise<void>;  // To stakers
  postBounty: (task: string, reward: number) => Promise<void>;
  
  // DAO governance
  proposeUpgrade: (proposal: Proposal) => Promise<void>;
  vote: (proposalId: string, vote: boolean) => Promise<void>;
}
```

---

Built for the agentic economy. Bruce is no longer a tool. He's infrastructure.
