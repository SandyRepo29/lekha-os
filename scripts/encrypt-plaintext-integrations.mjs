/**
 * Audit and backfill plaintext integration configs.
 *
 * Run AFTER setting ENCRYPTION_KEY in your environment:
 *   node scripts/encrypt-plaintext-integrations.mjs          # dry-run (safe)
 *   node scripts/encrypt-plaintext-integrations.mjs --fix    # encrypt in-place
 *
 * A row is "plaintext" if its config JSONB does not contain an "_enc" key
 * but does contain other keys (non-empty, unencrypted credentials).
 *
 * Empty configs ({}) are skipped — they contain no credentials.
 */

import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { readFileSync } from "fs";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const DRY_RUN = !process.argv.includes("--fix");

const DATABASE_URL = process.env.DATABASE_URL;
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set in .env.local");
  process.exit(1);
}
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  console.error(
    "ERROR: ENCRYPTION_KEY is not set or invalid (must be 64-char hex string).\n" +
      "Generate: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
  );
  process.exit(1);
}

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const key = Buffer.from(ENCRYPTION_KEY, "hex");

function encryptConfig(plainConfig) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  const plaintext = JSON.stringify(plainConfig);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const payload = [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
  return { _enc: payload };
}

const sql = postgres(DATABASE_URL, { ssl: "require", max: 2 });

async function main() {
  console.log(`\n=== Integration Encryption Audit ${DRY_RUN ? "(DRY RUN)" : "(FIX MODE)"} ===\n`);

  const rows = await sql`
    SELECT id, organization_id, provider, config
    FROM integrations
    WHERE config IS NOT NULL
      AND config != '{}'::jsonb
      AND config->>'_enc' IS NULL
  `;

  if (rows.length === 0) {
    console.log("✓ All integration configs are encrypted. No action needed.");
    await sql.end();
    return;
  }

  console.log(`Found ${rows.length} plaintext integration config(s):\n`);
  for (const row of rows) {
    const keys = Object.keys(row.config);
    console.log(`  [${row.provider}] org=${row.organization_id} id=${row.id}`);
    console.log(`    Fields: ${keys.join(", ")}`);
  }

  if (DRY_RUN) {
    console.log(`\n⚠  DRY RUN — no changes made.`);
    console.log(`   Re-run with --fix to encrypt these rows:`);
    console.log(`   node scripts/encrypt-plaintext-integrations.mjs --fix\n`);
    await sql.end();
    return;
  }

  console.log("\nEncrypting...\n");
  let fixed = 0;
  for (const row of rows) {
    const encrypted = encryptConfig(row.config);
    await sql`
      UPDATE integrations
      SET config = ${sql.json(encrypted)}, updated_at = NOW()
      WHERE id = ${row.id}
    `;
    console.log(`  ✓ Encrypted [${row.provider}] org=${row.organization_id}`);
    fixed++;
  }

  console.log(`\n✓ Encrypted ${fixed} row(s). All integration configs are now protected.\n`);
  await sql.end();
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
