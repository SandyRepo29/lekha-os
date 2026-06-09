/**
 * seed-audits.mjs — Audit Management seed data
 *
 * Seeds 5 audits across all lifecycle states (planned / in_progress / completed / cancelled),
 * 14 findings across all severities (critical / high / medium / low),
 * 9 corrective actions (CAPAs) in all statuses (open / in_progress / completed),
 * and audit program checklist items.
 *
 * Idempotent — safe to re-run (skips by audit name).
 *
 * Prerequisites: seed-demo.mjs + seed-compliance-frameworks.mjs
 *
 * Usage: node scripts/seed-audits.mjs [orgId]
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
const [owner] = await sql`
  select user_id from memberships where organization_id = ${orgId} and role = 'owner' limit 1`;
const ownerId = owner?.user_id ?? null;
log(`Org: ${orgName} (${orgId})`);

// ── Framework lookup ──────────────────────────────────────────────────────────
const frameworks = await sql`select id, name from frameworks where organization_id = ${orgId}`;
const fByName = {};
for (const f of frameworks) {
  // Match loosely: "ISO 27001:2022" → key "iso", "SOC 2 Type II" → "soc2", etc.
  if (f.name.includes("ISO")) fByName["iso"] = f.id;
  if (f.name.includes("SOC")) fByName["soc2"] = f.id;
  if (f.name.includes("DPDP")) fByName["dpdp"] = f.id;
  if (f.name.includes("PCI")) fByName["pci"] = f.id;
  if (f.name.includes("HIPAA")) fByName["hipaa"] = f.id;
}

// ── Controls for audit programs ───────────────────────────────────────────────
const isoControls = await sql`
  select c.id, c.control_ref, c.name from controls c
  join frameworks f on f.id = c.framework_id
  where f.id = ${fByName["iso"] ?? null}
  order by c.control_ref limit 12`;

const soc2Controls = await sql`
  select c.id, c.control_ref, c.name from controls c
  join frameworks f on f.id = c.framework_id
  where f.id = ${fByName["soc2"] ?? null}
  order by c.control_ref limit 8`;

const dpdpControls = await sql`
  select c.id, c.control_ref, c.name from controls c
  join frameworks f on f.id = c.framework_id
  where f.id = ${fByName["dpdp"] ?? null}
  order by c.control_ref limit 6`;

const pciControls = await sql`
  select c.id, c.control_ref, c.name from controls c
  join frameworks f on f.id = c.framework_id
  where f.id = ${fByName["pci"] ?? null}
  order by c.control_ref limit 8`;

// ── Audit definitions ─────────────────────────────────────────────────────────
const AUDITS = [
  {
    name: "Annual ISO 27001 Internal Audit 2026",
    audit_type: "internal",
    scope: "All information security controls across corporate and cloud infrastructure. Annexure A controls, ISMS policy, risk treatment plan.",
    objective: "Assess compliance with ISO 27001:2022 Annex A controls and identify gaps before Q3 recertification by external auditor.",
    auditor_name: "Internal Audit Team — IT Security",
    frameworkKey: "iso",
    start_date: "2026-01-15",
    end_date: "2026-02-28",
    audit_status: "completed",
    ai_summary: "The annual ISO 27001 internal audit identified 5 findings including one critical gap in privileged access management and two high-severity issues in incident response and supplier security. Overall control implementation is at 73% with key strengths in physical security and business continuity. Immediate remediation required on access reviews and vulnerability management before the external recertification in Q3 2026.",
    controls: isoControls,
    programStatuses: ["passed","passed","passed","reviewed","failed","passed","passed","reviewed","failed","passed","pending","passed"],
  },
  {
    name: "Q1 Vendor Security Review — Razorpay 2026",
    audit_type: "vendor",
    scope: "Payment gateway integration security, API key management, PCI DSS compliance posture, data processing agreement coverage.",
    objective: "Evaluate Razorpay's security controls for PCI DSS scope management and DPDP data processing compliance.",
    auditor_name: "Vendor Risk & Procurement Team",
    frameworkKey: null,
    start_date: "2026-03-01",
    end_date: "2026-03-31",
    audit_status: "completed",
    ai_summary: "Razorpay's security posture is strong with no critical findings. Two high-severity observations raised around API key rotation frequency and webhook endpoint validation. Three medium-severity findings related to audit log retention and DPA sub-processor coverage. All corrective actions accepted. Vendor Trust Score remains Strong at 88/100.",
    controls: [],
    programStatuses: [],
  },
  {
    name: "SOC 2 Type II Gap Assessment",
    audit_type: "compliance",
    scope: "Trust Services Criteria — Security, Availability, Confidentiality across all production and cloud systems.",
    objective: "Identify control gaps against SOC 2 Type II requirements ahead of external auditor engagement in Q4 2026.",
    auditor_name: "KPMG India — Technology Risk Practice",
    frameworkKey: "soc2",
    start_date: "2026-05-01",
    end_date: "2026-07-31",
    audit_status: "in_progress",
    ai_summary: null,
    controls: soc2Controls,
    programStatuses: ["passed","passed","failed","pending","pending","failed","reviewed","pending"],
  },
  {
    name: "DPDP Act Compliance Audit 2026",
    audit_type: "compliance",
    scope: "Personal data processing activities, consent mechanisms, data principal rights fulfillment, data localisation.",
    objective: "Assess readiness for Digital Personal Data Protection Act 2023 compliance ahead of regulatory enforcement.",
    auditor_name: "Privacy & Legal Compliance Team",
    frameworkKey: "dpdp",
    start_date: "2026-07-01",
    end_date: "2026-08-31",
    audit_status: "planned",
    ai_summary: null,
    controls: dpdpControls,
    programStatuses: ["pending","pending","pending","pending","pending","pending"],
  },
  {
    name: "PCI DSS v4.0 Pre-Assessment",
    audit_type: "external",
    scope: "Cardholder data environment — payment processing systems, network segmentation, encryption controls, access management.",
    objective: "Pre-assessment gap analysis against PCI DSS v4.0 requirements before formal QSA assessment engagement.",
    auditor_name: "Deloitte India — Cyber Risk Advisory",
    frameworkKey: "pci",
    start_date: "2026-04-01",
    end_date: "2026-06-30",
    audit_status: "in_progress",
    ai_summary: null,
    controls: pciControls,
    programStatuses: ["passed","failed","pending","failed","passed","pending","reviewed","pending"],
  },
];

// ── Insert audits ─────────────────────────────────────────────────────────────
head("Seeding Audits");
const auditIds = {};

for (const a of AUDITS) {
  const existing = await sql`
    select id from audits where organization_id = ${orgId} and name = ${a.name} limit 1`;
  if (existing.length) {
    auditIds[a.name] = existing[0].id;
    log(`skip (exists): ${a.name}`);
    continue;
  }

  const frameworkId = a.frameworkKey ? (fByName[a.frameworkKey] ?? null) : null;
  const [row] = await sql`
    insert into audits (
      id, organization_id, name, audit_type, framework_id,
      scope, objective, auditor_name, owner_id,
      start_date, end_date, audit_status, ai_summary,
      created_by, created_at, updated_at
    ) values (
      ${randomUUID()}, ${orgId}, ${a.name}, ${a.audit_type}, ${frameworkId},
      ${a.scope}, ${a.objective}, ${a.auditor_name}, ${ownerId},
      ${a.start_date}, ${a.end_date}, ${a.audit_status}, ${a.ai_summary ?? null},
      ${ownerId}, now(), now()
    ) returning id`;

  auditIds[a.name] = row.id;
  log(`created [${a.audit_status}]: ${a.name}`);

  // Audit program items
  for (let i = 0; i < a.controls.length; i++) {
    const ctrl = a.controls[i];
    const pgStatus = a.programStatuses[i] ?? "pending";
    await sql`
      insert into audit_programs (
        id, organization_id, audit_id, title, description,
        control_id, expected_evidence, audit_program_status,
        created_at, updated_at
      ) values (
        ${randomUUID()}, ${orgId}, ${row.id},
        ${`${ctrl.control_ref} — ${ctrl.name}`},
        ${"Review implementation evidence and test effectiveness of this control"},
        ${ctrl.id},
        ${"Evidence documents, test records, approvals"},
        ${pgStatus},
        now(), now()
      ) on conflict do nothing`;
  }
  if (a.controls.length) log(`  → ${a.controls.length} program items`);
}

// ── Findings ──────────────────────────────────────────────────────────────────
head("Seeding Findings");

const FINDINGS = [
  // ── Audit 1 — ISO 27001 Internal Audit (completed) ──
  {
    audit: "Annual ISO 27001 Internal Audit 2026",
    title: "Privileged Access Management — No Formal Quarterly Review Process",
    description: "No documented quarterly access review process exists for privileged accounts. Generic admin credentials found shared across 3 systems. Violates ISO 27001 A.9.2.3 and A.9.2.5.",
    severity: "critical",
    status: "remediating",
    recommendation: "Implement quarterly access reviews with CISO sign-off. Disable all shared credentials. Deploy PAM solution within 60 days.",
  },
  {
    audit: "Annual ISO 27001 Internal Audit 2026",
    title: "Incident Response Plan — Not Tested in 18 Months",
    description: "The Incident Response Plan has not been tested via tabletop exercise or simulation in 18 months. No evidence of post-incident lessons-learned documentation. ISO 27001 A.16.1.6.",
    severity: "high",
    status: "remediating",
    recommendation: "Conduct tabletop exercise within 30 days. Update IRP based on outcomes. Schedule bi-annual testing cadence.",
  },
  {
    audit: "Annual ISO 27001 Internal Audit 2026",
    title: "Supplier Security Assessments — 8 Critical Vendors Not Reviewed in 12+ Months",
    description: "8 critical suppliers (3 cloud, 2 IT services, 3 SaaS) have not undergone security assessment in over 12 months. ISO 27001 A.15.2.1.",
    severity: "high",
    status: "closed",
    recommendation: "Complete security assessments for all 8 vendors within 60 days. Update vendor review schedule to annual minimum.",
  },
  {
    audit: "Annual ISO 27001 Internal Audit 2026",
    title: "Vulnerability Management — Patch SLA Breached on 12 Production Systems",
    description: "12 production systems have critical/high CVEs older than the 30-day patching SLA. Oldest unpatched vulnerability is 74 days old. ISO 27001 A.12.6.1.",
    severity: "medium",
    status: "remediating",
    recommendation: "Emergency patching sprint for all 12 systems within 14 days. Enforce SLA via automated ticketing.",
  },
  {
    audit: "Annual ISO 27001 Internal Audit 2026",
    title: "Security Awareness Training — 23% Employee Completion Rate",
    description: "Only 23% of employees have completed mandatory annual security awareness training. No escalation process exists for overdue completion. ISO 27001 A.7.2.2.",
    severity: "low",
    status: "closed",
    recommendation: "Mandatory completion deadline with manager escalation. Report completion rate to CISO monthly.",
  },

  // ── Audit 2 — Razorpay Vendor Review (completed) ──
  {
    audit: "Q1 Vendor Security Review — Razorpay 2026",
    title: "API Key Rotation — No Automated Policy (14 Months Without Rotation)",
    description: "Razorpay API keys have not been rotated in 14 months. No automated rotation or expiry enforcement exists. Keys found stored in plaintext in 2 legacy configuration files.",
    severity: "high",
    status: "remediating",
    recommendation: "Rotate all API keys immediately. Implement secrets manager (HashiCorp Vault or AWS SM). Enforce 90-day rotation policy.",
  },
  {
    audit: "Q1 Vendor Security Review — Razorpay 2026",
    title: "DPA — Missing Sub-processor Disclosure and Change Notification Clause",
    description: "The DPA with Razorpay does not enumerate sub-processors or include a notification clause for sub-processor changes. Required under DPDP Act 2023 and standard contractual clauses.",
    severity: "medium",
    status: "closed",
    recommendation: "Obtain updated DPA with sub-processor annex. Ensure 30-day notification clause is included for any new sub-processors.",
  },
  {
    audit: "Q1 Vendor Security Review — Razorpay 2026",
    title: "Audit Log Retention — 30 Days vs 12-Month Policy Requirement",
    description: "Razorpay integration audit logs are retained for only 30 days vs. org's 12-month retention policy for financial vendors. SLA gap not contractually remedied.",
    severity: "medium",
    status: "accepted",
    recommendation: "Negotiate extended retention in SLA. Alternate: stream logs to org SIEM with 12-month retention.",
  },

  // ── Audit 3 — SOC 2 Gap Assessment (in_progress) ──
  {
    audit: "SOC 2 Type II Gap Assessment",
    title: "Encryption at Rest — 3 Databases Using AES-128 Instead of AES-256",
    description: "3 production databases containing PII are using AES-128-bit encryption. SOC 2 CC6.1 and KPMG advisory require AES-256 minimum for PII data stores.",
    severity: "critical",
    status: "open",
    recommendation: "Re-encrypt all 3 databases to AES-256 within 45 days. Document key management process and test recovery procedures.",
  },
  {
    audit: "SOC 2 Type II Gap Assessment",
    title: "Change Management — 12 Emergency Changes Without Approval Records",
    description: "12 emergency production changes in the last 6 months were deployed without documented CAB approval or post-hoc review. SOC 2 CC8.1.",
    severity: "high",
    status: "open",
    recommendation: "Implement emergency change form with CISO post-hoc sign-off within 24 hours. Retroactively document 12 existing changes.",
  },
  {
    audit: "SOC 2 Type II Gap Assessment",
    title: "Logical Access Termination — 4 Ex-Employee Accounts Still Active",
    description: "4 accounts belonging to employees terminated in Q1 2026 remain active in the Identity Provider. Deprovisioning SLA was 24 hours. SOC 2 CC6.2.",
    severity: "high",
    status: "remediating",
    recommendation: "Disable all 4 accounts immediately. Implement automated deprovisioning trigger from HRMS. Monthly account audit.",
  },

  // ── Audit 5 — PCI DSS Pre-Assessment (in_progress) ──
  {
    audit: "PCI DSS v4.0 Pre-Assessment",
    title: "Cardholder Data Environment — PAN Data Found in 2 Out-of-Scope Systems",
    description: "2 systems found storing Primary Account Numbers (PAN) outside the designated CDE boundary. Encryption tokens not applied. PCI DSS 3.2, 3.3, 3.4.",
    severity: "critical",
    status: "open",
    recommendation: "Immediately scope or remove the 2 systems from CDE. Tokenize or delete PAN data. Re-validate CDE boundary before QSA assessment.",
  },
  {
    audit: "PCI DSS v4.0 Pre-Assessment",
    title: "Network Segmentation — 3 Open Firewall Rules Allowing CDE Ingress from Corporate Network",
    description: "CDE network has 3 open firewall rules permitting unnecessary inbound traffic from corporate LAN. Segmentation test failed on 2 of 3 boundary checks. PCI DSS 1.2, 1.3.",
    severity: "high",
    status: "remediating",
    recommendation: "Remove the 3 unnecessary firewall rules (FW-041, FW-067, FW-089). External segmentation penetration test required before QSA.",
  },
  {
    audit: "PCI DSS v4.0 Pre-Assessment",
    title: "Key Management — Encryption Keys Co-located with Encrypted Cardholder Data",
    description: "Encryption keys for cardholder data are stored on the same physical server as the encrypted data. Violates key custodianship separation principle. PCI DSS 3.5.",
    severity: "high",
    status: "open",
    recommendation: "Migrate keys to a Hardware Security Module (HSM) or dedicated key management service. Implement dual-control key access.",
  },
  {
    audit: "PCI DSS v4.0 Pre-Assessment",
    title: "External Vulnerability Scanning — ASV Scan 45 Days Overdue",
    description: "External ASV scans are 45 days overdue. Last clean passing scan was 4 months ago. Quarterly cadence not maintained. PCI DSS 11.3.2.",
    severity: "medium",
    status: "remediating",
    recommendation: "Schedule ASV scan within 7 days. Integrate into quarterly security calendar. Automate scan scheduling and report distribution.",
  },
];

const findingIds = {};

for (const f of FINDINGS) {
  const auditId = auditIds[f.audit];
  if (!auditId) { log(`skip — audit not found: ${f.audit.slice(0, 50)}`); continue; }

  const existing = await sql`
    select id from audit_findings
    where audit_id = ${auditId} and title = ${f.title} limit 1`;
  if (existing.length) {
    findingIds[f.title] = existing[0].id;
    log(`skip (exists): ${f.title.slice(0, 60)}`);
    continue;
  }

  const [row] = await sql`
    insert into audit_findings (
      id, organization_id, audit_id, title, description,
      finding_severity, finding_status, recommendation,
      created_by, created_at, updated_at
    ) values (
      ${randomUUID()}, ${orgId}, ${auditId}, ${f.title}, ${f.description},
      ${f.severity}, ${f.status}, ${f.recommendation},
      ${ownerId}, now(), now()
    ) returning id`;

  findingIds[f.title] = row.id;
  log(`  [${f.severity.toUpperCase().padEnd(8)}] ${f.title.slice(0, 65)}`);
}

// ── CAPAs ─────────────────────────────────────────────────────────────────────
head("Seeding Corrective Actions (CAPAs)");

const CAPAS = [
  {
    finding: "Privileged Access Management — No Formal Quarterly Review Process",
    title: "Deploy PAM solution and disable shared admin credentials",
    description: "Procure and deploy CyberArk PAM. Migrate 23 privileged accounts. Rotate or disable all shared credentials. Validate via quarterly access review.",
    status: "in_progress",
    due_date: "2026-04-30",
  },
  {
    finding: "Privileged Access Management — No Formal Quarterly Review Process",
    title: "Implement quarterly access review workflow with CISO sign-off",
    description: "Create access review workflow in ServiceNow. Assign access owners per system. Train team. Complete first review by Q2 end.",
    status: "open",
    due_date: "2026-05-31",
  },
  {
    finding: "Incident Response Plan — Not Tested in 18 Months",
    title: "Conduct ransomware tabletop exercise and update IRP",
    description: "Engage external facilitator for 4-hour tabletop exercise with CISO, IT, Legal, and Comms. Document outcomes and publish IRP v2.1.",
    status: "completed",
    due_date: "2026-03-31",
    completion_notes: "Tabletop exercise completed 2026-03-28. IRP v2.1 published. Findings incorporated. Next exercise scheduled September 2026.",
    completed_at: "2026-03-28T14:00:00Z",
  },
  {
    finding: "Vulnerability Management — Patch SLA Breached on 12 Production Systems",
    title: "Emergency patching sprint — all critical/high CVEs within 14 days",
    description: "Dedicated sprint for 12 identified production systems. Nessus scan validation post-patching. Weekly CISO status report until complete.",
    status: "in_progress",
    due_date: "2026-04-15",
  },
  {
    finding: "API Key Rotation — No Automated Policy (14 Months Without Rotation)",
    title: "Integrate HashiCorp Vault and rotate all third-party API keys",
    description: "Deploy HashiCorp Vault in HA mode. Migrate Razorpay, Resend, and other third-party keys. Set 90-day rotation with automated alerts at 30/7 days before expiry.",
    status: "in_progress",
    due_date: "2026-05-01",
  },
  {
    finding: "Encryption at Rest — 3 Databases Using AES-128 Instead of AES-256",
    title: "Upgrade all PII databases to AES-256 encryption",
    description: "Coordinate with DBA team for zero-downtime re-encryption of 3 databases. Test backup and recovery. Update encryption policy documentation.",
    status: "open",
    due_date: "2026-07-15",
  },
  {
    finding: "Logical Access Termination — 4 Ex-Employee Accounts Still Active",
    title: "Disable 4 ex-employee accounts and automate HRMS deprovisioning",
    description: "Immediately disable all 4 accounts. Integrate Keka HRMS with Okta for automated last-day deprovisioning. Test with 3 upcoming leavers.",
    status: "in_progress",
    due_date: "2026-06-15",
  },
  {
    finding: "Cardholder Data Environment — PAN Data Found in 2 Out-of-Scope Systems",
    title: "Tokenize PAN data in out-of-scope systems and update CDE boundary",
    description: "Engage Braintree tokenization. Map all PAN storage locations. Replace raw PAN with tokens. Validate new CDE boundary diagram with QSA.",
    status: "open",
    due_date: "2026-06-01",
  },
  {
    finding: "Network Segmentation — 3 Open Firewall Rules Allowing CDE Ingress from Corporate Network",
    title: "Remove 3 unnecessary CDE firewall rules and run segmentation pen test",
    description: "Remove FW-041, FW-067, FW-089 after change approval. Commission external pen tester to validate CDE isolation. Update network diagram.",
    status: "in_progress",
    due_date: "2026-06-15",
  },
];

for (const c of CAPAS) {
  const findingId = findingIds[c.finding];
  if (!findingId) { log(`skip CAPA — finding not found: ${c.finding.slice(0, 50)}`); continue; }

  const existing = await sql`
    select id from corrective_actions where finding_id = ${findingId} and title = ${c.title} limit 1`;
  if (existing.length) { log(`skip (exists): ${c.title.slice(0, 60)}`); continue; }

  await sql`
    insert into corrective_actions (
      id, organization_id, finding_id, title, description,
      owner_id, due_date, corrective_action_status,
      completion_notes, completed_at, created_at, updated_at
    ) values (
      ${randomUUID()}, ${orgId}, ${findingId}, ${c.title}, ${c.description},
      ${ownerId}, ${c.due_date ?? null}, ${c.status},
      ${c.completion_notes ?? null}, ${c.completed_at ?? null},
      now(), now()
    )`;
  log(`  [${c.status.padEnd(11)}] ${c.title.slice(0, 60)}`);
}

// ── Summary ───────────────────────────────────────────────────────────────────
const [counts] = await sql`
  select
    (select count(*) from audits where organization_id = ${orgId})::int as audits,
    (select count(*) from audit_findings where organization_id = ${orgId})::int as findings,
    (select count(*) from corrective_actions where organization_id = ${orgId})::int as capas,
    (select count(*) from audit_programs ap
     join audits a on a.id = ap.audit_id
     where a.organization_id = ${orgId})::int as programs`;

console.log(`\n✅ Done — ${orgName}`);
console.log(`   Audits: ${counts.audits} | Findings: ${counts.findings} | CAPAs: ${counts.capas} | Program items: ${counts.programs}`);
console.log(`   States seeded: planned · in_progress · completed`);
console.log(`   Severities seeded: critical · high · medium · low`);
console.log(`   CAPA statuses seeded: open · in_progress · completed`);

await sql.end();
