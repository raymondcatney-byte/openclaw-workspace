import { execSync } from 'child_process';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Polymarket Market Feed API
 * 
 * Returns live prediction market data formatted for NERV Dashboard.
 * This endpoint runs the polymarket-monitor skill and formats output
 * as NERV-style intel events.
 * 
 * Endpoint: GET /api/polymarket-feed
 * 
 * Response format matches NERV RawEvent type:
 * {
 *   events: Array<{
 *     id: string,
 *     domain: string,
 *     severity: 'critical' | 'high' | 'medium' | 'low',
 *     title: string,
 *     timestamp: string,
 *     source: string,
 *     sourceType: string,
 *     url: string,
 *     confidence: number,
 *     payload: object,
 *     thesis: string,
 *     why_now: string,
 *     next_moves: string[],
 *     watch_indicators: string[]
 *   }>
 * }
 */

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Path to the polymarket-monitor skill
    const skillPath = join(homedir(), '.openclaw', 'skills', 'polymarket-monitor');
    
    // Run the monitor to update data (silent mode)
    try {
      execSync(`python3 ${join(skillPath, 'monitor.py')} monitor`, {
        timeout: 60000,
        stdio: 'pipe'
      });
    } catch (monitorError) {
      // Monitor might fail if markets are stale, but we can still return cached data
      console.warn('Monitor update failed, returning cached data:', monitorError.message);
    }
    
    // Get formatted NERV feed
    const output = execSync(`python3 ${join(skillPath, 'api.py')} nerv`, {
      timeout: 30000,
      encoding: 'utf8'
    });
    
    const data = JSON.parse(output);
    
    // Add cache headers (refresh every 5 minutes)
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
    
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Polymarket feed error:', error);
    
    return res.status(500).json({
      error: 'Failed to fetch market data',
      message: error.message,
      events: [],
      generated_at: new Date().toISOString()
    });
  }
}
