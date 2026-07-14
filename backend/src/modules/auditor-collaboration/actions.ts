"use server";

import { requireUser } from "@/lib/auth/session";
import * as svc from "@/backend/src/modules/auditor-collaboration/auditor-collaboration-service";
import * as aiSvc from "@/backend/src/modules/auditor-collaboration/ai-auditor-service";
import * as repo from "@/backend/src/modules/auditor-collaboration/auditor-collaboration-repo";
import { revalidatePath } from "next/cache";

function orgId(s: Awaited<ReturnType<typeof requireUser>>) { return s.org?.id ?? ""; }

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardDataAction() {
  try {
    const session = await requireUser();
    const data = await svc.getDashboardData(orgId(session));
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load dashboard" };
  }
}

// ── Audit Rooms ───────────────────────────────────────────────────────────────

export async function getRoomsAction(filters?: { status?: string }) {
  try {
    const session = await requireUser();
    const data = await repo.findAllRooms(orgId(session), filters);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load rooms" };
  }
}

export async function getRoomDetailAction(roomId: string) {
  try {
    const session = await requireUser();
    const data = await svc.getRoomDetail(orgId(session), roomId);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load room" };
  }
}

export async function createRoomAction(data: Record<string, unknown>) {
  try {
    const session = await requireUser();
    const result = await svc.createAuditRoom(orgId(session), session.id, data as any);
    revalidatePath("/auditor-collaboration");
    revalidatePath("/auditor-collaboration/rooms");
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create room" };
  }
}

export async function updateRoomAction(id: string, data: Record<string, unknown>) {
  try {
    const session = await requireUser();
    const result = await svc.updateAuditRoom(orgId(session), session.id, id, data);
    revalidatePath("/auditor-collaboration/rooms");
    revalidatePath(`/auditor-collaboration/rooms/${id}`);
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update room" };
  }
}

export async function deleteRoomAction(id: string) {
  try {
    const session = await requireUser();
    await svc.deleteAuditRoom(orgId(session), session.id, id);
    revalidatePath("/auditor-collaboration/rooms");
    return { data: { id } };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete room" };
  }
}

// ── External Users ────────────────────────────────────────────────────────────

export async function getExternalUsersAction(filters?: { status?: string }) {
  try {
    const session = await requireUser();
    const data = await repo.findAllExternalUsers(orgId(session), filters);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load users" };
  }
}

export async function inviteExternalUserAction(data: Record<string, unknown>) {
  try {
    const session = await requireUser();
    const result = await svc.inviteExternalUser(orgId(session), session.id, data as any);
    revalidatePath("/auditor-collaboration/users");
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to invite user" };
  }
}

export async function revokeExternalUserAction(id: string) {
  try {
    const session = await requireUser();
    const result = await svc.revokeExternalUser(orgId(session), session.id, id);
    revalidatePath("/auditor-collaboration/users");
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to revoke user" };
  }
}

// ── Evidence Requests ─────────────────────────────────────────────────────────

export async function getEvidenceRequestsAction(filters?: { status?: string; roomId?: string }) {
  try {
    const session = await requireUser();
    const data = await repo.findAllEvidenceRequests(orgId(session), filters);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load evidence requests" };
  }
}

export async function createEvidenceRequestAction(roomId: string, data: Record<string, unknown>) {
  try {
    const session = await requireUser();
    const result = await svc.createEvidenceRequest(orgId(session), session.id, roomId, data as any);
    revalidatePath("/auditor-collaboration/evidence");
    revalidatePath(`/auditor-collaboration/rooms/${roomId}`);
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create evidence request" };
  }
}

export async function reviewEvidenceAction(requestId: string, action: "accept" | "reject", notes?: string) {
  try {
    const session = await requireUser();
    const result = await svc.reviewEvidence(orgId(session), session.id, requestId, action, notes);
    revalidatePath("/auditor-collaboration/evidence");
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to review evidence" };
  }
}

// ── Findings ──────────────────────────────────────────────────────────────────

export async function getExternalFindingsAction(filters?: { status?: string; severity?: string }) {
  try {
    const session = await requireUser();
    const data = await repo.findAllExternalFindings(orgId(session), filters);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load findings" };
  }
}

export async function createExternalFindingAction(roomId: string, data: Record<string, unknown>) {
  try {
    const session = await requireUser();
    const result = await svc.createExternalFinding(orgId(session), session.id, roomId, data as any);
    revalidatePath("/auditor-collaboration/findings");
    revalidatePath(`/auditor-collaboration/rooms/${roomId}`);
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create finding" };
  }
}

export async function updateFindingStatusAction(id: string, status: string) {
  try {
    const session = await requireUser();
    const result = await svc.updateFindingStatus(orgId(session), session.id, id, status);
    revalidatePath("/auditor-collaboration/findings");
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update finding" };
  }
}

// ── Assessments ───────────────────────────────────────────────────────────────

export async function getAssessmentsAction(filters?: { status?: string }) {
  try {
    const session = await requireUser();
    const data = await repo.findAllAssessments(orgId(session), filters);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load assessments" };
  }
}

export async function createAssessmentAction(roomId: string, data: Record<string, unknown>) {
  try {
    const session = await requireUser();
    const result = await svc.createAssessment(orgId(session), session.id, roomId, data as any);
    revalidatePath("/auditor-collaboration/assessments");
    revalidatePath(`/auditor-collaboration/rooms/${roomId}`);
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create assessment" };
  }
}

// ── Auditor Organizations ─────────────────────────────────────────────────────

export async function getAuditorOrgsAction() {
  try {
    const session = await requireUser();
    const data = await repo.findAllAuditorOrgs(orgId(session));
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to load auditor organizations" };
  }
}

export async function createAuditorOrgAction(data: Record<string, unknown>) {
  try {
    const session = await requireUser();
    const result = await svc.createAuditorOrg(orgId(session), session.id, data as any);
    revalidatePath("/auditor-collaboration/users");
    return { data: result };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create auditor organization" };
  }
}

// ── AI ────────────────────────────────────────────────────────────────────────

export async function generateReadinessSummaryAction() {
  try {
    const session = await requireUser();
    const data = await aiSvc.generateAuditReadinessSummary(orgId(session));
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to generate readiness summary" };
  }
}

export async function analyzeEvidenceGapsAction() {
  try {
    const session = await requireUser();
    const data = await aiSvc.analyzeEvidenceGaps(orgId(session));
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to analyze evidence gaps" };
  }
}

export async function generateFindingDraftAction(observation: string) {
  try {
    const session = await requireUser();
    const data = await aiSvc.generateFindingDraft(orgId(session), observation);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to generate finding draft" };
  }
}

export async function chatAction(messages: { role: string; content: string }[]) {
  try {
    const session = await requireUser();
    const data = await aiSvc.chat(orgId(session), messages);
    return { data };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to process chat" };
  }
}
