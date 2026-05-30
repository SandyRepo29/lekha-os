import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Drizzle client over Supabase Postgres — lazily initialised.
 *
 * The connection is created on first use, NOT at module evaluation time.
 * This lets Next.js import the module during the build without requiring
 * DATABASE_URL to be present at build time (it's a runtime secret).
 *
 * Use the Supavisor transaction pooler (port 6543) in serverless/Vercel
 * environments. Prepared statements are disabled — the pooler doesn't support them.
 */
type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

let _db: DrizzleDB | null = null;

function getInstance(): DrizzleDB {
  if (!_db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL environment variable is not set.");
    const client = postgres(connectionString, { prepare: false });
    _db = drizzle(client, { schema });
  }
  return _db;
}

/**
 * Proxy so all callers keep `import { db } from "@/lib/db"` unchanged —
 * the real connection is created the first time any method is called.
 */
export const db = new Proxy({} as DrizzleDB, {
  get(_, prop) {
    return getInstance()[prop as keyof DrizzleDB];
  },
});

export { schema };

export type Executor = DrizzleDB | Parameters<Parameters<DrizzleDB["transaction"]>[0]>[0];
