import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core';

export const predictions = sqliteTable('predictions', {
  id: text('id').primaryKey(),
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  
  marketId: text('market_id').notNull(),
  marketSlug: text('market_slug').notNull(),
  marketQuestion: text('market_question').notNull(),
  marketCategory: text('market_category').notNull(),
  
  consensusProbability: real('consensus_probability').notNull(),
  consensusConfidence: real('consensus_confidence').notNull(),
  agentCount: integer('agent_count').notNull(),
  simulationTimeMs: integer('simulation_time_ms').notNull(),
  
  marketPriceYes: real('market_price_yes').notNull(),
  marketPriceNo: real('market_price_no').notNull(),
  marketVolume: real('market_volume').notNull(),
  
  edge: real('edge').notNull(),
  edgeDirection: text('edge_direction').notNull(),
  
  recommendedDirection: text('recommended_direction').notNull(),
  recommendedSize: real('recommended_size').notNull(),
  kellyFraction: real('kelly_fraction').notNull(),
  
  actualDirection: text('actual_direction'),
  actualSize: real('actual_size'),
  entryPrice: real('entry_price'),
  executedAt: integer('executed_at', { mode: 'timestamp' }),
  
  resolved: integer('resolved', { mode: 'boolean' }).default(false),
  resolutionOutcome: text('resolution_outcome'),
  resolutionDate: integer('resolution_date', { mode: 'timestamp' }),
  
  realizedPnl: real('realized_pnl'),
  roi: real('roi'),
  
  agentOpinionsJson: text('agent_opinions_json'),
  consensusClustersJson: text('consensus_clusters_json'),
  
  notes: text('notes'),
});

export const agentPerformance = sqliteTable('agent_performance', {
  id: text('id').primaryKey(),
  agentId: text('agent_id').notNull(),
  agentType: text('agent_type').notNull(),
  
  totalPredictions: integer('total_predictions').default(0),
  correctPredictions: integer('correct_predictions').default(0),
  accuracy: real('accuracy'),
  averageError: real('average_error'),
  brierScore: real('brier_score'),
  
  politicsAccuracy: real('politics_accuracy'),
  cryptoAccuracy: real('crypto_accuracy'),
  sportsAccuracy: real('sports_accuracy'),
  
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});
