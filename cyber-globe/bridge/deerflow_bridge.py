#!/usr/bin/env python3
"""
DeerFlow → Cyber Globe Bridge

Connects DeerFlow's research capabilities to the Cyber Globe visualization.
Fetches real cyber threat intelligence and updates the globe's event feed.
"""

import json
import os
import sys
import time
import random
import argparse
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
from pathlib import Path

# Add DeerFlow to path if available
try:
    sys.path.insert(0, str(Path(__file__).parent / "deerflow-lib" / "backend"))
    from src.client import DeerFlowClient
    DEERFLOW_AVAILABLE = True
except ImportError:
    DEERFLOW_AVAILABLE = False
    print("⚠️  DeerFlow not installed. Using mock mode for testing.")


@dataclass
class CyberEvent:
    """Event format matching the Cyber Globe's TypeScript interface"""
    id: int
    event_type: str  # 'attack', 'transfer', 'activity', 'alert', 'breach'
    lat: float
    lng: float
    city: str
    timestamp: int
    intensity: float
    description: str = ""
    source: str = ""


class DeerFlowBridge:
    """Bridge between DeerFlow research agent and Cyber Globe"""
    
    EVENT_TYPES = ['attack', 'transfer', 'activity', 'alert', 'breach']
    
    # Major cities with coordinates for geolocation
    CITY_COORDS = {
        'New York': (40.7128, -74.0060),
        'London': (51.5074, -0.1278),
        'Tokyo': (35.6762, 139.6503),
        'Singapore': (1.3521, 103.8198),
        'Sydney': (-33.8688, 151.2093),
        'Berlin': (52.5200, 13.4050),
        'Moscow': (55.7558, 37.6173),
        'Beijing': (39.9042, 116.4074),
        'Dubai': (25.2048, 55.2708),
        'São Paulo': (-23.5505, -46.6333),
        'Mumbai': (19.0760, 72.8777),
        'Paris': (48.8566, 2.3522),
        'San Francisco': (37.7749, -122.4194),
        'Seoul': (37.5665, 126.9780),
        'Toronto': (43.6532, -79.3832),
        'Cape Town': (-33.9249, 18.4241),
        'Mexico City': (19.4326, -99.1332),
        'Bangkok': (13.7563, 100.5018),
        'Istanbul': (41.0082, 28.9784),
        'Cairo': (30.0444, 31.2357),
        'Shanghai': (31.2304, 121.4737),
        'Mumbai': (19.0760, 72.8777),
        'Delhi': (28.6139, 77.2090),
        'Jakarta': (-6.2088, 106.8456),
        'Lagos': (6.5244, 3.3792),
        'Karachi': (24.8607, 67.0011),
        'Buenos Aires': (-34.6037, -58.3816),
        'Manila': (14.5995, 120.9842),
        'Rio de Janeiro': (-22.9068, -43.1729),
        'Tianjin': (39.3434, 117.3616),
    }
    
    def __init__(self, use_mock: bool = False):
        self.client = None
        self.use_mock = use_mock or not DEERFLOW_AVAILABLE
        self.event_counter = int(time.time())
        
        if not self.use_mock:
            try:
                self.client = DeerFlowClient()
                print("✅ Connected to DeerFlow")
            except Exception as e:
                print(f"⚠️  Failed to connect to DeerFlow: {e}")
                print("   Falling back to mock mode")
                self.use_mock = True
    
    def research_cyber_threats(self, query: str = "latest cyber attacks today") -> str:
        """Use DeerFlow to research current cyber threats"""
        if self.use_mock:
            return self._mock_research(query)
        
        try:
            # Use DeerFlow to research threats
            prompt = f"""
            Research: {query}
            
            Provide a structured list of cyber security incidents including:
            - Type of incident (attack, data breach, suspicious activity, etc.)
            - Location (city/country if known)
            - Severity level (1-10)
            - Brief description
            
            Format as JSON-like structure for parsing.
            """
            
            response = self.client.chat(prompt, thread_id=f"cyber-globe-{int(time.time())}")
            return response.get('content', '')
        except Exception as e:
            print(f"Error researching threats: {e}")
            return self._mock_research(query)
    
    def _mock_research(self, query: str) -> str:
        """Generate mock threat data for testing"""
        mock_threats = [
            {"type": "attack", "city": "Tokyo", "severity": 8, "desc": "DDoS attack on financial sector"},
            {"type": "breach", "city": "London", "severity": 9, "desc": "Healthcare data breach, 2M records exposed"},
            {"type": "alert", "city": "New York", "severity": 6, "desc": "Suspicious network activity detected"},
            {"type": "transfer", "city": "Singapore", "severity": 7, "desc": "Large crypto transfer to suspicious wallet"},
            {"type": "activity", "city": "Moscow", "severity": 5, "desc": "Scanning activity from known APT group"},
            {"type": "attack", "city": "São Paulo", "severity": 7, "desc": "Ransomware attack on manufacturing"},
            {"type": "breach", "city": "San Francisco", "severity": 8, "desc": "Tech company API keys leaked"},
            {"type": "alert", "city": "Beijing", "severity": 6, "desc": "Anomalous login patterns detected"},
        ]
        
        # Return random subset
        selected = random.sample(mock_threats, min(5, len(mock_threats)))
        return json.dumps(selected)
    
    def parse_threats_to_events(self, research_output: str) -> List[CyberEvent]:
        """Parse DeerFlow research output into CyberEvent objects"""
        events = []
        
        try:
            # Try to parse as JSON
            threats = json.loads(research_output)
            if isinstance(threats, list):
                for threat in threats:
                    event = self._create_event_from_threat(threat)
                    if event:
                        events.append(event)
        except json.JSONDecodeError:
            # Fallback: parse text format
            events = self._parse_text_threats(research_output)
        
        return events
    
    def _create_event_from_threat(self, threat: Dict) -> Optional[CyberEvent]:
        """Convert a threat dict to CyberEvent"""
        city = threat.get('city', 'Unknown')
        
        # Get coordinates
        lat, lng = self.CITY_COORDS.get(city, (0, 0))
        if lat == 0:
            # Random coordinates if city not found
            lat = random.uniform(-60, 60)
            lng = random.uniform(-180, 180)
        
        # Map threat type to event type
        threat_type = threat.get('type', 'activity').lower()
        event_type = self._map_threat_type(threat_type)
        
        self.event_counter += 1
        
        return CyberEvent(
            id=self.event_counter,
            event_type=event_type,
            lat=lat,
            lng=lng,
            city=city,
            timestamp=int(time.time() * 1000),
            intensity=threat.get('severity', 5) / 10,
            description=threat.get('desc', 'Cyber security incident'),
            source='DeerFlow Research'
        )
    
    def _map_threat_type(self, threat_type: str) -> str:
        """Map various threat descriptions to standard event types"""
        threat_lower = threat_type.lower()
        
        if any(word in threat_lower for word in ['attack', 'ddos', 'ransomware', 'malware']):
            return 'attack'
        elif any(word in threat_lower for word in ['breach', 'leak', 'exposed']):
            return 'breach'
        elif any(word in threat_lower for word in ['transfer', 'transaction', 'wallet']):
            return 'transfer'
        elif any(word in threat_lower for word in ['alert', 'warning', 'critical']):
            return 'alert'
        else:
            return 'activity'
    
    def _parse_text_threats(self, text: str) -> List[CyberEvent]:
        """Fallback parser for non-JSON responses"""
        events = []
        lines = text.split('\n')
        
        for line in lines:
            # Simple heuristic parsing
            if any(keyword in line.lower() for keyword in ['attack', 'breach', 'incident', 'threat']):
                # Extract city if mentioned
                city = 'Unknown'
                for known_city in self.CITY_COORDS.keys():
                    if known_city in line:
                        city = known_city
                        break
                
                # Determine type
                event_type = 'activity'
                if 'attack' in line.lower():
                    event_type = 'attack'
                elif 'breach' in line.lower():
                    event_type = 'breach'
                
                self.event_counter += 1
                lat, lng = self.CITY_COORDS.get(city, (random.uniform(-60, 60), random.uniform(-180, 180)))
                
                events.append(CyberEvent(
                    id=self.event_counter,
                    event_type=event_type,
                    lat=lat,
                    lng=lng,
                    city=city,
                    timestamp=int(time.time() * 1000),
                    intensity=random.uniform(0.3, 0.9),
                    description=line.strip()[:100],
                    source='DeerFlow Research'
                ))
        
        return events
    
    def generate_events_api_response(self, events: List[CyberEvent]) -> str:
        """Generate JSON response matching the globe's expected format"""
        return json.dumps([asdict(e) for e in events], indent=2)
    
    def save_events_to_file(self, events: List[CyberEvent], filepath: str = "events.json"):
        """Save events to JSON file for the globe to consume"""
        output_path = Path(__file__).parent / filepath
        with open(output_path, 'w') as f:
            json.dump([asdict(e) for e in events], f, indent=2)
        print(f"💾 Saved {len(events)} events to {output_path}")
        return output_path


def run_continuous_monitoring(bridge: DeerFlowBridge, interval: int = 300):
    """Continuously monitor and update events"""
    print(f"🔄 Starting continuous monitoring (interval: {interval}s)")
    
    while True:
        try:
            print(f"\n🔍 Researching threats at {datetime.now().strftime('%H:%M:%S')}...")
            
            # Research threats
            research = bridge.research_cyber_threats("latest cyber security incidents today")
            
            # Parse to events
            events = bridge.parse_threats_to_events(research)
            
            if events:
                # Save to file
                bridge.save_events_to_file(events, "live-events.json")
                
                # Print summary
                print(f"📊 Found {len(events)} threats:")
                for e in events:
                    print(f"   • [{e.event_type.upper()}] {e.city}: {e.description[:50]}...")
            else:
                print("   No new threats found")
            
            print(f"⏳ Sleeping for {interval}s...")
            time.sleep(interval)
            
        except KeyboardInterrupt:
            print("\n👋 Stopping monitor")
            break
        except Exception as e:
            print(f"❌ Error: {e}")
            time.sleep(10)


def main():
    parser = argparse.ArgumentParser(description='DeerFlow → Cyber Globe Bridge')
    parser.add_argument('--mock', action='store_true', help='Use mock data (no DeerFlow needed)')
    parser.add_argument('--once', action='store_true', help='Run once and exit')
    parser.add_argument('--interval', type=int, default=300, help='Monitoring interval in seconds')
    parser.add_argument('--query', type=str, default='latest cyber attacks today', help='Research query')
    parser.add_argument('--output', type=str, default='events.json', help='Output file path')
    
    args = parser.parse_args()
    
    print("🦌 DeerFlow → 🌐 Cyber Globe Bridge")
    print("=" * 50)
    
    # Initialize bridge
    bridge = DeerFlowBridge(use_mock=args.mock)
    
    if args.once:
        # Single run
        print(f"\n🔍 Researching: {args.query}")
        research = bridge.research_cyber_threats(args.query)
        events = bridge.parse_threats_to_events(research)
        
        if events:
            bridge.save_events_to_file(events, args.output)
            print("\n📋 Events JSON:")
            print(bridge.generate_events_api_response(events))
        else:
            print("❌ No events generated")
    else:
        # Continuous monitoring
        run_continuous_monitoring(bridge, args.interval)


if __name__ == "__main__":
    main()
