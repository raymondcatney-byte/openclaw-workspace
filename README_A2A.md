# MarketAnomalyScanner A2A Server

A production-ready [Agent-to-Agent (A2A)](https://github.com/google/A2A) protocol server for cryptocurrency market anomaly detection and whale watching.

## Overview

This server enables AI agents to programmatically access:
- **Whale Detection** — On-chain large transfers, exchange flows, smart money tracking
- **Market Anomaly Scanning** — Volume spikes, price dislocations, funding rate extremes
- **Cross-Exchange Arbitrage** — Price discrepancies across venues

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements-a2a.txt
```

### 2. Start the Server

```bash
python a2a_server.py
```

The server will start on `http://localhost:8000` with these endpoints:
- **Agent Card** — `http://localhost:8000/.well-known/agent.json`
- **Health Check** — `http://localhost:8000/health`
- **Skills** — `http://localhost:8000/skills`

### 3. Run the Demo Client

```bash
python a2a_client_demo.py
```

This demonstrates:
- Fetching the agent card
- Sending one-off whale scan tasks
- Subscribing to real-time streaming alerts

## API Usage

### Authentication

Include your API key in the `Authorization` header:

```bash
curl -H "Authorization: Bearer demo-pro-tier" \
     http://localhost:8000/health
```

Demo keys (no actual verification in development):
- `demo-free-tier` — 10 req/min
- `demo-trader-tier` — 100 req/min  
- `demo-pro-tier` — 1000 req/min

### One-Off Task: Whale Scan

```bash
curl -X POST http://localhost:8000/tasks/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer demo-pro-tier" \
  -d '{
    "id": "task-001",
    "sessionId": "session-xyz",
    "message": {
      "role": "user",
      "parts": [
        {"type": "text", "text": "Execute whale_watch"},
        {"type": "data", "data": {
          "chains": ["ethereum", "solana"],
          "signalTypes": ["exchange_inflow", "dex_swap"],
          "thresholds": {
            "minUsdValue": 1000000,
            "percentOf24hVolume": 5
          }
        }}
      ]
    }
  }'
```

### Streaming Task: Real-Time Alerts

**Step 1:** Initiate the streaming task

```bash
curl -X POST http://localhost:8000/tasks/sendSubscribe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer demo-pro-tier" \
  -d '{
    "id": "stream-001",
    "message": {
      "role": "user",
      "parts": [
        {"type": "text", "text": "Start realtime_subscription"},
        {"type": "data", "data": {
          "chains": ["ethereum"],
          "thresholds": {"minUsdValue": 5000000}
        }}
      ]
    }
  }'
```

**Step 2:** Connect to WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/tasks/stream-001', [], {
  headers: { 'Authorization': 'Bearer demo-pro-tier' }
});

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Whale alert:', data);
};
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      A2A SERVER                             │
├─────────────────────────────────────────────────────────────┤
│  /.well-known/agent.json    → Agent Card (discovery)        │
│  POST /tasks/send           → One-off task execution        │
│  POST /tasks/sendSubscribe  → Initiate streaming            │
│  WS   /ws/tasks/{id}        → WebSocket stream              │
├─────────────────────────────────────────────────────────────┤
│  Task Store (in-memory)                                     │
│  Whale Detection Engine (mock → real on-chain data)         │
│  Rate Limiter (tier-based)                                  │
└─────────────────────────────────────────────────────────────┘
```

## Skills

### whale_watch

Detect on-chain whale activity with AI-powered intent prediction.

**Input Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `chains` | array | ["ethereum", "solana"] | Chains to monitor |
| `signalTypes` | array | ["exchange_inflow"] | Types of signals |
| `thresholds.minUsdValue` | number | 1000000 | Minimum USD value |
| `entityFilters.includeSmartMoney` | boolean | false | Track profitable wallets |

**Response includes:**
- Entity resolution (exchange, whale, fund labels)
- Wallet clustering (related addresses)
- AI intent prediction (profit-taking vs accumulation)
- Price impact estimates
- Suggested actions

### spot_anomaly_scan

Scan spot markets for volume, price, and volatility anomalies.

### perp_anomaly_scan

Detect funding rate extremes and liquidation cascades in perp markets.

## Production Deployment

### Environment Variables

```bash
# Required
export REDIS_URL=redis://localhost:6379
export DATABASE_URL=postgresql://user:pass@localhost/anomalydb

# Optional
export LOG_LEVEL=info
export METRICS_PORT=9090
export SENTRY_DSN=https://... # Error tracking
```

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements-a2a.txt .
RUN pip install -r requirements-a2a.txt

COPY a2a_server.py .

EXPOSE 8000
CMD ["python", "a2a_server.py"]
```

### Kubernetes (Helm)

```yaml
# values.yaml
replicaCount: 3
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "2000m"

env:
  REDIS_URL: "redis://redis-cluster:6379"
  DATABASE_URL: "postgresql://..."
```

## Extending the Server

### Adding a New Skill

1. Define input/output schemas in `a2a_agent_spec.md`
2. Add skill to `AGENT_CONFIG["skills"]` in `a2a_server.py`
3. Implement handler in `tasks_send` endpoint
4. Add to `/skills` endpoint response

### Integrating Real On-Chain Data

Replace the mock `WhaleDetectionEngine` with:

```python
# Alchemy for Ethereum
alchemy_ws = await websockets.connect(
    f"wss://eth-mainnet.g.alchemy.com/v2/{ALCHEMY_KEY}"
)

# Helius for Solana
helius_webhook = await setup_helius_webhook(
    "https://your-server.com/webhooks/helius"
)

# Arkham for entity labels
entity = await arkham_client.get_entity(address)
```

## A2A Protocol Compliance

This server implements:
- ✅ Agent Card discovery (`/.well-known/agent.json`)
- ✅ Task lifecycle management (`tasks/send`, `tasks/cancel`)
- ✅ Streaming via WebSocket (`tasks/sendSubscribe`)
- ✅ JSON-RPC 2.0 message format
- ✅ Artifact-based result delivery
- ✅ Status updates and heartbeats

See [Google A2A Specification](https://github.com/google/A2A) for full protocol details.

## License

MIT
