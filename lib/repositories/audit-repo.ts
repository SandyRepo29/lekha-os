import { db, type Executor } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export type AuditEntry = {
  organizationId: string;
  actorId: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
};

/** Append an audit-log row. Pass a transaction handle to include it atomically. */
export async function recordAudit(entry: AuditEntry, exec: Executor = db): Promise<void> {
  await exec.insert(auditLogs).values({
    organizationId: entry.organizationId,
    actorId: entry.actorId,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId,
    metadata: entry.metadata,
  });
}
