// src/lib/db.ts
import { env } from 'astro:env';

export type Database = D1Database;

// This assumes you're binding D1 in `wrangler.toml` like:
// [[d1_databases]]
// binding = "DB"
// database_name = "etchnft"
// database_id = "<your-db-id>"

export function getDatabase(): D1Database {
  if (!('DB' in env)) {
    throw new Error('D1 database binding "DB" is not available in this environment.');
  }

  return env.DB as D1Database;
}
