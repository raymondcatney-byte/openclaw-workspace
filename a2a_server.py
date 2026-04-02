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
    "description": "Real-time cryptocurrency market anomaly detection and intelligence service. Identifies unusual volume, price dislocations, funding rate extremes, and cross-exchange arbitrage opportunities.",
    "url": "https://api.anomalyscan.io",
    "version": "1.0.0",
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
            text = part.get("text", "")
            # Parse skill from text (simple parsing)
            if "whale_watch" in text.lower():
                skill_id = "whale_watch"
            elif "spot_anomaly_scan" in text.lower():
                skill_id = "spot_anomaly_scan"
            elif "perp_anomaly_scan" in text.lower():
                skill_id = "perp_anomaly_scan"
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
            text = part.get("text", "")
            if "whale" in text.lower() or "realtime" in text.lower():
                skill_id = "whale_watch"
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
        # Parse scan parameters
        params = WhaleScanRequest(**task.get("params", {}))
        
        # Stream alerts
        async for alert in whale_engine.stream_alerts(params):
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
    ║       Whale Detection & Market Intelligence               ║
    ╚═══════════════════════════════════════════════════════════╝
    
    Endpoints:
    - Agent Card:  http://localhost:8000/.well-known/agent.json
    - Health:      http://localhost:8000/health
    - Skills:      http://localhost:8000/skills
    - Tasks:       http://localhost:8000/tasks/send
    - WebSocket:   ws://localhost:8000/ws/tasks/{task_id}
    
    Demo API Keys:
    - demo-free-tier
    - demo-trader-tier
    - demo-pro-tier
    """)
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
