# 🦌 DeerFlow → 🌐 Cyber Globe Bridge

Real-time cyber threat intelligence integration for your 3D globe visualization.

## Overview

This bridge connects **DeerFlow** (ByteDance's multi-agent research framework) to your **Cyber Globe**, enabling:

- 🔍 **Automated threat research** - DeerFlow agents research latest cyber incidents
- 🌍 **Real-time geolocation** - Threats mapped to cities worldwide
- 📊 **Live data feed** - WebSocket updates every 5 minutes
- 🧠 **AI-powered analysis** - Contextual descriptions and severity scoring

## Architecture

```
┌─────────────┐      HTTP/WebSocket      ┌──────────────┐
│  Cyber Globe│  ←────────────────────→  │  Bridge API  │
│  (React/TS) │                          │  (Python)    │
└─────────────┘                          └──────┬───────┘
                                                │
                                         ┌──────▼──────┐
                                         │  DeerFlow   │
                                         │  Client     │
                                         └──────┬──────┘
                                                │
                                         ┌──────▼──────┐
                                         │  DeerFlow   │
                                         │  Server     │
                                         └─────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
cd bridge

# Option A: Install DeerFlow (full setup)
git clone https://github.com/bytedance/deer-flow.git deerflow-lib
cd deerflow-lib
make install
make config

# Option B: Use mock mode (no DeerFlow needed)
# Skip to step 2
```

### 2. Start the Bridge API Server

```bash
cd bridge

# With DeerFlow (requires DeerFlow server running)
python api_server.py

# OR: Mock mode (generates realistic fake data)
python api_server.py --mock
```

The server starts:
- 🌐 HTTP API: http://localhost:8000
- 🔌 WebSocket: ws://localhost:8001

### 3. Start the Cyber Globe

```bash
npm run dev
```

### 4. Enable DeerFlow in the UI

1. Open http://localhost:5173
2. Click the **"Mock Data"** button in top-left
3. It changes to **"🦌 DeerFlow"** when connected

## API Endpoints

### HTTP Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events` | GET | Get all current events |
| `/api/health` | GET | Check API health |
| `/api/refresh` | POST | Force refresh from DeerFlow |

### WebSocket Protocol

**Connect:** `ws://localhost:8001`

**Client → Server:**
```json
{"action": "get_events"}
{"action": "refresh"}
```

**Server → Client:**
```json
{"type": "events", "data": [...]}
{"type": "refresh_complete", "events_added": 5}
```

## Event Format

```typescript
interface CyberEvent {
  id: number;
  event_type: 'attack' | 'transfer' | 'activity' | 'alert' | 'breach';
  lat: number;
  lng: number;
  city: string;
  timestamp: number;
  intensity: number;  // 0.0 - 1.0
  description: string;
  source: string;
}
```

## Configuration

### Environment Variables

Create a `.env` file in the `bridge` directory:

```env
# DeerFlow Configuration (if using real DeerFlow)
DEERFLOW_URL=http://localhost:2026
DEERFLOW_GATEWAY_URL=http://localhost:2026
DEERFLOW_LANGGRAPH_URL=http://localhost:2026/api/langgraph

# API Keys (if using DeerFlow research)
OPENAI_API_KEY=sk-...
TAVILY_API_KEY=tvly-...
```

### Bridge Options

```bash
python api_server.py --help

Options:
  --mock              Use mock data instead of DeerFlow
  --http-port PORT    HTTP server port (default: 8000)
  --ws-port PORT      WebSocket port (default: 8001)
  --interval SECONDS  Update interval (default: 300)
```

## How It Works

### 1. Research Phase
```python
# DeerFlow researches latest threats
research = client.chat("Research latest cyber security incidents")
```

### 2. Parsing Phase
```python
# Parse research output into structured events
events = bridge.parse_threats_to_events(research)
```

### 3. Geolocation
```python
# Map cities to coordinates
lat, lng = CITY_COORDS.get(city, (0, 0))
```

### 4. Distribution
```python
# Push to all connected globe clients
for client in subscribers:
    await client.send(events_json)
```

## Customization

### Add Custom Cities

Edit `deerflow_bridge.py`:

```python
CITY_COORDS = {
    'Your City': (lat, lng),
    # ... existing cities
}
```

### Custom Research Queries

Modify the research prompt in `deerflow_bridge.py`:

```python
prompt = f"""
Research: {query}
Focus on: ransomware, APT groups, data breaches
Format: JSON with city, type, severity
"""
```

### Custom Event Types

Add to `EVENT_TYPES` and update the mapping:

```python
EVENT_TYPES = ['attack', 'breach', 'activity', 'alert', 'transfer', 'new_type']
```

## Troubleshooting

### DeerFlow Not Connecting
```bash
# Check if DeerFlow is running
curl http://localhost:2026/health

# Use mock mode instead
python api_server.py --mock
```

### CORS Errors
The API server includes CORS headers. If issues persist:
```python
# In api_server.py, update:
self.send_header('Access-Control-Allow-Origin', '*')
```

### WebSocket Disconnections
The client auto-reconnects every 5 seconds. Check:
```bash
# Verify WebSocket server
wscat -c ws://localhost:8001
```

## Advanced Usage

### CLI Tool

```bash
# Single fetch
python deerflow_bridge.py --once --query "ransomware attacks this week"

# Continuous monitoring
python deerflow_bridge.py --interval 600

# Save to file
python deerflow_bridge.py --once --output threats.json
```

### Python Integration

```python
from bridge.deerflow_bridge import DeerFlowBridge

bridge = DeerFlowBridge()
research = bridge.research_cyber_threats("latest APT activity")
events = bridge.parse_threats_to_events(research)

for event in events:
    print(f"{event.city}: {event.description}")
```

### React Hook

```tsx
import { deerFlowClient } from './utils/deerflow-client';

function useThreatFeed() {
  const [events, setEvents] = useState([]);
  
  useEffect(() => {
    deerFlowClient.onEvents(setEvents);
    deerFlowClient.connect();
    return () => deerFlowClient.disconnect();
  }, []);
  
  return events;
}
```

## Production Deployment

### Docker Compose

```yaml
version: '3'
services:
  deerflow:
    image: deerflow:latest
    ports:
      - "2026:2026"
  
  bridge:
    build: ./bridge
    ports:
      - "8000:8000"
      - "8001:8001"
    environment:
      - DEERFLOW_URL=http://deerflow:2026
    depends_on:
      - deerflow
  
  globe:
    build: .
    ports:
      - "5173:5173"
    depends_on:
      - bridge
```

## Credits

- 🦌 **DeerFlow** by ByteDance - https://github.com/bytedance/deer-flow
- 🌐 **Three.js** - https://threejs.org
- ⚛️ **React** - https://react.dev

## License

MIT - See main project LICENSE
