// app/biotech/lib/db.ts
// Database utilities for Neon Postgres

import { neon } from '@neondatabase/serverless';

// Database connection
const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;

export { sql };

// Helper to check if DB is configured
export function isDatabaseConfigured(): boolean {
  return !!sql;
}

// Cache duration in seconds
export const CACHE_DURATION = {
  PAPERS: 3600,      // 1 hour
  TRIALS: 1800,      // 30 minutes
  COMPOUNDS: 86400,  // 24 hours
  INTELLIGENCE: 600, // 10 minutes
};
