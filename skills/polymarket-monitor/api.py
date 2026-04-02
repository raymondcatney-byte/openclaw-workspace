#!/usr/bin/env python3
"""
NERV Dashboard API Endpoint for Polymarket Feed
Outputs JSON in the format expected by the War Room / Overwatch tabs.
"""

import json
import sys
from pathlib import Path
from datetime import datetime

FEED_FILE = Path(__file__).parent / "market_feed.json"
ALERTS_FILE = Path(__file__).parent / "alerts.json"

def format_for_nerv():
    """Format market data for NERV dashboard consumption."""
    
    feed_items = []
    if FEED_FILE.exists():
        with open(FEED_FILE, 'r') as f:
            feed_items = json.load(f)
    
    # Transform to NERV-style intel events
    nerv_events = []
    
    for item in feed_items:
        # Determine severity based on alert or trend
        if item.get("alert"):
            severity_map = {
                "critical": "critical",
                "high": "high", 
                "medium": "medium",
                "low": "low"
            }
            severity = severity_map.get(item["alert"]["severity"], "medium")
        else:
            trend_severity = {
                "surging": "high",
                "rising": "medium",
                "falling": "medium", 
                "crashing": "high",
                "stable": "low"
            }
            severity = trend_severity.get(item.get("changes", {}).get("trend", "stable"), "low")
        
        # Map category to domain
        domain_map = {
            "crypto": "crypto",
            "geopolitics": "geopolitics",
            "ai": "ai",
            "biotech": "biotech",
            "markets": "markets"
        }
        domain = domain_map.get(item["category"], "markets")
        
        # Build thesis based on data
        change_1h = item.get("changes", {}).get("1h")
        if change_1h:
            direction = "rising" if change_1h > 0 else "falling"
            thesis = f"{item['name']} odds {direction} to {item['price_yes']}"
        else:
            thesis = f"{item['name']} stable at {item['price_yes']}"
        
        event = {
            "id": f"pm-{item['id']}",
            "domain": domain,
            "severity": severity,
            "title": f"[POLYMARKET] {item['name']}",
            "timestamp": item["last_updated"],
            "source": "Polymarket",
            "sourceType": "reference",
            "url": item["polymarket_url"],
            "confidence": item["current_price"] if item["current_price"] > 0.5 else 1 - item["current_price"],
            "payload": {
                "market_id": item["id"],
                "price_yes": item["price_yes"],
                "price_no": item["price_no"],
                "trend": item.get("changes", {}).get("trend", "stable"),
                "change_1h": item.get("changes", {}).get("1h"),
                "change_24h": item.get("changes", {}).get("24h"),
                "volume": item.get("volume", 0),
                "liquidity": item.get("liquidity", 0),
                "alert": item.get("alert")
            },
            "thesis": thesis,
            "why_now": f"Market odds: {item['price_yes']} Yes / {item['price_no']} No",
            "next_moves": [
                f"Monitor {item['name']} for continued {'strength' if (item.get('changes', {}).get('1h') or 0) > 0 else 'weakness'}",
                f"Check Polymarket for order book depth" if item.get("liquidity", 0) < 100000 else "High liquidity - reliable signal"
            ],
            "watch_indicators": [
                "Price movement > 5% in 1h",
                "Volume spike",
                "News catalyst correlation"
            ]
        }
        
        nerv_events.append(event)
    
    # Sort by severity (critical first)
    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    nerv_events.sort(key=lambda x: severity_order.get(x["severity"], 4))
    
    return nerv_events

def get_alerts_feed():
    """Get only alert items for the Watchtower feed."""
    alerts = []
    if ALERTS_FILE.exists():
        with open(ALERTS_FILE, 'r') as f:
            alerts = json.load(f)
    
    # Return only recent alerts (last 24h)
    from datetime import timedelta
    cutoff = (datetime.utcnow() - timedelta(hours=24)).isoformat()
    recent = [a for a in alerts if a["timestamp"] > cutoff]
    
    # Format as watchtower items
    watchtower_items = []
    for alert in recent:
        item = {
            "id": f"alert-{alert['market_id']}",
            "type": alert["type"],
            "severity": alert["severity"],
            "message": alert["message"],
            "timestamp": alert["timestamp"],
            "market": alert["market_name"],
            "current_price": alert["current_price"],
            "trend": alert.get("trend", "unknown")
        }
        watchtower_items.append(item)
    
    return watchtower_items

def main():
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "nerv":
            # Output in NERV format
            output = {
                "events": format_for_nerv(),
                "generated_at": datetime.utcnow().isoformat(),
                "count": len(format_for_nerv())
            }
            print(json.dumps(output, indent=2))
            
        elif command == "watchtower":
            # Output alerts for watchtower
            output = {
                "items": get_alerts_feed(),
                "generated_at": datetime.utcnow().isoformat()
            }
            print(json.dumps(output, indent=2))
            
        elif command == "raw":
            # Output raw feed
            if FEED_FILE.exists():
                with open(FEED_FILE, 'r') as f:
                    print(json.dumps(json.load(f), indent=2))
            else:
                print("[]")
                
        else:
            print(f"Unknown command: {command}")
            print("Commands: nerv, watchtower, raw")
    else:
        # Default: NERV format
        output = {
            "events": format_for_nerv(),
            "generated_at": datetime.utcnow().isoformat(),
            "count": len(format_for_nerv())
        }
        print(json.dumps(output, indent=2))

if __name__ == "__main__":
    main()
