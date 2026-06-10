/**
 * AUDT — Contract Governance™ demo seed script.
 *
 * Seeds 6 realistic contracts for Indian SaaS/tech context with
 * clauses and obligations. Links to existing vendors, risks, and controls.
 *
 * Idempotent — safe to re-run; skips existing contracts by title.
 *
 * Prerequisites:
 *   1. node scripts/seed-demo.mjs           (vendors)
 *   2. node scripts/seed-compliance-demo.mjs (frameworks, controls)
 *   3. Migration 0017_contract_governance.sql applied
 *
 * Usage: node scripts/seed-contracts.mjs
 *        node scripts/seed-contracts.mjs <orgId>
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

console.log(`\n🌱 Contract Governance™ seed for: ${orgName} (${orgId})\n`);

// ── Look up related entities ───────────────────────────────────────────────
head("Loading related entities…");

const vendors = await sql`select id, name from vendors where organization_id = ${orgId} order by name`;
const vByName = Object.fromEntries(vendors.map(v => [v.name.toLowerCase(), v.id]));
log(`Found ${vendors.length} vendors`);

const risks = await sql`select id, title from risks where organization_id = ${orgId} limit 10`;
log(`Found ${risks.length} risks`);

const controls = await sql`select id, name from controls where organization_id = ${orgId} OR framework_id IN (select id from frameworks where organization_id = ${orgId}) limit 10`;
log(`Found ${controls.length} controls`);

const policies = await sql`select id, name from policies where organization_id = ${orgId} limit 5`;
log(`Found ${policies.length} policies`);

// Helper: resolve vendor id by partial name match
function findVendor(partialName) {
  const lower = partialName.toLowerCase();
  for (const [name, id] of Object.entries(vByName)) {
    if (name.includes(lower) || lower.includes(name.split(" ")[0])) return id;
  }
  return null;
}

// Date helpers
const now = new Date();
const daysFromNow = (d) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() + d);
  return dt.toISOString().split("T")[0];
};
const daysAgo = (d) => daysFromNow(-d);

// ── Contract definitions ───────────────────────────────────────────────────
const contractDefs = [
  {
    title: "AWS Cloud Services Agreement",
    contract_type: "vendor_agreement",
    status: "active",
    counterparty: "Amazon Web Services India Pvt. Ltd.",
    counterparty_email: "enterprise@aws.amazon.com",
    effective_date: daysAgo(365),
    expiry_date: daysFromNow(365),
    renewal_date: daysFromNow(335),
    value: 4800000,
    currency: "INR",
    vendorMatch: "aws",
    description: "Master cloud services agreement covering EC2, S3, RDS, and managed services for production workloads hosted in ap-south-1 (Mumbai) region.",
    clauses: [
      {
        title: "Data Residency & Localisation",
        category: "privacy",
        content: "All Customer Data shall be stored and processed exclusively within the AWS ap-south-1 (Mumbai) region. AWS shall not replicate, transfer, or process Customer Data outside the Republic of India without prior written consent of the Customer, except as required by applicable law including the Digital Personal Data Protection Act, 2023.",
        risk_level: "medium",
      },
      {
        title: "Service Level Agreement",
        category: "operational",
        content: "AWS guarantees a Monthly Uptime Percentage of at least 99.99% for EC2 compute services and 99.9% for S3 storage services. In the event of a Service Credit Event, Customer shall be eligible for Service Credits as per the applicable AWS SLA schedule. Credits shall not exceed 30% of the monthly fee for the affected service.",
        risk_level: "low",
      },
      {
        title: "Liability Cap",
        category: "financial",
        content: "AWS's aggregate liability under this Agreement shall not exceed the total fees paid by Customer during the 12-month period immediately preceding the claim. Neither party shall be liable for indirect, incidental, punitive, or consequential damages, lost profits, or loss of data.",
        risk_level: "high",
      },
      {
        title: "Termination for Convenience",
        category: "termination",
        content: "Either party may terminate this Agreement for convenience with 90 days written notice. Upon termination, Customer shall have 30 days to retrieve all Customer Data. AWS shall provide reasonable data export assistance at Customer's cost.",
        risk_level: "low",
      },
    ],
    obligations: [
      {
        title: "Annual Security Review Submission",
        description: "Submit Customer's annual information security review report to AWS enterprise account team for shared responsibility assessment.",
        due_date: daysFromNow(60),
        status: "in_progress",
        risk_level: "medium",
      },
      {
        title: "Reserved Instance Payment — Q3",
        description: "Quarterly upfront payment for 3-year reserved EC2 instances (r6g.2xlarge × 4, m6i.xlarge × 8) in ap-south-1.",
        due_date: daysFromNow(15),
        status: "open",
        risk_level: "low",
      },
      {
        title: "DPDP Data Processing Agreement Addendum",
        description: "Execute DPDP Act 2023 compliant Data Processing Addendum with AWS to formalise data fiduciary obligations.",
        due_date: daysAgo(30),
        status: "completed",
        risk_level: "high",
        completed_at: daysAgo(35),
        notes: "DPA addendum signed and filed. Reference: DPA-AWS-2025-INR-001.",
      },
    ],
  },
  {
    title: "HDFC Bank Payment Gateway Agreement",
    contract_type: "vendor_agreement",
    status: "active",
    counterparty: "HDFC Bank Limited",
    counterparty_email: "enterprise.payments@hdfcbank.com",
    effective_date: daysAgo(180),
    expiry_date: daysFromNow(185),
    renewal_date: daysFromNow(155),
    value: 1200000,
    currency: "INR",
    vendorMatch: "hdfc",
    description: "Payment gateway services agreement for processing customer transactions via HDFC SmartGateway, covering UPI, debit/credit cards, and net banking channels.",
    clauses: [
      {
        title: "PCI DSS Compliance Requirement",
        category: "compliance",
        content: "Customer shall maintain PCI DSS Level 1 compliance at all times during the term of this Agreement. Customer shall provide HDFC Bank with a current Attestation of Compliance (AOC) and passing Approved Scanning Vendor (ASV) report within 30 days of each annual assessment.",
        risk_level: "critical",
      },
      {
        title: "Transaction Data Retention",
        category: "privacy",
        content: "HDFC Bank shall retain transaction logs for a period of 8 years as mandated by RBI circulars. Customer's cardholder data is tokenised at source using HDFC's certified tokenisation engine. No Primary Account Number (PAN) shall be stored on Customer's systems.",
        risk_level: "high",
      },
      {
        title: "Fraud Liability Allocation",
        category: "financial",
        content: "Liability for fraudulent transactions shall be borne by the party whose negligence caused the fraud. For CNP (Card-Not-Present) transactions where Customer has implemented 3D Secure 2.0, fraud liability shall shift to the card-issuing bank. Customer shall maintain chargeback ratio below 0.5% of monthly transaction volume.",
        risk_level: "high",
      },
    ],
    obligations: [
      {
        title: "Annual PCI DSS AOC Submission",
        description: "Submit valid PCI DSS Level 1 Attestation of Compliance to HDFC Bank compliance team for annual renewal.",
        due_date: daysFromNow(45),
        status: "in_progress",
        risk_level: "critical",
      },
      {
        title: "Monthly Chargeback Report",
        description: "Provide monthly chargeback analysis report including root cause for any month where chargeback ratio exceeds 0.3%.",
        due_date: daysFromNow(5),
        status: "open",
        risk_level: "medium",
      },
      {
        title: "3DS 2.0 Implementation Sign-off",
        description: "Obtain HDFC Bank written sign-off confirming successful 3D Secure 2.0 integration across all checkout flows.",
        due_date: daysAgo(60),
        status: "completed",
        risk_level: "high",
        completed_at: daysAgo(65),
        notes: "3DS 2.0 fully live across web and mobile checkout. HDFC sign-off received ref: HDFC-3DS-2025-0042.",
      },
    ],
  },
  {
    title: "Tata Consultancy Services Master Services Agreement",
    contract_type: "msa",
    status: "active",
    counterparty: "Tata Consultancy Services Limited",
    counterparty_email: "enterprise.contracts@tcs.com",
    effective_date: daysAgo(540),
    expiry_date: daysFromNow(180),
    renewal_date: daysFromNow(150),
    value: 18000000,
    currency: "INR",
    vendorMatch: "tata",
    description: "Master Services Agreement governing all IT service delivery by TCS including application development, QA, and support across multiple Statement of Work engagements.",
    clauses: [
      {
        title: "Intellectual Property Ownership",
        category: "legal",
        content: "All work product, deliverables, software, documentation, and inventions created by TCS personnel exclusively for Customer under any SOW shall be work-for-hire and vest exclusively with Customer upon full payment. TCS retains ownership of its pre-existing IP and general methodologies. Customer is granted a perpetual, royalty-free licence to use TCS background IP embedded in deliverables.",
        risk_level: "critical",
      },
      {
        title: "Data Security & Background Verification",
        category: "security",
        content: "All TCS personnel with access to Customer systems or data shall undergo police verification, educational credential checks, and employment history verification. TCS shall maintain ISO 27001 certification for delivery centres engaged on this account. Personnel shall complete Customer's mandatory security awareness training within 30 days of onboarding.",
        risk_level: "high",
      },
      {
        title: "Confidentiality & Non-Solicitation",
        category: "legal",
        content: "Both parties shall maintain strict confidentiality of the other's Confidential Information for the duration of the Agreement and for 5 years thereafter. Neither party shall solicit or hire the other's employees involved in this engagement for a period of 24 months following termination.",
        risk_level: "medium",
      },
      {
        title: "Termination for Material Breach",
        category: "termination",
        content: "Either party may terminate this Agreement immediately upon written notice if the other party commits a material breach that remains uncured for 30 days after written notice specifying the breach. Material breach includes: repeated SLA failures, data breach, insolvency, or breach of confidentiality obligations.",
        risk_level: "medium",
      },
    ],
    obligations: [
      {
        title: "Quarterly Service Performance Review",
        description: "Conduct formal quarterly business review with TCS delivery head covering SLA performance, quality metrics, upcoming SOW pipeline, and escalation resolution.",
        due_date: daysFromNow(20),
        status: "in_progress",
        risk_level: "low",
      },
      {
        title: "Annual ISO 27001 Certificate Renewal",
        description: "Obtain updated ISO 27001 certificate from TCS covering Mumbai and Pune delivery centres engaged on this account.",
        due_date: daysFromNow(90),
        status: "open",
        risk_level: "high",
      },
      {
        title: "MSA Renewal Negotiation Kickoff",
        description: "Initiate renewal discussions with TCS account team 180 days prior to expiry. Prepare commercial benchmarking and SOW pipeline forecast.",
        due_date: daysFromNow(0),
        status: "in_progress",
        risk_level: "medium",
      },
    ],
  },
  {
    title: "Mutual Non-Disclosure Agreement — Infosys",
    contract_type: "nda",
    status: "active",
    counterparty: "Infosys Limited",
    counterparty_email: "legal@infosys.com",
    effective_date: daysAgo(90),
    expiry_date: daysFromNow(275),
    renewal_date: null,
    value: null,
    currency: "INR",
    vendorMatch: "infosys",
    description: "Mutual non-disclosure agreement covering exploratory discussions for a potential co-development partnership in enterprise GRC tooling.",
    clauses: [
      {
        title: "Definition of Confidential Information",
        category: "legal",
        content: "Confidential Information includes all technical, commercial, financial, and operational information disclosed by either party in connection with the Permitted Purpose, whether oral, written, or in any other form, that is marked confidential or that a reasonable person would consider confidential given the nature of the information and circumstances of disclosure.",
        risk_level: "low",
      },
      {
        title: "Exclusions from Confidentiality",
        category: "legal",
        content: "Obligations under this NDA shall not apply to information that: (a) is or becomes publicly available through no breach of this Agreement; (b) was rightfully known to the Receiving Party prior to disclosure; (c) is independently developed without reference to Confidential Information; (d) is disclosed with the Disclosing Party's prior written consent.",
        risk_level: "low",
      },
      {
        title: "Return or Destruction of Information",
        category: "termination",
        content: "Upon termination of this Agreement or upon written request, the Receiving Party shall promptly return or certifiably destroy all Confidential Information including copies, extracts, and summaries. A written certificate of destruction shall be provided within 10 business days.",
        risk_level: "low",
      },
    ],
    obligations: [
      {
        title: "Technical Briefing — Product Roadmap Disclosure",
        description: "Provide Infosys with AUDT 12-month product roadmap under NDA protection for partnership scoping discussions.",
        due_date: daysFromNow(14),
        status: "open",
        risk_level: "medium",
      },
      {
        title: "NDA Expiry Review",
        description: "Review NDA status 60 days before expiry. Determine whether to extend, convert to commercial agreement, or allow to lapse.",
        due_date: daysFromNow(215),
        status: "open",
        risk_level: "low",
      },
    ],
  },
  {
    title: "Microsoft Azure Enterprise Agreement",
    contract_type: "vendor_agreement",
    status: "active",
    counterparty: "Microsoft Corporation India Pvt. Ltd.",
    counterparty_email: "azureentp@microsoft.com",
    effective_date: daysAgo(270),
    expiry_date: daysFromNow(460),
    renewal_date: daysFromNow(430),
    value: 6500000,
    currency: "INR",
    vendorMatch: "microsoft",
    description: "Enterprise Agreement for Microsoft Azure services including Azure Active Directory, Azure DevOps, Microsoft 365 E3, and Azure OpenAI Service for internal tooling.",
    clauses: [
      {
        title: "Data Protection Addendum (India)",
        category: "privacy",
        content: "Microsoft shall act as a Data Processor with respect to Personal Data processed under this Agreement. Microsoft commits to the Microsoft Products and Services Data Protection Addendum (DPA) as updated for DPDP Act 2023 compliance. Data centres for India-bound workloads shall be located in Central India and South India Azure regions.",
        risk_level: "medium",
      },
      {
        title: "Azure AI Services Usage Policy",
        category: "compliance",
        content: "Customer's use of Azure OpenAI Service is subject to Microsoft's Acceptable Use Policy and the Azure OpenAI Code of Conduct. Customer shall not use Azure AI services to process special categories of personal data without explicit consent and appropriate safeguards. Microsoft does not use Customer data to train foundational models.",
        risk_level: "high",
      },
      {
        title: "Licence Compliance & True-Up",
        category: "financial",
        content: "Customer shall conduct an annual licence true-up within 60 days of each Anniversary Date, reporting actual deployment counts for all licensed products. Under-reporting may result in back-billing plus a 15% compliance penalty. Microsoft reserves the right to conduct a licence audit with 30 days notice.",
        risk_level: "medium",
      },
    ],
    obligations: [
      {
        title: "Annual Licence True-Up Submission",
        description: "Complete annual licence reconciliation for all Microsoft 365 E3, Azure subscriptions, and Power Platform licences. Submit true-up report via Microsoft Volume Licensing Service Centre.",
        due_date: daysFromNow(75),
        status: "open",
        risk_level: "medium",
      },
      {
        title: "Azure DPDP DPA Execution",
        description: "Execute updated Microsoft Data Processing Addendum incorporating India DPDP Act 2023 obligations before regulatory deadline.",
        due_date: daysAgo(15),
        status: "completed",
        risk_level: "high",
        completed_at: daysAgo(20),
        notes: "DPDP-aligned DPA signed via Microsoft admin portal. Agreement ref: MS-DPA-IN-2025-00891.",
      },
      {
        title: "Multi-Factor Authentication Enforcement",
        description: "Enable MFA enforcement for all admin accounts in Azure Active Directory as required under EA security baseline.",
        due_date: daysAgo(90),
        status: "completed",
        risk_level: "high",
        completed_at: daysAgo(95),
        notes: "Conditional Access policy enforcing MFA for all global admin and privileged roles deployed.",
      },
    ],
  },
  {
    title: "Razorpay Payment Processing SLA Agreement",
    contract_type: "vendor_agreement",
    status: "active",
    counterparty: "Razorpay Software Pvt. Ltd.",
    counterparty_email: "enterprise@razorpay.com",
    effective_date: daysAgo(335),
    expiry_date: daysFromNow(30),  // expiring soon — 30 days
    renewal_date: daysFromNow(15),
    value: 950000,
    currency: "INR",
    vendorMatch: "razorpay",
    description: "Service Level Agreement for Razorpay payment gateway covering API uptime, transaction success rates, settlement timelines, and support response SLAs for production payment flows.",
    clauses: [
      {
        title: "API Uptime Guarantee",
        category: "operational",
        content: "Razorpay guarantees API availability of 99.95% measured monthly excluding scheduled maintenance windows. Maintenance windows shall not exceed 4 hours per month and shall be communicated at least 72 hours in advance. For each 0.1% below the SLA threshold, Customer shall receive credits equivalent to 5% of the monthly fee, up to a maximum of 30%.",
        risk_level: "medium",
      },
      {
        title: "Settlement Timeline",
        category: "financial",
        content: "Razorpay shall settle collected funds to Customer's registered bank account within T+1 business day for UPI and debit card transactions and T+2 for credit card transactions, subject to RBI settlement cycles. Razorpay shall provide real-time settlement status via dashboard and webhook notifications.",
        risk_level: "high",
      },
      {
        title: "RBI Compliance & Escrow",
        category: "compliance",
        content: "Razorpay, as a PPI licence holder, shall maintain merchant funds in designated nodal accounts per RBI Payment Aggregator guidelines. Customer acknowledges Razorpay's PA licence (ref: RBI/2022-23/PA-001) and agrees to comply with RBI KYC and merchant onboarding norms.",
        risk_level: "high",
      },
      {
        title: "Agreement Renewal Terms",
        category: "renewal",
        content: "This Agreement shall renew automatically for successive 12-month terms unless either party provides written notice of non-renewal at least 30 days before the expiry date. Razorpay reserves the right to revise pricing on renewal with 45 days advance notice.",
        risk_level: "medium",
      },
    ],
    obligations: [
      {
        title: "SLA Renewal Decision — Razorpay",
        description: "Evaluate Razorpay SLA renewal vs. competitor rates (PayU, CCAvenue). Issue renewal notice or termination notice before 30-day notice deadline.",
        due_date: daysFromNow(0),
        status: "in_progress",
        risk_level: "critical",
        notes: "Renewal negotiation in progress. Razorpay offered 8% rate reduction. Benchmarking against PayU Enterprise.",
      },
      {
        title: "RBI PA Compliance Acknowledgement",
        description: "Acknowledge Razorpay's updated Payment Aggregator compliance certificate and sign merchant addendum per RBI PA Master Directions 2020 (updated 2024).",
        due_date: daysAgo(10),
        status: "completed",
        risk_level: "high",
        completed_at: daysAgo(12),
        notes: "PA compliance addendum signed. Razorpay ref: RZ-PA-2025-00334.",
      },
      {
        title: "Quarterly Transaction Volume Report",
        description: "Share Q3 projected transaction volume forecast with Razorpay account manager for capacity planning and rate renegotiation.",
        due_date: daysFromNow(10),
        status: "open",
        risk_level: "low",
      },
    ],
  },
];

// ── Seed contracts ─────────────────────────────────────────────────────────
head("Seeding contracts…");

let contractsCreated = 0;
let clausesCreated = 0;
let obligationsCreated = 0;
let risksLinked = 0;
let controlsLinked = 0;
let policiesLinked = 0;

for (const def of contractDefs) {
  // Idempotency check
  const [existing] = await sql`
    select id from contracts where organization_id = ${orgId} and title = ${def.title} limit 1`;
  if (existing) {
    log(`SKIP (exists): ${def.title}`);
    continue;
  }

  const vendorId = def.vendorMatch ? findVendor(def.vendorMatch) : null;

  const [contract] = await sql`
    insert into contracts (
      id, organization_id, vendor_id, title, contract_type, status,
      effective_date, expiry_date, renewal_date,
      value, currency, owner_id,
      notice_period_days, auto_renewal,
      ai_summary, created_at, updated_at
    ) values (
      ${randomUUID()}, ${orgId}, ${vendorId ?? null}, ${def.title},
      ${def.contract_type}, ${def.status},
      ${def.effective_date ?? null}, ${def.expiry_date ?? null}, ${def.renewal_date ?? null},
      ${def.value ?? null}, ${def.currency}, ${ownerId ?? null},
      30, false,
      ${def.description}, now(), now()
    )
    returning id`;

  log(`+ ${def.title}${vendorId ? ` (vendor linked)` : ""}`);
  contractsCreated++;

  // Clauses
  for (const clause of def.clauses ?? []) {
    await sql`
      insert into contract_clauses (
        id, contract_id, title, category, content, risk_level, is_missing, created_at, updated_at
      ) values (
        ${randomUUID()}, ${contract.id},
        ${clause.title}, ${clause.category}, ${clause.content},
        ${clause.risk_level}, false, now(), now()
      )`;
    clausesCreated++;
  }
  log(`  + ${(def.clauses ?? []).length} clauses`);

  // Obligations
  for (const ob of def.obligations ?? []) {
    await sql`
      insert into contract_obligations (
        id, contract_id, organization_id, title, description,
        owner_id, due_date, status, risk_level,
        completed_at, notes, created_at, updated_at
      ) values (
        ${randomUUID()}, ${contract.id}, ${orgId},
        ${ob.title}, ${ob.description ?? null},
        ${ownerId ?? null}, ${ob.due_date ?? null}, ${ob.status},
        ${ob.risk_level ?? "medium"},
        ${ob.completed_at ?? null}, ${ob.notes ?? null},
        now(), now()
      )`;
    obligationsCreated++;
  }
  log(`  + ${(def.obligations ?? []).length} obligations`);

  // Link first 2 risks (ON CONFLICT DO NOTHING)
  for (const risk of risks.slice(0, 2)) {
    await sql`
      insert into contract_risks (id, contract_id, risk_id, organization_id, created_at)
      values (${randomUUID()}, ${contract.id}, ${risk.id}, ${orgId}, now())
      on conflict (contract_id, risk_id) do nothing`;
    risksLinked++;
  }

  // Link first 2 controls (ON CONFLICT DO NOTHING)
  for (const control of controls.slice(0, 2)) {
    await sql`
      insert into contract_controls (id, contract_id, control_id, organization_id, created_at)
      values (${randomUUID()}, ${contract.id}, ${control.id}, ${orgId}, now())
      on conflict (contract_id, control_id) do nothing`;
    controlsLinked++;
  }

  // Link first policy if available (ON CONFLICT DO NOTHING)
  if (policies.length > 0) {
    const policy = policies[Math.floor(Math.random() * policies.length)];
    await sql`
      insert into contract_policies (id, contract_id, policy_id, organization_id, created_at)
      values (${randomUUID()}, ${contract.id}, ${policy.id}, ${orgId}, now())
      on conflict (contract_id, policy_id) do nothing`;
    policiesLinked++;
  }
}

// ── Summary ────────────────────────────────────────────────────────────────
head("Summary");
log(`Contracts created  : ${contractsCreated}`);
log(`Clauses created    : ${clausesCreated}`);
log(`Obligations created: ${obligationsCreated}`);
log(`Risks linked       : ${risksLinked}`);
log(`Controls linked    : ${controlsLinked}`);
log(`Policies linked    : ${policiesLinked}`);

await sql.end();
console.log("\n✅ Done.");
