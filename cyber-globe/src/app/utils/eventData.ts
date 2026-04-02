export interface CyberEvent {
  id: number;
  type: 'attack' | 'transfer' | 'activity' | 'alert' | 'breach';
  lat: number;
  lng: number;
  city: string;
  timestamp: number;
  intensity: number;
}

export const EVENT_COLORS: Record<CyberEvent['type'], string> = {
  attack: '#ff0044',
  transfer: '#00ff88',
  activity: '#00d4ff',
  alert: '#ffaa00',
  breach: '#ff00ff',
};

export const EVENT_TYPE_LABELS: Record<CyberEvent['type'], string> = {
  attack: 'Cyber Attack',
  transfer: 'Data Transfer',
  activity: 'Suspicious Activity',
  alert: 'Security Alert',
  breach: 'Data Breach',
};

// Major cities with coordinates
const MAJOR_CITIES = [
  { name: 'New York', lat: 40.7128, lng: -74.0060 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050 },
  { name: 'Moscow', lat: 55.7558, lng: 37.6173 },
  { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708 },
  { name: 'São Paulo', lat: -23.5505, lng: -46.6333 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
  { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { name: 'Seoul', lat: 37.5665, lng: 126.9780 },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832 },
  { name: 'Cape Town', lat: -33.9249, lng: 18.4241 },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332 },
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018 },
  { name: 'Istanbul', lat: 41.0082, lng: 28.9784 },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357 },
];

const EVENT_TYPES: CyberEvent['type'][] = ['attack', 'transfer', 'activity', 'alert', 'breach'];

let eventIdCounter = 1;

export function generateMockEvents(count: number = 15): CyberEvent[] {
  const events: CyberEvent[] = [];
  const shuffledCities = [...MAJOR_CITIES].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < count; i++) {
    const city = shuffledCities[i % shuffledCities.length];
    const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    
    events.push({
      id: eventIdCounter++,
      type,
      lat: city.lat,
      lng: city.lng,
      city: city.name,
      timestamp: Date.now(),
      intensity: 0.3 + Math.random() * 0.7,
    });
  }
  
  return events;
}

export function generateNewEvent(_existingEvents: CyberEvent[]): CyberEvent {
  const city = MAJOR_CITIES[Math.floor(Math.random() * MAJOR_CITIES.length)];
  const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
  
  return {
    id: eventIdCounter++,
    type,
    lat: city.lat,
    lng: city.lng,
    city: city.name,
    timestamp: Date.now(),
    intensity: 0.3 + Math.random() * 0.7,
  };
}

export function updateEvents(currentEvents: CyberEvent[]): CyberEvent[] {
  // Replace a random event with a new one
  const newEvents = [...currentEvents];
  const replaceIndex = Math.floor(Math.random() * newEvents.length);
  newEvents[replaceIndex] = generateNewEvent(currentEvents);
  return newEvents;
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
