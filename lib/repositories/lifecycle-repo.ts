import { sql } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";
import type { VendorState } from "@/lib/services/vendor-lifecycle/lifecycle-service";

export type LifecycleHistoryRow = {
  id: string;
  organization_id: string;
  vendor_id: string;
  from_state: string | null;
  to_state: string;
  transition_reason: string | null;
  triggered_by: string;
  actor_id: string | null;
  actor_name: string | null;
  metadata: unknown;
  created_at: Date;
};

export async function insertLifecycleHistory(
  params: {
    orgId: string;
    vendorId: string;
    fromState: VendorState | null;
    toState: VendorState;
    reason?: string;
    triggeredBy?: string;
    actorId?: string;
    actorName?: string;
    metadata?: Record<string, unknown>;
  },
  exec: Executor = db
): Promise<void> {
  await exec.execute(
    sql`INSERT INTO vendor_lifecycle_history
          (organization_id, vendor_id, from_state, to_state, transition_reason, triggered_by, actor_id, actor_name, metadata)
        VALUES
          (${params.orgId}, ${params.vendorId},
           ${params.fromState ?? null}::vendor_state,
           ${params.toState}::vendor_state,
           ${params.reason ?? null},
           ${params.triggeredBy ?? "manual"},
           ${params.actorId ?? null},
           ${params.actorName ?? null},
           ${params.metadata ? JSON.stringify(params.metadata) : null}::jsonb)`
  );
}

export async function findLifecycleHistory(
  orgId: string,
  vendorId: string
): Promise<LifecycleHistoryRow[]> {
  const rows = await db.execute<LifecycleHistoryRow>(
    sql`SELECT * FROM vendor_lifecycle_history
        WHERE organization_id = ${orgId} AND vendor_id = ${vendorId}
        ORDER BY created_at DESC`
  );
  return Array.from(rows);
}

export type OnboardingProgress = {
  id: string;
  vendor_id: string;
  current_step: number;
  completed_steps: number[];
  form_data: Record<string, unknown>;
  is_complete: boolean;
  updated_at: Date;
};

export async function getOnboardingProgress(
  orgId: string,
  vendorId: string
): Promise<OnboardingProgress | null> {
  const rows = await db.execute<OnboardingProgress>(
    sql`SELECT * FROM vendor_onboarding_progress
        WHERE organization_id = ${orgId} AND vendor_id = ${vendorId}
        LIMIT 1`
  );
  return rows[0] ?? null;
}

export async function upsertOnboardingProgress(
  params: {
    orgId: string;
    vendorId: string;
    currentStep: number;
    completedSteps: number[];
    formData: Record<string, unknown>;
    isComplete?: boolean;
  },
  exec: Executor = db
): Promise<void> {
  const { orgId, vendorId, currentStep, completedSteps, formData, isComplete = false } = params;
  await exec.execute(
    sql`INSERT INTO vendor_onboarding_progress
          (organization_id, vendor_id, current_step, completed_steps, form_data, is_complete)
        VALUES
          (${orgId}, ${vendorId}, ${currentStep}, ${JSON.stringify(completedSteps)}::integer[], ${JSON.stringify(formData)}::jsonb, ${isComplete})
        ON CONFLICT (vendor_id)
        DO UPDATE SET
          current_step    = EXCLUDED.current_step,
          completed_steps = EXCLUDED.completed_steps,
          form_data       = EXCLUDED.form_data,
          is_complete     = EXCLUDED.is_complete,
          updated_at      = NOW()`
  );
}
