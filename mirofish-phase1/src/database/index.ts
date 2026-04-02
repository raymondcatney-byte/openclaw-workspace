import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './mirofish.db';
const sqlite = new Database(dbPath);

export const db = drizzle(sqlite, { schema });

export async function initDatabase(): Promise<void> {
  // Ensure tables exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS predictions (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      market_id TEXT NOT NULL,
      market_slug TEXT NOT NULL,
      market_question TEXT NOT NULL,
      market_category TEXT NOT NULL,
      consensus_probability REAL NOT NULL,
      consensus_confidence REAL NOT NULL,
      agent_count INTEGER NOT NULL,
      simulation_time_ms INTEGER NOT NULL,
      market_price_yes REAL NOT NULL,
      market_price_no REAL NOT NULL,
      market_volume REAL NOT NULL,
      edge REAL NOT NULL,
      edge_direction TEXT NOT NULL,
      recommended_direction TEXT NOT NULL,
      recommended_size REAL NOT NULL,
      kelly_fraction REAL NOT NULL,
      actual_direction TEXT,
      actual_size REAL,
      entry_price REAL,
      executed_at INTEGER,
      resolved INTEGER DEFAULT 0,
      resolution_outcome TEXT,
      resolution_date INTEGER,
      realized_pnl REAL,
      roi REAL,
      agent_opinions_json TEXT,
      consensus_clusters_json TEXT,
      notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_predictions_market ON predictions(market_id);
    CREATE INDEX IF NOT EXISTS idx_predictions_timestamp ON predictions(timestamp);
    CREATE INDEX IF NOT EXISTS idx_predictions_resolved ON predictions(resolved);

    CREATE TABLE IF NOT EXISTS agent_performance (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL,
      agent_type TEXT NOT NULL,
      total_predictions INTEGER DEFAULT 0,
      correct_predictions INTEGER DEFAULT 0,
      accuracy REAL,
      average_error REAL,
      brier_score REAL,
      politics_accuracy REAL,
      crypto_accuracy REAL,
      sports_accuracy REAL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_agent_performance_agent ON agent_performance(agent_id);
  `);
  
  console.log('✅ Database initialized');
}
