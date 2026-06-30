export const dynamic = "force-dynamic";

import Link from "next/link";
import { Shield, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import * as capaRepo from "@/lib/repositories/corrective-action-repo";
import { CapaStatusBadge } from "@/components/audit/audit-status-badge";

function formatDate(d: string | Date | null | undefined) {
  if (!d) return "&#8212;";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(dueDate: string | null | undefined) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export default async function IssueHubCapasPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card className="p-8 text-center">
        <Shield className="h-10 w-10 mx-auto mb-3 text-[var(--color-ink-dim)]" />
        <p className="font-semibold">CAPA Management&#8482;</p>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">Connect Supabase to manage corrective actions.</p>
      </Card>
    );
  }

  const capas = await capaRepo.findByOrg(session.org.id).catch(() => []);

  const CLOSED = new Set(["completed"]);
  const open = capas.filter((c) => !CLOSED.has(c.status));
  const completed = capas.filter((c) => CLOSED.has(c.status));
  const overdue = open.filter((c) => isOverdue(c.dueDate));
  const inProgress = open.filter((c) => c.status === "in_progress");

  const avgClosureDays = completed.length
    ? Math.round(
        completed.reduce((sum, c) => {
          if (!c.completedAt || !c.createdAt) return sum;
          return sum + (new Date(c.completedAt).getTime() - new Date(c.createdAt).getTime()) / 86400000;
        }, 0) / completed.filter((c) => c.completedAt && c.createdAt).length || 0
      )
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">CAPA Management&#8482;</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          Corrective and Preventive Actions across all audit findings
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total CAPAs",   value: capas.length,    color: "text-[var(--color-ink)]" },
          { label: "Open",          value: open.length,     color: open.length > 0 ? "text-amber-400" : "text-emerald-400" },
          { label: "Overdue",       value: overdue.length,  color: overdue.length > 0 ? "text-red-400" : "text-emerald-400" },
          { label: "Avg Closure",   value: `${avgClosureDays}d`, color: "text-[var(--color-ink)]" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-[var(--color-ink-dim)] mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Status breakdown */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            CAPA Status
          </h2>
          {[
            { label: "Open",       count: open.filter((c) => c.status === "open").length,         color: "bg-slate-400" },
            { label: "In Progress",count: inProgress.length,                                        color: "bg-blue-400" },
            { label: "Overdue",    count: overdue.length,                                          color: "bg-red-500" },
            { label: "Completed",  count: completed.length,                                        color: "bg-emerald-500" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3 py-1">
              <div className={`h-2 w-2 rounded-full ${s.color} shrink-0`} />
              <span className="flex-1 text-xs text-[var(--color-ink-dim)]">{s.label}</span>
              <span className="text-sm font-bold">{s.count}</span>
            </div>
          ))}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            CAPA Health&#8482;
          </h2>
          <div className="space-y-3">
            {[
              {
                label: "Open Rate",
                value: capas.length > 0 ? `${Math.round((open.length / capas.length) * 100)}%` : "0%",
                color: open.length / (capas.length || 1) > 0.5 ? "text-amber-400" : "text-emerald-400",
              },
              {
                label: "Overdue Rate",
                value: open.length > 0 ? `${Math.round((overdue.length / open.length) * 100)}%` : "0%",
                color: overdue.length > 0 ? "text-red-400" : "text-emerald-400",
              },
              {
                label: "Completion Rate",
                value: capas.length > 0 ? `${Math.round((completed.length / capas.length) * 100)}%` : "0%",
                color: "text-emerald-400",
              },
              {
                label: "Avg Closure Days",
                value: `${avgClosureDays}d`,
                color: avgClosureDays > 30 ? "text-amber-400" : "text-emerald-400",
              },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-ink-dim)]">{s.label}</span>
                <span className={`text-sm font-bold ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* CAPA list */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-[var(--color-line)] flex items-center justify-between">
          <h2 className="text-sm font-semibold">All CAPAs</h2>
          <Link href="/audits/capas" className="text-xs text-[var(--color-blue)] hover:underline">
            Open in Audit Management &#8594;
          </Link>
        </div>
        {capas.length === 0 ? (
          <div className="p-6 flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            No CAPAs yet. CAPAs are created from audit findings.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)]">
                  <th className="px-5 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {capas.map((capa) => (
                  <tr key={capa.id} className={`hover:bg-white ${isOverdue(capa.dueDate) && capa.status !== "completed" ? "bg-red-500/5" : ""}`}>
                    <td className="px-5 py-3">
                      <p className="font-medium">{capa.title}</p>
                      {capa.description && (
                        <p className="text-xs text-[var(--color-ink-dim)] mt-0.5 line-clamp-1">{capa.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3"><CapaStatusBadge status={capa.status} /></td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${isOverdue(capa.dueDate) && capa.status !== "completed" ? "text-red-400 font-semibold" : "text-[var(--color-ink-dim)]"}`}>
                        {formatDate(capa.dueDate)}
                        {isOverdue(capa.dueDate) && capa.status !== "completed" && " (Overdue)"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {capa.completedAt ? (
                        <span className="text-xs text-emerald-400">{formatDate(capa.completedAt)}</span>
                      ) : (
                        <span className="text-xs text-[var(--color-ink-faint)]">&#8212;</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
