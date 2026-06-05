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

    // Warn if not using the Supavisor pooler in production — direct connections
    // are IPv6-only and fail on most hosting providers including Vercel.
    if (
      process.env.NODE_ENV === "production" &&
      !connectionString.includes("pooler.supabase.com")
    ) {
      console.warn(
        "[db] WARNING: DATABASE_URL does not appear to use the Supabase pooler. " +
          "Direct connections are IPv6-only and may fail on Vercel."
      );
    }

    const client = postgres(connectionString, {
      prepare: false,
      // Supabase's connection pooler (Supavisor) uses a certificate that is NOT
      // in Node.js's default CA bundle. rejectUnauthorized: true causes
      // SELF_SIGNED_CERT_IN_CHAIN and breaks all DB queries on Vercel.
      // "require" enforces TLS encryption without verifying the cert chain —
      // this is the correct setting for Supabase pooler connections.
      ssl: "require",
      // Connection pool settings — Supavisor handles pooling externally,
      // so keep this small to avoid exceeding the pooler connection limit.
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
      // Suppress NOTICE messages from migrations/DDL that leak into app logs.
      onnotice: () => {},
    });

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
