// app/api/movements/route.ts
// Edge runtime API for unusual movement alerts

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = searchParams.get('symbols')?.split(',') || ['BTC', 'ETH', 'TSLA', 'NVDA'];
  const minSeverity = searchParams.get('minSeverity') || 'low';
  
  // Mock movement alerts - in production, analyze real price data
  const alerts = [
    {
      id: 'alert-' + Date.now(),
      symbol: 'TSLA',
      type: 'flash_crash',
      severity: 'critical',
      triggerPrice: 172.50,
      priceChange: -5.2,
      timestamp: new Date(Date.now() - 180000).toISOString(),
      description: 'Rapid 5% decline in 3 minutes - potential stop cascade',
      suggestedAction: 'Monitor for bounce opportunity',
    },
    {
      id: 'alert-' + (Date.now() - 1000),
      symbol: 'SOL',
      type: 'pump',
      severity: 'high',
      triggerPrice: 182.30,
      priceChange: 6.8,
      volumeAnomaly: 3.5,
      timestamp: new Date(Date.now() - 300000).toISOString(),
      description: 'Breakout volume with 6.8% move',
      suggestedAction: 'Consider scaling in with tight stop',
    },
  ].filter((alert) => {
    const severityRank = { low: 1, medium: 2, high: 3, critical: 4 };
    return severityRank[alert.severity as keyof typeof severityRank] >= severityRank[minSeverity as keyof typeof severityRank];
  });
  
  return Response.json({
    alerts,
    monitoredCount: symbols.length,
    scanWindow: 300, // 5 minutes
    generatedAt: new Date().toISOString(),
    source: 'MarketAnomalyScanner',
  });
}
