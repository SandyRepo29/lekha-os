export const dynamic = "force-dynamic";

import Link from "next/link";
import { Shield, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { listExceptions } from "@/backend/src/modules/issue-hub/issue-service";
import { approveExceptionAction } from "@/backend/src/modules/issue-hub/actions";
import { IssueStat, ExceptionStatusBadge, IssueSeverityBadge } from "@/components/issue-hub/issue-ui";

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
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Exceptions™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          Governance exception requests · {pending.length} pending review
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <IssueStat label="Pending" value={pending.length} accent={pending.length > 0 ? "warn" : "neutral"} />
        <IssueStat label="Approved" value={approved.length} accent={approved.length > 0 ? "good" : "neutral"} />
        <IssueStat label="Total" value={exceptions.length} accent="neutral" />
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
                    <tr key={e.id as string} className="hover:bg-white transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/issue-hub/${e.issue_id as string}`}
                          className="font-medium hover:text-[var(--color-blue)] transition-colors block max-w-[180px] truncate"
                        >
                          {e.issue_title as string}
                        </Link>
                        <IssueSeverityBadge severity={e.issue_severity as string} />
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="text-sm text-[var(--color-ink-dim)] line-clamp-2">
                          {e.business_justification as string}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <ExceptionStatusBadge status={status} />
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
                                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
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
