"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, GitBranch, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LifecycleBadge } from "./lifecycle-badge";
import { transitionVendorAction } from "@/lib/vendors/lifecycle-actions";
import {
  VENDOR_STATE_LABELS, VENDOR_STATE_COLORS, getAllowedTransitions, TRANSITION_LABELS, LIFECYCLE_ORDER,
} from "@/lib/services/vendor-lifecycle/lifecycle-service";
import type { VendorState } from "@/lib/services/vendor-lifecycle/lifecycle-service";

interface HistoryRow {
  id: string;
  from_state: string | null;
  to_state: string;
  transition_reason: string | null;
  actor_name: string | null;
  triggered_by: string;
  created_at: string | Date;
}

interface Props {
  vendorId: string;
  currentState: VendorState;
  history: HistoryRow[];
  canEdit: boolean;
}

export function LifecyclePanel({ vendorId, currentState, history, canEdit }: Props) {
  const router = useRouter();
  const [selectedTransition, setSelectedTransition] = useState<VendorState | null>(null);
  const [reason, setReason] = useState("");
  const [state, formAction, pending] = useActionState(transitionVendorAction, undefined);

  const allowedTransitions = getAllowedTransitions(currentState);
  const currentIndex = LIFECYCLE_ORDER.indexOf(currentState);

  return (
    <div className="space-y-5">
      {/* State machine stepper */}
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-[var(--color-blue)]" />
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Vendor Lifecycle</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {LIFECYCLE_ORDER.map((s, i) => {
            const isCurrent = s === currentState;
            const isPast    = i < currentIndex;
            const isFuture  = i > currentIndex;

            return (
              <div key={s} className="flex items-center gap-2">
                <div className={[
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-all",
                  isCurrent ? "border-transparent text-white shadow-sm" : "",
                  isPast    ? "border-[var(--color-line)] text-[var(--color-ink-faint)] bg-white/[0.04]" : "",
                  isFuture  ? "border-[var(--color-line)] text-[var(--color-ink-faint)] opacity-40" : "",
                ].join(" ")}
                  style={isCurrent ? { backgroundColor: VENDOR_STATE_COLORS[s] } : {}}
                >
                  {isPast && <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />}
                  {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-white/80 shrink-0" />}
                  {VENDOR_STATE_LABELS[s]}
                </div>
                {i < LIFECYCLE_ORDER.length - 1 && (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--color-ink-faint)] opacity-30" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Transition actions */}
      {canEdit && allowedTransitions.length > 0 && (
        <Card className="p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-ink)]">Transition state</h3>
          {state?.error && (
            <p className="mb-3 text-sm text-red-400">{state.error}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {allowedTransitions.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTransition(selectedTransition === t ? null : t)}
                className={[
                  "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                  selectedTransition === t
                    ? "border-[var(--color-blue)] bg-[var(--color-blue)]/10 text-[var(--color-blue)]"
                    : "border-[var(--color-line)] bg-white/[0.02] text-[var(--color-ink-dim)] hover:bg-white/[0.05] hover:text-[var(--color-ink)]",
                ].join(" ")}
              >
                {TRANSITION_LABELS[`${currentState}->${t}`] ?? VENDOR_STATE_LABELS[t]}
              </button>
            ))}
          </div>

          {selectedTransition && (
            <form action={formAction} className="space-y-3">
              <input type="hidden" name="vendorId" value={vendorId} />
              <input type="hidden" name="toState"  value={selectedTransition} />
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--color-ink-dim)]">
                  Reason <span className="text-[var(--color-ink-faint)]">(optional)</span>
                </label>
                <input
                  name="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={`Reason for transitioning to ${VENDOR_STATE_LABELS[selectedTransition]}…`}
                  className="w-full rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" disabled={pending}>
                  {pending ? "Transitioning…" : `Move to ${VENDOR_STATE_LABELS[selectedTransition]}`}
                </Button>
                <button
                  type="button"
                  onClick={() => setSelectedTransition(null)}
                  className="px-3 py-1.5 text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* Transition history */}
      <Card>
        <div className="flex items-center gap-2 px-5 pt-5 pb-3">
          <Clock className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <h3 className="text-sm font-semibold text-[var(--color-ink)]">Transition history</h3>
        </div>
        {history.length === 0 ? (
          <p className="px-5 pb-5 text-sm text-[var(--color-ink-faint)]">No transitions recorded yet.</p>
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {history.map((h) => (
              <div key={h.id} className="flex items-start gap-3 px-5 py-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-blue)]/10">
                  <ChevronRight className="h-3.5 w-3.5 text-[var(--color-blue)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {h.from_state && (
                      <LifecycleBadge state={h.from_state} size="sm" />
                    )}
                    {h.from_state && <ChevronRight className="h-3 w-3 text-[var(--color-ink-faint)]" />}
                    <LifecycleBadge state={h.to_state} size="sm" />
                  </div>
                  {h.transition_reason && (
                    <p className="mt-1 text-xs text-[var(--color-ink-faint)]">{h.transition_reason}</p>
                  )}
                  <p className="mt-1 text-[10px] text-[var(--color-ink-faint)]">
                    {h.actor_name ?? "System"} &#183; {new Date(h.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {h.triggered_by !== "manual" && ` &#183; ${h.triggered_by}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
