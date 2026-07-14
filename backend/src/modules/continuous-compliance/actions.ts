"use server";

import { requireUser } from "@/lib/auth/session";
import * as svc from "@/backend/src/modules/continuous-compliance/continuous-compliance-service";
import * as aiSvc from "@/backend/src/modules/continuous-compliance/ai-continuous-compliance-service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function getOrgId(s: Awaited<ReturnType<typeof requireUser>>) { return s.org?.id ?? ""; }
function getUserId(s: Awaited<ReturnType<typeof requireUser>>) { return s.id; }

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardAction() {
  const session = await requireUser();
  return svc.getDashboardData(getOrgId(session));
}

// ── Checks ────────────────────────────────────────────────────────────────────

export async function runCheckAction(checkId: string) {
  const session = await requireUser();
  const run = await svc.runCheck(getOrgId(session), checkId, getUserId(session));
  revalidatePath("/continuous-compliance");
  return run;
}

export async function createCheckAction(_prev: unknown, fd: FormData): Promise<void> {
  const session = await requireUser();
  await svc.createCheck(getOrgId(session), getUserId(session), {
    name: fd.get("name") as string,
    description: (fd.get("description") as string) || undefined,
    category: fd.get("category") as string,
    severity: (fd.get("severity") as string) || undefined,
    schedule: (fd.get("schedule") as string) || undefined,
    remediationGuide: (fd.get("remediationGuide") as string) || undefined,
  });
  revalidatePath("/continuous-compliance/checks");
  redirect("/continuous-compliance/checks");
}

// ── Access Reviews ────────────────────────────────────────────────────────────

export async function createAccessReviewAction(_prev: unknown, fd: FormData): Promise<void> {
  const session = await requireUser();
  await svc.createAccessReview(getOrgId(session), getUserId(session), {
    name: fd.get("name") as string,
    description: (fd.get("description") as string) || undefined,
    campaignType: fd.get("campaignType") as string,
    scope: (fd.get("scope") as string) || undefined,
    riskLevel: (fd.get("riskLevel") as string) || undefined,
    dueDate: (fd.get("dueDate") as string) || undefined,
  });
  revalidatePath("/continuous-compliance/access-reviews");
  redirect("/continuous-compliance/access-reviews");
}

export async function startAccessReviewAction(id: string) {
  const session = await requireUser();
  await svc.startAccessReview(getOrgId(session), id);
  revalidatePath("/continuous-compliance/access-reviews");
}

export async function submitDecisionAction(reviewUserId: string, decision: string, notes?: string) {
  const session = await requireUser();
  await svc.submitAccessReviewDecision(getOrgId(session), reviewUserId, getUserId(session), decision, notes);
  revalidatePath("/continuous-compliance/access-reviews");
}

// ── Attestations ──────────────────────────────────────────────────────────────

export async function createAttestationAction(_prev: unknown, fd: FormData): Promise<void> {
  const session = await requireUser();
  await svc.createAttestation(getOrgId(session), getUserId(session), {
    title: fd.get("title") as string,
    description: (fd.get("description") as string) || undefined,
    policyType: fd.get("policyType") as string,
    content: (fd.get("content") as string) || undefined,
    dueDate: (fd.get("dueDate") as string) || undefined,
  });
  revalidatePath("/continuous-compliance/attestations");
}

// ── Training ──────────────────────────────────────────────────────────────────

export async function createTrainingAction(_prev: unknown, fd: FormData): Promise<void> {
  const session = await requireUser();
  await svc.createTrainingCampaign(getOrgId(session), getUserId(session), {
    title: fd.get("title") as string,
    description: (fd.get("description") as string) || undefined,
    trainingType: fd.get("trainingType") as string,
    dueDate: (fd.get("dueDate") as string) || undefined,
  });
  revalidatePath("/continuous-compliance/training");
}

// ── Signals ───────────────────────────────────────────────────────────────────

export async function resolveSignalAction(id: string) {
  const session = await requireUser();
  await svc.resolveSignal(getOrgId(session), id, getUserId(session));
  revalidatePath("/continuous-compliance/signals");
}

// ── Health Score ──────────────────────────────────────────────────────────────

export async function computeHealthAction() {
  const session = await requireUser();
  const result = await svc.computeHealthScore(getOrgId(session));
  revalidatePath("/continuous-compliance");
  return result;
}

// ── Exceptions ────────────────────────────────────────────────────────────────

export async function createExceptionAction(_prev: unknown, fd: FormData): Promise<void> {
  const session = await requireUser();
  await svc.createException(getOrgId(session), getUserId(session), {
    title: fd.get("title") as string,
    reason: fd.get("reason") as string,
    riskAcceptance: (fd.get("riskAcceptance") as string) || undefined,
    checkId: (fd.get("checkId") as string) || undefined,
    expiresAt: (fd.get("expiresAt") as string) || undefined,
  });
  revalidatePath("/continuous-compliance");
}

export async function approveExceptionAction(id: string) {
  const session = await requireUser();
  await svc.approveException(getOrgId(session), id, getUserId(session));
  revalidatePath("/continuous-compliance");
}

// ── Automation Rules ──────────────────────────────────────────────────────────

export async function createRuleAction(_prev: unknown, fd: FormData): Promise<void> {
  const session = await requireUser();
  await svc.createAutomationRule(getOrgId(session), getUserId(session), {
    name: fd.get("name") as string,
    description: (fd.get("description") as string) || undefined,
    triggerType: fd.get("triggerType") as string,
  });
  revalidatePath("/continuous-compliance/automation");
}

export async function toggleRuleAction(id: string, active: boolean) {
  const session = await requireUser();
  await svc.toggleRule(getOrgId(session), id, active);
  revalidatePath("/continuous-compliance/automation");
}

// ── AI ────────────────────────────────────────────────────────────────────────

export async function generateSummaryAction() {
  const session = await requireUser();
  const data = await svc.getDashboardData(getOrgId(session));
  return aiSvc.generateComplianceSummary(getOrgId(session), {
    totalChecks: data.metrics.totalChecks,
    passingChecks: data.metrics.passingChecks,
    failingChecks: data.metrics.failingChecks,
    checkPassRate: data.metrics.checkPassRate,
    openSignals: data.metrics.openSignals,
    healthScore: data.healthScore?.score,
  });
}

export async function chatAction(messages: Array<{ role: string; content: string }>) {
  const session = await requireUser();
  const data = await svc.getDashboardData(getOrgId(session));
  return aiSvc.chat(getOrgId(session), messages, {
    totalChecks: data.metrics.totalChecks,
    passingChecks: data.metrics.passingChecks,
    failingChecks: data.metrics.failingChecks,
    openSignals: data.metrics.openSignals,
    healthScore: data.healthScore?.score,
  });
}
