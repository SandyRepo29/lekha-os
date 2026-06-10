export const dynamic = "force-dynamic";

import Link from "next/link";
import { Shield, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { listExceptions, approveException } from "@/lib/services/issue-hub/issue-service";
import { approveExceptionAction } from "@/lib/issue-hub/actions";

const EXCEPTION_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
  expired: "bg-gray-500/20 text-gray-400",
  revoked: "bg-slate-500/20 text-slate-400",
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function ExceptionsPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card className="p-8 text-center">
        <Shield className="h-10 w-10 mx-auto mb-3 text-[var(--color-ink-dim)]" />
        <p className="text-sm text-[var(--color-ink-dim)]">Connect Supabase to view exceptions.</p>
      </Card>
    );
  }

  const exceptions = await listExceptions(session.org.id);
  const pending = exceptions.filter((e) => (e as Record<string, unknown>).status === "pending");
  const approved = exceptions.filter((e) => (e as Record<string, unknown>).status === "approved");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Exceptions™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          Governance exception requests · {pending.length} pending review
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{pending.length}</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">Pending</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{approved.length}</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">Approved</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{exceptions.length}</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">Total</p>
        </Card>
      </div>

      {exceptions.length === 0 ? (
        <Card className="p-12 text-center">
          <Shield className="h-10 w-10 mx-auto mb-3 text-[var(--color-ink-dim)]" />
          <p className="font-semibold">No exception requests</p>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">
            Exception requests are created from individual issue detail pages.
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Issue</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Justification</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Expiry</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Approver</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {exceptions.map((exc) => {
                  const e = exc as Record<string, unknown>;
                  const status = e.status as string;
                  const isPending = status === "pending";
                  return (
                    <tr key={e.id as string} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/issue-hub/${e.issue_id as string}`}
                          className="font-medium hover:text-indigo-400 transition-colors block max-w-[180px] truncate"
                        >
                          {e.issue_title as string}
                        </Link>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full ${
                            (e.issue_severity as string) === "critical"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-orange-500/20 text-orange-400"
                          }`}
                        >
                          {e.issue_severity as string}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-sm text-[var(--color-ink-dim)] line-clamp-2">
                          {e.business_justification as string}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${EXCEPTION_STATUS_COLORS[status] ?? ""}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">
                        {formatDate(e.expiry_date as string)}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">
                        {(e.approver_name as string) ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        {isPending && (
                          <div className="flex gap-2">
                            <form
                              action={async () => {
                                "use server";
                                await approveExceptionAction(e.id as string, e.issue_id as string, true);
                              }}
                            >
                              <button
                                type="submit"
                                className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                              </button>
                            </form>
                            <form
                              action={async () => {
                                "use server";
                                await approveExceptionAction(e.id as string, e.issue_id as string, false, "Rejected by reviewer");
                              }}
                            >
                              <button
                                type="submit"
                                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                              >
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </button>
                            </form>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
