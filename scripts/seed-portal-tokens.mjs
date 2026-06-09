/**
 * seed-portal-tokens.mjs — Vendor portal tokens for testing
 *
 * Seeds 4 vendor portal tokens in distinct states:
 *
 *   1. ACTIVE   — Apollo HealthCo (30 days until expiry) — main E2E test target
 *   2. ACTIVE   — Yotta Data Services (14 days until expiry)
 *   3. ACTIVE   — Sify Technologies (7 days until expiry — "expiring soon" test)
 *   4. EXPIRED  — Darwinbox (expired 7 days ago) — tests expiry handling
 *
 * Tokens are printed at the end so you can open them in the browser.
 *
 * Idempotent — safe to re-run (upserts by vendor_id + expiry window).
 *
 * Prerequisites: seed-demo.mjs (vendors must exist)
 *
 * Usage: node scripts/seed-portal-tokens.mjs [orgId]
 */

import postgres from "postgres";
import { config } from "dotenv";
import { randomUUID } from "crypto";
import { randomBytes } from "crypto";

config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

const log  = (msg) => console.log(`  ${msg}`);
const head = (msg) => console.log(`\n▶ ${msg}`);

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

const generateToken = () => randomBytes(32).toString("hex");

// ── Org lookup ────────────────────────────────────────────────────────────────
const targetId = process.argv[2] ?? null;
const orgs = targetId
  ? await sql`select id, name from organizations where id = ${targetId}`
  : await sql`select id, name from organizations where name = 'admin corp' order by created_at limit 1`;

if (!orgs.length) {
  console.error("No org found. Run seed-demo.mjs first, or pass an orgId.");
  await sql.end(); process.exit(1);
}
const { id: orgId, name: orgName } = orgs[0];
const [owner] = await sql`
  select user_id from memberships where organization_id = ${orgId} and role = 'owner' limit 1`;
const ownerId = owner?.user_id ?? null;
log(`Org: ${orgName} (${orgId})`);

// ── Vendor lookup ─────────────────────────────────────────────────────────────
const vendors = await sql`
  select id, name from vendors
  where organization_id = ${orgId}
  order by name`;

if (!vendors.length) {
  console.error("No vendors found. Run seed-demo.mjs first.");
  await sql.end(); process.exit(1);
}

const vByName = Object.fromEntries(vendors.map(v => [v.name, v.id]));

// Fuzzy lookup helpers
const findVendor = (keyword) =>
  Object.entries(vByName).find(([name]) => name.toLowerCase().includes(keyword.toLowerCase()))?.[1];

// ── Token definitions ─────────────────────────────────────────────────────────
const TOKEN_DEFS = [
  {
    vendorKeyword: "Apollo",
    label: "Apollo HealthCo Ltd",
    expiresInDays: 30,
    note: "Main E2E test target — critical vendor with minimal documents. Use this to test vendor self-service portal upload.",
  },
  {
    vendorKeyword: "Yotta",
    label: "Yotta Data Services Pvt Ltd",
    expiresInDays: 14,
    note: "High-risk vendor with low document coverage. Tests portal for high-risk vendor flow.",
  },
  {
    vendorKeyword: "Sify",
    label: "Sify Technologies Ltd",
    expiresInDays: 7,
    note: "Expiring soon — tests 7-day expiry warning state in portal.",
  },
  {
    vendorKeyword: "Darwinbox",
    label: "Darwinbox Digital Solutions",
    expiresInDays: -7, // already expired
    note: "EXPIRED token — tests expiry handling (should return 404/expired page).",
  },
];

// ── Insert tokens ─────────────────────────────────────────────────────────────
head("Seeding Portal Tokens");

const results = [];

for (const def of TOKEN_DEFS) {
  const vendorId = findVendor(def.vendorKeyword);
  if (!vendorId) {
    log(`skip — vendor not found: ${def.label}`);
    continue;
  }

  // Check if an active (or recently expired) token already exists for this vendor
  const existing = await sql`
    select id, token, expires_at from vendor_portal_tokens
    where vendor_id = ${vendorId}
    order by created_at desc limit 1`;

  // Determine if the existing token matches the intended state
  const expiresAt = daysFromNow(def.expiresInDays);
  const isExpired = def.expiresInDays < 0;

  if (existing.length) {
    const existingExpired = new Date(existing[0].expires_at) < new Date();
    const wantsDifferentState = existingExpired !== isExpired;

    if (!wantsDifferentState) {
      log(`skip (exists): ${def.label} — token: ${existing[0].token.slice(0, 16)}...`);
      results.push({ label: def.label, token: existing[0].token, expiresAt: existing[0].expires_at, note: def.note });
      continue;
    }
  }

  const token = generateToken();

  await sql`
    insert into vendor_portal_tokens (
      id, organization_id, vendor_id, token, expires_at, created_by, created_at
    ) values (
      ${randomUUID()}, ${orgId}, ${vendorId}, ${token}, ${expiresAt},
      ${ownerId}, now()
    )`;

  const status = isExpired ? "EXPIRED" : def.expiresInDays <= 7 ? "EXPIRING SOON" : "ACTIVE";
  log(`[${status.padEnd(13)}] ${def.label}`);
  log(`               Token: ${token}`);
  results.push({ label: def.label, token, expiresAt, note: def.note });
}

// ── Summary ───────────────────────────────────────────────────────────────────
const [counts] = await sql`
  select
    count(*)::int                                  as total,
    count(*) filter (where expires_at > now())::int as active,
    count(*) filter (where expires_at <= now())::int as expired,
    count(*) filter (where used_at is not null)::int as used
  from vendor_portal_tokens
  where organization_id = ${orgId}`;

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

console.log(`\n✅ Done — ${orgName}`);
console.log(`   Tokens: ${counts.total} total (${counts.active} active, ${counts.expired} expired, ${counts.used} used)`);
console.log(`\n📎 Portal URLs for testing:`);
for (const r of results) {
  const expired = new Date(r.expiresAt) < new Date();
  const label = expired ? "⛔ EXPIRED" : "✅ ACTIVE ";
  console.log(`\n   ${label} — ${r.label}`);
  console.log(`   URL:   ${baseUrl}/portal/${r.token}`);
  console.log(`   Note:  ${r.note}`);
}
console.log(`\n   Tip: Copy a URL and open it in an incognito window (no auth needed).`);

await sql.end();
