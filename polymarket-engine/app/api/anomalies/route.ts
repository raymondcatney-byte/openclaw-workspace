import { NextResponse } from 'next/server';
import { getMarkets, getPriceHistory } from '@/lib/supabase';
import { detectAnomalies, calculateTotalScore } from '@/lib/anomalies';

export async function GET(request: Request) {
  try {
    // Fetch all tracked markets
    const markets = await getMarkets({});
    const anomalies = [];
    
    for (const market of markets) {
      // Get recent price history
      const priceHistory = await getPriceHistory(market.condition_id, 7);
      
      if (priceHistory.length < 10) continue;
      
      // Detect anomalies
      const signals = detectAnomalies(market, priceHistory);
      
      if (signals.length > 0) {
        const totalScore = calculateTotalScore(signals);
        
        // Only return significant anomalies
        if (totalScore >= 50) {
          anomalies.push({
            market,
            signals,
            total_score: totalScore,
            detected_at: new Date().toISOString()
          });
        }
      }
    }
    
    // Sort by score descending
    anomalies.sort((a, b) => b.total_score - a.total_score);
    
    return NextResponse.json({
      anomalies,
      count: anomalies.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Anomalies API error:', error);
    return NextResponse.json(
      { error: 'Failed to detect anomalies', message: (error as Error).message },
      { status: 500 }
    );
  }
}
