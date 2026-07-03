// seed-platform-admin.mjs
// Seeds demo Platform Owner Console users into platform_users table.
// Run: node scripts/seed-platform-admin.mjs
//
// Creates 3 users (idempotent — skips if email already exists):
//   platform-owner@audt.tech   / AudtOwner2026!   (Platform Owner)
//   platform-admin@audt.tech   / AudtAdmin2026!   (Platform Admin)
//   platform-support@audt.tech / AudtSupport2026! (Platform Support)

import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set in .env.local");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: "require", max: 1 });

const USERS = [
  {
    email:    "platform-owner@audt.tech",
    name:     "Sandy Bedi",
    role:     "platform_owner",
    password: "AudtOwner2026!",
  },
  {
    email:    "platform-admin@audt.tech",
    name:     "Platform Admin",
    role:     "platform_admin",
    password: "AudtAdmin2026!",
  },
  {
    email:    "platform-support@audt.tech",
    name:     "Support Agent",
    role:     "platform_support",
    password: "AudtSupport2026!",
  },
];

async function main() {
  console.log("Seeding Platform Owner Console users...\n");

  // Apply migration 0042 tables if not yet present
  await sql`
    CREATE TABLE IF NOT EXISTS platform_users (
      id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email               TEXT NOT NULL UNIQUE,
      name                TEXT NOT NULL,
      role                TEXT NOT NULL DEFAULT 'platform_support',
      password_hash       TEXT NOT NULL,
      totp_secret         TEXT,
      totp_enabled        BOOLEAN NOT NULL DEFAULT false,
      recovery_codes      TEXT[],
      is_active           BOOLEAN NOT NULL DEFAULT true,
      last_login_at       TIMESTAMPTZ,
      password_changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `.catch(() => {}); // already exists → ignore

  for (const user of USERS) {
    // Check if already exists
    const existing = await sql`
      SELECT id FROM platform_users WHERE email = ${user.email} LIMIT 1
    `;
    if (existing.length > 0) {
      console.log(`  ⏭  ${user.email} — already exists, skipping`);
      continue;
    }

    const hash = await bcrypt.hash(user.password, 12);
    await sql`
      INSERT INTO platform_users (email, name, role, password_hash)
      VALUES (${user.email}, ${user.name}, ${user.role}, ${hash})
    `;
    console.log(`  ✓  ${user.email} (${user.role})`);
  }

  console.log("\n─────────────────────────────────────────────────────");
  console.log("Login at: /platform-admin/login");
  console.log("");
  console.log("Credentials:");
  for (const u of USERS) {
    console.log(`  ${u.role.padEnd(20)} ${u.email}`);
    console.log(`  ${"".padEnd(20)} password: ${u.password}`);
  }
  console.log("─────────────────────────────────────────────────────");
  console.log("\nDone.");
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => sql.end());
