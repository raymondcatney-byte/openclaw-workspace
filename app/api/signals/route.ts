// app/api/signals/route.ts
// Edge runtime API for cross-asset signals
// Accessible via: https://your-app.vercel.app/api/signals

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'sse'; // 'sse' or 'json'
  
  // Mock signal generation - in production, connect to your signal engine
  const signals = [
    {
      id: 'sig-' + Date.now(),
      type: 'divergence',
      severity: 'high',
      description: 'Crypto diverging from tech equities',
      confidence: 0.75,
      timestamp: new Date().toISOString(),
      affectedAssets: ['BTC', 'ETH', 'QQQ'],
      regimeContext: 'tech_momentum',
      thesis: 'Bitcoin breaking correlation with NASDAQ',
    },
    {
      id: 'sig-' + (Date.now() - 1000),
      type: 'regime_shift',
      severity: 'critical',
      description: 'Risk-off regime emerging',
      confidence: 0.82,
      timestamp: new Date(Date.now() - 60000).toISOString(),
      affectedAssets: ['SPY', 'QQQ', 'VXX', 'XAUUSD'],
      regimeContext: 'contraction_risk_off',
      thesis: 'Volatility expansion with gold bid',
    },
  ];

  // Server-Sent Events for streaming
  if (format === 'sse') {
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      start(controller) {
        // Send initial data
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'init', signals })}\n\n`));
        
        // Send heartbeat every 30s
        const heartbeat = setInterval(() => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'heartbeat', time: Date.now() })}\n\n`));
        }, 30000);
        
        // Close after 5 minutes (Vercel timeout)
        setTimeout(() => {
          clearInterval(heartbeat);
          controller.close();
        }, 300000);
      },
    });
    
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
  
  // Regular JSON response
  return Response.json({
    signals,
    generatedAt: new Date().toISOString(),
    source: 'MarketAnomalyScanner',
    version: '1.0.0',
  });
}
