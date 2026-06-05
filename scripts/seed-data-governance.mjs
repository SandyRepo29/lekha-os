/**
 * Lekha OS — Data Governance demo seed.
 *
 * Covers gaps left by earlier seed scripts:
 *  1. Backfills new vendor_documents columns (filename, content_type,
 *     file_size, storage_bucket, storage_provider) for existing demo rows
 *  2. Seeds organization_settings (branding)
 *  3. Seeds login_history entries for the demo owner
 *  4. Seeds rich audit_logs for all Module 1–3 event types
 *
 * Safe to re-run — all inserts use ON CONFLICT DO NOTHING.
 *
 * Usage: node scripts/seed-data-governance.mjs
 */

import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

// ── Workspace ──────────────────────────────────────────────────────────────
const [org] = await sql`
  SELECT o.id, o.name, m.user_id
  FROM organizations o
  JOIN memberships m ON m.organization_id = o.id AND m.role = 'owner'
  WHERE o.name = 'admin corp'
  LIMIT 1`;

if (!org) {
  console.error("No 'admin corp' workspace found. Run seed-demo.mjs first.");
  await sql.end();
  process.exit(1);
}
const ORG  = org.id;
const USER = org.user_id;
console.log(`Seeding data governance demo for: ${org.name} (${ORG})`);

// ── 1. Backfill vendor_documents new columns ───────────────────────────────
console.log("\n[1/4] Backfilling vendor_documents storage metadata…");

const docs = await sql`
  SELECT id, document_type, storage_path
  FROM vendor_documents
  WHERE organization_id = ${ORG}
    AND (file_size IS NULL OR storage_bucket IS NULL)`;

const MIME_MAP = {
  "ISO 27001 Certificate":  { ext: "pdf",  size: 420_000 },
  "SOC 2 Report":           { ext: "pdf",  size: 1_850_000 },
  "GDPR DPA":               { ext: "pdf",  size: 310_000 },
  "VAPT Report":            { ext: "pdf",  size: 980_000 },
  "Penetration Test Report":{ ext: "pdf",  size: 1_100_000 },
  "PCI DSS Certificate":    { ext: "pdf",  size: 390_000 },
  "HIPAA Attestation":      { ext: "pdf",  size: 340_000 },
  "MSA / Contract":         { ext: "pdf",  size: 560_000 },
  "NDA":                    { ext: "pdf",  size: 185_000 },
  "SLA Agreement":          { ext: "pdf",  size: 240_000 },
  "Data Processing Agreement":{ ext: "pdf", size: 295_000 },
  "Business Associate Agreement":{ ext: "pdf", size: 280_000 },
  "Privacy Policy":         { ext: "pdf",  size: 210_000 },
  "Financial Statements":   { ext: "pdf",  size: 720_000 },
  "Insurance Certificate":  { ext: "pdf",  size: 160_000 },
  "Company Registration":   { ext: "pdf",  size: 130_000 },
};

for (const doc of docs) {
  const hint = MIME_MAP[doc.document_type] ?? { ext: "pdf", size: Math.floor(200_000 + Math.random() * 600_000) };
  const safeName = doc.document_type.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const filename = `${safeName}.${hint.ext}`;
  // Determine correct bucket from stored path (if any)
  const bucket = doc.storage_path?.startsWith("tenant_")
    ? "compliance-documents"
    : "vendor-documents";

  await sql`
    UPDATE vendor_documents SET
      filename         = ${filename},
      content_type     = 'application/pdf',
      file_size        = ${hint.size},
      storage_bucket   = ${bucket},
      storage_provider = 'supabase',
      uploaded_by      = ${USER}
    WHERE id = ${doc.id}`;
}
console.log(`  ✓ Backfilled ${docs.length} document rows`);

// ── 2. Organization settings ───────────────────────────────────────────────
console.log("\n[2/4] Seeding organization_settings…");

await sql`
  INSERT INTO organization_settings
    (organization_id, primary_color, accent_color, report_footer, email_signature)
  VALUES (
    ${ORG},
    '#6366f1',
    '#8b5cf6',
    'Lekha OS — Confidential. For internal use only.',
    'This email was sent via Lekha OS. Contact security@admincorp.in for queries.'
  )
  ON CONFLICT (organization_id) DO NOTHING`;
console.log("  ✓ Organization settings seeded");

// ── 3. Login history ───────────────────────────────────────────────────────
console.log("\n[3/4] Seeding login_history…");

const logins = [
  { daysAgo: 0,  ip: "103.21.58.12",  ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36", loc: "Mumbai, IN",     status: "success" },
  { daysAgo: 1,  ip: "103.21.58.12",  ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36", loc: "Mumbai, IN",     status: "success" },
  { daysAgo: 2,  ip: "49.36.102.77",  ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",      loc: "Bengaluru, IN",  status: "success" },
  { daysAgo: 3,  ip: "103.21.58.12",  ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36", loc: "Mumbai, IN",     status: "success" },
  { daysAgo: 5,  ip: "197.168.10.44", ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0 Safari/537.36",       loc: "Unknown",        status: "failed" },
  { daysAgo: 7,  ip: "103.21.58.12",  ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36", loc: "Mumbai, IN",     status: "success" },
  { daysAgo: 14, ip: "103.21.58.12",  ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0 Safari/537.36", loc: "Mumbai, IN",     status: "success" },
  { daysAgo: 21, ip: "49.36.102.77",  ua: "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1", loc: "Pune, IN",       status: "success" },
];

for (const l of logins) {
  const ts = new Date(Date.now() - l.daysAgo * 86_400_000).toISOString();
  await sql`
    INSERT INTO login_history
      (organization_id, user_id, ip_address, user_agent, location, status, created_at)
    VALUES (${ORG}, ${USER}, ${l.ip}, ${l.ua}, ${l.loc}, ${l.status}, ${ts}::timestamptz)
    ON CONFLICT DO NOTHING`;
}
console.log(`  ✓ ${logins.length} login history entries seeded`);

// ── 4. Audit logs — rich event coverage ───────────────────────────────────
console.log("\n[4/4] Seeding audit_logs…");

function ago(daysAgo, hoursAgo = 0) {
  return new Date(Date.now() - (daysAgo * 86_400_000) - (hoursAgo * 3_600_000)).toISOString();
}

// Fetch vendor IDs for realistic entity references
const vendorRows = await sql`
  SELECT id, name FROM vendors WHERE organization_id = ${ORG} ORDER BY created_at LIMIT 10`;
const docRows = await sql`
  SELECT id FROM vendor_documents WHERE organization_id = ${ORG} LIMIT 10`;
const assessRows = await sql`
  SELECT id FROM assessments WHERE organization_id = ${ORG} LIMIT 5`;
const frameworkRows = await sql`
  SELECT id FROM frameworks WHERE organization_id = ${ORG} LIMIT 3`;

const V  = vendorRows.map(r => r.id);
const D  = docRows.map(r => r.id);
const A  = assessRows.map(r => r.id);
const F  = frameworkRows.map(r => r.id);

const events = [
  // Document events
  { action: "document.uploaded",      type: "vendor_document", eid: D[0], daysAgo: 0,  h: 2,  ip: "103.21.58.12", meta: { documentType: "ISO 27001 Certificate", vendorName: vendorRows[0]?.name } },
  { action: "document.uploaded",      type: "vendor_document", eid: D[1], daysAgo: 0,  h: 4,  ip: "103.21.58.12", meta: { documentType: "SOC 2 Report",           vendorName: vendorRows[1]?.name } },
  { action: "document.viewed",        type: "vendor_document", eid: D[2], daysAgo: 1,  h: 1,  ip: "103.21.58.12", meta: { documentType: "VAPT Report" } },
  { action: "document.downloaded",    type: "vendor_document", eid: D[0], daysAgo: 1,  h: 3,  ip: "103.21.58.12", meta: { documentType: "ISO 27001 Certificate" } },
  { action: "document.uploaded",      type: "vendor_document", eid: D[3], daysAgo: 2,  h: 0,  ip: "49.36.102.77", meta: { documentType: "NDA",                    vendorName: vendorRows[2]?.name } },
  { action: "document.reprocessed",   type: "vendor_document", eid: D[1], daysAgo: 3,  h: 5,  ip: "103.21.58.12", meta: { documentType: "SOC 2 Report" } },
  { action: "document.downloaded",    type: "vendor_document", eid: D[4], daysAgo: 4,  h: 2,  ip: "103.21.58.12", meta: { documentType: "PCI DSS Certificate" } },
  { action: "document.deleted",       type: "vendor_document", eid: D[5], daysAgo: 5,  h: 9,  ip: "103.21.58.12", meta: { documentType: "Outdated VAPT Report" } },

  // Vendor events
  { action: "vendor.created",         type: "vendor", eid: V[0], daysAgo: 6,  h: 0, ip: "103.21.58.12", meta: { vendorName: vendorRows[0]?.name, category: "Cloud Infrastructure" } },
  { action: "vendor.updated",         type: "vendor", eid: V[1], daysAgo: 6,  h: 2, ip: "103.21.58.12", meta: { vendorName: vendorRows[1]?.name, field: "riskLevel", from: "medium", to: "high" } },
  { action: "vendor.risk_updated",    type: "vendor", eid: V[2], daysAgo: 7,  h: 1, ip: "103.21.58.12", meta: { vendorName: vendorRows[2]?.name, riskLevel: "critical" } },
  { action: "vendor.created",         type: "vendor", eid: V[3], daysAgo: 8,  h: 3, ip: "103.21.58.12", meta: { vendorName: vendorRows[3]?.name, category: "SaaS" } },
  { action: "vendor.updated",         type: "vendor", eid: V[4], daysAgo: 10, h: 0, ip: "103.21.58.12", meta: { vendorName: vendorRows[4]?.name, field: "status", from: "pending", to: "active" } },

  // Assessment events
  ...(A[0] ? [{ action: "assessment.completed",    type: "assessment", eid: A[0], daysAgo: 9,  h: 4,  ip: "103.21.58.12", meta: { score: 96, vendorName: vendorRows[0]?.name } }] : []),
  ...(A[1] ? [{ action: "assessment.completed",    type: "assessment", eid: A[1], daysAgo: 11, h: 2,  ip: "103.21.58.12", meta: { score: 84, vendorName: vendorRows[4]?.name } }] : []),
  ...(A[2] ? [{ action: "assessment.created",      type: "assessment", eid: A[2], daysAgo: 12, h: 1,  ip: "103.21.58.12", meta: { vendorName: vendorRows[2]?.name } }] : []),

  // Compliance events
  ...(F[0] ? [{ action: "compliance.framework_updated", type: "framework", eid: F[0], daysAgo: 13, h: 0, ip: "103.21.58.12", meta: { name: "ISO 27001", status: "in_progress" } }] : []),
  ...(F[1] ? [{ action: "compliance.evidence_added",    type: "framework", eid: F[1], daysAgo: 14, h: 3, ip: "103.21.58.12", meta: { evidenceTitle: "SOC 2 Type II Report" } }] : []),
  ...(F[0] ? [{ action: "compliance.gap_resolved",      type: "framework", eid: F[0], daysAgo: 15, h: 5, ip: "103.21.58.12", meta: { gapType: "missing_evidence", control: "A.8.1" } }] : []),

  // Settings events
  { action: "organization.updated",   type: "organization", eid: ORG, daysAgo: 16, h: 0,  ip: "103.21.58.12", meta: { field: "legal_name" } },
  { action: "team.member_invited",    type: "membership",   eid: ORG, daysAgo: 17, h: 2,  ip: "103.21.58.12", meta: { invitedEmail: "compliance@admincorp.in", role: "compliance_manager" } },
  { action: "security.password_changed", type: "profile",  eid: USER, daysAgo: 20, h: 1,  ip: "103.21.58.12", meta: {} },
  { action: "api_key.created",        type: "api_key",      eid: ORG, daysAgo: 22, h: 3,  ip: "103.21.58.12", meta: { name: "CI/CD Pipeline Key", permissions: "read_only" } },
  { action: "integration.connected",  type: "integration",  eid: ORG, daysAgo: 25, h: 0,  ip: "103.21.58.12", meta: { provider: "slack" } },
  { action: "organization.updated",   type: "organization", eid: ORG, daysAgo: 28, h: 4,  ip: "103.21.58.12", meta: { field: "industry" } },
];

let inserted = 0;
for (const e of events) {
  if (!e.eid) continue;
  await sql`
    INSERT INTO audit_logs
      (organization_id, actor_id, action, entity_type, entity_id,
       ip_address, metadata, created_at)
    VALUES (
      ${ORG}, ${USER}, ${e.action}, ${e.type}, ${e.eid}::uuid,
      ${e.ip}, ${sql.json(e.meta)},
      ${ago(e.daysAgo, e.h)}::timestamptz
    )`;
  inserted++;
}
console.log(`  ✓ ${inserted} audit log entries seeded`);

// ── Summary ────────────────────────────────────────────────────────────────
const [{ n: totalDocs }]   = await sql`SELECT count(*)::int n FROM vendor_documents WHERE organization_id=${ORG}`;
const [{ n: docsWithSize }]= await sql`SELECT count(*)::int n FROM vendor_documents WHERE organization_id=${ORG} AND file_size IS NOT NULL`;
const [{ n: auditTotal }]  = await sql`SELECT count(*)::int n FROM audit_logs WHERE organization_id=${ORG}`;
const [{ n: loginTotal }]  = await sql`SELECT count(*)::int n FROM login_history WHERE organization_id=${ORG}`;
const [hasBranding]        = await sql`SELECT 1 FROM organization_settings WHERE organization_id=${ORG} LIMIT 1`;

console.log("\n── Summary ───────────────────────────────────────────────");
console.log(`  vendor_documents:    ${docsWithSize}/${totalDocs} have file_size`);
console.log(`  audit_logs:         ${auditTotal} total`);
console.log(`  login_history:      ${loginTotal} entries`);
console.log(`  org settings:       ${hasBranding ? "✓ seeded" : "✗ missing"}`);
console.log("──────────────────────────────────────────────────────────");

await sql.end();
