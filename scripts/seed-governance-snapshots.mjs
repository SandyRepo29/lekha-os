/**
 * seed-governance-snapshots.mjs — Trust Intelligence™ governance trend data
 *
 * Seeds 14 daily governance snapshots going back 14 days with a realistic
 * upward trend trajectory. Required for trend chart visualisation in
 * Trust Intelligence™ Executive View and governance timeline.
 *
 * Score progression reflects:
 *   - Control Health rising as test records are added (seed-control-tests)
 *   - Audit Readiness improving as audits complete (seed-audits)
 *   - Risk Posture improving as risks are mitigated (seed-risk-lens)
 *
 * Idempotent — safe to re-run (ON CONFLICT DO UPDATE on org + date).
 *
 * Prerequisites: All module seeds (demo, compliance, risk-lens, trust-scores, control-tests, audits)
 *
 * Usage: node scripts/seed-governance-snapshots.mjs [orgId]
 */

import postgres from "postgres";
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

const log  = (msg) => console.log(`  ${msg}`);
const head = (msg) => console.log(`\n▶ ${msg}`);

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
log(`Org: ${orgName} (${orgId})`);

// ── Live context counts ────────────────────────────────────────────────────────
// Pull current state to use for count fields in snapshots
const [ctx] = await sql`
  select
    (select count(*)::int from vendors where organization_id = ${orgId} and status = 'active') as total_vendors,
    (select count(*)::int from vendors where organization_id = ${orgId} and trust_score is not null) as scored_vendors,
    (select count(*)::int from risks where organization_id = ${orgId} and status not in ('closed','archived')) as active_risks,
    (select count(*)::int from risks where organization_id = ${orgId} and status = 'open'
       and (inherent_score >= 16 or residual_score >= 16)) as critical_risks,
    (select count(*)::int from audit_findings where organization_id = ${orgId} and finding_status = 'open') as open_findings,
    (select round(avg(c.health_score))::int from controls c join frameworks f on f.id = c.framework_id
       where f.organization_id = ${orgId} and c.health_score is not null) as avg_control_health,
    (select round(avg(overall_score))::int from readiness_scores where organization_id = ${orgId}) as avg_framework_readiness`;

const totalVendors    = ctx.total_vendors    ?? 15;
const scoredVendors   = ctx.scored_vendors   ?? 15;
const activeRisks     = ctx.active_risks     ?? 18;
const criticalRisks   = ctx.critical_risks   ?? 2;
const openFindings    = ctx.open_findings    ?? 0;
const avgCtrlHealth   = ctx.avg_control_health    ?? 48;
const avgFwReadiness  = ctx.avg_framework_readiness ?? 53;

log(`Live counts: vendors=${totalVendors}, risks=${activeRisks}, critical=${criticalRisks}, findings=${openFindings}`);

// ── Snapshot trajectory ───────────────────────────────────────────────────────
// 14 daily snapshots going back 14 days — showing a gradually improving posture
// Day 14 → Day 1 (yesterday). Today's score is live-computed by the platform.
//
// The trajectory shows:
//   • Control Health rising as test records are added
//   • Audit Readiness improving after completed audits
//   • Risk Posture stable with slight improvement
//   • Vendor Trust and Compliance Coverage mostly stable

head("Generating 14-day governance snapshot trajectory");

const snapshotDays = [
  // daysBack, orgTrust, vendorTrust, riskPosture, ctrlHealth, auditReadiness, complianceCoverage
  { d: 14, ot: 49, vt: 62, rp: 46, ch: 28, ar: 42, cc: 50 },
  { d: 13, ot: 50, vt: 62, rp: 47, ch: 30, ar: 42, cc: 50 },
  { d: 12, ot: 51, vt: 63, rp: 47, ch: 32, ar: 44, cc: 51 },
  { d: 11, ot: 52, vt: 63, rp: 48, ch: 34, ar: 44, cc: 51 },
  { d: 10, ot: 53, vt: 64, rp: 48, ch: 37, ar: 46, cc: 52 },
  { d:  9, ot: 54, vt: 64, rp: 49, ch: 40, ar: 47, cc: 52 },
  { d:  8, ot: 55, vt: 65, rp: 50, ch: 42, ar: 48, cc: 52 },
  { d:  7, ot: 56, vt: 65, rp: 50, ch: 44, ar: 49, cc: 53 },
  { d:  6, ot: 57, vt: 66, rp: 51, ch: 46, ar: 50, cc: 53 },
  { d:  5, ot: 58, vt: 66, rp: 52, ch: 48, ar: 51, cc: 54 },
  { d:  4, ot: 59, vt: 67, rp: 52, ch: 50, ar: 52, cc: 54 },
  { d:  3, ot: 60, vt: 67, rp: 53, ch: 52, ar: 53, cc: 55 },
  { d:  2, ot: 61, vt: 68, rp: 53, ch: 54, ar: 54, cc: 55 },
  { d:  1, ot: 62, vt: 68, rp: 54, ch: 56, ar: 55, cc: 56 },
];

let upserted = 0;

for (const s of snapshotDays) {
  const snapshotDate = new Date();
  snapshotDate.setDate(snapshotDate.getDate() - s.d);
  const dateStr = snapshotDate.toISOString().slice(0, 10);

  // Slightly vary the count fields to simulate real-world changes
  const dayFindings = Math.max(0, openFindings + Math.floor((s.d - 7) * 0.5));
  const dayRisks    = activeRisks + (s.d > 7 ? 2 : 0); // 2 more active risks further back

  await sql`
    insert into governance_snapshots (
      id, organization_id, snapshot_date,
      org_trust_score, vendor_trust_score, risk_posture_score,
      control_health_score, audit_readiness_score, compliance_coverage_score,
      total_vendors, scored_vendors, active_risks, critical_risks,
      open_findings, avg_control_health, avg_framework_readiness,
      created_at
    ) values (
      ${randomUUID()}, ${orgId}, ${dateStr},
      ${s.ot}, ${s.vt}, ${s.rp},
      ${s.ch}, ${s.ar}, ${s.cc},
      ${totalVendors}, ${scoredVendors}, ${dayRisks}, ${criticalRisks},
      ${dayFindings}, ${s.ch}, ${s.cc},
      ${snapshotDate.toISOString()}
    )
    on conflict (organization_id, snapshot_date) do update set
      org_trust_score           = excluded.org_trust_score,
      vendor_trust_score        = excluded.vendor_trust_score,
      risk_posture_score        = excluded.risk_posture_score,
      control_health_score      = excluded.control_health_score,
      audit_readiness_score     = excluded.audit_readiness_score,
      compliance_coverage_score = excluded.compliance_coverage_score,
      total_vendors             = excluded.total_vendors,
      scored_vendors            = excluded.scored_vendors,
      active_risks              = excluded.active_risks,
      critical_risks            = excluded.critical_risks,
      open_findings             = excluded.open_findings,
      avg_control_health        = excluded.avg_control_health,
      avg_framework_readiness   = excluded.avg_framework_readiness`;

  log(`${dateStr}: org_trust=${s.ot} (vendor=${s.vt}, risk=${s.rp}, ctrl=${s.ch}, audit=${s.ar}, compliance=${s.cc})`);
  upserted++;
}

// ── Summary ───────────────────────────────────────────────────────────────────
const [counts] = await sql`
  select
    count(*)::int                             as total,
    min(org_trust_score)::int                 as min_score,
    max(org_trust_score)::int                 as max_score,
    min(snapshot_date)::text                  as earliest,
    max(snapshot_date)::text                  as latest
  from governance_snapshots
  where organization_id = ${orgId}`;

console.log(`\n✅ Done — ${orgName}`);
console.log(`   Snapshots: ${counts.total} (${counts.earliest} → ${counts.latest})`);
console.log(`   Org Trust Score range: ${counts.min_score} → ${counts.max_score} (upward trend)`);
console.log(`   Visit /trust-intelligence/executive to see the Governance Timeline`);

await sql.end();
