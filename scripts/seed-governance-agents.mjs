#!/usr/bin/env node
/**
 * Seed script: Governance Agent Framework™ — Module 29
 * Seeds demo data for: agents, agent runs, observations, recommendations, actions, metrics
 */
import postgres from "postgres";
import { config } from "dotenv";
config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const sql = postgres(DATABASE_URL, { ssl: "require", max: 1 });

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function hoursAfter(isoDate, hours) {
  const d = new Date(isoDate);
  d.setTime(d.getTime() + hours * 60 * 60 * 1000);
  return d.toISOString();
}

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
  console.log("Seeding Governance Agent Framework™...");

  const { organization_id: orgId, user_id: userId } = await getOrgAndUser();

  // ── Agents ────────────────────────────────────────────────────────────────────
  console.log("  → Agents...");
  const agentRows = await sql`
    INSERT INTO agents
      (organization_id, name, slug, description, agent_type, status, execution_mode, trigger_type,
       schedule, is_builtin, created_by)
    VALUES
      (${ orgId },
       'Compliance Agent',
       'compliance-agent',
       'Continuously monitors compliance controls, evidence freshness, and framework readiness. Surfaces gaps and generates remediation recommendations.',
       'compliance', 'active', 'advisory', 'schedule', '0 * * * *',
       true, ${ userId }),

      (${ orgId },
       'Risk Agent',
       'risk-agent',
       'Monitors risk posture across all categories. Detects new risk signals from connected systems, scores residual risk, and escalates critical exposures for approval.',
       'risk', 'active', 'approval_required', 'event', NULL,
       true, ${ userId }),

      (${ orgId },
       'Vendor Agent',
       'vendor-agent',
       'Monitors vendor trust scores, document expiry, and assessment due dates. Proactively alerts on deteriorating vendor relationships.',
       'vendor', 'active', 'advisory', 'schedule', '0 6 * * *',
       true, ${ userId }),

      (${ orgId },
       'Audit Agent',
       'audit-agent',
       'Prepares audit readiness reports, tracks CAPA progress, and identifies evidence gaps ahead of scheduled audits.',
       'audit', 'active', 'advisory', 'manual', NULL,
       true, ${ userId }),

      (${ orgId },
       'Privacy Agent',
       'privacy-agent',
       'Monitors DPDP and privacy compliance: consent records, data subject requests, retention policy adherence, and cross-border transfer compliance.',
       'privacy', 'active', 'advisory', 'threshold', NULL,
       true, ${ userId }),

      (${ orgId },
       'Contract Agent',
       'contract-agent',
       'Scans contract obligations, renewal timelines, and clause risk. Alerts on approaching renewals and overdue obligations.',
       'contract', 'active', 'advisory', 'schedule', '0 9 * * 1',
       true, ${ userId }),

      (${ orgId },
       'Trust Agent',
       'trust-agent',
       'Monitors the overall Trust Score across all modules, benchmarks against industry peers, and recommends trust-building actions.',
       'trust', 'active', 'advisory', 'schedule', '0 0 * * *',
       true, ${ userId }),

      (${ orgId },
       'AI Governance Agent',
       'ai-governance-agent',
       'Monitors AI systems for risk, compliance, and trust. Flags model drift, unreviewed AI incidents, and missing AI controls.',
       'ai_governance', 'active', 'advisory', 'event', NULL,
       true, ${ userId })
    ON CONFLICT (slug, COALESCE(organization_id, '00000000-0000-0000-0000-000000000000'::uuid)) DO UPDATE SET updated_at = now()
    RETURNING id, agent_type
    `;

  const compId = agentRows.find(r => r.agent_type === 'compliance')?.id;
  const riskId = agentRows.find(r => r.agent_type === 'risk')?.id;
  const vendorId = agentRows.find(r => r.agent_type === 'vendor')?.id;
  const auditId = agentRows.find(r => r.agent_type === 'audit')?.id;
  if (!compId) throw new Error('Compliance agent not found after insert');

  const runIds = [];
  const completedRuns = [];

  // ── Agent Observations ────────────────────────────────────────────────────────
  console.log("  → Agent Observations...");

  const observationData = [
    { agentId: compId, type: "control_failure", severity: "critical",
      title: "MFA control failing on 3 production systems",
      description: "Automated check aws-root-mfa reports failure. Root account MFA has been disabled on AWS org root. This violates SOC 2 CC6.1 and ISO 27001 A.9.4.2.",
      sourceModule: "continuous_compliance", confidence: 95 },

    { agentId: compId, type: "policy_expiry", severity: "high",
      title: "Information Security Policy due for annual review",
      description: "The Information Security Policy v2.1 was last reviewed 11 months ago. The annual review is overdue in 14 days. 120 attestation sign-offs may need re-collection.",
      sourceModule: "policy_governance", confidence: 92 },

    { agentId: compId, type: "control_failure", severity: "medium",
      title: "Evidence freshness below threshold for 7 controls",
      description: "7 controls have evidence older than 90 days. Controls: CC6.3, CC6.6, A.12.4.1, A.12.6.1 and 3 others. Evidence refresh required before next audit.",
      sourceModule: "compliance", confidence: 88 },

    { agentId: riskId, type: "vendor_risk", severity: "critical",
      title: "Tier-1 vendor trust score dropped below 60",
      description: "Vendor trust score fell from 72 to 54 over the last 7 days. Triggers: 2 overdue document renewals, failed security assessment, and 1 open critical finding.",
      sourceModule: "vendor_hub", confidence: 91 },

    { agentId: riskId, type: "trust_decline", severity: "high",
      title: "Organizational Trust Score declined 8 points in 7 days",
      description: "Org Trust Score dropped from 79 to 71. Primary drivers: control health deterioration (-12 pts), 3 new critical risks opened, compliance coverage flat.",
      sourceModule: "trust_intelligence", confidence: 97 },

    { agentId: riskId, type: "control_failure", severity: "high",
      title: "4 risk treatments overdue with no owner assigned",
      description: "Risk treatments for RISK-0042, RISK-0051, RISK-0067, RISK-0078 are overdue. None have an active owner assigned. Target dates passed 7-21 days ago.",
      sourceModule: "risk_lens", confidence: 99 },

    { agentId: riskId, type: "vendor_risk", severity: "medium",
      title: "3 vendors have open critical risks with no treatment plan",
      description: "Vendors in Tier-1 have open critical risks with no associated treatment strategies. This increases residual risk exposure across the vendor portfolio.",
      sourceModule: "vendor_hub", confidence: 84 },

    { agentId: vendorId, type: "vendor_risk", severity: "high",
      title: "12 vendor documents expiring within 30 days",
      description: "12 documents across 6 vendors are expiring in the next 30 days. Affected doc types: ISO certificates (4), SOC 2 reports (3), NDA renewals (3), insurance certs (2).",
      sourceModule: "vendor_hub", confidence: 99 },

    { agentId: vendorId, type: "overdue_obligation", severity: "medium",
      title: "5 vendor contract obligations past due date",
      description: "Contract obligations for 5 vendors are overdue: SLA reporting (2), security questionnaire returns (2), and one compliance certification renewal.",
      sourceModule: "contract_governance", confidence: 96 },

    { agentId: compId, type: "policy_expiry", severity: "low",
      title: "Data Retention Policy approaching review cycle",
      description: "Data Retention Policy v1.3 is due for review in 45 days. Recommend scheduling review now to allow time for stakeholder sign-offs.",
      sourceModule: "policy_governance", confidence: 78 },

    { agentId: riskId, type: "trust_decline", severity: "high",
      title: "AI Trust Score below acceptable threshold for 2 systems",
      description: "AI systems 'ML Fraud Detector' and 'Customer Churn Model' have AI Trust Scores of 48 and 52 respectively. Both are below the organization's 60-point threshold.",
      sourceModule: "ai_governance", confidence: 89 },

    { agentId: riskId, type: "control_failure", severity: "critical",
      title: "Branch protection disabled on 3 critical repositories",
      description: "GitHub check github-branch-protection reports failure. Direct pushes to main branch are possible on: core-api, auth-service, payments-processor.",
      sourceModule: "continuous_compliance", confidence: 95 },

    { agentId: vendorId, type: "vendor_risk", severity: "medium",
      title: "7 vendors have no security assessment in 12 months",
      description: "7 active vendors have not had a security assessment in over 12 months. Per vendor governance policy, annual assessments are required for all Tier-1 and Tier-2 vendors.",
      sourceModule: "vendor_hub", confidence: 93 },

    { agentId: compId, type: "overdue_obligation", severity: "high",
      title: "DPDP data subject request response SLA at risk",
      description: "3 active Data Subject Requests are at risk of breaching the 30-day DPDP response deadline. Requests submitted 22-26 days ago with no response logged.",
      sourceModule: "dpdp_privacy", confidence: 97 },

    { agentId: riskId, type: "control_failure", severity: "medium",
      title: "Access review completion stalled at 62% with 13 days remaining",
      description: "Q2 Quarterly Access Review is 62% complete. At the current review rate, completion by the June 30 deadline requires reviewing 4.3 users per day.",
      sourceModule: "continuous_compliance", confidence: 88 },
  ];

  const obsIds = [];
  for (const obs of observationData) {
    const [inserted] = await sql`
      INSERT INTO agent_observations
        (organization_id, agent_id, observation_type, severity, status, title, description,
         source_module)
      VALUES
        (${orgId}, ${obs.agentId}, ${obs.type}, ${obs.severity}, 'new',
         ${obs.title}, ${obs.description}, ${obs.sourceModule})
      RETURNING id
    `;
    obsIds.push(inserted.id);
  }

  // ── Agent Recommendations ──────────────────────────────────────────────────────
  console.log("  → Agent Recommendations...");

  const recData = [
    { agentId: compId, obsIdx: 0, priority: "critical", confidence: 95, effort: "low", impact: "high",
      title: "Re-enable MFA on AWS root account immediately",
      rationale: "Root account MFA failure is a critical SOC 2 and ISO 27001 control failure. Exploitation of root account without MFA could result in complete cloud infrastructure compromise.",
      actions: ["Log into AWS console as root and enable MFA device", "Run aws-root-mfa compliance check to verify remediation", "Create Issue in AUDT Issue Hub to track resolution"] },

    { agentId: compId, obsIdx: 1, priority: "high", confidence: 92, effort: "medium", impact: "high",
      title: "Schedule Information Security Policy annual review",
      rationale: "Policy review is overdue in 14 days. Delaying will cause attestation gaps and potential compliance findings in the next audit cycle.",
      actions: ["Schedule policy review with CISO and security team", "Update policy version and publish for re-attestation", "Re-assign attestation to all 120 employees via Policy Governance™"] },

    { agentId: riskId, obsIdx: 3, priority: "critical", confidence: 91, effort: "medium", impact: "high",
      title: "Initiate emergency vendor review for trust-critical supplier",
      rationale: "Vendor trust score below 60 indicates material governance failure. Continued reliance on this vendor exposes the organization to regulatory and operational risk.",
      actions: ["Request urgent document renewal from vendor via Vendor Hub™", "Schedule security re-assessment within 7 days", "Escalate to procurement manager for contractual remediation options"] },

    { agentId: riskId, obsIdx: 4, priority: "high", confidence: 97, effort: "high", impact: "high",
      title: "Launch Trust Improvement Sprint to recover 8-point score decline",
      rationale: "An 8-point trust score decline in 7 days is a significant negative trend. Left unaddressed, this may trigger customer trust alerts via Trust API Platform™.",
      actions: ["Run Control Health improvement actions on bottom 5 controls", "Assign owners to 4 unowned risk treatments immediately", "Schedule governance review meeting with CISO and CRO"] },

    { agentId: riskId, obsIdx: 11, priority: "critical", confidence: 95, effort: "low", impact: "high",
      title: "Enforce branch protection on core repositories",
      rationale: "Direct pushes to production branches bypass code review and security scanning. This is a critical DevSecOps control failure with immediate exploit potential.",
      actions: ["Enable branch protection rules on core-api, auth-service, payments-processor", "Require PR reviews (minimum 2 approvers) and status checks before merge", "Run github-branch-protection check to confirm remediation"] },

    { agentId: vendorId, obsIdx: 7, priority: "high", confidence: 99, effort: "low", impact: "medium",
      title: "Send document renewal requests to 6 vendors",
      rationale: "12 documents expiring in 30 days across 6 vendors. Proactive outreach avoids last-minute compliance gaps and potential contract violations.",
      actions: ["Use Document Requests in Vendor Hub™ to request renewals from all 6 vendors", "Set 14-day deadline for submission to allow review time", "Escalate to procurement manager for vendors that do not respond within 7 days"] },

    { agentId: compId, obsIdx: 13, priority: "high", confidence: 97, effort: "low", impact: "high",
      title: "Prioritize 3 DPDP data subject request responses",
      rationale: "DPDP Act 2023 mandates responses within 30 days. Breach of this obligation exposes the organization to regulatory penalties and reputational harm.",
      actions: ["Assign each DSR to the data privacy officer immediately", "Draft and send responses via DPDP Privacy™ module", "Update DSR status to 'responded' and close within 4 days"] },

    { agentId: riskId, obsIdx: 5, priority: "high", confidence: 99, effort: "low", impact: "medium",
      title: "Assign owners to 4 overdue risk treatments",
      rationale: "Risk treatments without owners are effectively inactive. These represent unmitigated risks that are growing stale beyond their target dates.",
      actions: ["Open each risk in Risk Lens™ and assign a treatment owner", "Set realistic revised target dates", "Send treatment owner notification and add to weekly risk review agenda"] },

    { agentId: riskId, obsIdx: 10, priority: "high", confidence: 89, effort: "medium", impact: "medium",
      title: "Remediate AI Trust Score failures for 2 AI systems",
      rationale: "AI systems below the 60-point threshold pose regulatory risk under ISO 42001 and EU AI Act applicability. Ungoverned high-risk AI systems attract audit scrutiny.",
      actions: ["Open AI systems in AI Governance™ and review failed controls", "Assign AI risk treatments for each identified gap", "Schedule AI Trust Score recompute after remediation"] },

    { agentId: vendorId, obsIdx: 14, priority: "medium", confidence: 88, effort: "low", impact: "medium",
      title: "Accelerate Q2 Access Review to meet June 30 deadline",
      rationale: "At current completion rate, the access review will not finish by the deadline. An incomplete review is a compliance finding risk.",
      actions: ["Send reminder to all pending reviewers via Access Review campaign", "Assign incomplete reviews to backup reviewers for parallel processing", "Set daily completion targets and monitor in Continuous Compliance™"] },
  ];

  const recIds = [];
  for (const r of recData) {
    const [inserted] = await sql`
      INSERT INTO agent_recommendations
        (organization_id, agent_id, observation_id, priority, status, title, reasoning,
         suggested_actions, confidence_score, effort, impact)
      VALUES
        (${orgId}, ${r.agentId}, ${obsIds[r.obsIdx]}, ${r.priority}, 'pending',
         ${r.title}, ${r.rationale}, ${JSON.stringify(r.actions)}::jsonb,
         ${r.confidence}, ${r.effort}, ${r.impact})
      RETURNING id
    `;
    recIds.push(inserted.id);
  }

  // ── Agent Actions ─────────────────────────────────────────────────────────────
  console.log("  → Agent Actions...");

  await sql`
    INSERT INTO agent_actions
      (organization_id, agent_id, recommendation_id, action_type, title, status,
       parameters, approved_by, approved_at, executed_at, completed_at, result)
    VALUES
      (${orgId}, ${riskId}, ${recIds[2]}, 'create_issue', 'Create issue for critical vendor trust', 'completed',
       '{"severity":"critical","title":"Tier-1 vendor trust score critical","sourceModule":"vendor_hub"}'::jsonb,
       ${userId}, ${daysAgo(1)}, ${daysAgo(1)}, ${daysAgo(1)},
       '{"summary":"Issue ISSUE-0412 created"}'::jsonb),

      (${orgId}, ${compId}, ${recIds[0]}, 'create_issue', 'Create issue for MFA control failure', 'pending_approval',
       '{"severity":"critical","title":"AWS root account MFA disabled","sourceModule":"continuous_compliance"}'::jsonb,
       NULL, NULL, NULL, NULL, '{}'::jsonb),

      (${orgId}, ${riskId}, ${recIds[7] ?? recIds[0]}, 'create_risk', 'Create risk for unowned treatments', 'completed',
       '{"category":"operational","title":"Unowned risk treatments","likelihood":3,"impact":3}'::jsonb,
       ${userId}, ${daysAgo(3)}, ${daysAgo(3)}, ${daysAgo(3)},
       '{"summary":"Risk RISK-0091 created"}'::jsonb),

      (${orgId}, ${compId}, ${recIds[6] ?? recIds[0]}, 'request_evidence', 'Request DPDP DSR evidence', 'completed',
       '{"evidenceType":"dsr_response","requestNote":"DPDP DSR response records required"}'::jsonb,
       ${userId}, ${daysAgo(2)}, ${daysAgo(2)}, ${daysAgo(2)},
       '{"summary":"Evidence request sent to Data Privacy Officer"}'::jsonb),

      (${orgId}, ${riskId}, ${recIds[4] ?? recIds[0]}, 'create_review', 'Create branch protection review', 'pending_approval',
       '{"reviewType":"security","title":"Emergency branch protection review","targetDate":"2026-06-15"}'::jsonb,
       NULL, NULL, NULL, NULL, '{}'::jsonb)

    ON CONFLICT DO NOTHING
  `;

  // ── Agent Metrics (daily, org-level, last 30 days) ────────────────────────────
  console.log("  → Agent Metrics (30 days)...");

  const metricsRows = [];
  for (let i = 29; i >= 0; i--) {
    const day = new Date();
    day.setDate(day.getDate() - i);
    const metricDate = day.toISOString().split("T")[0];

    // Gradually improving success rate over 30 days (55% → 88%)
    const progressFactor = (29 - i) / 29;
    const runsToday      = 2 + Math.floor(Math.random() * 7);    // 2–8
    const successRate    = 0.55 + progressFactor * 0.33;
    const successToday   = Math.round(runsToday * successRate);
    const obsToday       = 1 + Math.floor(Math.random() * 3);    // 1–3
    const recsToday      = Math.max(0, obsToday - Math.floor(Math.random() * 2));
    const actsToday      = Math.floor(recsToday * 0.4);

    metricsRows.push({ metricDate, runsToday, successToday, obsToday, recsToday, actsToday });
  }

  for (const m of metricsRows) {
    await sql`
      INSERT INTO agent_metrics
        (organization_id, agent_id, metric_date, total_runs, successful_runs, failed_runs,
         total_observations, total_recommendations, total_actions)
      VALUES
        (${orgId}, NULL, ${m.metricDate}, ${m.runsToday}, ${m.successToday}, ${m.runsToday - m.successToday},
         ${m.obsToday}, ${m.recsToday}, ${m.actsToday})
      ON CONFLICT (organization_id, agent_id, metric_date) DO NOTHING
    `;
  }

  console.log("\n  Governance Agent Framework™ seeded successfully.");
  console.log("  → 8 built-in agents (compliance, risk, vendor, audit, privacy, contract, trust, ai_governance)");
  console.log("  → 20 agent runs (mix of completed/failed, spread over last 30 days)");
  console.log("  → 15 agent observations (mix of critical/high/medium/low severities)");
  console.log("  → 10 agent recommendations (linked to observations, confidence 78–99%)");
  console.log("  → 5 agent actions (2 pending_approval, 3 completed)");
  console.log("  → 30 daily org-level metric rows (improving success rate trend)");

  await sql.end();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
