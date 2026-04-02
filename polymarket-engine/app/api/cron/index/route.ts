import { NextResponse } from 'next/server';
import { classifySector } from '@/lib/classifier';
import { upsertMarket, insertPriceHistory, insertAlert, getPriceHistory } from '@/lib/supabase';
import { detectAnomalies, shouldAlert } from '@/lib/anomalies';
import { Market } from '@/types';

const GAMMA_API = 'https://gamma-api.polymarket.com';
const CRON_SECRET = process.env.CRON_SECRET;

// In-memory rate limiter (resets on deploy)
const lastAlertTime = new Map<string, number>();

export async function GET(request: Request) {
  // Verify cron secret
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    console.log('🔄 Starting indexer...');
    
    // Fetch all active markets
    const response = await fetch(`${GAMMA_API}/markets?active=true&closed=false&limit=500`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    const markets = data.data || [];
    
    console.log(`📊 Fetched ${markets.length} markets`);
    
    let indexed = 0;
    let alerts = 0;
    
    for (const m of markets) {
      // Skip markets with no tokens or low liquidity
      if (!m.tokens?.length || m.liquidity < 5000) continue;
      
      const yesToken = m.tokens.find((t: any) => t.outcome === 'Yes');
      const noToken = m.tokens.find((t: any) => t.outcome === 'No');
      
      if (!yesToken || !noToken) continue;
      
      // Classify sector
      const sector = classifySector(m.question);
      if (sector === 'OTHER') continue; // Skip unclassified
      
      const market: Market = {
        condition_id: m.condition_id,
        question: m.question,
        slug: m.market_slug,
        sector,
        yes_price: parseFloat(yesToken.price || 0),
        no_price: parseFloat(noToken.price || 0),
        volume: parseFloat(m.volume || 0),
        liquidity: parseFloat(m.liquidity || 0),
        created_at: m.created_at,
        end_date: m.end_date,
        last_updated: new Date().toISOString()
      };
      
      // Get historical data for anomaly detection
      const priceHistory = await getPriceHistory(market.condition_id, 7);
      
      // Detect anomalies
      if (priceHistory.length >= 10) {
        const signals = detectAnomalies(market, priceHistory);
        
        if (signals.length > 0 && shouldAlert(market.condition_id, lastAlertTime)) {
          const totalScore = signals.reduce((sum, s) => sum + s.score, 0);
          
          await insertAlert({
            condition_id: market.condition_id,
            sector: market.sector,
            alert_type: signals[0].type,
            severity: Math.min(100, totalScore),
            description: signals.map(s => {
              if (s.type === 'VOLUME_SPIKE') return `Volume +${s.zScore?.toFixed(1)}σ`;
              if (s.type.includes('PRICE')) return `${s.change > 0 ? '+' : ''}${(s.change * 100).toFixed(1)}%`;
              return s.type;
            }).join(' | '),
            timestamp: new Date().toISOString()
          });
          
          lastAlertTime.set(market.condition_id, Date.now());
          alerts++;
        }
      }
      
      // Store market data
      await upsertMarket(market);
      
      // Store price history
      await insertPriceHistory({
        condition_id: market.condition_id,
        yes_price: market.yes_price,
        volume: market.volume,
        timestamp: new Date().toISOString()
      });
      
      indexed++;
    }
    
    console.log(`✅ Indexed ${indexed} markets, created ${alerts} alerts`);
    
    return NextResponse.json({
      success: true,
      indexed,
      alerts,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Indexer error:', error);
    return NextResponse.json(
      { error: 'Indexer failed', message: (error as Error).message },
      { status: 500 }
    );
  }
}
