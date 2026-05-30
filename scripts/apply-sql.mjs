// Apply a raw .sql file to the database (used for RLS policies that live
// outside the Drizzle migration chain).
//   node scripts/apply-sql.mjs supabase/rls.sql
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/apply-sql.mjs <path-to-sql>");
  process.exit(1);
}

const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL_DIRECT / DATABASE_URL not set");
  process.exit(1);
}

const sql = postgres(url, { max: 1, prepare: false });

try {
  const content = readFileSync(file, "utf8");
  await sql.unsafe(content).simple();
  console.log(`✓ Applied ${file}`);
} catch (err) {
  console.error(`✗ Failed to apply ${file}:`, err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
