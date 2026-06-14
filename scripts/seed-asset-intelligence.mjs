// seed-asset-intelligence.mjs — Asset Intelligence™ demo seed
// Usage: node scripts/seed-asset-intelligence.mjs

import postgres from "postgres";
import { randomUUID } from "crypto";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL required"); process.exit(1); }

const sql = postgres(DATABASE_URL, { ssl: "require", max: 1 });

async function main() {
  // Find the most active org (most memberships) — avoids seeding into E2E test org
  const [org] = await sql`SELECT organization_id AS id FROM memberships GROUP BY organization_id ORDER BY count(*) DESC LIMIT 1`;
  if (!org) { console.error("No organization found. Run seed-demo.mjs first."); process.exit(1); }
  const orgId = org.id;
  console.log(`Seeding Asset Intelligence™ for org: ${orgId}`);

  // Find a user
  const [profile] = await sql`SELECT id FROM profiles WHERE id IN (SELECT user_id FROM memberships WHERE organization_id = ${orgId}) LIMIT 1`;
  const userId = profile?.id;

  // ─── Applications ─────────────────────────────────────────────────────────
  const apps = [
    { name: "Customer Portal",        type: "application",    criticality: "critical",         env: "production",   unit: "Engineering",  pii: true,  class: "restricted",  stack: "Next.js, Supabase, TypeScript" },
    { name: "Admin Dashboard",        type: "application",    criticality: "critical",         env: "production",   unit: "Engineering",  pii: true,  class: "confidential", stack: "React, Node.js" },
    { name: "Mobile App (Android)",   type: "application",    criticality: "high",             env: "production",   unit: "Product",      pii: true,  class: "confidential", stack: "React Native" },
    { name: "Partner API Gateway",    type: "api",            criticality: "critical",         env: "production",   unit: "Platform",     pii: false, class: "confidential", stack: "Kong, Node.js" },
    { name: "Internal API v2",        type: "api",            criticality: "high",             env: "production",   unit: "Engineering",  pii: false, class: "internal",     stack: "FastAPI, Python" },
    { name: "Analytics Platform",     type: "application",    criticality: "medium",           env: "production",   unit: "Data",         pii: false, class: "internal",     stack: "Metabase, PostgreSQL" },
    { name: "Reporting Service",      type: "application",    criticality: "medium",           env: "production",   unit: "Finance",      pii: false, class: "internal",     stack: "Node.js" },
    { name: "Vendor Onboarding App",  type: "application",    criticality: "high",             env: "production",   unit: "Procurement",  pii: true,  class: "confidential", stack: "Next.js" },
  ];

  // ─── Databases ────────────────────────────────────────────────────────────
  const databases = [
    { name: "Primary PostgreSQL (Supabase)", type: "database", criticality: "mission_critical", env: "production",   unit: "Platform",   pii: true,  class: "restricted",  stack: "PostgreSQL 16" },
    { name: "Analytics DW (BigQuery)",       type: "database", criticality: "high",             env: "production",   unit: "Data",       pii: false, class: "internal",    stack: "BigQuery" },
    { name: "Redis Cache Cluster",           type: "database", criticality: "high",             env: "production",   unit: "Platform",   pii: false, class: "internal",    stack: "Redis 7" },
    { name: "Elasticsearch (Search)",        type: "database", criticality: "medium",           env: "production",   unit: "Platform",   pii: false, class: "internal",    stack: "Elasticsearch 8" },
    { name: "Test Database",                 type: "database", criticality: "low",              env: "testing",      unit: "QA",         pii: false, class: "internal",    stack: "PostgreSQL 16" },
  ];

  // ─── Cloud Resources ──────────────────────────────────────────────────────
  const cloud = [
    { name: "AWS Mumbai (ap-south-1)",     type: "cloud_resource", criticality: "mission_critical", env: "production",  unit: "Platform",  pii: true,  class: "restricted",  cloud: "AWS"   },
    { name: "Vercel Edge Network",         type: "cloud_resource", criticality: "critical",         env: "production",  unit: "Platform",  pii: false, class: "confidential", cloud: "Vercel" },
    { name: "Supabase Storage (Mumbai)",   type: "cloud_resource", criticality: "critical",         env: "production",  unit: "Platform",  pii: true,  class: "restricted",   cloud: "AWS"   },
    { name: "CloudFront CDN",             type: "cloud_resource", criticality: "high",             env: "production",  unit: "Platform",  pii: false, class: "internal",     cloud: "AWS"   },
    { name: "AWS SES (Email)",            type: "cloud_resource", criticality: "medium",           env: "production",  unit: "Platform",  pii: false, class: "internal",     cloud: "AWS"   },
    { name: "Dev EC2 Cluster",            type: "cloud_resource", criticality: "low",              env: "development", unit: "Engineering", pii: false, class: "internal",   cloud: "AWS"   },
  ];

  // ─── Data Assets ──────────────────────────────────────────────────────────
  const dataAssets = [
    { name: "Customer PII Dataset",        type: "data_asset", criticality: "critical",         env: "production",   unit: "Data",      pii: true,  class: "restricted",  sensitive: true  },
    { name: "Financial Transaction Logs",  type: "data_asset", criticality: "critical",         env: "production",   unit: "Finance",   pii: false, class: "restricted",  sensitive: true  },
    { name: "Vendor Compliance Documents", type: "data_asset", criticality: "high",             env: "production",   unit: "Compliance", pii: false, class: "confidential", sensitive: false },
    { name: "Employee HR Records",         type: "data_asset", criticality: "high",             env: "production",   unit: "HR",        pii: true,  class: "restricted",  sensitive: true  },
    { name: "AI Training Dataset",         type: "data_asset", criticality: "high",             env: "production",   unit: "AI Team",   pii: false, class: "confidential", sensitive: false },
    { name: "Audit Log Archive",           type: "data_asset", criticality: "high",             env: "production",   unit: "Compliance", pii: false, class: "confidential", sensitive: false },
    { name: "Analytics Clickstream",       type: "data_asset", criticality: "medium",           env: "production",   unit: "Data",      pii: false, class: "internal",    sensitive: false },
  ];

  // ─── Business Processes ───────────────────────────────────────────────────
  const processes = [
    { name: "Vendor Onboarding Process",   type: "business_process", criticality: "high",   unit: "Procurement" },
    { name: "Customer KYC Workflow",       type: "business_process", criticality: "critical", unit: "Compliance" },
    { name: "Incident Response Process",   type: "business_process", criticality: "critical", unit: "Security"   },
    { name: "Data Deletion (DSR) Process", type: "business_process", criticality: "high",   unit: "Privacy"    },
  ];

  const allAssets = [
    ...apps.map(a => ({ ...a, cloud: null, sensitive: a.pii })),
    ...databases.map(a => ({ ...a, cloud: null, sensitive: a.pii, env: a.env })),
    ...cloud.map(a => ({ ...a, pii: a.pii, class: a.class, stack: null, sensitive: false })),
    ...dataAssets.map(a => ({ ...a, cloud: null, env: a.env })),
    ...processes.map(a => ({ ...a, cloud: null, pii: false, class: "internal", stack: null, sensitive: false, env: "production" })),
  ];

  const insertedIds = [];

  for (const a of allAssets) {
    const [exists] = await sql`SELECT id FROM assets WHERE organization_id = ${orgId} AND name = ${a.name} LIMIT 1`;
    if (exists) { insertedIds.push(exists.id); continue; }

    const id = randomUUID();
    await sql`
      INSERT INTO assets (id, organization_id, name, asset_type, criticality, environment, status,
        business_unit, contains_pii, contains_sensitive, data_class, technology_stack, cloud_provider,
        created_by, created_at, updated_at)
      VALUES (${id}, ${orgId}, ${a.name}, ${a.type}, ${a.criticality}, ${a.env ?? "production"}, 'active',
        ${a.unit ?? null}, ${a.pii ?? false}, ${a.sensitive ?? false}, ${a.class ?? null},
        ${a.stack ?? null}, ${a.cloud ?? null},
        ${userId ?? null}, NOW(), NOW())
    `;
    insertedIds.push(id);
  }

  console.log(`✓ Inserted/verified ${insertedIds.length} assets`);

  // ─── Alerts ───────────────────────────────────────────────────────────────
  const alertsToAdd = [
    { assetIdx: 0, type: "missing_risk_assessment", severity: "high",   title: "Customer Portal has no risk assessment linked" },
    { assetIdx: 8, type: "unreviewed",               severity: "critical", title: "Primary Database overdue for periodic review" },
    { assetIdx: 10, type: "missing_controls",        severity: "high",  title: "AWS Mumbai region missing control mappings" },
    { assetIdx: 14, type: "missing_classification",  severity: "medium", title: "Customer PII Dataset data class needs validation" },
  ];

  for (const al of alertsToAdd) {
    const assetId = insertedIds[al.assetIdx];
    if (!assetId) continue;
    const [exists] = await sql`SELECT id FROM asset_alerts WHERE asset_id = ${assetId} AND title = ${al.title} LIMIT 1`;
    if (exists) continue;
    await sql`
      INSERT INTO asset_alerts (id, organization_id, asset_id, alert_type, severity, title, status, created_at)
      VALUES (${randomUUID()}, ${orgId}, ${assetId}, ${al.type}, ${al.severity}, ${al.title}, 'open', NOW())
    `;
  }
  console.log("✓ Inserted asset alerts");

  // ─── Relationships ────────────────────────────────────────────────────────
  const rels = [
    { si: 0, ti: 8,  type: "depends_on",   critical: true  },  // Customer Portal → PostgreSQL
    { si: 0, ti: 11, type: "depends_on",   critical: false },  // Customer Portal → Redis
    { si: 0, ti: 3,  type: "uses",         critical: false },  // Customer Portal → Partner API
    { si: 3, ti: 8,  type: "depends_on",   critical: true  },  // Partner API → PostgreSQL
    { si: 9, ti: 8,  type: "processes",    critical: false },  // Analytics → Primary DB
    { si: 1, ti: 8,  type: "depends_on",   critical: true  },  // Admin Dashboard → PostgreSQL
  ];

  for (const r of rels) {
    const sid = insertedIds[r.si], tid = insertedIds[r.ti];
    if (!sid || !tid) continue;
    const [exists] = await sql`SELECT id FROM asset_relationships WHERE source_asset_id = ${sid} AND target_asset_id = ${tid} LIMIT 1`;
    if (exists) continue;
    await sql`
      INSERT INTO asset_relationships (id, organization_id, source_asset_id, target_asset_id, relationship_type, is_critical, created_at)
      VALUES (${randomUUID()}, ${orgId}, ${sid}, ${tid}, ${r.type}, ${r.critical}, NOW())
    `;
  }
  console.log("✓ Inserted asset relationships");

  console.log("\n✅ Asset Intelligence™ seed complete!");
  console.log(`   ${allAssets.length} assets · ${alertsToAdd.length} alerts · ${rels.length} relationships`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => sql.end());
