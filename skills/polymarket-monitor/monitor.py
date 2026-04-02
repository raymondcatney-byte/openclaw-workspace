#!/usr/bin/env python3
"""
Polymarket Market Monitor
Tracks price movements and generates alerts for configured markets.
Integrates with NERV Dashboard via JSON feed.
"""

import json
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional
import subprocess

# Configuration
MARKETS_FILE = Path(__file__).parent / "markets.json"
ALERTS_FILE = Path(__file__).parent / "alerts.json"
HISTORY_FILE = Path(__file__).parent / "price_history.json"
FEED_OUTPUT = Path(__file__).parent / "market_feed.json"

# Default markets to track (matching your NERV focus areas)
DEFAULT_MARKETS = {
    "crypto": [
        {"id": "bitcoin-above-150k-july-2026", "name": "BTC > $150K by July", "threshold": 0.05},
        {"id": "ethereum-all-time-high-2026", "name": "ETH All-Time High", "threshold": 0.05},
    ],
    "geopolitics": [
        {"id": "trump-wins-2028-presidential-election", "name": "Trump Wins 2028", "threshold": 0.03},
        {"id": "fed-rate-cut-march-2026", "name": "Fed Rate Cut March", "threshold": 0.04},
    ],
    "ai": [
        {"id": "agi-milestone-2026", "name": "AGI Milestone", "threshold": 0.05},
    ],
    "biotech": [
        {"id": "fda-drug-approval-2026", "name": "FDA Drug Approval", "threshold": 0.04},
    ]
}

class MarketMonitor:
    def __init__(self):
        self.markets = self._load_markets()
        self.history = self._load_history()
        self.alerts = []
        
    def _load_markets(self) -> Dict:
        """Load tracked markets from config."""
        if MARKETS_FILE.exists():
            with open(MARKETS_FILE, 'r') as f:
                return json.load(f)
        return DEFAULT_MARKETS
    
    def _load_history(self) -> Dict:
        """Load price history."""
        if HISTORY_FILE.exists():
            with open(HISTORY_FILE, 'r') as f:
                return json.load(f)
        return {}
    
    def _save_history(self):
        """Save price history."""
        with open(HISTORY_FILE, 'w') as f:
            json.dump(self.history, f, indent=2)
    
    def _save_alerts(self):
        """Save alerts to file."""
        with open(ALERTS_FILE, 'w') as f:
            json.dump(self.alerts, f, indent=2)
    
    def _save_feed(self, feed_data: List[Dict]):
        """Save dashboard feed."""
        with open(FEED_OUTPUT, 'w') as f:
            json.dump(feed_data, f, indent=2)
    
    def fetch_market_data(self, market_id: str) -> Optional[Dict]:
        """Fetch current market data from Polymarket Gamma API."""
        try:
            import urllib.request
            import urllib.error
            
            # Try to fetch by slug
            url = f"https://gamma-api.polymarket.com/events?slug={market_id}&active=true"
            req = urllib.request.Request(url, headers={'User-Agent': 'NERV-Monitor/1.0'})
            
            with urllib.request.urlopen(req, timeout=15) as response:
                data = json.loads(response.read().decode())
                
                # The API returns a list of events
                if isinstance(data, list) and len(data) > 0:
                    return data[0]  # Return first matching event
                return None
                
        except urllib.error.HTTPError as e:
            print(f"    HTTP {e.code} for {market_id}")
            return None
        except Exception as e:
            print(f"    Error fetching {market_id}: {e}")
            return None
    
    def calculate_change(self, market_id: str, current_price: float) -> Dict:
        """Calculate price change from previous readings."""
        if market_id not in self.history:
            self.history[market_id] = []
        
        history = self.history[market_id]
        now = datetime.utcnow().isoformat()
        
        # Add current reading
        history.append({
            "timestamp": now,
            "price": current_price
        })
        
        # Keep only last 100 readings
        history = history[-100:]
        self.history[market_id] = history
        
        # Calculate changes
        changes = {
            "1h": None,
            "24h": None,
            "7d": None,
            "trend": "stable"
        }
        
        if len(history) >= 2:
            # 1 hour change
            one_hour_ago = datetime.utcnow() - timedelta(hours=1)
            past_readings = [h for h in history if datetime.fromisoformat(h["timestamp"]) > one_hour_ago]
            if past_readings:
                changes["1h"] = current_price - past_readings[0]["price"]
            
            # 24 hour change
            one_day_ago = datetime.utcnow() - timedelta(days=1)
            past_readings = [h for h in history if datetime.fromisoformat(h["timestamp"]) > one_day_ago]
            if past_readings:
                changes["24h"] = current_price - past_readings[0]["price"]
        
        # Determine trend
        if changes["1h"] is not None:
            if changes["1h"] > 0.02:
                changes["trend"] = "surging"
            elif changes["1h"] > 0.01:
                changes["trend"] = "rising"
            elif changes["1h"] < -0.02:
                changes["trend"] = "crashing"
            elif changes["1h"] < -0.01:
                changes["trend"] = "falling"
        
        return changes
    
    def check_alert(self, market: Dict, current_price: float, changes: Dict) -> Optional[Dict]:
        """Check if price movement triggers an alert."""
        threshold = market.get("threshold", 0.05)
        
        # Check for significant movement
        if changes["1h"] is not None and abs(changes["1h"]) >= threshold:
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "market_id": market["id"],
                "market_name": market["name"],
                "type": "PRICE_MOVEMENT",
                "severity": "high" if abs(changes["1h"]) >= threshold * 2 else "medium",
                "message": f"{market['name']} {'↑' if changes['1h'] > 0 else '↓'} {abs(changes['1h']):.1%} in 1h",
                "current_price": current_price,
                "change_1h": changes["1h"],
                "change_24h": changes["24h"],
                "trend": changes["trend"]
            }
        
        # Check for trend reversal
        if changes["trend"] in ["surging", "crashing"]:
            return {
                "timestamp": datetime.utcnow().isoformat(),
                "market_id": market["id"],
                "market_name": market["name"],
                "type": "TREND_ALERT",
                "severity": "critical" if changes["trend"] == "crashing" else "high",
                "message": f"{market['name']} is {changes['trend'].upper()}: {current_price:.1%}",
                "current_price": current_price,
                "change_1h": changes["1h"],
                "trend": changes["trend"]
            }
        
        return None
    
    def run_monitoring(self):
        """Main monitoring loop."""
        print(f"[{datetime.utcnow()}] Starting market monitoring...")
        
        feed_items = []
        
        for category, markets_list in self.markets.items():
            print(f"\nChecking {category} markets...")
            
            for market_config in markets_list:
                market_id = market_config["id"]
                print(f"  - {market_config['name']} ({market_id})")
                
                # Fetch current data
                data = self.fetch_market_data(market_id)
                
                if not data:
                    print(f"    ⚠️ Failed to fetch data")
                    continue
                
                # Extract current price from first active market
                try:
                    markets = data.get("markets", [])
                    if markets:
                        # Get the first market's outcome prices
                        market_data = markets[0]
                        outcome_prices = market_data.get("outcomePrices", "[0.5, 0.5]")
                        
                        # Parse the prices (stored as JSON string)
                        if isinstance(outcome_prices, str):
                            prices = json.loads(outcome_prices)
                        else:
                            prices = outcome_prices
                        
                        # First price is YES, second is NO
                        current_price = float(prices[0]) if prices else 0.5
                        
                        # Get additional data
                        volume = float(market_data.get("volumeNum", 0))
                        liquidity = float(market_data.get("liquidityNum", 0))
                    else:
                        current_price = 0.5
                        volume = 0
                        liquidity = 0
                except (IndexError, KeyError, ValueError, json.JSONDecodeError) as e:
                    print(f"    Warning: Could not parse price data: {e}")
                    current_price = 0.5
                    volume = 0
                    liquidity = 0
                
                # Calculate changes
                changes = self.calculate_change(market_id, current_price)
                
                # Check for alerts
                alert = self.check_alert(market_config, current_price, changes)
                if alert:
                    self.alerts.append(alert)
                    print(f"    🚨 ALERT: {alert['message']}")
                
                # Build feed item
                feed_item = {
                    "id": market_id,
                    "category": category,
                    "name": market_config["name"],
                    "current_price": current_price,
                    "price_yes": f"{current_price:.1%}",
                    "price_no": f"{1-current_price:.1%}",
                    "changes": changes,
                    "volume": volume,
                    "liquidity": liquidity,
                    "last_updated": datetime.utcnow().isoformat(),
                    "polymarket_url": f"https://polymarket.com/event/{market_id}",
                    "alert": alert
                }
                feed_items.append(feed_item)
                
                print(f"    Price: {current_price:.1%} | Trend: {changes['trend']}")
        
        # Save everything
        self._save_history()
        self._save_alerts()
        self._save_feed(feed_items)
        
        print(f"\n[{datetime.utcnow()}] Monitoring complete.")
        print(f"  - Feed items: {len(feed_items)}")
        print(f"  - New alerts: {len([a for a in self.alerts if a['timestamp'] > (datetime.utcnow() - timedelta(minutes=5)).isoformat()])}")
        print(f"  - Output: {FEED_OUTPUT}")
        
        return feed_items
    
    def get_dashboard_feed(self) -> List[Dict]:
        """Get formatted feed for NERV dashboard."""
        if FEED_OUTPUT.exists():
            with open(FEED_OUTPUT, 'r') as f:
                feed = json.load(f)
                # Add NERV-style severity formatting
                for item in feed:
                    if item.get("alert"):
                        severity = item["alert"]["severity"]
                        item["nerv_severity"] = severity
                        item["nerv_color"] = {
                            "critical": "#C9302C",
                            "high": "#E8A03C", 
                            "medium": "#FF9800",
                            "low": "#5C3A1E"
                        }.get(severity, "#5C3A1E")
                return feed
        return []
    
    def get_active_alerts(self, since_minutes: int = 60) -> List[Dict]:
        """Get recent alerts."""
        cutoff = (datetime.utcnow() - timedelta(minutes=since_minutes)).isoformat()
        return [a for a in self.alerts if a["timestamp"] > cutoff]


def main():
    """CLI entry point."""
    monitor = MarketMonitor()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "monitor":
            # Run full monitoring
            monitor.run_monitoring()
            
        elif command == "feed":
            # Output dashboard feed
            feed = monitor.get_dashboard_feed()
            print(json.dumps(feed, indent=2))
            
        elif command == "alerts":
            # Show recent alerts
            minutes = int(sys.argv[2]) if len(sys.argv) > 2 else 60
            alerts = monitor.get_active_alerts(minutes)
            print(json.dumps(alerts, indent=2))
            
        elif command == "add":
            # Add new market to track
            if len(sys.argv) < 5:
                print("Usage: monitor.py add <category> <market_id> <name>")
                sys.exit(1)
            category, market_id, name = sys.argv[2], sys.argv[3], sys.argv[4]
            if category not in monitor.markets:
                monitor.markets[category] = []
            monitor.markets[category].append({
                "id": market_id,
                "name": name,
                "threshold": 0.05
            })
            with open(MARKETS_FILE, 'w') as f:
                json.dump(monitor.markets, f, indent=2)
            print(f"Added {name} to {category}")
            
        else:
            print(f"Unknown command: {command}")
            print("Commands: monitor, feed, alerts, add")
    else:
        # Default: run monitoring
        monitor.run_monitoring()


if __name__ == "__main__":
    main()
