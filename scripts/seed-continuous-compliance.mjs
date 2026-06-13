#!/usr/bin/env node
/**
 * Seed script: Continuous Compliance™ — Module 28
 * Seeds demo data for: access reviews, attestations, training, signals, health scores, readiness, automation rules
 */
import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

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

async function main() {
  console.log("Seeding Continuous Compliance™...");

  const { organization_id: orgId, user_id: userId } = await getOrgAndUser();

  // ── Access Reviews ───────────────────────────────────────────────────────────
  console.log("  → Access Reviews...");
  await sql`
    INSERT INTO access_reviews
      (organization_id, name, description, campaign_type, status, risk_level, due_date, started_at, completed_at, total_users, reviewed_users, approved_count, revoked_count, completion_rate, created_by)
    VALUES
      (${orgId}, 'Q2 2026 Quarterly Access Review', 'Quarterly review of all user access across production systems',
       'quarterly', 'active', 'high', '2026-06-30', '2026-06-01', NULL, 45, 28, 24, 4, 62, ${userId}),
      (${orgId}, 'Privileged Access Review — Engineering', 'Review of admin and privileged access for engineering team',
       'privileged', 'completed', 'critical', '2026-05-31', '2026-05-01', '2026-05-28', 12, 12, 9, 3, 100, ${userId}),
      (${orgId}, 'Annual Vendor Access Review', 'Annual review of all vendor and third-party access',
       'vendor', 'draft', 'medium', '2026-07-31', NULL, NULL, 0, 0, 0, 0, 0, ${userId})
    ON CONFLICT DO NOTHING
  `;

  // ── Attestations ─────────────────────────────────────────────────────────────
  console.log("  → Attestations...");
  await sql`
    INSERT INTO attestations
      (organization_id, title, description, policy_type, status, version, due_date, total_assigned, total_completed, completion_rate, created_by)
    VALUES
      (${orgId}, 'Information Security Policy 2026', 'Annual attestation for the organization''s information security policy',
       'security_policy', 'active', '2.1', '2026-06-30', 120, 98, 82, ${userId}),
      (${orgId}, 'Acceptable Use Policy', 'Acceptable use of company systems and data',
       'acceptable_use', 'active', '1.5', '2026-07-15', 120, 115, 96, ${userId}),
      (${orgId}, 'AI Governance & Ethics Policy', 'Attestation for responsible AI use and governance policy',
       'ai_policy', 'active', '1.0', '2026-08-01', 45, 12, 27, ${userId})
    ON CONFLICT DO NOTHING
  `;

  // ── Training Campaigns ───────────────────────────────────────────────────────
  console.log("  → Training Campaigns...");
  await sql`
    INSERT INTO training_campaigns
      (organization_id, title, description, training_type, status, due_date, total_assigned, total_completed, completion_rate, passing_score, created_by)
    VALUES
      (${orgId}, 'Security Awareness Training 2026', 'Annual security awareness training for all employees',
       'security_awareness', 'active', '2026-06-30', 120, 87, 73, 80, ${userId}),
      (${orgId}, 'DPDP Privacy Compliance Training', 'India DPDP Act 2023 compliance training for data handlers',
       'privacy_training', 'active', '2026-07-15', 35, 28, 80, 75, ${userId}),
      (${orgId}, 'AI Governance Training', 'Responsible AI use, bias detection, and governance training',
       'ai_governance', 'active', '2026-08-01', 45, 8, 18, 85, ${userId})
    ON CONFLICT DO NOTHING
  `;

  // ── Compliance Signals ───────────────────────────────────────────────────────
  console.log("  → Compliance Signals...");
  await sql`
    INSERT INTO compliance_signals
      (organization_id, signal_type, severity, status, title, description, source_module)
    VALUES
      (${orgId}, 'check_failed', 'critical', 'open',
       'Secret scanning disabled on 4 GitHub repositories',
       'GitHub secret scanning is disabled on repositories: api-gateway, auth-service, data-pipeline, ml-models',
       'github'),
      (${orgId}, 'check_warning', 'high', 'open',
       '8 inactive Okta users detected',
       '8 users have not logged in for 90+ days and still have active Okta accounts',
       'okta'),
      (${orgId}, 'training_overdue', 'medium', 'open',
       '33 employees have overdue security training',
       'Security Awareness Training 2026 is due in 17 days and 33 employees have not completed it',
       'training'),
      (${orgId}, 'access_review', 'medium', 'open',
       'Q2 Access Review completion below 70%',
       'The Q2 Quarterly Access Review is 62% complete with 13 days remaining until due date',
       'access_review')
    ON CONFLICT DO NOTHING
  `;
  await sql`
    INSERT INTO compliance_signals
      (organization_id, signal_type, severity, status, title, description, source_module, resolved_at)
    VALUES
      (${orgId}, 'check_warning', 'medium', 'resolved',
       'S3 public buckets resolved',
       'Previously detected public S3 buckets have been remediated',
       'aws', '2026-06-10')
    ON CONFLICT DO NOTHING
  `;

  // ── Compliance Health Score ──────────────────────────────────────────────────
  console.log("  → Compliance Health Score...");
  await sql`
    INSERT INTO compliance_health_scores
      (organization_id, score, level, check_success_rate, open_findings, evidence_freshness, training_completion, access_review_rate, snapshot_at)
    VALUES
      (${orgId}, 74, 'needs_attention', 71, 4, 78, 73, 62, NOW())
    ON CONFLICT DO NOTHING
  `;

  // ── Continuous Readiness ─────────────────────────────────────────────────────
  console.log("  → Continuous Readiness...");
  await sql`
    INSERT INTO continuous_readiness
      (organization_id, framework_name, readiness_score, passing_checks, total_checks, passing_controls, total_controls, evidence_coverage, trend, snapshot_at)
    VALUES
      (${orgId}, 'SOC 2',     78, 14, 18, 26, 33, 82, 'improving', NOW()),
      (${orgId}, 'ISO 27001', 72, 11, 15, 67, 93, 76, 'stable',    NOW()),
      (${orgId}, 'DPDP',      85, 8,  9,  15, 18, 88, 'improving', NOW()),
      (${orgId}, 'NIST',      65, 9,  14, 0,  0,  60, 'stable',    NOW()),
      (${orgId}, 'ISO 42001', 55, 4,  7,  0,  0,  50, 'improving', NOW())
    ON CONFLICT DO NOTHING
  `;

  // ── Automation Rules ─────────────────────────────────────────────────────────
  console.log("  → Automation Rules...");
  await sql`
    INSERT INTO automation_rules
      (organization_id, name, description, status, trigger_type, trigger_config, actions, run_count, last_run_at, created_by)
    VALUES
      (${orgId}, 'MFA Check Failure → Create Issue',
       'When any MFA check fails, automatically create a high-severity issue',
       'active', 'check_failed',
       '{"checkSlug":"mfa"}'::jsonb,
       '[{"type":"create_issue","config":{"severity":"high","title":"MFA compliance failure detected"}},{"type":"notify","config":{"role":"security_manager"}}]'::jsonb,
       3, '2026-06-10', ${userId}),
      (${orgId}, 'Trust Score Drop → Trigger Review',
       'When org trust score drops by 5+ points, trigger a governance review',
       'active', 'trust_score_drop',
       '{"threshold":5}'::jsonb,
       '[{"type":"trigger_review","config":{"reviewType":"governance"}},{"type":"notify","config":{"role":"compliance_manager"}}]'::jsonb,
       1, '2026-06-05', ${userId}),
      (${orgId}, 'Training Overdue → Escalate',
       'When training completion rate drops below 70%, send reminders',
       'active', 'training_overdue',
       '{"threshold":70}'::jsonb,
       '[{"type":"send_reminder","config":{"message":"Complete your required training"}},{"type":"notify","config":{"role":"admin"}}]'::jsonb,
       2, '2026-06-12', ${userId})
    ON CONFLICT DO NOTHING
  `;

  console.log("\n✓ Continuous Compliance™ seeded successfully.");
  console.log("  → 3 access reviews");
  console.log("  → 3 attestations");
  console.log("  → 3 training campaigns");
  console.log("  → 5 compliance signals (4 open, 1 resolved)");
  console.log("  → 1 health score snapshot (74/100 — Needs Attention)");
  console.log("  → 5 readiness snapshots (SOC 2: 78%, ISO 27001: 72%, DPDP: 85%, NIST: 65%, ISO 42001: 55%)");
  console.log("  → 3 automation rules");

  await sql.end();
}

main().catch(e => { console.error(e); process.exit(1); });
