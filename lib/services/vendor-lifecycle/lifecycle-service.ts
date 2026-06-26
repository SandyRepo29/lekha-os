import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { DomainError } from "@/lib/services/errors";
import * as lifecycleRepo from "@/lib/repositories/lifecycle-repo";
import * as timelineRepo from "@/lib/repositories/vendor-timeline-repo";

export type VendorState =
  | "draft"
  | "invited"
  | "onboarding"
  | "active"
  | "under_review"
  | "renewal_due"
  | "renewing"
  | "offboarding"
  | "offboarded"
  | "archived";

export const VENDOR_STATE_LABELS: Record<VendorState, string> = {
  draft:        "Draft",
  invited:      "Invited",
  onboarding:   "Onboarding",
  active:       "Active",
  under_review: "Under Review",
  renewal_due:  "Renewal Due",
  renewing:     "Renewing",
  offboarding:  "Offboarding",
  offboarded:   "Offboarded",
  archived:     "Archived",
};

export const VENDOR_STATE_COLORS: Record<VendorState, string> = {
  draft:        "#6b7280",
  invited:      "#8b5cf6",
  onboarding:   "#3b82f6",
  active:       "#10b981",
  under_review: "#f59e0b",
  renewal_due:  "#f97316",
  renewing:     "#06b6d4",
  offboarding:  "#ef4444",
  offboarded:   "#6b7280",
  archived:     "#374151",
};

export const VENDOR_STATE_BG: Record<VendorState, string> = {
  draft:        "bg-gray-500/10 text-gray-400 border-gray-500/20",
  invited:      "bg-purple-500/10 text-purple-400 border-purple-500/20",
  onboarding:   "bg-blue-500/10 text-blue-400 border-blue-500/20",
  active:       "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  under_review: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  renewal_due:  "bg-orange-500/10 text-orange-400 border-orange-500/20",
  renewing:     "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  offboarding:  "bg-red-500/10 text-red-400 border-red-500/20",
  offboarded:   "bg-gray-500/10 text-gray-400 border-gray-500/20",
  archived:     "bg-gray-900/20 text-gray-500 border-gray-700/20",
};

/** Valid transitions: from → Set of allowed to states */
const ALLOWED_TRANSITIONS: Record<VendorState, VendorState[]> = {
  draft:        ["invited", "onboarding"],
  invited:      ["onboarding", "draft"],
  onboarding:   ["active", "draft"],
  active:       ["under_review", "renewal_due", "offboarding"],
  under_review: ["active", "renewal_due", "offboarding"],
  renewal_due:  ["renewing", "offboarding", "active"],
  renewing:     ["active", "offboarding"],
  offboarding:  ["offboarded"],
  offboarded:   ["archived", "active"],
  archived:     [],
};

/** Human-readable description of each transition */
export const TRANSITION_LABELS: Partial<Record<`${VendorState}->${VendorState}`, string>> = {
  "draft->invited":           "Send vendor invitation",
  "draft->onboarding":        "Start onboarding",
  "invited->onboarding":      "Begin onboarding",
  "invited->draft":           "Return to draft",
  "onboarding->active":       "Activate vendor",
  "onboarding->draft":        "Return to draft",
  "active->under_review":     "Trigger review",
  "active->renewal_due":      "Mark renewal due",
  "active->offboarding":      "Begin offboarding",
  "under_review->active":     "Review passed",
  "under_review->renewal_due":"Flag for renewal",
  "under_review->offboarding":"Review failed — offboard",
  "renewal_due->renewing":    "Start renewal workflow",
  "renewal_due->offboarding": "Decline renewal",
  "renewal_due->active":      "Clear renewal flag",
  "renewing->active":         "Renewal approved",
  "renewing->offboarding":    "Renewal rejected",
  "offboarding->offboarded":  "Complete offboarding",
  "offboarded->archived":     "Archive vendor",
  "offboarded->active":       "Reactivate vendor",
};

export function isValidTransition(from: VendorState, to: VendorState): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAllowedTransitions(currentState: VendorState): VendorState[] {
  return ALLOWED_TRANSITIONS[currentState] ?? [];
}

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

/** Lifecycle state ordering for the visual stepper */
export const LIFECYCLE_ORDER: VendorState[] = [
  "draft",
  "invited",
  "onboarding",
  "active",
  "under_review",
  "renewal_due",
  "renewing",
  "offboarding",
  "offboarded",
  "archived",
];
