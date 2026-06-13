import { db } from "@/lib/db";
import {
  auditorOrganizations,
  externalUsers,
  auditRooms,
  auditRoomDocuments,
  auditRoomActivities,
  evidenceRequests,
  evidenceResponses,
  auditReviews,
  externalComments,
  externalFindings,
  externalAssessments,
  externalPermissions,
  type AuditorOrganization,
  type ExternalUser,
  type AuditRoom,
  type AuditRoomDocument,
  type AuditRoomActivity,
  type EvidenceRequest,
  type EvidenceResponse,
  type AuditReview,
  type ExternalComment,
  type ExternalFinding,
  type ExternalAssessment,
  type ExternalPermission,
} from "@/lib/db/schema";
import { eq, and, desc, asc, sql, count } from "drizzle-orm";

// ── Dashboard metrics ─────────────────────────────────────────────────────────

export async function getDashboardMetrics(orgId: string) {
  const [
    totalRooms,
    activeRooms,
    openEvidence,
    openFindings,
    totalUsers,
    activeUsers,
    totalAssessments,
    recentRooms,
    recentFindings,
  ] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(auditRooms).where(eq(auditRooms.organizationId, orgId)),
    db.select({ c: sql<number>`count(*)::int` }).from(auditRooms).where(and(eq(auditRooms.organizationId, orgId), eq(auditRooms.status, "active"))),
    db.select({ c: sql<number>`count(*)::int` }).from(evidenceRequests).where(and(eq(evidenceRequests.organizationId, orgId), eq(evidenceRequests.status, "pending"))),
    db.select({ c: sql<number>`count(*)::int` }).from(externalFindings).where(and(eq(externalFindings.organizationId, orgId), eq(externalFindings.status, "open"))),
    db.select({ c: sql<number>`count(*)::int` }).from(externalUsers).where(eq(externalUsers.organizationId, orgId)),
    db.select({ c: sql<number>`count(*)::int` }).from(externalUsers).where(and(eq(externalUsers.organizationId, orgId), eq(externalUsers.status, "active"))),
    db.select({ c: sql<number>`count(*)::int` }).from(externalAssessments).where(eq(externalAssessments.organizationId, orgId)),
    db.select().from(auditRooms).where(eq(auditRooms.organizationId, orgId)).orderBy(desc(auditRooms.updatedAt)).limit(5),
    db.select().from(externalFindings).where(eq(externalFindings.organizationId, orgId)).orderBy(desc(externalFindings.createdAt)).limit(5),
  ]);

  return {
    totalRooms: totalRooms[0]?.c ?? 0,
    activeRooms: activeRooms[0]?.c ?? 0,
    openEvidenceRequests: openEvidence[0]?.c ?? 0,
    openFindings: openFindings[0]?.c ?? 0,
    totalUsers: totalUsers[0]?.c ?? 0,
    activeUsers: activeUsers[0]?.c ?? 0,
    totalAssessments: totalAssessments[0]?.c ?? 0,
    recentRooms,
    recentFindings,
  };
}

// ── Auditor Organizations ─────────────────────────────────────────────────────

export async function findAllAuditorOrgs(orgId: string): Promise<AuditorOrganization[]> {
  return db.select().from(auditorOrganizations).where(eq(auditorOrganizations.organizationId, orgId)).orderBy(asc(auditorOrganizations.name));
}

export async function createAuditorOrg(orgId: string, data: Partial<AuditorOrganization>, createdBy: string): Promise<AuditorOrganization> {
  const rows = await db.insert(auditorOrganizations).values({ ...data, organizationId: orgId, createdBy } as any).returning();
  return rows[0];
}

// ── External Users ────────────────────────────────────────────────────────────

export async function findAllExternalUsers(orgId: string, filters?: { status?: string; userType?: string }): Promise<ExternalUser[]> {
  const conds = [eq(externalUsers.organizationId, orgId)];
  if (filters?.status) conds.push(eq(externalUsers.status, filters.status as any));
  if (filters?.userType) conds.push(eq(externalUsers.userType, filters.userType as any));
  return db.select().from(externalUsers).where(and(...conds)).orderBy(desc(externalUsers.createdAt));
}

export async function findExternalUserById(orgId: string, id: string): Promise<ExternalUser | null> {
  const rows = await db.select().from(externalUsers).where(and(eq(externalUsers.organizationId, orgId), eq(externalUsers.id, id))).limit(1);
  return rows[0] ?? null;
}

export async function createExternalUser(orgId: string, data: Partial<ExternalUser>, createdBy: string): Promise<ExternalUser> {
  const rows = await db.insert(externalUsers).values({ ...data, organizationId: orgId, createdBy } as any).returning();
  return rows[0];
}

export async function updateExternalUser(orgId: string, id: string, data: Partial<ExternalUser>): Promise<ExternalUser> {
  const rows = await db.update(externalUsers).set({ ...data, updatedAt: new Date() } as any).where(and(eq(externalUsers.organizationId, orgId), eq(externalUsers.id, id))).returning();
  return rows[0];
}

// ── Audit Rooms ───────────────────────────────────────────────────────────────

export async function findAllRooms(orgId: string, filters?: { status?: string; roomType?: string }): Promise<AuditRoom[]> {
  const conds = [eq(auditRooms.organizationId, orgId)];
  if (filters?.status) conds.push(eq(auditRooms.status, filters.status as any));
  if (filters?.roomType) conds.push(eq(auditRooms.roomType, filters.roomType as any));
  return db.select().from(auditRooms).where(and(...conds)).orderBy(desc(auditRooms.updatedAt));
}

export async function findRoomById(orgId: string, id: string): Promise<AuditRoom | null> {
  const rows = await db.select().from(auditRooms).where(and(eq(auditRooms.organizationId, orgId), eq(auditRooms.id, id))).limit(1);
  return rows[0] ?? null;
}

export async function createRoom(orgId: string, data: Partial<AuditRoom>, createdBy: string): Promise<AuditRoom> {
  const rows = await db.insert(auditRooms).values({ ...data, organizationId: orgId, createdBy } as any).returning();
  return rows[0];
}

export async function updateRoom(orgId: string, id: string, data: Partial<AuditRoom>): Promise<AuditRoom> {
  const rows = await db.update(auditRooms).set({ ...data, updatedAt: new Date() } as any).where(and(eq(auditRooms.organizationId, orgId), eq(auditRooms.id, id))).returning();
  return rows[0];
}

export async function deleteRoom(orgId: string, id: string): Promise<void> {
  await db.delete(auditRooms).where(and(eq(auditRooms.organizationId, orgId), eq(auditRooms.id, id)));
}

// ── Room Documents ────────────────────────────────────────────────────────────

export async function findRoomDocuments(roomId: string): Promise<AuditRoomDocument[]> {
  return db.select().from(auditRoomDocuments).where(eq(auditRoomDocuments.roomId, roomId)).orderBy(desc(auditRoomDocuments.createdAt));
}

export async function addRoomDocument(orgId: string, roomId: string, data: Partial<AuditRoomDocument>, uploadedBy: string): Promise<AuditRoomDocument> {
  const rows = await db.insert(auditRoomDocuments).values({ ...data, roomId, organizationId: orgId, uploadedBy } as any).returning();
  return rows[0];
}

// ── Room Activities ───────────────────────────────────────────────────────────

export async function findRoomActivities(roomId: string, limit = 50): Promise<AuditRoomActivity[]> {
  return db.select().from(auditRoomActivities).where(eq(auditRoomActivities.roomId, roomId)).orderBy(desc(auditRoomActivities.createdAt)).limit(limit);
}

export async function addRoomActivity(orgId: string, roomId: string, data: { activityType: string; description: string; actorId?: string; externalUserId?: string; metadata?: Record<string, unknown> }): Promise<void> {
  await db.insert(auditRoomActivities).values({ roomId, organizationId: orgId, ...data } as any);
}

// ── Evidence Requests ─────────────────────────────────────────────────────────

export async function findAllEvidenceRequests(orgId: string, filters?: { status?: string; roomId?: string }): Promise<EvidenceRequest[]> {
  const conds = [eq(evidenceRequests.organizationId, orgId)];
  if (filters?.status) conds.push(eq(evidenceRequests.status, filters.status as any));
  if (filters?.roomId) conds.push(eq(evidenceRequests.roomId, filters.roomId));
  return db.select().from(evidenceRequests).where(and(...conds)).orderBy(desc(evidenceRequests.createdAt));
}

export async function findEvidenceRequestById(orgId: string, id: string): Promise<EvidenceRequest | null> {
  const rows = await db.select().from(evidenceRequests).where(and(eq(evidenceRequests.organizationId, orgId), eq(evidenceRequests.id, id))).limit(1);
  return rows[0] ?? null;
}

export async function createEvidenceRequest(orgId: string, roomId: string, data: Partial<EvidenceRequest>, createdBy: string): Promise<EvidenceRequest> {
  const rows = await db.insert(evidenceRequests).values({ ...data, roomId, organizationId: orgId, createdBy } as any).returning();
  return rows[0];
}

export async function updateEvidenceRequest(orgId: string, id: string, data: Partial<EvidenceRequest>): Promise<EvidenceRequest> {
  const rows = await db.update(evidenceRequests).set({ ...data, updatedAt: new Date() } as any).where(and(eq(evidenceRequests.organizationId, orgId), eq(evidenceRequests.id, id))).returning();
  return rows[0];
}

export async function findEvidenceResponses(requestId: string): Promise<EvidenceResponse[]> {
  return db.select().from(evidenceResponses).where(eq(evidenceResponses.requestId, requestId)).orderBy(desc(evidenceResponses.createdAt));
}

export async function addEvidenceResponse(orgId: string, requestId: string, data: Partial<EvidenceResponse>, uploadedBy: string): Promise<EvidenceResponse> {
  const rows = await db.insert(evidenceResponses).values({ ...data, requestId, organizationId: orgId, uploadedBy } as any).returning();
  return rows[0];
}

// ── External Findings ─────────────────────────────────────────────────────────

export async function findAllExternalFindings(orgId: string, filters?: { status?: string; severity?: string; roomId?: string }): Promise<ExternalFinding[]> {
  const conds = [eq(externalFindings.organizationId, orgId)];
  if (filters?.status) conds.push(eq(externalFindings.status, filters.status as any));
  if (filters?.severity) conds.push(eq(externalFindings.severity, filters.severity as any));
  if (filters?.roomId) conds.push(eq(externalFindings.roomId, filters.roomId));
  return db.select().from(externalFindings).where(and(...conds)).orderBy(desc(externalFindings.createdAt));
}

export async function findFindingById(orgId: string, id: string): Promise<ExternalFinding | null> {
  const rows = await db.select().from(externalFindings).where(and(eq(externalFindings.organizationId, orgId), eq(externalFindings.id, id))).limit(1);
  return rows[0] ?? null;
}

export async function createExternalFinding(orgId: string, roomId: string, data: Partial<ExternalFinding>, createdBy: string): Promise<ExternalFinding> {
  const rows = await db.insert(externalFindings).values({ ...data, roomId, organizationId: orgId, createdBy } as any).returning();
  return rows[0];
}

export async function updateExternalFinding(orgId: string, id: string, data: Partial<ExternalFinding>): Promise<ExternalFinding> {
  const rows = await db.update(externalFindings).set({ ...data, updatedAt: new Date() } as any).where(and(eq(externalFindings.organizationId, orgId), eq(externalFindings.id, id))).returning();
  return rows[0];
}

// ── External Assessments ──────────────────────────────────────────────────────

export async function findAllAssessments(orgId: string, filters?: { status?: string; roomId?: string }): Promise<ExternalAssessment[]> {
  const conds = [eq(externalAssessments.organizationId, orgId)];
  if (filters?.status) conds.push(eq(externalAssessments.status, filters.status as any));
  if (filters?.roomId) conds.push(eq(externalAssessments.roomId, filters.roomId));
  return db.select().from(externalAssessments).where(and(...conds)).orderBy(desc(externalAssessments.createdAt));
}

export async function createExternalAssessment(orgId: string, roomId: string, data: Partial<ExternalAssessment>, createdBy: string): Promise<ExternalAssessment> {
  const rows = await db.insert(externalAssessments).values({ ...data, roomId, organizationId: orgId, createdBy } as any).returning();
  return rows[0];
}

export async function updateExternalAssessment(orgId: string, id: string, data: Partial<ExternalAssessment>): Promise<ExternalAssessment> {
  const rows = await db.update(externalAssessments).set({ ...data, updatedAt: new Date() } as any).where(and(eq(externalAssessments.organizationId, orgId), eq(externalAssessments.id, id))).returning();
  return rows[0];
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function findComments(orgId: string, entityType: string, entityId: string): Promise<ExternalComment[]> {
  return db.select().from(externalComments).where(and(eq(externalComments.organizationId, orgId), eq(externalComments.entityType, entityType as any), eq(externalComments.entityId, entityId))).orderBy(asc(externalComments.createdAt));
}

export async function createComment(orgId: string, roomId: string, data: Partial<ExternalComment>): Promise<ExternalComment> {
  const rows = await db.insert(externalComments).values({ ...data, roomId, organizationId: orgId } as any).returning();
  return rows[0];
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function findReviewsByRoom(roomId: string): Promise<AuditReview[]> {
  return db.select().from(auditReviews).where(eq(auditReviews.roomId, roomId)).orderBy(desc(auditReviews.createdAt));
}

export async function createAuditReview(orgId: string, roomId: string, data: Partial<AuditReview>): Promise<AuditReview> {
  const rows = await db.insert(auditReviews).values({ ...data, roomId, organizationId: orgId } as any).returning();
  return rows[0];
}

// ── Permissions ───────────────────────────────────────────────────────────────

export async function grantPermission(orgId: string, data: Partial<ExternalPermission>, grantedBy: string): Promise<ExternalPermission> {
  const rows = await db.insert(externalPermissions).values({ ...data, organizationId: orgId, grantedBy } as any).returning();
  return rows[0];
}
