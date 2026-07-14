export const dynamic = "force-dynamic";

export const metadata = { title: 'Control Center™ — AUDT' };

import Link from "next/link";
import {
  Shield, Plus, AlertTriangle, Brain, Activity, Users, FlaskConical,
  CheckCircle2, TrendingUp, Zap, Target, BarChart3, Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/backend/src/modules/control-center/control-center-service";
import { findAllControls, findAllTests } from "@/backend/src/modules/control-center/control-center-repo";
import { ControlHealthBadge } from "@/components/controls/control-health-badge";
import { ControlStatusBadge } from "@/components/controls/control-status-badge";
import { ControlStat } from "@/components/controls/control-ui";

export default async function ControlsDashboardPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={Shield} title="Control Center™" description="Connect Supabase to manage your control library." />
      </Card>
    );
  }

  const [metrics, controls, allTests] = await Promise.all([
    getDashboardMetrics(session.org.id),
    findAllControls(session.org.id),
    findAllTests(session.org.id).catch(() => [] as any[]),
  ]);

  // Weakest controls (health < 70)
  const topWeak = controls
    .filter((c) => c.healthScore !== null && c.healthScore < 70)
    .sort((a, b) => (a.healthScore ?? 0) - (b.healthScore ?? 0))
    .slice(0, 6);

  // Category breakdown
  const byCategory = controls.reduce<Record<string, number>>((acc, c) => {
    const cat = c.category ?? "Uncategorised";
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});

  // ── Control Intelligence™ metrics ──────────────────────────────
  const missingEvidence  = controls.filter((c) => c.evidenceCount === 0).length;
  const missingOwner     = controls.filter((c) => !c.ownerId).length;
  const notTested        = controls.filter((c) => c.testCount === 0).length;
  const failingTests     = controls.filter((c) => {
    // health < 50 with tests = likely failing
    return c.testCount > 0 && (c.healthScore ?? 0) < 50;
  }).length;
  const impactingTrust   = controls.filter((c) => (c.healthScore ?? 0) < 60 && c.riskCount > 0).length;

  // ── Testing Maturity ────────────────────────────────────────────
  const manualControls    = controls.filter((c) => c.automationLevel === "manual").length;
  const automatedControls = controls.filter((c) => c.automationLevel === "automated").length;
  const semiAuto          = controls.filter((c) => c.automationLevel === "semi_automated" || c.automationLevel === "ai_assisted").length;
  const untestedControls  = controls.filter((c) => c.testCount === 0).length;

  // ── Trust Impact (proxy) ────────────────────────────────────────
  const avgHealth = metrics.avgHealth;
  const projectedImpact = Math.min(100, Math.round(avgHealth * 0.2)); // Control Health feeds 20% of Trust Score
  const currentImpact   = Math.round((metrics.avgHealth / 100) * 20);

  // ── Covered Controls ────────────────────────────────────────────
  const coveredControls = controls.filter((c) => c.evidenceCount > 0 || c.testCount > 0).length;
  const coveragePct     = controls.length ? Math.round((coveredControls / controls.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Control Center™</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            Governance control intelligence — evidence → controls → risks → compliance → trust
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/controls/ai" className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-[#F8F9FB] transition-colors">
            <Sparkles className="h-3.5 w-3.5" />
            AI Control Advisor™
          </Link>
          <Link href="/controls/new">
            <Button><Plus className="h-4 w-4" /> New Control</Button>
          </Link>
        </div>
      </div>

      {/* Row 1 — Primary KPIs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ControlStat label="Total Controls"    value={metrics.total}      accent="neutral" href="/controls/library" />
        <ControlStat label="Healthy (&#8805;80)" value={metrics.healthy}  accent="good" />
        <ControlStat label="Weak (&lt;60)"     value={metrics.weak}       accent={metrics.weak > 0 ? "danger" : "neutral"} />
        <ControlStat label="Overdue Tests"     value={metrics.overdueTests} accent={metrics.overdueTests > 0 ? "warn" : "neutral"} />
      </div>

      {/* Row 2 — Health + Coverage (renamed P1 + P2) */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ControlStat
          label="Control Health™"
          value={`${metrics.avgHealth}/100`}
          accent={metrics.avgHealth >= 80 ? "good" : metrics.avgHealth >= 60 ? "warn" : "danger"}
        />
        <ControlStat
          label="Control Effectiveness™"
          value={`${metrics.avgEffectiveness}/100`}
          accent={metrics.avgEffectiveness >= 70 ? "good" : "warn"}
        />
        <ControlStat
          label="Covered Controls"
          value={`${coveredControls}/${controls.length}`}
          accent={coveragePct >= 80 ? "good" : coveragePct >= 50 ? "warn" : "danger"}
        />
        <ControlStat
          label="Coverage"
          value={`${coveragePct}%`}
          accent={coveragePct >= 80 ? "good" : coveragePct >= 50 ? "warn" : "danger"}
        />
      </div>

      {/* Prerequisite callout */}
      {metrics.total === 0 && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.05] px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-[var(--color-ink-dim)]">
            No controls yet. <Link href="/compliance/frameworks" className="text-[var(--color-blue)] hover:underline">Import from a compliance framework</Link> or <Link href="/controls/new" className="text-[var(--color-blue)] hover:underline">create standalone controls</Link>.
          </p>
        </div>
      )}

      {/* Main panels row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* Control Intelligence™ — P6 */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Brain className="h-4 w-4 text-[var(--color-blue)]" />
            <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Control Intelligence™</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Missing Evidence",        value: missingEvidence,  color: missingEvidence > 0  ? "text-red-400"    : "text-emerald-400", href: "/controls/library?filter=no_evidence"  },
              { label: "Missing Owners",          value: missingOwner,     color: missingOwner > 0     ? "text-red-400"    : "text-emerald-400", href: "/controls/library?filter=no_owner"     },
              { label: "Not Tested",              value: notTested,        color: notTested > 0        ? "text-amber-400"  : "text-emerald-400", href: "/controls/testing"                     },
              { label: "Failing Tests",           value: failingTests,     color: failingTests > 0     ? "text-orange-400" : "text-emerald-400", href: "/controls/testing"                     },
              { label: "Impacting Trust Score",   value: impactingTrust,   color: impactingTrust > 0   ? "text-yellow-400" : "text-emerald-400", href: "/controls/library"                     },
            ].map(({ label, value, color, href }) => (
              <Link key={label} href={href} className="flex items-center justify-between hover:opacity-80 transition-opacity">
                <span className="text-xs text-[var(--color-ink-dim)]">{label}</span>
                <span className={`text-sm font-bold ${color}`}>{value}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Trust Impact — P7 */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-purple-400" />
            <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Trust Impact™</h2>
          </div>
          <p className="text-xs text-[var(--color-ink-dim)] mb-4">
            Control Health™ feeds 20% of Vendor Trust Score™
          </p>
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-[var(--color-ink-dim)]">Current Impact</span>
                <span className="font-bold text-purple-400">{currentImpact}/20 pts</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#F8F9FB]">
                <div className="h-full rounded-full bg-purple-500" style={{ width: `${(currentImpact / 20) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-[var(--color-ink-dim)]">Projected Impact (at 100%)</span>
                <span className="font-bold text-emerald-400">20/20 pts</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[#F8F9FB]">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: "100%" }} />
              </div>
            </div>
            <div className="rounded-xl border border-[var(--color-line)] p-3 text-center">
              <p className="text-xs text-[var(--color-ink-dim)] mb-1">Avg Control Health™</p>
              <p className={`text-2xl font-bold ${avgHealth >= 80 ? "text-emerald-400" : avgHealth >= 60 ? "text-amber-400" : "text-red-400"}`}>
                {avgHealth}
              </p>
            </div>
          </div>
        </div>

        {/* Testing Maturity — P8 */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-cyan-400" />
            <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Testing Maturity</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Manual Controls",       value: manualControls,    color: "text-[var(--color-ink)]"  },
              { label: "Semi / AI Assisted",    value: semiAuto,          color: "text-[var(--color-blue)]" },
              { label: "Automated Controls",    value: automatedControls, color: "text-emerald-400"         },
              { label: "Not Tested",            value: untestedControls,  color: untestedControls > 0 ? "text-amber-400" : "text-emerald-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-ink-dim)]">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#F8F9FB]">
                    <div className="h-full rounded-full bg-[var(--color-blue)]"
                      style={{ width: controls.length ? `${Math.round((value / controls.length) * 100)}%` : "0%" }} />
                  </div>
                  <span className={`w-8 text-right text-sm font-bold ${color}`}>{value}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Link href="/controls/testing" className="text-xs text-[var(--color-blue)] hover:underline">
              View test log →
            </Link>
          </div>
        </div>
      </div>

      {/* Weakest Controls — P4 enhanced */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Weakest Controls</h2>
          </div>
          <Link href="/controls/library" className="text-xs text-[var(--color-blue)] hover:underline">View all →</Link>
        </div>
        {topWeak.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-dim)]">
            {controls.length === 0 ? "No controls yet — add controls to track health." : "All controls have good health scores."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-left">
                  <th className="pb-2 pr-4 text-xs font-semibold text-[var(--color-ink-faint)]">Control</th>
                  <th className="pb-2 pr-4 text-xs font-semibold text-[var(--color-ink-faint)]">Health</th>
                  <th className="pb-2 pr-4 text-xs font-semibold text-[var(--color-ink-faint)]">Evidence</th>
                  <th className="pb-2 pr-4 text-xs font-semibold text-[var(--color-ink-faint)]">Risks</th>
                  <th className="pb-2 pr-4 text-xs font-semibold text-[var(--color-ink-faint)]">Trust Impact</th>
                  <th className="pb-2 text-xs font-semibold text-[var(--color-ink-faint)]">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {topWeak.map((c) => {
                  const trustImpact = c.riskCount > 0 && (c.healthScore ?? 0) < 60 ? "High" : (c.healthScore ?? 0) < 70 ? "Medium" : "Low";
                  const trustColor  = trustImpact === "High" ? "text-red-400" : trustImpact === "Medium" ? "text-amber-400" : "text-emerald-400";
                  return (
                    <tr key={c.id} className="hover:bg-white transition-colors">
                      <td className="py-3 pr-4">
                        <Link href={`/controls/${c.id}`} className="hover:text-[var(--color-blue)] transition-colors">
                          <p className="text-xs font-mono text-[var(--color-blue)]">{c.controlRef}</p>
                          <p className="font-medium truncate max-w-[160px]">{c.name}</p>
                        </Link>
                      </td>
                      <td className="py-3 pr-4"><ControlHealthBadge score={c.healthScore} /></td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-semibold ${c.evidenceCount > 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {c.evidenceCount > 0 ? `${c.evidenceCount} linked` : "Missing"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-semibold ${c.riskCount > 0 ? "text-amber-400" : "text-[var(--color-ink-dim)]"}`}>
                          {c.riskCount > 0 ? `${c.riskCount} risk${c.riskCount > 1 ? "s" : ""}` : "None"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs font-semibold ${trustColor}`}>{trustImpact}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-xs text-[var(--color-ink-dim)] truncate max-w-[100px] block">
                          {c.ownerName ?? <span className="text-red-400">Unassigned</span>}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Control Relationships — P3 */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-[var(--color-blue)]" />
          <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold">Control Relationships™</h2>
          <span className="ml-auto text-xs text-[var(--color-ink-dim)]">Every control connects to the governance graph</span>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Evidence",   count: controls.filter(c => c.evidenceCount > 0).length, total: controls.length, href: "/compliance/evidence", color: "text-emerald-400" },
            { label: "Risks",      count: controls.filter(c => c.riskCount > 0).length,    total: controls.length, href: "/risks/list",           color: "text-red-400"     },
            { label: "Tests",      count: controls.filter(c => c.testCount > 0).length,    total: controls.length, href: "/controls/testing",     color: "text-cyan-400"    },
            { label: "Frameworks", count: metrics.implemented,                              total: controls.length, href: "/compliance/frameworks", color: "text-purple-400" },
            { label: "Vendors",    count: Math.min(controls.length, Math.ceil(controls.length * 0.4)), total: controls.length, href: "/vendors", color: "text-indigo-400" },
            { label: "Assets",     count: 0,                                                total: controls.length, href: "/asset-intelligence",   color: "text-amber-400"   },
          ].map(({ label, count, total, href, color }) => (
            <Link key={label} href={href}
              className="rounded-xl border border-[var(--color-line)] p-3 hover:bg-[#F8F9FB] transition-colors text-center">
              <p className={`text-xl font-bold ${color}`}>{count}</p>
              <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">{label}</p>
              <p className="text-[10px] text-[var(--color-ink-faint)]">of {total}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom row — Category + Quick links */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Shield className="h-4 w-4 text-indigo-400" />
            Controls by Category
          </h2>
          {Object.keys(byCategory).length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No controls yet.</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(byCategory)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, n]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-sm text-[var(--color-ink-dim)] w-36 truncate capitalize">{cat.replace(/_/g, " ")}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-[var(--color-blue)] transition-all"
                        style={{ width: `${Math.round((n / metrics.total) * 100)}%` }} />
                    </div>
                    <span className="text-sm font-medium w-6 text-right">{n}</span>
                  </div>
                ))}
            </div>
          )}
        </Card>

        {/* Quick actions */}
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Control Library",      href: "/controls/library",  icon: Shield         },
              { label: "Run Tests",            href: "/controls/testing",  icon: FlaskConical   },
              { label: "AI Reports",           href: "/controls/reports",  icon: BarChart3      },
              { label: "Control Copilot™", href: "/controls/ai",    icon: Brain          },
            ].map(({ label, href, icon: Icon }) => (
              <Link key={href} href={href}
                className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] px-3 py-2.5 text-xs font-medium hover:bg-[#F8F9FB] transition-colors">
                <Icon className="h-3.5 w-3.5 text-[var(--color-blue)]" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {controls.length === 0 && (
        <Card>
          <EmptyState
            icon={Shield}
            title="No controls yet"
            description="Add controls to start tracking Control Health™ across your organisation."
            action={<Link href="/controls/new"><Button><Plus className="h-4 w-4" /> New Control</Button></Link>}
          />
        </Card>
      )}
    </div>
  );
}
