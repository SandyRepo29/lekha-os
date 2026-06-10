/**
 * AUDT — Issue & Remediation Hub™ demo seed script.
 *
 * Seeds 10 realistic governance issues across all source modules with
 * tasks, comments, escalations, exceptions, and history entries.
 *
 * Idempotent — safe to re-run; skips existing issues by title.
 *
 * Prerequisites:
 *   1. Migration 0018_issue_remediation.sql applied
 *   2. node scripts/seed-demo.mjs  (optional — for vendor context)
 *
 * Usage: node scripts/seed-issues.mjs
 *        node scripts/seed-issues.mjs <orgId>
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
  console.error("No org found.");
  await sql.end();
  process.exit(1);
}

const { id: orgId, name: orgName } = orgs[0];
console.log(`\n🏢 Seeding issues for org: ${orgName} (${orgId})`);

const [owner] = await sql`select user_id from memberships where organization_id = ${orgId} and role = 'owner' limit 1`;
const ownerId = owner?.user_id ?? null;

// Helper: days offset from now
const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

// ── Issue definitions ───────────────────────────────────────────────────────
const issues = [
  {
    title: "DPDP Consent Records Missing for 3000+ Users",
    description:
      "Audit of the DPDP Privacy module has revealed that consent records are absent for over 3,000 user accounts created before the consent management workflow was activated. This is a direct violation of DPDP Act 2023 Section 6 and requires immediate remediation.",
    status: "open",
    severity: "critical",
    priority: "p1",
    source_module: "dpdp",
    due_date: daysFromNow(3),
    sla_days: 7,
    sla_breach: true,
    tags: ["dpdp", "consent", "regulatory", "breach-risk"],
  },
  {
    title: "AWS Vendor SOC2 Certification Expired",
    description:
      "The SOC 2 Type II certification for Amazon Web Services (vendor: AWS India) expired 45 days ago. No renewal has been initiated. Per vendor governance policy, all critical vendors must maintain valid certifications at all times.",
    status: "in_progress",
    severity: "high",
    priority: "p2",
    source_module: "vendor",
    due_date: daysFromNow(10),
    sla_days: 14,
    sla_breach: false,
    tags: ["vendor", "certification", "soc2", "aws"],
  },
  {
    title: "ISO 27001 Control A.12.6 — Vulnerability Management Failing",
    description:
      "Control effectiveness score for ISO 27001 A.12.6 (Management of Technical Vulnerabilities) has dropped below the acceptable threshold. Last control test resulted in a 'Failed' outcome. Three critical CVEs remain unpatched beyond the SLA window.",
    status: "open",
    severity: "high",
    priority: "p2",
    source_module: "control",
    due_date: daysFromNow(7),
    sla_days: 14,
    sla_breach: false,
    tags: ["control", "vulnerability", "iso27001", "patching"],
  },
  {
    title: "Payment Gateway Contract Renewal Overdue",
    description:
      "The master services agreement with the payment gateway provider expired 12 days ago. The contract renewal was flagged in the Contract Governance module but no action was taken. Operating without a valid contract creates legal and compliance exposure.",
    status: "in_progress",
    severity: "medium",
    priority: "p2",
    source_module: "contract",
    due_date: daysFromNow(5),
    sla_days: 30,
    sla_breach: false,
    tags: ["contract", "renewal", "payment", "legal"],
  },
  {
    title: "Audit Finding CA-2024-003 Remediation Overdue",
    description:
      "Corrective action CA-2024-003 from the Q4 2024 internal audit (Access Control Review) is 22 days past its due date. The finding relates to privilege escalation paths in the production environment. Escalation to exec level triggered.",
    status: "in_progress",
    severity: "medium",
    priority: "p2",
    source_module: "audit",
    due_date: daysFromNow(-22),
    sla_days: 30,
    sla_breach: true,
    tags: ["audit", "capa", "access-control", "overdue"],
  },
  {
    title: "Risk Treatment Action: Cloud DR Plan Not Tested",
    description:
      "The risk treatment action to conduct a full DR (Disaster Recovery) test for cloud workloads was scheduled for Q1 but has not been executed. The linked risk (Business Continuity — Cloud Failure) remains in 'mitigating' status without evidence of treatment.",
    status: "open",
    severity: "medium",
    priority: "p3",
    source_module: "risk",
    due_date: daysFromNow(14),
    sla_days: 30,
    sla_breach: false,
    tags: ["risk", "disaster-recovery", "bcp", "cloud"],
  },
  {
    title: "Policy Attestation Completion Below 80%",
    description:
      "The quarterly policy attestation cycle closed with only 64% of required team members completing attestation for the Acceptable Use Policy and Information Security Policy. Per compliance requirements, the threshold is 80% before the attestation period closes.",
    status: "open",
    severity: "low",
    priority: "p3",
    source_module: "policy",
    due_date: daysFromNow(20),
    sla_days: 90,
    sla_breach: false,
    tags: ["policy", "attestation", "awareness", "compliance"],
  },
  {
    title: "Data Residency Violation — Logs Stored Outside India",
    description:
      "A compliance review of the infrastructure configuration detected that application logs are being streamed and retained in a US-East-1 region bucket. Under DPDP Act 2023 and internal data governance policy, all sensitive operational logs for Indian users must remain within India (ap-south-1).",
    status: "in_progress",
    severity: "high",
    priority: "p1",
    source_module: "compliance",
    due_date: daysFromNow(7),
    sla_days: 14,
    sla_breach: false,
    tags: ["data-residency", "dpdp", "compliance", "logs", "india"],
  },
  {
    title: "Third-Party Breach Notification Received — Razorpay",
    description:
      "Razorpay issued a security advisory notifying customers of a potential data exposure incident affecting merchant API keys. Our integration with Razorpay uses stored API credentials. Immediate key rotation and impact assessment is required.",
    status: "open",
    severity: "critical",
    priority: "p1",
    source_module: "vendor",
    due_date: daysFromNow(2),
    sla_days: 7,
    sla_breach: false,
    tags: ["vendor", "breach", "razorpay", "api-keys", "incident"],
  },
  {
    title: "Quarterly VAPT Report Not Uploaded",
    description:
      "The Q1 Vulnerability Assessment and Penetration Testing (VAPT) report was due to be uploaded into the Evidence Vault by March 31. The report has since been received from the third-party testing firm and uploaded. Issue resolved.",
    status: "resolved",
    severity: "low",
    priority: "p4",
    source_module: "audit",
    due_date: daysFromNow(-60),
    resolved_at: daysFromNow(-2),
    resolution_notes: "VAPT report (Q1-2025-VAPT-v1.2.pdf) uploaded to Evidence Vault and linked to ISO 27001 control A.18.2.3. Finding closed.",
    sla_days: 90,
    sla_breach: false,
    tags: ["vapt", "evidence", "audit", "pen-test"],
  },
];

// ── Seed issues ─────────────────────────────────────────────────────────────
head("Seeding issues");

const issueIds = [];

for (const issue of issues) {
  const [existing] = await sql`
    select id from issues
    where organization_id = ${orgId} and title = ${issue.title}
    limit 1
  `;

  if (existing) {
    log(`SKIP  ${issue.title}`);
    issueIds.push(existing.id);
    continue;
  }

  const id = randomUUID();
  await sql`
    insert into issues (
      id, organization_id, title, description,
      issue_type, status, severity, priority, source_module,
      due_date, resolved_date, resolution_notes,
      sla_days, sla_breached,
      assignee_id, owner_id, created_by,
      created_at, updated_at
    ) values (
      ${id}, ${orgId}, ${issue.title}, ${issue.description},
      ${issue.issue_type ?? 'custom'}, ${issue.status}, ${issue.severity}, ${issue.priority}, ${issue.source_module},
      ${issue.due_date ?? null}, ${issue.resolved_at ?? null}, ${issue.resolution_notes ?? null},
      ${issue.sla_days}, ${issue.sla_breach ?? false},
      ${ownerId}, ${ownerId}, ${ownerId},
      now(), now()
    )
  `;
  log(`✓     ${issue.title}`);
  issueIds.push(id);
}

// ── Tasks ────────────────────────────────────────────────────────────────────
head("Seeding tasks");

const taskDefs = [
  // Issue 0 — DPDP Consent Records Missing
  [
    { title: "Export list of user accounts missing consent records", status: "done" },
    { title: "Implement retroactive consent capture workflow", status: "in_progress" },
    { title: "Notify DPO and initiate regulatory disclosure review", status: "open" },
  ],
  // Issue 1 — AWS SOC2 Expired
  [
    { title: "Contact AWS account manager to obtain renewed certificate", status: "done" },
    { title: "Update vendor document with new SOC2 certificate once received", status: "open" },
    { title: "Set renewal reminder 60 days before next expiry", status: "open" },
  ],
  // Issue 2 — ISO 27001 Control Failing
  [
    { title: "Patch all open CVEs rated Critical and High in vulnerability scanner", status: "in_progress" },
    { title: "Re-run control test and submit evidence to Evidence Vault", status: "open" },
  ],
  // Issue 3 — Payment Gateway Contract
  [
    { title: "Obtain latest contract draft from legal team", status: "done" },
    { title: "Schedule contract review meeting with payment gateway vendor", status: "in_progress" },
    { title: "Execute and upload signed renewal agreement", status: "open" },
  ],
  // Issue 4 — Audit Finding CA-2024-003
  [
    { title: "Remediate privilege escalation path in IAM configuration", status: "in_progress" },
    { title: "Conduct post-remediation access control review", status: "open" },
  ],
  // Issue 5 — Cloud DR Plan
  [
    { title: "Schedule DR test date with infrastructure team", status: "open" },
    { title: "Prepare DR test runbook and success criteria document", status: "open" },
    { title: "Execute DR test and capture evidence", status: "open" },
  ],
  // Issue 6 — Policy Attestation
  [
    { title: "Send reminder email to all non-compliant team members", status: "done" },
    { title: "Escalate to department heads for employees who remain non-compliant", status: "open" },
  ],
  // Issue 7 — Data Residency Violation
  [
    { title: "Identify all log streams currently routing to US-East-1", status: "done" },
    { title: "Reconfigure log shipping to ap-south-1 S3 bucket", status: "in_progress" },
    { title: "Delete or migrate existing logs from non-compliant region", status: "open" },
  ],
  // Issue 8 — Razorpay Breach
  [
    { title: "Rotate all Razorpay API keys immediately", status: "in_progress" },
    { title: "Audit transaction history for anomalous activity in last 30 days", status: "open" },
    { title: "Update integration config in AUDT with new rotated keys", status: "open" },
  ],
  // Issue 9 — VAPT Report
  [
    { title: "Receive VAPT report from testing firm", status: "done" },
    { title: "Upload report to Evidence Vault", status: "done" },
  ],
];

for (let i = 0; i < issueIds.length; i++) {
  const issueId = issueIds[i];
  const tasks = taskDefs[i] ?? [];
  for (const task of tasks) {
    const [ex] = await sql`
      select id from issue_tasks
      where issue_id = ${issueId} and title = ${task.title}
      limit 1
    `;
    if (ex) { log(`SKIP task  ${task.title}`); continue; }
    const taskStatus = task.status === "done" ? "completed" : task.status;
    await sql`
      insert into issue_tasks (
        id, issue_id, organization_id, title, description,
        status, owner_id, due_date, completed_at, created_at, updated_at
      ) values (
        ${randomUUID()}, ${issueId}, ${orgId}, ${task.title}, null,
        ${taskStatus}, ${ownerId},
        ${taskStatus === "completed" ? daysFromNow(-5) : daysFromNow(14)},
        ${taskStatus === "completed" ? daysFromNow(-5) : null},
        now(), now()
      )
    `;
    log(`✓ task  ${task.title}`);
  }
}

// ── Comments ─────────────────────────────────────────────────────────────────
head("Seeding comments");

const commentDefs = [
  // Issue 0
  [
    { content: "DPO has been briefed. We are assessing whether this constitutes a reportable breach under DPDP Section 8.", is_internal: true },
    { content: "Engineering team confirmed the consent capture flow was only enabled in v2.4.0 — all accounts created before that date are affected.", is_internal: false },
  ],
  // Issue 1
  [
    { content: "Reached out to AWS account manager. Expecting the renewed SOC2 report within 5 business days.", is_internal: false },
  ],
  // Issue 2
  [
    { content: "Security team has prioritised the three critical CVEs. Patches scheduled for maintenance window this Saturday.", is_internal: true },
    { content: "Control owner confirmed: the vulnerability scanner is now running daily instead of weekly as part of this remediation.", is_internal: false },
  ],
  // Issue 3
  [
    { content: "Legal review is underway. Contract terms have changed — new SLA clauses being negotiated.", is_internal: true },
  ],
  // Issue 4
  [
    { content: "This finding has been open for 52 days total. Escalating to exec level per SLA policy.", is_internal: true },
    { content: "IAM audit completed. Two overprivileged service accounts identified and flagged for removal.", is_internal: false },
  ],
  // Issue 5
  [
    { content: "DR testing has historically been deferred due to maintenance window conflicts. Aligning with infrastructure team to find an appropriate slot.", is_internal: false },
  ],
  // Issue 6
  [
    { content: "HR has agreed to include attestation completion in the Q2 performance review cycle for non-compliant employees.", is_internal: true },
  ],
  // Issue 7
  [
    { content: "Root cause: Datadog log forwarding was configured to a legacy US bucket when the monitoring stack was set up in 2023. Not caught during migration.", is_internal: true },
    { content: "New ap-south-1 bucket provisioned. Reconfiguration in progress.", is_internal: false },
  ],
  // Issue 8
  [
    { content: "URGENT: All production API keys for Razorpay integration must be treated as compromised until rotated. Do not use existing keys for any new transactions.", is_internal: true },
    { content: "Transaction review for past 30 days shows no suspicious activity so far. Continuing full audit.", is_internal: false },
  ],
  // Issue 9
  [
    { content: "Report uploaded and linked to control A.18.2.3. Issue resolved — closing.", is_internal: false },
  ],
];

for (let i = 0; i < issueIds.length; i++) {
  const issueId = issueIds[i];
  for (const comment of (commentDefs[i] ?? [])) {
    const [ex] = await sql`
      select id from issue_comments
      where issue_id = ${issueId} and content = ${comment.content}
      limit 1
    `;
    if (ex) { log(`SKIP comment`); continue; }
    await sql`
      insert into issue_comments (
        id, issue_id, organization_id, content, author_id, created_at, updated_at
      ) values (
        ${randomUUID()}, ${issueId}, ${orgId}, ${comment.content},
        ${ownerId}, now(), now()
      )
    `;
    log(`✓ comment  "${comment.content.slice(0, 60)}..."`);
  }
}

// ── Escalations — Issue 0 (DPDP) and Issue 4 (Audit Finding) ────────────────
head("Seeding escalations");

const escalationDefs = [
  { issueIdx: 0, reason: "Critical regulatory breach affecting 3000+ users. DPO escalating to executive leadership for immediate decision on regulatory disclosure and emergency remediation budget.", level: "executive" },
  { issueIdx: 4, reason: "CAPA remediation is 22 days overdue. Risk of audit finding remaining open during the upcoming external audit window. Exec awareness required for resource allocation.", level: "executive" },
];

for (const esc of escalationDefs) {
  const issueId = issueIds[esc.issueIdx];
  const [ex] = await sql`
    select id from issue_escalations
    where issue_id = ${issueId} and reason = ${esc.reason}
    limit 1
  `;
  if (ex) { log(`SKIP escalation for issue ${esc.issueIdx}`); continue; }
  await sql`
    insert into issue_escalations (
      id, issue_id, organization_id, escalated_to, escalated_by,
      reason, acknowledged_at, resolved_at, created_at
    ) values (
      ${randomUUID()}, ${issueId}, ${orgId}, ${esc.level}, ${ownerId},
      ${esc.reason}, null, null, now()
    )
  `;
  log(`✓ escalation (${esc.level}) for issue ${esc.issueIdx}`);
}

// ── Exception — Issue 6 (Policy Attestation) ────────────────────────────────
head("Seeding exceptions");

const exceptionReason =
  "Requesting a 15-day exception for the attestation completion threshold to allow the recently onboarded team members (Q2 joiners) sufficient time to complete mandatory onboarding training before policy attestation. These accounts were created after the attestation cycle opened.";

const [exEx] = await sql`
  select id from issue_exceptions
  where issue_id = ${issueIds[6]} and business_justification = ${exceptionReason}
  limit 1
`;
if (!exEx) {
  await sql`
    insert into issue_exceptions (
      id, issue_id, organization_id, business_justification, created_by,
      approver_id, status, expiry_date, created_at, updated_at
    ) values (
      ${randomUUID()}, ${issueIds[6]}, ${orgId}, ${exceptionReason}, ${ownerId},
      null, 'pending', ${daysFromNow(15)},
      now(), now()
    )
  `;
  log(`✓ exception (pending) for issue 6`);
} else {
  log(`SKIP exception for issue 6`);
}

// ── History ──────────────────────────────────────────────────────────────────
head("Seeding history");

const historyDefs = [
  // Issue 0 — DPDP
  [
    { field: "status", old: "open", new: "open", note: "Issue created" },
    { field: "severity", old: "high", new: "critical", note: "Severity escalated after impact assessment confirmed 3000+ affected users" },
    { field: "sla_breach", old: "false", new: "true", note: "SLA breached — 7-day window exceeded" },
  ],
  // Issue 1 — AWS SOC2
  [
    { field: "status", old: "open", new: "in_progress", note: "Assigned to vendor governance team" },
    { field: "priority", old: "p1", new: "p2", note: "Downgraded from P1 after vendor confirmed renewal in progress" },
  ],
  // Issue 4 — Audit Finding
  [
    { field: "status", old: "open", new: "in_progress", note: "CAPA owner began remediation" },
    { field: "status", old: "in_progress", new: "escalated", note: "Auto-escalated by SLA monitoring rule — 22 days overdue" },
  ],
  // Issue 7 — Data Residency
  [
    { field: "status", old: "open", new: "in_progress", note: "Infrastructure team assigned and root cause identified" },
  ],
  // Issue 8 — Razorpay
  [
    { field: "status", old: "open", new: "open", note: "Issue created from vendor breach notification" },
    { field: "priority", old: "p2", new: "p1", note: "Escalated to P1 after security team review" },
  ],
  // Issue 9 — VAPT
  [
    { field: "status", old: "open", new: "in_progress", note: "Report received from testing firm" },
    { field: "status", old: "in_progress", new: "resolved", note: "Report uploaded to Evidence Vault and linked to ISO 27001 A.18.2.3" },
  ],
];

// Map issue indices to history entries
const historyIssueIndices = [0, 1, 4, 7, 8, 9];
for (let hi = 0; hi < historyIssueIndices.length; hi++) {
  const issueIdx = historyIssueIndices[hi];
  const issueId = issueIds[issueIdx];
  for (const h of historyDefs[hi]) {
    const [ex] = await sql`
      select id from issue_history
      where issue_id = ${issueId} and field_changed = ${h.field} and new_value = ${h.new}
      limit 1
    `;
    if (ex) { log(`SKIP history  ${h.note}`); continue; }
    await sql`
      insert into issue_history (
        id, issue_id, organization_id, changed_by,
        field_changed, old_value, new_value, created_at
      ) values (
        ${randomUUID()}, ${issueId}, ${orgId}, ${ownerId},
        ${h.field}, ${h.old}, ${h.new}, now()
      )
    `;
    log(`✓ history  ${h.note}`);
  }
}

// ── Done ─────────────────────────────────────────────────────────────────────
await sql.end();
console.log("\n✅ Done.");
