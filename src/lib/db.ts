// src/lib/db.ts
export type Database = D1Database;

// This assumes you're binding D1 in `wrangler.toml` like:
// [[d1_databases]]
// binding = "DB"
// database_name = "etchnft"
// database_id = "<your-db-id>"

export function getDatabase(runtime?: any): D1Database {
  // In Cloudflare Workers, the D1 binding is available on the runtime env
  const env = runtime?.env || globalThis;

  if (!env.DB) {
    throw new Error(
      'D1 database binding "DB" is not available in this environment.',
    );
  }

  return env.DB as D1Database;
}
