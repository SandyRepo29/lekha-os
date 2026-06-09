export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, FileSearch, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listRequests, getDsrMetrics } from "@/lib/services/privacy/privacy-service";
import {
  PrivacyRequestStatusBadge,
  PrivacyRequestTypeBadge,
} from "@/components/privacy/privacy-badges";
import type { PrivacyRequest } from "@/lib/db/schema";

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(dueDate: Date | null | undefined, status: string) {
  if (!dueDate || ["completed", "closed"].includes(status)) return false;
  return new Date(dueDate) < new Date();
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const session = await requireUser();
  if (session.demo || !session.org) {
    return <EmptyState icon={FileSearch} title="Data Subject Requests™" description="Connect Supabase to manage DSR requests." />;
  }

  const params = await searchParams;
  const [requests, metrics] = await Promise.all([
    listRequests(session.org.id, { status: params.status, type: params.type }),
    getDsrMetrics(session.org.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Data Subject Requests™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            DPDP Act 2023 — 30-day SLA for all data subject rights requests
          </p>
        </div>
        <Link href="/dpdp-privacy/requests/new">
          <Button>
            <Plus className="h-4 w-4" /> New DSR
          </Button>
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: metrics.total, color: "text-[var(--color-ink)]" },
          { label: "Open", value: metrics.open, color: "text-blue-400" },
          {
            label: "Overdue",
            value: metrics.overdue,
            color: metrics.overdue > 0 ? "text-red-400" : "text-green-400",
          },
          {
            label: "Avg Resolution",
            value: `${metrics.avgResolutionDays}d`,
            color: "text-purple-400",
          },
        ].map((m) => (
          <Card key={m.label} className="p-4 text-center">
            <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
            <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">{m.label}</p>
          </Card>
        ))}
      </div>

      {metrics.overdue > 0 && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-3 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">
            <strong>{metrics.overdue} DSR{metrics.overdue > 1 ? "s" : ""}</strong> have passed their 30-day DPDP SLA deadline. Immediate action required.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "All", href: "/dpdp-privacy/requests" },
          { label: "Submitted", href: "/dpdp-privacy/requests?status=submitted" },
          { label: "In Progress", href: "/dpdp-privacy/requests?status=investigating" },
          { label: "Completed", href: "/dpdp-privacy/requests?status=completed" },
        ].map((f) => (
          <Link
            key={f.label}
            href={f.href}
            className="rounded-full border border-[var(--color-line)] bg-white/[0.03] px-3 py-1 text-xs hover:bg-white/[0.07] transition-colors"
          >
            {f.label}
          </Link>
        ))}
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={FileSearch}
          title="No DSR requests"
          description="Data subject requests will appear here."
          action={
            <Link href="/dpdp-privacy/requests/new">
              <Button>
                <Plus className="h-4 w-4" /> New Request
              </Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-xs text-[var(--color-ink-dim)]">
                  <th className="px-4 py-3 text-left font-medium">Subject</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Submitted</th>
                  <th className="px-4 py-3 text-left font-medium">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req: PrivacyRequest) => {
                  const overdue = isOverdue(req.dueDate, req.status);
                  return (
                    <tr
                      key={req.id}
                      className="border-b border-[var(--color-line)]/50 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium">{req.subjectName}</p>
                        <p className="text-xs text-[var(--color-ink-dim)]">{req.subjectEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <PrivacyRequestTypeBadge type={req.requestType} />
                      </td>
                      <td className="px-4 py-3">
                        <PrivacyRequestStatusBadge status={req.status} />
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">
                        {formatDate(req.submittedAt)}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {req.dueDate ? (
                          <span className={overdue ? "text-red-400 font-semibold" : "text-[var(--color-ink-dim)]"}>
                            {formatDate(req.dueDate)}
                            {overdue && " ⚠ Overdue"}
                          </span>
                        ) : "—"}
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
