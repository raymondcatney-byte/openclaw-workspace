import { NextResponse } from 'next/server';
import { getSectorStats, getRecentAlertsBySector } from '@/lib/supabase';
import { getAllSectors } from '@/lib/classifier';

export async function GET() {
  try {
    const stats = await getSectorStats();
    const sectors = getAllSectors();
    
    // Get alert counts for each sector
    const sectorData = await Promise.all(
      sectors.map(async (sector) => {
        const stat = stats.find((s: any) => s.sector === sector);
        const alertsToday = await getRecentAlertsBySector(sector);
        
        return {
          name: sector,
          market_count: stat?.count || 0,
          avg_volume: stat?.avg_volume || 0,
          total_volume: stat?.sum_volume || 0,
          alerts_today: alertsToday
        };
      })
    );
    
    return NextResponse.json({
      sectors: sectorData,
      total_markets: sectorData.reduce((sum, s) => sum + s.market_count, 0),
      total_alerts_today: sectorData.reduce((sum, s) => sum + s.alerts_today, 0)
    });
    
  } catch (error) {
    console.error('❌ Sectors API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sectors', message: (error as Error).message },
      { status: 500 }
    );
  }
}
