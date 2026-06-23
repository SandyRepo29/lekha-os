export const dynamic = "force-dynamic";

import Link from "next/link";
import { ShieldCheck, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { listFrameworks } from "@/lib/services/compliance/framework-service";
import { listControls } from "@/lib/services/compliance/control-service";
import { ControlStatusBadge, ControlPriorityBadge } from "@/components/compliance/compliance-badges";
import { ComplianceStat } from "@/components/compliance/compliance-ui";

export default async function ComplianceControlsPage() {
  const session = await requireUser();
  if (!session.org || session.demo) {
    return <Card><p className="p-6 text-sm text-[var(--color-ink-dim)]">Connect Supabase to manage controls.</p></Card>;
  }

  const frameworks = await listFrameworks(session.org.id);

  // Aggregate all controls across all frameworks
  const allControls = (
    await Promise.all(
      frameworks.map(async (fw) => {
        const controls = await listControls(session.org!.id, fw.id);
        return controls.map((c) => ({ ...c, frameworkName: fw.name }));
      })
    )
  ).flat();

  const implemented    = allControls.filter((c) => c.status === "implemented").length;
  const partial        = allControls.filter((c) => c.status === "partial").length;
  const notImplemented = allControls.filter((c) => c.status === "not_implemented").length;
  const withEvidence   = allControls.filter((c) => c.evidenceCount > 0).length;
  const coveragePct    = allControls.length ? Math.round((withEvidence / allControls.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Controls</h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            {allControls.length} controls across {frameworks.length} frameworks
          </p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <ComplianceStat label="Total Controls"   value={allControls.length} />
        <ComplianceStat label="Implemented"      value={implemented}    color="text-emerald-400" accent="good" />
        <ComplianceStat label="Partial"          value={partial}        color="text-amber-400"  accent="warn" />
        <ComplianceStat label="Not Implemented"  value={notImplemented} color="text-red-400"    accent="danger" />
        <ComplianceStat label="Evidence Coverage" value={`${coveragePct}%`} color={coveragePct >= 70 ? "text-emerald-400" : "text-amber-400"} accent={coveragePct >= 70 ? "good" : "warn"} />
      </div>

      {allControls.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
            <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-[var(--color-ink-faint)]" />
            <p className="text-sm text-[var(--color-ink-dim)]">No controls yet. Add a compliance framework to get started.</p>
            <Link href="/compliance/frameworks/new" className="mt-3 inline-block text-xs text-[var(--color-blue)] hover:underline">
              Add framework &#8594;
            </Link>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Control</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Framework</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Status</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Priority</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Evidence</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">Owner</th>
                </tr>
              </thead>
              <tbody>
                {allControls.map((c) => (
                  <tr key={c.id} className="border-b border-[var(--color-line)] last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium">{c.name}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[var(--color-ink-dim)]">{c.frameworkName}</td>
                    <td className="px-5 py-3.5"><ControlStatusBadge status={c.status} /></td>
                    <td className="px-5 py-3.5"><ControlPriorityBadge priority={c.priority} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <span className={`text-sm font-medium ${c.evidenceCount > 0 ? "text-emerald-400" : "text-[var(--color-ink-faint)]"}`}>
                        {c.evidenceCount > 0 ? c.evidenceCount : "–"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[var(--color-ink-dim)]">{c.owner ?? "—"}</td>
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
