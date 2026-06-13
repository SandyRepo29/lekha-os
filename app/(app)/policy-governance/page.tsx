export const dynamic = "force-dynamic";

import Link from "next/link";
import { FileText, Plus, CheckCircle2, Users, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/lib/services/policy-governance/policy-governance-service";
import { PolicyHealthBadge } from "@/components/policy-governance/policy-health-badge";
import { PolicyStatusBadge } from "@/components/policy-governance/policy-status-badge";
import { PolicyStat } from "@/components/policy-governance/policy-ui";

export default async function PolicyGovernanceDashboardPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={FileText} title="Policy Governance™" description="Connect Supabase to manage your policy library." />
      </Card>
    );
  }

  const metrics = await getDashboardMetrics(session.org.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Policy Governance™</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            Full policy lifecycle — draft, publish, attest, review
          </p>
        </div>
        <Link href="/policy-governance/library?new=1">
          <Button><Plus className="h-4 w-4" /> New Policy</Button>
        </Link>
      </div>

      {/* Metrics row 1 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <PolicyStat label="Total Policies" value={metrics.total} accent="neutral" href="/policy-governance/library" />
        <PolicyStat label="Published" value={metrics.published} accent="good" sub="active policies" />
        <PolicyStat label="Due for Review" value={metrics.dueSoon} accent="warn" sub="within 30 days" />
        <PolicyStat label="Overdue Reviews" value={metrics.overdue} accent={metrics.overdue > 0 ? "danger" : "good"} />
      </div>

      {/* Metrics row 2 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <PolicyStat label="Avg Health Score" value={`${metrics.avgHealth}/100`} accent={metrics.avgHealth < 60 ? "danger" : metrics.avgHealth < 80 ? "warn" : "good"} />
        <PolicyStat label="Attestation Rate" value={`${metrics.attestationRate}%`} accent={metrics.attestationRate < 50 ? "warn" : "good"} sub="acknowledged" />
        <PolicyStat label="Under Review" value={metrics.review} accent="neutral" />
        <PolicyStat label="Draft" value={metrics.draft} accent="neutral" />
      </div>

      {/* Status breakdown */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Status distribution */}
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Policy Status Distribution</h2>
          <div className="space-y-2">
            {[
              { label: "Published", count: metrics.published, color: "bg-emerald-500" },
              { label: "Approved", count: metrics.approved, color: "bg-blue-500" },
              { label: "Under Review", count: metrics.review, color: "bg-amber-500" },
              { label: "Draft", count: metrics.draft, color: "bg-slate-500" },
              { label: "Expired", count: metrics.expired, color: "bg-red-500" },
              { label: "Retired", count: metrics.retired, color: "bg-purple-500" },
              { label: "Archived", count: metrics.archived, color: "bg-gray-500" },
            ].filter((s) => s.count > 0).map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${s.color}`} />
                <span className="flex-1 text-sm text-[var(--color-ink-dim)]">{s.label}</span>
                <span className="text-sm font-semibold">{s.count}</span>
              </div>
            ))}
            {metrics.total === 0 && (
              <p className="text-sm text-[var(--color-ink-dim)]">No policies yet.</p>
            )}
          </div>
        </Card>

        {/* Weak policies */}
        <Card className="p-5">
          <h2 className="font-semibold mb-4">Policies Needing Attention</h2>
          {metrics.weakPolicies.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              All policies are healthy.
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.weakPolicies.map((p) => (
                <Link
                  key={p.id}
                  href={`/policy-governance/${p.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <PolicyStatusBadge status={p.status} className="mt-0.5" />
                  </div>
                  <PolicyHealthBadge score={p.healthScore ?? 0} />
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/policy-governance/library?new=1">
            <Button variant="outline" size="sm"><Plus className="h-4 w-4" /> New Policy</Button>
          </Link>
          <Link href="/policy-governance/reviews">
            <Button variant="outline" size="sm"><CheckCircle2 className="h-4 w-4" /> View Reviews</Button>
          </Link>
          <Link href="/policy-governance/attestations">
            <Button variant="outline" size="sm"><Users className="h-4 w-4" /> Attestations</Button>
          </Link>
          <Link href="/policy-governance/ai">
            <Button variant="outline" size="sm"><Shield className="h-4 w-4" /> AI Advisor</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
