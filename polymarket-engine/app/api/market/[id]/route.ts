import { NextResponse } from 'next/server';
import { getMarketById, getPriceHistory } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const [market, priceHistory] = await Promise.all([
      getMarketById(id),
      getPriceHistory(id, 7)
    ]);
    
    if (!market) {
      return NextResponse.json(
        { error: 'Market not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      market,
      price_history: priceHistory
    });
    
  } catch (error) {
    console.error('❌ Market detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market', message: (error as Error).message },
      { status: 500 }
    );
  }
}
