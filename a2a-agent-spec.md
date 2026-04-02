# A2A Agent Specification: MarketAnomalyScanner

## Agent Card (/.well-known/agent.json)

```json
{
  "name": "MarketAnomalyScanner",
  "description": "Real-time cryptocurrency market anomaly detection and intelligence service. Identifies unusual volume, price dislocations, funding rate extremes, and cross-exchange arbitrage opportunities.",
  "url": "https://api.anomalyscan.io",
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true
  },
  "skills": [
    {
      "id": "spot_anomaly_scan",
      "name": "Spot Market Anomaly Scan",
      "description": "On-demand scan of spot markets for volume, price, and volatility anomalies",
      "tags": ["spot", "scan", "volume", "volatility"],
      "examples": [
        "Scan BTC/USDT on Binance for volume anomalies in the last hour",
        "Detect any price dislocations >2% across spot exchanges for ETH"
      ]
    },
    {
      "id": "perp_anomaly_scan",
      "name": "Perpetual Futures Anomaly Scan",
      "description": "Detect funding rate extremes, open interest anomalies, and liquidation cascades in perpetual markets",
      "tags": ["perp", "futures", "funding", "liquidation", "oi"],
      "examples": [
        "Check Hyperliquid BTC-PERP for unusual funding rate activity",
        "Alert me when OI spikes >200% on any perp market"
      ]
    },
    {
      "id": "cross_exchange_scan",
      "name": "Cross-Exchange Arbitrage Scanner",
      "description": "Identify price discrepancies across exchanges that exceed fees and slippage",
      "tags": ["arbitrage", "cross-exchange", "dislocation"],
      "examples": [
        "Find BTC price differences >0.5% between Hyperliquid and Binance",
        "Scan all majors for cross-exchange dislocations"
      ]
    },
    {
      "id": "whale_watch",
      "name": "Whale Movement Detection",
      "description": "On-chain and large order detection for unusual wallet or order activity",
      "tags": ["whale", "on-chain", "large-orders"],
      "examples": [
        "Monitor for BTC transfers >$10M to exchanges",
        "Detect iceberg orders on Hyperliquid"
      ]
    },
    {
      "id": "realtime_subscription",
      "name": "Real-Time Anomaly Stream",
      "description": "Subscribe to live anomaly alerts with configurable filters and severity thresholds",
      "tags": ["streaming", "real-time", "alerts", "webhook"],
      "examples": [
        "Subscribe to all P0-P1 anomalies on perp markets",
        "Stream volume spikes for SOL with confidence >0.9"
      ]
    }
  ],
  "authentication": {
    "schemes": ["apiKey", "oauth2"],
    "apiKey": {
      "header": "X-API-Key",
      "location": "https://anomalyscan.io/settings/api-keys"
    },
    "oauth2": {
      "flows": ["client_credentials"],
      "tokenEndpoint": "https://auth.anomalyscan.io/oauth/token",
      "scopes": ["anomaly:read", "stream:subscribe", "alerts:configure"]
    }
  },
  "rateLimits": {
    "free": { "requestsPerMinute": 10, "streamingConnections": 1 },
    "trader": { "requestsPerMinute": 100, "streamingConnections": 3 },
    "pro": { "requestsPerMinute": 1000, "streamingConnections": 10 },
    "enterprise": { "requestsPerMinute": 10000, "streamingConnections": 50 }
  },
  "pricing": {
    "model": "per-call",
    "currency": "credits",
    "rates": {
      "spot_anomaly_scan": 1,
      "perp_anomaly_scan": 1,
      "cross_exchange_scan": 5,
      "whale_watch": 3,
      "realtime_subscription": 10
    }
  },
  "defaultInputModes": ["text"],
  "defaultOutputModes": ["json", "text"],
  "provider": {
    "name": "AnomalyScan Labs",
    "url": "https://anomalyscan.io",
    "support": "support@anomalyscan.io"
  }
}
```

---

## Task Schemas

### 1. spot_anomaly_scan

#### Input Schema
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "exchanges": {
      "type": "array",
      "items": { "enum": ["binance", "coinbase", "kraken", "bybit", "okx", "hyperliquid"] },
      "description": "Exchanges to scan. Omit for all supported."
    },
    "symbols": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Trading pairs (e.g., BTC-USDT, ETH-USDC). Omit for all majors."
    },
    "timeframe": {
      "type": "string",
      "pattern": "^[0-9]+(m|h|d)$",
      "default": "15m",
      "description": "Lookback period (e.g., 5m, 1h, 1d)"
    },
    "anomalyTypes": {
      "type": "array",
      "items": { "enum": ["volume_spike", "price_dislocation", "volatility_regime_change", "liquidity_gap"] },
      "default": ["volume_spike", "price_dislocation"]
    },
    "confidenceThreshold": {
      "type": "number",
      "minimum": 0.5,
      "maximum": 0.99,
      "default": 0.85,
      "description": "Minimum confidence score for reported anomalies"
    },
    "zScoreThreshold": {
      "type": "number",
      "minimum": 2.0,
      "maximum": 5.0,
      "default": 3.0,
      "description": "Z-score threshold for statistical anomalies"
    }
  }
}
```

#### Output Schema (Artifact)
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "scanId": { "type": "string", "format": "uuid" },
    "timestamp": { "type": "string", "format": "date-time" },
    "parameters": { "type": "object" },
    "marketsScanned": { "type": "integer" },
    "anomaliesDetected": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "exchange": { "type": "string" },
          "symbol": { "type": "string" },
          "anomalyType": { "type": "string" },
          "severity": { "enum": ["P0", "P1", "P2", "P3"] },
          "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
          "detectedAt": { "type": "string", "format": "date-time" },
          "metrics": {
            "type": "object",
            "properties": {
              "zScore": { "type": "number" },
              "currentValue": { "type": "number" },
              "baselineValue": { "type": "number" },
              "percentChange": { "type": "number" }
            }
          },
          "context": {
            "type": "object",
            "properties": {
              "relatedMarkets": { "type": "array", "items": { "type": "string" } },
              "recentNewsCount": { "type": "integer" },
              "correlationToMarket": { "type": "number" }
            }
          }
        },
        "required": ["id", "exchange", "symbol", "anomalyType", "severity", "confidence"]
      }
    },
    "summary": {
      "type": "object",
      "properties": {
        "totalAnomalies": { "type": "integer" },
        "bySeverity": { "type": "object" },
        "byType": { "type": "object" },
        "highestConfidenceAnomaly": { "type": "string" }
      }
    }
  },
  "required": ["scanId", "timestamp", "marketsScanned", "anomaliesDetected"]
}
```

---

### 2. perp_anomaly_scan

#### Input Schema
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "exchanges": {
      "type": "array",
      "items": { "enum": ["hyperliquid", "binance", "bybit", "dydx", "gmx"] }
    },
    "symbols": {
      "type": "array",
      "items": { "type": "string", "pattern": "^[A-Z]+-PERP$" }
    },
    "anomalyTypes": {
      "type": "array",
      "items": { 
        "enum": [
          "funding_rate_extreme",
          "open_interest_spike", 
          "liquidation_cascade",
          "long_short_imbalance",
          "premium_divergence"
        ] 
      }
    },
    "fundingThreshold": {
      "type": "number",
      "default": 0.01,
      "description": "Funding rate threshold (1% = 0.01)"
    },
    "oiChangeThreshold": {
      "type": "number",
      "default": 0.5,
      "description": "Open interest change threshold (50% = 0.5)"
    }
  }
}
```

#### Output Schema (Artifact)
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "scanId": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "fundingAnomalies": {
      "type": "array",
      "items": {
        "properties": {
          "symbol": { "type": "string" },
          "exchange": { "type": "string" },
          "fundingRate": { "type": "number" },
          "annualized": { "type": "number" },
          "percentile": { "type": "number" },
          "direction": { "enum": ["longs_pay", "shorts_pay"] }
        }
      }
    },
    "oiAnomalies": {
      "type": "array",
      "items": {
        "properties": {
          "symbol": { "type": "string" },
          "exchange": { "type": "string" },
          "oiChange24h": { "type": "number" },
          "oiUsd": { "type": "number" },
          "velocity": { "type": "string", "enum": ["accumulating", "distributing"] }
        }
      }
    },
    "liquidationAnomalies": {
      "type": "array",
      "items": {
        "properties": {
          "symbol": { "type": "string" },
          "exchange": { "type": "string" },
          "liquidationValueUsd": { "type": "number" },
          "liquidationType": { "enum": ["long", "short"] },
          "cascadeDetected": { "type": "boolean" }
        }
      }
    }
  }
}
```

---

### 3. cross_exchange_scan

#### Input Schema
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "symbols": {
      "type": "array",
      "items": { "type": "string" }
    },
    "exchanges": {
      "type": "array",
      "items": { "type": "string" }
    },
    "minDislocation": {
      "type": "number",
      "default": 0.005,
      "description": "Minimum price difference (0.5% = 0.005)"
    },
    "includeFees": {
      "type": "boolean",
      "default": true,
      "description": "Account for trading fees in arbitrage calculation"
    },
    "marketType": {
      "type": "string",
      "enum": ["spot", "perp", "both"],
      "default": "both"
    }
  }
}
```

#### Output Schema (Artifact)
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "scanId": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "arbitrageOpportunities": {
      "type": "array",
      "items": {
        "properties": {
          "symbol": { "type": "string" },
          "buyExchange": { "type": "string" },
          "sellExchange": { "type": "string" },
          "buyPrice": { "type": "number" },
          "sellPrice": { "type": "number" },
          "grossDislocation": { "type": "number" },
          "netProfitAfterFees": { "type": "number" },
          "annualizedReturn": { "type": "number" },
          "liquidityScore": { "type": "integer", "minimum": 1, "maximum": 10 },
          "latencyEstimateMs": { "type": "integer" },
          "riskLevel": { "enum": ["low", "medium", "high"] }
        }
      }
    },
    "summary": {
      "properties": {
        "totalOpportunities": { "type": "integer" },
        "avgNetProfit": { "type": "number" },
        "highestProfit": { "type": "number" },
        "lowestLatencyMs": { "type": "integer" }
      }
    }
  }
}
```

---

### 4. realtime_subscription

#### Input Schema
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "filter": {
      "type": "object",
      "properties": {
        "exchanges": { "type": "array", "items": { "type": "string" } },
        "symbols": { "type": "array", "items": { "type": "string" } },
        "marketTypes": { "type": "array", "items": { "enum": ["spot", "perp"] } },
        "minSeverity": { "type": "string", "enum": ["P0", "P1", "P2", "P3"], "default": "P1" },
        "anomalyTypes": { "type": "array", "items": { "type": "string" } },
        "confidenceThreshold": { "type": "number", "default": 0.8 }
      }
    },
    "delivery": {
      "type": "object",
      "properties": {
        "mode": { "enum": ["websocket", "webhook", "sse"], "default": "websocket" },
        "webhookUrl": { "type": "string", "format": "uri" },
        "retryPolicy": {
          "type": "object",
          "properties": {
            "maxRetries": { "type": "integer", "default": 3 },
            "backoffMs": { "type": "integer", "default": 1000 }
          }
        }
      }
    },
    "aggregation": {
      "type": "object",
      "properties": {
        "enabled": { "type": "boolean", "default": false },
        "windowSeconds": { "type": "integer", "default": 60 },
        "maxAlertsPerWindow": { "type": "integer", "default": 5 }
      }
    }
  }
}
```

#### Output Schema (Streaming Artifact)
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "eventType": { "enum": ["anomaly", "heartbeat", "subscription_update"] },
    "timestamp": { "type": "string", "format": "date-time" },
    "anomaly": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "type": { "type": "string" },
        "severity": { "type": "string" },
        "confidence": { "type": "number" },
        "exchange": { "type": "string" },
        "symbol": { "type": "string" },
        "marketType": { "enum": ["spot", "perp"] },
        "detectedAt": { "type": "string", "format": "date-time" },
        "metrics": { "type": "object" },
        "suggestedActions": {
          "type": "array",
          "items": {
            "properties": {
              "action": { "type": "string" },
              "reasoning": { "type": "string" },
              "confidence": { "type": "number" }
            }
          }
        }
      }
    }
  }
}
```

---

## Example A2A Requests

### Example 1: Spot Scan Request
```json
{
  "jsonrpc": "2.0",
  "method": "tasks/send",
  "params": {
    "id": "task-001",
    "sessionId": "session-xyz",
    "message": {
      "role": "user",
      "parts": [{
        "type": "text",
        "text": "Execute spot_anomaly_scan"
      }, {
        "type": "data",
        "data": {
          "exchanges": ["hyperliquid", "binance"],
          "symbols": ["BTC-USDT", "ETH-USDT", "SOL-USDT"],
          "timeframe": "30m",
          "confidenceThreshold": 0.9,
          "anomalyTypes": ["volume_spike", "price_dislocation"]
        }
      }]
    },
    "acceptedOutputModes": ["json"]
  },
  "id": 1
}
```

### Example 2: Real-Time Subscription
```json
{
  "jsonrpc": "2.0",
  "method": "tasks/sendSubscribe",
  "params": {
    "id": "sub-001",
    "sessionId": "session-xyz",
    "message": {
      "role": "user",
      "parts": [{
        "type": "text",
        "text": "Start realtime_subscription"
      }, {
        "type": "data",
        "data": {
          "filter": {
            "exchanges": ["hyperliquid"],
            "marketTypes": ["perp"],
            "minSeverity": "P0",
            "confidenceThreshold": 0.85,
            "anomalyTypes": ["funding_rate_extreme", "liquidation_cascade"]
          },
          "delivery": {
            "mode": "webhook",
            "webhookUrl": "https://my-agent.internal/alerts"
          },
          "aggregation": {
            "enabled": true,
            "windowSeconds": 30,
            "maxAlertsPerWindow": 3
          }
        }
      }]
    }
  },
  "id": 2
}
```

---

## Error Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "code": { 
      "type": "integer",
      "enum": [-32700, -32600, -32601, -32602, -32603, -32000, -32001, -32002, -32003]
    },
    "message": { "type": "string" },
    "data": {
      "type": "object",
      "properties": {
        "retryAfter": { "type": "integer", "description": "Seconds until retry allowed" },
        "creditsRemaining": { "type": "integer" },
        "rateLimit": {
          "type": "object",
          "properties": {
            "limit": { "type": "integer" },
            "remaining": { "type": "integer" },
            "resetAt": { "type": "string", "format": "date-time" }
          }
        }
      }
    }
  }
}
```

### Error Codes
| Code | Meaning |
|------|---------|
| -32700 | Parse error |
| -32600 | Invalid request |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32603 | Internal error |
| -32000 | Rate limit exceeded |
| -32001 | Insufficient credits |
| -32002 | Invalid API key |
| -32003 | Market data unavailable |

---

## Appendix: Whale Detection Skill — Deep Specification

### On-Chain Data Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ON-CHAIN DATA LAYER                              │
├─────────────────────────────────────────────────────────────────────┤
│  Ethereum │ Solana │ Bitcoin │ Arbitrum │ Base │ Hyperliquid L1    │
│     ↓           ↓         ↓         ↓        ↓         ↓           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ Alchemy │ │ Helius  │ │Glassnode│ │GoldSky  │ │ HL Node │       │
│  │Etherscan│ │Solscan  │ │Blockchair│ │Flipside │ │  RPC    │       │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘       │
│       └─────────────┴─────────────┴─────────────┴────────┘          │
│                              ↓                                      │
│                    ┌─────────────────┐                              │
│                    │  ENTITY GRAPH   │                              │
│                    │  (Label/Cluster)│                              │
│                    │  - Exchanges    │                              │
│                    │  - Funds        │                              │
│                    │  - Whales       │                              │
│                    │  - Smart Contracts│                            │
│                    └─────────────────┘                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Sources

| Provider | Chains | Use Case | Latency | Cost |
|----------|--------|----------|---------|------|
| **Alchemy** | ETH, L2s | Real-time transfers, logs | ~2s | Free tier: 300M CU/mo |
| **Helius** | Solana | Enhanced transactions, parsed swaps | ~400ms | Free tier: 10k requests |
| **Nansen** | Multi | Entity labels, smart money tracking | 5-15 min | $1500+/mo |
| **Arkham** | Multi | Exchange/cluster identification | 1-5 min | Freemium |
| **Dune/Flipside** | Multi | SQL analytics, historical patterns | 15-60 min | Free with limits |
| **Glassnode** | BTC, ETH | On-chain metrics, entity clusters | 1h | $800+/mo |
| **Blockchair** | BTC, ETH, others | Large transaction alerts | ~10 min | Free tier available |

### Whale Signal Types

| Signal | Detection Method | Lead Time | Confidence |
|--------|------------------|-----------|------------|
| **Exchange Inflow** | Wallet → Exchange (CEX hot wallet) | 5-30 min before price impact | High |
| **Exchange Outflow** | Exchange → Wallet (accumulation) | Days-weeks before pump | Medium |
| **DEX Whale Swap** | Large Uniswap/Jupiter swap | Immediate price impact | Very High |
| **OTC Settlement** | Multi-sig → Custody | Hours-days | Medium |
| **Staking/Unstaking** | Lido/Rocket Pool deposits/withdrawals | Days | Medium |
| **Bridge Movement** | L1 ↔ L2 large transfers | 10-30 min | High |
| **Options Exercise** | Deribit/OKX on-chain settlement | Immediate | Very High |

### Entity Clustering

```python
# Pseudocode for entity resolution
class WhaleDetector:
    def cluster_wallets(self, seed_address: str) -> EntityCluster:
        """
        Expand single address to entity cluster using:
        1. Common funding source (same tx funds multiple wallets)
        2. Inter-wallet transfers (internal shuffling)
        3. Time correlation (simultaneous activity)
        4. Contract interactions (same protocols, similar amounts)
        """
        cluster = EntityCluster(
            primary=seed_address,
            labels=self.arkham_lookup(seed_address),
            total_balance=self.aggregate_balances(cluster.addresses),
            exchange_tags=self.identify_exchange_deposits(cluster)
        )
        return cluster
```

### Whale Detection Input Schema (Extended)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "detectionMode": {
      "type": "string",
      "enum": ["realtime", "historical", "pattern_match"],
      "default": "realtime"
    },
    "chains": {
      "type": "array",
      "items": { 
        "enum": ["ethereum", "solana", "bitcoin", "arbitrum", "base", "hyperliquid"] 
      },
      "default": ["ethereum", "solana"]
    },
    "signalTypes": {
      "type": "array",
      "items": { 
        "enum": [
          "exchange_inflow",
          "exchange_outflow", 
          "dex_swap",
          "bridge_transfer",
          "staking_change",
          "contract_interaction",
          "smart_money_copy"
        ] 
      },
      "default": ["exchange_inflow", "dex_swap"]
    },
    "thresholds": {
      "type": "object",
      "properties": {
        "minUsdValue": {
          "type": "number",
          "default": 1000000,
          "description": "Minimum USD value to trigger (1M default)"
        },
        "minTokenAmount": {
          "type": "object",
          "description": "Per-token minimums (e.g., {'ETH': 500, 'BTC': 50})"
        },
        "percentOf24hVolume": {
          "type": "number",
          "default": 5,
          "description": "Alert if transfer > X% of 24h volume"
        }
      }
    },
    "entityFilters": {
      "type": "object",
      "properties": {
        "includeKnownWhales": { "type": "boolean", "default": true },
        "includeExchangeWallets": { "type": "boolean", "default": true },
        "includeSmartMoney": { "type": "boolean", "default": false },
        "specificEntities": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Track specific addresses or entity names"
        },
        "excludeEntities": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Ignore known market makers, etc."
        }
      }
    },
    "correlationAnalysis": {
      "type": "object",
      "properties": {
        "checkPriceImpact": { "type": "boolean", "default": true },
        "checkFundingRate": { "type": "boolean", "default": true },
        "checkSocialSentiment": { "type": "boolean", "default": false },
        "historicalPatternMatch": {
          "type": "object",
          "properties": {
            "enabled": { "type": "boolean", "default": false },
            "lookbackDays": { "type": "integer", "default": 90 },
            "similarityThreshold": { "type": "number", "default": 0.8 }
          }
        }
      }
    },
    "delivery": {
      "type": "object",
      "properties": {
        "latencyTarget": {
          "type": "string",
          "enum": ["realtime", "fast", "batched"],
          "default": "realtime",
          "description": "realtime=<3s, fast=<30s, batched=5min"
        },
        "includeRawTransaction": { "type": "boolean", "default": false }
      }
    }
  }
}
```

### Whale Detection Output Schema (Extended)

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "scanId": { "type": "string" },
    "timestamp": { "type": "string", "format": "date-time" },
    "detectionWindow": {
      "properties": {
        "start": { "type": "string", "format": "date-time" },
        "end": { "type": "string", "format": "date-time" }
      }
    },
    "whaleActivity": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "activityId": { "type": "string", "format": "uuid" },
          "detectedAt": { "type": "string", "format": "date-time" },
          "chain": { "type": "string" },
          "signalType": { 
            "enum": ["exchange_inflow", "exchange_outflow", "dex_swap", "bridge_transfer", "staking_change", "contract_interaction"] 
          },
          "severity": { "enum": ["P0", "P1", "P2", "P3"] },
          "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
          
          "token": {
            "type": "object",
            "properties": {
              "symbol": { "type": "string" },
              "name": { "type": "string" },
              "contractAddress": { "type": "string" },
              "decimals": { "type": "integer" }
            }
          },
          
          "amount": {
            "type": "object",
            "properties": {
              "raw": { "type": "string", "description": "Raw token amount" },
              "formatted": { "type": "number" },
              "usdValue": { "type": "number" },
              "usdValueAtDetection": { "type": "number" }
            }
          },
          
          "parties": {
            "type": "object",
            "properties": {
              "from": {
                "type": "object",
                "properties": {
                  "address": { "type": "string" },
                  "entity": {
                    "type": "object",
                    "properties": {
                      "name": { "type": "string" },
                      "type": { "enum": ["exchange", "fund", "whale", "contract", "unknown"] },
                      "confidence": { "type": "number" },
                      "labels": { "type": "array", "items": { "type": "string" } }
                    }
                  },
                  "walletCluster": {
                    "type": "object",
                    "properties": {
                      "clusterId": { "type": "string" },
                      "totalClusterBalanceUsd": { "type": "number" },
                      "relatedAddresses": { "type": "array", "items": { "type": "string" } }
                    }
                  }
                }
              },
              "to": {
                "type": "object",
                "properties": {
                  "address": { "type": "string" },
                  "entity": {
                    "type": "object",
                    "properties": {
                      "name": { "type": "string" },
                      "type": { "enum": ["exchange", "fund", "whale", "contract", "unknown"] },
                      "confidence": { "type": "number" },
                      "labels": { "type": "array", "items": { "type": "string" } },
                      "exchangeSpecific": {
                        "type": "object",
                        "properties": {
                          "exchangeName": { "type": "string" },
                          "walletType": { "enum": ["hot", "cold", "deposit", "withdrawal"] }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          
          "transaction": {
            "type": "object",
            "properties": {
              "hash": { "type": "string" },
              "blockNumber": { "type": "integer" },
              "blockTimestamp": { "type": "string", "format": "date-time" },
              "confirmations": { "type": "integer" },
              "gasUsed": { "type": "string" },
              "gasPrice": { "type": "string" },
              "explorerUrl": { "type": "string", "format": "uri" }
            }
          },
          
          "marketContext": {
            "type": "object",
            "properties": {
              "priceAtDetection": { "type": "number" },
              "priceChange24h": { "type": "number" },
              "volume24h": { "type": "number" },
              "percentOf24hVolume": { "type": "number" },
              "liquidityDepth": {
                "type": "object",
                "properties": {
                  "dex": { "type": "string" },
                  "slippageForSize": { "type": "number" }
                }
              },
              "fundingRate": {
                "type": "object",
                "properties": {
                  "rate": { "type": "number" },
                  "annualized": { "type": "number" },
                  "exchange": { "type": "string" }
                }
              }
            }
          },
          
          "historicalContext": {
            "type": "object",
            "properties": {
              "previousSimilarMoves": { "type": "integer" },
              "avgPriceImpact7d": { "type": "number" },
              "avgTimeToImpact": { "type": "integer", "description": "Minutes until price moved" },
              "typicalPattern": { "type": "string", "description": "Accumulation/Distribution/FOMO/Panic" }
            }
          },
          
          "correlationSignals": {
            "type": "object",
            "properties": {
              "concurrentWhaleMoves": {
                "type": "array",
                "items": {
                  "properties": {
                    "activityId": { "type": "string" },
                    "correlationScore": { "type": "number" },
                    "timeDeltaSeconds": { "type": "integer" }
                  }
                }
              },
              "cexPremiumDelta": { "type": "number" },
              "perpSpotDivergence": { "type": "number" }
            }
          },
          
          "aiAnalysis": {
            "type": "object",
            "properties": {
              "intentPrediction": {
                "type": "object",
                "properties": {
                  "likelyIntent": { 
                    "enum": ["profit_taking", "accumulation", "market_making", "arbitrage", "unknown"] 
                  },
                  "confidence": { "type": "number" },
                  "reasoning": { "type": "string" }
                }
              },
              "priceImpactEstimate": {
                "type": "object",
                "properties": {
                  "shortTerm": { "type": "number", "description": "Expected % move in 1h" },
                  "mediumTerm": { "type": "number", "description": "Expected % move in 24h" },
                  "confidence": { "type": "number" }
                }
              },
              "relatedNews": {
                "type": "array",
                "items": {
                  "properties": {
                    "headline": { "type": "string" },
                    "source": { "type": "string" },
                    "timestamp": { "type": "string", "format": "date-time" },
                    "sentiment": { "enum": ["positive", "negative", "neutral"] }
                  }
                }
              }
            }
          },
          
          "suggestedActions": {
            "type": "array",
            "items": {
              "properties": {
                "action": { 
                  "enum": ["reduce_exposure", "increase_exposure", "monitor_only", "hedge", "alert_team"] 
                },
                "urgency": { "enum": ["immediate", "high", "medium", "low"] },
                "reasoning": { "type": "string" },
                "confidence": { "type": "number" },
                "timeframe": { "type": "string" }
              }
            }
          }
        },
        "required": ["activityId", "detectedAt", "chain", "signalType", "severity", "confidence"]
      }
    },
    "summary": {
      "type": "object",
      "properties": {
        "totalWhaleMoves": { "type": "integer" },
        "totalVolumeUsd": { "type": "number" },
        "bySignalType": { "type": "object" },
        "byChain": { "type": "object" },
        "highestSeverity": { "type": "string" },
        "mostActiveEntity": { "type": "string" },
        "correlationClusters": {
          "type": "array",
          "items": {
            "properties": {
              "clusterId": { "type": "string" },
              "entities": { "type": "array", "items": { "type": "string" } },
              "coordinated": { "type": "boolean" },
              "totalVolumeUsd": { "type": "number" }
            }
          }
        }
      }
    }
  },
  "required": ["scanId", "timestamp", "whaleActivity"]
}
```

### Real-Time WebSocket Stream Format

```json
{
  "eventType": "whale_alert",
  "timestamp": "2026-03-26T21:45:32.123Z",
  "sequence": 1847293,
  "alert": {
    "activityId": "whale-evt-7f3a...",
    "signalType": "exchange_inflow",
    "severity": "P0",
    "confidence": 0.94,
    "chain": "ethereum",
    
    "token": {
      "symbol": "ETH",
      "name": "Ethereum",
      "usdValue": 12500000
    },
    
    "from": {
      "address": "0x742d...a1b2",
      "entity": {
        "name": "0x742d (Smart Whale)",
        "type": "whale",
        "confidence": 0.89,
        "labels": ["smart_money", "early_adopter", "profitable_30d"]
      },
      "walletCluster": {
        "clusterId": "cluster-0x742d",
        "totalClusterBalanceUsd": 487000000,
        "relatedAddresses": ["0xabc...", "0xdef..."]
      }
    },
    
    "to": {
      "address": "0x3f5c...e9d1",
      "entity": {
        "name": "Binance Hot Wallet 14",
        "type": "exchange",
        "confidence": 0.99,
        "exchangeSpecific": {
          "exchangeName": "Binance",
          "walletType": "hot"
        }
      }
    },
    
    "transaction": {
      "hash": "0x8a2f...4c5d",
      "blockNumber": 19672345,
      "blockTimestamp": "2026-03-26T21:45:28.000Z",
      "confirmations": 3,
      "explorerUrl": "https://etherscan.io/tx/0x8a2f...4c5d"
    },
    
    "marketContext": {
      "priceAtDetection": 3452.12,
      "priceChange24h": -2.3,
      "percentOf24hVolume": 8.4,
      "fundingRate": {
        "rate": 0.0001,
        "annualized": 0.0365,
        "exchange": "Binance"
      }
    },
    
    "aiAnalysis": {
      "intentPrediction": {
        "likelyIntent": "profit_taking",
        "confidence": 0.87,
        "reasoning": "Wallet has 12x unrealized gains, moving to exchange after 180 days of holding. Previous similar moves preceded 3-5% corrections within 6 hours."
      },
      "priceImpactEstimate": {
        "shortTerm": -3.2,
        "mediumTerm": -1.8,
        "confidence": 0.72
      }
    },
    
    "suggestedActions": [
      {
        "action": "hedge",
        "urgency": "high",
        "reasoning": "$12.5M inflow to Binance from profitable whale with 87% historical accuracy on tops",
        "confidence": 0.84,
        "timeframe": "next 2-4 hours"
      },
      {
        "action": "monitor_only",
        "urgency": "medium",
        "reasoning": "Wait for confirmation via price action or additional inflows",
        "confidence": 0.65,
        "timeframe": "30 minutes"
      }
    ]
  }
}
```

### Implementation Notes

**1. Entity Labeling Pipeline**
```python
# Multi-source entity resolution
async def resolve_entity(address: str, chain: str) -> Entity:
    # 1. Check Arkham (highest quality labels)
    arkham = await arkham_client.get_entity(address)
    if arkham.confidence > 0.9:
        return arkham
    
    # 2. Check Nansen (smart money labels)
    nansen = await nansen_client.get_smart_money(address)
    if nansen.is_smart_money:
        return Entity(type="whale", labels=["smart_money"], confidence=0.85)
    
    # 3. Heuristic clustering
    cluster = await cluster_analyzer.find_cluster(address)
    if cluster.total_value > 100_000_000:
        return Entity(type="whale", labels=["large_holder"], confidence=0.7)
    
    return Entity(type="unknown", confidence=0.5)
```

**2. Smart Money Scoring**
| Metric | Weight | Description |
|--------|--------|-------------|
| 30d PnL | 0.30 | Recent profitability |
| Win Rate | 0.25 | % of profitable trades |
| Sharpe Ratio | 0.20 | Risk-adjusted returns |
| Early Entry | 0.15 | How early they enter trends |
| Consistency | 0.10 | Regularity of profitable moves |

**3. Latency Optimization**
- **Ethereum:** Alchemy WebSocket for pending transactions (mempool monitoring)
- **Solana:** Helius webhooks on parsed transactions
- **Bitcoin:** Blockstream API with WebSocket
- **Cross-chain:** Aggregate and deduplicate within 500ms window

**4. Cost Optimization**
```
Free Tier Architecture:
- Alchemy: 300M compute units/month (sufficient for ~50 whale addresses)
- Helius: 10k requests/month (use webhooks, not polling)
- Arkham: Free tier includes basic entity labels
- Dune: Free for historical analysis, not real-time

Paid Scaling:
- Nansen: $1500/mo for full smart money API
- Glassnode: $800/mo for on-chain metrics
- Custom node: $500/mo for dedicated Ethereum node (no rate limits)

---

# ON HOLD: Agent-First Prediction Market Platform (APM)

**Status:** Design complete, implementation pending  
**Added:** 2026-03-26  
**Dependency:** Agent economy adoption (A2A protocol, MCP, agent wallets)  
**Related:** `a2a_server.py`, Whale Detection Engine

## Thesis Recap

When agents become the majority user base, prediction markets shift from:
- **B2C** (retail traders, betting) → **B2B** (agent developers, infrastructure)
- **Information broadcast** (free public prices) → **Information monetization** (API feeds)
- **Prediction-only** → **Outcome-execution coupling** (conditional actions)

## Architecture: Agent-First Prediction Market

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AGENT ECONOMY LAYER                                  │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │ Portfolio Agent │  │ Arbitrage Bot   │  │ Enterprise Risk Manager     │  │
│  │ (Rebalancing)   │  │ (Cross-platform)│  │ (Treasury operations)       │  │
│  └────────┬────────┘  └────────┬────────┘  └─────────────┬───────────────┘  │
│           │                    │                          │                 │
│           └────────────────────┼──────────────────────────┘                 │
│                                ↓                                            │
│                    ┌─────────────────────┐                                  │
│                    │   A2A Discovery     │                                  │
│                    │   Agent Card: APM   │                                  │
│                    └─────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                    APM PLATFORM (Agent Prediction Markets)                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  TIER 1: SIGNAL FEEDS (Sell Information)                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  /v1/signals/stream        WebSocket real-time probability changes │   │
│  │  /v1/signals/batch         Historical data for backtesting         │   │
│  │  /v1/signals/anomalies     Divergence detection vs. other sources  │   │
│  │  Pricing: $500-5000/mo based on market coverage + latency          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  TIER 2: CONDITIONAL EXECUTION (Sell Outcomes)                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  /v1/conditions/register   Register trigger-action pairs           │   │
│  │  /v1/conditions/execute    Manual execution endpoint               │   │
│  │  /v1/oracles/resolve       Settlement verification                 │   │
│  │  Pricing: 0.01-0.1% per executed transaction                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  TIER 3: AGENT INTELLIGENCE (Value-Add)                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  /v1/agents/consensus      Aggregated agent sentiment              │   │
│  │  /v1/agents/flows          Capital flow analysis                   │   │
│  │  /v1/agents/correlations   Cross-market pattern detection          │   │
│  │  Pricing: Enterprise deals, revenue share                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ↓
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MARKET MECHANISM LAYER                               │
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ Order Book   │  │ AMM Pools    │  │ Resolution   │  │ Settlement     │  │
│  │ (High-freq)  │  │ (Liquidity)  │  │ (Oracles)    │  │ (Multi-chain)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────────┘  │
│                                                                              │
│  Key difference from human markets:                                          │
│  - 1000x more markets (micro-predictions)                                    │
│  - Hours/days resolution (not months)                                        │
│  - Objective outcomes (code-verifiable)                                      │
│  - No UI needed (API-native)                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## A2A Agent Card for APM Platform

```json
{
  "name": "AgentPredictionMarkets",
  "description": "Agent-first prediction market infrastructure. Signal feeds, conditional execution, and outcome verification for autonomous agents.",
  "url": "https://api.agentpm.io",
  "version": "1.0.0",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true,
    "conditionalExecution": true
  },
  "skills": [
    {
      "id": "signal_feed",
      "name": "Real-time Probability Signals",
      "description": "Streaming probability updates with confidence intervals, order flow, and anomaly detection",
      "tags": ["signals", "streaming", "probabilities", "alpha"],
      "pricing": {
        "model": "subscription",
        "tiers": [
          {"name": "scout", "price": 499, "markets": 10, "latency_ms": 5000},
          {"name": "trader", "price": 1999, "markets": 50, "latency_ms": 1000},
          {"name": "pro", "price": 4999, "markets": 200, "latency_ms": 100}
        ]
      },
      "examples": [
        "Subscribe to all crypto-related markets with <1s latency",
        "Get divergence alerts when APM diverges >5% from Polymarket"
      ]
    },
    {
      "id": "conditional_execution",
      "name": "Outcome-Triggered Actions",
      "description": "Register actions that execute automatically when markets resolve",
      "tags": ["execution", "automation", "triggers", "settlement"],
      "pricing": {
        "model": "per-execution",
        "base_fee": 0.001,
        "settlement_verification": 0.0005
      },
      "examples": [
        "When BTC ETF approved, automatically swap USDC to BTC",
        "If Fed cuts rates, increase ETH long by 15%"
      ]
    },
    {
      "id": "agent_consensus",
      "name": "Aggregated Agent Intelligence",
      "description": "Anonymized sentiment and positioning data from agent activity",
      "tags": ["consensus", "sentiment", "positioning", "whale-watching"],
      "pricing": {
        "model": "revenue-share",
        "signal_contribution": 0.05
      },
      "examples": [
        "What percentage of agents are long ETH this week?",
        "Show agent capital flows into prediction markets"
      ]
    },
    {
      "id": "market_creation",
      "name": "Agent-Optimized Market Creation",
      "description": "Create prediction markets designed for agent participation",
      "tags": ["market-creation", "agent-markets", "objective-outcomes"],
      "pricing": {
        "model": "per-market",
        "creation_fee": 10,
        "liquidity_subsidy": "optional"
      },
      "examples": [
        "Create market: Will Uniswap v4 launch before March 31?",
        "Create market: Will L2 X achieve 1000 TPS sustained for 1 hour?"
      ]
    }
  ],
  "authentication": {
    "schemes": ["apiKey", "walletSignature"],
    "apiKey": {
      "header": "X-API-Key",
      "location": "https://agentpm.io/settings/api-keys"
    },
    "walletSignature": {
      "scheme": "siwe",
      "message": "Sign in to AgentPredictionMarkets"
    }
  },
  "defaultInputModes": ["text", "data"],
  "defaultOutputModes": ["json", "text"]
}
```

## Market Types: Agent-Optimized

### Traditional (Human) Markets
| Market | Resolution | Frequency | Outcome Type |
|--------|------------|-----------|--------------|
| Will Trump win 2028? | Months | Low | Subjective |
| Next Fed decision | Weeks | Medium | Institutional |
| Super Bowl winner | Months | Low | Objective |

### Agent-Optimized Markets
| Market | Resolution | Frequency | Outcome Type | Use Case |
|--------|------------|-----------|--------------|----------|
| BTC volatility >50% next hour? | 1 hour | Very High | Code-verifiable | Options pricing |
| Uniswap v4 launches before March 31? | Days | High | Code-verifiable | Protocol timelines |
| L2 achieves 1000 TPS sustained? | Real-time | Continuous | On-chain metric | Infrastructure monitoring |
| ETH funding rate turns negative? | Hours | High | Exchange API | Perp trading |
| Agent consensus on BTC direction? | Rolling | Continuous | Platform metric | Sentiment analysis |

## Conditional Execution API

### Registering a Trigger

```json
{
  "jsonrpc": "2.0",
  "method": "tasks/send",
  "params": {
    "id": "condition-001",
    "message": {
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "Register conditional execution"
        },
        {
          "type": "data",
          "data": {
            "skill": "conditional_execution",
            "condition": {
              "marketId": "btc-etf-approved",
              "trigger": "resolution",
              "outcome": "yes",
              "confidenceThreshold": 0.99
            },
            "action": {
              "type": "swap",
              "venue": "hyperliquid",
              "from": {
                "asset": "USDC",
                "amount": "100000"
              },
              "to": {
                "asset": "BTC",
                "slippageTolerance": 0.005
              }
            },
            "settlement": {
              "autoExecute": true,
              "maxDelaySeconds": 60,
              "fallbackAction": "notify-only"
            }
          }
        }
      ]
    }
  }
}
```

### Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "id": "condition-001",
    "status": "active",
    "expiresAt": "2026-12-31T23:59:59Z",
    "estimatedExecutionTime": "<5s post-resolution",
    "fees": {
      "registration": 0.1,
      "estimatedExecution": 0.001
    }
  }
}
```

## Streaming Signal Format

```json
{
  "eventType": "signal_update",
  "timestamp": "2026-03-26T22:15:32.123Z",
  "marketId": "btc-100k-2025",
  "signal": {
    "probability": 0.34,
    "previousProbability": 0.31,
    "change24h": 0.03,
    "confidenceInterval": [0.32, 0.36],
    "sampleSize": 15234,
    "liquidity": {
      "total": 2450000,
      "bidDepth": 150000,
      "askDepth": 180000,
      "spreadBps": 12
    },
    "orderFlow": {
      "imbalance": -0.15,
      "buyVolume24h": 890000,
      "sellVolume24h": 1020000,
      "largeOrders": [
        {
          "side": "sell",
          "size": 500000,
          "entityType": "institutional",
          "confidence": 0.85
        }
      ]
    },
    "crossPlatformDivergence": {
      "polymarket": 0.36,
      "kalshi": 0.33,
      "divergenceBps": 300,
      "arbitrageOpportunity": true
    }
  },
  "anomalyDetection": {
    "alert": false,
    "zScore": 1.2,
    "description": "Normal volatility"
  }
}
```

## Agent Consensus Intelligence

```json
{
  "endpoint": "/v1/agents/consensus",
  "method": "tasks/send",
  "response": {
    "marketId": "eth-direction-24h",
    "timestamp": "2026-03-26T22:00:00Z",
    "agentActivity": {
      "totalAgents": 1247,
      "activeLastHour": 342,
      "positioning": {
        "long": 0.58,
        "short": 0.32,
        "neutral": 0.10
      },
      "confidence": {
        "high": 0.25,
        "medium": 0.45,
        "low": 0.30
      },
      "capitalDeployed": {
        "total": 45000000,
        "long": 31000000,
        "short": 14000000
      }
    },
    "sentiment": {
      "current": "bullish",
      "previous": "neutral",
      "change": "+0.3",
      "drivingFactors": [
        "Large institutional inflows detected",
        "Funding rate turning positive",
        "Whale accumulation on-chain"
      ]
    },
    "predictivePower": {
      "historicalAccuracy": 0.67,
      "sampleSize": 156,
      "timeHorizon": "24h"
    }
  }
}
```

## Integration with MarketAnomalyScanner

The APM platform leverages our existing anomaly detection:

```python
# Cross-skill integration
class APMAnomalyBridge:
    def __init__(self):
        self.anomaly_scanner = MarketAnomalyScanner()
        self.apm = AgentPredictionMarkets()
    
    async def detect_prediction_arbitrage(self):
        # Get whale signals
        whale_alert = await self.anomaly_scanner.whale_watch(
            chains=["ethereum"],
            signalTypes=["exchange_inflow"]
        )
        
        # Check if prediction market has priced this in
        pm_probability = await self.apm.get_probability(
            market="btc-direction-24h"
        )
        
        # If whale is selling but PM is bullish = divergence
        if whale_alert.confidence > 0.9 and pm_probability > 0.6:
            return {
                "signal": "divergence_detected",
                "confidence": 0.84,
                "recommendedAction": "short_pm_long_spot",
                "expectedEdge": 0.08
            }
```

## Revenue Model

| Tier | Monthly | API Calls | Markets | Latency | Best For |
|------|---------|-----------|---------|---------|----------|
| **Scout** | $499 | 10k | 10 | 5s | Individual agents |
| **Trader** | $1,999 | 100k | 50 | 1s | Trading bots |
| **Pro** | $4,999 | 1M | 200 | 100ms | Quant funds |
| **Enterprise** | Custom | Unlimited | All | 10ms | Infrastructure |

**Additional Revenue:**
- Execution fees: 0.01-0.1% per conditional trade
- Market creation: $10-100 per market
- Data licensing: Custom deals for aggregated intelligence

## When to Resume This Project

**Triggers:**
1. A2A protocol adoption reaches critical mass (>100 agent platforms)
2. MCP (Model Context Protocol) standardizes agent-tool interfaces
3. Major prediction market (Polymarket/Kalshi) releases enterprise API
4. Agent wallet infrastructure matures (Safe, Turnkey, etc.)
5. VC appetite returns for B2B agent infrastructure

**Dependencies from ON HOLD list:**
- A2A server implementation (`a2a_server.py`)
- Whale detection engine (when integrated with real on-chain data)
- Entity resolution pipeline (Arkham/Nansen integration)

---

**Next action when resuming:**
1. Build minimal signal feed API with mock data
2. Create agent SDK (Python/TypeScript) for easy integration
3. Launch with 3-5 pilot agent developers
4. Iterate on conditional execution UX
5. Scale to real markets once liquidity committed

```
