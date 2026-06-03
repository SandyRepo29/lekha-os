/**
 * Seed built-in compliance framework controls for one or all organisations.
 *
 * Usage:
 *   node scripts/seed-compliance-frameworks.mjs                 # seed for ALL orgs
 *   node scripts/seed-compliance-frameworks.mjs <orgId>         # seed for a specific org
 *   node scripts/seed-compliance-frameworks.mjs --list          # show framework stats only
 *
 * Idempotent — skips frameworks that already have controls.
 */

import postgres from "postgres";
import { config } from "dotenv";
import { randomUUID } from "crypto";

config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, { prepare: false, onnotice: () => {} });

// ---- Template data (must match lib/constants/compliance-framework-templates.ts) -----

const TEMPLATES = [
  {
    key: "iso27001",
    name: "ISO 27001:2022",
    version: "2022",
    description: "Information Security Management System",
    controls: [
      // A.5 Organisational
      { ref: "A.5.1",  name: "Policies for information security",                              cat: "Organisational", pri: "high"     },
      { ref: "A.5.2",  name: "Information security roles and responsibilities",                cat: "Organisational", pri: "high"     },
      { ref: "A.5.3",  name: "Segregation of duties",                                         cat: "Organisational", pri: "high"     },
      { ref: "A.5.4",  name: "Management responsibilities",                                   cat: "Organisational", pri: "medium"   },
      { ref: "A.5.5",  name: "Contact with authorities",                                      cat: "Organisational", pri: "low"      },
      { ref: "A.5.6",  name: "Contact with special interest groups",                          cat: "Organisational", pri: "low"      },
      { ref: "A.5.7",  name: "Threat intelligence",                                           cat: "Organisational", pri: "high"     },
      { ref: "A.5.8",  name: "Information security in project management",                    cat: "Organisational", pri: "medium"   },
      { ref: "A.5.9",  name: "Inventory of information and other associated assets",          cat: "Organisational", pri: "medium"   },
      { ref: "A.5.10", name: "Acceptable use of information and other associated assets",     cat: "Organisational", pri: "medium"   },
      { ref: "A.5.11", name: "Return of assets",                                              cat: "Organisational", pri: "medium"   },
      { ref: "A.5.12", name: "Classification of information",                                 cat: "Organisational", pri: "high"     },
      { ref: "A.5.13", name: "Labelling of information",                                      cat: "Organisational", pri: "medium"   },
      { ref: "A.5.14", name: "Information transfer",                                          cat: "Organisational", pri: "high"     },
      { ref: "A.5.15", name: "Access control",                                                cat: "Access Control", pri: "critical" },
      { ref: "A.5.16", name: "Identity management",                                           cat: "Access Control", pri: "critical" },
      { ref: "A.5.17", name: "Authentication information",                                    cat: "Access Control", pri: "critical" },
      { ref: "A.5.18", name: "Access rights",                                                 cat: "Access Control", pri: "critical" },
      { ref: "A.5.19", name: "Information security in supplier relationships",                cat: "Supplier",       pri: "high"     },
      { ref: "A.5.20", name: "Addressing information security within supplier agreements",    cat: "Supplier",       pri: "high"     },
      { ref: "A.5.21", name: "Managing information security in the ICT supply chain",         cat: "Supplier",       pri: "high"     },
      { ref: "A.5.22", name: "Monitoring, review and change management of supplier services", cat: "Supplier",       pri: "medium"   },
      { ref: "A.5.23", name: "Information security for use of cloud services",               cat: "Cloud",          pri: "high"     },
      { ref: "A.5.24", name: "Information security incident management planning and preparation", cat: "Incident",   pri: "critical" },
      { ref: "A.5.25", name: "Assessment and decision on information security events",        cat: "Incident",       pri: "critical" },
      { ref: "A.5.26", name: "Response to information security incidents",                    cat: "Incident",       pri: "critical" },
      { ref: "A.5.27", name: "Learning from information security incidents",                  cat: "Incident",       pri: "high"     },
      { ref: "A.5.28", name: "Collection of evidence",                                        cat: "Incident",       pri: "high"     },
      { ref: "A.5.29", name: "Information security during disruption",                        cat: "Continuity",     pri: "high"     },
      { ref: "A.5.30", name: "ICT readiness for business continuity",                         cat: "Continuity",     pri: "high"     },
      { ref: "A.5.31", name: "Legal, statutory, regulatory and contractual requirements",     cat: "Compliance",     pri: "high"     },
      { ref: "A.5.32", name: "Intellectual property rights",                                  cat: "Compliance",     pri: "medium"   },
      { ref: "A.5.33", name: "Protection of records",                                         cat: "Compliance",     pri: "high"     },
      { ref: "A.5.34", name: "Privacy and protection of PII",                                 cat: "Privacy",        pri: "critical" },
      { ref: "A.5.35", name: "Independent review of information security",                    cat: "Governance",     pri: "medium"   },
      { ref: "A.5.36", name: "Compliance with policies, rules and standards",                 cat: "Governance",     pri: "medium"   },
      { ref: "A.5.37", name: "Documented operating procedures",                               cat: "Organisational", pri: "medium"   },
      // A.6 People
      { ref: "A.6.1",  name: "Screening",                                                     cat: "HR",             pri: "high"     },
      { ref: "A.6.2",  name: "Terms and conditions of employment",                            cat: "HR",             pri: "high"     },
      { ref: "A.6.3",  name: "Information security awareness, education and training",        cat: "HR",             pri: "high"     },
      { ref: "A.6.4",  name: "Disciplinary process",                                          cat: "HR",             pri: "medium"   },
      { ref: "A.6.5",  name: "Responsibilities after termination or change of employment",    cat: "HR",             pri: "high"     },
      { ref: "A.6.6",  name: "Confidentiality or non-disclosure agreements",                  cat: "HR",             pri: "high"     },
      { ref: "A.6.7",  name: "Remote working",                                                cat: "HR",             pri: "high"     },
      { ref: "A.6.8",  name: "Information security event reporting",                          cat: "Incident",       pri: "high"     },
      // A.7 Physical
      { ref: "A.7.1",  name: "Physical security perimeters",                                  cat: "Physical",       pri: "high"     },
      { ref: "A.7.2",  name: "Physical entry",                                                cat: "Physical",       pri: "high"     },
      { ref: "A.7.3",  name: "Securing offices, rooms and facilities",                        cat: "Physical",       pri: "medium"   },
      { ref: "A.7.4",  name: "Physical security monitoring",                                  cat: "Physical",       pri: "medium"   },
      { ref: "A.7.5",  name: "Protecting against physical and environmental threats",         cat: "Physical",       pri: "high"     },
      { ref: "A.7.6",  name: "Working in secure areas",                                       cat: "Physical",       pri: "medium"   },
      { ref: "A.7.7",  name: "Clear desk and clear screen",                                   cat: "Physical",       pri: "medium"   },
      { ref: "A.7.8",  name: "Equipment siting and protection",                               cat: "Physical",       pri: "medium"   },
      { ref: "A.7.9",  name: "Security of assets off-premises",                               cat: "Physical",       pri: "medium"   },
      { ref: "A.7.10", name: "Storage media",                                                 cat: "Physical",       pri: "high"     },
      { ref: "A.7.11", name: "Supporting utilities",                                          cat: "Physical",       pri: "medium"   },
      { ref: "A.7.12", name: "Cabling security",                                              cat: "Physical",       pri: "medium"   },
      { ref: "A.7.13", name: "Equipment maintenance",                                         cat: "Physical",       pri: "medium"   },
      { ref: "A.7.14", name: "Secure disposal or re-use of equipment",                        cat: "Physical",       pri: "high"     },
      // A.8 Technological
      { ref: "A.8.1",  name: "User endpoint devices",                                         cat: "Technology",     pri: "high"     },
      { ref: "A.8.2",  name: "Privileged access rights",                                      cat: "Access Control", pri: "critical" },
      { ref: "A.8.3",  name: "Information access restriction",                                cat: "Access Control", pri: "critical" },
      { ref: "A.8.4",  name: "Access to source code",                                         cat: "Access Control", pri: "high"     },
      { ref: "A.8.5",  name: "Secure authentication",                                         cat: "Access Control", pri: "critical" },
      { ref: "A.8.6",  name: "Capacity management",                                           cat: "Technology",     pri: "medium"   },
      { ref: "A.8.7",  name: "Protection against malware",                                    cat: "Technology",     pri: "critical" },
      { ref: "A.8.8",  name: "Management of technical vulnerabilities",                       cat: "Technology",     pri: "critical" },
      { ref: "A.8.9",  name: "Configuration management",                                      cat: "Technology",     pri: "high"     },
      { ref: "A.8.10", name: "Information deletion",                                          cat: "Privacy",        pri: "high"     },
      { ref: "A.8.11", name: "Data masking",                                                  cat: "Privacy",        pri: "high"     },
      { ref: "A.8.12", name: "Data leakage prevention",                                       cat: "Technology",     pri: "critical" },
      { ref: "A.8.13", name: "Information backup",                                            cat: "Technology",     pri: "critical" },
      { ref: "A.8.14", name: "Redundancy of information processing facilities",              cat: "Technology",     pri: "high"     },
      { ref: "A.8.15", name: "Logging",                                                       cat: "Technology",     pri: "critical" },
      { ref: "A.8.16", name: "Monitoring activities",                                         cat: "Technology",     pri: "critical" },
      { ref: "A.8.17", name: "Clock synchronization",                                         cat: "Technology",     pri: "medium"   },
      { ref: "A.8.18", name: "Use of privileged utility programs",                            cat: "Technology",     pri: "high"     },
      { ref: "A.8.19", name: "Installation of software on operational systems",               cat: "Technology",     pri: "high"     },
      { ref: "A.8.20", name: "Networks security",                                             cat: "Network",        pri: "high"     },
      { ref: "A.8.21", name: "Security of network services",                                  cat: "Network",        pri: "high"     },
      { ref: "A.8.22", name: "Segregation of networks",                                       cat: "Network",        pri: "high"     },
      { ref: "A.8.23", name: "Web filtering",                                                 cat: "Network",        pri: "medium"   },
      { ref: "A.8.24", name: "Use of cryptography",                                           cat: "Cryptography",   pri: "critical" },
      { ref: "A.8.25", name: "Secure development lifecycle",                                  cat: "Development",    pri: "high"     },
      { ref: "A.8.26", name: "Application security requirements",                             cat: "Development",    pri: "high"     },
      { ref: "A.8.27", name: "Secure system architecture and engineering principles",         cat: "Development",    pri: "high"     },
      { ref: "A.8.28", name: "Secure coding",                                                 cat: "Development",    pri: "high"     },
      { ref: "A.8.29", name: "Security testing in development and acceptance",                cat: "Development",    pri: "high"     },
      { ref: "A.8.30", name: "Outsourced development",                                        cat: "Development",    pri: "medium"   },
      { ref: "A.8.31", name: "Separation of development, test and production environments",   cat: "Development",    pri: "high"     },
      { ref: "A.8.32", name: "Change management",                                             cat: "Development",    pri: "high"     },
      { ref: "A.8.33", name: "Test information",                                              cat: "Development",    pri: "medium"   },
      { ref: "A.8.34", name: "Protection of information systems during audit testing",        cat: "Governance",     pri: "low"      },
    ],
  },
  {
    key: "soc2",
    name: "SOC 2 Type II",
    version: "2017",
    description: "Trust Service Criteria",
    controls: [
      { ref: "CC1.1", name: "COSO Principle 1 — Integrity and ethics",             cat: "Control Environment", pri: "high"     },
      { ref: "CC1.2", name: "COSO Principle 2 — Board oversight",                  cat: "Control Environment", pri: "high"     },
      { ref: "CC1.3", name: "COSO Principle 3 — Organisational structure",         cat: "Control Environment", pri: "medium"   },
      { ref: "CC1.4", name: "COSO Principle 4 — Competence of personnel",          cat: "Control Environment", pri: "medium"   },
      { ref: "CC1.5", name: "COSO Principle 5 — Accountability",                   cat: "Control Environment", pri: "medium"   },
      { ref: "CC2.1", name: "Information quality for internal controls",            cat: "Communication",       pri: "medium"   },
      { ref: "CC2.2", name: "Internal communication of control information",        cat: "Communication",       pri: "medium"   },
      { ref: "CC2.3", name: "External communication of control information",        cat: "Communication",       pri: "medium"   },
      { ref: "CC3.1", name: "Specifies suitable objectives",                        cat: "Risk Assessment",     pri: "high"     },
      { ref: "CC3.2", name: "Identifies and analyses risk",                         cat: "Risk Assessment",     pri: "high"     },
      { ref: "CC3.3", name: "Considers fraud potential",                            cat: "Risk Assessment",     pri: "high"     },
      { ref: "CC3.4", name: "Identifies and assesses significant change",           cat: "Risk Assessment",     pri: "high"     },
      { ref: "CC4.1", name: "Conducts ongoing and separate evaluations",            cat: "Monitoring",          pri: "medium"   },
      { ref: "CC4.2", name: "Evaluates and communicates deficiencies",              cat: "Monitoring",          pri: "medium"   },
      { ref: "CC5.1", name: "Selects and develops control activities",              cat: "Control Activities",  pri: "high"     },
      { ref: "CC5.2", name: "Selects and develops technology controls",             cat: "Control Activities",  pri: "high"     },
      { ref: "CC5.3", name: "Deploys through policies and procedures",              cat: "Control Activities",  pri: "medium"   },
      { ref: "CC6.1", name: "Logical access security software",                     cat: "Access Control",      pri: "critical" },
      { ref: "CC6.2", name: "New internal user access provisioning",                cat: "Access Control",      pri: "critical" },
      { ref: "CC6.3", name: "User access modifications and removals",               cat: "Access Control",      pri: "critical" },
      { ref: "CC6.4", name: "Physical access security measures",                    cat: "Physical",            pri: "high"     },
      { ref: "CC6.5", name: "Logical and physical access removal on termination",   cat: "Access Control",      pri: "critical" },
      { ref: "CC6.6", name: "External threats to system components",                cat: "Technology",          pri: "critical" },
      { ref: "CC6.7", name: "Transmission, movement and removal of information",    cat: "Data Protection",     pri: "high"     },
      { ref: "CC6.8", name: "Prevention and detection of malicious software",       cat: "Technology",          pri: "critical" },
      { ref: "CC7.1", name: "Configuration and vulnerability management",           cat: "Technology",          pri: "critical" },
      { ref: "CC7.2", name: "Monitors infrastructure for anomalies",                cat: "Technology",          pri: "critical" },
      { ref: "CC7.3", name: "Evaluates security events",                            cat: "Incident",            pri: "critical" },
      { ref: "CC7.4", name: "Responds to identified security incidents",            cat: "Incident",            pri: "critical" },
      { ref: "CC7.5", name: "Identifies, develops and implements remediation",      cat: "Incident",            pri: "high"     },
      { ref: "CC8.1", name: "Authorises, designs, develops and tests changes",      cat: "Change Management",   pri: "high"     },
      { ref: "CC9.1", name: "Identifies and selects risk mitigation activities",    cat: "Risk",                pri: "high"     },
      { ref: "CC9.2", name: "Assesses and manages vendor and business partner risk",cat: "Supplier",            pri: "high"     },
    ],
  },
  {
    key: "dpdp",
    name: "DPDP Act 2023",
    version: "2023",
    description: "Digital Personal Data Protection Act — India",
    controls: [
      { ref: "DPDP.1",  name: "Lawful processing — notice and consent",             cat: "Consent",         pri: "critical" },
      { ref: "DPDP.2",  name: "Purpose limitation",                                  cat: "Data Principles", pri: "critical" },
      { ref: "DPDP.3",  name: "Data minimisation",                                   cat: "Data Principles", pri: "high"     },
      { ref: "DPDP.4",  name: "Data accuracy",                                       cat: "Data Principles", pri: "high"     },
      { ref: "DPDP.5",  name: "Storage limitation",                                  cat: "Data Principles", pri: "high"     },
      { ref: "DPDP.6",  name: "Security safeguards",                                 cat: "Security",        pri: "critical" },
      { ref: "DPDP.7",  name: "Data breach notification",                            cat: "Incident",        pri: "critical" },
      { ref: "DPDP.8",  name: "Grievance redressal mechanism",                       cat: "Rights",          pri: "high"     },
      { ref: "DPDP.9",  name: "Data principal right to access",                      cat: "Rights",          pri: "high"     },
      { ref: "DPDP.10", name: "Data principal right to correction and erasure",      cat: "Rights",          pri: "high"     },
      { ref: "DPDP.11", name: "Data principal right to nominate",                    cat: "Rights",          pri: "medium"   },
      { ref: "DPDP.12", name: "Cross-border data transfers",                         cat: "Transfers",       pri: "high"     },
      { ref: "DPDP.13", name: "Children's personal data",                            cat: "Consent",         pri: "critical" },
      { ref: "DPDP.14", name: "Consent Manager obligations",                         cat: "Consent",         pri: "medium"   },
      { ref: "DPDP.15", name: "Significant Data Fiduciary obligations",              cat: "Governance",      pri: "high"     },
      { ref: "DPDP.16", name: "Data Protection Impact Assessment (DPIA)",            cat: "Governance",      pri: "high"     },
      { ref: "DPDP.17", name: "Data processing agreements with processors",          cat: "Supplier",        pri: "high"     },
      { ref: "DPDP.18", name: "Retention and deletion policy",                       cat: "Data Principles", pri: "high"     },
    ],
  },
  {
    key: "pcidss",
    name: "PCI DSS v4.0",
    version: "4.0",
    description: "Payment Card Industry Data Security Standard",
    controls: [
      { ref: "Req 1",  name: "Install and maintain network security controls",                  cat: "Network",         pri: "critical" },
      { ref: "Req 2",  name: "Apply secure configurations to all system components",            cat: "Technology",      pri: "critical" },
      { ref: "Req 3",  name: "Protect stored account data",                                     cat: "Data Protection", pri: "critical" },
      { ref: "Req 4",  name: "Protect cardholder data with strong cryptography in transit",     cat: "Cryptography",    pri: "critical" },
      { ref: "Req 5",  name: "Protect all systems and networks from malicious software",        cat: "Technology",      pri: "critical" },
      { ref: "Req 6",  name: "Develop and maintain secure systems and software",                cat: "Development",     pri: "critical" },
      { ref: "Req 7",  name: "Restrict access to system components by business need to know",   cat: "Access Control",  pri: "critical" },
      { ref: "Req 8",  name: "Identify users and authenticate access to system components",     cat: "Access Control",  pri: "critical" },
      { ref: "Req 9",  name: "Restrict physical access to cardholder data",                     cat: "Physical",        pri: "high"     },
      { ref: "Req 10", name: "Log and monitor all access to system components and cardholder data", cat: "Monitoring",  pri: "critical" },
      { ref: "Req 11", name: "Test security of systems and networks regularly",                 cat: "Testing",         pri: "high"     },
      { ref: "Req 12", name: "Support information security with organisational policies",       cat: "Governance",      pri: "high"     },
    ],
  },
  {
    key: "hipaa",
    name: "HIPAA",
    version: "2013",
    description: "Health Insurance Portability and Accountability Act security safeguards",
    controls: [
      { ref: "§164.308(a)(1)", name: "Security management process",                 cat: "Administrative", pri: "critical" },
      { ref: "§164.308(a)(2)", name: "Assigned security responsibility",             cat: "Administrative", pri: "high"     },
      { ref: "§164.308(a)(3)", name: "Workforce security",                           cat: "Administrative", pri: "high"     },
      { ref: "§164.308(a)(4)", name: "Information access management",                cat: "Administrative", pri: "critical" },
      { ref: "§164.308(a)(5)", name: "Security awareness and training",              cat: "Administrative", pri: "high"     },
      { ref: "§164.308(a)(6)", name: "Security incident procedures",                 cat: "Administrative", pri: "critical" },
      { ref: "§164.308(a)(7)", name: "Contingency plan",                             cat: "Administrative", pri: "high"     },
      { ref: "§164.308(a)(8)", name: "Evaluation",                                   cat: "Administrative", pri: "medium"   },
      { ref: "§164.308(b)(1)", name: "Business associate contracts",                 cat: "Administrative", pri: "high"     },
      { ref: "§164.310(a)(1)", name: "Facility access controls",                     cat: "Physical",       pri: "high"     },
      { ref: "§164.310(b)",    name: "Workstation use",                               cat: "Physical",       pri: "medium"   },
      { ref: "§164.310(c)",    name: "Workstation security",                          cat: "Physical",       pri: "medium"   },
      { ref: "§164.310(d)(1)", name: "Device and media controls",                    cat: "Physical",       pri: "high"     },
      { ref: "§164.312(a)(1)", name: "Access control",                               cat: "Technical",      pri: "critical" },
      { ref: "§164.312(b)",    name: "Audit controls",                                cat: "Technical",      pri: "critical" },
      { ref: "§164.312(c)(1)", name: "Integrity controls",                           cat: "Technical",      pri: "high"     },
      { ref: "§164.312(d)",    name: "Person or entity authentication",               cat: "Technical",      pri: "critical" },
      { ref: "§164.312(e)(1)", name: "Transmission security",                        cat: "Technical",      pri: "critical" },
    ],
  },
];

// ---- Helpers ----------------------------------------------------------------

async function getOrgs(targetOrgId) {
  if (targetOrgId) {
    return sql`select id, name from organizations where id = ${targetOrgId}`;
  }
  return sql`select id, name from organizations order by created_at`;
}

async function seedForOrg(orgId, orgName) {
  console.log(`\n📋 Org: ${orgName} (${orgId})`);
  let totalSeeded = 0;

  for (const tpl of TEMPLATES) {
    // Check if framework already exists
    const existing = await sql`
      select id from frameworks
      where organization_id = ${orgId} and name = ${tpl.name}
      limit 1
    `;

    let frameworkId;

    if (existing.length > 0) {
      frameworkId = existing[0].id;

      // Check if controls already seeded
      const [{ n }] = await sql`
        select count(*)::int n from controls where framework_id = ${frameworkId}
      `;
      if (n > 0) {
        console.log(`  ✓ ${tpl.name}: already has ${n} controls — skipping`);
        continue;
      }
      console.log(`  ↻ ${tpl.name}: framework exists but has no controls — seeding`);
    } else {
      // Create framework
      const [fw] = await sql`
        insert into frameworks (id, organization_id, name, version, description, status, created_at, updated_at)
        values (${randomUUID()}, ${orgId}, ${tpl.name}, ${tpl.version}, ${tpl.description}, 'not_started', now(), now())
        returning id
      `;
      frameworkId = fw.id;
      console.log(`  + ${tpl.name}: created framework`);
    }

    // Bulk insert controls
    const rows = tpl.controls.map((c) => ({
      id: randomUUID(),
      organization_id: orgId,
      framework_id: frameworkId,
      control_ref: c.ref,
      name: c.name,
      category: c.cat,
      priority: c.pri,
      status: "not_implemented",
      created_at: new Date(),
      updated_at: new Date(),
    }));

    for (const row of rows) {
      await sql`
        insert into controls (id, organization_id, framework_id, control_ref, name, category, priority, status, created_at, updated_at)
        values (${row.id}, ${row.organization_id}, ${row.framework_id}, ${row.control_ref}, ${row.name}, ${row.category}, ${row.priority}, ${row.status}, ${row.created_at}, ${row.updated_at})
        on conflict do nothing
      `;
    }

    // Upsert initial readiness score at 0
    const scoreId = randomUUID();
    await sql`
      insert into readiness_scores (id, organization_id, framework_id, overall_score, control_coverage, evidence_coverage, policy_coverage, computed_at)
      values (${scoreId}, ${orgId}, ${frameworkId}, 0, 0, 0, 0, now())
      on conflict (organization_id, framework_id) do nothing
    `;

    console.log(`  ✓ ${tpl.name}: ${rows.length} controls seeded`);
    totalSeeded += rows.length;
  }

  return totalSeeded;
}

// ---- Main -------------------------------------------------------------------

const args = process.argv.slice(2);

if (args.includes("--list")) {
  console.log("\n📚 Built-in framework templates:\n");
  for (const t of TEMPLATES) {
    console.log(`  ${t.name} (${t.key}) — ${t.controls.length} controls`);
  }
  const total = TEMPLATES.reduce((n, t) => n + t.controls.length, 0);
  console.log(`\n  Total: ${total} controls across ${TEMPLATES.length} frameworks`);
  await sql.end();
  process.exit(0);
}

const targetOrgId = args[0] ?? null;

if (targetOrgId) {
  console.log(`\n🎯 Seeding for org: ${targetOrgId}`);
} else {
  console.log("\n🌱 Seeding compliance frameworks for ALL organisations\n");
}

try {
  const orgs = await getOrgs(targetOrgId);

  if (orgs.length === 0) {
    console.log("No organisations found.");
    await sql.end();
    process.exit(0);
  }

  let grand = 0;
  for (const org of orgs) {
    const seeded = await seedForOrg(org.id, org.name);
    grand += seeded;
  }

  console.log(`\n✅ Done — ${grand} controls seeded across ${orgs.length} org(s)`);
} catch (err) {
  console.error("❌ Error:", err.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
