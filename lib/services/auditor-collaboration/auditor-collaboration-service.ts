"use server";

import * as repo from "@/lib/repositories/auditor-collaboration-repo";
import { recordAudit } from "@/lib/repositories/audit-repo";

class DomainError extends Error {
  constructor(msg: string) { super(msg); this.name = "DomainError"; }
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export async function getDashboardData(orgId: string) {
  const [metrics, rooms, requests, findings, users, assessments] = await Promise.all([
    repo.getDashboardMetrics(orgId),
    repo.findAllRooms(orgId, { status: "active" }),
    repo.findAllEvidenceRequests(orgId, { status: "pending" }),
    repo.findAllExternalFindings(orgId, { status: "open" }),
    repo.findAllExternalUsers(orgId, { status: "active" }),
    repo.findAllAssessments(orgId, { status: "in_progress" }),
  ]);
  return { metrics, rooms, requests, findings, users, assessments };
}

// ── Audit Rooms ───────────────────────────────────────────────────────────────

export async function createAuditRoom(
  orgId: string,
  userId: string,
  data: {
    name: string;
    description?: string;
    roomType?: string;
    framework?: string;
    scope?: string;
    objective?: string;
    startDate?: string;
    endDate?: string;
    ownerId?: string;
  }
) {
  if (!data.name?.trim()) throw new DomainError("Audit room name is required.");
  const room = await repo.createRoom(orgId, data as any, userId);
  await repo.addRoomActivity(orgId, room.id, {
    activityType: "audit_room.created",
    description: `Audit room "${room.name}" created.`,
    actorId: userId,
  });
  await recordAudit({ organizationId: orgId, actorId: userId, action: "audit_room.created", entityType: "audit_room", entityId: room.id, metadata: { name: data.name } }).catch(() => {});
  return room;
}

export async function updateAuditRoom(orgId: string, userId: string, id: string, data: Record<string, unknown>) {
  const room = await repo.updateRoom(orgId, id, data as any);
  await repo.addRoomActivity(orgId, id, { activityType: "audit_room.updated", description: `Room updated.`, actorId: userId });
  return room;
}

export async function deleteAuditRoom(orgId: string, userId: string, id: string) {
  await repo.deleteRoom(orgId, id);
  await recordAudit({ organizationId: orgId, actorId: userId, action: "audit_room.deleted", entityType: "audit_room", entityId: id }).catch(() => {});
}

export async function getRoomDetail(orgId: string, roomId: string) {
  const [room, documents, activities, evidenceReqs, findings, assessments, reviews, comments] = await Promise.all([
    repo.findRoomById(orgId, roomId),
    repo.findRoomDocuments(roomId),
    repo.findRoomActivities(roomId, 20),
    repo.findAllEvidenceRequests(orgId, { roomId }),
    repo.findAllExternalFindings(orgId, { roomId }),
    repo.findAllAssessments(orgId, { roomId }),
    repo.findReviewsByRoom(roomId),
    repo.findComments(orgId, "room", roomId),
  ]);
  if (!room) throw new DomainError("Audit room not found.");
  return { room, documents, activities, evidenceReqs, findings, assessments, reviews, comments };
}

// ── External Users ────────────────────────────────────────────────────────────

export async function inviteExternalUser(
  orgId: string,
  userId: string,
  data: {
    email: string;
    fullName: string;
    userType?: string;
    title?: string;
    company?: string;
    phone?: string;
    accessExpiresAt?: string;
    auditorOrgId?: string;
  }
) {
  if (!data.email?.trim()) throw new DomainError("Email is required.");
  if (!data.fullName?.trim()) throw new DomainError("Full name is required.");
  const token = crypto.randomUUID();
  const user = await repo.createExternalUser(orgId, { ...data as any, inviteToken: token, inviteSentAt: new Date(), status: "invited" }, userId);
  await recordAudit({ organizationId: orgId, actorId: userId, action: "auditor.invited", entityType: "external_user", entityId: user.id, metadata: { email: data.email } }).catch(() => {});
  return user;
}

export async function updateExternalUser(orgId: string, userId: string, id: string, data: Record<string, unknown>) {
  return repo.updateExternalUser(orgId, id, data as any);
}

export async function revokeExternalUser(orgId: string, userId: string, id: string) {
  const user = await repo.updateExternalUser(orgId, id, { status: "revoked" } as any);
  await recordAudit({ organizationId: orgId, actorId: userId, action: "auditor.revoked", entityType: "external_user", entityId: id }).catch(() => {});
  return user;
}

// ── Evidence Requests ─────────────────────────────────────────────────────────

export async function createEvidenceRequest(
  orgId: string,
  userId: string,
  roomId: string,
  data: {
    title: string;
    description?: string;
    evidenceType?: string;
    priority?: string;
    dueDate?: string;
    assignedOwnerId?: string;
  }
) {
  if (!data.title?.trim()) throw new DomainError("Evidence request title is required.");
  const req = await repo.createEvidenceRequest(orgId, roomId, data as any, userId);
  await repo.addRoomActivity(orgId, roomId, { activityType: "evidence.requested", description: `Evidence requested: "${req.title}".`, actorId: userId });
  await recordAudit({ organizationId: orgId, actorId: userId, action: "evidence.requested", entityType: "evidence_request", entityId: req.id, metadata: { title: data.title } }).catch(() => {});
  return req;
}

export async function submitEvidence(orgId: string, userId: string, requestId: string, docName: string) {
  const req = await repo.findEvidenceRequestById(orgId, requestId);
  if (!req) throw new DomainError("Evidence request not found.");
  const response = await repo.addEvidenceResponse(orgId, requestId, { documentName: docName } as any, userId);
  await repo.updateEvidenceRequest(orgId, requestId, { status: "submitted", submittedAt: new Date() } as any);
  await repo.addRoomActivity(orgId, req.roomId, { activityType: "evidence.submitted", description: `Evidence submitted for "${req.title}".`, actorId: userId });
  return response;
}

export async function reviewEvidence(orgId: string, userId: string, requestId: string, action: "accept" | "reject", notes?: string) {
  const newStatus = action === "accept" ? "accepted" : "rejected";
  const req = await repo.updateEvidenceRequest(orgId, requestId, {
    status: newStatus,
    reviewerNotes: action === "accept" ? notes : undefined,
    rejectionReason: action === "reject" ? notes : undefined,
    reviewedAt: new Date(),
  } as any);
  await repo.addRoomActivity(orgId, req.roomId, { activityType: `evidence.${newStatus}`, description: `Evidence "${req.title}" ${newStatus}.`, actorId: userId });
  return req;
}

// ── External Findings ─────────────────────────────────────────────────────────

export async function createExternalFinding(
  orgId: string,
  userId: string,
  roomId: string,
  data: {
    title: string;
    description?: string;
    severity?: string;
    findingType?: string;
    framework?: string;
    controlRef?: string;
    recommendation?: string;
    dueDate?: string;
    ownerId?: string;
  }
) {
  if (!data.title?.trim()) throw new DomainError("Finding title is required.");
  const finding = await repo.createExternalFinding(orgId, roomId, data as any, userId);
  await repo.addRoomActivity(orgId, roomId, { activityType: "finding.created", description: `Finding raised: "${finding.title}".`, actorId: userId });
  await recordAudit({ organizationId: orgId, actorId: userId, action: "finding.created", entityType: "external_finding", entityId: finding.id, metadata: { title: data.title, severity: data.severity } }).catch(() => {});
  return finding;
}

export async function updateFindingStatus(orgId: string, userId: string, id: string, status: string) {
  const finding = await repo.updateExternalFinding(orgId, id, { status } as any);
  await repo.addRoomActivity(orgId, finding.roomId, { activityType: `finding.${status}`, description: `Finding "${finding.title}" → ${status}.`, actorId: userId });
  return finding;
}

// ── Assessments ───────────────────────────────────────────────────────────────

export async function createAssessment(
  orgId: string,
  userId: string,
  roomId: string,
  data: {
    name: string;
    description?: string;
    assessmentType?: string;
    startDate?: string;
    endDate?: string;
    leadAssessorId?: string;
  }
) {
  if (!data.name?.trim()) throw new DomainError("Assessment name is required.");
  const assessment = await repo.createExternalAssessment(orgId, roomId, data as any, userId);
  await repo.addRoomActivity(orgId, roomId, { activityType: "assessment.created", description: `Assessment "${assessment.name}" started.`, actorId: userId });
  return assessment;
}

export async function updateAssessment(orgId: string, id: string, data: Record<string, unknown>) {
  return repo.updateExternalAssessment(orgId, id, data as any);
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function addComment(orgId: string, userId: string, roomId: string, entityType: string, entityId: string, content: string, commentType: "internal" | "external" = "external") {
  if (!content?.trim()) throw new DomainError("Comment cannot be empty.");
  return repo.createComment(orgId, roomId, { entityType: entityType as any, entityId, content, commentType, authorId: userId });
}

// ── Auditor Orgs ──────────────────────────────────────────────────────────────

export async function createAuditorOrg(orgId: string, userId: string, data: { name: string; firmType?: string; website?: string; country?: string; contactEmail?: string; contactName?: string }) {
  if (!data.name?.trim()) throw new DomainError("Organization name is required.");
  return repo.createAuditorOrg(orgId, data as any, userId);
}
