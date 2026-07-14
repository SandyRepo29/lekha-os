import { cn } from "@/lib/utils";
import { VENDOR_STATE_LABELS, VENDOR_STATE_BG } from "@/backend/src/modules/vendor-hub/lifecycle-constants";
import type { VendorState } from "@/backend/src/modules/vendor-hub/lifecycle-constants";

interface Props {
  state: VendorState | string;
  size?: "sm" | "md";
}

export function LifecycleBadge({ state, size = "md" }: Props) {
  const s = state as VendorState;
  const label = VENDOR_STATE_LABELS[s] ?? state;
  const bg    = VENDOR_STATE_BG[s] ?? "bg-gray-500/10 text-gray-400 border-gray-500/20";

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border font-semibold",
      size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs",
      bg
    )}>
      <span className={cn(
        "inline-block rounded-full",
        size === "sm" ? "h-1 w-1" : "h-1.5 w-1.5",
        s === "active" ? "bg-emerald-400" :
        s === "onboarding" ? "bg-blue-400" :
        s === "under_review" ? "bg-amber-400" :
        s === "renewal_due" || s === "renewing" ? "bg-orange-400" :
        s === "offboarding" ? "bg-red-400" :
        "bg-gray-400"
      )} />
      {label}
    </span>
  );
}
