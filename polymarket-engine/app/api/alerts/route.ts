import { NextResponse } from 'next/server';
import { getAlerts } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      sector: searchParams.get('sector') || undefined,
      min_severity: searchParams.has('min_severity') ? parseInt(searchParams.get('min_severity')!) : 70,
      since: searchParams.get('since') || undefined
    };
    
    const alerts = await getAlerts(filters);
    
    return NextResponse.json({
      alerts,
      count: alerts.length,
      filters
    });
    
  } catch (error) {
    console.error('❌ Alerts API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts', message: (error as Error).message },
      { status: 500 }
    );
  }
}
