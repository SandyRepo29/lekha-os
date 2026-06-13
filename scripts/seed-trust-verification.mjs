#!/usr/bin/env node
/**
 * Seed script for Trust Verification Authority™ (Module 23)
 * Run: node scripts/seed-trust-verification.mjs [orgId]
 *
 * Seeds: 3 verification applications, 2 approved with certificates, 1 pending.
 */

import postgres from "postgres";
import { createHash, randomBytes } from "crypto";
import { config } from "dotenv";
config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL missing"); process.exit(1); }

const sql = postgres(DATABASE_URL, { ssl: "require", max: 1 });

async function getOrgAndUser() {
  const rows = await sql`
    SELECT m.organization_id, m.user_id
    FROM memberships m
    WHERE m.role = 'owner'
    ORDER BY m.created_at
    LIMIT 1
  `;
  if (!rows.length) throw new Error("No org/owner found. Run seed-demo.mjs first.");
  return rows[0];
}

async function getProgram(slug) {
  const rows = await sql`SELECT id, name, validity_months FROM verification_programs WHERE slug = ${slug} LIMIT 1`;
  return rows[0];
}

async function getOrgName(orgId) {
  const rows = await sql`SELECT name FROM organizations WHERE id = ${orgId} LIMIT 1`;
  return rows[0]?.name ?? "Demo Organization";
}

async function main() {
  console.log("🔐 Seeding Trust Verification Authority™...\n");

  const { organization_id: orgId, user_id: userId } = await getOrgAndUser();
  const orgName = await getOrgName(orgId);
  console.log(`  Org: ${orgName} (${orgId})`);

  // Check if already seeded
  const existing = await sql`SELECT id FROM tva_verifications WHERE organization_id = ${orgId} LIMIT 1`;
  if (existing.length) {
    console.log("  Already seeded — skipping (idempotent).");
    await sql.end();
    return;
  }

  // 1. Approved verification — AUDT Verified™
  const audtVerified = await getProgram("audt-verified");
  if (audtVerified) {
    const v1 = await sql`
      INSERT INTO tva_verifications (organization_id, program_id, status, verification_level, readiness_score, trust_score_at_apply, applicant_id, applied_at, review_started_at, decided_at, expires_at)
      VALUES (${orgId}, ${audtVerified.id}, 'approved', 'level_2', 88, 88, ${userId}, now() - interval '45 days', now() - interval '40 days', now() - interval '30 days', now() + interval '335 days')
      RETURNING id
    `;
    const vId = v1[0].id;

    // Initial review
    await sql`
      INSERT INTO verification_reviews (organization_id, verification_id, review_type, status, reviewer_id, reviewer_notes, score, recommendation, started_at, completed_at)
      VALUES (${orgId}, ${vId}, 'initial', 'completed', ${userId}, 'Strong governance posture with high control health and evidence coverage.', 88, 'approve', now() - interval '40 days', now() - interval '30 days')
    `;

    // Evidence items
    const evidenceItems = [
      { title: "ISO 27001 Risk Register Q1 2026", type: "risk_register", status: "accepted" },
      { title: "SOC 2 Type I Report — March 2026",  type: "audit_report",   status: "accepted" },
      { title: "Information Security Policy v3.2",   type: "policy",         status: "accepted" },
      { title: "Vendor Assessment — Tier 1 Vendors", type: "vendor_assessment", status: "accepted" },
    ];
    for (const ev of evidenceItems) {
      await sql`
        INSERT INTO verification_evidence (organization_id, verification_id, evidence_type, title, status, submitted_by, reviewed_by, submitted_at, reviewed_at)
        VALUES (${orgId}, ${vId}, ${ev.type}, ${ev.title}, ${ev.status}, ${userId}, ${userId}, now() - interval '42 days', now() - interval '31 days')
      `;
    }

    // Decision
    await sql`
      INSERT INTO verification_decisions (organization_id, verification_id, decision, decided_by, rationale, effective_date, review_date)
      VALUES (${orgId}, ${vId}, 'approved', ${userId}, 'Organization demonstrates a mature governance posture with strong Trust Score, control health, and evidence coverage.', now() - interval '30 days', now() + interval '335 days')
    `;

    // Certificate
    const certNum = `AUDT-2026-${randomBytes(3).toString("hex").toUpperCase()}`;
    const hash = createHash("sha256").update(`${certNum}-${orgId}`).digest("hex").slice(0, 16);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://audt.tech";
    const publicUrl = `${siteUrl}/verify/${certNum}`;
    const expiresAt = new Date(Date.now() + 335 * 24 * 3600 * 1000);

    const cert = await sql`
      INSERT INTO verification_certificates (organization_id, verification_id, program_id, certificate_number, verification_level, status, issued_at, expires_at, verification_hash, public_url, qr_data, issued_by, certificate_data)
      VALUES (${orgId}, ${vId}, ${audtVerified.id}, ${certNum}, 'level_2', 'active', now() - interval '30 days', ${expiresAt.toISOString()}, ${hash}, ${publicUrl}, ${publicUrl}, ${userId}, ${JSON.stringify({ programName: audtVerified.name, hash, issuedBy: userId })})
      RETURNING id
    `;
    const certId = cert[0].id;

    // Update verification with cert id
    await sql`UPDATE tva_verifications SET certificate_id = ${certId} WHERE id = ${vId}`;

    // Registry entry
    await sql`
      INSERT INTO verification_registry (organization_id, certificate_id, display_name, industry, trust_score, verification_level, program_name, badge_types, is_public, published_at, expires_at)
      VALUES (${orgId}, ${certId}, ${orgName}, 'saas', 88, 'level_2', 'AUDT Verified™', '["audt_verified"]', true, now() - interval '30 days', ${expiresAt.toISOString()})
      ON CONFLICT (certificate_id) DO NOTHING
    `;

    // Badge
    await sql`
      INSERT INTO verification_badges (organization_id, verification_id, program_id, badge_type, name, status, issued_at, expires_at, issued_by)
      VALUES (${orgId}, ${vId}, ${audtVerified.id}, 'audt_verified', 'AUDT Verified™', 'active', now() - interval '30 days', ${expiresAt.toISOString()}, ${userId})
    `;

    // Renewal
    const renewalDue = new Date(expiresAt.getTime() - 30 * 24 * 3600 * 1000);
    await sql`
      INSERT INTO verification_renewals (organization_id, verification_id, certificate_id, status, renewal_due_date)
      VALUES (${orgId}, ${vId}, ${certId}, 'upcoming', ${renewalDue.toISOString().split("T")[0]})
    `;

    // Events
    for (const [etype, offset] of [["verification.created",45],["verification.review_started",40],["verification.approved",30],["certificate.issued",30]]) {
      await sql`
        INSERT INTO verification_events (organization_id, verification_id, event_type, actor_id, details, created_at)
        VALUES (${orgId}, ${vId}, ${etype}, ${userId}, ${JSON.stringify({ certNumber: certNum })}, now() - interval '${sql.unsafe(String(offset))} days')
      `;
    }

    console.log(`  ✅ AUDT Verified™ — Certificate ${certNum}`);
  }

  // 2. Approved verification — Privacy Ready™
  const privacyReady = await getProgram("privacy-ready");
  if (privacyReady) {
    const v2 = await sql`
      INSERT INTO tva_verifications (organization_id, program_id, status, verification_level, readiness_score, trust_score_at_apply, applicant_id, applied_at, review_started_at, decided_at, expires_at)
      VALUES (${orgId}, ${privacyReady.id}, 'approved', 'level_1', 82, 82, ${userId}, now() - interval '20 days', now() - interval '15 days', now() - interval '7 days', now() + interval '358 days')
      RETURNING id
    `;
    const vId = v2[0].id;

    const certNum2 = `AUDT-2026-${randomBytes(3).toString("hex").toUpperCase()}`;
    const hash2 = createHash("sha256").update(`${certNum2}-${orgId}`).digest("hex").slice(0, 16);
    const siteUrl2 = process.env.NEXT_PUBLIC_SITE_URL ?? "https://audt.tech";
    const publicUrl2 = `${siteUrl2}/verify/${certNum2}`;
    const expiresAt2 = new Date(Date.now() + 358 * 24 * 3600 * 1000);

    const cert2 = await sql`
      INSERT INTO verification_certificates (organization_id, verification_id, program_id, certificate_number, verification_level, status, issued_at, expires_at, verification_hash, public_url, qr_data, issued_by, certificate_data)
      VALUES (${orgId}, ${vId}, ${privacyReady.id}, ${certNum2}, 'level_1', 'active', now() - interval '7 days', ${expiresAt2.toISOString()}, ${hash2}, ${publicUrl2}, ${publicUrl2}, ${userId}, ${JSON.stringify({ programName: privacyReady.name, hash: hash2 })})
      RETURNING id
    `;

    await sql`UPDATE tva_verifications SET certificate_id = ${cert2[0].id} WHERE id = ${vId}`;
    await sql`
      INSERT INTO verification_badges (organization_id, verification_id, program_id, badge_type, name, status, issued_at, expires_at, issued_by)
      VALUES (${orgId}, ${vId}, ${privacyReady.id}, 'privacy_ready', 'Privacy Ready™', 'active', now() - interval '7 days', ${expiresAt2.toISOString()}, ${userId})
    `;
    await sql`
      INSERT INTO verification_events (organization_id, verification_id, event_type, actor_id, created_at)
      VALUES (${orgId}, ${vId}, 'verification.approved', ${userId}, now() - interval '7 days')
    `;
    console.log(`  ✅ Privacy Ready™ — Certificate ${certNum2}`);
  }

  // 3. Pending verification — Enterprise Ready™
  const enterpriseReady = await getProgram("enterprise-ready");
  if (enterpriseReady) {
    const v3 = await sql`
      INSERT INTO tva_verifications (organization_id, program_id, status, verification_level, readiness_score, trust_score_at_apply, applicant_id, applied_at)
      VALUES (${orgId}, ${enterpriseReady.id}, 'pending', 'level_1', 76, 76, ${userId}, now() - interval '3 days')
      RETURNING id
    `;
    const vId = v3[0].id;
    await sql`
      INSERT INTO verification_reviews (organization_id, verification_id, review_type, status, due_date)
      VALUES (${orgId}, ${vId}, 'initial', 'pending', now() + interval '11 days')
    `;
    await sql`
      INSERT INTO verification_evidence (organization_id, verification_id, evidence_type, title, status, submitted_by, submitted_at)
      VALUES (${orgId}, ${vId}, 'policy', 'Information Security Policy v3.2', 'pending', ${userId}, now() - interval '2 days')
    `;
    await sql`
      INSERT INTO verification_events (organization_id, verification_id, event_type, actor_id, created_at)
      VALUES (${orgId}, ${vId}, 'verification.created', ${userId}, now() - interval '3 days')
    `;
    console.log(`  ⏳ Enterprise Ready™ — Application pending review`);
  }

  console.log("\n✅ Trust Verification Authority™ seed complete!");
  console.log("   Run: node scripts/check-db.mjs to verify table counts.");
  await sql.end();
}

main().catch(e => { console.error(e); sql.end(); process.exit(1); });
