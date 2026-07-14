export const dynamic = "force-dynamic";

import { AlertCircle, ThumbsUp, ThumbsDown, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { listApprovals } from "@/backend/src/modules/workflow-studio/workflow-service";
import { decideApprovalAction } from "@/backend/src/modules/workflow-studio/actions";
import { ApprovalStatusBadge } from "@/components/workflow-studio/workflow-ui";

function formatDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(dueDate: Date | string | null | undefined): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export default async function ApprovalsPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card className="p-8 text-center">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-[var(--color-ink-dim)]" />
        <p className="font-semibold">Not available in demo mode.</p>
      </Card>
    );
  }

  const [pending, all] = await Promise.all([
    listApprovals(session.org.id, { status: "pending" }),
    listApprovals(session.org.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Approvals™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          {pending.length} pending approval{pending.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" /> Pending Approvals
          </h2>
          <div className="space-y-3">
            {pending.map((approval) => {
              const overdue = isOverdue(approval.dueDate);
              async function approve() {
                "use server";
                await decideApprovalAction(approval.id, true);
              }
              async function reject() {
                "use server";
                await decideApprovalAction(approval.id, false);
              }
              return (
                <div
                  key={approval.id}
                  className={`flex items-center justify-between gap-4 rounded-xl border p-4 ${
                    overdue
                      ? "border-red-500/30 bg-red-500/[0.04]"
                      : "border-amber-500/20 bg-amber-500/[0.03]"
                  }`}
                >
                  <div>
                    <p className="text-sm font-medium">{approval.workflowName}</p>
                    <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">
                      Approver: {approval.approverName ?? "Any member"} · Due:{" "}
                      <span className={overdue ? "text-red-400 font-medium" : ""}>
                        {formatDate(approval.dueDate)}
                        {overdue && " — overdue"}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <form action={approve}>
                      <Button size="sm" type="submit"><ThumbsUp className="h-4 w-4" /> Approve</Button>
                    </form>
                    <form action={reject}>
                      <Button size="sm" variant="outline" type="submit"><ThumbsDown className="h-4 w-4" /> Reject</Button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* All approvals table */}
      <Card className="p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-line)]">
          <h2 className="font-semibold">All Approvals</h2>
        </div>
        {all.length === 0 ? (
          <div className="p-12 text-center">
            <ThumbsUp className="h-10 w-10 mx-auto mb-3 text-[var(--color-ink-dim)]" />
            <p className="font-semibold">No approvals yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-line)] text-xs text-[var(--color-ink-dim)]">
                <th className="text-left px-5 py-3 font-medium">Workflow</th>
                <th className="text-left px-5 py-3 font-medium">Approver</th>
                <th className="text-left px-5 py-3 font-medium">Due</th>
                <th className="text-left px-5 py-3 font-medium">Decided</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {all.map((a) => {
                const overdue = a.status === "pending" && isOverdue(a.dueDate);
                return (
                  <tr
                    key={a.id}
                    className={`border-b border-[var(--color-line)]/50 hover:bg-white ${overdue ? "bg-red-500/[0.02]" : ""}`}
                  >
                    <td className="px-5 py-3 font-medium">{a.workflowName}</td>
                    <td className="px-5 py-3 text-[var(--color-ink-dim)]">{a.approverName ?? "—"}</td>
                    <td className={`px-5 py-3 ${overdue ? "text-red-400 font-medium" : "text-[var(--color-ink-dim)]"}`}>
                      {formatDate(a.dueDate)}
                    </td>
                    <td className="px-5 py-3 text-[var(--color-ink-dim)]">{formatDate(a.decidedAt)}</td>
                    <td className="px-5 py-3">
                      <ApprovalStatusBadge status={a.status} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
