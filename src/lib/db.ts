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
    // For local development, create a mock database or fallback
    console.warn(
      'D1 database binding "DB" is not available in this environment. Using mock database for development.',
    );
    return createMockDatabase();
  }

  return env.DB as D1Database;
}

// Mock database for development/testing
function createMockDatabase(): D1Database {
  const mockResults = {
    results: [],
    success: true,
    meta: {
      changed_db: false,
      changes: 0,
      duration: 0,
      last_row_id: 0,
      rows_read: 0,
      rows_written: 0,
      size_after: 0,
    },
  };

  return {
    prepare: (sql: string) => ({
      bind: (...params: any[]) => ({
        first: async () => null,
        all: async () => mockResults,
        run: async () => mockResults,
      }),
      first: async () => null,
      all: async () => mockResults,
      run: async () => mockResults,
    }),
    batch: async (statements: any[]) => [mockResults],
    exec: async (sql: string) => mockResults,
    dump: async () => new ArrayBuffer(0),
  } as D1Database;
}
