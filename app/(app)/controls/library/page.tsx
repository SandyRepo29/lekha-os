export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Shield, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { findAllControls } from "@/lib/repositories/control-center-repo";
import { ControlHealthBadge } from "@/components/controls/control-health-badge";
import { ControlStatusBadge, ControlTypeBadge, AutomationBadge } from "@/components/controls/control-status-badge";

const PRIORITY_BADGE: Record<string, string> = {
  low: "bg-white/5 border-white/10 text-white/40",
  medium: "bg-sky-500/15 border-sky-500/25 text-sky-400",
  high: "bg-orange-500/15 border-orange-500/25 text-orange-400",
  critical: "bg-red-500/15 border-red-500/25 text-red-400",
};

export default async function ControlLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; q?: string }>;
}) {
  const session = await requireUser();
  const params = await searchParams;

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={Shield} title="Control Library" description="Connect Supabase to view controls." />
      </Card>
    );
  }

  let controls = await findAllControls(session.org.id);

  if (params.status) controls = controls.filter((c) => c.status === params.status);
  if (params.category) controls = controls.filter((c) => (c.category ?? "").toLowerCase() === params.category!.toLowerCase());
  if (params.q) {
    const q = params.q.toLowerCase();
    controls = controls.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.controlRef.toLowerCase().includes(q) ||
      (c.description ?? "").toLowerCase().includes(q)
    );
  }

  const categories = [...new Set(controls.map((c) => c.category).filter(Boolean))].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Control Library</h1>
          <p className="text-sm text-[var(--color-ink-dim)]">{controls.length} control{controls.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/controls/new">
          <Button size="sm"><Plus className="h-4 w-4" /> New Control</Button>
        </Link>
      </div>

      {/* Filters */}
      <form method="GET" className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-dim)]" />
          <input
            name="q"
            defaultValue={params.q}
            placeholder="Search controls…"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-[var(--color-line)] bg-white/[0.03] text-sm outline-none focus:border-[var(--color-blue)]/60"
          />
        </div>
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60"
        >
          <option value="">All Statuses</option>
          <option value="implemented">Implemented</option>
          <option value="partial">Partial</option>
          <option value="not_implemented">Not Implemented</option>
          <option value="not_applicable">N/A</option>
        </select>
        <select
          name="category"
          defaultValue={params.category ?? ""}
          className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-blue)]/60"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c!}>{c}</option>)}
        </select>
        <Button type="submit" variant="outline" size="sm">Filter</Button>
        {(params.status || params.category || params.q) && (
          <Link href="/controls/library">
            <Button variant="ghost" size="sm">Clear</Button>
          </Link>
        )}
      </form>

      {/* Table */}
      {controls.length === 0 ? (
        <Card>
          <EmptyState
            icon={Shield}
            title="No controls found"
            description="Add controls to your library to track Control Health™."
            action={<Link href="/controls/new"><Button size="sm"><Plus className="h-4 w-4" /> New Control</Button></Link>}
          />
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-left">
                  <th className="px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide">ID</th>
                  <th className="px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide">Control</th>
                  <th className="px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide">Category</th>
                  <th className="px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide">Health™</th>
                  <th className="px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide">Evidence</th>
                  <th className="px-4 py-3 text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {controls.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-4 py-3">
                      <Link href={`/controls/${c.id}`} className="font-mono text-xs text-[var(--color-blue)] hover:underline">
                        {c.controlRef}
                      </Link>
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      <Link href={`/controls/${c.id}`} className="hover:text-[var(--color-blue)] transition-colors font-medium">
                        <p className="truncate">{c.name}</p>
                      </Link>
                      {c.ownerName && (
                        <p className="text-xs text-[var(--color-ink-dim)] mt-0.5 truncate">{c.ownerName}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.category ? (
                        <span className="text-xs text-[var(--color-ink-dim)] capitalize">
                          {c.category.replace(/_/g, " ")}
                        </span>
                      ) : <span className="text-xs text-white/20">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <ControlTypeBadge type={c.controlType} />
                    </td>
                    <td className="px-4 py-3">
                      <ControlStatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3">
                      <ControlHealthBadge score={c.healthScore} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${c.evidenceCount > 0 ? "text-green-400" : "text-white/30"}`}>
                        {c.evidenceCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${PRIORITY_BADGE[c.priority] ?? PRIORITY_BADGE.medium}`}>
                        {c.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
