export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  FileText, Plus, CheckCircle2, Users, Shield, AlertTriangle,
  TrendingUp, Network, Brain, GitBranch
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/lib/services/policy-governance/policy-governance-service";
import { findPoliciesByOrg } from "@/lib/repositories/policy-governance-repo";
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

  const [metrics, allPolicies] = await Promise.all([
    getDashboardMetrics(session.org.id),
    findPoliciesByOrg(session.org.id),
  ]);

  // P1 — Policy Coverage™: policies with at least 1 control link
  const policiesWithControls = allPolicies.filter((p) => p.controlCount > 0).length;
  const coveragePct = metrics.total > 0 ? Math.round((policiesWithControls / metrics.total) * 100) : 0;

  // P1 — Policy Review Compliance™: non-overdue active policies
  const activePolicies = metrics.total - metrics.retired - metrics.archived;
  const reviewCompliance = activePolicies > 0
    ? Math.round(((activePolicies - metrics.overdue) / activePolicies) * 100)
    : 100;

  // P7 — Intelligence signals
  const missingOwner = allPolicies.filter((p) => !p.ownerId).length;
  const noControlMapping = allPolicies.filter((p) => p.controlCount === 0 && !["retired", "archived"].includes(p.status)).length;
  const noFrameworkMapping = allPolicies.filter((p) => p.frameworkCount === 0 && !["retired", "archived"].includes(p.status)).length;
  const expiredCount = metrics.expired;
  const lowHealthCount = allPolicies.filter((p) => (p.healthScore ?? 0) > 0 && (p.healthScore ?? 0) < 60).length;

  // P8 — Trust Impact (policies contribute to Control Health which feeds 20% of Trust Score)
  const policyTrustWeight = 10; // policies contribute ~10% via control coverage proxy
  const currentTrustContrib = Math.round((metrics.attestationRate / 100) * policyTrustWeight);
  const projectedTrustContrib = policyTrustWeight;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Policy Governance™</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            Governance policy management — lifecycle, coverage, attestations, and trust impact
          </p>
        </div>
        <Link href="/policy-governance/library?new=1">
          <Button><Plus className="h-4 w-4" /> New Policy</Button>
        </Link>
      </div>

      {/* P1 — KPI row (replaces old avgHealth row) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <PolicyStat label="Total Policies" value={metrics.total} accent="neutral" href="/policy-governance/library" />
        <PolicyStat label="Policy Coverage™" value={`${coveragePct}%`} accent={coveragePct < 50 ? "danger" : coveragePct < 80 ? "warn" : "good"} sub={`${policiesWithControls} of ${metrics.total} mapped`} />
        <PolicyStat label="Review Compliance™" value={`${reviewCompliance}%`} accent={reviewCompliance < 70 ? "danger" : reviewCompliance < 90 ? "warn" : "good"} sub={`${metrics.overdue} overdue`} />
        <PolicyStat label="Attestation Compliance™" value={`${metrics.attestationRate}%`} accent={metrics.attestationRate < 50 ? "warn" : "good"} sub="acknowledged" />
      </div>

      {/* Row 2: status counters */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <PolicyStat label="Published" value={metrics.published} accent="good" sub="active policies" />
        <PolicyStat label="Under Review" value={metrics.review} accent="neutral" />
        <PolicyStat label="Due for Review" value={metrics.dueSoon} accent="warn" sub="within 30 days" />
        <PolicyStat label="Overdue Reviews" value={metrics.overdue} accent={metrics.overdue > 0 ? "danger" : "good"} />
      </div>

      {/* Row 3: 3-column panel */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* P4 — Policy Lifecycle™ */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-[var(--color-blue)]" />
            Policy Lifecycle™
          </h2>
          <div className="space-y-2.5">
            {[
              { label: "Draft", count: metrics.draft, color: "bg-slate-500" },
              { label: "Under Review", count: metrics.review, color: "bg-amber-500" },
              { label: "Approved", count: metrics.approved, color: "bg-blue-500" },
              { label: "Published", count: metrics.published, color: "bg-emerald-500" },
              { label: "Expired", count: metrics.expired, color: "bg-red-500" },
              { label: "Retired", count: metrics.retired, color: "bg-purple-500" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${s.color} shrink-0`} />
                <span className="flex-1 text-sm text-[var(--color-ink-dim)]">{s.label}</span>
                <span className="text-sm font-semibold">{s.count}</span>
                <div className="w-16 h-1.5 rounded-full bg-[#F8F9FB] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${s.color}`}
                    style={{ width: metrics.total > 0 ? `${Math.round((s.count / metrics.total) * 100)}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
            {metrics.total === 0 && (
              <p className="text-sm text-[var(--color-ink-dim)]">No policies yet.</p>
            )}
          </div>
        </Card>

        {/* P5 — Policy Coverage™ widget */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Network className="h-4 w-4 text-indigo-400" />
            Policy Coverage™
          </h2>
          <div className="space-y-3">
            {[
              { label: "Mapped to Controls", count: policiesWithControls, total: metrics.total, color: "bg-indigo-500" },
              { label: "Mapped to Frameworks", count: allPolicies.filter((p) => p.frameworkCount > 0).length, total: metrics.total, color: "bg-blue-500" },
              { label: "With Owners", count: allPolicies.filter((p) => !!p.ownerId).length, total: metrics.total, color: "bg-emerald-500" },
              { label: "Attested", count: Math.round((metrics.attestationRate / 100) * metrics.total), total: metrics.total, color: "bg-purple-500" },
            ].map((r) => {
              const pct = r.total > 0 ? Math.round((r.count / r.total) * 100) : 0;
              return (
                <div key={r.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--color-ink-dim)]">{r.label}</span>
                    <span className="text-xs font-semibold">{r.count} <span className="text-[var(--color-ink-faint)]">/ {r.total}</span></span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#F8F9FB] overflow-hidden">
                    <div className={`h-full rounded-full ${r.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--color-line)]">
            <Link href="/policy-governance/mappings" className="text-xs text-[var(--color-blue)] hover:underline">
              View all mappings →
            </Link>
          </div>
        </Card>

        {/* P8 — Trust Impact™ */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Trust Impact™
          </h2>
          <p className="text-xs text-[var(--color-ink-dim)] mb-4 leading-relaxed">
            Policy coverage and attestation compliance contribute to your organization&#8217;s Org Trust Score™ via the Control Health component.
          </p>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--color-ink-dim)]">Current Contribution</span>
                <span className="text-xs font-bold text-emerald-400">{currentTrustContrib} / {policyTrustWeight} pts</span>
              </div>
              <div className="h-2 rounded-full bg-[#F8F9FB] overflow-hidden">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.round((currentTrustContrib / policyTrustWeight) * 100)}%` }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-[var(--color-ink-dim)]">Max Possible</span>
                <span className="text-xs font-bold text-[var(--color-blue)]">{projectedTrustContrib} pts</span>
              </div>
              <div className="h-2 rounded-full bg-[#F8F9FB] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--color-blue)]" style={{ width: "100%" }} />
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[var(--color-line)]">
            <p className="text-xs text-[var(--color-ink-faint)]">
              Improve attestation compliance to increase trust contribution.
            </p>
          </div>
        </Card>
      </div>

      {/* Row 4: Intelligence + Weak Policies */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* P7 — Policy Intelligence™ */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-400" />
            Policy Intelligence™
          </h2>
          <div className="space-y-3">
            {[
              {
                label: "Missing Owners",
                count: missingOwner,
                desc: "Policies with no designated owner",
                color: missingOwner > 0 ? "text-red-400" : "text-emerald-400",
                urgent: missingOwner > 0,
              },
              {
                label: "Overdue Reviews",
                count: metrics.overdue,
                desc: "Past scheduled review date",
                color: metrics.overdue > 0 ? "text-amber-400" : "text-emerald-400",
                urgent: metrics.overdue > 0,
              },
              {
                label: "No Control Mapping",
                count: noControlMapping,
                desc: "Active policies not linked to any control",
                color: noControlMapping > 0 ? "text-amber-400" : "text-emerald-400",
                urgent: noControlMapping > 0,
              },
              {
                label: "No Framework Mapping",
                count: noFrameworkMapping,
                desc: "Active policies not linked to any framework",
                color: noFrameworkMapping > 0 ? "text-amber-400" : "text-emerald-400",
                urgent: noFrameworkMapping > 0,
              },
              {
                label: "Expired Policies",
                count: expiredCount,
                desc: "Policies past their expiry date",
                color: expiredCount > 0 ? "text-red-400" : "text-emerald-400",
                urgent: expiredCount > 0,
              },
              {
                label: "Low Health (&lt;60)",
                count: lowHealthCount,
                desc: "Policies with critical health scores",
                color: lowHealthCount > 0 ? "text-red-400" : "text-emerald-400",
                urgent: lowHealthCount > 0,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                {item.urgent ? (
                  <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-[var(--color-ink-dim)]">{item.desc}</p>
                </div>
                <span className={`text-sm font-bold shrink-0 ${item.color}`}>{item.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Weak policies */}
        <Card className="p-5">
          <h2 className="font-semibold mb-4 text-sm">Policies Needing Attention</h2>
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
                  className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-white transition-colors"
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
          <div className="mt-4 pt-4 border-t border-[var(--color-line)]">
            <Link href="/policy-governance/library" className="text-xs text-[var(--color-blue)] hover:underline">
              View all policies →
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4 text-sm">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/policy-governance/library?new=1">
            <Button variant="outline" size="sm"><Plus className="h-4 w-4" /> New Policy</Button>
          </Link>
          <Link href="/policy-governance/mappings">
            <Button variant="outline" size="sm"><Network className="h-4 w-4" /> View Mappings</Button>
          </Link>
          <Link href="/policy-governance/reviews">
            <Button variant="outline" size="sm"><CheckCircle2 className="h-4 w-4" /> View Reviews</Button>
          </Link>
          <Link href="/policy-governance/attestations">
            <Button variant="outline" size="sm"><Users className="h-4 w-4" /> Attestations</Button>
          </Link>
          <Link href="/policy-governance/ai">
            <Button variant="outline" size="sm"><Shield className="h-4 w-4" /> Policy Copilot™</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
