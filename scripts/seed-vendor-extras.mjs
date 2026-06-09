/**
 * seed-vendor-extras.mjs — Additional vendor coverage for test completeness
 *
 * Fills gaps in the existing vendor seed data:
 *
 *   1. Security assessments for the 11 vendors that don't have them yet
 *      (seed-demo.mjs seeds 4; this adds the remaining 11)
 *   2. Vendor reviews for all active vendors (ensures every vendor has at
 *      least one review, with varied review types and dates)
 *   3. Document requests in all states:
 *      requested / submitted / approved / rejected / expired
 *
 * Together with seed-demo.mjs, every vendor will have:
 *   - ≥1 security assessment with responses
 *   - ≥1 vendor review
 *   - Varied document request states for workflow testing
 *
 * Idempotent — safe to re-run (skips by vendor_id).
 *
 * Prerequisites: seed-demo.mjs
 *
 * Usage: node scripts/seed-vendor-extras.mjs [orgId]
 */

import postgres from "postgres";
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

const log  = (msg) => console.log(`  ${msg}`);
const head = (msg) => console.log(`  ${msg}`);
const sect = (msg) => console.log(`\n▶ ${msg}`);

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

// ── Org lookup ────────────────────────────────────────────────────────────────
const targetId = process.argv[2] ?? null;
const orgs = targetId
  ? await sql`select id, name from organizations where id = ${targetId}`
  : await sql`select id, name from organizations where name = 'admin corp' order by created_at limit 1`;

if (!orgs.length) {
  console.error("No org found. Run seed-demo.mjs first.");
  await sql.end(); process.exit(1);
}
const { id: orgId, name: orgName } = orgs[0];
const [owner] = await sql`
  select user_id from memberships where organization_id = ${orgId} and role = 'owner' limit 1`;
const ownerId = owner?.user_id ?? null;
log(`Org: ${orgName} (${orgId})`);

// ── Vendor list ───────────────────────────────────────────────────────────────
const vendors = await sql`
  select id, name, risk_level, compliance_score, status
  from vendors where organization_id = ${orgId}
  order by name`;

if (!vendors.length) {
  console.error("No vendors found. Run seed-demo.mjs first.");
  await sql.end(); process.exit(1);
}

log(`Found ${vendors.length} vendors`);

// ── Question IDs (17 standard assessment questions) ───────────────────────────
// These are the question IDs from lib/constants/assessment-questions.ts
// The calculateScore() function uses these IDs to look up weights
const Q_IDS = ["q1","q2","q3","q4","q5","q6","q7","q8","q9","q10","q11","q12","q13","q14","q15","q16","q17"];

// Response distribution by risk level
const responsesFor = (riskLevel) => {
  if (riskLevel === "low") {
    // Mostly yes, some partial
    return Q_IDS.map((q, i) => ({
      questionId: q,
      response: i < 13 ? "yes" : i < 16 ? "partial" : "yes",
    }));
  }
  if (riskLevel === "medium") {
    return Q_IDS.map((q, i) => ({
      questionId: q,
      response: i < 8 ? "yes" : i < 13 ? "partial" : i < 15 ? "no" : "yes",
    }));
  }
  if (riskLevel === "high") {
    return Q_IDS.map((q, i) => ({
      questionId: q,
      response: i < 5 ? "yes" : i < 10 ? "partial" : i < 15 ? "no" : "partial",
    }));
  }
  // critical
  return Q_IDS.map((q, i) => ({
    questionId: q,
    response: i < 3 ? "yes" : i < 7 ? "partial" : "no",
  }));
};

const scoreFor = (riskLevel) => {
  if (riskLevel === "low")    return Math.floor(78 + Math.random() * 15);   // 78-93
  if (riskLevel === "medium") return Math.floor(52 + Math.random() * 20);   // 52-72
  if (riskLevel === "high")   return Math.floor(28 + Math.random() * 22);   // 28-50
  return Math.floor(10 + Math.random() * 20);  // critical: 10-30
};

// ── 1. Security Assessments for remaining vendors ─────────────────────────────
sect("Seeding Security Assessments");

let assessmentsAdded = 0;

for (const vendor of vendors) {
  // Check if assessment already exists
  const existing = await sql`
    select id from assessments where vendor_id = ${vendor.id} limit 1`;
  if (existing.length) {
    log(`skip assessment: ${vendor.name} (already has one)`);
    continue;
  }

  const score = scoreFor(vendor.risk_level ?? "medium");
  const assessmentDate = daysAgo(Math.floor(30 + Math.random() * 200)); // 30-230 days ago

  const [assessment] = await sql`
    insert into assessments (
      id, organization_id, vendor_id, assessor_id,
      assessment_date, score, status, created_at, updated_at
    ) values (
      ${randomUUID()}, ${orgId}, ${vendor.id}, ${ownerId},
      ${assessmentDate}, ${score}, 'completed', now(), now()
    ) returning id`;

  // Insert all 17 responses
  const responses = responsesFor(vendor.risk_level ?? "medium");
  for (const r of responses) {
    await sql`
      insert into assessment_responses (
        id, assessment_id, question_id, response, created_at
      ) values (
        ${randomUUID()}, ${assessment.id}, ${r.questionId}, ${r.response}, now()
      ) on conflict do nothing`;
  }

  log(`assessment added: ${vendor.name} — score=${score}, risk=${vendor.risk_level}`);
  assessmentsAdded++;
}

log(`\n  Assessments added: ${assessmentsAdded}`);

// ── 2. Vendor Reviews for all vendors ─────────────────────────────────────────
sect("Seeding Vendor Reviews");

const REVIEW_TYPES = ["annual", "quarterly", "security", "compliance"];
const REVIEW_NOTES = [
  "Annual governance review completed. Vendor documents validated, risk posture assessed. No material changes to vendor risk profile.",
  "Quarterly check-in — confirmed active SLAs, reviewed recent incidents. Vendor performance satisfactory.",
  "Security posture review: ISO certification confirmed valid. Penetration test results reviewed. No new critical vulnerabilities.",
  "Compliance review: DPA clauses verified, DPDP consent flows audited. Minor updates required to data processing addendum.",
  "Routine review — vendor relationship healthy. Renewal recommended with updated indemnity clauses.",
  "Vendor security posture improved since last review. New ISO 27001 cert obtained. Trust Score updated.",
];

let reviewsAdded = 0;

for (let i = 0; i < vendors.length; i++) {
  const vendor = vendors[i];

  // Check if review exists
  const existing = await sql`
    select id from vendor_reviews where vendor_id = ${vendor.id} limit 1`;
  if (existing.length) {
    log(`skip review: ${vendor.name} (already has one)`);
    continue;
  }

  const reviewType = REVIEW_TYPES[i % REVIEW_TYPES.length];
  const reviewDate = daysAgo(Math.floor(20 + Math.random() * 120));
  const notes      = REVIEW_NOTES[i % REVIEW_NOTES.length];

  await sql`
    insert into vendor_reviews (
      id, organization_id, vendor_id, reviewer_id,
      review_date, review_type, notes, created_at, updated_at
    ) values (
      ${randomUUID()}, ${orgId}, ${vendor.id}, ${ownerId},
      ${reviewDate}, ${reviewType}, ${notes}, now(), now()
    )`;

  log(`review added: ${vendor.name} — ${reviewType} (${reviewDate})`);
  reviewsAdded++;
}

log(`\n  Reviews added: ${reviewsAdded}`);

// ── 3. Document Requests in all states ────────────────────────────────────────
sect("Seeding Document Requests (all states)");

// Pick 5 vendors to get document requests in each of the 5 states
// States: requested / submitted / approved / rejected / expired
const docRequestDefs = [
  {
    vendorKeyword: "Apollo",
    docType: "Data Processing Agreement (DPA)",
    status: "requested",
    notes: "Urgent — DPDP compliance requires DPA before data processing can continue.",
    requestedDaysAgo: 5,
  },
  {
    vendorKeyword: "Yotta",
    docType: "ISO/IEC 27001 Certificate",
    status: "submitted",
    notes: "ISO 27001 certificate required to maintain active vendor status.",
    requestedDaysAgo: 14,
  },
  {
    vendorKeyword: "Quess",
    docType: "Professional Indemnity Insurance Certificate",
    status: "approved",
    notes: "Professional indemnity policy updated — new certificate approved by procurement team.",
    requestedDaysAgo: 30,
    reviewedDaysAgo: 25,
  },
  {
    vendorKeyword: "Birlasoft",
    docType: "SOC 2 Type II Report",
    status: "rejected",
    notes: "SOC 2 report submitted was for 2023 period — requires current year report (2025 or 2026). Resubmission requested.",
    requestedDaysAgo: 45,
    reviewedDaysAgo: 40,
  },
  {
    vendorKeyword: "Infosys",
    docType: "Cyber Liability Insurance Certificate",
    status: "expired",
    notes: "Request expired without response after 30-day window. Escalated to vendor account manager.",
    requestedDaysAgo: 50,
    expiredDaysAgo: 20,
  },
];

let requestsAdded = 0;

for (const def of docRequestDefs) {
  // Find vendor by keyword
  const matchedVendor = vendors.find(v =>
    v.name.toLowerCase().includes(def.vendorKeyword.toLowerCase()));
  if (!matchedVendor) { log(`skip — vendor not found: ${def.vendorKeyword}`); continue; }

  // Check if a request for this doc type already exists
  const existing = await sql`
    select id from document_requests
    where vendor_id = ${matchedVendor.id}
      and document_type = ${def.docType}
    limit 1`;
  if (existing.length) {
    log(`skip request: ${matchedVendor.name} / ${def.docType} (already exists)`);
    continue;
  }

  const requestedAt = new Date();
  requestedAt.setDate(requestedAt.getDate() - def.requestedDaysAgo);

  const dueDate = new Date(requestedAt);
  dueDate.setDate(dueDate.getDate() + 30);

  let reviewedAt  = null;
  let reviewedBy  = null;
  let submittedAt = null;
  let expiresAt   = null;

  if (def.reviewedDaysAgo) {
    const rd = new Date();
    rd.setDate(rd.getDate() - def.reviewedDaysAgo);
    reviewedAt = rd.toISOString();
    reviewedBy = ownerId;
  }
  if (def.status === "submitted" || def.status === "approved" || def.status === "rejected") {
    const sd = new Date(requestedAt);
    sd.setDate(sd.getDate() + 3);
    submittedAt = sd.toISOString();
  }
  if (def.status === "expired") {
    const ed = new Date();
    ed.setDate(ed.getDate() - def.expiredDaysAgo);
    expiresAt = ed.toISOString();
  }

  await sql`
    insert into document_requests (
      id, organization_id, vendor_id, document_type,
      requested_by, requested_at, due_date, status, notes,
      submitted_at, reviewed_by, reviewed_at, expires_at,
      created_at, updated_at
    ) values (
      ${randomUUID()}, ${orgId}, ${matchedVendor.id}, ${def.docType},
      ${ownerId}, ${requestedAt.toISOString()}, ${dueDate.toISOString().slice(0, 10)},
      ${def.status}, ${def.notes},
      ${submittedAt}, ${reviewedBy}, ${reviewedAt}, ${expiresAt},
      now(), now()
    )`;

  log(`request added: ${matchedVendor.name} — ${def.docType} [${def.status}]`);
  requestsAdded++;
}

log(`\n  Document requests added: ${requestsAdded}`);

// ── Summary ───────────────────────────────────────────────────────────────────
const [counts] = await sql`
  select
    (select count(*)::int from assessments where organization_id = ${orgId}) as assessments,
    (select count(*)::int from vendor_reviews where organization_id = ${orgId}) as reviews,
    (select count(*)::int from document_requests where organization_id = ${orgId}) as requests`;

console.log(`\n✅ Done — ${orgName}`);
console.log(`   Assessments: ${counts.assessments} | Reviews: ${counts.reviews} | Doc requests: ${counts.requests}`);
console.log(`   Doc request states covered: requested · submitted · approved · rejected · expired`);

await sql.end();
