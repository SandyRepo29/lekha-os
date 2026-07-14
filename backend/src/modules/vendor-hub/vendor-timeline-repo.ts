import { sql } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";

export type TimelineEventType =
  | "vendor_created" | "lifecycle_changed" | "contact_added" | "contact_updated"
  | "assessment_completed" | "risk_identified" | "risk_closed"
  | "evidence_uploaded" | "evidence_expired" | "policy_acknowledged"
  | "audit_executed" | "finding_raised" | "finding_closed"
  | "issue_created" | "issue_resolved" | "remediation_completed"
  | "contract_created" | "contract_renewed" | "contract_expired"
  | "approval_started" | "approval_approved" | "approval_rejected"
  | "onboarding_started" | "onboarding_step_completed" | "onboarding_completed"
  | "renewal_started" | "renewal_completed"
  | "offboarding_started" | "offboarding_step_completed" | "offboarding_completed"
  | "note_added" | "trust_score_updated" | "monitoring_alert";

export type TimelineRow = {
  id: string;
  organization_id: string;
  vendor_id: string;
  event_type: TimelineEventType;
  title: string;
  description: string | null;
  actor_id: string | null;
  actor_name: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: unknown;
  severity: string | null;
  created_at: Date;
};

export async function insertTimelineEvent(
  params: {
    orgId: string;
    vendorId: string;
    eventType: TimelineEventType;
    title: string;
    description?: string;
    actorId?: string;
    actorName?: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    severity?: "info" | "warn" | "danger" | "success";
  },
  exec: Executor = db
): Promise<void> {
  const { orgId, vendorId, eventType, title, description, actorId, actorName, entityType, entityId, metadata, severity } = params;
  await exec.execute(
    sql`INSERT INTO vendor_timeline
          (organization_id, vendor_id, event_type, title, description, actor_id, actor_name, entity_type, entity_id, metadata, severity)
        VALUES
          (${orgId}, ${vendorId}, ${eventType}::timeline_event_type, ${title},
           ${description ?? null}, ${actorId ?? null}, ${actorName ?? null},
           ${entityType ?? null}, ${entityId ?? null},
           ${metadata ? JSON.stringify(metadata) : null}::jsonb,
           ${severity ?? "info"})`
  );
}

export async function findVendorTimeline(
  orgId: string,
  vendorId: string,
  limit = 50
): Promise<TimelineRow[]> {
  const rows = await db.execute<TimelineRow>(
    sql`SELECT * FROM vendor_timeline
        WHERE organization_id = ${orgId} AND vendor_id = ${vendorId}
        ORDER BY created_at DESC
        LIMIT ${limit}`
  );
  return Array.from(rows);
}
