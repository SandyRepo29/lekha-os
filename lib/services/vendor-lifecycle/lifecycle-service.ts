import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { DomainError } from "@/lib/services/errors";
import * as lifecycleRepo from "@/lib/repositories/lifecycle-repo";
import * as timelineRepo from "@/lib/repositories/vendor-timeline-repo";

// Re-export pure constants from client-safe module
export type { VendorState } from "./lifecycle-constants";
export {
  VENDOR_STATE_LABELS,
  VENDOR_STATE_COLORS,
  VENDOR_STATE_BG,
  TRANSITION_LABELS,
  LIFECYCLE_ORDER,
  isValidTransition,
  getAllowedTransitions,
} from "./lifecycle-constants";

import type { VendorState } from "./lifecycle-constants";
import { isValidTransition, VENDOR_STATE_LABELS, TRANSITION_LABELS } from "./lifecycle-constants";

export async function transitionVendor(params: {
  orgId: string;
  vendorId: string;
  actorId: string;
  actorName?: string;
  fromState: VendorState;
  toState: VendorState;
  reason?: string;
  triggeredBy?: "manual" | "automatic" | "approval" | "cron";
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const { orgId, vendorId, actorId, actorName, fromState, toState, reason, triggeredBy = "manual", metadata } = params;

  if (!isValidTransition(fromState, toState)) {
    throw new DomainError(`Cannot transition vendor from "${fromState}" to "${toState}".`);
  }

  await db.transaction(async (tx) => {
    // Update vendor lifecycle_state
    await tx.execute(
      sql`UPDATE vendors
          SET lifecycle_state = ${toState}::vendor_state,
              lifecycle_state_at = NOW(),
              lifecycle_state_reason = ${reason ?? null},
              updated_at = NOW()
          WHERE id = ${vendorId} AND organization_id = ${orgId}`
    );

    // Record in lifecycle history
    await lifecycleRepo.insertLifecycleHistory({
      orgId,
      vendorId,
      fromState,
      toState,
      reason,
      triggeredBy,
      actorId,
      actorName,
      metadata,
    }, tx);

    // Add to vendor timeline
    await timelineRepo.insertTimelineEvent({
      orgId,
      vendorId,
      eventType: "lifecycle_changed",
      title: `Status changed to ${VENDOR_STATE_LABELS[toState]}`,
      description: reason ?? TRANSITION_LABELS[`${fromState}->${toState}`] ?? undefined,
      actorId,
      actorName,
      severity: toState === "active" ? "success" : toState === "offboarding" || toState === "offboarded" ? "warn" : "info",
      metadata: { fromState, toState },
    }, tx);
  });
}

export async function getVendorLifecycleState(orgId: string, vendorId: string): Promise<VendorState> {
  const rows = await db.execute<{ lifecycle_state: string }>(
    sql`SELECT lifecycle_state FROM vendors WHERE id = ${vendorId} AND organization_id = ${orgId} LIMIT 1`
  );
  const row = rows[0];
  return (row?.lifecycle_state as VendorState) ?? "active";
}

export async function getLifecycleHistory(orgId: string, vendorId: string) {
  return lifecycleRepo.findLifecycleHistory(orgId, vendorId);
}

