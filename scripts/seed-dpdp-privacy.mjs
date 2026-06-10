import postgres from "postgres";
import { config } from "dotenv";
import { randomUUID } from "crypto";
config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });
const log  = (msg) => console.log(`  ${msg}`);
const head = (msg) => console.log(`\n▶ ${msg}`);

const targetId = process.argv[2] ?? null;
const orgs = targetId
  ? await sql`select id, name from organizations where id = ${targetId}`
  : await sql`select id, name from organizations where name = 'admin corp' order by created_at limit 1`;

if (!orgs.length) { console.error("No org found."); await sql.end(); process.exit(1); }
const { id: orgId, name: orgName } = orgs[0];
log(`Seeding DPDP Privacy™ data for org: ${orgName} (${orgId})`);

const [owner] = await sql`select user_id from memberships where organization_id = ${orgId} and role = 'owner' limit 1`;
const ownerId = owner?.user_id ?? null;

// ── 1. DATA ASSETS ──────────────────────────────────────────────────────────
head("Data Assets");

const dataAssetDefs = [
  {
    name: "Customer PII Database",
    description: "Personal identifiable information of customers including name, email, phone, and address collected during account registration and transactions.",
    data_category: "customer",
    sensitivity: "high",
    department: "Engineering",
    purpose: "Account management, service delivery, and customer support under DPDP Act 2023 Section 4.",
    storage_location: "Supabase Postgres — ap-south-1 (Mumbai)",
    retention_period: 1095, // 3 years in days
    cross_border: false,
    status: "active",
    health_score: 82,
  },
  {
    name: "Employee HR Records",
    description: "Employee personal data including Aadhaar, PAN, salary, performance appraisals, and employment contracts.",
    data_category: "employee",
    sensitivity: "critical",
    department: "Human Resources",
    purpose: "Payroll processing, statutory compliance (PF, ESI, TDS), and employment management.",
    storage_location: "AWS S3 — ap-south-1 (Mumbai) — encrypted at rest",
    retention_period: 2555, // 7 years in days
    cross_border: false,
    status: "active",
    health_score: 91,
  },
  {
    name: "Vendor Onboarding Data",
    description: "Vendor company details, contact persons, GSTIN, bank account info, and compliance documents collected during vendor onboarding.",
    data_category: "vendor",
    sensitivity: "medium",
    department: "Procurement",
    purpose: "Vendor due diligence, contract management, and payment processing.",
    storage_location: "Supabase Storage — ap-south-1 (Mumbai)",
    retention_period: 2555, // 7 years for financial records
    cross_border: false,
    status: "active",
    health_score: 74,
  },
  {
    name: "Product Analytics Events",
    description: "Behavioural analytics data including page views, feature usage, session duration, and click events collected via in-app instrumentation.",
    data_category: "marketing",
    sensitivity: "low",
    department: "Product",
    purpose: "Product improvement and user experience analytics. Data is pseudonymised before storage.",
    storage_location: "Google BigQuery — us-central1 (Iowa)",
    retention_period: 365, // 1 year
    cross_border: true,
    status: "active",
    health_score: 58,
  },
  {
    name: "Financial Transaction Records",
    description: "Payment records, invoice data, subscription billing history, and refund transactions linked to customer accounts.",
    data_category: "financial",
    sensitivity: "critical",
    department: "Finance",
    purpose: "Revenue accounting, GST compliance, fraud detection, and financial reporting under Companies Act.",
    storage_location: "Supabase Postgres — ap-south-1 (Mumbai)",
    retention_period: 2555, // 7 years
    cross_border: false,
    status: "active",
    health_score: 88,
  },
];

const assetIds = {};
for (const asset of dataAssetDefs) {
  const [existing] = await sql`select id from data_assets where organization_id = ${orgId} and name = ${asset.name} limit 1`;
  if (existing) {
    log(`skip (exists): ${asset.name}`);
    assetIds[asset.name] = existing.id;
    continue;
  }
  const [row] = await sql`
    insert into data_assets
      (id, organization_id, name, description, owner_id, department, data_category,
       sensitivity, purpose, storage_location, retention_period, cross_border, status, health_score)
    values
      (${randomUUID()}, ${orgId}, ${asset.name}, ${asset.description}, ${ownerId},
       ${asset.department}, ${asset.data_category}, ${asset.sensitivity}, ${asset.purpose},
       ${asset.storage_location}, ${asset.retention_period}, ${asset.cross_border},
       ${asset.status}, ${asset.health_score})
    returning id
  `;
  assetIds[asset.name] = row.id;
  log(`created: ${asset.name}`);
}

// ── 2. RETENTION POLICIES ────────────────────────────────────────────────────
head("Retention Policies");

const retentionPolicyDefs = [
  {
    name: "Customer Data Retention — 3 Years",
    description: "Customer PII retained for 3 years from last transaction date per DPDP Act 2023 guidelines and business necessity.",
    data_category: "customer",
    retention_days: 1095,
    legal_basis: "DPDP Act 2023 — Section 8(7): Personal data must be erased once the purpose is served or consent is withdrawn, unless retention is required by law.",
    action_on_expiry: "delete",
    is_active: true,
  },
  {
    name: "Employee Records Retention — 7 Years",
    description: "Employee HR and payroll records retained for 7 years post-employment as mandated by Income Tax Act, Provident Fund Act, and labour laws.",
    data_category: "employee",
    retention_days: 2555,
    legal_basis: "Income Tax Act 1961 — Section 44AA; Provident Fund Act — Rule 18; Companies Act 2013 — Section 128. Statutory minimum 7-year retention.",
    action_on_expiry: "archive",
    is_active: true,
  },
  {
    name: "System Logs — 1 Year",
    description: "Application access logs, audit trails, and security event logs retained for 12 months for incident investigation and compliance audits.",
    data_category: "custom",
    retention_days: 365,
    legal_basis: "IT Act 2000 — Section 67C and CERT-In guidelines require log retention for minimum 180 days; internal policy extends to 1 year.",
    action_on_expiry: "delete",
    is_active: true,
  },
];

const retentionPolicyIds = {};
for (const policy of retentionPolicyDefs) {
  const [existing] = await sql`select id from retention_policies where organization_id = ${orgId} and name = ${policy.name} limit 1`;
  if (existing) {
    log(`skip (exists): ${policy.name}`);
    retentionPolicyIds[policy.name] = existing.id;
    continue;
  }
  const [row] = await sql`
    insert into retention_policies
      (id, organization_id, name, description, data_category, retention_days,
       legal_basis, action_on_expiry, is_active)
    values
      (${randomUUID()}, ${orgId}, ${policy.name}, ${policy.description}, ${policy.data_category},
       ${policy.retention_days}, ${policy.legal_basis}, ${policy.action_on_expiry}, ${policy.is_active})
    returning id
  `;
  retentionPolicyIds[policy.name] = row.id;
  log(`created: ${policy.name}`);
}

// ── 3. CONSENT RECORDS ───────────────────────────────────────────────────────
head("Consent Records");

const now = new Date();
const daysAgo = (n) => new Date(now - n * 86400000).toISOString();
const daysFromNow = (n) => new Date(+now + n * 86400000).toISOString();

const consentDefs = [
  {
    subject_id: "cust-10021",
    subject_name: "Priya Sharma",
    subject_email: "priya.sharma@example.com",
    purpose: "Marketing communications and promotional offers via email and SMS",
    consent_status: "granted",
    data_asset: "Customer PII Database",
    obtained_at: daysAgo(180),
    expires_at: daysFromNow(185),
    source: "signup_form",
    notes: "Obtained via double opt-in during account creation. IP logged.",
  },
  {
    subject_id: "cust-10045",
    subject_name: "Rahul Mehta",
    subject_email: "rahul.mehta@example.com",
    purpose: "Product analytics and usage tracking for service improvement",
    consent_status: "granted",
    data_asset: "Product Analytics Events",
    obtained_at: daysAgo(90),
    expires_at: daysFromNow(275),
    source: "cookie_banner",
    notes: "Granular consent obtained via cookie consent manager. Analytics consent only.",
  },
  {
    subject_id: "cust-10078",
    subject_name: "Anjali Patel",
    subject_email: "anjali.patel@example.com",
    purpose: "Marketing communications and promotional offers",
    consent_status: "withdrawn",
    data_asset: "Customer PII Database",
    obtained_at: daysAgo(300),
    expires_at: daysFromNow(65),
    withdrawn_at: daysAgo(15),
    source: "signup_form",
    notes: "Consent withdrawn via unsubscribe link. Email marketing stopped immediately. Data suppression list updated.",
  },
  {
    subject_id: "cust-10099",
    subject_name: "Vikram Singh",
    subject_email: "vikram.singh@example.com",
    purpose: "Service delivery, account management, and billing",
    consent_status: "granted",
    data_asset: "Customer PII Database",
    obtained_at: daysAgo(365),
    expires_at: daysFromNow(730),
    source: "terms_acceptance",
    notes: "Consent bundled with Terms of Service acceptance at account creation. Lawful basis: contract performance.",
  },
  {
    subject_id: "cust-10112",
    subject_name: "Sunita Rao",
    subject_email: "sunita.rao@example.com",
    purpose: "Product analytics and usage tracking",
    consent_status: "expired",
    data_asset: "Product Analytics Events",
    obtained_at: daysAgo(400),
    expires_at: daysAgo(35),
    source: "cookie_banner",
    notes: "Consent expired 35 days ago. Analytics events for this user suppressed pending renewal.",
  },
  {
    subject_id: "emp-2031",
    subject_name: "Arjun Nair",
    subject_email: "arjun.nair@adminc.in",
    purpose: "HR data processing — payroll, attendance, performance management",
    consent_status: "granted",
    data_asset: "Employee HR Records",
    obtained_at: daysAgo(540),
    expires_at: null,
    source: "employment_contract",
    notes: "Obtained at onboarding. Covers Aadhaar, PAN, bank details, salary. Statutory and contractual basis.",
  },
  {
    subject_id: "emp-2045",
    subject_name: "Meena Krishnan",
    subject_email: "meena.krishnan@adminc.in",
    purpose: "HR data processing — payroll, attendance, performance management",
    consent_status: "granted",
    data_asset: "Employee HR Records",
    obtained_at: daysAgo(210),
    expires_at: null,
    source: "employment_contract",
    notes: "Consent obtained at onboarding. DPDP notice issued.",
  },
  {
    subject_id: "cust-10155",
    subject_name: "Deepak Gupta",
    subject_email: "deepak.gupta@example.com",
    purpose: "Marketing communications",
    consent_status: "rejected",
    data_asset: "Customer PII Database",
    obtained_at: null,
    expires_at: null,
    source: "signup_form",
    notes: "User explicitly declined marketing consent at signup. Preference recorded.",
  },
  {
    subject_id: "cust-10201",
    subject_name: "Kavya Reddy",
    subject_email: "kavya.reddy@example.com",
    purpose: "Service delivery and account management",
    consent_status: "pending",
    data_asset: "Customer PII Database",
    obtained_at: null,
    expires_at: null,
    source: "email_request",
    notes: "Consent notice sent via email. Awaiting acknowledgement for updated privacy policy (v2.3).",
  },
  {
    subject_id: "cust-10230",
    subject_name: "Anil Kumar",
    subject_email: "anil.kumar@example.com",
    purpose: "Product analytics and usage tracking",
    consent_status: "withdrawn",
    data_asset: "Product Analytics Events",
    obtained_at: daysAgo(150),
    expires_at: daysFromNow(215),
    withdrawn_at: daysAgo(5),
    source: "cookie_banner",
    notes: "Consent withdrawn via account privacy settings. Analytics events deletion job queued.",
  },
];

for (const consent of consentDefs) {
  const [existing] = await sql`
    select id from consent_records
    where organization_id = ${orgId} and subject_id = ${consent.subject_id} and purpose = ${consent.purpose}
    limit 1
  `;
  if (existing) {
    log(`skip (exists): ${consent.subject_name} — ${consent.purpose.slice(0, 40)}...`);
    continue;
  }
  const assetId = assetIds[consent.data_asset] ?? null;
  await sql`
    insert into consent_records
      (id, organization_id, subject_id, subject_name, subject_email, purpose,
       consent_status, data_asset_id, obtained_at, expires_at, withdrawn_at, source, notes)
    values
      (${randomUUID()}, ${orgId}, ${consent.subject_id}, ${consent.subject_name},
       ${consent.subject_email}, ${consent.purpose}, ${consent.consent_status},
       ${assetId}, ${consent.obtained_at ?? null}, ${consent.expires_at ?? null},
       ${consent.withdrawn_at ?? null}, ${consent.source}, ${consent.notes})
  `;
  log(`created: ${consent.subject_name} (${consent.consent_status})`);
}

// ── 4. PRIVACY REQUESTS (DSR) ────────────────────────────────────────────────
head("Privacy Requests (DSR)");

const privacyRequestDefs = [
  {
    request_type: "access",
    subject_name: "Priya Sharma",
    subject_email: "priya.sharma@example.com",
    status: "completed",
    description: "Data subject requests a copy of all personal data held about them including purchase history, profile data, and communication logs.",
    submitted_at: daysAgo(25),
    due_date: daysAgo(10), // DPDP 30-day response window from submission
    completed_at: daysAgo(12),
    resolution_notes: "Full data export provided via secure download link. Included profile data, 14 transaction records, and 3 years of communication history. Download link expired after 48 hours.",
  },
  {
    request_type: "deletion",
    subject_name: "Anjali Patel",
    subject_email: "anjali.patel@example.com",
    status: "completed",
    description: "Right to erasure request following consent withdrawal. Requests deletion of all marketing data and profile information.",
    submitted_at: daysAgo(18),
    due_date: daysAgo(3),
    completed_at: daysAgo(5),
    resolution_notes: "Marketing profile deleted. Account anonymised. Financial transaction records retained per Income Tax Act retention requirements (7 years). Subject notified of partial deletion with legal basis explanation.",
  },
  {
    request_type: "access",
    subject_name: "Deepak Gupta",
    subject_email: "deepak.gupta@example.com",
    status: "investigating",
    description: "Data subject requests detailed breakdown of all personal data categories processed, purposes, and third-party sharing.",
    submitted_at: daysAgo(8),
    due_date: daysFromNow(22),
    completed_at: null,
    resolution_notes: null,
  },
  {
    request_type: "correction",
    subject_name: "Vikram Singh",
    subject_email: "vikram.singh@example.com",
    status: "submitted",
    description: "Request to correct incorrect date of birth and update registered mobile number in account profile.",
    submitted_at: daysAgo(2),
    due_date: daysFromNow(28),
    completed_at: null,
    resolution_notes: null,
  },
  {
    request_type: "portability",
    subject_name: "Kavya Reddy",
    subject_email: "kavya.reddy@example.com",
    status: "assigned",
    description: "Data portability request — export all data in machine-readable format (JSON/CSV) to facilitate migration to competing service.",
    submitted_at: daysAgo(5),
    due_date: daysFromNow(25),
    completed_at: null,
    resolution_notes: "Assigned to data engineering team. Export job scheduled for this week.",
  },
];

for (const req of privacyRequestDefs) {
  const [existing] = await sql`
    select id from privacy_requests
    where organization_id = ${orgId} and subject_email = ${req.subject_email}
      and request_type = ${req.request_type} and submitted_at::date = ${req.submitted_at.slice(0, 10)}
    limit 1
  `;
  if (existing) {
    log(`skip (exists): ${req.subject_name} — ${req.request_type}`);
    continue;
  }
  await sql`
    insert into privacy_requests
      (id, organization_id, request_type, subject_name, subject_email, status,
       owner_id, description, submitted_at, due_date, completed_at, resolution_notes)
    values
      (${randomUUID()}, ${orgId}, ${req.request_type}, ${req.subject_name}, ${req.subject_email},
       ${req.status}, ${ownerId}, ${req.description}, ${req.submitted_at},
       ${req.due_date}, ${req.completed_at ?? null}, ${req.resolution_notes ?? null})
  `;
  log(`created: ${req.subject_name} — ${req.request_type} (${req.status})`);
}

// ── 5. RETENTION EVENTS ──────────────────────────────────────────────────────
head("Retention Events");

const retentionEventDefs = [
  {
    data_asset: "Product Analytics Events",
    retention_policy: "System Logs — 1 Year",
    event_type: "scheduled_deletion",
    scheduled_date: daysFromNow(30),
    actioned_at: null,
    notes: "Scheduled deletion of analytics events older than 365 days. Covers ~2.4M pseudonymised events. Deletion job to run in next maintenance window.",
  },
  {
    data_asset: "Customer PII Database",
    retention_policy: "Customer Data Retention — 3 Years",
    event_type: "retention_review",
    scheduled_date: daysAgo(10),
    actioned_at: daysAgo(8),
    notes: "Quarterly retention review completed. 347 inactive customer records flagged for deletion (last activity > 3 years). Deletion scheduled after 30-day notice period.",
  },
  {
    data_asset: "Employee HR Records",
    retention_policy: "Employee Records Retention — 7 Years",
    event_type: "archive",
    scheduled_date: daysFromNow(90),
    actioned_at: null,
    notes: "15 ex-employee records (departed > 7 years ago) scheduled for archival to cold storage. Records will be encrypted and moved to long-term archive bucket.",
  },
];

for (const event of retentionEventDefs) {
  const assetId = assetIds[event.data_asset];
  if (!assetId) { log(`skip (asset not found): ${event.data_asset}`); continue; }

  const policyId = retentionPolicyIds[event.retention_policy] ?? null;

  const [existing] = await sql`
    select id from retention_events
    where organization_id = ${orgId} and data_asset_id = ${assetId}
      and event_type = ${event.event_type} and scheduled_date::date = ${event.scheduled_date.slice(0, 10)}
    limit 1
  `;
  if (existing) {
    log(`skip (exists): ${event.event_type} for ${event.data_asset}`);
    continue;
  }
  await sql`
    insert into retention_events
      (id, organization_id, data_asset_id, retention_policy_id, event_type,
       scheduled_date, actioned_at, actioned_by, notes)
    values
      (${randomUUID()}, ${orgId}, ${assetId}, ${policyId}, ${event.event_type},
       ${event.scheduled_date}, ${event.actioned_at ?? null},
       ${event.actioned_at ? ownerId : null}, ${event.notes})
  `;
  log(`created: ${event.event_type} for ${event.data_asset}`);
}

// ── 6. PRIVACY ASSESSMENTS (DPIA/PIA) ───────────────────────────────────────
head("Privacy Assessments");

const privacyAssessmentDefs = [
  {
    title: "DPIA — Customer Data Processing Platform",
    scope: "End-to-end assessment of personal data processing in the core SaaS platform covering data collection, storage, access controls, retention, and deletion workflows for all customer personal data.",
    risk_level: "high",
    status: "approved",
    purpose: "Mandatory DPIA under DPDP Act 2023 for large-scale processing of customer personal data. Covers ~50,000 data subjects.",
    data_types: "Name, email, phone, address, payment card (tokenised), transaction history, behavioural analytics, device identifiers",
    risks: "1. Unauthorised access via compromised credentials (HIGH)\n2. Data breach via SQL injection or API misconfiguration (HIGH)\n3. Cross-border transfer to analytics vendors without adequate safeguards (MEDIUM)\n4. Excessive data collection beyond stated purpose (MEDIUM)\n5. Inadequate consent withdrawal mechanism (LOW)",
    mitigations: "1. MFA enforced for all admin accounts; API key rotation policy\n2. Parameterised queries (Drizzle ORM); WAF enabled; penetration test Q1 2026\n3. SCCs signed with US analytics vendor; transfer impact assessment completed\n4. Data minimisation review completed — 3 fields removed from collection form\n5. One-click consent withdrawal implemented in account settings",
    controls: "ISO 27001 A.8.2 (Information Classification) · A.9.4 (Access Control) · DPDP Act Section 8 (Obligations of Data Fiduciary) · SOC 2 CC6.1 · PCI DSS Req 3 (Protect Stored Data)",
    residual_risk: "Low — all high risks mitigated to acceptable levels. Residual risk accepted by CISO and DPO. Next review in 12 months or upon material system change.",
    approved_at: daysAgo(30),
    review_date: daysFromNow(335),
    ai_summary: "DPIA completed for customer data processing platform. Initial risk level HIGH reduced to LOW after implementation of 5 mitigation controls. Key findings: MFA gap closed, SQL injection risk mitigated via Drizzle ORM, cross-border transfer SCCs executed. DPO approved. Next review due in 11 months.",
  },
  {
    title: "PIA — Product Analytics Feature (Session Recording)",
    scope: "Privacy Impact Assessment for proposed session recording and heatmap feature using third-party analytics SDK. Assesses privacy risks of capturing user interaction data including click patterns, scroll depth, and form interactions.",
    risk_level: "medium",
    status: "in_progress",
    purpose: "New product feature assessment prior to launch. Feature would capture session replay data for UX improvement. Requires fresh consent as it represents a new processing purpose.",
    data_types: "Session recordings (potentially capturing form inputs), mouse movements, scroll behaviour, page navigation, device/browser fingerprint",
    risks: "1. Accidental capture of sensitive form data (passwords, payment details) in recordings (HIGH)\n2. Third-party SDK data access — vendor may use data for own purposes (MEDIUM)\n3. Lack of granular consent for session recording beyond general analytics (MEDIUM)\n4. Long-term storage of behavioural data beyond stated purpose (LOW)",
    mitigations: "1. Input field masking configured in SDK — all <input> and <textarea> elements masked by default\n2. DPA review with vendor in progress — data processing agreement pending\n3. Separate consent layer being developed for session recording consent\n4. Retention limit set to 90 days in SDK configuration",
    controls: null,
    residual_risk: null,
    approved_at: null,
    review_date: daysFromNow(14),
    ai_summary: null,
  },
];

const assessmentIds = {};
for (const assessment of privacyAssessmentDefs) {
  const [existing] = await sql`
    select id from privacy_assessments where organization_id = ${orgId} and title = ${assessment.title} limit 1
  `;
  if (existing) {
    log(`skip (exists): ${assessment.title}`);
    assessmentIds[assessment.title] = existing.id;
    continue;
  }
  const [row] = await sql`
    insert into privacy_assessments
      (id, organization_id, title, scope, owner_id, risk_level, status, purpose,
       data_types, risks, mitigations, controls, residual_risk,
       approved_by, approved_at, review_date, ai_summary)
    values
      (${randomUUID()}, ${orgId}, ${assessment.title}, ${assessment.scope}, ${ownerId},
       ${assessment.risk_level}, ${assessment.status}, ${assessment.purpose},
       ${assessment.data_types}, ${assessment.risks}, ${assessment.mitigations},
       ${assessment.controls ?? null}, ${assessment.residual_risk ?? null},
       ${assessment.approved_at ? ownerId : null}, ${assessment.approved_at ?? null},
       ${assessment.review_date}, ${assessment.ai_summary ?? null})
    returning id
  `;
  assessmentIds[assessment.title] = row.id;
  log(`created: ${assessment.title} (${assessment.status})`);
}

// ── 7. DATA TRANSFERS ────────────────────────────────────────────────────────
head("Data Transfers");

const dataTransferDefs = [
  {
    data_asset: "Product Analytics Events",
    destination_country: "United States",
    recipient_name: "Google LLC (BigQuery Analytics)",
    transfer_basis: "Standard Contractual Clauses (SCCs) — EU Commission Decision 2021/914 adopted for India DPDP compliance. Transfer Impact Assessment completed. Adequate safeguards verified.",
    status: "approved",
    risk_notes: "Data pseudonymised before transfer — direct identifiers (name, email, phone) replaced with internal customer IDs. Transfer limited to analytics events only. Google's DPA executed. Data not used for model training per contractual restriction.",
    approved_at: daysAgo(45),
    review_date: daysFromNow(320),
  },
  {
    data_asset: "Financial Transaction Records",
    destination_country: "Singapore",
    recipient_name: "Stripe Payments Singapore Pte Ltd",
    transfer_basis: "Contractual necessity — payment processing for international customers. Stripe is PCI DSS Level 1 certified. Data Processing Agreement executed. Stripe's sub-processor list reviewed.",
    status: "approved",
    risk_notes: "Transfer limited to payment tokenisation data — full card numbers never transmitted or stored. Stripe tokenises at point of collection. DPDP Act Section 16 (cross-border transfer) requirements satisfied via adequacy determination for Singapore.",
    approved_at: daysAgo(120),
    review_date: daysFromNow(245),
  },
  {
    data_asset: "Customer PII Database",
    destination_country: "United States",
    recipient_name: "Intercom Inc (Customer Support Platform)",
    transfer_basis: "SCCs pending execution. Transfer currently suspended pending DPA completion and transfer impact assessment.",
    status: "pending_approval",
    risk_notes: "Customer name, email, and support ticket content would be processed by Intercom for customer support workflows. DPA under legal review. Risk: US Cloud Act jurisdiction may allow government access. Mitigation: pseudonymisation of identifiers under evaluation.",
    approved_at: null,
    review_date: daysFromNow(21),
  },
];

for (const transfer of dataTransferDefs) {
  const assetId = assetIds[transfer.data_asset] ?? null;
  const [existing] = await sql`
    select id from data_transfers
    where organization_id = ${orgId} and recipient_name = ${transfer.recipient_name}
    limit 1
  `;
  if (existing) {
    log(`skip (exists): ${transfer.recipient_name}`);
    continue;
  }
  await sql`
    insert into data_transfers
      (id, organization_id, data_asset_id, destination_country, recipient_name,
       transfer_basis, status, risk_notes, approved_by, approved_at, review_date)
    values
      (${randomUUID()}, ${orgId}, ${assetId}, ${transfer.destination_country},
       ${transfer.recipient_name}, ${transfer.transfer_basis}, ${transfer.status},
       ${transfer.risk_notes}, ${transfer.approved_at ? ownerId : null},
       ${transfer.approved_at ?? null}, ${transfer.review_date})
  `;
  log(`created: ${transfer.recipient_name} → ${transfer.destination_country} (${transfer.status})`);
}

// ── SUMMARY ──────────────────────────────────────────────────────────────────
head("Summary");
const [assetCount]      = await sql`select count(*) from data_assets where organization_id = ${orgId}`;
const [consentCount]    = await sql`select count(*) from consent_records where organization_id = ${orgId}`;
const [dsrCount]        = await sql`select count(*) from privacy_requests where organization_id = ${orgId}`;
const [retPolCount]     = await sql`select count(*) from retention_policies where organization_id = ${orgId}`;
const [retEvtCount]     = await sql`select count(*) from retention_events where organization_id = ${orgId}`;
const [assessCount]     = await sql`select count(*) from privacy_assessments where organization_id = ${orgId}`;
const [transferCount]   = await sql`select count(*) from data_transfers where organization_id = ${orgId}`;

log(`data_assets:         ${assetCount.count}`);
log(`consent_records:     ${consentCount.count}`);
log(`privacy_requests:    ${dsrCount.count}`);
log(`retention_policies:  ${retPolCount.count}`);
log(`retention_events:    ${retEvtCount.count}`);
log(`privacy_assessments: ${assessCount.count}`);
log(`data_transfers:      ${transferCount.count}`);

await sql.end();
console.log("\n✅ Done.");
