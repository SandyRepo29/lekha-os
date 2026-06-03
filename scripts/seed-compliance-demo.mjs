/**
 * seed-compliance-demo.mjs
 * Comprehensive compliance demo seed for the "admin corp" org.
 *
 * Seeds:
 *  1. Control statuses  — realistic distribution across 5 frameworks
 *  2. Evidence statuses — mix of approved/pending/expired
 *  3. Manual evidence   — 12 realistic items not tied to vendor docs
 *  4. Evidence→control mappings — ~55% coverage on active frameworks
 *  5. Policies          — 8 policies across all lifecycle states
 *  6. Gap analysis      — run for each framework
 *  7. Readiness scores  — computed from the above
 *
 * Idempotent — safe to re-run; skips work already done.
 *
 * Usage:
 *   node scripts/seed-compliance-demo.mjs
 *   node scripts/seed-compliance-demo.mjs <orgId>
 */

import postgres from "postgres";
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local" });
const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

// ── Helpers ────────────────────────────────────────────────────────────────

const log  = (msg) => console.log(`  ${msg}`);
const head = (msg) => console.log(`\n▶ ${msg}`);

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

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
console.log(`\n🌱 Compliance demo seed for: ${orgName} (${orgId})\n`);

// ── 1. Control status distribution ─────────────────────────────────────────

head("1. Control statuses");

const FRAMEWORK_STATUS_PLAN = {
  "ISO 27001:2022": {
    implemented:    ["A.5.1","A.5.2","A.5.3","A.5.7","A.5.12","A.5.14","A.5.15","A.5.16","A.5.17","A.5.18",
                     "A.5.19","A.5.20","A.5.23","A.5.24","A.5.25","A.5.26","A.5.34",
                     "A.6.1","A.6.2","A.6.3","A.6.6","A.6.7",
                     "A.7.1","A.7.2","A.7.4",
                     "A.8.1","A.8.2","A.8.3","A.8.5","A.8.7","A.8.9","A.8.13","A.8.15","A.8.20","A.8.24"],
    partial:        ["A.5.4","A.5.8","A.5.9","A.5.10","A.5.22","A.5.27","A.5.29","A.5.31","A.5.36",
                     "A.6.4","A.6.5","A.6.8",
                     "A.7.3","A.7.10","A.7.14",
                     "A.8.4","A.8.6","A.8.8","A.8.12","A.8.16","A.8.21","A.8.22","A.8.25","A.8.28","A.8.32"],
    not_applicable: ["A.5.5","A.5.6","A.5.32","A.7.6","A.7.11","A.7.12"],
    // rest = not_implemented
  },
  "SOC 2 Type II": {
    implemented:    ["CC1.1","CC1.2","CC1.3","CC2.1","CC2.2","CC3.1","CC3.2","CC3.3",
                     "CC5.1","CC5.2","CC6.1","CC6.2","CC6.3","CC6.5","CC6.6","CC6.8",
                     "CC7.1","CC7.2","CC7.3","CC8.1","CC9.2"],
    partial:        ["CC1.4","CC1.5","CC2.3","CC3.4","CC4.1","CC4.2","CC5.3",
                     "CC6.4","CC6.7","CC7.4","CC7.5","CC9.1"],
    not_applicable: [],
  },
  "DPDP Act 2023": {
    implemented:    ["DPDP.1","DPDP.2","DPDP.3","DPDP.4","DPDP.5","DPDP.6","DPDP.7",
                     "DPDP.8","DPDP.9","DPDP.10","DPDP.12","DPDP.18"],
    partial:        ["DPDP.11","DPDP.13","DPDP.17"],
    not_applicable: ["DPDP.14","DPDP.15","DPDP.16"],
  },
  "PCI DSS v4.0": {
    implemented:    ["Req 1","Req 2","Req 5"],
    partial:        ["Req 6","Req 8"],
    not_applicable: [],
  },
  "HIPAA": {
    implemented:    ["§164.308(a)(1)","§164.308(a)(4)"],
    partial:        ["§164.308(a)(3)","§164.308(a)(5)"],
    not_applicable: ["§164.310(b)","§164.310(c)","§164.312(c)(1)","§164.312(d)"],
  },
};

const frameworks = await sql`
  select id, name from frameworks where organization_id = ${orgId} order by name
`;

let controlsUpdated = 0;
for (const fw of frameworks) {
  const plan = FRAMEWORK_STATUS_PLAN[fw.name];
  if (!plan) { log(`skipping unknown framework: ${fw.name}`); continue; }

  const controls = await sql`
    select id, control_ref, status from controls
    where framework_id = ${fw.id} order by control_ref
  `;

  const already = controls.filter(c => c.status !== "not_implemented").length;
  if (already > 0) {
    log(`${fw.name}: ${already} controls already set — skipping`);
    continue;
  }

  for (const c of controls) {
    let newStatus = "not_implemented";
    if (plan.implemented?.includes(c.control_ref))    newStatus = "implemented";
    else if (plan.partial?.includes(c.control_ref))   newStatus = "partial";
    else if (plan.not_applicable?.includes(c.control_ref)) newStatus = "not_applicable";

    if (newStatus !== "not_implemented") {
      await sql`update controls set status = ${newStatus}, updated_at = now() where id = ${c.id}`;
      controlsUpdated++;
    }
  }

  const summary = await sql`
    select status, count(*)::int n from controls
    where framework_id = ${fw.id} group by status order by n desc
  `;
  log(`${fw.name}: ${summary.map(s => `${s.status}=${s.n}`).join(' · ')}`);
}
log(`Total controls updated: ${controlsUpdated}`);

// ── 2. Evidence statuses ────────────────────────────────────────────────────

head("2. Evidence statuses");

const evidenceItems = await sql`
  select id, title, source, status from evidence
  where organization_id = ${orgId} order by created_at
`;

const alreadyMixed = evidenceItems.filter(e => e.status !== "draft").length;
if (alreadyMixed > 20) {
  log(`Evidence already has mixed statuses (${alreadyMixed} non-draft) — skipping`);
} else {
  // Approve ~65%, pending_review ~15%, expired ~10%, keep rest draft
  let approved = 0, pending = 0, expired = 0;
  for (let i = 0; i < evidenceItems.length; i++) {
    const ev = evidenceItems[i];
    let newStatus = ev.status;
    if (i % 10 === 9)       { newStatus = "expired";        expired++;  }
    else if (i % 7 === 6)   { newStatus = "pending_review"; pending++;  }
    else                    { newStatus = "approved";        approved++; }
    await sql`update evidence set status = ${newStatus}, updated_at = now() where id = ${ev.id}`;
  }
  log(`Approved: ${approved} · Pending review: ${pending} · Expired: ${expired}`);
}

// ── 3. Manual evidence items ────────────────────────────────────────────────

head("3. Manual evidence items");

const MANUAL_EVIDENCE = [
  { title: "Information Security Policy v2.1",           desc: "Approved corporate ISP covering data classification, access control and incident response.", expires: "2025-12-31", status: "approved" },
  { title: "Annual Penetration Test Report 2024",        desc: "External VAPT conducted by certified security firm. All critical findings remediated.", expires: "2025-03-31", status: "approved" },
  { title: "ISO 27001 Internal Audit Report Q3 2024",    desc: "Internal audit covering A.5–A.8 controls. 3 minor non-conformities identified.", expires: null, status: "approved" },
  { title: "Employee Security Awareness Training — 2024",desc: "95% completion rate across all staff. Phishing simulation results included.", expires: "2025-06-30", status: "approved" },
  { title: "Access Review — Q4 2024",                    desc: "Quarterly review of privileged access rights. 12 accounts deprovisioned.", expires: null, status: "approved" },
  { title: "Data Classification Policy",                 desc: "Policy defining Confidential / Internal / Public classification tiers.", expires: "2026-01-01", status: "approved" },
  { title: "Business Continuity Plan v1.3",              desc: "BCP covering RTO/RPO targets. Last tabletop exercise: September 2024.", expires: "2025-09-30", status: "approved" },
  { title: "Vendor Security Assessment Framework",       desc: "Policy for onboarding and annual reassessment of critical vendors.", expires: "2026-01-01", status: "approved" },
  { title: "Incident Response Runbook",                  desc: "Step-by-step runbook for security incidents. Updated for cloud-first architecture.", expires: null, status: "approved" },
  { title: "DPDP Consent Management Procedure",         desc: "Procedure for obtaining, recording and managing user consent per DPDP Act 2023.", expires: null, status: "approved" },
  { title: "Data Retention and Deletion Policy",        desc: "Retention schedules for all data categories. Automated deletion workflows documented.", expires: "2025-12-31", status: "approved" },
  { title: "Network Architecture Diagram — 2024",       desc: "Current network topology including DMZ, VPC segmentation and firewall rules.", expires: "2025-06-30", status: "pending_review" },
];

let manualCreated = 0;
for (const e of MANUAL_EVIDENCE) {
  const exists = await sql`
    select id from evidence where organization_id = ${orgId} and title = ${e.title} limit 1
  `;
  if (exists.length) { log(`skip (exists): ${e.title.slice(0, 50)}`); continue; }

  await sql`
    insert into evidence (id, organization_id, title, description, source, expires_on, status, created_at, updated_at)
    values (${randomUUID()}, ${orgId}, ${e.title}, ${e.desc}, 'manual',
            ${e.expires ?? null}, ${e.status}, now(), now())
  `;
  log(`+ ${e.title.slice(0, 60)}`);
  manualCreated++;
}
log(`Created: ${manualCreated} manual evidence items`);

// ── 4. Control-evidence mappings ────────────────────────────────────────────

head("4. Control-evidence mappings");

const existingMappings = await sql`
  select count(*)::int n from control_evidence_mappings cem
  inner join controls c on c.id = cem.control_id
  where c.organization_id = ${orgId}
`;
if (existingMappings[0].n > 10) {
  log(`Already has ${existingMappings[0].n} mappings — skipping`);
} else {
  // Get all approved evidence
  const approvedEv = await sql`
    select id, title, source from evidence
    where organization_id = ${orgId} and status = 'approved'
    order by created_at
  `;

  // Map evidence to implemented/partial controls by framework
  // Strategy: for each framework, map top approved evidence to its critical/high controls
  const EVIDENCE_CONTROL_MAP = {
    "ISO 27001:2022": {
      "Information Security Policy v2.1":            ["A.5.1","A.5.2","A.5.4","A.5.36","A.5.37"],
      "Annual Penetration Test Report 2024":         ["A.8.8","A.8.29","A.5.7"],
      "ISO 27001 Internal Audit Report Q3 2024":     ["A.5.35","A.5.36","A.5.3"],
      "Employee Security Awareness Training — 2024": ["A.6.3","A.6.4","A.5.4"],
      "Access Review — Q4 2024":                     ["A.5.15","A.5.16","A.5.17","A.5.18","A.8.2","A.8.3","A.8.5"],
      "Data Classification Policy":                  ["A.5.12","A.5.13","A.5.14"],
      "Business Continuity Plan v1.3":               ["A.5.29","A.5.30","A.8.13","A.8.14"],
      "Vendor Security Assessment Framework":        ["A.5.19","A.5.20","A.5.21","A.5.22","A.5.23"],
      "Incident Response Runbook":                   ["A.5.24","A.5.25","A.5.26","A.5.27","A.5.28","A.6.8"],
      "Data Retention and Deletion Policy":          ["A.5.33","A.8.10"],
      "Network Architecture Diagram — 2024":         ["A.8.20","A.8.21","A.8.22"],
    },
    "SOC 2 Type II": {
      "Information Security Policy v2.1":            ["CC1.1","CC1.2","CC5.3"],
      "Access Review — Q4 2024":                     ["CC6.1","CC6.2","CC6.3","CC6.5"],
      "Annual Penetration Test Report 2024":         ["CC6.6","CC7.1","CC7.2"],
      "Incident Response Runbook":                   ["CC7.3","CC7.4","CC7.5"],
      "Vendor Security Assessment Framework":        ["CC9.2"],
      "Business Continuity Plan v1.3":               ["CC9.1"],
      "Employee Security Awareness Training — 2024": ["CC1.4","CC1.5"],
    },
    "DPDP Act 2023": {
      "DPDP Consent Management Procedure":           ["DPDP.1","DPDP.2","DPDP.13","DPDP.14"],
      "Data Classification Policy":                  ["DPDP.3","DPDP.4"],
      "Data Retention and Deletion Policy":          ["DPDP.5","DPDP.18"],
      "Information Security Policy v2.1":            ["DPDP.6"],
      "Incident Response Runbook":                   ["DPDP.7"],
      "Vendor Security Assessment Framework":        ["DPDP.17"],
    },
    "PCI DSS v4.0": {
      "Network Architecture Diagram — 2024":         ["Req 1","Req 2"],
      "Access Review — Q4 2024":                     ["Req 7","Req 8"],
      "Employee Security Awareness Training — 2024": ["Req 12"],
    },
    "HIPAA": {
      "Information Security Policy v2.1":            ["§164.308(a)(1)"],
      "Access Review — Q4 2024":                     ["§164.308(a)(4)"],
    },
  };

  // Also map vendor-sourced evidence to some controls
  const vendorDocEvidence = approvedEv.filter(e => e.source === "vendor_document").slice(0, 20);
  const vendorAssessmentEvidence = approvedEv.filter(e => e.source === "vendor_assessment").slice(0, 6);

  // Build control lookup: frameworkName → ref → controlId
  const controlLookup = {};
  for (const fw of frameworks) {
    const fwControls = await sql`
      select id, control_ref from controls where framework_id = ${fw.id}
    `;
    controlLookup[fw.name] = Object.fromEntries(fwControls.map(c => [c.control_ref, c.id]));
  }

  // Build evidence title → id map
  const allEvidence = await sql`
    select id, title from evidence where organization_id = ${orgId}
  `;
  const evByTitle = Object.fromEntries(allEvidence.map(e => [e.title, e.id]));

  let mappingsCreated = 0;
  // Apply the evidence→control map
  for (const [fwName, evMap] of Object.entries(EVIDENCE_CONTROL_MAP)) {
    const fwControlMap = controlLookup[fwName] ?? {};
    for (const [evTitle, refs] of Object.entries(evMap)) {
      const evId = evByTitle[evTitle];
      if (!evId) continue;
      for (const ref of refs) {
        const controlId = fwControlMap[ref];
        if (!controlId) continue;
        await sql`
          insert into control_evidence_mappings (id, control_id, evidence_id, mapping_type, created_at)
          values (${randomUUID()}, ${controlId}, ${evId}, 'manual', now())
          on conflict (control_id, evidence_id) do nothing
        `;
        mappingsCreated++;
      }
    }
  }

  // Map vendor-sourced evidence to A.5.19-A.5.23 (supplier controls) in ISO 27001
  const iso27001Controls = controlLookup["ISO 27001:2022"] ?? {};
  const supplierRefs = ["A.5.19","A.5.20","A.5.21","A.5.22","A.5.23"];
  for (let i = 0; i < vendorDocEvidence.length; i++) {
    const ref = supplierRefs[i % supplierRefs.length];
    const controlId = iso27001Controls[ref];
    if (!controlId) continue;
    await sql`
      insert into control_evidence_mappings (id, control_id, evidence_id, mapping_type, created_at)
      values (${randomUUID()}, ${controlId}, ${vendorDocEvidence[i].id}, 'manual', now())
      on conflict (control_id, evidence_id) do nothing
    `;
    mappingsCreated++;
  }

  // Map vendor assessments to CC7.3-CC7.5 in SOC 2
  const soc2Controls = controlLookup["SOC 2 Type II"] ?? {};
  for (let i = 0; i < vendorAssessmentEvidence.length; i++) {
    const refs = ["CC7.3","CC7.4","CC9.2"];
    const controlId = soc2Controls[refs[i % refs.length]];
    if (!controlId) continue;
    await sql`
      insert into control_evidence_mappings (id, control_id, evidence_id, mapping_type, created_at)
      values (${randomUUID()}, ${controlId}, ${vendorAssessmentEvidence[i].id}, 'manual', now())
      on conflict (control_id, evidence_id) do nothing
    `;
    mappingsCreated++;
  }

  log(`Created: ${mappingsCreated} evidence-control mappings`);
}

// ── 5. Policies ─────────────────────────────────────────────────────────────

head("5. Policies");

const POLICIES = [
  { name: "Information Security Policy",     type: "Information Security Policy",  version: "2.1", status: "approved", reviewDate: "2025-12-31", approvalDate: "2024-01-15", approver: "CISO" },
  { name: "Vendor Management Policy",        type: "Vendor Management Policy",      version: "1.3", status: "approved", reviewDate: "2025-09-30", approvalDate: "2024-03-01", approver: "VP Operations" },
  { name: "Access Control Policy",           type: "Access Control Policy",         version: "1.5", status: "approved", reviewDate: "2025-06-30", approvalDate: "2024-06-01", approver: "CISO" },
  { name: "Privacy Policy",                  type: "Privacy Policy",                version: "3.0", status: "approved", reviewDate: "2024-12-31", approvalDate: "2024-01-01", approver: "DPO" },  // overdue review
  { name: "Incident Response Policy",        type: "Incident Response Policy",      version: "2.0", status: "review",   reviewDate: "2025-03-31", approvalDate: null,          approver: null },
  { name: "Business Continuity Policy",      type: "Business Continuity Policy",    version: "1.0", status: "draft",    reviewDate: "2025-06-01", approvalDate: null,          approver: null },
  { name: "Data Retention Policy",           type: "Data Retention Policy",         version: "1.1", status: "expired",  reviewDate: "2024-06-30", approvalDate: "2023-06-30",  approver: "Head of Engineering" },
  { name: "Acceptable Use Policy",           type: "Acceptable Use Policy",         version: "1.0", status: "draft",    reviewDate: "2025-04-01", approvalDate: null,          approver: null },
];

let policiesCreated = 0;
for (const p of POLICIES) {
  const exists = await sql`
    select id from policies where organization_id = ${orgId} and name = ${p.name} limit 1
  `;
  if (exists.length) { log(`skip (exists): ${p.name}`); continue; }

  const pId = randomUUID();
  await sql`
    insert into policies (id, organization_id, name, policy_type, version, status, review_date, approval_date, approver, created_at, updated_at)
    values (${pId}, ${orgId}, ${p.name}, ${p.type}, ${p.version}, ${p.status},
            ${p.reviewDate}, ${p.approvalDate ?? null}, ${p.approver ?? null}, now(), now())
  `;

  // Add a version record for approved policies
  if (p.status === "approved" || p.status === "expired") {
    await sql`
      insert into policy_versions (id, policy_id, version, notes, approved_at, created_at)
      values (${randomUUID()}, ${pId}, ${p.version},
              ${"Approved by " + (p.approver ?? "Management")},
              ${p.approvalDate ? new Date(p.approvalDate) : new Date()}, now())
    `;
  }
  log(`+ ${p.name} (${p.status})`);
  policiesCreated++;
}
log(`Created: ${policiesCreated} policies`);

// ── 6. Gap analysis ─────────────────────────────────────────────────────────

head("6. Gap analysis");

for (const fw of frameworks) {
  const existingGaps = await sql`
    select count(*)::int n from gap_analysis where framework_id = ${fw.id} and organization_id = ${orgId}
  `;
  if (existingGaps[0].n > 0) {
    log(`${fw.name}: ${existingGaps[0].n} gaps already exist — skipping`);
    continue;
  }

  const controls = await sql`
    select id, control_ref, name, status, priority from controls
    where framework_id = ${fw.id}
  `;

  const policies = await sql`select id, name, status, review_date from policies where organization_id = ${orgId}`;
  const today    = new Date().toISOString().split("T")[0];
  const gaps     = [];

  for (const c of controls) {
    if (c.status === "not_applicable") continue;

    // Not implemented
    if (c.status === "not_implemented") {
      gaps.push({
        id: randomUUID(), organization_id: orgId, framework_id: fw.id,
        gap_type: "not_implemented", control_id: c.id, evidence_id: null,
        description: `Control ${c.control_ref} (${c.name}) is not implemented.`,
        severity: c.priority, is_ai_detected: false,
      });
    }

    // Check evidence mappings
    const mappings = await sql`
      select cem.evidence_id, e.status as ev_status
      from control_evidence_mappings cem
      inner join evidence e on e.id = cem.evidence_id
      where cem.control_id = ${c.id}
    `;

    if (mappings.length === 0 && c.status !== "not_implemented") {
      gaps.push({
        id: randomUUID(), organization_id: orgId, framework_id: fw.id,
        gap_type: "unmapped_control", control_id: c.id, evidence_id: null,
        description: `Control ${c.control_ref} (${c.name}) has no evidence mapped.`,
        severity: c.priority === "critical" ? "high" : c.priority,
        is_ai_detected: false,
      });
    } else if (mappings.length > 0) {
      const approved = mappings.filter(m => m.ev_status === "approved");
      const expired  = mappings.filter(m => m.ev_status === "expired");
      if (approved.length === 0 && expired.length > 0) {
        gaps.push({
          id: randomUUID(), organization_id: orgId, framework_id: fw.id,
          gap_type: "expired_evidence", control_id: c.id, evidence_id: expired[0].evidence_id,
          description: `Control ${c.control_ref} (${c.name}) has only expired evidence.`,
          severity: c.priority, is_ai_detected: false,
        });
      } else if (approved.length === 0) {
        gaps.push({
          id: randomUUID(), organization_id: orgId, framework_id: fw.id,
          gap_type: "missing_evidence", control_id: c.id, evidence_id: null,
          description: `Control ${c.control_ref} (${c.name}) has no approved evidence.`,
          severity: c.priority === "critical" ? "high" : c.priority,
          is_ai_detected: false,
        });
      }
    }
  }

  // Policy gaps
  for (const p of policies) {
    if (p.status === "expired") {
      gaps.push({
        id: randomUUID(), organization_id: orgId, framework_id: fw.id,
        gap_type: "expired_policy", control_id: null, evidence_id: null,
        description: `Policy "${p.name}" is expired.`,
        severity: "high", is_ai_detected: false,
      });
    } else if (p.review_date && p.review_date < today && p.status !== "archived") {
      gaps.push({
        id: randomUUID(), organization_id: orgId, framework_id: fw.id,
        gap_type: "expired_policy", control_id: null, evidence_id: null,
        description: `Policy "${p.name}" is overdue for review (was due ${p.review_date}).`,
        severity: "medium", is_ai_detected: false,
      });
    }
  }

  // Insert in chunks
  for (const g of gaps) {
    await sql`
      insert into gap_analysis (id, organization_id, framework_id, gap_type, control_id, evidence_id, description, severity, is_ai_detected, created_at, updated_at)
      values (${g.id}, ${g.organization_id}, ${g.framework_id}, ${g.gap_type},
              ${g.control_id ?? null}, ${g.evidence_id ?? null},
              ${g.description}, ${g.severity}, ${g.is_ai_detected}, now(), now())
    `;
  }

  const bySev = gaps.reduce((acc, g) => { acc[g.severity] = (acc[g.severity]||0)+1; return acc; }, {});
  log(`${fw.name}: ${gaps.length} gaps (${Object.entries(bySev).map(([s,n])=>`${s}=${n}`).join(' · ')})`);
}

// ── 7. Readiness scores ──────────────────────────────────────────────────────

head("7. Readiness scores");

const allPolicies = await sql`select status from policies where organization_id = ${orgId}`;
const totalPolicies   = allPolicies.length;
const approvedPolicies = allPolicies.filter(p => p.status === "approved").length;
const policyCoverage  = totalPolicies > 0 ? Math.round(approvedPolicies / totalPolicies * 100) : 100;

for (const fw of frameworks) {
  const controls = await sql`
    select id, status from controls where framework_id = ${fw.id}
  `;
  const applicable = controls.filter(c => c.status !== "not_applicable");
  const total = applicable.length;

  let controlPoints = 0;
  for (const c of applicable) {
    if (c.status === "implemented") controlPoints += 1;
    else if (c.status === "partial") controlPoints += 0.5;
  }
  const controlCoverage = total > 0 ? Math.round(controlPoints / total * 100) : 0;

  // Evidence coverage — controls with at least 1 approved evidence
  const coveredControls = await sql`
    select count(distinct cem.control_id)::int n
    from control_evidence_mappings cem
    inner join evidence e on e.id = cem.evidence_id
    inner join controls c on c.id = cem.control_id
    where c.framework_id = ${fw.id}
      and e.organization_id = ${orgId}
      and e.status = 'approved'
      and c.status != 'not_applicable'
  `;
  const coveredCount = coveredControls[0].n;
  const evidenceCoverage = total > 0 ? Math.round(coveredCount / total * 100) : 0;

  const overallScore = Math.round(controlCoverage * 0.5 + evidenceCoverage * 0.3 + policyCoverage * 0.2);

  await sql`
    insert into readiness_scores (id, organization_id, framework_id, overall_score, control_coverage, evidence_coverage, policy_coverage, computed_at)
    values (${randomUUID()}, ${orgId}, ${fw.id}, ${overallScore}, ${controlCoverage}, ${evidenceCoverage}, ${policyCoverage}, now())
    on conflict (organization_id, framework_id) do update set
      overall_score = ${overallScore},
      control_coverage = ${controlCoverage},
      evidence_coverage = ${evidenceCoverage},
      policy_coverage = ${policyCoverage},
      computed_at = now()
  `;
  log(`${fw.name}: overall=${overallScore}% (controls=${controlCoverage}% evidence=${evidenceCoverage}% policy=${policyCoverage}%)`);
}

// ── Summary ──────────────────────────────────────────────────────────────────

head("✅ Done");

const final = await sql`
  select
    (select count(*)::int from controls where organization_id = ${orgId} and status = 'implemented') as implemented,
    (select count(*)::int from controls where organization_id = ${orgId} and status = 'partial') as partial,
    (select count(*)::int from controls where organization_id = ${orgId} and status = 'not_implemented') as not_impl,
    (select count(*)::int from evidence where organization_id = ${orgId} and status = 'approved') as ev_approved,
    (select count(*)::int from control_evidence_mappings cem inner join controls c on c.id=cem.control_id where c.organization_id=${orgId}) as mappings,
    (select count(*)::int from policies where organization_id = ${orgId}) as policies,
    (select count(*)::int from gap_analysis where organization_id = ${orgId} and resolved_at is null) as gaps
`;
const f = final[0];
console.log(`
  Controls:   ${f.implemented} implemented · ${f.partial} partial · ${f.not_impl} not implemented
  Evidence:   ${f.ev_approved} approved items · ${f.mappings} control mappings
  Policies:   ${f.policies} total
  Open gaps:  ${f.gaps}
`);

await sql.end();
