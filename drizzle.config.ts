import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Use the DIRECT (non-pooled) connection for migrations (port 5432).
    url: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL!,
  },
  schemaFilter: ["public"],
  verbose: true,
  strict: true,
});
