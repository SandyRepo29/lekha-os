"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import * as svc from "@/backend/src/modules/regulatory-intelligence/regulatory-service";
import * as ai from "@/backend/src/modules/regulatory-intelligence/ai-regulatory-service";

function getOrgId(session: Awaited<ReturnType<typeof requireUser>>) {
  return session.org?.id ?? "";
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function getDashboardDataAction() {
  try {
    const session = await requireUser();
    const data = await svc.getDashboardData(getOrgId(session));
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load dashboard." };
  }
}

// ─── Regulations ─────────────────────────────────────────────────────────────

export async function getRegulationsAction() {
  try {
    const session = await requireUser();
    const data = await svc.getRegulations(getOrgId(session));
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load regulations." };
  }
}

export async function getRegulationAction(id: string) {
  try {
    const session = await requireUser();
    const data = await svc.getRegulationById(getOrgId(session), id);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load regulation." };
  }
}

export async function createRegulationAction(_: unknown, formData: FormData) {
  try {
    const session = await requireUser();
    const orgId = getOrgId(session);
    const data = await svc.createRegulation(orgId, session.id, {
      name: String(formData.get("name") ?? ""),
      shortName: formData.get("shortName") as string | undefined,
      authority: formData.get("authority") as string | undefined,
      country: formData.get("country") as string | undefined,
      region: formData.get("region") as string | undefined,
      industry: formData.get("industry") as string | undefined,
      category: formData.get("category") as string | undefined,
      version: formData.get("version") as string | undefined,
      effectiveDate: formData.get("effectiveDate") as string | undefined,
      reviewDate: formData.get("reviewDate") as string | undefined,
      sourceUrl: formData.get("sourceUrl") as string | undefined,
      description: formData.get("description") as string | undefined,
    });
    revalidatePath("/regulatory-intelligence");
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create regulation." };
  }
}

export async function deleteRegulationAction(id: string) {
  try {
    const session = await requireUser();
    await svc.deleteRegulation(getOrgId(session), id);
    revalidatePath("/regulatory-intelligence");
    return { data: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete regulation." };
  }
}

// ─── Regulatory Changes ──────────────────────────────────────────────────────

export async function getChangesAction(filters?: { status?: string; severity?: string }) {
  try {
    const session = await requireUser();
    const data = await svc.getChanges(getOrgId(session), filters);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load changes." };
  }
}

export async function createChangeAction(_: unknown, formData: FormData) {
  try {
    const session = await requireUser();
    const orgId = getOrgId(session);
    const data = await svc.createChange(orgId, session.id, {
      title: String(formData.get("title") ?? ""),
      description: formData.get("description") as string | undefined,
      changeType: formData.get("changeType") as string | undefined,
      severity: formData.get("severity") as string | undefined,
      regulationId: formData.get("regulationId") as string | undefined,
      source: formData.get("source") as string | undefined,
      sourceUrl: formData.get("sourceUrl") as string | undefined,
      publishedDate: formData.get("publishedDate") as string | undefined,
      effectiveDate: formData.get("effectiveDate") as string | undefined,
    });
    revalidatePath("/regulatory-intelligence");
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create change." };
  }
}

export async function updateChangeStatusAction(id: string, status: string) {
  try {
    const session = await requireUser();
    const data = await svc.updateChangeStatus(getOrgId(session), id, status);
    revalidatePath("/regulatory-intelligence");
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update change." };
  }
}

// ─── Obligations ─────────────────────────────────────────────────────────────

export async function getObligationsAction(filters?: { status?: string; regulationId?: string; priority?: string }) {
  try {
    const session = await requireUser();
    const data = await svc.getObligations(getOrgId(session), filters);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load obligations." };
  }
}

export async function createObligationAction(_: unknown, formData: FormData) {
  try {
    const session = await requireUser();
    const orgId = getOrgId(session);
    const data = await svc.createObligation(orgId, session.id, {
      title: String(formData.get("title") ?? ""),
      description: formData.get("description") as string | undefined,
      requirement: formData.get("requirement") as string | undefined,
      obligationRef: formData.get("obligationRef") as string | undefined,
      category: formData.get("category") as string | undefined,
      priority: formData.get("priority") as string | undefined,
      regulationId: formData.get("regulationId") as string | undefined,
      businessUnit: formData.get("businessUnit") as string | undefined,
      dueDate: formData.get("dueDate") as string | undefined,
      evidenceRequirements: formData.get("evidenceRequirements") as string | undefined,
    });
    revalidatePath("/regulatory-intelligence");
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create obligation." };
  }
}

export async function updateObligationStatusAction(id: string, status: string) {
  try {
    const session = await requireUser();
    const data = await svc.updateObligationStatus(getOrgId(session), id, status);
    revalidatePath("/regulatory-intelligence");
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update obligation." };
  }
}

export async function deleteObligationAction(id: string) {
  try {
    const session = await requireUser();
    await svc.deleteObligation(getOrgId(session), id);
    revalidatePath("/regulatory-intelligence");
    return { data: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete obligation." };
  }
}

// ─── Assessments ─────────────────────────────────────────────────────────────

export async function getAssessmentsAction(filters?: { status?: string }) {
  try {
    const session = await requireUser();
    const data = await svc.getAssessments(getOrgId(session), filters);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load assessments." };
  }
}

export async function createAssessmentAction(_: unknown, formData: FormData) {
  try {
    const session = await requireUser();
    const orgId = getOrgId(session);
    const data = await svc.createAssessment(orgId, session.id, {
      title: String(formData.get("title") ?? ""),
      changeId: formData.get("changeId") as string | undefined,
      regulationId: formData.get("regulationId") as string | undefined,
      impactLevel: formData.get("impactLevel") as string | undefined,
      summary: formData.get("summary") as string | undefined,
      dueDate: formData.get("dueDate") as string | undefined,
    });
    revalidatePath("/regulatory-intelligence");
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create assessment." };
  }
}

export async function updateAssessmentStatusAction(id: string, status: string) {
  try {
    const session = await requireUser();
    const data = await svc.updateAssessmentStatus(getOrgId(session), id, status);
    revalidatePath("/regulatory-intelligence");
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update assessment." };
  }
}

// ─── Alerts ──────────────────────────────────────────────────────────────────

export async function getAlertsAction(filters?: { status?: string; severity?: string }) {
  try {
    const session = await requireUser();
    const data = await svc.getAlerts(getOrgId(session), filters);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load alerts." };
  }
}

export async function resolveAlertAction(id: string) {
  try {
    const session = await requireUser();
    await svc.resolveAlert(getOrgId(session), id, session.id);
    revalidatePath("/regulatory-intelligence");
    return { data: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to resolve alert." };
  }
}

// ─── Watchlists ───────────────────────────────────────────────────────────────

export async function getWatchlistsAction() {
  try {
    const session = await requireUser();
    const data = await svc.getWatchlists(getOrgId(session));
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load watchlists." };
  }
}

export async function createWatchlistAction(_: unknown, formData: FormData) {
  try {
    const session = await requireUser();
    const orgId = getOrgId(session);
    const data = await svc.createWatchlist(orgId, session.id, {
      name: String(formData.get("name") ?? ""),
      description: formData.get("description") as string | undefined,
      watchType: formData.get("watchType") as string | undefined,
    });
    revalidatePath("/regulatory-intelligence");
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create watchlist." };
  }
}

export async function deleteWatchlistAction(id: string) {
  try {
    const session = await requireUser();
    await svc.deleteWatchlist(getOrgId(session), id);
    revalidatePath("/regulatory-intelligence");
    return { data: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete watchlist." };
  }
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export async function getTasksAction(filters?: { status?: string; priority?: string }) {
  try {
    const session = await requireUser();
    const data = await svc.getTasks(getOrgId(session), filters);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load tasks." };
  }
}

export async function updateTaskStatusAction(id: string, status: string) {
  try {
    const session = await requireUser();
    await svc.updateTaskStatus(getOrgId(session), id, status);
    revalidatePath("/regulatory-intelligence");
    return { data: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update task." };
  }
}

// ─── AI Actions ───────────────────────────────────────────────────────────────

export async function generateAdvisorySummaryAction() {
  try {
    const session = await requireUser();
    const orgId = getOrgId(session);
    const metrics = await svc.getDashboardData(orgId);
    const content = await ai.generateRegulatoryAdvisorySummary(orgId, {
      totalRegulations: metrics.metrics.totalRegulations,
      newChanges: metrics.metrics.newChanges,
      openAlerts: metrics.metrics.openAlerts,
      openObligations: metrics.metrics.openObligations,
      openTasks: metrics.metrics.openTasks,
      readinessScore: metrics.readiness.score,
    });
    return { data: content };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to generate summary." };
  }
}

export async function analyzeChangeAction(changeId: string) {
  try {
    const session = await requireUser();
    const orgId = getOrgId(session);
    const changes = await svc.getChanges(orgId);
    const change = changes.find(c => c.id === changeId);
    if (!change) return { error: "Change not found." };
    const data = await ai.analyzeRegulatoryChange(orgId, {
      id: change.id,
      title: change.title,
      description: change.description ?? undefined,
      changeType: change.changeType,
      severity: change.severity,
    });
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to analyze change." };
  }
}

export async function generateHorizonAction() {
  try {
    const session = await requireUser();
    const orgId = getOrgId(session);
    const regs = await svc.getRegulations(orgId);
    const data = await ai.generateComplianceHorizon(orgId, regs.map(r => ({
      name: r.shortName ?? r.name,
      category: r.category,
      country: r.country ?? "Global",
    })));
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to generate horizon." };
  }
}

export async function chatAction(
  message: string,
  history: Array<{ role: string; content: string }>
) {
  try {
    const session = await requireUser();
    const orgId = getOrgId(session);
    const metrics = await svc.getDashboardData(orgId);
    const content = await ai.chat(orgId, message, history, {
      totalRegulations: metrics.metrics.totalRegulations,
      newChanges: metrics.metrics.newChanges,
      openAlerts: metrics.metrics.openAlerts,
      openObligations: metrics.metrics.openObligations,
    });
    return { data: content };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to get AI response." };
  }
}
