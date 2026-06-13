"use server";

import * as repo from "@/lib/repositories/continuous-compliance-repo";

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardData(orgId: string) {
  const [metrics, checks, signals, recentRuns, healthScore, readiness] = await Promise.all([
    repo.getDashboardMetrics(orgId),
    repo.findAllChecks(orgId),
    repo.findAllSignals(orgId, "open"),
    repo.findRunsByOrg(orgId, 10),
    repo.getLatestHealthScore(orgId),
    repo.getLatestReadiness(orgId),
  ]);

  const latestByFramework = new Map<string, typeof readiness[0]>();
  for (const r of readiness) {
    const existing = latestByFramework.get(r.frameworkName);
    if (!existing || r.snapshotAt > existing.snapshotAt) {
      latestByFramework.set(r.frameworkName, r);
    }
  }

  return {
    metrics,
    checks,
    signals,
    recentRuns,
    healthScore,
    frameworkReadiness: Array.from(latestByFramework.values()),
  };
}

// ── Compliance Checks ─────────────────────────────────────────────────────────

export async function getChecks(orgId: string) {
  return repo.findAllChecks(orgId);
}

export async function createCheck(orgId: string, userId: string, data: {
  name: string; description?: string; category: string;
  checkType?: string; severity?: string; schedule?: string;
  remediationGuide?: string;
}) {
  const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + orgId.slice(0, 6);
  return repo.insertCheck({
    organizationId: orgId,
    name: data.name,
    slug,
    description: data.description,
    category: data.category as any,
    checkType: (data.checkType ?? "manual") as any,
    severity: (data.severity ?? "medium") as any,
    schedule: (data.schedule ?? "daily") as any,
    status: "active",
    isBuiltin: false,
    remediationGuide: data.remediationGuide,
    frameworks: [],
    createdBy: userId,
  });
}

export async function runCheck(orgId: string, checkId: string, userId?: string) {
  const check = await repo.findCheckById(checkId);
  if (!check) throw new Error("Check not found");

  const run = await repo.insertCheckRun({
    organizationId: orgId,
    checkId,
    result: "unknown",
    details: { message: "Check initiated" },
    rawData: {},
    triggeredBy: "manual",
    runBy: userId ?? null,
    startedAt: new Date(),
  });

  // Simulate check execution
  const simResult = simulateCheckResult(check.category, check.slug);
  return repo.updateCheckRun(run.id, {
    result: simResult.result as any,
    score: simResult.score,
    details: simResult.details,
    completedAt: new Date(),
  });
}

function simulateCheckResult(category: string, slug: string) {
  const scenarios: Record<string, { result: string; score: number; details: Record<string, unknown> }> = {
    "aws-root-mfa":       { result: "pass",    score: 100, details: { message: "Root account MFA is enabled", checked_at: new Date().toISOString() } },
    "aws-no-root-keys":   { result: "pass",    score: 100, details: { message: "No root access keys found" } },
    "aws-s3-public":      { result: "warning", score: 60,  details: { message: "2 buckets with public ACLs detected", buckets: ["logs-archive", "static-assets"] } },
    "aws-cloudtrail":     { result: "pass",    score: 100, details: { message: "CloudTrail enabled in 3 regions" } },
    "github-secret-scan": { result: "fail",    score: 0,   details: { message: "Secret scanning disabled on 4 repositories" } },
    "okta-mfa":           { result: "pass",    score: 95,  details: { message: "95% of users have MFA enrolled", total: 120, enrolled: 114 } },
    "okta-inactive":      { result: "warning", score: 70,  details: { message: "8 inactive users found", users: 8 } },
  };
  return scenarios[slug] ?? {
    result: Math.random() > 0.3 ? "pass" : "warning",
    score: Math.floor(Math.random() * 40) + 60,
    details: { message: `${category} check executed`, category },
  };
}

// ── Access Reviews ────────────────────────────────────────────────────────────

export async function getAccessReviews(orgId: string) {
  return repo.findAllReviews(orgId);
}

export async function createAccessReview(orgId: string, userId: string, data: {
  name: string; description?: string; campaignType: string;
  scope?: string; riskLevel?: string; dueDate?: string;
}) {
  return repo.insertReview({
    organizationId: orgId,
    name: data.name,
    description: data.description,
    campaignType: data.campaignType as any,
    status: "draft",
    scope: data.scope,
    riskLevel: (data.riskLevel ?? "medium") as any,
    dueDate: data.dueDate as any,
    createdBy: userId,
  });
}

export async function startAccessReview(orgId: string, id: string) {
  return repo.updateReview(id, { status: "active", startedAt: new Date() });
}

export async function submitAccessReviewDecision(
  orgId: string, reviewUserId: string, reviewerId: string,
  decision: string, notes?: string
) {
  const updated = await repo.updateReviewUser(reviewUserId, {
    decision: decision as any,
    reviewerId,
    reviewedAt: new Date(),
    notes,
  });
  return updated;
}

// ── Attestations ──────────────────────────────────────────────────────────────

export async function getAttestations(orgId: string) {
  return repo.findAllAttestations(orgId);
}

export async function createAttestation(orgId: string, userId: string, data: {
  title: string; description?: string; policyType: string;
  content?: string; dueDate?: string;
}) {
  return repo.insertAttestation({
    organizationId: orgId,
    title: data.title,
    description: data.description,
    policyType: data.policyType as any,
    status: "active",
    content: data.content,
    dueDate: data.dueDate as any,
    createdBy: userId,
  });
}

// ── Training ──────────────────────────────────────────────────────────────────

export async function getTraining(orgId: string) {
  return repo.findAllTraining(orgId);
}

export async function createTrainingCampaign(orgId: string, userId: string, data: {
  title: string; description?: string; trainingType: string; dueDate?: string;
}) {
  return repo.insertTrainingCampaign({
    organizationId: orgId,
    title: data.title,
    description: data.description,
    trainingType: data.trainingType as any,
    status: "active",
    dueDate: data.dueDate as any,
    createdBy: userId,
  });
}

// ── Signals ───────────────────────────────────────────────────────────────────

export async function getSignals(orgId: string, status?: string) {
  return repo.findAllSignals(orgId, status);
}

export async function resolveSignal(orgId: string, id: string, userId: string) {
  return repo.resolveSignal(orgId, id, userId);
}

// ── Health Score ──────────────────────────────────────────────────────────────

export async function computeHealthScore(orgId: string) {
  const [metrics, latestScore] = await Promise.all([
    repo.getDashboardMetrics(orgId),
    repo.getLatestHealthScore(orgId),
  ]);

  const checkSuccess = metrics.totalChecks > 0
    ? Math.round((metrics.passingChecks / Math.max(metrics.passingChecks + metrics.failingChecks, 1)) * 100)
    : 80;

  const score = Math.round(
    checkSuccess * 0.30 +
    Math.max(0, 100 - (metrics.openSignals * 5)) * 0.25 +
    80 * 0.20 + // placeholder for evidence freshness
    80 * 0.15 + // placeholder for training completion
    80 * 0.10   // placeholder for access review rate
  );

  const level = score >= 90 ? "excellent" : score >= 75 ? "good" : score >= 60 ? "needs_attention" : score >= 40 ? "at_risk" : "critical";

  return repo.upsertHealthScore({
    organizationId: orgId,
    score,
    level,
    checkSuccessRate: checkSuccess,
    openFindings: metrics.openSignals,
    snapshotAt: new Date(),
  });
}

// ── Exceptions ────────────────────────────────────────────────────────────────

export async function getExceptions(orgId: string) {
  return repo.findAllExceptions(orgId);
}

export async function createException(orgId: string, userId: string, data: {
  title: string; reason: string; riskAcceptance?: string; checkId?: string; expiresAt?: string;
}) {
  return repo.insertException({
    organizationId: orgId,
    title: data.title,
    reason: data.reason,
    riskAcceptance: data.riskAcceptance,
    checkId: data.checkId ?? null,
    status: "pending",
    expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    requestedBy: userId,
  });
}

export async function approveException(orgId: string, id: string, userId: string) {
  return repo.updateException(id, { status: "approved", approvedBy: userId, approvedAt: new Date() });
}

// ── Automation Rules ──────────────────────────────────────────────────────────

export async function getAutomationRules(orgId: string) {
  return repo.findAllRules(orgId);
}

export async function createAutomationRule(orgId: string, userId: string, data: {
  name: string; description?: string; triggerType: string;
  actions?: Array<{ type: string; config: Record<string, unknown> }>;
}) {
  return repo.insertRule({
    organizationId: orgId,
    name: data.name,
    description: data.description,
    status: "active",
    triggerType: data.triggerType as any,
    triggerConfig: {},
    actions: data.actions ?? [],
    createdBy: userId,
  });
}

export async function toggleRule(orgId: string, id: string, active: boolean) {
  return repo.updateRule(id, { status: active ? "active" : "inactive" });
}

// ── Workforce Events ──────────────────────────────────────────────────────────

export async function getWorkforceEvents(orgId: string) {
  return repo.findAllWorkforceEvents(orgId);
}
