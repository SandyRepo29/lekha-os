export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getApprovalsAction } from "@/lib/toe/actions";
import { ToeSubNav, ApprovalStatusBadge, fmtDt } from "@/components/toe/toe-ui";
import { CheckSquare } from "lucide-react";
import { ResolveApprovalButtons } from "@/components/toe/approval-actions";

export default async function ApprovalsPage() {
  await requireUser();

  const result = await getApprovalsAction();
  const approvals = ((result as { data?: unknown[] } | null)?.data ?? []) as Array<{
    id: string; title: string; description: string | null; request_type: string; status: string;
    requester_name: string | null; assignee_name: string | null; due_at: string | null;
    notes: string | null; created_at: string; context: Record<string, unknown>;
  }>;

  const pending = approvals.filter(a => a.status === "pending");
  const resolved = approvals.filter(a => a.status !== "pending");

  return (
    <div className="space-y-6 p-6">
      <ToeSubNav />

      <div className="pt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Unified Approval Queue™</h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            All governance approval requests across every module in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.05] px-3 py-1.5 text-sm font-semibold text-amber-400">
            {pending.length} Pending
          </div>
        </div>
      </div>

      {/* Pending */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-amber-400" />
          <span className="text-sm font-semibold">Awaiting Decision</span>
        </div>
        {pending.length === 0
          ? (
            <div className="py-10 text-center">
              <CheckSquare className="mx-auto mb-3 h-8 w-8 text-[var(--color-ink-dim)]" />
              <p className="text-sm text-[var(--color-ink-dim)]">No pending approvals.</p>
              <p className="mt-1 text-xs text-[var(--color-ink-dim)]">Approval requests from workflows and governance actions will appear here.</p>
            </div>
          )
          : (
            <div className="space-y-3">
              {pending.map(a => (
                <div key={a.id} className="rounded-xl border border-amber-500/20 bg-amber-500/[0.03] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{a.title}</div>
                      {a.description && <p className="mt-1 text-xs text-[var(--color-ink-dim)]">{a.description}</p>}
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[var(--color-ink-dim)]">
                        <span>Type: <span className="text-[var(--color-ink)]">{a.request_type}</span></span>
                        {a.requester_name && <span>From: <span className="text-[var(--color-ink)]">{a.requester_name}</span></span>}
                        {a.assignee_name && <span>Assigned to: <span className="text-[var(--color-ink)]">{a.assignee_name}</span></span>}
                        {a.due_at && <span className="text-amber-400">Due: {fmtDt(a.due_at)}</span>}
                      </div>
                    </div>
                    <ResolveApprovalButtons approvalId={a.id} />
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Resolved */}
      {resolved.length > 0 && (
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-[var(--color-ink-dim)]" />
            <span className="text-sm font-semibold">Recently Resolved</span>
          </div>
          <div className="divide-y divide-[var(--color-line)]">
            {resolved.slice(0, 20).map(a => (
              <div key={a.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{a.request_type} · {fmtDt(a.created_at)}</div>
                  {a.notes && <div className="mt-1 text-xs italic text-[var(--color-ink-dim)]">&#8220;{a.notes}&#8221;</div>}
                </div>
                <ApprovalStatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
