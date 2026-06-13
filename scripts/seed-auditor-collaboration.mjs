/**
 * Seed script — Auditor Collaboration™ (Module 21)
 * Seeds: 3 auditor organisations, 8 external users, 4 audit rooms,
 *        12 evidence requests, 8 external findings, 4 assessment projects,
 *        6 room documents, 20 room activities, 4 audit reviews
 *
 * Usage: node scripts/seed-auditor-collaboration.mjs [orgId]
 *        node scripts/seed-auditor-collaboration.mjs --list
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" });
import { randomUUID } from "crypto";

// ── Load .env.local ───────────────────────────────────────────────────────────

const envPath = resolve(process.cwd(), ".env.local");
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set. Ensure .env.local exists.");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { ssl: "require", max: 1 });

async function listOrgs() {
  const rows = await sql`SELECT id, name FROM organizations ORDER BY created_at LIMIT 20`;
  console.log("Organizations:");
  rows.forEach(r => console.log(`  ${r.id}  ${r.name}`));
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const daysAgo  = n => new Date(Date.now() - n * 86400000);
const daysAhead = n => new Date(Date.now() + n * 86400000);
const dateStr  = d => d.toISOString().split("T")[0];

// ── Seed ──────────────────────────────────────────────────────────────────────

async function seed(orgId) {
  console.log(`\nSeeding Auditor Collaboration™ for org: ${orgId}\n`);

  const [org] = await sql`SELECT id, name FROM organizations WHERE id = ${orgId} LIMIT 1`;
  if (!org) { console.error("Org not found"); process.exit(1); }
  console.log(`  Org: ${org.name}`);

  const [actor] = await sql`
    SELECT p.id FROM profiles p
    JOIN memberships m ON m.user_id = p.id
    WHERE m.organization_id = ${orgId} AND m.role = 'owner'
    LIMIT 1
  `;
  const actorId = actor?.id ?? null;

  const counts = {};

  // ── 1. Auditor Organisations ───────────────────────────────────────────────

  const auditorOrgs = [
    {
      name: "Deloitte India LLP",
      firm_type: "audit_firm",
      website: "https://www2.deloitte.com/in",
      country: "India",
      specializations: ["ISO 27001", "SOC 2", "DPDP", "Cybersecurity"],
      contact_email: "governance@deloitte.in",
      contact_name: "Ananya Krishnan",
      verification_status: "verified",
      notes: "Primary external auditor for annual ISO 27001 certification cycle.",
    },
    {
      name: "KPMG Assurance & Consulting Services LLP",
      firm_type: "audit_firm",
      website: "https://kpmg.com/in",
      country: "India",
      specializations: ["SOC 2 Type II", "HIPAA", "PCI DSS", "AI Governance"],
      contact_email: "cyber.advisory@kpmg.in",
      contact_name: "Rahul Mehta",
      verification_status: "verified",
      notes: "Engaged for SOC 2 Type II readiness and AI Governance framework review.",
    },
    {
      name: "Nishith Desai Associates",
      firm_type: "law_firm",
      website: "https://nishithdesai.com",
      country: "India",
      specializations: ["DPDP", "Privacy Law", "Data Governance", "Regulatory Compliance"],
      contact_email: "privacy@nishithdesai.com",
      contact_name: "Priya Sharma",
      verification_status: "verified",
      notes: "Legal counsel for DPDP Act compliance and privacy impact assessments.",
    },
  ];

  let auditorOrgCount = 0;
  const auditorOrgIds = {};
  for (const ao of auditorOrgs) {
    const existing = await sql`
      SELECT id FROM auditor_organizations
      WHERE organization_id = ${orgId} AND name = ${ao.name}
      LIMIT 1
    `;
    if (existing.length > 0) {
      auditorOrgIds[ao.name] = existing[0].id;
      continue;
    }
    const id = randomUUID();
    await sql`
      INSERT INTO auditor_organizations (
        id, organization_id, name, firm_type, website, country,
        specializations, contact_email, contact_name,
        verification_status, notes, is_active, created_by, created_at, updated_at
      ) VALUES (
        ${id}, ${orgId}, ${ao.name}, ${ao.firm_type}, ${ao.website},
        ${ao.country}, ${JSON.stringify(ao.specializations)},
        ${ao.contact_email}, ${ao.contact_name},
        ${ao.verification_status}, ${ao.notes},
        true, ${actorId}, NOW(), NOW()
      )
    `;
    auditorOrgIds[ao.name] = id;
    auditorOrgCount++;
  }
  counts.auditor_orgs = auditorOrgCount;
  console.log(`  ✓ Seeded ${auditorOrgCount} auditor organisations (${auditorOrgs.length - auditorOrgCount} already existed)`);

  // ── 2. External Users ──────────────────────────────────────────────────────

  const externalUsers = [
    {
      email: "ananya.krishnan@deloitte.in",
      full_name: "Ananya Krishnan",
      user_type: "iso_auditor",
      title: "Senior Manager — Information Security Audit",
      company: "Deloitte India LLP",
      status: "active",
      auditor_org: "Deloitte India LLP",
    },
    {
      email: "vikram.nair@deloitte.in",
      full_name: "Vikram Nair",
      user_type: "iso_auditor",
      title: "Manager — ISO 27001 Lead Auditor",
      company: "Deloitte India LLP",
      status: "active",
      auditor_org: "Deloitte India LLP",
    },
    {
      email: "rahul.mehta@kpmg.in",
      full_name: "Rahul Mehta",
      user_type: "soc_auditor",
      title: "Director — Cyber Advisory",
      company: "KPMG Assurance & Consulting Services LLP",
      status: "active",
      auditor_org: "KPMG Assurance & Consulting Services LLP",
    },
    {
      email: "deepa.iyer@kpmg.in",
      full_name: "Deepa Iyer",
      user_type: "ai_governance_reviewer",
      title: "Senior Manager — AI Risk & Governance",
      company: "KPMG Assurance & Consulting Services LLP",
      status: "active",
      auditor_org: "KPMG Assurance & Consulting Services LLP",
    },
    {
      email: "priya.sharma@nishithdesai.com",
      full_name: "Priya Sharma",
      user_type: "privacy_consultant",
      title: "Partner — Privacy & Data Protection",
      company: "Nishith Desai Associates",
      status: "active",
      auditor_org: "Nishith Desai Associates",
    },
    {
      email: "arjun.kapoor@nishithdesai.com",
      full_name: "Arjun Kapoor",
      user_type: "dpdp_assessor",
      title: "Associate — DPDP Compliance",
      company: "Nishith Desai Associates",
      status: "active",
      auditor_org: "Nishith Desai Associates",
    },
    {
      email: "sneha.patel@cybersec.in",
      full_name: "Sneha Patel",
      user_type: "security_assessor",
      title: "Lead Penetration Tester",
      company: "CyberSec India Pvt Ltd",
      status: "invited",
      auditor_org: null,
    },
    {
      email: "mohan.das@customerreview.com",
      full_name: "Mohan Das",
      user_type: "customer_reviewer",
      title: "VP Procurement",
      company: "Bajaj Finserv Ltd",
      status: "invited",
      auditor_org: null,
    },
  ];

  let extUserCount = 0;
  const extUserIds = {};
  for (const u of externalUsers) {
    const existing = await sql`
      SELECT id FROM external_users
      WHERE organization_id = ${orgId} AND email = ${u.email}
      LIMIT 1
    `;
    if (existing.length > 0) {
      extUserIds[u.email] = existing[0].id;
      continue;
    }
    const id = randomUUID();
    const auditorOrgId = u.auditor_org ? auditorOrgIds[u.auditor_org] ?? null : null;
    await sql`
      INSERT INTO external_users (
        id, organization_id, auditor_org_id, email, full_name,
        user_type, title, company, status,
        invite_token, invite_sent_at, created_by, created_at, updated_at
      ) VALUES (
        ${id}, ${orgId}, ${auditorOrgId}, ${u.email}, ${u.full_name},
        ${u.user_type}, ${u.title}, ${u.company}, ${u.status},
        ${randomUUID()}, ${daysAgo(7)}, ${actorId}, NOW(), NOW()
      )
    `;
    extUserIds[u.email] = id;
    extUserCount++;
  }
  counts.external_users = extUserCount;
  console.log(`  ✓ Seeded ${extUserCount} external users (${externalUsers.length - extUserCount} already existed)`);

  // ── 3. Audit Rooms ─────────────────────────────────────────────────────────

  const rooms = [
    {
      name: "ISO 27001:2022 Surveillance Audit 2026",
      description: "Annual Stage 2 surveillance audit for ISO 27001:2022 certification. Scope covers all information assets, people, processes, and technology supporting AUDT's SaaS platform.",
      room_type: "audit",
      framework: "ISO 27001",
      scope: "Full ISMS scope — platform infrastructure, development, operations, HR, legal, and vendor management functions.",
      objective: "Verify continued conformance to ISO 27001:2022 and identify improvement opportunities. Maintain Deloitte-issued certificate #DE-27001-2024-0047.",
      status: "active",
      start_date: dateStr(daysAgo(14)),
      end_date: dateStr(daysAhead(21)),
      completion_pct: 42,
      lead_auditor_email: "ananya.krishnan@deloitte.in",
      auditor_org: "Deloitte India LLP",
    },
    {
      name: "SOC 2 Type II — FY 2026 Readiness",
      description: "SOC 2 Type II readiness assessment covering the Trust Services Criteria: Security, Availability, and Confidentiality over a 12-month observation period (Jan–Dec 2026).",
      room_type: "assessment",
      framework: "SOC 2 Type II",
      scope: "AUDT cloud platform, API infrastructure, Supabase databases, Vercel hosting, and all third-party integrations processing customer data.",
      objective: "Achieve clean SOC 2 Type II opinion from KPMG with zero qualifications. Target report issuance by 31 March 2027.",
      status: "active",
      start_date: dateStr(daysAgo(30)),
      end_date: dateStr(daysAhead(60)),
      completion_pct: 28,
      lead_auditor_email: "rahul.mehta@kpmg.in",
      auditor_org: "KPMG Assurance & Consulting Services LLP",
    },
    {
      name: "DPDP Act 2023 — Compliance Assessment",
      description: "Independent assessment of AUDT's compliance posture against India's Digital Personal Data Protection Act 2023 and associated Rules (expected Q3 2025). Covers data fiduciary obligations, consent management, and Data Principal rights.",
      room_type: "review",
      framework: "DPDP",
      scope: "All personal data processing activities — customer onboarding, user profiles, vendor documents, audit logs, and marketing communications.",
      objective: "Identify gaps vs. DPDP Act obligations. Produce legal opinion and prioritised remediation roadmap before Data Protection Board operationalises.",
      status: "planning",
      start_date: dateStr(daysAhead(7)),
      end_date: dateStr(daysAhead(45)),
      completion_pct: 8,
      lead_auditor_email: "priya.sharma@nishithdesai.com",
      auditor_org: "Nishith Desai Associates",
    },
    {
      name: "AI Governance Framework Review — Q2 2026",
      description: "Review of AUDT's AI Governance framework against ISO/IEC 42001, NIST AI RMF, and EU AI Act obligations. Specific focus on Gemini 2.5 Flash usage in Evidence Vault™ and AI Governance Copilot™.",
      room_type: "review",
      framework: "ISO 42001",
      scope: "All AI systems in production: document extraction, governance summaries, NL search, risk narratives, and AI Governance Copilot™.",
      objective: "Assess AI risk classification accuracy, human oversight controls, explainability posture, and vendor contractual obligations. Identify gaps vs. EU AI Act high-risk thresholds.",
      status: "completed",
      start_date: dateStr(daysAgo(45)),
      end_date: dateStr(daysAgo(5)),
      completion_pct: 100,
      lead_auditor_email: "deepa.iyer@kpmg.in",
      auditor_org: "KPMG Assurance & Consulting Services LLP",
    },
  ];

  let roomCount = 0;
  const roomIds = {};
  for (const r of rooms) {
    const existing = await sql`
      SELECT id FROM audit_rooms
      WHERE organization_id = ${orgId} AND name = ${r.name}
      LIMIT 1
    `;
    if (existing.length > 0) {
      roomIds[r.name] = existing[0].id;
      continue;
    }
    const id = randomUUID();
    const leadAuditorId = extUserIds[r.lead_auditor_email] ?? null;
    const auditorOrgId = auditorOrgIds[r.auditor_org] ?? null;
    await sql`
      INSERT INTO audit_rooms (
        id, organization_id, name, description, room_type, framework,
        scope, objective, status, start_date, end_date, completion_pct,
        auditor_org_id, lead_auditor_id, owner_id, metadata,
        created_by, created_at, updated_at
      ) VALUES (
        ${id}, ${orgId}, ${r.name}, ${r.description}, ${r.room_type},
        ${r.framework}, ${r.scope}, ${r.objective}, ${r.status},
        ${r.start_date}, ${r.end_date}, ${r.completion_pct},
        ${auditorOrgId}, ${leadAuditorId}, ${actorId}, '{}',
        ${actorId}, ${daysAgo(Math.floor(Math.random() * 30 + 1))}, NOW()
      )
    `;
    roomIds[r.name] = id;
    roomCount++;
  }
  counts.rooms = roomCount;
  console.log(`  ✓ Seeded ${roomCount} audit rooms (${rooms.length - roomCount} already existed)`);

  // ── 4. Evidence Requests ───────────────────────────────────────────────────

  const isoRoomId = roomIds["ISO 27001:2022 Surveillance Audit 2026"];
  const socRoomId = roomIds["SOC 2 Type II — FY 2026 Readiness"];
  const dpdpRoomId = roomIds["DPDP Act 2023 — Compliance Assessment"];
  const aiRoomId = roomIds["AI Governance Framework Review — Q2 2026"];

  const evidenceRequests = [
    // ISO 27001 room
    {
      room_id: isoRoomId,
      title: "Information Security Policy — Current Version",
      description: "Please provide the current signed version of the ISMS Information Security Policy, including version number, approval date, and board/executive sign-off.",
      evidence_type: "policy",
      status: "accepted",
      priority: "high",
      due_date: dateStr(daysAgo(7)),
      requested_by_email: "ananya.krishnan@deloitte.in",
    },
    {
      room_id: isoRoomId,
      title: "Annex A Control Implementation Evidence — Access Control (A.8)",
      description: "Evidence for all 14 access control requirements under ISO 27001:2022 Annex A.8, including logical access controls, privileged access management, and quarterly access reviews.",
      evidence_type: "control_test",
      status: "submitted",
      priority: "critical",
      due_date: dateStr(daysAhead(3)),
      requested_by_email: "vikram.nair@deloitte.in",
    },
    {
      room_id: isoRoomId,
      title: "Penetration Test Report — Last 12 Months",
      description: "Full penetration testing report (web application + infrastructure) conducted by an accredited third-party in the past 12 months, including remediation evidence for all Critical and High findings.",
      evidence_type: "vendor_assessment",
      status: "pending",
      priority: "high",
      due_date: dateStr(daysAhead(7)),
      requested_by_email: "ananya.krishnan@deloitte.in",
    },
    {
      room_id: isoRoomId,
      title: "Risk Register — Current State",
      description: "Export of the current Information Security Risk Register showing inherent scores, treatment strategies, residual scores, and responsible owners.",
      evidence_type: "risk_register",
      status: "accepted",
      priority: "high",
      due_date: dateStr(daysAgo(3)),
      requested_by_email: "vikram.nair@deloitte.in",
    },
    // SOC 2 room
    {
      room_id: socRoomId,
      title: "System Description — Services and Trust Services Criteria",
      description: "Management's system description covering the nature of services provided, relevant Trust Services Criteria, and the boundaries of the system. Required as per AT-C 205.",
      evidence_type: "policy",
      status: "submitted",
      priority: "critical",
      due_date: dateStr(daysAhead(14)),
      requested_by_email: "rahul.mehta@kpmg.in",
    },
    {
      room_id: socRoomId,
      title: "Incident Response Logs — January to June 2026",
      description: "All security incident records, response timelines, root cause analyses, and post-incident review documentation for the first half of the observation period.",
      evidence_type: "audit_log",
      status: "pending",
      priority: "high",
      due_date: dateStr(daysAhead(21)),
      requested_by_email: "rahul.mehta@kpmg.in",
    },
    {
      room_id: socRoomId,
      title: "Change Management Records — Sample of 25 Changes",
      description: "Evidence of 25 randomly-selected production change tickets demonstrating: change request approval, testing, CAB review, deployment records, and post-change verification.",
      evidence_type: "control_test",
      status: "pending",
      priority: "medium",
      due_date: dateStr(daysAhead(28)),
      requested_by_email: "rahul.mehta@kpmg.in",
    },
    // DPDP room
    {
      room_id: dpdpRoomId,
      title: "Data Processing Activities Register",
      description: "Complete register of all personal data processing activities (Art. 8 obligation), including purpose, legal basis, data categories, retention periods, and cross-border transfers.",
      evidence_type: "privacy_record",
      status: "pending",
      priority: "critical",
      due_date: dateStr(daysAhead(14)),
      requested_by_email: "priya.sharma@nishithdesai.com",
    },
    {
      room_id: dpdpRoomId,
      title: "Consent Management Technical Specification",
      description: "Technical documentation showing how consent is collected, recorded, and withdrawn across all customer touchpoints. Include consent logs for a sample of 100 data principals.",
      evidence_type: "custom",
      status: "pending",
      priority: "high",
      due_date: dateStr(daysAhead(21)),
      requested_by_email: "arjun.kapoor@nishithdesai.com",
    },
    // AI Governance room
    {
      room_id: aiRoomId,
      title: "AI System Inventory with Risk Classification",
      description: "Complete inventory of all AI/ML systems in production or development, with EU AI Act risk tier classification (unacceptable/high/limited/minimal) and supporting rationale.",
      evidence_type: "ai_assessment",
      status: "accepted",
      priority: "critical",
      due_date: dateStr(daysAgo(20)),
      requested_by_email: "deepa.iyer@kpmg.in",
    },
    {
      room_id: aiRoomId,
      title: "Human Oversight Controls Documentation",
      description: "Evidence of human-in-the-loop controls for all AI system outputs, escalation procedures, and override mechanisms. Specific focus on vendor due diligence and compliance gap AI features.",
      evidence_type: "control_test",
      status: "accepted",
      priority: "high",
      due_date: dateStr(daysAgo(15)),
      requested_by_email: "deepa.iyer@kpmg.in",
    },
    {
      room_id: aiRoomId,
      title: "Google Gemini Data Processing Agreement",
      description: "Current signed DPA with Google for Gemini API usage, confirming data residency, training opt-out status, retention periods, and sub-processor obligations.",
      evidence_type: "contract",
      status: "accepted",
      priority: "high",
      due_date: dateStr(daysAgo(25)),
      requested_by_email: "deepa.iyer@kpmg.in",
    },
  ];

  let evReqCount = 0;
  const evReqIds = [];
  for (const er of evidenceRequests) {
    if (!er.room_id) continue;
    const existing = await sql`
      SELECT id FROM evidence_requests
      WHERE room_id = ${er.room_id} AND title = ${er.title}
      LIMIT 1
    `;
    if (existing.length > 0) { evReqIds.push(existing[0].id); continue; }
    const id = randomUUID();
    const requestedById = extUserIds[er.requested_by_email] ?? null;
    await sql`
      INSERT INTO evidence_requests (
        id, room_id, organization_id, title, description,
        evidence_type, status, priority, due_date,
        requested_by_id, assigned_owner_id, created_by,
        created_at, updated_at
      ) VALUES (
        ${id}, ${er.room_id}, ${orgId}, ${er.title}, ${er.description},
        ${er.evidence_type}, ${er.status}, ${er.priority}, ${er.due_date},
        ${requestedById}, ${actorId}, ${actorId},
        ${daysAgo(Math.floor(Math.random() * 14 + 1))}, NOW()
      )
    `;
    evReqIds.push(id);
    evReqCount++;
  }
  counts.evidence_requests = evReqCount;
  console.log(`  ✓ Seeded ${evReqCount} evidence requests (${evidenceRequests.length - evReqCount} already existed)`);

  // ── 5. External Findings ───────────────────────────────────────────────────

  const externalFindings = [
    {
      room_id: isoRoomId,
      title: "Privileged Access Review — Quarterly Cycle Not Completed",
      description: "Evidence of Q4 2025 and Q1 2026 privileged access reviews was not available. Three production database admin accounts and two cloud admin accounts had not been reviewed in over 180 days, contrary to the organisation's access management policy (AMP-001 §4.3).",
      severity: "high",
      finding_type: "non_conformance",
      status: "in_remediation",
      framework: "ISO 27001",
      control_ref: "A.8.2 — Privileged Access Rights",
      recommendation: "Complete overdue access reviews within 30 days. Implement automated quarterly review reminders tied to ITSM tickets. Assign ownership to CISO with monthly tracking.",
      due_date: dateStr(daysAhead(14)),
      raised_by_email: "vikram.nair@deloitte.in",
    },
    {
      room_id: isoRoomId,
      title: "Supplier Security Assessment — Three Critical Vendors Overdue",
      description: "AUDT's Third-Party Risk Policy requires annual security assessments for Tier 1 suppliers. Three critical cloud infrastructure suppliers (hosting, DNS, CDN) have not been assessed in the current period, creating a gap in supply chain risk coverage.",
      severity: "medium",
      finding_type: "non_conformance",
      status: "open",
      framework: "ISO 27001",
      control_ref: "A.5.19 — Information Security in Supplier Relationships",
      recommendation: "Complete security assessments for all overdue Tier 1 suppliers within 45 days using the standardised questionnaire from Vendor Hub™. Update vendor risk ratings accordingly.",
      due_date: dateStr(daysAhead(30)),
      raised_by_email: "ananya.krishnan@deloitte.in",
    },
    {
      room_id: isoRoomId,
      title: "Opportunity: Implement Automated SIEM Alerting for Privileged Sessions",
      description: "Current monitoring relies on periodic manual log review. Implementing real-time SIEM alerting for privileged session anomalies (off-hours access, unusual volumes, failed attempts) would significantly improve detection capability.",
      severity: "low",
      finding_type: "opportunity",
      status: "accepted",
      framework: "ISO 27001",
      control_ref: "A.8.15 — Logging",
      recommendation: "Evaluate SIEM integration with existing cloud logging. Consider AWS CloudTrail + Security Hub or equivalent. Estimated implementation: 2–4 weeks.",
      due_date: dateStr(daysAhead(90)),
      raised_by_email: "ananya.krishnan@deloitte.in",
    },
    {
      room_id: socRoomId,
      title: "Encryption at Rest — Legacy Database Backup Files Not Encrypted",
      description: "SOC 2 CC6.1 requires logical and physical access controls including encryption. Automated nightly database backups retained in S3 standard storage were found to use AES-128 rather than the organisation's stated AES-256 standard. Affects 90 days of backup retention.",
      severity: "high",
      finding_type: "non_conformance",
      status: "in_remediation",
      framework: "SOC 2 Type II",
      control_ref: "CC6.1 — Logical and Physical Access Controls",
      recommendation: "Re-encrypt all existing backup files with AES-256. Update backup configuration to enforce AES-256 for all new backups. Verify with KPMG within 14 days.",
      due_date: dateStr(daysAhead(7)),
      raised_by_email: "rahul.mehta@kpmg.in",
    },
    {
      room_id: dpdpRoomId,
      title: "Consent Withdrawal Mechanism — No Automated Processing Halt",
      description: "DPDP Act 2023 Section 11 requires that Data Principals can withdraw consent at any time and that processing must cease (except for legitimate uses). Current implementation logs the withdrawal but does not automatically halt scheduled data processing jobs that reference the withdrawn principal's data.",
      severity: "critical",
      finding_type: "major_nc",
      status: "open",
      framework: "DPDP",
      control_ref: "Section 11 — Consent Withdrawal Rights",
      recommendation: "Implement automated consent check in all scheduled data processing pipelines. Data principal status should be checked at job start. Estimated engineering effort: 3 weeks. Legal review required before deployment.",
      due_date: dateStr(daysAhead(21)),
      raised_by_email: "priya.sharma@nishithdesai.com",
    },
    {
      room_id: aiRoomId,
      title: "AI Output Logging — Governance Copilot™ Responses Not Retained",
      description: "ISO/IEC 42001 Clause 6.1.2 and NIST AI RMF MANAGE 4.1 require records of AI system outputs for auditability and incident investigation. Governance Copilot™ chat responses are not persisted beyond the user session, making retroactive review impossible.",
      severity: "medium",
      finding_type: "non_conformance",
      status: "verified",
      framework: "ISO 42001",
      control_ref: "ISO 42001 Clause 6.1.2 — AI Risk Assessment",
      recommendation: "Implement AI interaction logging to a dedicated, access-controlled table. Retain for 90 days minimum with automated purge. Include user ID, timestamp, model version, input hash, and output. Reviewed and closed after implementation evidence submitted.",
      due_date: dateStr(daysAgo(5)),
      raised_by_email: "deepa.iyer@kpmg.in",
    },
    {
      room_id: aiRoomId,
      title: "Gemini API — Prompt Injection Attack Surface Not Formally Assessed",
      description: "No formal threat model or penetration test specifically targeting prompt injection exists for the four production AI features (document extraction, NL search, risk narrative, compliance AI officer). This is a significant gap given the sensitivity of data processed.",
      severity: "high",
      finding_type: "recommendation",
      status: "closed",
      framework: "ISO 42001",
      control_ref: "NIST AI RMF GOVERN 1.2 — Policies for AI Risk",
      recommendation: "Commission a red team exercise targeting AI-specific attack vectors (prompt injection, data extraction, jailbreaking) by a specialist AI security firm. Budget: ₹8–12L. Timeline: Q3 2026. Closed after red team report received.",
      due_date: dateStr(daysAgo(10)),
      raised_by_email: "deepa.iyer@kpmg.in",
    },
    {
      room_id: isoRoomId,
      title: "Business Continuity Test — Last Exercise Exceeds 12-Month Policy Threshold",
      description: "AUDT's BCP requires an annual disaster recovery exercise. The most recent documented BCP test was conducted 14 months ago. While no outages have occurred, the absence of a tested recovery procedure represents a certification risk under Annex A.5.29.",
      severity: "medium",
      finding_type: "minor_nc",
      status: "in_remediation",
      framework: "ISO 27001",
      control_ref: "A.5.29 — Information Security During Disruption",
      recommendation: "Schedule and execute a BCP tabletop exercise within the next 30 days. Document results, identify gaps, and update the BCP accordingly. Submit evidence to Deloitte.",
      due_date: dateStr(daysAhead(20)),
      raised_by_email: "ananya.krishnan@deloitte.in",
    },
  ];

  let findingCount = 0;
  for (const f of externalFindings) {
    if (!f.room_id) continue;
    const existing = await sql`
      SELECT id FROM external_findings
      WHERE room_id = ${f.room_id} AND title = ${f.title}
      LIMIT 1
    `;
    if (existing.length > 0) continue;
    const raisedById = extUserIds[f.raised_by_email] ?? null;
    await sql`
      INSERT INTO external_findings (
        id, room_id, organization_id, title, description,
        severity, finding_type, status, framework, control_ref,
        recommendation, due_date, raised_by_id, owner_id,
        created_by, created_at, updated_at
      ) VALUES (
        ${randomUUID()}, ${f.room_id}, ${orgId}, ${f.title}, ${f.description},
        ${f.severity}, ${f.finding_type}, ${f.status},
        ${f.framework}, ${f.control_ref}, ${f.recommendation},
        ${f.due_date}, ${raisedById}, ${actorId}, ${actorId},
        ${daysAgo(Math.floor(Math.random() * 20 + 1))}, NOW()
      )
    `;
    findingCount++;
  }
  counts.external_findings = findingCount;
  console.log(`  ✓ Seeded ${findingCount} external findings (${externalFindings.length - findingCount} already existed)`);

  // ── 6. Assessment Projects ─────────────────────────────────────────────────

  const assessments = [
    {
      room_id: isoRoomId,
      name: "ISO 27001:2022 — Statement of Applicability Review",
      description: "Review and update of the Statement of Applicability (SoA) to reflect changes in Annex A controls and current risk treatment decisions.",
      assessment_type: "iso_27001",
      status: "in_progress",
      completion_pct: 65,
      start_date: dateStr(daysAgo(12)),
      end_date: dateStr(daysAhead(7)),
      lead_assessor_email: "vikram.nair@deloitte.in",
      open_findings: 2,
      pending_evidence: 3,
      total_milestones: 5,
      completed_milestones: 3,
    },
    {
      room_id: socRoomId,
      name: "SOC 2 Trust Services Criteria Gap Assessment",
      description: "Detailed gap analysis across all 64 Common Criteria and applicable Trust Services Criteria. Maps existing controls to TSC requirements and identifies testing gaps.",
      assessment_type: "soc2",
      status: "in_progress",
      completion_pct: 35,
      start_date: dateStr(daysAgo(25)),
      end_date: dateStr(daysAhead(35)),
      lead_assessor_email: "rahul.mehta@kpmg.in",
      open_findings: 2,
      pending_evidence: 5,
      total_milestones: 8,
      completed_milestones: 2,
    },
    {
      room_id: dpdpRoomId,
      name: "DPDP Act 2023 — Data Fiduciary Obligations Assessment",
      description: "Comprehensive assessment of all Data Fiduciary obligations under the DPDP Act, with gap analysis and prioritised compliance roadmap.",
      assessment_type: "dpdp",
      status: "planning",
      completion_pct: 10,
      start_date: dateStr(daysAhead(7)),
      end_date: dateStr(daysAhead(42)),
      lead_assessor_email: "priya.sharma@nishithdesai.com",
      open_findings: 1,
      pending_evidence: 2,
      total_milestones: 6,
      completed_milestones: 0,
    },
    {
      room_id: aiRoomId,
      name: "ISO/IEC 42001 — AI Management System Readiness",
      description: "Full readiness assessment against ISO/IEC 42001:2023. Includes AI system inventory, risk assessment methodology review, and governance documentation audit.",
      assessment_type: "ai_governance",
      status: "completed",
      completion_pct: 100,
      start_date: dateStr(daysAgo(40)),
      end_date: dateStr(daysAgo(5)),
      lead_assessor_email: "deepa.iyer@kpmg.in",
      open_findings: 1,
      pending_evidence: 0,
      total_milestones: 7,
      completed_milestones: 7,
      ai_readiness_score: 68.5,
    },
  ];

  let assessmentCount = 0;
  for (const a of assessments) {
    if (!a.room_id) continue;
    const existing = await sql`
      SELECT id FROM external_assessments
      WHERE room_id = ${a.room_id} AND name = ${a.name}
      LIMIT 1
    `;
    if (existing.length > 0) continue;
    const leadId = extUserIds[a.lead_assessor_email] ?? null;
    await sql`
      INSERT INTO external_assessments (
        id, room_id, organization_id, name, description,
        assessment_type, status, completion_pct, start_date, end_date,
        lead_assessor_id, open_findings, pending_evidence,
        total_milestones, completed_milestones, ai_readiness_score,
        created_by, created_at, updated_at
      ) VALUES (
        ${randomUUID()}, ${a.room_id}, ${orgId}, ${a.name}, ${a.description},
        ${a.assessment_type}, ${a.status}, ${a.completion_pct},
        ${a.start_date}, ${a.end_date}, ${leadId},
        ${a.open_findings}, ${a.pending_evidence},
        ${a.total_milestones}, ${a.completed_milestones},
        ${a.ai_readiness_score ?? null},
        ${actorId}, ${daysAgo(Math.floor(Math.random() * 30 + 1))}, NOW()
      )
    `;
    assessmentCount++;
  }
  counts.assessments = assessmentCount;
  console.log(`  ✓ Seeded ${assessmentCount} assessment projects (${assessments.length - assessmentCount} already existed)`);

  // ── 7. Audit Reviews ───────────────────────────────────────────────────────

  const auditReviews = [
    { room_id: isoRoomId, reviewer_email: "ananya.krishnan@deloitte.in", review_area: "controls",   status: "in_progress" },
    { room_id: isoRoomId, reviewer_email: "vikram.nair@deloitte.in",     review_area: "documents",  status: "in_progress" },
    { room_id: socRoomId, reviewer_email: "rahul.mehta@kpmg.in",         review_area: "controls",   status: "assigned"    },
    { room_id: dpdpRoomId, reviewer_email: "priya.sharma@nishithdesai.com", review_area: "policies", status: "assigned"   },
    { room_id: aiRoomId,  reviewer_email: "deepa.iyer@kpmg.in",          review_area: "ai_systems", status: "completed",  completed_at: daysAgo(5) },
  ];

  let reviewCount = 0;
  for (const r of auditReviews) {
    if (!r.room_id) continue;
    const reviewerId = extUserIds[r.reviewer_email] ?? null;
    if (!reviewerId) continue;
    const existing = await sql`
      SELECT id FROM audit_reviews
      WHERE room_id = ${r.room_id} AND reviewer_id = ${reviewerId}
      LIMIT 1
    `;
    if (existing.length > 0) continue;
    await sql`
      INSERT INTO audit_reviews (
        id, room_id, organization_id, reviewer_id, review_area,
        status, completed_at, created_at, updated_at
      ) VALUES (
        ${randomUUID()}, ${r.room_id}, ${orgId}, ${reviewerId},
        ${r.review_area}, ${r.status}, ${r.completed_at ?? null},
        NOW(), NOW()
      )
    `;
    reviewCount++;
  }
  counts.reviews = reviewCount;
  console.log(`  ✓ Seeded ${reviewCount} audit reviews (${auditReviews.length - reviewCount} already existed)`);

  // ── 8. Room Documents ──────────────────────────────────────────────────────

  const roomDocs = [
    { room_id: isoRoomId, document_name: "ISMS_InfoSecPolicy_v3.2_2026.pdf",    document_type: "policy",       source_module: "compliance" },
    { room_id: isoRoomId, document_name: "Risk_Register_Export_Q1_2026.xlsx",   document_type: "risk_register", source_module: "risks" },
    { room_id: isoRoomId, document_name: "Pentest_Report_2025_CyberSec.pdf",    document_type: "assessment",   source_module: "vendors" },
    { room_id: socRoomId, document_name: "SOC2_SystemDescription_Draft_v1.docx", document_type: "policy",       source_module: "compliance" },
    { room_id: socRoomId, document_name: "IncidentLog_H1_2026.csv",             document_type: "evidence",     source_module: "audit" },
    { room_id: aiRoomId,  document_name: "AI_Inventory_RiskClassification_v2.xlsx", document_type: "ai_assessment", source_module: "ai-governance" },
    { room_id: aiRoomId,  document_name: "Gemini_DPA_Google_Cloud_2025.pdf",    document_type: "contract",     source_module: "contracts" },
  ];

  let docCount = 0;
  for (const d of roomDocs) {
    if (!d.room_id) continue;
    const existing = await sql`
      SELECT id FROM audit_room_documents
      WHERE room_id = ${d.room_id} AND document_name = ${d.document_name}
      LIMIT 1
    `;
    if (existing.length > 0) continue;
    await sql`
      INSERT INTO audit_room_documents (
        id, room_id, organization_id, document_name, document_type,
        source_module, uploaded_by, created_at
      ) VALUES (
        ${randomUUID()}, ${d.room_id}, ${orgId}, ${d.document_name},
        ${d.document_type}, ${d.source_module}, ${actorId}, NOW()
      )
    `;
    docCount++;
  }
  counts.room_documents = docCount;
  console.log(`  ✓ Seeded ${docCount} room documents (${roomDocs.length - docCount} already existed)`);

  // ── 9. Room Activities ─────────────────────────────────────────────────────

  const activities = [
    { room_id: isoRoomId, activity_type: "audit_room.created",   description: "ISO 27001 surveillance audit room created." },
    { room_id: isoRoomId, activity_type: "evidence.requested",   description: "Evidence requested: Information Security Policy." },
    { room_id: isoRoomId, activity_type: "evidence.requested",   description: "Evidence requested: Annex A Access Control." },
    { room_id: isoRoomId, activity_type: "evidence.accepted",    description: "Evidence accepted: Information Security Policy." },
    { room_id: isoRoomId, activity_type: "evidence.accepted",    description: "Evidence accepted: Risk Register Q1 2026." },
    { room_id: isoRoomId, activity_type: "finding.created",      description: "Finding raised: Privileged Access Review overdue." },
    { room_id: isoRoomId, activity_type: "finding.created",      description: "Finding raised: Supplier Security Assessments." },
    { room_id: isoRoomId, activity_type: "finding.in_remediation", description: "Finding moved to In Remediation: Privileged Access Review." },
    { room_id: socRoomId, activity_type: "audit_room.created",   description: "SOC 2 Type II readiness room created." },
    { room_id: socRoomId, activity_type: "evidence.requested",   description: "Evidence requested: System Description." },
    { room_id: socRoomId, activity_type: "finding.created",      description: "Finding raised: Backup encryption gap (AES-128 vs AES-256)." },
    { room_id: socRoomId, activity_type: "finding.in_remediation", description: "Finding moved to In Remediation: Encryption at Rest." },
    { room_id: aiRoomId,  activity_type: "audit_room.created",   description: "AI Governance Review room created." },
    { room_id: aiRoomId,  activity_type: "evidence.accepted",    description: "Evidence accepted: AI System Inventory." },
    { room_id: aiRoomId,  activity_type: "evidence.accepted",    description: "Evidence accepted: Human Oversight Controls." },
    { room_id: aiRoomId,  activity_type: "finding.verified",     description: "Finding verified: AI Output Logging gaps remediated." },
    { room_id: aiRoomId,  activity_type: "finding.closed",       description: "Finding closed: Prompt Injection Red Team completed." },
    { room_id: aiRoomId,  activity_type: "assessment.completed", description: "ISO 42001 AI Management System Readiness Assessment completed." },
    { room_id: dpdpRoomId, activity_type: "audit_room.created",  description: "DPDP Compliance Assessment room created." },
    { room_id: dpdpRoomId, activity_type: "finding.created",     description: "Finding raised: Consent Withdrawal automation gap." },
  ];

  let activityCount = 0;
  for (const a of activities) {
    if (!a.room_id) continue;
    const existing = await sql`
      SELECT id FROM audit_room_activities
      WHERE room_id = ${a.room_id} AND description = ${a.description}
      LIMIT 1
    `;
    if (existing.length > 0) continue;
    await sql`
      INSERT INTO audit_room_activities (
        id, room_id, organization_id, activity_type, description,
        actor_id, metadata, created_at
      ) VALUES (
        ${randomUUID()}, ${a.room_id}, ${orgId},
        ${a.activity_type}, ${a.description}, ${actorId}, '{}',
        ${daysAgo(Math.floor(Math.random() * 30 + 1))}
      )
    `;
    activityCount++;
  }
  counts.activities = activityCount;
  console.log(`  ✓ Seeded ${activityCount} room activities (${activities.length - activityCount} already existed)`);

  // ── 10. Permissions ────────────────────────────────────────────────────────

  const perms = [
    { email: "ananya.krishnan@deloitte.in", room: isoRoomId,  level: "admin"   },
    { email: "vikram.nair@deloitte.in",     room: isoRoomId,  level: "review"  },
    { email: "rahul.mehta@kpmg.in",         room: socRoomId,  level: "admin"   },
    { email: "deepa.iyer@kpmg.in",          room: aiRoomId,   level: "admin"   },
    { email: "priya.sharma@nishithdesai.com", room: dpdpRoomId, level: "admin" },
    { email: "arjun.kapoor@nishithdesai.com", room: dpdpRoomId, level: "review" },
  ];

  let permCount = 0;
  for (const p of perms) {
    const userId = extUserIds[p.email];
    if (!userId || !p.room) continue;
    const existing = await sql`
      SELECT id FROM external_permissions
      WHERE external_user_id = ${userId} AND resource_id = ${p.room}
      LIMIT 1
    `;
    if (existing.length > 0) continue;
    await sql`
      INSERT INTO external_permissions (
        id, organization_id, external_user_id, resource_type,
        resource_id, permission_level, granted_by, created_at
      ) VALUES (
        ${randomUUID()}, ${orgId}, ${userId}, 'room',
        ${p.room}, ${p.level}, ${actorId}, NOW()
      )
    `;
    permCount++;
  }
  counts.permissions = permCount;
  console.log(`  ✓ Seeded ${permCount} room permissions (${perms.length - permCount} already existed)`);

  // ── Summary ───────────────────────────────────────────────────────────────

  await sql.end();

  console.log("\n✅ Auditor Collaboration™ seed complete");
  console.log("────────────────────────────────────────────");
  console.log(`   Auditor Organisations:  ${counts.auditor_orgs}`);
  console.log(`   External Users:         ${counts.external_users}`);
  console.log(`   Audit Rooms:            ${counts.rooms}`);
  console.log(`   Evidence Requests:      ${counts.evidence_requests}`);
  console.log(`   External Findings:      ${counts.external_findings}`);
  console.log(`   Assessment Projects:    ${counts.assessments}`);
  console.log(`   Audit Reviews:          ${counts.reviews}`);
  console.log(`   Room Documents:         ${counts.room_documents}`);
  console.log(`   Room Activities:        ${counts.activities}`);
  console.log(`   Room Permissions:       ${counts.permissions}`);
  console.log("────────────────────────────────────────────");
  console.log("   Visit: /auditor-collaboration");
}

// ── Entry point ───────────────────────────────────────────────────────────────

const arg = process.argv[2];
if (arg === "--list") {
  await listOrgs();
  await sql.end();
} else if (arg) {
  await seed(arg);
} else {
  const [org] = await sql`SELECT id, name FROM organizations ORDER BY created_at LIMIT 1`;
  if (!org) {
    console.error("No organizations found. Run seed-demo.mjs first.");
    process.exit(1);
  }
  console.log(`Auto-detected org: ${org.name} (${org.id})`);
  await seed(org.id);
}
