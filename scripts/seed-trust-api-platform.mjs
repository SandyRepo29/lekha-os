/**
 * seed-trust-api-platform.mjs
 * Seed: Trust API Platform™ — demo clients, API keys, webhooks, usage data
 * Usage: node scripts/seed-trust-api-platform.mjs
 */

import postgres from "postgres";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = postgres(DATABASE_URL, { ssl: "require", max: 1 });

async function main() {
  console.log("🔌 Seeding Trust API Platform™…");

  // Find first org
  const orgs = await sql`SELECT id FROM organizations LIMIT 1`;
  if (!orgs.length) { console.error("No organization found. Run seed-demo.mjs first."); process.exit(1); }
  const orgId = orgs[0].id;

  const profiles = await sql`SELECT id FROM profiles WHERE organization_id = ${orgId} LIMIT 1`;
  const createdBy = profiles[0]?.id ?? null;

  console.log(`  → Org: ${orgId}`);

  // ── Clients ────────────────────────────────────────────────────────────────
  const clients = [
    { name: "Procurement Portal",     clientType: "application", plan: "growth",     contactEmail: "dev@procurement.example.com" },
    { name: "SAP Ariba Integration",  clientType: "partner",     plan: "enterprise", contactEmail: "integration@ariba.example.com" },
    { name: "Vendor Risk Dashboard",  clientType: "internal",    plan: "business",   contactEmail: null },
  ];

  const insertedClients = [];
  for (const c of clients) {
    const existing = await sql`SELECT id FROM tap_clients WHERE organization_id = ${orgId} AND name = ${c.name}`;
    if (existing.length) { insertedClients.push(existing[0]); console.log(`  ✓ Client exists: ${c.name}`); continue; }
    const rows = await sql`
      INSERT INTO tap_clients (organization_id, name, client_type, plan, contact_email, created_by)
      VALUES (${orgId}, ${c.name}, ${c.clientType}, ${c.plan}, ${c.contactEmail ?? null}, ${createdBy})
      RETURNING id, name
    `;
    insertedClients.push(rows[0]);
    console.log(`  ✓ Created client: ${c.name}`);
  }

  // ── API Keys ───────────────────────────────────────────────────────────────
  const keyDefs = [
    { name: "Production Key",    plan: "growth",     clientIdx: 0, permissions: ["read"] },
    { name: "Partner Key — SAP", plan: "enterprise", clientIdx: 1, permissions: ["read"] },
    { name: "Internal Key",      plan: "business",   clientIdx: 2, permissions: ["read", "read_write"] },
  ];

  for (let i = 0; i < keyDefs.length; i++) {
    const kd = keyDefs[i];
    const client = insertedClients[kd.clientIdx];
    if (!client) continue;
    const existing = await sql`SELECT id FROM tap_api_keys WHERE organization_id = ${orgId} AND name = ${kd.name}`;
    if (existing.length) { console.log(`  ✓ Key exists: ${kd.name}`); continue; }

    const rawKey = `tap_${randomBytes(24).toString("hex")}`;
    const keyPrefix = rawKey.slice(0, 12);
    const keyHash = await bcrypt.hash(rawKey, 10);

    await sql`
      INSERT INTO tap_api_keys (organization_id, client_id, name, key_prefix, key_hash, plan, permissions, usage_count, created_by)
      VALUES (${orgId}, ${client.id}, ${kd.name}, ${keyPrefix}, ${keyHash}, ${kd.plan}, ${JSON.stringify(kd.permissions)}, ${Math.floor(Math.random() * 5000)}, ${createdBy})
    `;
    console.log(`  ✓ Created key: ${kd.name} (${keyPrefix}…)`);
  }

  // ── Subscriptions ──────────────────────────────────────────────────────────
  const products = await sql`SELECT id, slug FROM tap_products LIMIT 8`;
  for (const client of insertedClients.slice(0, 2)) {
    for (const p of products.slice(0, 3)) {
      const existing = await sql`SELECT id FROM tap_subscriptions WHERE organization_id = ${orgId} AND client_id = ${client.id} AND product_id = ${p.id}`;
      if (existing.length) continue;
      await sql`INSERT INTO tap_subscriptions (organization_id, client_id, product_id, status, created_by) VALUES (${orgId}, ${client.id}, ${p.id}, 'active', ${createdBy})`;
    }
  }
  console.log("  ✓ Created subscriptions");

  // ── Webhooks ───────────────────────────────────────────────────────────────
  const webhooks = [
    { name: "Procurement Sync",   url: "https://hooks.example.com/audt/procurement",  events: ["trust.score.updated", "vendor.verified", "risk.created"] },
    { name: "Risk Alerts",        url: "https://hooks.example.com/audt/risk",         events: ["risk.created", "audit.completed"] },
    { name: "Compliance Monitor", url: "https://hooks.example.com/audt/compliance",   events: ["audit.completed", "assessment.completed", "badge.issued"] },
  ];

  for (const wh of webhooks) {
    const existing = await sql`SELECT id FROM tap_webhooks WHERE organization_id = ${orgId} AND name = ${wh.name}`;
    if (existing.length) { console.log(`  ✓ Webhook exists: ${wh.name}`); continue; }
    const secret = randomBytes(32).toString("hex");
    await sql`
      INSERT INTO tap_webhooks (organization_id, name, url, secret, events, status, created_by)
      VALUES (${orgId}, ${wh.name}, ${wh.url}, ${secret}, ${JSON.stringify(wh.events)}, 'active', ${createdBy})
    `;
    console.log(`  ✓ Created webhook: ${wh.name}`);
  }

  // ── Sample usage data ──────────────────────────────────────────────────────
  const endpoints = [
    "/api/v1/public/trust-score",
    "/api/v1/public/vendor-trust",
    "/api/v1/public/verification",
    "/api/v1/public/benchmarking",
    "/api/v1/public/ai-trust",
  ];

  const usageCount = await sql`SELECT count(*)::int AS c FROM tap_usage WHERE organization_id = ${orgId}`;
  if ((usageCount[0]?.c ?? 0) < 10) {
    const usageRows = [];
    for (let day = 29; day >= 0; day--) {
      const callsThisDay = Math.floor(Math.random() * 40) + 5;
      for (let j = 0; j < callsThisDay; j++) {
        const ep = endpoints[Math.floor(Math.random() * endpoints.length)];
        const ok = Math.random() > 0.04;
        const ts = new Date(Date.now() - day * 86400000 - Math.random() * 86400000);
        usageRows.push({ ep, ok, ts });
      }
    }

    for (const row of usageRows) {
      await sql`
        INSERT INTO tap_usage (organization_id, endpoint, method, status_code, latency_ms, called_at)
        VALUES (${orgId}, ${row.ep}, 'GET', ${row.ok ? 200 : 429}, ${Math.floor(Math.random() * 200) + 20}, ${row.ts.toISOString()})
      `;
    }
    console.log(`  ✓ Seeded ${usageRows.length} usage records`);
  } else {
    console.log("  ✓ Usage data exists");
  }

  // ── Audit events ───────────────────────────────────────────────────────────
  const auditCount = await sql`SELECT count(*)::int AS c FROM tap_audit_events WHERE organization_id = ${orgId}`;
  if ((auditCount[0]?.c ?? 0) === 0) {
    const events = [
      { eventType: "api.client.created", resourceType: "client", details: { name: "Procurement Portal" } },
      { eventType: "api.key.created",    resourceType: "api_key", details: { name: "Production Key", plan: "growth" } },
      { eventType: "webhook.created",    resourceType: "webhook",  details: { name: "Procurement Sync" } },
      { eventType: "api.key.created",    resourceType: "api_key", details: { name: "Partner Key — SAP", plan: "enterprise" } },
      { eventType: "webhook.created",    resourceType: "webhook",  details: { name: "Risk Alerts" } },
    ];
    for (const ev of events) {
      await sql`
        INSERT INTO tap_audit_events (organization_id, actor_id, event_type, resource_type, details)
        VALUES (${orgId}, ${createdBy}, ${ev.eventType}, ${ev.resourceType}, ${JSON.stringify(ev.details)})
      `;
    }
    console.log("  ✓ Seeded audit events");
  }

  console.log("\n✅ Trust API Platform™ seed complete!");
  console.log(`   → ${insertedClients.length} clients | 3 API keys | 3 webhooks | 30-day usage data`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => sql.end());
