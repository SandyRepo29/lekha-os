#!/usr/bin/env node
/**
 * Seed: Regulatory Intelligence™
 * Seeds: changes, obligations, assessments, watchlists, alerts, tasks, updates
 */
import postgres from "postgres";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL is not set in .env.local");

const sql = postgres(DATABASE_URL, { ssl: "require", max: 1 });

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

async function getOrgAndUser() {
  const rows = await sql`
    SELECT m.organization_id, m.user_id
    FROM memberships m
    WHERE m.role = 'owner'
    ORDER BY m.created_at DESC
    LIMIT 1
  `;
  if (!rows.length) throw new Error("No owner membership found. Run seed-demo.mjs first.");
  return { orgId: rows[0].organization_id, userId: rows[0].user_id };
}

async function getBuiltinRegulations() {
  return sql`SELECT id, name, short_name FROM regulations WHERE is_builtin = true LIMIT 18`;
}

async function main() {
  console.log("🌱 Seeding Regulatory Intelligence™...");

  const { orgId, userId } = await getOrgAndUser();
  console.log(`   Org: ${orgId}`);

  const regs = await getBuiltinRegulations();
  if (!regs.length) {
    console.log("⚠️  No built-in regulations found. Run the migration first: node scripts/apply-sql.mjs supabase/migrations/0031_regulatory_intelligence.sql");
    await sql.end();
    return;
  }
  console.log(`   Found ${regs.length} built-in regulations`);

  const regMap = {};
  for (const r of regs) {
    regMap[r.short_name ?? r.name] = r.id;
  }

  // ─── Regulatory Changes ─────────────────────────────────────────────────────
  console.log("   Seeding regulatory changes...");
  const changeRows = await sql`
    INSERT INTO regulatory_changes (
      organization_id, regulation_id, title, description, change_type,
      severity, status, source, published_date, effective_date, created_by
    )
    VALUES
      (${orgId}, ${regMap["DPDP"]}, 'DPDP Rules Notified — Consent Framework Updates',
       'The Digital Personal Data Protection Rules 2025 have been notified, introducing new requirements for consent notices and data fiduciary obligations.',
       'amendment', 'critical', 'new', 'MeitY Official Gazette', ${daysAgo(5)}, ${daysFromNow(90)}, ${userId}),

      (${orgId}, ${regMap["ISO 27001"]}, 'ISO/IEC 27001:2022 Amendment — AI Controls Addendum',
       'ISO releases addendum to 27001:2022 incorporating AI-specific controls aligned with ISO 42001.',
       'amendment', 'high', 'under_review', 'ISO.org', ${daysAgo(12)}, ${daysFromNow(180)}, ${userId}),

      (${orgId}, ${regMap["GDPR"]}, 'EDPB Guidelines on Personal Data Transfers to Third Countries',
       'Updated EDPB guidelines clarifying standard contractual clauses for cross-border data transfers.',
       'guidance', 'medium', 'assessed', 'EDPB Official', ${daysAgo(20)}, ${daysFromNow(30)}, ${userId}),

      (${orgId}, ${regMap["EU AI Act"]}, 'EU AI Act — High-Risk AI System Registration Portal Live',
       'The EU AI Act Article 71 registration portal for high-risk AI systems is now operational. Compliance deadline: Q2 2026.',
       'enforcement', 'critical', 'new', 'EU Official Journal', ${daysAgo(3)}, ${daysFromNow(60)}, ${userId}),

      (${orgId}, ${regMap["DORA"]}, 'DORA — ICT Third-Party Risk Management Technical Standards',
       'EBA published final regulatory technical standards on ICT third-party risk management under DORA.',
       'guidance', 'high', 'new', 'EBA Official', ${daysAgo(8)}, ${daysFromNow(45)}, ${userId}),

      (${orgId}, ${regMap["NIS2"]}, 'NIS2 National Transposition Deadline Passed — Enforcement Active',
       'EU Member States NIS2 transposition period ended. National authorities have commenced enforcement actions.',
       'enforcement', 'high', 'actioned', 'ENISA', ${daysAgo(30)}, ${daysAgo(1)}, ${userId}),

      (${orgId}, ${regMap["NIST CSF"]}, 'NIST CSF 2.0 — Govern Function Released',
       'NIST released CSF 2.0 with a new Govern function encompassing organizational context, risk management, and supply chain.',
       'new_regulation', 'medium', 'assessed', 'NIST CSRC', ${daysAgo(45)}, ${daysAgo(15)}, ${userId}),

      (${orgId}, ${regMap["RBI CSF"]}, 'RBI Cybersecurity Framework — Cloud Governance Circular',
       'RBI issued a new circular on cloud governance and data localisation requirements for regulated entities.',
       'guidance', 'high', 'new', 'RBI Official', ${daysAgo(7)}, ${daysFromNow(120)}, ${userId})

    RETURNING id, title
  `;
  console.log(`   Created ${changeRows.length} regulatory changes`);

  // ─── Obligations ─────────────────────────────────────────────────────────────
  console.log("   Seeding obligations...");
  const dpdpRegId = regMap["DPDP"];
  const gdprRegId = regMap["GDPR"];
  const iso27001Id = regMap["ISO 27001"];
  const euAiActId = regMap["EU AI Act"];

  const obligationRows = await sql`
    INSERT INTO obligations (
      organization_id, regulation_id, title, description, requirement,
      obligation_ref, category, priority, status, business_unit, due_date, created_by
    )
    VALUES
      (${orgId}, ${dpdpRegId}, 'Publish Clear Consent Notice', 'Provide a clear and plain-language notice before collecting personal data', 'Section 5: Notice must specify purpose, data categories, and retention period', 'DPDP-S5-001', 'data_protection', 'critical', 'implemented', 'Legal & Compliance', ${daysFromNow(30)}, ${userId}),

      (${orgId}, ${dpdpRegId}, 'Establish Grievance Officer', 'Appoint a Grievance Officer accessible to Data Principals within India', 'Section 13: Grievance Officer must be an Indian resident with published contact details', 'DPDP-S13-001', 'governance', 'high', 'in_progress', 'Legal & Compliance', ${daysFromNow(45)}, ${userId}),

      (${orgId}, ${dpdpRegId}, 'Data Breach Notification — 72 Hours', 'Notify Data Protection Board and affected Data Principals within 72 hours of breach discovery', 'Section 8(6): Breach notification within 72 hours with specified information', 'DPDP-S8-001', 'reporting', 'critical', 'implemented', 'IT Security', null, ${userId}),

      (${orgId}, ${dpdpRegId}, 'Data Retention & Erasure Policy', 'Define and enforce data retention periods; erase data once purpose is fulfilled', 'Section 8(7): Erase personal data when purpose is served or consent withdrawn', 'DPDP-S8-002', 'data_protection', 'high', 'planned', 'IT & Data', ${daysFromNow(60)}, ${userId}),

      (${orgId}, ${gdprRegId}, 'Maintain Records of Processing Activities', 'Maintain Article 30 records of processing activities for all data processing operations', 'Article 30: RoPA must include purposes, categories, recipients, retention, and security measures', 'GDPR-A30-001', 'governance', 'high', 'implemented', 'Legal & Compliance', null, ${userId}),

      (${orgId}, ${gdprRegId}, 'Data Subject Rights Fulfilment — 30 Days', 'Respond to Data Subject Rights requests within 30 days', 'Articles 15-22: Access, Rectification, Erasure, Portability, Objection rights', 'GDPR-A15-001', 'data_protection', 'high', 'in_progress', 'Legal & Compliance', null, ${userId}),

      (${orgId}, ${iso27001Id}, 'Information Security Risk Assessment', 'Conduct and document information security risk assessments at planned intervals', 'ISO 27001:2022 Clause 6.1.2: Risk assessment methodology and criteria', 'ISO27001-6-001', 'governance', 'high', 'validated', 'IT Security', ${daysFromNow(90)}, ${userId}),

      (${orgId}, ${iso27001Id}, 'Security Awareness Training', 'Provide information security awareness training to all personnel', 'ISO 27001:2022 Clause 7.2: Competence and awareness training', 'ISO27001-7-001', 'training', 'medium', 'implemented', 'HR', null, ${userId}),

      (${orgId}, ${iso27001Id}, 'Supplier Security Assessment', 'Assess and monitor information security practices of all key suppliers', 'ISO 27001:2022 Annex A 5.19: Information security in supplier relationships', 'ISO27001-A519-001', 'third_party', 'medium', 'in_progress', 'Procurement', ${daysFromNow(45)}, ${userId}),

      (${orgId}, ${euAiActId}, 'Register High-Risk AI Systems', 'Register all high-risk AI systems in the EU AI Act database before market placement', 'EU AI Act Article 71: High-risk AI system registration in EU database', 'EUAI-A71-001', 'governance', 'critical', 'not_started', 'AI & Technology', ${daysFromNow(60)}, ${userId}),

      (${orgId}, ${euAiActId}, 'AI System Conformity Assessment', 'Conduct conformity assessment for high-risk AI systems before deployment', 'EU AI Act Article 43: Conformity assessment procedures', 'EUAI-A43-001', 'governance', 'critical', 'planned', 'AI & Technology', ${daysFromNow(90)}, ${userId}),

      (${orgId}, ${euAiActId}, 'AI System Technical Documentation', 'Maintain technical documentation for all AI systems as specified in Annex IV', 'EU AI Act Annex IV: Technical documentation requirements', 'EUAI-AnnIV-001', 'governance', 'high', 'in_progress', 'AI & Technology', ${daysFromNow(30)}, ${userId})

    RETURNING id, title
  `;
  console.log(`   Created ${obligationRows.length} obligations`);

  // ─── Regulatory Alerts ───────────────────────────────────────────────────────
  console.log("   Seeding regulatory alerts...");
  const alertRows = await sql`
    INSERT INTO regulatory_alerts (
      organization_id, regulation_id, title, description,
      alert_type, severity, status, due_date
    )
    VALUES
      (${orgId}, ${dpdpRegId}, 'DPDP Rules in Force — Immediate Action Required',
       'The DPDP Rules 2025 have been notified. Review consent frameworks, appoint Grievance Officer, and update privacy notices within 90 days.',
       'change_detected', 'critical', 'open', ${daysFromNow(90)}),

      (${orgId}, ${euAiActId}, 'EU AI Act High-Risk Registration Deadline Approaching',
       'Registration portal is now live. High-risk AI systems must be registered within 60 days.',
       'deadline_approaching', 'critical', 'open', ${daysFromNow(60)}),

      (${orgId}, ${regMap["DORA"]}, 'DORA ICT Third-Party Standards — Review Required',
       'New RTS on ICT third-party risk management published. Review vendor contracts and third-party risk assessments.',
       'new_obligation', 'high', 'open', ${daysFromNow(45)}),

      (${orgId}, ${regMap["ISO 27001"]}, 'ISO 27001 Annual Review Due',
       'Annual information security management review is due. Schedule management review meeting.',
       'review_due', 'medium', 'open', ${daysFromNow(30)}),

      (${orgId}, ${regMap["RBI CSF"]}, 'RBI Cloud Governance Circular — Compliance Action Required',
       'New RBI circular on cloud governance requires regulated entities to review cloud service provider contracts and data localisation.',
       'change_detected', 'high', 'open', ${daysFromNow(120)})

    RETURNING id
  `;
  console.log(`   Created ${alertRows.length} regulatory alerts`);

  // ─── Regulatory Assessments ──────────────────────────────────────────────────
  console.log("   Seeding regulatory assessments...");
  const assessmentRows = await sql`
    INSERT INTO regulatory_assessments (
      organization_id, regulation_id, title, status, impact_level,
      summary, affected_controls, affected_policies, affected_risks,
      remediation_effort, estimated_days, due_date, created_by
    )
    VALUES
      (${orgId}, ${dpdpRegId}, 'DPDP Rules 2025 — Full Impact Assessment',
       'in_progress', 'critical',
       'The DPDP Rules 2025 introduce significant changes to consent requirements, data localisation, and grievance management. This assessment covers impact across all data processing activities.',
       15, 8, 6, 'high', 90, ${daysFromNow(30)}, ${userId}),

      (${orgId}, ${euAiActId}, 'EU AI Act — High-Risk AI System Compliance Assessment',
       'draft', 'high',
       'Assessment of all AI systems against EU AI Act high-risk classification criteria. Identify systems requiring conformity assessment and registration.',
       8, 4, 5, 'high', 60, ${daysFromNow(45)}, ${userId}),

      (${orgId}, ${regMap["DORA"]}, 'DORA ICT Third-Party Risk RTS — Assessment',
       'completed', 'medium',
       'Review of vendor contracts and ICT third-party risk management against new DORA RTS requirements. 3 vendor contracts require updates.',
       5, 3, 4, 'medium', 30, ${daysAgo(5)}, ${userId})

    RETURNING id, title
  `;
  console.log(`   Created ${assessmentRows.length} regulatory assessments`);

  // ─── Watchlists ──────────────────────────────────────────────────────────────
  console.log("   Seeding watchlists...");
  const watchlistRows = await sql`
    INSERT INTO regulatory_watchlists (
      organization_id, name, description, watch_type, criteria, is_active, alert_on_change, created_by
    )
    VALUES
      (${orgId}, 'India Privacy Watchlist', 'Monitor DPDP Act, MeitY circulars, and Indian privacy regulation changes', 'country', '{"countries": ["India"], "topics": ["privacy", "data_protection"]}', true, true, ${userId}),
      (${orgId}, 'EU AI Regulation Watchlist', 'Track EU AI Act enforcement, AIAIA guidance, and member state implementation', 'topic', '{"topics": ["AI", "EU AI Act", "algorithmic accountability"]}', true, true, ${userId}),
      (${orgId}, 'Financial Services Regulation', 'Monitor RBI, SEBI, IRDAI circulars and global banking regulations', 'regulator', '{"regulators": ["RBI", "SEBI", "IRDAI", "DORA", "Basel"]}', true, true, ${userId}),
      (${orgId}, 'ISO Standards Watchlist', 'Track ISO 27001, ISO 27701, ISO 42001 updates and new standards', 'framework', '{"frameworks": ["ISO 27001", "ISO 27701", "ISO 42001"]}', true, true, ${userId}),
      (${orgId}, 'Cloud Security Compliance', 'Monitor cloud security frameworks, CSP compliance updates, and data residency requirements', 'topic', '{"topics": ["cloud_security", "data_residency", "shared_responsibility"]}', true, false, ${userId})

    RETURNING id, name
  `;
  console.log(`   Created ${watchlistRows.length} watchlists`);

  // ─── Regulatory Tasks ────────────────────────────────────────────────────────
  console.log("   Seeding regulatory tasks...");
  const taskRows = await sql`
    INSERT INTO regulatory_tasks (
      organization_id, title, description, task_type, priority, status, due_date, created_by
    )
    VALUES
      (${orgId}, 'Update Privacy Notice for DPDP Compliance', 'Revise website and app privacy notices to comply with DPDP Rules 2025 consent and disclosure requirements', 'update_policy', 'critical', 'in_progress', ${daysFromNow(20)}, ${userId}),
      (${orgId}, 'Appoint DPDP Grievance Officer', 'Designate and publish contact details for Grievance Officer under DPDP Section 13', 'implement', 'critical', 'open', ${daysFromNow(30)}, ${userId}),
      (${orgId}, 'EU AI Act AI System Inventory', 'Complete inventory of all AI systems and classify against EU AI Act risk tiers', 'review', 'critical', 'in_progress', ${daysFromNow(15)}, ${userId}),
      (${orgId}, 'Register High-Risk AI Systems on EU Database', 'Submit registration for all high-risk AI systems on the EU AI Act Article 71 database', 'implement', 'critical', 'open', ${daysFromNow(60)}, ${userId}),
      (${orgId}, 'DORA Vendor Contract Review', 'Review all ICT third-party vendor contracts against DORA RTS requirements; update agreements as needed', 'review', 'high', 'in_progress', ${daysFromNow(45)}, ${userId}),
      (${orgId}, 'ISO 27001 Annual Management Review', 'Conduct and document annual ISMS management review per ISO 27001 Clause 9.3', 'review', 'medium', 'open', ${daysFromNow(30)}, ${userId}),
      (${orgId}, 'RBI Cloud Governance Policy Update', 'Update cloud governance policy and vendor agreements to comply with RBI cloud circular', 'update_policy', 'high', 'open', ${daysFromNow(60)}, ${userId}),
      (${orgId}, 'GDPR Data Subject Request SLA Audit', 'Audit response times for all DSR requests in last 12 months; identify SLA breaches', 'verify', 'medium', 'completed', ${daysAgo(5)}, ${userId})

    RETURNING id, title
  `;
  console.log(`   Created ${taskRows.length} regulatory tasks`);

  // ─── Regulatory Updates (curated feed) ──────────────────────────────────────
  console.log("   Seeding regulatory updates...");
  await sql`
    INSERT INTO regulatory_updates (
      organization_id, regulation_id, title, summary, update_date, is_read
    )
    VALUES
      (${orgId}, ${dpdpRegId}, 'DPDP Rules 2025 — Summary of Key Changes',
       'The DPDP Rules 2025 introduce mandatory consent managers, age verification for children, and specific retention limits for various data categories.',
       ${daysAgo(3)}, false),

      (${orgId}, ${euAiActId}, 'EU AI Act Implementation Timeline',
       'Full EU AI Act enforcement timeline: prohibited AI (Feb 2025), high-risk AI (Aug 2026), general-purpose AI (Aug 2025).',
       ${daysAgo(7)}, false),

      (${orgId}, ${regMap["NIST CSF"]}, 'NIST CSF 2.0 Adoption Guide for Organizations',
       'NIST releases implementation guide for migrating from CSF 1.1 to CSF 2.0, including the new Govern function mapping.',
       ${daysAgo(14)}, true),

      (${orgId}, ${regMap["ISO 27001"]}, 'ISO 27001:2022 Transition Deadline — Key Considerations',
       'October 2025 marks the end of the ISO 27001:2013 certification period. All organizations must transition to 2022 version.',
       ${daysAgo(21)}, true)

    RETURNING id
  `;
  console.log("   Created regulatory updates");

  console.log("");
  console.log("✅ Regulatory Intelligence™ seed complete!");
  console.log("   ─────────────────────────────────────────");
  console.log(`   Changes:     ${changeRows.length}`);
  console.log(`   Obligations: ${obligationRows.length}`);
  console.log(`   Assessments: ${assessmentRows.length}`);
  console.log(`   Alerts:      ${alertRows.length}`);
  console.log(`   Watchlists:  ${watchlistRows.length}`);
  console.log(`   Tasks:       ${taskRows.length}`);
  console.log("");
  console.log("   Visit: /regulatory-intelligence");

  await sql.end();
}

main().catch(e => {
  console.error("Seed failed:", e.message);
  sql.end();
  process.exit(1);
});
