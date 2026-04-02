"""
A2A Client Example - MarketAnomalyScanner

Demonstrates how to interact with the A2A server:
1. Fetch agent card
2. Send one-off tasks
3. Subscribe to streaming alerts
"""

import asyncio
import json
import websockets
import aiohttp

BASE_URL = "http://localhost:8000"
WS_URL = "ws://localhost:8000"
API_KEY = "demo-pro-tier"  # Use one of the demo keys


async def fetch_agent_card():
    """Fetch and display the A2A agent card."""
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{BASE_URL}/.well-known/agent.json") as resp:
            card = await resp.json()
            print("=" * 60)
            print("AGENT CARD")
            print("=" * 60)
            print(json.dumps(card, indent=2))
            return card


async def send_whale_scan():
    """Send a one-off whale detection task."""
    async with aiohttp.ClientSession() as session:
        payload = {
            "id": "task-whale-001",
            "sessionId": "session-abc-123",
            "message": {
                "role": "user",
                "parts": [
                    {"type": "text", "text": "Execute whale_watch"},
                    {"type": "data", "data": {
                        "chains": ["ethereum", "solana"],
                        "signalTypes": ["exchange_inflow", "dex_swap"],
                        "thresholds": {
                            "minUsdValue": 1_000_000,
                            "percentOf24hVolume": 5
                        },
                        "entityFilters": {
                            "includeKnownWhales": True,
                            "includeSmartMoney": False
                        }
                    }}
                ]
            },
            "acceptedOutputModes": ["json"]
        }
        
        headers = {"Authorization": f"Bearer {API_KEY}"}
        
        async with session.post(
            f"{BASE_URL}/tasks/send",
            json=payload,
            headers=headers
        ) as resp:
            result = await resp.json()
            print("\n" + "=" * 60)
            print("WHALE SCAN RESULT")
            print("=" * 60)
            print(json.dumps(result, indent=2))
            return result


async def stream_whale_alerts():
    """Subscribe to real-time whale alert stream."""
    async with aiohttp.ClientSession() as session:
        # First, initiate the streaming task
        payload = {
            "id": "task-stream-001",
            "sessionId": "session-stream-xyz",
            "message": {
                "role": "user",
                "parts": [
                    {"type": "text", "text": "Start realtime_subscription for whale_watch"},
                    {"type": "data", "data": {
                        "chains": ["ethereum"],
                        "signalTypes": ["exchange_inflow"],
                        "thresholds": {
                            "minUsdValue": 5_000_000
                        }
                    }}
                ]
            }
        }
        
        headers = {"Authorization": f"Bearer {API_KEY}"}
        
        async with session.post(
            f"{BASE_URL}/tasks/sendSubscribe",
            json=payload,
            headers=headers
        ) as resp:
            result = await resp.json()
            print("\n" + "=" * 60)
            print("STREAM INITIATED")
            print("=" * 60)
            print(json.dumps(result, indent=2))
            
            task_id = result["result"]["id"]
            ws_endpoint = result["result"]["streamEndpoint"]
            
            # Connect to WebSocket for streaming
            print(f"\nConnecting to WebSocket: {WS_URL}{ws_endpoint}")
            print("=" * 60)
            
            async with websockets.connect(
                f"{WS_URL}{ws_endpoint}",
                extra_headers={"Authorization": f"Bearer {API_KEY}"}
            ) as websocket:
                print("Connected! Waiting for whale alerts...")
                print("-" * 60)
                
                try:
                    async for message in websocket:
                        data = json.loads(message)
                        
                        # Pretty print the alert
                        if data.get("method") == "tasks/artifact":
                            artifact = data["params"]["artifact"]["content"]
                            print(f"\n🐋 WHALE ALERT #{artifact.get('sequence', 'N/A')}")
                            print(f"   Time: {artifact.get('timestamp')}")
                            
                            alert = artifact.get("alert", {})
                            token = alert.get("token", {})
                            parties = alert.get("parties", {})
                            from_entity = parties.get("from", {}).get("entity", {})
                            to_entity = parties.get("to", {}).get("entity", {})
                            ai = alert.get("aiAnalysis", {})
                            
                            print(f"   Type: {alert.get('signalType', 'unknown')}")
                            print(f"   Amount: ${token.get('usdValue', 0):,.0f} {token.get('symbol', '')}")
                            print(f"   From: {from_entity.get('name', 'Unknown')} ({from_entity.get('type', 'unknown')})")
                            print(f"   To: {to_entity.get('name', 'Unknown')} ({to_entity.get('type', 'unknown')})")
                            
                            intent = ai.get("intentPrediction", {})
                            if intent:
                                print(f"   AI Intent: {intent.get('likelyIntent')} (confidence: {intent.get('confidence')})")
                            
                            print("-" * 60)
                            
                        elif data.get("method") == "tasks/status":
                            print(f"\nTask status: {data['params']['status']}")
                            if data['params']['status'] == "completed":
                                print("Stream completed.")
                                break
                                
                except websockets.exceptions.ConnectionClosed:
                    print("\nWebSocket connection closed.")


async def check_health():
    """Check server health status."""
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{BASE_URL}/health") as resp:
            health = await resp.json()
            print("\n" + "=" * 60)
            print("SERVER HEALTH")
            print("=" * 60)
            print(json.dumps(health, indent=2))


async def list_skills():
    """List available skills."""
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{BASE_URL}/skills") as resp:
            skills = await resp.json()
            print("\n" + "=" * 60)
            print("AVAILABLE SKILLS")
            print("=" * 60)
            for skill in skills.get("skills", []):
                print(f"\n📌 {skill['id']}")
                print(f"   Name: {skill['name']}")
                print(f"   Description: {skill['description']}")
                print(f"   Modes: {', '.join(skill['supported_modes'])}")


async def main():
    """Run all demo operations."""
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║       A2A Client Demo - MarketAnomalyScanner              ║
    ╚═══════════════════════════════════════════════════════════╝
    """)
    
    # 1. Fetch agent card
    await fetch_agent_card()
    
    # 2. Check health
    await check_health()
    
    # 3. List skills
    await list_skills()
    
    # 4. Send one-off whale scan
    await send_whale_scan()
    
    # 5. Stream real-time alerts
    print("\n" + "=" * 60)
    print("STARTING REAL-TIME STREAM (10 alerts, ~50 seconds)")
    print("=" * 60)
    await stream_whale_alerts()
    
    print("\n✅ Demo complete!")


if __name__ == "__main__":
    asyncio.run(main())
