// app/api/agent-cron/route.ts - Vercel Cron endpoint (runs on schedule)
// This is an API route, not client-side, but still free on Vercel

import { NextResponse } from 'next/server';

export const runtime = 'edge'; // Edge runtime = faster, cheaper

export async function GET(request: Request) {
  // Verify this is a legitimate cron request from Vercel
  const authHeader = request.headers.get('authorization');
  
  // Check for Vercel's cron secret (set in env vars)
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Run agent tasks
    const tasks = await runAgentTasks();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      tasks
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Agent execution failed', details: String(error) },
      { status: 500 }
    );
  }
}

async function runAgentTasks() {
  const results = [];
  
  // Task 1: Check Polymarket for high-confidence events
  try {
    const polyRes = await fetch('https://gamma-api.polymarket.com/events?limit=10&active=true');
    const events = await polyRes.json();
    
    const highConfidence = events
      .flatMap((e: any) => e.markets || [])
      .filter((m: any) => {
        const maxProb = Math.max(m.outcomePrices?.yes || 0, m.outcomePrices?.no || 0);
        return maxProb > 0.75;
      });
    
    results.push({
      task: 'polymarket_scan',
      highConfidenceEvents: highConfidence.length,
      alerts: highConfidence.map((m: any) => m.question).slice(0, 3)
    });
  } catch (e) {
    results.push({ task: 'polymarket_scan', error: String(e) });
  }
  
  // Task 2: Check for whale activity
  try {
    const whaleRes = await fetch('https://api.adsb.lol/v2/mil');
    const aircraft = await whaleRes.json();
    results.push({
      task: 'aircraft_check',
      militaryAircraft: aircraft.ac?.length || 0
    });
  } catch (e) {
    results.push({ task: 'aircraft_check', error: String(e) });
  }
  
  // Task 3: Yield opportunities
  try {
    const yieldRes = await fetch('https://yields.llama.fi/pools');
    const pools = await yieldRes.json();
    const topYields = pools.data
      .filter((p: any) => p.tvlUsd > 5000000 && p.apy < 50)
      .sort((a: any, b: any) => b.apy - a.apy)
      .slice(0, 5);
    
    results.push({
      task: 'yield_scan',
      opportunities: topYields.length,
      topApy: topYields[0]?.apy || 0
    });
  } catch (e) {
    results.push({ task: 'yield_scan', error: String(e) });
  }
  
  return results;
}
