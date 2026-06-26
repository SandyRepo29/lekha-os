/** Pure constants and types — no DB imports. Safe to import in client components. */

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

export const TRANSITION_LABELS: Partial<Record<`${VendorState}->${VendorState}`, string>> = {
  "draft->invited":            "Send vendor invitation",
  "draft->onboarding":         "Start onboarding",
  "invited->onboarding":       "Begin onboarding",
  "invited->draft":            "Return to draft",
  "onboarding->active":        "Activate vendor",
  "onboarding->draft":         "Return to draft",
  "active->under_review":      "Trigger review",
  "active->renewal_due":       "Mark renewal due",
  "active->offboarding":       "Begin offboarding",
  "under_review->active":      "Review passed",
  "under_review->renewal_due": "Flag for renewal",
  "under_review->offboarding": "Review failed — offboard",
  "renewal_due->renewing":     "Start renewal workflow",
  "renewal_due->offboarding":  "Decline renewal",
  "renewal_due->active":       "Clear renewal flag",
  "renewing->active":          "Renewal approved",
  "renewing->offboarding":     "Renewal rejected",
  "offboarding->offboarded":   "Complete offboarding",
  "offboarded->archived":      "Archive vendor",
  "offboarded->active":        "Reactivate vendor",
};

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

export function isValidTransition(from: VendorState, to: VendorState): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export function getAllowedTransitions(currentState: VendorState): VendorState[] {
  return ALLOWED_TRANSITIONS[currentState] ?? [];
}
