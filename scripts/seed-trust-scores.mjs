/**
 * AUDT — Trust Score™ seed script.
 *
 * Computes and stores Trust Score™ for all active vendors via the raw
 * scoring logic (mirrors lib/services/trust-score.ts) directly in SQL
 * to avoid importing TS modules.
 *
 * Idempotent — safe to re-run; overwrites existing scores.
 *
 * Prerequisites:
 *   1. node scripts/seed-demo.mjs               (vendors + docs)
 *   2. Migration 0010_trust_score.sql applied
 *
 * Usage: node scripts/seed-trust-scores.mjs
 *        node scripts/seed-trust-scores.mjs <orgId>
 */

import postgres from "postgres";
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

const log  = (msg) => console.log(`  ${msg}`);
const head = (msg) => console.log(`\n▶ ${msg}`);

// ── Pure scoring functions (mirrors trust-score.ts) ────────────────────────

function evidenceScore({ docsTotal, docsValid, docsExpiring, docsExpired, requiredDocsMissing }) {
  if (docsTotal === 0) return 25;
  let score = 100;
  score -= requiredDocsMissing * 15;
  score -= docsExpired * 10;
  score -= docsExpiring * 5;
  score += Math.min(docsValid * 2, 10);
  return Math.max(0, Math.min(100, Math.round(score)));
}

const INACTIVE = new Set(["closed", "archived", "accepted", "transferred"]);

function riskScore(linkedRisks) {
  if (linkedRisks.length === 0) return 100;
  const active = linkedRisks.filter((r) => !INACTIVE.has(r.status));
  if (active.length === 0) return 95;
  const critical = active.filter((r) => r.inherentScore >= 20);
  const high = active.filter((r) => r.inherentScore >= 12 && r.inherentScore < 20);
  const medium = active.filter((r) => r.inherentScore < 12);
  let score = 100;
  score -= Math.min(critical.length * 25, 60);
  score -= Math.min(high.length * 12, 30);
  score -= Math.min(medium.length * 5, 20);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function assessmentScore(latestScore) {
  if (latestScore === null || latestScore === undefined) return 30;
  return latestScore;
}

function operationalScore({ totalReviews, reviewsLast12Months, totalRequests, openRequests }) {
  let score = 100;
  if (totalReviews === 0) score -= 35;
  else if (reviewsLast12Months === 0) score -= 20;
  if (totalRequests > 0 && openRequests > 0) {
    score -= Math.round((openRequests / totalRequests) * 25);
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function freshnessScore({ lastReviewDate, lastAssessmentDate }) {
  const now = Date.now();
  let score = 100;
  if (!lastReviewDate) {
    score -= 45;
  } else {
    const days = (now - new Date(lastReviewDate).getTime()) / 86400000;
    if (days > 365) score -= 45;
    else if (days > 180) score -= 25;
    else if (days > 90) score -= 10;
  }
  if (!lastAssessmentDate) {
    score -= 25;
  } else {
    const days = (now - new Date(lastAssessmentDate).getTime()) / 86400000;
    if (days > 365) score -= 25;
    else if (days > 180) score -= 12;
  }
  return Math.max(0, Math.min(100, Math.round(score)));
}

function computeTrust(inputs) {
  const ev = evidenceScore(inputs);
  const co = Math.max(0, Math.min(100, inputs.complianceScore));
  const ri = riskScore(inputs.linkedRisks);
  const as = assessmentScore(inputs.latestAssessmentScore);
  const op = operationalScore(inputs);
  const fr = freshnessScore(inputs);
  const overall = Math.round(ev * 0.25 + co * 0.20 + ri * 0.20 + as * 0.15 + op * 0.10 + fr * 0.10);
  return { overall, evidence: ev, compliance: co, risk: ri, assessment: as, operational: op, freshness: fr };
}

// ── Main ────────────────────────────────────────────────────────────────────

const targetOrgId = process.argv[2] ?? null;
const orgs = targetOrgId
  ? await sql`SELECT id, name FROM organizations WHERE id = ${targetOrgId}`
  : await sql`SELECT id, name FROM organizations ORDER BY created_at`;

if (orgs.length === 0) {
  console.error("No organisations found.");
  process.exit(1);
}

let totalScored = 0;

for (const org of orgs) {
  head(`Org: ${org.name} (${org.id})`);

  const vendors = await sql`
    SELECT id, name, compliance_score, vendor_type_id
    FROM vendors
    WHERE organization_id = ${org.id} AND status = 'active'
    ORDER BY created_at`;

  log(`${vendors.length} active vendor(s)`);

  for (const vendor of vendors) {
    // Docs
    const docs = await sql`
      SELECT status FROM vendor_documents
      WHERE organization_id = ${org.id} AND vendor_id = ${vendor.id}`;
    const docStats = {
      docsTotal: docs.length,
      docsValid: docs.filter((d) => d.status === "valid").length,
      docsExpiring: docs.filter((d) => d.status === "expiring").length,
      docsExpired: docs.filter((d) => d.status === "expired").length,
    };

    // Required docs missing
    let requiredDocsMissing = 0;
    if (vendor.vendor_type_id) {
      const [required, uploaded] = await Promise.all([
        sql`SELECT document_type FROM vendor_type_documents WHERE vendor_type_id = ${vendor.vendor_type_id} AND is_required = true`,
        sql`SELECT LOWER(document_type) AS dt FROM vendor_documents WHERE vendor_id = ${vendor.id} AND status != 'expired'`,
      ]);
      const uploadedTypes = new Set(uploaded.map((u) => u.dt));
      requiredDocsMissing = required.filter((r) => !uploadedTypes.has(r.document_type.toLowerCase())).length;
    }

    // Latest assessment
    const [latestAssessment] = await sql`
      SELECT score, created_at FROM assessments
      WHERE organization_id = ${org.id} AND vendor_id = ${vendor.id} AND status = 'completed' AND score IS NOT NULL
      ORDER BY created_at DESC LIMIT 1`;

    // Reviews
    const reviews = await sql`
      SELECT created_at FROM vendor_reviews
      WHERE organization_id = ${org.id} AND vendor_id = ${vendor.id}
      ORDER BY created_at DESC`;
    const cutoff = new Date(Date.now() - 365 * 86400000);
    const reviewsLast12 = reviews.filter((r) => new Date(r.created_at) >= cutoff).length;

    // Requests
    const requests = await sql`
      SELECT status FROM document_requests
      WHERE organization_id = ${org.id} AND vendor_id = ${vendor.id}`;

    // Linked risks
    const linkedRisks = await sql`
      SELECT r.status, r.inherent_score
      FROM risks r
      JOIN risk_vendors rv ON rv.risk_id = r.id
      WHERE rv.vendor_id = ${vendor.id}`;

    const inputs = {
      ...docStats,
      requiredDocsMissing,
      complianceScore: vendor.compliance_score,
      linkedRisks: linkedRisks.map((r) => ({ status: r.status, inherentScore: r.inherent_score })),
      latestAssessmentScore: latestAssessment?.score ?? null,
      latestAssessmentDate: latestAssessment?.created_at ?? null,
      totalReviews: reviews.length,
      reviewsLast12Months: reviewsLast12,
      totalRequests: requests.length,
      openRequests: requests.filter((r) => r.status === "requested").length,
      lastReviewDate: reviews[0]?.created_at ?? null,
    };

    const scores = computeTrust(inputs);

    // Upsert history + update vendor
    await sql`
      INSERT INTO vendor_trust_history (
        id, organization_id, vendor_id,
        overall_score, evidence_score, compliance_score, risk_score,
        assessment_score, operational_score, freshness_score, trigger_event
      ) VALUES (
        ${randomUUID()}, ${org.id}, ${vendor.id},
        ${scores.overall}, ${scores.evidence}, ${scores.compliance}, ${scores.risk},
        ${scores.assessment}, ${scores.operational}, ${scores.freshness}, ${"seed"}
      )`;

    await sql`
      UPDATE vendors SET
        trust_score = ${scores.overall},
        trust_score_at = now(),
        updated_at = now()
      WHERE id = ${vendor.id}`;

    log(`  ✓ ${vendor.name}: ${scores.overall}/100`);
    totalScored++;
  }
}

head(`Done — ${totalScored} vendor(s) scored`);
await sql.end();
