#!/usr/bin/env python3
"""
DeerFlow Bridge API Server

Provides HTTP and WebSocket endpoints for the Cyber Globe to fetch real-time threat data.
"""

import json
import asyncio
import websockets
from datetime import datetime
from pathlib import Path
from typing import List, Dict
from dataclasses import asdict
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading
import random

# Import the bridge
from deerflow_bridge import DeerFlowBridge, CyberEvent


class EventStore:
    """Thread-safe event storage with automatic updates"""
    
    def __init__(self, bridge: DeerFlowBridge):
        self.bridge = bridge
        self.events: List[CyberEvent] = []
        self.subscribers: List[asyncio.Queue] = []
        self._lock = threading.Lock()
        self._running = False
    
    def get_events(self) -> List[Dict]:
        """Get current events as dicts"""
        with self._lock:
            return [asdict(e) for e in self.events]
    
    def update_events(self, new_events: List[CyberEvent]):
        """Update events and notify subscribers"""
        with self._lock:
            # Merge: keep recent events, add new ones
            current_ids = {e.id for e in self.events}
            for event in new_events:
                if event.id not in current_ids:
                    self.events.append(event)
            
            # Keep only last 20 events
            self.events = sorted(self.events, key=lambda e: e.timestamp, reverse=True)[:20]
        
        # Notify WebSocket subscribers
        asyncio.create_task(self._notify_subscribers())
    
    async def _notify_subscribers(self):
        """Send updates to all connected WebSocket clients"""
        events_data = self.get_events()
        message = json.dumps({"type": "events", "data": events_data})
        
        for queue in self.subscribers[:]:
            try:
                await queue.put(message)
            except Exception:
                self.subscribers.remove(queue)
    
    async def subscribe(self) -> asyncio.Queue:
        """Subscribe to event updates"""
        queue = asyncio.Queue()
        self.subscribers.append(queue)
        
        # Send current events immediately
        await queue.put(json.dumps({"type": "events", "data": self.get_events()}))
        return queue


class EventsHTTPHandler(BaseHTTPRequestHandler):
    """HTTP handler for event API"""
    
    event_store: EventStore = None
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/api/events':
            self._send_json_response(self.event_store.get_events())
        elif self.path == '/api/health':
            self._send_json_response({
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "events_count": len(self.event_store.get_events())
            })
        else:
            self._send_error(404, "Not found")
    
    def do_POST(self):
        """Handle POST requests"""
        if self.path == '/api/refresh':
            # Trigger manual refresh
            try:
                research = self.event_store.bridge.research_cyber_threats("latest cyber threats")
                events = self.event_store.bridge.parse_threats_to_events(research)
                self.event_store.update_events(events)
                self._send_json_response({"success": True, "events_added": len(events)})
            except Exception as e:
                self._send_error(500, str(e))
        else:
            self._send_error(404, "Not found")
    
    def _send_json_response(self, data):
        """Send JSON response"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def _send_error(self, code, message):
        """Send error response"""
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode())
    
    def log_message(self, format, *args):
        """Suppress default logging"""
        pass


async def websocket_handler(websocket, path, event_store: EventStore):
    """Handle WebSocket connections"""
    client_id = id(websocket)
    print(f"🔌 WebSocket client {client_id} connected")
    
    try:
        # Subscribe to events
        queue = await event_store.subscribe()
        
        async for message in websocket:
            try:
                data = json.loads(message)
                action = data.get('action')
                
                if action == 'get_events':
                    events = event_store.get_events()
                    await websocket.send(json.dumps({"type": "events", "data": events}))
                
                elif action == 'refresh':
                    research = event_store.bridge.research_cyber_threats("latest cyber threats")
                    events = event_store.bridge.parse_threats_to_events(research)
                    event_store.update_events(events)
                    await websocket.send(json.dumps({
                        "type": "refresh_complete",
                        "events_added": len(events)
                    }))
                
            except json.JSONDecodeError:
                await websocket.send(json.dumps({"type": "error", "message": "Invalid JSON"}))
    
    except websockets.exceptions.ConnectionClosed:
        print(f"🔌 WebSocket client {client_id} disconnected")


async def background_updater(event_store: EventStore, interval: int = 300):
    """Background task to periodically update events"""
    print(f"🔄 Background updater started (interval: {interval}s)")
    
    while True:
        try:
            print(f"\n🔍 [{datetime.now().strftime('%H:%M:%S')}] Researching threats...")
            
            research = event_store.bridge.research_cyber_threats("latest cyber security incidents")
            events = event_store.bridge.parse_threats_to_events(research)
            
            if events:
                event_store.update_events(events)
                print(f"   ✅ Added {len(events)} new threats")
            else:
                print("   ⚠️  No threats found")
            
            await asyncio.sleep(interval)
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            await asyncio.sleep(60)


def start_http_server(event_store: EventStore, port: int = 8000):
    """Start HTTP server in background thread"""
    EventsHTTPHandler.event_store = event_store
    server = HTTPServer(('0.0.0.0', port), EventsHTTPHandler)
    
    def run():
        print(f"🌐 HTTP API server started on http://localhost:{port}")
        print(f"   Endpoints:")
        print(f"   - GET  http://localhost:{port}/api/events    (Get all events)")
        print(f"   - GET  http://localhost:{port}/api/health    (Health check)")
        print(f"   - POST http://localhost:{port}/api/refresh   (Force refresh)")
        server.serve_forever()
    
    thread = threading.Thread(target=run, daemon=True)
    thread.start()
    return server


async def start_websocket_server(event_store: EventStore, port: int = 8001):
    """Start WebSocket server"""
    async def handler(websocket, path):
        await websocket_handler(websocket, path, event_store)
    
    server = await websockets.serve(handler, '0.0.0.0', port)
    print(f"🔌 WebSocket server started on ws://localhost:{port}")
    return server


async def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='DeerFlow Bridge API Server')
    parser.add_argument('--mock', action='store_true', help='Use mock data')
    parser.add_argument('--http-port', type=int, default=8000, help='HTTP port')
    parser.add_argument('--ws-port', type=int, default=8001, help='WebSocket port')
    parser.add_argument('--interval', type=int, default=300, help='Update interval (seconds)')
    
    args = parser.parse_args()
    
    print("🦌 DeerFlow Bridge API Server")
    print("=" * 50)
    
    # Initialize bridge and event store
    bridge = DeerFlowBridge(use_mock=args.mock)
    event_store = EventStore(bridge)
    
    # Do initial fetch
    print("\n🚀 Fetching initial data...")
    research = bridge.research_cyber_threats("latest cyber threats")
    events = bridge.parse_threats_to_events(research)
    event_store.update_events(events)
    print(f"   ✅ Loaded {len(events)} initial events\n")
    
    # Start HTTP server
    http_server = start_http_server(event_store, args.http_port)
    
    # Start WebSocket server
    ws_server = await start_websocket_server(event_store, args.ws_port)
    
    # Start background updater
    updater_task = asyncio.create_task(background_updater(event_store, args.interval))
    
    print("\n✨ Server is running! Press Ctrl+C to stop\n")
    
    try:
        await asyncio.Future()  # Run forever
    except KeyboardInterrupt:
        print("\n👋 Shutting down...")
        http_server.shutdown()
        ws_server.close()
        await ws_server.wait_closed()
        updater_task.cancel()


if __name__ == "__main__":
    asyncio.run(main())
