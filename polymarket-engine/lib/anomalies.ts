import { PriceHistory, Market } from '@/types';

export interface AnomalySignal {
  type: 'VOLUME_SPIKE' | 'PRICE_MOVE_UP' | 'PRICE_MOVE_DOWN';
  zScore?: number;
  change?: number;
  score: number;
}

export function calculateZScore(current: number, history: number[]): number {
  if (history.length < 10) return 0;
  
  const mean = history.reduce((a, b) => a + b, 0) / history.length;
  const variance = history.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / history.length;
  const stdDev = Math.sqrt(variance);
  
  if (stdDev === 0) return 0;
  return (current - mean) / stdDev;
}

export function calculatePriceChange(currentPrice: number, history: PriceHistory[]): { change1h: number; change24h: number } {
  if (history.length < 2) return { change1h: 0, change24h: 0 };
  
  const now = Date.now();
  const oneHourAgo = now - 60 * 60 * 1000;
  const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
  
  // Find price 1 hour ago
  const price1hEntry = history.slice().reverse().find(h => new Date(h.timestamp).getTime() < oneHourAgo);
  const price1h = price1hEntry?.yes_price || history[history.length - 1]?.yes_price || currentPrice;
  
  // Find price 24 hours ago
  const price24hEntry = history.find(h => new Date(h.timestamp).getTime() > twentyFourHoursAgo);
  const price24h = price24hEntry?.yes_price || history[0]?.yes_price || currentPrice;
  
  return {
    change1h: (currentPrice - price1h) / price1h,
    change24h: (currentPrice - price24h) / price24h
  };
}

export function detectAnomalies(
  market: Market,
  priceHistory: PriceHistory[]
): AnomalySignal[] {
  const signals: AnomalySignal[] = [];
  
  const volumes = priceHistory.map(h => h.volume);
  const prices = priceHistory.map(h => h.yes_price);
  
  // Volume spike detection (>2.5 sigma)
  const volumeZScore = calculateZScore(market.volume, volumes);
  if (volumeZScore > 2.5) {
    signals.push({
      type: 'VOLUME_SPIKE',
      zScore: volumeZScore,
      score: Math.min(50, volumeZScore * 12)
    });
  }
  
  // Price movement detection
  const { change1h, change24h } = calculatePriceChange(market.yes_price, priceHistory);
  
  if (change1h > 0.10) {
    signals.push({
      type: 'PRICE_MOVE_UP',
      change: change1h,
      score: 40
    });
  } else if (change1h < -0.10) {
    signals.push({
      type: 'PRICE_MOVE_DOWN',
      change: change1h,
      score: 40
    });
  }
  
  if (Math.abs(change24h) > 0.20 && !signals.find(s => s.type.includes('PRICE'))) {
    signals.push({
      type: change24h > 0 ? 'PRICE_MOVE_UP' : 'PRICE_MOVE_DOWN',
      change: change24h,
      score: 30
    });
  }
  
  return signals;
}

export function calculateTotalScore(signals: AnomalySignal[]): number {
  return Math.min(100, signals.reduce((sum, s) => sum + s.score, 0));
}

export function shouldAlert(marketId: string, lastAlertTime: Map<string, number>): boolean {
  const lastAlert = lastAlertTime.get(marketId);
  if (!lastAlert) return true;
  
  // Rate limit: 1 alert per 30 minutes per market
  return Date.now() - lastAlert > 30 * 60 * 1000;
}
