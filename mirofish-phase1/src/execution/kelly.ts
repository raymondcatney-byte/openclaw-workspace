import { Consensus, Market, Position } from '../types/index.js';

interface KellyResult {
  shouldTrade: boolean;
  direction: 'yes' | 'no' | null;
  size: number;
  edge: number;
  kellyPercentage: number;
  adjustedKellyPercentage: number;
  reason: string;
}

export function calculateKellyPosition(
  consensusProbability: number,
  marketPrice: number,
  bankroll: number,
  kellyFraction: number = 0.25,
  maxPositionPct: number = 0.10,
  minEdge: number = 0.05
): KellyResult {
  const edge = Math.abs(consensusProbability - marketPrice);
  
  if (edge < minEdge) {
    return {
      shouldTrade: false,
      direction: null,
      size: 0,
      edge,
      kellyPercentage: 0,
      adjustedKellyPercentage: 0,
      reason: `Edge ${(edge * 100).toFixed(2)}% < min ${(minEdge * 100).toFixed(2)}%`,
    };
  }
  
  const direction: 'yes' | 'no' = consensusProbability > marketPrice ? 'yes' : 'no';
  const odds = direction === 'yes' 
    ? (1 - marketPrice) / marketPrice
    : marketPrice / (1 - marketPrice);
  
  const p = direction === 'yes' ? consensusProbability : (1 - consensusProbability);
  const q = 1 - p;
  
  const kellyPercentage = (odds * p - q) / odds;
  
  if (kellyPercentage <= 0) {
    return {
      shouldTrade: false,
      direction: null,
      size: 0,
      edge,
      kellyPercentage,
      adjustedKellyPercentage: 0,
      reason: 'Kelly ≤ 0 (negative EV)',
    };
  }
  
  const adjustedKellyPercentage = kellyPercentage * kellyFraction;
  const rawPositionSize = bankroll * adjustedKellyPercentage;
  const maxPositionSize = bankroll * maxPositionPct;
  const positionSize = Math.min(rawPositionSize, maxPositionSize);
  
  return {
    shouldTrade: true,
    direction,
    size: positionSize,
    edge,
    kellyPercentage,
    adjustedKellyPercentage,
    reason: `Kelly ${(kellyPercentage * 100).toFixed(1)}% × ${(kellyFraction * 100).toFixed(0)}% = ${(adjustedKellyPercentage * 100).toFixed(1)}%`,
  };
}

interface PositionConfig {
  kellyFraction?: number;
  maxPositionPct?: number;
  minEdge?: number;
  minConfidence?: number;
}

export function generatePosition(
  market: Market,
  consensus: Consensus,
  bankroll: number,
  config: PositionConfig = {}
): Position | null {
  const {
    kellyFraction = 0.25,
    maxPositionPct = 0.10,
    minEdge = 0.05,
    minConfidence = 0.3,
  } = config;
  
  if (consensus.confidence < minConfidence) {
    console.log(`    ↳ Skip: confidence ${(consensus.confidence * 100).toFixed(1)}% < ${(minConfidence * 100).toFixed(0)}%`);
    return null;
  }
  
  const kelly = calculateKellyPosition(
    consensus.probability,
    market.outcomePrices.yes,
    bankroll,
    kellyFraction,
    maxPositionPct,
    minEdge
  );
  
  if (!kelly.shouldTrade) {
    console.log(`    ↳ Skip: ${kelly.reason}`);
    return null;
  }
  
  return {
    id: `pos-${Date.now()}-${market.id.slice(0, 8)}`,
    marketId: market.id,
    direction: kelly.direction!,
    size: kelly.size,
    entryPrice: kelly.direction === 'yes' 
      ? market.outcomePrices.yes 
      : market.outcomePrices.no,
    entryDate: new Date(),
    status: 'open',
    consensusProbability: consensus.probability,
    marketPrice: market.outcomePrices.yes,
    edge: kelly.edge,
    kellyFraction,
  };
}
