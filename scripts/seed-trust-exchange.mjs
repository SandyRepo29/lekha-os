/**
 * Seed script — Third-Party Risk Exchange™ (Module 15)
 * Creates a published Trust Profile, sample documents, badges, and a global questionnaire.
 *
 * Usage: node scripts/seed-trust-exchange.mjs [orgId]
 *        node scripts/seed-trust-exchange.mjs --list
 */

import postgres from "postgres";
import { randomUUID } from "crypto";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = postgres(DATABASE_URL, { ssl: "require", max: 1 });

async function listOrgs() {
  const rows = await sql`SELECT id, name FROM organizations ORDER BY created_at LIMIT 20`;
  console.log("Organizations:");
  rows.forEach((r) => console.log(`  ${r.id}  ${r.name}`));
}

async function seed(orgId) {
  console.log(`Seeding Trust Exchange for org: ${orgId}`);

  // 1. Get org details
  const [org] = await sql`SELECT id, name, industry, country, website, logo_url, company_size FROM organizations WHERE id = ${orgId}`;
  if (!org) { console.error("Org not found"); process.exit(1); }

  // 2. Upsert trust profile
  const [profile] = await sql`
    INSERT INTO trust_profiles (organization_id, display_name, tagline, description, industry, company_size, country, website, logo_url, is_published, visibility, trust_score, privacy_score, risk_level, profile_completeness, certifications)
    VALUES (${orgId}, ${org.name}, 'AI-Native Governance Platform', 'AUDT is a leading AI-native Trust, Risk & Compliance platform trusted by enterprises across India.', ${org.industry ?? 'saas'}, ${org.company_size ?? '51_200'}, ${org.country ?? 'India'}, ${org.website ?? 'https://audt.tech'}, ${org.logo_url}, true, 'public', 92, 88, 'low', 100, '["ISO 27001","SOC 2","DPDP Ready"]'::jsonb)
    ON CONFLICT (organization_id) DO UPDATE SET
      is_published = true, visibility = 'public', trust_score = 92, privacy_score = 88, risk_level = 'low', profile_completeness = 100, certifications = '["ISO 27001","SOC 2","DPDP Ready"]'::jsonb, updated_at = NOW()
    RETURNING *
  `;
  console.log(`  ✓ Trust Profile: ${profile.id}`);

  // 3. Sample documents
  const docs = [
    { docType: "iso27001", title: "ISO 27001:2022 Certificate", issuer: "BSI Group", issuedDate: "2024-01-15", expiryDate: "2025-01-14", visibility: "public", isVerified: true, verificationLevel: "auditor_verified" },
    { docType: "soc2", title: "SOC 2 Type II Report 2024", issuer: "Deloitte & Touche", issuedDate: "2024-03-01", expiryDate: "2025-03-01", visibility: "network", isVerified: true, verificationLevel: "auditor_verified" },
    { docType: "pen_test", title: "Penetration Test Report Q1 2024", issuer: "CrowdStrike Services", issuedDate: "2024-02-15", expiryDate: "2025-02-14", visibility: "specific", isVerified: false, verificationLevel: "self_attested" },
    { docType: "dpdp", title: "DPDP Compliance Certificate 2024", issuer: "AUDT Internal", issuedDate: "2024-06-01", expiryDate: "2025-05-31", visibility: "public", isVerified: true, verificationLevel: "customer_verified" },
    { docType: "cyber_insurance", title: "Cyber Liability Insurance Policy", issuer: "HDFC Ergo", issuedDate: "2024-04-01", expiryDate: "2025-03-31", visibility: "private", isVerified: false, verificationLevel: "self_attested" },
  ];

  for (const d of docs) {
    await sql`
      INSERT INTO trust_documents (organization_id, trust_profile_id, doc_type, title, issuer, issued_date, expiry_date, visibility, is_verified, verification_level)
      VALUES (${orgId}, ${profile.id}, ${d.docType}, ${d.title}, ${d.issuer}, ${d.issuedDate}, ${d.expiryDate}, ${d.visibility}, ${d.isVerified}, ${d.verificationLevel})
      ON CONFLICT DO NOTHING
    `;
  }
  console.log(`  ✓ ${docs.length} trust documents seeded`);

  // 4. Trust badges
  const badges = [
    { badgeType: "audt_verified", label: "AUDT Verified™", description: "Verified by AUDT platform" },
    { badgeType: "dpdp_ready", label: "DPDP Ready™", description: "Compliant with India DPDP Act 2023" },
    { badgeType: "iso_verified", label: "ISO Verified™", description: "ISO 27001:2022 certified" },
    { badgeType: "low_risk", label: "Low Risk Vendor™", description: "Risk score consistently below 30" },
  ];

  for (const b of badges) {
    await sql`
      INSERT INTO trust_badges (organization_id, trust_profile_id, badge_type, label, description, is_active)
      VALUES (${orgId}, ${profile.id}, ${b.badgeType}, ${b.label}, ${b.description}, true)
      ON CONFLICT DO NOTHING
    `;
  }
  console.log(`  ✓ ${badges.length} trust badges issued`);

  // 5. Global questionnaire template
  const [q] = await sql`
    INSERT INTO trust_questionnaires (title, description, category, is_global, question_count)
    VALUES ('AUDT Vendor Security Assessment', 'Standard vendor security questionnaire covering access control, data protection, incident response, and business continuity.', 'security', true, 25)
    ON CONFLICT DO NOTHING
    RETURNING id
  `;

  if (q) {
    // Seed a sample answer for this org
    await sql`
      INSERT INTO trust_answers (organization_id, trust_profile_id, questionnaire_id, answers, completion_percent, visibility)
      VALUES (${orgId}, ${profile.id}, ${q.id}, '{"q1":"Yes, we use MFA across all systems","q2":"ISO 27001:2022 certified since 2024","q3":"Annual penetration testing by CrowdStrike","q4":"24-hour incident response SLA","q5":"AWS Mumbai with full encryption at rest"}'::jsonb, 75, 'network')
      ON CONFLICT (organization_id, questionnaire_id) DO UPDATE SET completion_percent = 75, updated_at = NOW()
    `;
    console.log(`  ✓ Global questionnaire + sample answers seeded`);
  }

  // 6. Activity log
  await sql`
    INSERT INTO trust_activity (organization_id, activity_type, entity_id, entity_type, description)
    VALUES
      (${orgId}, 'profile_created', ${profile.id}, 'trust_profile', 'Trust Profile published to directory'),
      (${orgId}, 'document_verified', ${profile.id}, 'trust_document', 'ISO 27001 certificate verified'),
      (${orgId}, 'badge_issued', ${profile.id}, 'trust_badge', 'AUDT Verified™ badge issued')
  `;
  console.log("  ✓ Activity log seeded");

  console.log("\n✅ Trust Exchange seed complete.");
  console.log(`   Profile URL: /trust-exchange/my-profile`);
  console.log(`   Directory:   /trust-exchange/directory`);
}

const args = process.argv.slice(2);
if (args[0] === "--list") {
  await listOrgs();
} else if (args[0]) {
  await seed(args[0]);
} else {
  // Try to find first org
  const [first] = await sql`SELECT id FROM organizations ORDER BY created_at LIMIT 1`;
  if (first) {
    await seed(first.id);
  } else {
    console.error("No organizations found. Pass an org ID as argument.");
    await listOrgs();
  }
}

await sql.end();
