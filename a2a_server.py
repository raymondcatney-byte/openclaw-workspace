"""
A2A (Agent-to-Agent) Protocol Server
MarketAnomalyScanner - Whale Detection & Market Intelligence

Implements Google A2A Protocol for agent interoperability.
"""

import asyncio
import json
import uuid
import time
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, AsyncGenerator
from contextlib import asynccontextmanager
from enum import Enum

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field, validator
import uvicorn

# ============================================================================
# Configuration
# ============================================================================

AGENT_CONFIG = {
    "name": "MarketAnomalyScanner",
    "description": "Real-time market intelligence service. Detects whale movements, cross-asset correlations, unusual price movements, and Polymarket prediction market divergences.",
    "url": "https://api.anomalyscan.io",
    "version": "1.1.0",
    "capabilities": {
        "streaming": True,
        "pushNotifications": True
    },
    "authentication": {
        "schemes": ["apiKey", "oauth2"],
        "apiKey": {
            "header": "X-API-Key",
            "location": "https://anomalyscan.io/settings/api-keys"
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

# Rate limits per tier (requests per minute)
RATE_LIMITS = {
    "free": {"requests": 10, "streams": 1},
    "trader": {"requests": 100, "streams": 3},
    "pro": {"requests": 1000, "streams": 10},
    "enterprise": {"requests": 10000, "streams": 50}
}

# Mock API keys for demo (in production, use proper database)
API_KEYS = {
    "demo-free-tier": {"tier": "free", "credits": 100},
    "demo-trader-tier": {"tier": "trader", "credits": 1000},
    "demo-pro-tier": {"tier": "pro", "credits": 10000},
}

# ============================================================================
# Enums and Types
# ============================================================================

class TaskState(str, Enum):
    SUBMITTED = "submitted"
    WORKING = "working"
    COMPLETED = "completed"
    CANCELED = "canceled"
    FAILED = "failed"

class Severity(str, Enum):
    P0 = "P0"
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"

class SignalType(str, Enum):
    EXCHANGE_INFLOW = "exchange_inflow"
    EXCHANGE_OUTFLOW = "exchange_outflow"
    DEX_SWAP = "dex_swap"
    BRIDGE_TRANSFER = "bridge_transfer"
    STAKING_CHANGE = "staking_change"
    CONTRACT_INTERACTION = "contract_interaction"

class EntityType(str, Enum):
    EXCHANGE = "exchange"
    FUND = "fund"
    WHALE = "whale"
    CONTRACT = "contract"
    UNKNOWN = "unknown"

class Intent(str, Enum):
    PROFIT_TAKING = "profit_taking"
    ACCUMULATION = "accumulation"
    MARKET_MAKING = "market_making"
    ARBITRAGE = "arbitrage"
    UNKNOWN = "unknown"

# ============================================================================
# Pydantic Models
# ============================================================================

class TextPart(BaseModel):
    type: str = "text"
    text: str

class DataPart(BaseModel):
    type: str = "data"
    data: Dict[str, Any]

class Message(BaseModel):
    role: str = "user"
    parts: List[Dict[str, Any]]

class TaskRequest(BaseModel):
    id: str
    sessionId: Optional[str] = None
    message: Message
    acceptedOutputModes: Optional[List[str]] = None
    skillId: Optional[str] = None

class TaskResponse(BaseModel):
    jsonrpc: str = "2.0"
    result: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None
    id: Optional[int] = None

class Artifact(BaseModel):
    type: str = "json"
    title: str
    content: Dict[str, Any]

class WhaleThresholds(BaseModel):
    minUsdValue: float = 1_000_000
    minTokenAmount: Optional[Dict[str, float]] = None
    percentOf24hVolume: float = 5.0

class EntityFilters(BaseModel):
    includeKnownWhales: bool = True
    includeExchangeWallets: bool = True
    includeSmartMoney: bool = False
    specificEntities: Optional[List[str]] = None
    excludeEntities: Optional[List[str]] = None

class WhaleScanRequest(BaseModel):
    detectionMode: str = "realtime"
    chains: List[str] = ["ethereum", "solana"]
    signalTypes: List[str] = ["exchange_inflow", "dex_swap"]
    thresholds: WhaleThresholds = Field(default_factory=WhaleThresholds)
    entityFilters: EntityFilters = Field(default_factory=EntityFilters)


# ============================================================================
# New Market Intelligence Models
# ============================================================================

class RTDSPriceRequest(BaseModel):
    """Request real-time price data from RTDS."""
    symbols: List[str] = Field(default=["BTC", "ETH", "SPY", "QQQ"])
    includeMetadata: bool = True

class RTDSPriceResponse(BaseModel):
    symbol: str
    price: float
    change24h: float
    volume24h: float
    high24h: float
    low24h: float
    assetClass: str
    lastUpdated: str
    isCarriedForward: bool = False

class CrossAssetSignalRequest(BaseModel):
    """Request cross-asset correlation signals."""
    symbols: List[str] = Field(default=["BTC", "ETH", "SPY", "QQQ", "XAUUSD", "VXX"])
    minConfidence: float = 0.6
    lookbackWindow: int = 300  # seconds

class SignalDetails(BaseModel):
    type: str
    severity: str
    description: str
    confidence: float
    timestamp: str
    affectedAssets: List[str]
    regimeContext: str
    thesis: str

class CrossAssetSignalResponse(BaseModel):
    signals: List[SignalDetails]
    currentRegime: str
    regimeConfidence: float
    regimeDuration: int  # seconds
    totalAnalyzed: int
    generatedAt: str

class UnusualMovementRequest(BaseModel):
    """Request unusual movement detection."""
    symbols: List[str] = Field(default=["BTC", "ETH", "SOL", "AAPL", "TSLA", "NVDA", "SPY", "QQQ"])
    detectionTypes: List[str] = Field(default=["flash_crash", "pump", "volatility_expansion", "trend_reversal"])
    sensitivity: str = "medium"  # low, medium, high
    lookbackMinutes: int = 5

class MovementAlert(BaseModel):
    symbol: str
    type: str
    severity: str
    triggerPrice: float
    priceChange: float  # percent
    volumeAnomaly: Optional[float] = None  # z-score
    timestamp: str
    description: str
    suggestedAction: str

class UnusualMovementResponse(BaseModel):
    alerts: List[MovementAlert]
    monitoredCount: int
    scanWindow: int  # seconds
    generatedAt: str

class SovereignSignalRequest(BaseModel):
    """Request sovereign signals - PM divergence detection."""
    minEdgeScore: int = 40
    maxEvents: int = 50
    categories: List[str] = Field(default=["crypto", "politics", "finance", "tech"])
    includePmData: bool = True

class PmEvent(BaseModel):
    id: str
    title: str
    category: str
    probability: float
    probabilityChange24h: float
    volume24h: float
    liquidity: float
    relatedAssets: List[str]

class SovereignSignalDetails(BaseModel):
    id: str
    type: str
    severity: str
    title: str
    description: str
    edgeScore: int
    alignmentScore: int
    confidence: int
    priceSymbol: str
    currentPrice: float
    priceChange24h: float
    polymarketEvent: Optional[PmEvent] = None
    thesis: str
    timeHorizon: str
    conviction: str
    regimeContext: str

class SovereignSignalResponse(BaseModel):
    signals: List[SovereignSignalDetails]
    totalEvents: int
    pmConnected: bool
    lastPmUpdate: Optional[str] = None
    currentRegime: str
    generatedAt: str

# ============================================================================
# Task Store (In-Memory for Demo)
# ============================================================================

class TaskStore:
    def __init__(self):
        self.tasks: Dict[str, Dict[str, Any]] = {}
        self.subscribers: Dict[str, List[WebSocket]] = {}
        self.rate_counters: Dict[str, Dict[str, Any]] = {}
    
    def create_task(self, task_id: str, skill_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
        task = {
            "id": task_id,
            "skillId": skill_id,
            "state": TaskState.SUBMITTED,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "updatedAt": datetime.now(timezone.utc).isoformat(),
            "params": params,
            "artifacts": [],
            "status": None
        }
        self.tasks[task_id] = task
        return task
    
    def update_task(self, task_id: str, state: TaskState, artifacts: Optional[List[Artifact]] = None):
        if task_id not in self.tasks:
            return None
        self.tasks[task_id]["state"] = state
        self.tasks[task_id]["updatedAt"] = datetime.now(timezone.utc).isoformat()
        if artifacts:
            self.tasks[task_id]["artifacts"].extend([a.model_dump() for a in artifacts])
        return self.tasks[task_id]
    
    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        return self.tasks.get(task_id)
    
    def add_subscriber(self, session_id: str, websocket: WebSocket):
        if session_id not in self.subscribers:
            self.subscribers[session_id] = []
        self.subscribers[session_id].append(websocket)
    
    def remove_subscriber(self, session_id: str, websocket: WebSocket):
        if session_id in self.subscribers:
            if websocket in self.subscribers[session_id]:
                self.subscribers[session_id].remove(websocket)
    
    async def broadcast_to_session(self, session_id: str, message: Dict[str, Any]):
        if session_id in self.subscribers:
            disconnected = []
            for ws in self.subscribers[session_id]:
                try:
                    await ws.send_json(message)
                except:
                    disconnected.append(ws)
            for ws in disconnected:
                self.subscribers[session_id].remove(ws)
    
    def check_rate_limit(self, api_key: str, tier: str) -> bool:
        now = time.time()
        window_start = now - 60  # 1 minute window
        
        if api_key not in self.rate_counters:
            self.rate_counters[api_key] = {"requests": [], "streams": 0}
        
        # Clean old requests
        self.rate_counters[api_key]["requests"] = [
            req_time for req_time in self.rate_counters[api_key]["requests"]
            if req_time > window_start
        ]
        
        limit = RATE_LIMITS[tier]["requests"]
        if len(self.rate_counters[api_key]["requests"]) >= limit:
            return False
        
        self.rate_counters[api_key]["requests"].append(now)
        return True

task_store = TaskStore()

# ============================================================================
# Whale Detection Engine (Mock Implementation)
# ============================================================================

class WhaleDetectionEngine:
    """
    Mock whale detection engine.
    In production, this would integrate with:
    - Alchemy/Helius for real-time transaction monitoring
    - Arkham/Nansen for entity labeling
    - Custom clustering algorithms
    """
    
    KNOWN_ENTITIES = {
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb": {
            "name": "Smart Whale 742d",
            "type": EntityType.WHALE,
            "labels": ["smart_money", "profitable_30d"],
            "cluster_balance": 487_000_000
        },
        "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0b": {
            "name": "Binance Hot Wallet 14",
            "type": EntityType.EXCHANGE,
            "labels": ["exchange", "binance"],
            "exchange_name": "Binance",
            "wallet_type": "hot"
        }
    }
    
    async def scan(self, params: WhaleScanRequest) -> Dict[str, Any]:
        """Execute whale detection scan based on parameters."""
        await asyncio.sleep(0.5)  # Simulate processing
        
        scan_id = str(uuid.uuid4())
        detected_activities = []
        
        # Mock detection based on thresholds
        if "exchange_inflow" in params.signalTypes and params.thresholds.minUsdValue <= 10_000_000:
            detected_activities.append(self._create_mock_exchange_inflow())
        
        if "dex_swap" in params.signalTypes and params.thresholds.minUsdValue <= 5_000_000:
            detected_activities.append(self._create_mock_dex_swap())
        
        return {
            "scanId": scan_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "detectionWindow": {
                "start": datetime.now(timezone.utc).isoformat(),
                "end": datetime.now(timezone.utc).isoformat()
            },
            "whaleActivity": detected_activities,
            "summary": {
                "totalWhaleMoves": len(detected_activities),
                "totalVolumeUsd": sum(a["amount"]["usdValue"] for a in detected_activities),
                "bySignalType": {"exchange_inflow": 1, "dex_swap": 1},
                "byChain": {"ethereum": 2},
                "highestSeverity": "P0",
                "mostActiveEntity": "Smart Whale 742d",
                "correlationClusters": []
            }
        }
    
    async def stream_alerts(self, params: WhaleScanRequest) -> AsyncGenerator[Dict[str, Any], None]:
        """Generate real-time whale alert stream."""
        sequence = 0
        
        while True:
            await asyncio.sleep(5)  # New alert every 5 seconds (demo)
            sequence += 1
            
            alert = self._create_mock_streaming_alert(sequence)
            yield alert
            
            # Stop after 10 alerts for demo
            if sequence >= 10:
                break
    
    def _create_mock_exchange_inflow(self) -> Dict[str, Any]:
        return {
            "activityId": str(uuid.uuid4()),
            "detectedAt": datetime.now(timezone.utc).isoformat(),
            "chain": "ethereum",
            "signalType": SignalType.EXCHANGE_INFLOW,
            "severity": Severity.P0,
            "confidence": 0.94,
            "token": {
                "symbol": "ETH",
                "name": "Ethereum",
                "contractAddress": "0x0000000000000000000000000000000000000000",
                "decimals": 18
            },
            "amount": {
                "raw": "3620000000000000000000",
                "formatted": 3620.0,
                "usdValue": 12_500_000,
                "usdValueAtDetection": 12_500_000
            },
            "parties": {
                "from": {
                    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
                    "entity": {
                        "name": "Smart Whale 742d",
                        "type": EntityType.WHALE,
                        "confidence": 0.89,
                        "labels": ["smart_money", "profitable_30d"]
                    },
                    "walletCluster": {
                        "clusterId": "cluster-0x742d",
                        "totalClusterBalanceUsd": 487_000_000,
                        "relatedAddresses": ["0xabc123...", "0xdef456..."]
                    }
                },
                "to": {
                    "address": "0x3f5CE5FBFe3E9af3971dD833D26bA9b5C936f0b",
                    "entity": {
                        "name": "Binance Hot Wallet 14",
                        "type": EntityType.EXCHANGE,
                        "confidence": 0.99,
                        "labels": ["exchange", "binance"],
                        "exchangeSpecific": {
                            "exchangeName": "Binance",
                            "walletType": "hot"
                        }
                    }
                }
            },
            "transaction": {
                "hash": "0x8a2f4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b",
                "blockNumber": 19672345,
                "blockTimestamp": datetime.now(timezone.utc).isoformat(),
                "confirmations": 12,
                "gasUsed": "21000",
                "gasPrice": "25000000000",
                "explorerUrl": "https://etherscan.io/tx/0x8a2f..."
            },
            "marketContext": {
                "priceAtDetection": 3452.12,
                "priceChange24h": -2.3,
                "volume24h": 15_200_000_000,
                "percentOf24hVolume": 8.4,
                "fundingRate": {
                    "rate": 0.0001,
                    "annualized": 0.0365,
                    "exchange": "Binance"
                }
            },
            "aiAnalysis": {
                "intentPrediction": {
                    "likelyIntent": Intent.PROFIT_TAKING,
                    "confidence": 0.87,
                    "reasoning": "Wallet has 12x unrealized gains, moving to exchange after 180 days of holding."
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
                    "reasoning": "$12.5M inflow from profitable whale with 87% historical accuracy",
                    "confidence": 0.84,
                    "timeframe": "next 2-4 hours"
                }
            ]
        }
    
    def _create_mock_dex_swap(self) -> Dict[str, Any]:
        return {
            "activityId": str(uuid.uuid4()),
            "detectedAt": datetime.now(timezone.utc).isoformat(),
            "chain": "ethereum",
            "signalType": SignalType.DEX_SWAP,
            "severity": Severity.P1,
            "confidence": 0.91,
            "token": {
                "symbol": "PEPE",
                "name": "Pepe",
                "contractAddress": "0x6982508145454Ce325dDbE47a25d4ec3d2311933",
                "decimals": 18
            },
            "amount": {
                "raw": "5000000000000000000000000",
                "formatted": 5_000_000,
                "usdValue": 5_000_000,
                "usdValueAtDetection": 5_000_000
            },
            "parties": {
                "from": {
                    "address": "0x1234...abcd",
                    "entity": {
                        "name": "Unknown",
                        "type": EntityType.UNKNOWN,
                        "confidence": 0.5,
                        "labels": []
                    }
                },
                "to": {
                    "address": "Uniswap V3 Pool",
                    "entity": {
                        "name": "Uniswap V3",
                        "type": EntityType.CONTRACT,
                        "confidence": 1.0,
                        "labels": ["dex", "uniswap"]
                    }
                }
            },
            "aiAnalysis": {
                "intentPrediction": {
                    "likelyIntent": Intent.ACCUMULATION,
                    "confidence": 0.65,
                    "reasoning": "Large swap into memecoin during market consolidation."
                }
            },
            "suggestedActions": [
                {
                    "action": "monitor_only",
                    "urgency": "medium",
                    "reasoning": "Memecoin whale activity, high volatility expected",
                    "confidence": 0.60,
                    "timeframe": "1-2 hours"
                }
            ]
        }
    
    def _create_mock_streaming_alert(self, sequence: int) -> Dict[str, Any]:
        return {
            "eventType": "whale_alert",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "sequence": sequence,
            "alert": self._create_mock_exchange_inflow()
        }

whale_engine = WhaleDetectionEngine()


# ============================================================================
# Market Intelligence Engines (New)
# ============================================================================

class RTDSEngine:
    """
    Real-time price data engine.
    In production: Connect to Polymarket RTDS WebSocket.
    """
    
    MOCK_PRICES = {
        "BTC": {"price": 67234.50, "change24h": 2.3, "volume24h": 28_500_000_000, "high24h": 68100.00, "low24h": 65400.00, "assetClass": "crypto"},
        "ETH": {"price": 3456.78, "change24h": 1.8, "volume24h": 15_200_000_000, "high24h": 3520.00, "low24h": 3380.00, "assetClass": "crypto"},
        "SOL": {"price": 178.45, "change24h": 5.2, "volume24h": 4_100_000_000, "high24h": 185.00, "low24h": 169.20, "assetClass": "crypto"},
        "SPY": {"price": 518.32, "change24h": -0.4, "volume24h": 45_000_000, "high24h": 521.50, "low24h": 515.80, "assetClass": "equity"},
        "QQQ": {"price": 442.18, "change24h": 0.2, "volume24h": 28_000_000, "high24h": 445.00, "low24h": 439.50, "assetClass": "equity"},
        "VXX": {"price": 14.82, "change24h": -2.1, "volume24h": 12_000_000, "high24h": 15.20, "low24h": 14.65, "assetClass": "equity"},
        "AAPL": {"price": 168.45, "change24h": 0.8, "volume24h": 52_000_000, "high24h": 170.00, "low24h": 166.80, "assetClass": "equity"},
        "TSLA": {"price": 175.23, "change24h": -1.5, "volume24h": 98_000_000, "high24h": 179.50, "low24h": 173.20, "assetClass": "equity"},
        "NVDA": {"price": 878.56, "change24h": 3.2, "volume24h": 45_000_000, "high24h": 890.00, "low24h": 855.00, "assetClass": "equity"},
        "XAUUSD": {"price": 2234.50, "change24h": 0.5, "volume24h": 125_000_000, "high24h": 2245.00, "low24h": 2220.00, "assetClass": "metal"},
    }
    
    async def get_prices(self, symbols: List[str]) -> List[RTDSPriceResponse]:
        """Get current prices for symbols."""
        results = []
        now = datetime.now(timezone.utc).isoformat()
        
        for symbol in symbols:
            if symbol.upper() in self.MOCK_PRICES:
                data = self.MOCK_PRICES[symbol.upper()]
                results.append(RTDSPriceResponse(
                    symbol=symbol.upper(),
                    price=data["price"],
                    change24h=data["change24h"],
                    volume24h=data["volume24h"],
                    high24h=data["high24h"],
                    low24h=data["low24h"],
                    assetClass=data["assetClass"],
                    lastUpdated=now,
                    isCarriedForward=False
                ))
        
        return results
    
    async def stream_prices(self, symbols: List[str]):
        """Stream price updates."""
        sequence = 0
        while True:
            await asyncio.sleep(3)
            sequence += 1
            
            # Simulate small price movements
            updates = []
            for symbol in symbols:
                if symbol.upper() in self.MOCK_PRICES:
                    base = self.MOCK_PRICES[symbol.upper()]["price"]
                    noise = (hash(symbol + str(sequence)) % 100 - 50) / 1000
                    updates.append({
                        "symbol": symbol.upper(),
                        "price": round(base * (1 + noise), 2),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "sequence": sequence
                    })
            
            yield {
                "eventType": "price_update",
                "updates": updates,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }


class CrossAssetEngine:
    """
    Cross-asset correlation and regime detection engine.
    """
    
    REGIMES = {
        "expansion_risk_on": {"label": "Expansion (Risk On)", "emoji": "🚀", "color": "#22c55e"},
        "contraction_risk_off": {"label": "Contraction (Risk Off)", "emoji": "🛡️", "color": "#ef4444"},
        "dollar_dominance": {"label": "Dollar Dominance", "emoji": "💵", "color": "#3b82f6"},
        "inflation_hedge": {"label": "Inflation Hedge", "emoji": "🥇", "color": "#f59e0b"},
        "geopolitical_stress": {"label": "Geopolitical Stress", "emoji": "⚠️", "color": "#f97316"},
        "tech_momentum": {"label": "Tech Momentum", "emoji": "💻", "color": "#8b5cf6"},
        "crypto_spring": {"label": "Crypto Spring", "emoji": "🌱", "color": "#10b981"},
        "crypto_winter": {"label": "Crypto Winter", "emoji": "❄️", "color": "#06b6d4"},
        "choppy_neutral": {"label": "Choppy Neutral", "emoji": "〰️", "color": "#64748b"},
        "unclear": {"label": "Unclear", "emoji": "❓", "color": "#94a3b8"},
    }
    
    async def analyze(self, symbols: List[str], min_confidence: float) -> CrossAssetSignalResponse:
        """Generate cross-asset signals."""
        await asyncio.sleep(0.3)
        
        now = datetime.now(timezone.utc).isoformat()
        
        # Mock regime detection
        import random
        regime_key = random.choice(list(self.REGIMES.keys()))
        
        # Mock signals
        signals = []
        if random.random() > 0.5:
            signals.append(SignalDetails(
                type="divergence",
                severity="high",
                description="Crypto diverging from tech equities - possible rotation signal",
                confidence=0.75,
                timestamp=now,
                affectedAssets=["BTC", "ETH", "QQQ"],
                regimeContext=regime_key,
                thesis="Bitcoin breaking correlation with NASDAQ suggests independent catalyst or institutional accumulation"
            ))
        
        if random.random() > 0.7:
            signals.append(SignalDetails(
                type="regime_shift",
                severity="critical",
                description="Risk-off regime emerging - VXX spike with equity decline",
                confidence=0.82,
                timestamp=now,
                affectedAssets=["SPY", "QQQ", "VXX", "XAUUSD"],
                regimeContext="contraction_risk_off",
                thesis="Volatility expansion across tech names with gold bid suggests defensive positioning"
            ))
        
        return CrossAssetSignalResponse(
            signals=signals,
            currentRegime=regime_key,
            regimeConfidence=0.78,
            regimeDuration=1800,
            totalAnalyzed=len(symbols),
            generatedAt=now
        )


class UnusualMovementEngine:
    """
    Unusual price movement detection engine.
    """
    
    async def scan(self, symbols: List[str], detection_types: List[str], sensitivity: str) -> UnusualMovementResponse:
        """Scan for unusual movements."""
        await asyncio.sleep(0.3)
        
        now = datetime.now(timezone.utc).isoformat()
        alerts = []
        
        import random
        
        # Generate mock alerts based on detection types
        if "flash_crash" in detection_types and random.random() > 0.7:
            alerts.append(MovementAlert(
                symbol="TSLA",
                type="flash_crash",
                severity="critical",
                triggerPrice=172.50,
                priceChange=-5.2,
                timestamp=now,
                description="Rapid 5% decline in 3 minutes - potential stop cascade or news event",
                suggestedAction="Monitor for bounce opportunity or wait for stabilization"
            ))
        
        if "pump" in detection_types and random.random() > 0.8:
            alerts.append(MovementAlert(
                symbol="SOL",
                type="pump",
                severity="high",
                triggerPrice=182.30,
                priceChange=6.8,
                volumeAnomaly=3.5,
                timestamp=now,
                description="Breakout volume with 6.8% move - momentum continuation likely",
                suggestedAction="Consider scaling into position with tight stop"
            ))
        
        if "volatility_expansion" in detection_types and random.random() > 0.6:
            alerts.append(MovementAlert(
                symbol="NVDA",
                type="volatility_expansion",
                severity="medium",
                triggerPrice=885.00,
                priceChange=2.1,
                volumeAnomaly=2.8,
                timestamp=now,
                description="Volatility 3x normal range - earnings anticipation or institutional rebalancing",
                suggestedAction="Reduce position size or hedge with options"
            ))
        
        return UnusualMovementResponse(
            alerts=alerts,
            monitoredCount=len(symbols),
            scanWindow=300,
            generatedAt=now
        )
    
    async def stream_alerts(self, symbols: List[str], detection_types: List[str]):
        """Stream movement alerts."""
        sequence = 0
        while True:
            await asyncio.sleep(8)
            sequence += 1
            
            import random
            if random.random() > 0.6:
                symbol = random.choice(symbols)
                alert_types = ["price_spike", "volume_anomaly", "trend_reversal"]
                alert_type = random.choice(alert_types)
                
                yield {
                    "eventType": "movement_alert",
                    "sequence": sequence,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "alert": {
                        "symbol": symbol,
                        "type": alert_type,
                        "severity": random.choice(["low", "medium", "high"]),
                        "triggerPrice": round(random.uniform(100, 1000), 2),
                        "priceChange": round(random.uniform(-3, 3), 2),
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                }


class SovereignSignalEngine:
    """
    Sovereign signal engine - Polymarket divergence detection.
    """
    
    MOCK_PM_EVENTS = [
        {
            "id": "crypto-regulation",
            "title": "Crypto Regulation Passes in Q2",
            "category": "Crypto",
            "probability": 34,
            "probabilityChange24h": -5,
            "volume24h": 2400000,
            "liquidity": 890000,
            "relatedAssets": ["BTC", "ETH", "COIN", "HOOD"]
        },
        {
            "id": "fed-rate-cut",
            "title": "Fed Cuts Rates Before July",
            "category": "Macro",
            "probability": 67,
            "probabilityChange24h": 8,
            "volume24h": 5600000,
            "liquidity": 2100000,
            "relatedAssets": ["SPY", "QQQ", "BTC", "ETH", "XAUUSD"]
        },
        {
            "id": "nvda-earnings",
            "title": "NVDA Beats Earnings Estimates",
            "category": "Earnings",
            "probability": 72,
            "probabilityChange24h": 3,
            "volume24h": 1200000,
            "liquidity": 450000,
            "relatedAssets": ["NVDA", "QQQ", "SPY"]
        },
        {
            "id": "eth-etf",
            "title": "ETH ETF Approved This Quarter",
            "category": "Crypto",
            "probability": 28,
            "probabilityChange24h": -12,
            "volume24h": 1800000,
            "liquidity": 670000,
            "relatedAssets": ["ETH", "COIN", "HOOD"]
        },
    ]
    
    async def generate_signals(self, min_edge: int, max_events: int, categories: List[str]) -> SovereignSignalResponse:
        """Generate sovereign signals from PM divergence."""
        await asyncio.sleep(0.5)
        
        now = datetime.now(timezone.utc).isoformat()
        signals = []
        
        # Mock price data for correlation
        mock_prices = {
            "BTC": {"price": 67234.50, "change24h": 2.3},
            "ETH": {"price": 3456.78, "change24h": 1.8},
            "SPY": {"price": 518.32, "change24h": -0.4},
            "QQQ": {"price": 442.18, "change24h": 0.2},
            "NVDA": {"price": 878.56, "change24h": 3.2},
            "XAUUSD": {"price": 2234.50, "change24h": 0.5},
            "COIN": {"price": 198.45, "change24h": 4.2},
            "HOOD": {"price": 18.23, "change24h": -1.8},
        }
        
        for event in self.MOCK_PM_EVENTS[:max_events]:
            for asset in event["relatedAssets"]:
                if asset in mock_prices:
                    price_data = mock_prices[asset]
                    
                    # Calculate divergence
                    pm_change = event["probabilityChange24h"]
                    price_change = price_data["change24h"]
                    alignment = 100 - abs(pm_change - price_change * 10)  # Rough alignment calc
                    edge = min(100, max(40, abs(alignment - 50) * 2))
                    
                    if edge >= min_edge:
                        signal_type = "divergence_opportunity" if alignment < 50 else "momentum_confluence"
                        
                        signals.append(SovereignSignalDetails(
                            id=f"{event['id']}-{asset}",
                            type=signal_type,
                            severity="high" if edge > 70 else "medium",
                            title=f"{event['title']} / {asset} Disconnect",
                            description=f"Polymarket {event['probability']}% vs {asset} {price_change:+.1f}% - {edge:.0f} edge score",
                            edgeScore=int(edge),
                            alignmentScore=int(alignment),
                            confidence=event["probability"],
                            priceSymbol=asset,
                            currentPrice=price_data["price"],
                            priceChange24h=price_change,
                            polymarketEvent=PmEvent(**event),
                            thesis=f"High conviction prediction market ({event['probability']}%) diverging from price action suggests information asymmetry",
                            timeHorizon="days",
                            conviction="tactical",
                            regimeContext="tech_momentum"
                        ))
        
        # Sort by edge score
        signals.sort(key=lambda x: x.edgeScore, reverse=True)
        
        return SovereignSignalResponse(
            signals=signals,
            totalEvents=len(self.MOCK_PM_EVENTS),
            pmConnected=True,
            lastPmUpdate=now,
            currentRegime="tech_momentum",
            generatedAt=now
        )


# Instantiate new engines
rtds_engine = RTDSEngine()
cross_asset_engine = CrossAssetEngine()
movement_engine = UnusualMovementEngine()
sovereign_engine = SovereignSignalEngine()

# ============================================================================
# Authentication
# ============================================================================

security = HTTPBearer(auto_error=False)

async def verify_api_key(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Verify API key and return tier info."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Missing API key")
    
    api_key = credentials.credentials
    if api_key not in API_KEYS:
        raise HTTPException(status_code=401, detail="Invalid API key")
    
    key_info = API_KEYS[api_key]
    
    # Check rate limit
    if not task_store.check_rate_limit(api_key, key_info["tier"]):
        raise HTTPException(
            status_code=429,
            detail={
                "code": -32000,
                "message": "Rate limit exceeded",
                "data": {"retryAfter": 60}
            }
        )
    
    return key_info

# ============================================================================
# FastAPI Application
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    print("🚀 MarketAnomalyScanner A2A Server starting...")
    yield
    print("🛑 Server shutting down...")

app = FastAPI(
    title="MarketAnomalyScanner A2A Server",
    description="Agent-to-Agent protocol server for market anomaly detection",
    version="1.0.0",
    lifespan=lifespan
)

# ============================================================================
# Agent Discovery Endpoints
# ============================================================================

@app.get("/.well-known/agent.json")
async def get_agent_card():
    """Serve the A2A Agent Card for discovery."""
    return AGENT_CONFIG

@app.get("/")
async def root():
    """Health check and basic info."""
    return {
        "name": AGENT_CONFIG["name"],
        "version": AGENT_CONFIG["version"],
        "status": "operational",
        "agent_card": "/.well-known/agent.json",
        "endpoints": {
            "tasks_send": "/tasks/send",
            "tasks_send_subscribe": "/tasks/sendSubscribe",
            "tasks_get": "/tasks/{task_id}",
            "tasks_cancel": "/tasks/{task_id}/cancel"
        }
    }

# ============================================================================
# Task Management Endpoints
# ============================================================================

@app.post("/tasks/send")
async def tasks_send(
    request: TaskRequest,
    background_tasks: BackgroundTasks,
    auth: Dict[str, Any] = Depends(verify_api_key)
):
    """
    Handle one-off task execution (non-streaming).
    
    Example request:
    {
        "id": "task-001",
        "sessionId": "session-xyz",
        "message": {
            "role": "user",
            "parts": [
                {"type": "text", "text": "Execute whale_watch"},
                {"type": "data", "data": {"chains": ["ethereum"], "signalTypes": ["exchange_inflow"]}}
            ]
        },
        "acceptedOutputModes": ["json"]
    }
    """
    # Extract skill ID from message
    skill_id = None
    params = {}
    
    for part in request.message.parts:
        if part.get("type") == "text":
            text = part.get("text", "").lower()
            # Parse skill from text (simple parsing)
            if "whale_watch" in text or "whale" in text:
                skill_id = "whale_watch"
            elif "spot_anomaly_scan" in text or "spot" in text:
                skill_id = "spot_anomaly_scan"
            elif "perp_anomaly_scan" in text or "perp" in text:
                skill_id = "perp_anomaly_scan"
            elif "rtds_price" in text or "price" in text:
                skill_id = "rtds_price"
            elif "cross_asset_signal" in text or "cross_asset" in text or "regime" in text:
                skill_id = "cross_asset_signal"
            elif "unusual_movement" in text or "movement" in text or "alert" in text:
                skill_id = "unusual_movement"
            elif "sovereign_signal" in text or "sovereign" in text or "divergence" in text:
                skill_id = "sovereign_signal"
        elif part.get("type") == "data":
            params = part.get("data", {})
    
    if not skill_id:
        raise HTTPException(
            status_code=400,
            detail={
                "jsonrpc": "2.0",
                "error": {"code": -32602, "message": "Could not determine skill from request"},
                "id": request.id
            }
        )
    
    # Create task
    task = task_store.create_task(request.id, skill_id, params)
    
    # Execute task based on skill
    try:
        task_store.update_task(request.id, TaskState.WORKING)
        
        if skill_id == "whale_watch":
            scan_params = WhaleScanRequest(**params)
            result = await whale_engine.scan(scan_params)
            
            artifact = Artifact(
                type="json",
                title="Whale Detection Report",
                content=result
            )
            
            task_store.update_task(request.id, TaskState.COMPLETED, [artifact])
            
            return {
                "jsonrpc": "2.0",
                "result": {
                    "id": request.id,
                    "status": TaskState.COMPLETED,
                    "artifacts": [artifact.model_dump()]
                },
                "id": int(request.id.split("-")[-1]) if request.id.split("-")[-1].isdigit() else 1
            }
        elif skill_id == "rtds_price":
            req = RTDSPriceRequest(**params)
            prices = await rtds_engine.get_prices(req.symbols)
            
            artifact = Artifact(
                type="json",
                title="RTDS Price Data",
                content={"prices": [p.model_dump() for p in prices]}
            )
            
            task_store.update_task(request.id, TaskState.COMPLETED, [artifact])
            
            return {
                "jsonrpc": "2.0",
                "result": {
                    "id": request.id,
                    "status": TaskState.COMPLETED,
                    "artifacts": [artifact.model_dump()]
                },
                "id": 1
            }
            
        elif skill_id == "cross_asset_signal":
            req = CrossAssetSignalRequest(**params)
            result = await cross_asset_engine.analyze(req.symbols, req.minConfidence)
            
            artifact = Artifact(
                type="json",
                title="Cross-Asset Signal Analysis",
                content=result.model_dump()
            )
            
            task_store.update_task(request.id, TaskState.COMPLETED, [artifact])
            
            return {
                "jsonrpc": "2.0",
                "result": {
                    "id": request.id,
                    "status": TaskState.COMPLETED,
                    "artifacts": [artifact.model_dump()]
                },
                "id": 1
            }
            
        elif skill_id == "unusual_movement":
            req = UnusualMovementRequest(**params)
            result = await movement_engine.scan(req.symbols, req.detectionTypes, req.sensitivity)
            
            artifact = Artifact(
                type="json",
                title="Unusual Movement Alerts",
                content=result.model_dump()
            )
            
            task_store.update_task(request.id, TaskState.COMPLETED, [artifact])
            
            return {
                "jsonrpc": "2.0",
                "result": {
                    "id": request.id,
                    "status": TaskState.COMPLETED,
                    "artifacts": [artifact.model_dump()]
                },
                "id": 1
            }
            
        elif skill_id == "sovereign_signal":
            req = SovereignSignalRequest(**params)
            result = await sovereign_engine.generate_signals(req.minEdgeScore, req.maxEvents, req.categories)
            
            artifact = Artifact(
                type="json",
                title="Sovereign Signal Report",
                content=result.model_dump()
            )
            
            task_store.update_task(request.id, TaskState.COMPLETED, [artifact])
            
            return {
                "jsonrpc": "2.0",
                "result": {
                    "id": request.id,
                    "status": TaskState.COMPLETED,
                    "artifacts": [artifact.model_dump()]
                },
                "id": 1
            }
            
        else:
            # Mock response for other skills
            artifact = Artifact(
                type="text",
                title="Not Implemented",
                content={"message": f"Skill {skill_id} not yet implemented"}
            )
            task_store.update_task(request.id, TaskState.COMPLETED, [artifact])
            
            return {
                "jsonrpc": "2.0",
                "result": {
                    "id": request.id,
                    "status": TaskState.COMPLETED,
                    "artifacts": [artifact.model_dump()]
                },
                "id": 1
            }
            
    except Exception as e:
        task_store.update_task(request.id, TaskState.FAILED)
        raise HTTPException(
            status_code=500,
            detail={
                "jsonrpc": "2.0",
                "error": {"code": -32603, "message": str(e)},
                "id": request.id
            }
        )

@app.post("/tasks/sendSubscribe")
async def tasks_send_subscribe(
    request: TaskRequest,
    auth: Dict[str, Any] = Depends(verify_api_key)
):
    """
    Initiate streaming task (WebSocket upgrade).
    
    In a full implementation, this would return a WebSocket URL.
    For this demo, clients should connect to /ws/tasks/{task_id}
    """
    # Extract skill and params
    skill_id = None
    params = {}
    
    for part in request.message.parts:
        if part.get("type") == "text":
            text = part.get("text", "").lower()
            if "whale" in text:
                skill_id = "whale_watch"
            elif "price" in text or "rtds" in text:
                skill_id = "rtds_price"
            elif "movement" in text or "alert" in text:
                skill_id = "unusual_movement"
        elif part.get("type") == "data":
            params = part.get("data", {})
    
    if not skill_id:
        skill_id = "whale_watch"  # Default
    
    # Create task
    task = task_store.create_task(request.id, skill_id, params)
    task_store.update_task(request.id, TaskState.WORKING)
    
    # Return WebSocket endpoint for streaming
    return {
        "jsonrpc": "2.0",
        "result": {
            "id": request.id,
            "status": TaskState.WORKING,
            "streamEndpoint": f"/ws/tasks/{request.id}",
            "message": "Connect to streamEndpoint via WebSocket for real-time updates"
        },
        "id": 1
    }

@app.get("/tasks/{task_id}")
async def get_task_status(
    task_id: str,
    auth: Dict[str, Any] = Depends(verify_api_key)
):
    """Get current status of a task."""
    task = task_store.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@app.post("/tasks/{task_id}/cancel")
async def cancel_task(
    task_id: str,
    auth: Dict[str, Any] = Depends(verify_api_key)
):
    """Cancel a running task."""
    task = task_store.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    task_store.update_task(task_id, TaskState.CANCELED)
    return {"id": task_id, "status": TaskState.CANCELED}

# ============================================================================
# WebSocket Streaming
# ============================================================================

@app.websocket("/ws/tasks/{task_id}")
async def websocket_task_stream(websocket: WebSocket, task_id: str):
    """
    WebSocket endpoint for streaming task results.
    
    Client connects here after initiating a task via /tasks/sendSubscribe
    """
    await websocket.accept()
    
    # Verify task exists
    task = task_store.get_task(task_id)
    if not task:
        await websocket.send_json({
            "error": {"code": -32601, "message": "Task not found"}
        })
        await websocket.close()
        return
    
    # Add to subscribers
    session_id = task.get("params", {}).get("sessionId", task_id)
    task_store.add_subscriber(session_id, websocket)
    
    try:
        skill_id = task.get("skillId", "whale_watch")
        params = task.get("params", {})
        
        if skill_id == "whale_watch":
            # Parse whale scan parameters
            scan_params = WhaleScanRequest(**params)
            async for alert in whale_engine.stream_alerts(scan_params):
                await websocket.send_json({
                    "jsonrpc": "2.0",
                    "method": "tasks/artifact",
                    "params": {
                        "taskId": task_id,
                        "artifact": {
                            "type": "json",
                            "title": "Whale Alert",
                            "content": alert
                        }
                    }
                })
                
        elif skill_id == "rtds_price":
            # Stream price updates
            req = RTDSPriceRequest(**params)
            async for update in rtds_engine.stream_prices(req.symbols):
                await websocket.send_json({
                    "jsonrpc": "2.0",
                    "method": "tasks/artifact",
                    "params": {
                        "taskId": task_id,
                        "artifact": {
                            "type": "json",
                            "title": "Price Update",
                            "content": update
                        }
                    }
                })
                
        elif skill_id == "unusual_movement":
            # Stream movement alerts
            req = UnusualMovementRequest(**params)
            async for alert in movement_engine.stream_alerts(req.symbols, req.detectionTypes):
                await websocket.send_json({
                    "jsonrpc": "2.0",
                    "method": "tasks/artifact",
                    "params": {
                        "taskId": task_id,
                        "artifact": {
                            "type": "json",
                            "title": "Movement Alert",
                            "content": alert
                        }
                    }
                })
        else:
            # Default: send a few test messages
            for i in range(5):
                await asyncio.sleep(2)
                await websocket.send_json({
                    "jsonrpc": "2.0",
                    "method": "tasks/artifact",
                    "params": {
                        "taskId": task_id,
                        "artifact": {
                            "type": "text",
                            "title": "Update",
                            "content": {"message": f"Update {i+1} for {skill_id}"}
                        }
                    }
                })
        
        # Send completion
        await websocket.send_json({
            "jsonrpc": "2.0",
            "method": "tasks/status",
            "params": {
                "taskId": task_id,
                "status": TaskState.COMPLETED
            }
        })
        
    except WebSocketDisconnect:
        print(f"Client disconnected from task {task_id}")
    except Exception as e:
        await websocket.send_json({
            "jsonrpc": "2.0",
            "method": "tasks/status",
            "params": {
                "taskId": task_id,
                "status": TaskState.FAILED,
                "error": str(e)
            }
        })
    finally:
        task_store.remove_subscriber(session_id, websocket)

# ============================================================================
# Health and Monitoring
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": AGENT_CONFIG["version"],
        "tasks": {
            "total": len(task_store.tasks),
            "by_state": {
                state.value: len([t for t in task_store.tasks.values() if t["state"] == state])
                for state in TaskState
            }
        }
    }

@app.get("/skills")
async def list_skills():
    """List available skills with schemas."""
    return {
        "skills": [
            {
                "id": "whale_watch",
                "name": "Whale Movement Detection",
                "description": "On-chain and large order detection for unusual wallet activity",
                "input_schema": WhaleScanRequest.schema(),
                "supported_modes": ["sync", "stream"]
            },
            {
                "id": "spot_anomaly_scan",
                "name": "Spot Market Anomaly Scan",
                "description": "Scan spot markets for volume, price, and volatility anomalies",
                "supported_modes": ["sync"]
            },
            {
                "id": "perp_anomaly_scan",
                "name": "Perpetual Futures Anomaly Scan",
                "description": "Detect funding rate extremes and liquidation cascades",
                "supported_modes": ["sync"]
            },
            {
                "id": "rtds_price",
                "name": "RTDS Real-Time Prices",
                "description": "Live price data from Polymarket RTDS (stocks, crypto, forex, metals)",
                "input_schema": RTDSPriceRequest.schema(),
                "supported_modes": ["sync", "stream"]
            },
            {
                "id": "cross_asset_signal",
                "name": "Cross-Asset Signal Detection",
                "description": "Regime detection and correlation analysis across asset classes",
                "input_schema": CrossAssetSignalRequest.schema(),
                "supported_modes": ["sync"]
            },
            {
                "id": "unusual_movement",
                "name": "Unusual Movement Detection",
                "description": "Real-time alerts for price anomalies, flash crashes, and momentum breakouts",
                "input_schema": UnusualMovementRequest.schema(),
                "supported_modes": ["sync", "stream"]
            },
            {
                "id": "sovereign_signal",
                "name": "Sovereign Signal Correlator",
                "description": "Polymarket divergence detection - prediction market vs price action",
                "input_schema": SovereignSignalRequest.schema(),
                "supported_modes": ["sync"]
            }
        ]
    }

# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║       MarketAnomalyScanner A2A Server                     ║
    ║       v1.1.0 - Multi-Asset Intelligence                   ║
    ╚═══════════════════════════════════════════════════════════╝
    
    SKILLS:
    ┌─────────────────────────────────────────────────────────┐
    │ whale_watch          - On-chain whale detection         │
    │ rtds_price           - Real-time price feed (stream)    │
    │ cross_asset_signal   - Regime detection & correlation   │
    │ unusual_movement     - Price anomaly alerts (stream)    │
    │ sovereign_signal     - PM divergence detection          │
    │ spot_anomaly_scan    - Spot market anomalies            │
    │ perp_anomaly_scan    - Perp market anomalies            │
    └─────────────────────────────────────────────────────────┘
    
    ENDPOINTS:
    - Agent Card:  http://localhost:8000/.well-known/agent.json
    - Health:      http://localhost:8000/health
    - Skills:      http://localhost:8000/skills
    - Tasks:       http://localhost:8000/tasks/send
    - WebSocket:   ws://localhost:8000/ws/tasks/{task_id}
    
    DEMO API KEYS:
    - demo-free-tier    (10 req/min)
    - demo-trader-tier  (100 req/min)  
    - demo-pro-tier     (1000 req/min)
    """)
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
