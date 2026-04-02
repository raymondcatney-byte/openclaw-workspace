/**
 * DeerFlow Bridge API Client
 * 
 * Connects the Cyber Globe to the DeerFlow Bridge API for real-time threat data.
 * 
 * Usage:
 * ```tsx
 * import { DeerFlowClient } from './deerflow-client';
 * 
 * const client = new DeerFlowClient();
 * 
 * // Fetch events
 * const events = await client.getEvents();
 * 
 * // Or use WebSocket for real-time updates
 * client.onEvents((events) => {
 *   setEvents(events);
 * });
 * client.connect();
 * ```
 */

import { CyberEvent } from '../utils/eventData';

const API_BASE = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8001';

export class DeerFlowClient {
  private ws: WebSocket | null = null;
  private eventCallback: ((events: CyberEvent[]) => void) | null = null;
  private reconnectInterval = 5000;
  private shouldReconnect = true;

  /**
   * Fetch events via HTTP
   */
  async getEvents(): Promise<CyberEvent[]> {
    try {
      const response = await fetch(`${API_BASE}/api/events`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch events:', error);
      return [];
    }
  }

  /**
   * Force refresh of events
   */
  async refresh(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/api/refresh`, { method: 'POST' });
      return response.ok;
    } catch (error) {
      console.error('Failed to refresh:', error);
      return false;
    }
  }

  /**
   * Check API health
   */
  async health(): Promise<{ status: string; events_count: number } | null> {
    try {
      const response = await fetch(`${API_BASE}/api/health`);
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      return null;
    }
  }

  /**
   * Set callback for real-time events
   */
  onEvents(callback: (events: CyberEvent[]) => void): void {
    this.eventCallback = callback;
  }

  /**
   * Connect to WebSocket for real-time updates
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.shouldReconnect = true;
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      console.log('🦌 Connected to DeerFlow Bridge');
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'events' && this.eventCallback) {
          this.eventCallback(data.data);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('🔌 Disconnected from DeerFlow Bridge');
      if (this.shouldReconnect) {
        setTimeout(() => this.connect(), this.reconnectInterval);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.shouldReconnect = false;
    this.ws?.close();
  }

  /**
   * Send action via WebSocket
   */
  send(action: string, payload?: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action, ...payload }));
    }
  }
}

// Singleton instance for convenience
export const deerFlowClient = new DeerFlowClient();
