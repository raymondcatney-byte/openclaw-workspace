import { NextResponse } from 'next/server';
import { getMarkets } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      sector: searchParams.get('sector') || undefined,
      min_price: searchParams.has('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined,
      max_price: searchParams.has('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined,
      min_volume: searchParams.has('min_volume') ? parseFloat(searchParams.get('min_volume')!) : undefined,
      search: searchParams.get('search') || undefined,
      ending_soon: searchParams.get('ending_soon') === 'true'
    };
    
    const markets = await getMarkets(filters);
    
    return NextResponse.json({
      markets,
      count: markets.length,
      filters
    });
    
  } catch (error) {
    console.error('❌ Markets API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch markets', message: (error as Error).message },
      { status: 500 }
    );
  }
}
