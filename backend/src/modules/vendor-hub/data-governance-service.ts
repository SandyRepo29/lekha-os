import { db } from "@/lib/db";
import {
  vendors,
  vendorDocuments,
  assessments,
  memberships,
  auditLogs,
} from "@/lib/db/schema";
import { and, count, eq, gte, sum } from "drizzle-orm";

export interface DataGovernanceStats {
  documentCount: number;
  storageBytesUsed: number;
  vendorCount: number;
  assessmentCount: number;
  userCount: number;
}

export interface RecentAuditEvent {
  id: string;
  action: string;
  entityType: string | null;
  actorId: string | null;
  createdAt: Date;
}

export async function getDataGovernanceStats(orgId: string): Promise<DataGovernanceStats> {
  const [docRow] = await db
    .select({ n: count(), bytes: sum(vendorDocuments.fileSize) })
    .from(vendorDocuments)
    .where(eq(vendorDocuments.organizationId, orgId));

  const [vendorRow] = await db
    .select({ n: count() })
    .from(vendors)
    .where(eq(vendors.organizationId, orgId));

  const [assessRow] = await db
    .select({ n: count() })
    .from(assessments)
    .where(eq(assessments.organizationId, orgId));

  const [memberRow] = await db
    .select({ n: count() })
    .from(memberships)
    .where(and(eq(memberships.organizationId, orgId), eq(memberships.isActive, true)));

  return {
    documentCount: Number(docRow?.n ?? 0),
    storageBytesUsed: Number(docRow?.bytes ?? 0),
    vendorCount: Number(vendorRow?.n ?? 0),
    assessmentCount: Number(assessRow?.n ?? 0),
    userCount: Number(memberRow?.n ?? 0),
  };
}

export async function getRecentAuditEvents(orgId: string, limit = 10): Promise<RecentAuditEvent[]> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      actorId: auditLogs.actorId,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .where(and(eq(auditLogs.organizationId, orgId), gte(auditLogs.createdAt, cutoff)))
    .orderBy(auditLogs.createdAt)
    .limit(limit) as Promise<RecentAuditEvent[]>;
}
