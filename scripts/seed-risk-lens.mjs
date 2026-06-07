/**
 * AUDT — Risk Lens™ demo seed script.
 *
 * Seeds 20 realistic risks across all categories with treatments,
 * reviews, and relationships (linked to vendors/findings/controls).
 *
 * Idempotent — safe to re-run; skips existing risks by title.
 *
 * Prerequisites:
 *   1. node scripts/seed-demo.mjs           (vendors)
 *   2. node scripts/seed-compliance-demo.mjs (frameworks, controls)
 *   3. Migration 0009_risk_lens.sql applied
 *
 * Usage: node scripts/seed-risk-lens.mjs
 *        node scripts/seed-risk-lens.mjs <orgId>
 */

import postgres from "postgres";
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

const log  = (msg) => console.log(`  ${msg}`);
const head = (msg) => console.log(`\n▶ ${msg}`);

// ── Target org ─────────────────────────────────────────────────────────────
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

console.log(`\n🌱 Risk Lens™ seed for: ${orgName} (${orgId})\n`);

// ── Look up related entities ───────────────────────────────────────────────
const vendors = await sql`
  select id, name from vendors where organization_id = ${orgId} order by name`;
const vByName = Object.fromEntries(vendors.map(v => [v.name, v.id]));

const frameworks = await sql`
  select id, name from frameworks where organization_id = ${orgId}`;
const fByName = Object.fromEntries(frameworks.map(f => [f.name, f.id]));

const findings = await sql`
  select af.id, af.title, af.finding_severity as severity
  from audit_findings af
  join audits a on a.id = af.audit_id
  where a.organization_id = ${orgId}
  limit 10`;

const controls = await sql`
  select c.id, c.control_ref, c.name, fw.name as fw_name
  from controls c
  join frameworks fw on fw.id = c.framework_id
  where fw.organization_id = ${orgId}
  order by c.control_ref
  limit 30`;

// ── 1. Risks ───────────────────────────────────────────────────────────────
head("1. Risks");

const RISKS = [
  // ── Operational ──────────────────────────────────────────────────────────
  {
    title: "Third-Party Vendor Data Breach",
    description: "A critical vendor (payment processor / cloud provider) suffers a data breach exposing our customer and employee data. DPDP obligations triggered.",
    category: "operational", status: "open", source: "manual",
    impact: 5, likelihood: 3,
    treatmentStrategy: "mitigate",
    owner: "priya.sharma@acme.in",
    targetDate: "2026-09-30", nextReviewDate: "2026-07-15",
    linkedVendors: ["Razorpay Software Pvt Ltd", "Freshworks Inc"],
  },
  {
    title: "Business Continuity Failure — Cloud Outage",
    description: "Extended outage of primary cloud infrastructure (AWS Mumbai / Yotta) disrupts business operations beyond RTO. BCP not exercised in 18 months.",
    category: "operational", status: "mitigating", source: "manual",
    impact: 5, likelihood: 2,
    treatmentStrategy: "mitigate",
    owner: "sanjay.mehta@acme.in",
    targetDate: "2026-08-31", nextReviewDate: "2026-07-01",
    linkedVendors: ["Yotta Data Services Pvt Ltd"],
  },
  {
    title: "Key Person Dependency — IT Operations",
    description: "Critical system knowledge concentrated in one or two individuals. Unexpected departure would cause significant operational disruption.",
    category: "operational", status: "open", source: "manual",
    impact: 3, likelihood: 3,
    treatmentStrategy: "mitigate",
    owner: "anita.joshi@acme.in",
    targetDate: "2026-10-31", nextReviewDate: "2026-08-01",
  },
  {
    title: "Payroll Processing Error — HR SaaS Platform",
    description: "Bug or configuration error in Keka/GreytHR results in incorrect salary disbursements, causing employee trust and regulatory issues.",
    category: "operational", status: "open", source: "manual",
    impact: 4, likelihood: 2,
    treatmentStrategy: "mitigate",
    owner: "meena.rajan@acme.in",
    targetDate: "2026-09-30", nextReviewDate: "2026-07-30",
    linkedVendors: ["Keka Technologies Pvt Ltd", "Greytip Software Pvt Ltd"],
  },

  // ── Cyber ─────────────────────────────────────────────────────────────────
  {
    title: "Ransomware Attack on Production Systems",
    description: "Ransomware encrypts production databases and backup systems causing extended downtime and potential data loss. Risk elevated by lack of immutable backups.",
    category: "cyber_security", status: "mitigating", source: "manual",
    impact: 5, likelihood: 3,
    treatmentStrategy: "mitigate",
    owner: "anita.joshi@acme.in",
    targetDate: "2026-07-31", nextReviewDate: "2026-07-01",
  },
  {
    title: "Phishing and Social Engineering Attacks",
    description: "Employees targeted by sophisticated phishing campaigns leading to credential theft and account compromise. Elevated risk with hybrid work model.",
    category: "cyber_security", status: "open", source: "manual",
    impact: 4, likelihood: 4,
    treatmentStrategy: "mitigate",
    owner: "anita.joshi@acme.in",
    targetDate: "2026-08-31", nextReviewDate: "2026-07-15",
  },
  {
    title: "Privileged Access Misuse",
    description: "Admin or privileged users (internal or vendor) misuse elevated access rights to exfiltrate data or tamper with systems.",
    category: "cyber_security", status: "open", source: "manual",
    impact: 5, likelihood: 2,
    treatmentStrategy: "mitigate",
    owner: "anita.joshi@acme.in",
    targetDate: "2026-09-30", nextReviewDate: "2026-07-30",
  },
  {
    title: "Unpatched Vulnerability Exploited in Production",
    description: "Known CVE in a production system or dependency exploited before patch cycle. Sify's expired ISO 27001 indicates inadequate patching discipline.",
    category: "cyber_security", status: "open", source: "vendor",
    impact: 4, likelihood: 3,
    treatmentStrategy: "mitigate",
    owner: "anita.joshi@acme.in",
    targetDate: "2026-07-31", nextReviewDate: "2026-07-10",
    linkedVendors: ["Sify Technologies Ltd"],
  },

  // ── Compliance ────────────────────────────────────────────────────────────
  {
    title: "DPDP Act Non-Compliance — Consent Management",
    description: "Failure to obtain and manage valid consent per DPDP Act 2023 for processing personal data. Significant regulatory fine risk.",
    category: "compliance", status: "mitigating", source: "audit_finding",
    impact: 5, likelihood: 3,
    treatmentStrategy: "mitigate",
    owner: "priya.sharma@acme.in",
    targetDate: "2026-08-31", nextReviewDate: "2026-07-20",
  },
  {
    title: "ISO 27001 Certification Lapse",
    description: "ISO 27001 certification expires without renewal, causing contract breaches with enterprise customers requiring certified vendors.",
    category: "compliance", status: "open", source: "manual",
    impact: 4, likelihood: 2,
    treatmentStrategy: "mitigate",
    owner: "anita.joshi@acme.in",
    targetDate: "2026-12-31", nextReviewDate: "2026-09-01",
  },
  {
    title: "Overdue Policy Reviews",
    description: "Multiple policies (Data Retention, Privacy) are overdue for review. Stale policies may not cover new regulatory requirements.",
    category: "compliance", status: "accepted", source: "compliance_gap",
    impact: 3, likelihood: 4,
    treatmentStrategy: "accept",
    owner: "priya.sharma@acme.in",
    targetDate: "2026-09-30", nextReviewDate: "2026-08-01",
  },

  // ── Financial ─────────────────────────────────────────────────────────────
  {
    title: "Vendor Contract Dispute — IT Services",
    description: "Dispute with a critical IT services vendor (TCS / Wipro / Infosys BPM) over SLA breaches leading to litigation and service disruption.",
    category: "financial", status: "open", source: "manual",
    impact: 3, likelihood: 2,
    treatmentStrategy: "transfer",
    owner: "priya.sharma@acme.in",
    targetDate: "2026-12-31", nextReviewDate: "2026-09-01",
    linkedVendors: ["Wipro Limited", "Infosys BPM Ltd"],
  },
  {
    title: "Cost Overrun on Cloud Infrastructure",
    description: "Unconstrained cloud spend leads to significant budget overrun. No FinOps practice or budget alerts configured on AWS / Yotta.",
    category: "financial", status: "open", source: "manual",
    impact: 3, likelihood: 3,
    treatmentStrategy: "mitigate",
    owner: "sanjay.mehta@acme.in",
    targetDate: "2026-09-30", nextReviewDate: "2026-08-01",
    linkedVendors: ["Yotta Data Services Pvt Ltd"],
  },
  {
    title: "Payment Fraud — Gateway Compromise",
    description: "Razorpay integration compromised due to weak webhook validation, enabling fraudulent payment manipulation.",
    category: "financial", status: "mitigating", source: "vendor",
    impact: 5, likelihood: 2,
    treatmentStrategy: "mitigate",
    owner: "priya.sharma@acme.in",
    targetDate: "2026-07-31", nextReviewDate: "2026-07-15",
    linkedVendors: ["Razorpay Software Pvt Ltd"],
  },

  // ── Strategic ─────────────────────────────────────────────────────────────
  {
    title: "Vendor Lock-In — Single Cloud Provider",
    description: "Over-reliance on one cloud provider (Yotta / AWS) creates strategic risk if pricing changes, service quality degrades, or provider exits market.",
    category: "strategic", status: "accepted", source: "manual",
    impact: 3, likelihood: 2,
    treatmentStrategy: "accept",
    owner: "sanjay.mehta@acme.in",
    targetDate: null, nextReviewDate: "2026-12-01",
    linkedVendors: ["Yotta Data Services Pvt Ltd"],
  },
  {
    title: "Regulatory Change — New RBI / SEBI Directive",
    description: "New RBI or SEBI guidelines impose additional compliance requirements on financial data handling, requiring rapid implementation.",
    category: "strategic", status: "open", source: "manual",
    impact: 4, likelihood: 3,
    treatmentStrategy: "mitigate",
    owner: "priya.sharma@acme.in",
    targetDate: "2026-09-30", nextReviewDate: "2026-08-01",
  },

  // ── Reputational ─────────────────────────────────────────────────────────
  {
    title: "Data Breach Public Disclosure",
    description: "Security incident requiring mandatory disclosure under DPDP Act damages brand reputation and triggers customer churn.",
    category: "custom", status: "open", source: "manual",
    impact: 5, likelihood: 2,
    treatmentStrategy: "mitigate",
    owner: "anita.joshi@acme.in",
    targetDate: "2026-09-30", nextReviewDate: "2026-08-01",
  },
  {
    title: "Apollo HealthCo — Employee Health Data Exposure",
    description: "Apollo HealthCo's critically low compliance score (28/100) creates risk of employee health data exposure. No DPA or security certification on file.",
    category: "custom", status: "open", source: "vendor",
    impact: 5, likelihood: 3,
    treatmentStrategy: "mitigate",
    owner: "rahul.nair@acme.in",
    targetDate: "2026-07-31", nextReviewDate: "2026-07-10",
    linkedVendors: ["Apollo HealthCo Ltd"],
  },

  // ── Legal ─────────────────────────────────────────────────────────────────
  {
    title: "Expired Data Processing Agreements",
    description: "DPAs with Freshworks and Darwinbox expiring in <30 days without renewals, creating legal exposure under DPDP Act and GDPR.",
    category: "legal", status: "open", source: "compliance_gap",
    impact: 4, likelihood: 4,
    treatmentStrategy: "mitigate",
    owner: "priya.sharma@acme.in",
    targetDate: "2026-07-15", nextReviewDate: "2026-07-10",
    linkedVendors: ["Freshworks Inc", "Darwinbox Digital Solutions"],
  },
  {
    title: "Employment Law Violation — Staffing Vendor",
    description: "Quess Corp or other staffing vendor violates labour laws (PF, ESI, gratuity), creating joint liability under Principal Employer rules.",
    category: "legal", status: "open", source: "manual",
    impact: 4, likelihood: 2,
    treatmentStrategy: "transfer",
    owner: "meena.rajan@acme.in",
    targetDate: "2026-12-31", nextReviewDate: "2026-10-01",
    linkedVendors: ["Quess Corp Ltd"],
  },
];

head("1. Risks");
const riskIds = {};

for (const r of RISKS) {
  const existing = await sql`
    select id from risks where organization_id = ${orgId} and title = ${r.title} limit 1`;
  if (existing.length) {
    riskIds[r.title] = existing[0].id;
    log(`skip (exists): ${r.title.slice(0, 55)}`);
    continue;
  }

  const inherentScore = r.impact * r.likelihood;
  const residualScore = Math.max(1, Math.round(inherentScore * 0.65));

  // Find owner user id
  const ownerEmail = r.owner;
  let ownerUserId = ownerId;
  if (ownerEmail) {
    const [p] = await sql`
      select m.user_id from memberships m
      join profiles p on p.id = m.user_id
      where m.organization_id = ${orgId}
        and (p.email = ${ownerEmail} or lower(p.full_name) like ${"%" + ownerEmail.split("@")[0].replace(".", "%") + "%"})
      limit 1`;
    if (p) ownerUserId = p.user_id;
  }

  const [row] = await sql`
    insert into risks (
      id, organization_id, title, description, category, status, source,
      impact, likelihood, inherent_score, residual_score,
      treatment_strategy, owner_id, target_date, next_review_date,
      created_by, created_at, updated_at
    ) values (
      ${randomUUID()}, ${orgId}, ${r.title}, ${r.description},
      ${r.category}, ${r.status}, ${r.source},
      ${r.impact}, ${r.likelihood}, ${inherentScore}, ${residualScore},
      ${r.treatmentStrategy}, ${ownerUserId ?? null},
      ${r.targetDate ?? null}, ${r.nextReviewDate ?? null},
      ${ownerId}, now(), now()
    ) returning id`;

  riskIds[r.title] = row.id;
  log(`+ [${r.category}/${r.status}] ${r.title.slice(0, 55)} (${inherentScore}/25)`);
}
log(`\nTotal risks: ${Object.keys(riskIds).length}`);

// ── 2. Risk Treatments ─────────────────────────────────────────────────────
head("2. Risk Treatments");

const TREATMENTS = [
  {
    risk: "Third-Party Vendor Data Breach",
    items: [
      { action: "Implement vendor security scorecard with quarterly re-assessment", targetDate: "2026-08-01", status: "in_progress", progressPercent: 60 },
      { action: "Enforce contractual DPA renewal 90 days before expiry via automated alerts", targetDate: "2026-07-15", status: "completed", progressPercent: 100, completionNotes: "Automated alerts configured in AUDT. DPA renewals tracked in Evidence Vault." },
      { action: "Require ISO 27001 or SOC 2 for all Tier-1 vendors before renewal", targetDate: "2026-09-30", status: "open", progressPercent: 10 },
    ],
  },
  {
    risk: "Ransomware Attack on Production Systems",
    items: [
      { action: "Implement immutable S3-compatible backup with 30-day retention", targetDate: "2026-07-20", status: "in_progress", progressPercent: 75 },
      { action: "Deploy EDR solution across all endpoints and servers", targetDate: "2026-07-31", status: "in_progress", progressPercent: 40 },
      { action: "Conduct tabletop ransomware response exercise with IT and leadership", targetDate: "2026-08-15", status: "open", progressPercent: 0 },
    ],
  },
  {
    risk: "Phishing and Social Engineering Attacks",
    items: [
      { action: "Deploy phishing simulation platform (quarterly campaigns)", targetDate: "2026-08-01", status: "in_progress", progressPercent: 50 },
      { action: "Enable MFA for all staff on all SaaS platforms", targetDate: "2026-07-31", status: "in_progress", progressPercent: 80 },
      { action: "Conduct security awareness training — all staff completion target 100%", targetDate: "2026-07-15", status: "completed", progressPercent: 100, completionNotes: "Training completed. 97% completion rate. Phishing simulation baseline established." },
    ],
  },
  {
    risk: "DPDP Act Non-Compliance — Consent Management",
    items: [
      { action: "Implement consent management platform (CMP) for all digital touchpoints", targetDate: "2026-08-31", status: "in_progress", progressPercent: 35 },
      { action: "Appoint Data Protection Officer (DPO) and register with Data Protection Board", targetDate: "2026-08-01", status: "open", progressPercent: 5 },
      { action: "Complete DPDP data inventory and processing activity register", targetDate: "2026-07-31", status: "in_progress", progressPercent: 70 },
    ],
  },
  {
    risk: "Expired Data Processing Agreements",
    items: [
      { action: "Renew Freshworks DPA before expiry (28 June deadline)", targetDate: "2026-06-25", status: "in_progress", progressPercent: 80 },
      { action: "Renew Darwinbox DPA and request updated privacy notices", targetDate: "2026-06-28", status: "open", progressPercent: 20 },
    ],
  },
  {
    risk: "Privileged Access Misuse",
    items: [
      { action: "Deploy Privileged Access Management (PAM) solution — Tier 1 accounts", targetDate: "2026-09-30", status: "open", progressPercent: 0 },
      { action: "Implement just-in-time access for production systems", targetDate: "2026-10-31", status: "open", progressPercent: 0 },
      { action: "Enable audit logging for all privileged sessions", targetDate: "2026-07-31", status: "in_progress", progressPercent: 60 },
    ],
  },
  {
    risk: "Apollo HealthCo — Employee Health Data Exposure",
    items: [
      { action: "Issue formal notice to Apollo HealthCo requiring DPA, security cert within 30 days", targetDate: "2026-07-10", status: "in_progress", progressPercent: 50 },
      { action: "Escalate to risk committee if DPA not received — consider vendor termination", targetDate: "2026-07-31", status: "open", progressPercent: 0 },
    ],
  },
  {
    risk: "Unpatched Vulnerability Exploited in Production",
    items: [
      { action: "Establish monthly vulnerability scanning and 30-day critical patch SLA", targetDate: "2026-07-31", status: "in_progress", progressPercent: 65 },
      { action: "Request renewed ISO 27001 from Sify Technologies within 30 days", targetDate: "2026-07-10", status: "open", progressPercent: 10 },
    ],
  },
  {
    risk: "Payment Fraud — Gateway Compromise",
    items: [
      { action: "Implement webhook signature validation for all Razorpay events", targetDate: "2026-07-15", status: "completed", progressPercent: 100, completionNotes: "Webhook HMAC validation implemented and tested. Deployed to production 2026-06-15." },
      { action: "Enable Razorpay fraud detection rules for velocity checks", targetDate: "2026-07-20", status: "in_progress", progressPercent: 80 },
    ],
  },
  {
    risk: "Business Continuity Failure — Cloud Outage",
    items: [
      { action: "Conduct BCP tabletop exercise and update runbooks", targetDate: "2026-08-15", status: "open", progressPercent: 0 },
      { action: "Provision standby environment in secondary AZ", targetDate: "2026-09-30", status: "open", progressPercent: 15 },
    ],
  },
];

let treatmentCount = 0;
for (const t of TREATMENTS) {
  const riskId = riskIds[t.risk];
  if (!riskId) { log(`skip treatment: risk not found — ${t.risk}`); continue; }

  for (const item of t.items) {
    const exists = await sql`
      select id from risk_treatments where risk_id = ${riskId} and action = ${item.action} limit 1`;
    if (exists.length) continue;

    await sql`
      insert into risk_treatments (
        id, organization_id, risk_id, action, target_date, status,
        progress_percent, description, completed_at, created_by, created_at, updated_at
      ) values (
        ${randomUUID()},
        (select organization_id from risks where id = ${riskId}),
        ${riskId}, ${item.action}, ${item.targetDate ?? null},
        ${item.status}, ${item.progressPercent ?? 0},
        ${item.completionNotes ?? null},
        ${item.status === "completed" ? new Date().toISOString() : null},
        ${ownerId}, now(), now()
      )`;
    treatmentCount++;
  }
}
log(`Created: ${treatmentCount} treatment actions`);

// ── 3. Risk Reviews ─────────────────────────────────────────────────────────
head("3. Risk Reviews");

const REVIEWS = [
  {
    risk: "Third-Party Vendor Data Breach",
    reviews: [
      { reviewDate: "2026-04-01", outcome: "score_updated", notes: "Post Freshworks DPA expiry alert — updated residual score from 12 to 10 following improved vendor monitoring controls.", reviewedBy: ownerId },
      { reviewDate: "2026-05-15", outcome: "no_change", notes: "Quarterly review. Vendor scorecards on track. No score change.", reviewedBy: ownerId },
    ],
  },
  {
    risk: "Ransomware Attack on Production Systems",
    reviews: [
      { reviewDate: "2026-03-01", outcome: "score_updated", notes: "Initial assessment after board review. Risk level confirmed as Critical (15/25). EDR deployment initiated.", reviewedBy: ownerId },
      { reviewDate: "2026-05-01", outcome: "no_change", notes: "EDR partially deployed. Immutable backups in progress. Score unchanged pending completion.", reviewedBy: ownerId },
    ],
  },
  {
    risk: "DPDP Act Non-Compliance — Consent Management",
    reviews: [
      { reviewDate: "2026-04-15", outcome: "status_changed", notes: "Status moved from identified → mitigating. CMP vendor selected and procurement approved.", reviewedBy: ownerId },
    ],
  },
  {
    risk: "Payment Fraud — Gateway Compromise",
    reviews: [
      { reviewDate: "2026-06-15", outcome: "score_updated", notes: "Webhook validation deployed. Residual score reduced from 10 to 5. Monitoring continues.", reviewedBy: ownerId },
    ],
  },
  {
    risk: "Phishing and Social Engineering Attacks",
    reviews: [
      { reviewDate: "2026-05-01", outcome: "no_change", notes: "2 phishing simulations completed. 12% click rate — above industry average. Training intensified.", reviewedBy: ownerId },
      { reviewDate: "2026-06-01", outcome: "score_updated", notes: "Click rate reduced to 6%. MFA adoption at 80%. Residual likelihood reduced by 1.", reviewedBy: ownerId },
    ],
  },
];

let reviewCount = 0;
for (const rv of REVIEWS) {
  const riskId = riskIds[rv.risk];
  if (!riskId) continue;

  for (const item of rv.reviews) {
    const exists = await sql`
      select id from risk_reviews where risk_id = ${riskId} and review_date = ${item.reviewDate} limit 1`;
    if (exists.length) continue;

    await sql`
      insert into risk_reviews (
        id, organization_id, risk_id, review_date, outcome, notes, reviewer_id, created_at
      ) values (
        ${randomUUID()},
        (select organization_id from risks where id = ${riskId}),
        ${riskId}, ${item.reviewDate}, ${item.outcome},
        ${item.notes}, ${ownerId}, now()
      )`;
    reviewCount++;
  }
}
log(`Created: ${reviewCount} review records`);

// ── 4. Risk–Vendor relationships ───────────────────────────────────────────
head("4. Risk–Vendor links");

let rvLinks = 0;
for (const r of RISKS) {
  const riskId = riskIds[r.title];
  if (!riskId || !r.linkedVendors?.length) continue;
  for (const vName of r.linkedVendors) {
    const vendorId = vByName[vName];
    if (!vendorId) continue;
    await sql`
      insert into risk_vendors (risk_id, vendor_id)
      values (${riskId}, ${vendorId})
      on conflict do nothing`;
    rvLinks++;
  }
}
log(`Created: ${rvLinks} risk–vendor links`);

// ── 5. Risk–Control relationships ─────────────────────────────────────────
head("5. Risk–Control links");

const RISK_CONTROL_MAP = {
  "Third-Party Vendor Data Breach":           ["A.5.19","A.5.20","A.5.21","A.5.22","A.5.23","DPDP.17"],
  "Ransomware Attack on Production Systems":  ["A.8.13","A.8.14","A.5.24","A.5.25","A.5.26"],
  "Phishing and Social Engineering Attacks":  ["A.6.3","A.6.4","CC1.4","CC1.5"],
  "Privileged Access Misuse":                 ["A.5.15","A.5.16","A.5.17","A.5.18","A.8.5","CC6.1","CC6.2","CC6.3"],
  "DPDP Act Non-Compliance — Consent Management": ["DPDP.1","DPDP.2","DPDP.3","DPDP.13"],
  "Unpatched Vulnerability Exploited in Production": ["A.8.8","A.8.29","CC7.1"],
  "Expired Data Processing Agreements":       ["A.5.20","A.5.22","DPDP.6"],
  "ISO 27001 Certification Lapse":            ["A.5.35","A.5.36"],
  "Data Breach Public Disclosure":            ["A.5.24","A.5.25","A.5.27","DPDP.7"],
};

const controlsByRef = {};
for (const c of controls) controlsByRef[c.control_ref] = c.id;

let rcLinks = 0;
for (const [riskTitle, refs] of Object.entries(RISK_CONTROL_MAP)) {
  const riskId = riskIds[riskTitle];
  if (!riskId) continue;
  for (const ref of refs) {
    const controlId = controlsByRef[ref];
    if (!controlId) continue;
    await sql`
      insert into risk_controls (risk_id, control_id)
      values (${riskId}, ${controlId})
      on conflict do nothing`;
    rcLinks++;
  }
}
log(`Created: ${rcLinks} risk–control links`);

// ── 6. Risk–Framework relationships ────────────────────────────────────────
head("6. Risk–Framework links");

const RISK_FRAMEWORK_MAP = {
  "DPDP Act Non-Compliance — Consent Management": ["DPDP Act 2023"],
  "ISO 27001 Certification Lapse":                ["ISO 27001:2022"],
  "Third-Party Vendor Data Breach":               ["ISO 27001:2022", "DPDP Act 2023"],
  "Ransomware Attack on Production Systems":      ["ISO 27001:2022", "SOC 2 Type II"],
  "Phishing and Social Engineering Attacks":      ["ISO 27001:2022", "SOC 2 Type II"],
  "Privileged Access Misuse":                     ["ISO 27001:2022", "SOC 2 Type II"],
  "Expired Data Processing Agreements":           ["DPDP Act 2023"],
  "Data Breach Public Disclosure":                ["DPDP Act 2023", "ISO 27001:2022"],
  "Payment Fraud — Gateway Compromise":           ["PCI DSS v4.0"],
};

let rfLinks = 0;
for (const [riskTitle, fwNames] of Object.entries(RISK_FRAMEWORK_MAP)) {
  const riskId = riskIds[riskTitle];
  if (!riskId) continue;
  for (const fwName of fwNames) {
    const fwId = fByName[fwName];
    if (!fwId) continue;
    await sql`
      insert into risk_frameworks (risk_id, framework_id)
      values (${riskId}, ${fwId})
      on conflict do nothing`;
    rfLinks++;
  }
}
log(`Created: ${rfLinks} risk–framework links`);

// ── Summary ────────────────────────────────────────────────────────────────
head("✅ Done");

const summary = await sql`
  select
    (select count(*)::int from risks where organization_id = ${orgId}) as total_risks,
    (select count(*)::int from risks where organization_id = ${orgId} and status = 'open') as open,
    (select count(*)::int from risks where organization_id = ${orgId} and status = 'mitigating') as mitigating,
    (select count(*)::int from risks where organization_id = ${orgId} and status = 'accepted') as accepted,
    (select count(*)::int from risks where organization_id = ${orgId} and inherent_score >= 16) as critical,
    (select count(*)::int from risk_treatments rt join risks r on r.id = rt.risk_id where r.organization_id = ${orgId}) as treatments,
    (select count(*)::int from risk_reviews rv join risks r on r.id = rv.risk_id where r.organization_id = ${orgId}) as reviews,
    (select count(*)::int from risk_vendors rv join risks r on r.id = rv.risk_id where r.organization_id = ${orgId}) as vendor_links,
    (select count(*)::int from risk_controls rc join risks r on r.id = rc.risk_id where r.organization_id = ${orgId}) as control_links`;

const s = summary[0];
console.log(`
  Risks:      ${s.total_risks} total — ${s.open} open · ${s.mitigating} mitigating · ${s.accepted} accepted
  Critical:   ${s.critical} risks with score ≥ 16/25
  Treatments: ${s.treatments} treatment actions
  Reviews:    ${s.reviews} review records
  Links:      ${s.vendor_links} vendor · ${s.control_links} control · ${rfLinks} framework
`);

await sql.end();
