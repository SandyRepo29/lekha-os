import { sql } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";

export type ApprovalType = "procurement" | "security" | "compliance" | "legal" | "privacy" | "finance" | "executive";
export type ApprovalWorkflowType = "sequential" | "parallel" | "conditional";
export type ApprovalStatus = "pending" | "in_progress" | "approved" | "rejected" | "cancelled" | "escalated";
export type ApprovalDecisionType = "approved" | "rejected" | "delegated" | "requested_changes";

export type ApprovalTemplate = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  approval_type: ApprovalType;
  workflow_type: ApprovalWorkflowType;
  trigger_on: string | null;
  auto_approve_days: number | null;
  is_active: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
};

export type ApprovalStep = {
  id: string;
  template_id: string;
  organization_id: string;
  step_order: number;
  name: string;
  description: string | null;
  approver_role: string | null;
  approver_user_id: string | null;
  timeout_hours: number | null;
  escalation_user_id: string | null;
  is_required: boolean;
  conditions: unknown;
};

export type ApprovalInstance = {
  id: string;
  organization_id: string;
  template_id: string | null;
  entity_type: string;
  entity_id: string;
  title: string;
  approval_type: ApprovalType;
  workflow_type: ApprovalWorkflowType;
  status: ApprovalStatus;
  current_step: number;
  total_steps: number;
  initiated_by: string | null;
  initiated_at: Date;
  due_at: Date | null;
  completed_at: Date | null;
  metadata: unknown;
  notes: string | null;
};

export type ApprovalDecision = {
  id: string;
  instance_id: string;
  organization_id: string;
  step_number: number;
  step_name: string | null;
  approver_id: string | null;
  approver_name: string | null;
  decision: ApprovalDecisionType;
  comments: string | null;
  delegated_to_id: string | null;
  decided_at: Date;
};

// ── Templates ───────────────────────────────────────────────

export async function findTemplatesByOrg(orgId: string): Promise<ApprovalTemplate[]> {
  const rows = await db.execute<ApprovalTemplate>(
    sql`SELECT * FROM approval_templates WHERE organization_id = ${orgId} AND is_active = true ORDER BY name ASC`
  );
  return Array.from(rows);
}

export async function insertTemplate(
  params: {
    orgId: string;
    name: string;
    description?: string;
    approvalType: ApprovalType;
    workflowType: ApprovalWorkflowType;
    triggerOn?: string;
    autoApproveDays?: number;
    createdBy: string;
  },
  exec: Executor = db
): Promise<{ id: string }> {
  const rows = await exec.execute<{ id: string }>(
    sql`INSERT INTO approval_templates
          (organization_id, name, description, approval_type, workflow_type, trigger_on, auto_approve_days, created_by)
        VALUES
          (${params.orgId}, ${params.name}, ${params.description ?? null},
           ${params.approvalType}::approval_type, ${params.workflowType}::approval_workflow_type,
           ${params.triggerOn ?? null}, ${params.autoApproveDays ?? null}, ${params.createdBy})
        RETURNING id`
  );
  return rows[0]!;
}

export async function findStepsByTemplate(templateId: string): Promise<ApprovalStep[]> {
  const rows = await db.execute<ApprovalStep>(
    sql`SELECT * FROM approval_steps WHERE template_id = ${templateId} ORDER BY step_order ASC`
  );
  return Array.from(rows);
}

export async function insertStep(
  params: {
    templateId: string;
    orgId: string;
    stepOrder: number;
    name: string;
    description?: string;
    approverRole?: string;
    approverUserId?: string;
    timeoutHours?: number;
    escalationUserId?: string;
    isRequired?: boolean;
  },
  exec: Executor = db
): Promise<void> {
  await exec.execute(
    sql`INSERT INTO approval_steps
          (template_id, organization_id, step_order, name, description, approver_role, approver_user_id, timeout_hours, escalation_user_id, is_required)
        VALUES
          (${params.templateId}, ${params.orgId}, ${params.stepOrder}, ${params.name},
           ${params.description ?? null}, ${params.approverRole ?? null},
           ${params.approverUserId ?? null}, ${params.timeoutHours ?? 72},
           ${params.escalationUserId ?? null}, ${params.isRequired ?? true})`
  );
}

// ── Instances ────────────────────────────────────────────────

export async function insertInstance(
  params: {
    orgId: string;
    templateId?: string;
    entityType: string;
    entityId: string;
    title: string;
    approvalType: ApprovalType;
    workflowType: ApprovalWorkflowType;
    totalSteps: number;
    initiatedBy: string;
    dueAt?: Date;
    metadata?: Record<string, unknown>;
    notes?: string;
  },
  exec: Executor = db
): Promise<{ id: string }> {
  const rows = await exec.execute<{ id: string }>(
    sql`INSERT INTO approval_instances
          (organization_id, template_id, entity_type, entity_id, title, approval_type, workflow_type,
           total_steps, initiated_by, due_at, metadata, notes, status)
        VALUES
          (${params.orgId}, ${params.templateId ?? null}, ${params.entityType}, ${params.entityId},
           ${params.title}, ${params.approvalType}::approval_type, ${params.workflowType}::approval_workflow_type,
           ${params.totalSteps}, ${params.initiatedBy},
           ${params.dueAt?.toISOString() ?? null},
           ${params.metadata ? JSON.stringify(params.metadata) : null}::jsonb,
           ${params.notes ?? null}, 'in_progress'::approval_status)
        RETURNING id`
  );
  return rows[0]!;
}

export async function findInstancesByVendor(orgId: string, vendorId: string): Promise<ApprovalInstance[]> {
  const rows = await db.execute<ApprovalInstance>(
    sql`SELECT * FROM approval_instances
        WHERE organization_id = ${orgId} AND entity_type = 'vendor' AND entity_id = ${vendorId}
        ORDER BY initiated_at DESC`
  );
  return Array.from(rows);
}

export async function findActiveInstanceByVendor(orgId: string, vendorId: string): Promise<ApprovalInstance | null> {
  const rows = await db.execute<ApprovalInstance>(
    sql`SELECT * FROM approval_instances
        WHERE organization_id = ${orgId} AND entity_type = 'vendor' AND entity_id = ${vendorId}
          AND status IN ('pending', 'in_progress')
        ORDER BY initiated_at DESC
        LIMIT 1`
  );
  return rows[0] ?? null;
}

export async function updateInstanceStatus(
  orgId: string,
  instanceId: string,
  status: ApprovalStatus,
  exec: Executor = db
): Promise<void> {
  const completedAt = ["approved", "rejected", "cancelled"].includes(status) ? "NOW()" : "NULL";
  await exec.execute(
    sql`UPDATE approval_instances
        SET status = ${status}::approval_status,
            completed_at = ${sql.raw(completedAt)},
            updated_at = NOW()
        WHERE id = ${instanceId} AND organization_id = ${orgId}`
  );
}

// ── Decisions ────────────────────────────────────────────────

export async function insertDecision(
  params: {
    instanceId: string;
    orgId: string;
    stepNumber: number;
    stepName?: string;
    approverId: string;
    approverName?: string;
    decision: ApprovalDecisionType;
    comments?: string;
    delegatedToId?: string;
  },
  exec: Executor = db
): Promise<void> {
  await exec.execute(
    sql`INSERT INTO approval_decisions
          (instance_id, organization_id, step_number, step_name, approver_id, approver_name, decision, comments, delegated_to_id)
        VALUES
          (${params.instanceId}, ${params.orgId}, ${params.stepNumber},
           ${params.stepName ?? null}, ${params.approverId}, ${params.approverName ?? null},
           ${params.decision}::approval_decision_type, ${params.comments ?? null},
           ${params.delegatedToId ?? null})`
  );
}

export async function findDecisionsByInstance(instanceId: string): Promise<ApprovalDecision[]> {
  const rows = await db.execute<ApprovalDecision>(
    sql`SELECT * FROM approval_decisions WHERE instance_id = ${instanceId} ORDER BY decided_at ASC`
  );
  return Array.from(rows);
}

export async function getPendingApprovalsForOrg(orgId: string): Promise<(ApprovalInstance & { vendor_name?: string })[]> {
  const rows = await db.execute<ApprovalInstance & { vendor_name: string }>(
    sql`SELECT ai.*, v.name as vendor_name
        FROM approval_instances ai
        LEFT JOIN vendors v ON v.id = ai.entity_id::uuid AND v.organization_id = ai.organization_id
        WHERE ai.organization_id = ${orgId} AND ai.status IN ('pending', 'in_progress')
        ORDER BY ai.initiated_at DESC`
  );
  return Array.from(rows);
}
