export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/continuous-compliance/continuous-compliance-service";
import {
  Shield, CheckCircle, XCircle, AlertTriangle, Activity, Users, BookOpen,
  GraduationCap, Cpu, Zap, BarChart3, Bot, RefreshCw, ArrowRight, Clock,
} from "lucide-react";
import { CcStat, CheckResultBadge, SeverityBadge, HealthLevelBadge, HealthBar, CategoryIcon } from "@/components/continuous-compliance/cc-ui";

const NAV = [
  { href: "/continuous-compliance/checks",        icon: Shield,        label: "Compliance Checks™",       description: "21 prebuilt + custom automated checks" },
  { href: "/continuous-compliance/health",         icon: BarChart3,     label: "Compliance Health™",       description: "Real-time org-wide health score" },
  { href: "/continuous-compliance/readiness",      icon: CheckCircle,   label: "Continuous Readiness™",    description: "Live framework readiness across SOC 2, ISO 27001, DPDP" },
  { href: "/continuous-compliance/access-reviews", icon: Users,         label: "Access Review Manager™",   description: "Quarterly & privileged access certifications" },
  { href: "/continuous-compliance/attestations",   icon: BookOpen,      label: "Compliance Attestations™", description: "Policy attestations & sign-offs" },
  { href: "/continuous-compliance/training",       icon: GraduationCap, label: "Training Compliance™",     description: "Security awareness & privacy training" },
  { href: "/continuous-compliance/workforce",      icon: Users,         label: "Workforce Compliance™",    description: "Onboarding, offboarding & lifecycle events" },
  { href: "/continuous-compliance/signals",        icon: Activity,      label: "Compliance Signals™",      description: "Auto-generated signals from all modules" },
  { href: "/continuous-compliance/automation",     icon: Zap,           label: "Automation Rules™",        description: "If-this-then-that compliance automation" },
  { href: "/continuous-compliance/ai",             icon: Bot,           label: "AI Compliance Officer™",   description: "Executive summary, gap analysis & NL chat" },
];

export default async function ContinuousCompliancePage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const data = await getDashboardData(orgId).catch(() => null);
  const m = data?.metrics;
  const checks = data?.checks ?? [];
  const signals = data?.signals ?? [];
  const runs = data?.recentRuns ?? [];
  const health = data?.healthScore;
  const frameworks = data?.frameworkReadiness ?? [];

  const byCategory = checks.reduce<Record<string, number>>((acc, c) => {
    acc[c.category] = (acc[c.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Continuous Compliance™
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Automated evidence collection, control validation, and continuous framework readiness.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/continuous-compliance/checks"
            className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-4 py-2 text-sm font-medium hover:bg-white/[0.07] transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Run Checks
          </Link>
          <Link
            href="/continuous-compliance/ai"
            className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
          >
            <Bot className="h-4 w-4" /> AI Officer™
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <CcStat label="Total Checks"      value={m?.totalChecks ?? 0}        accent="neutral" href="/continuous-compliance/checks" />
        <CcStat label="Passing"           value={m?.passingChecks ?? 0}       accent="good"    href="/continuous-compliance/checks" />
        <CcStat label="Failing"           value={m?.failingChecks ?? 0}       accent={(m?.failingChecks ?? 0) > 0 ? "danger" : "neutral"} href="/continuous-compliance/checks" />
        <CcStat label="Pass Rate"         value={`${m?.checkPassRate ?? 0}%`} accent={(m?.checkPassRate ?? 0) >= 80 ? "good" : "warn"} />
        <CcStat label="Open Signals"      value={m?.openSignals ?? 0}         accent={(m?.openSignals ?? 0) > 0 ? "warn" : "good"} href="/continuous-compliance/signals" />
        <CcStat label="Active Reviews"    value={m?.activeReviews ?? 0}       accent="neutral" href="/continuous-compliance/access-reviews" />
        <CcStat label="Attestations"      value={m?.activeAttestations ?? 0}  accent="neutral" href="/continuous-compliance/attestations" />
        <CcStat label="Training Active"   value={m?.activeTraining ?? 0}      accent="neutral" href="/continuous-compliance/training" />
      </div>

      {/* Strategic callout */}
      <div className="rounded-2xl border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.05] p-5">
        <div className="flex items-start gap-4">
          <Cpu className="mt-0.5 h-8 w-8 shrink-0 text-[var(--color-blue)]" />
          <div>
            <div className="font-semibold text-sm text-[var(--color-blue)]">Continuous Compliance — Governance Built on Proof</div>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)] leading-relaxed">
              AUDT continuously monitors your infrastructure, validates controls, and generates evidence automatically.
              No more periodic point-in-time snapshots — compliance is now <strong>always-on</strong>.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["AWS","Azure","GitHub","Okta","M365","Google Workspace","GCP"].map(t => (
                <span key={t} className="rounded-full border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.08] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-blue)]">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Compliance Health */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Compliance Health™</h3>
            <Link href="/continuous-compliance/health" className="text-xs text-[var(--color-blue)] hover:underline">Details →</Link>
          </div>
          {health ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold">{health.score}</span>
                <HealthLevelBadge level={health.level} />
              </div>
              <HealthBar score={health.score} />
              <div className="grid grid-cols-2 gap-2 text-xs">
                {health.checkSuccessRate != null && (
                  <div className="flex justify-between rounded-lg bg-white/[0.04] px-2.5 py-2">
                    <span className="text-[var(--color-ink-dim)]">Check pass rate</span>
                    <span className="font-medium">{health.checkSuccessRate}%</span>
                  </div>
                )}
                {health.openFindings != null && (
                  <div className="flex justify-between rounded-lg bg-white/[0.04] px-2.5 py-2">
                    <span className="text-[var(--color-ink-dim)]">Open signals</span>
                    <span className="font-medium">{health.openFindings}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-[var(--color-ink-faint)]">
              <BarChart3 className="mx-auto mb-2 h-6 w-6 opacity-40" />
              <p>No health score yet.</p>
              <Link href="/continuous-compliance/health" className="mt-1 block text-[var(--color-blue)] hover:underline">Compute Health →</Link>
            </div>
          )}
        </div>

        {/* Framework Readiness */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Framework Readiness™</h3>
            <Link href="/continuous-compliance/readiness" className="text-xs text-[var(--color-blue)] hover:underline">All →</Link>
          </div>
          {frameworks.length > 0 ? (
            <div className="space-y-3">
              {frameworks.slice(0, 4).map(f => (
                <div key={f.id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium">{f.frameworkName}</span>
                    <span className="text-[var(--color-ink-dim)]">{f.readinessScore}%</span>
                  </div>
                  <HealthBar score={f.readinessScore} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {["SOC 2", "ISO 27001", "DPDP", "NIST"].map(name => (
                <div key={name}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium">{name}</span>
                    <span className="text-[var(--color-ink-dim)]">—</span>
                  </div>
                  <HealthBar score={0} size="sm" />
                </div>
              ))}
              <p className="text-center text-[11px] text-[var(--color-ink-faint)]">Run checks to populate readiness scores.</p>
            </div>
          )}
        </div>

        {/* Open Signals */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Open Signals</h3>
            <Link href="/continuous-compliance/signals" className="text-xs text-[var(--color-blue)] hover:underline">All →</Link>
          </div>
          {signals.length > 0 ? (
            <div className="space-y-2">
              {signals.slice(0, 4).map(s => (
                <div key={s.id} className="flex items-start gap-3 rounded-xl border border-[var(--color-line)]/60 bg-white/[0.02] px-3 py-2.5">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium">{s.title}</div>
                    <div className="mt-0.5 flex gap-2">
                      <SeverityBadge severity={s.severity} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 gap-2">
              <CheckCircle className="h-8 w-8 text-emerald-400 opacity-60" />
              <p className="text-xs text-[var(--color-ink-faint)]">No open signals. All clear!</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Check Runs */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Recent Check Runs</h3>
          <Link href="/continuous-compliance/checks" className="text-xs text-[var(--color-blue)] hover:underline">Checks Library →</Link>
        </div>
        {runs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-[var(--color-ink-faint)]">
                  <th className="pb-2 text-left font-medium">Check</th>
                  <th className="pb-2 text-left font-medium">Result</th>
                  <th className="pb-2 text-left font-medium">Triggered By</th>
                  <th className="pb-2 text-left font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]/40">
                {runs.map(r => (
                  <tr key={r.id}>
                    <td className="py-2 font-mono text-[11px] text-[var(--color-ink-dim)]">{r.checkId.slice(0, 8)}…</td>
                    <td className="py-2"><CheckResultBadge result={r.result} /></td>
                    <td className="py-2 capitalize text-[var(--color-ink-dim)]">{r.triggeredBy}</td>
                    <td className="py-2 text-[var(--color-ink-faint)]">{new Date(r.startedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-[var(--color-ink-faint)]">
            No check runs yet. <Link href="/continuous-compliance/checks" className="text-[var(--color-blue)] hover:underline">Run your first check →</Link>
          </p>
        )}
      </div>

      {/* Check Categories */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <div className="mb-4">
          <h3 className="font-semibold text-sm">Check Library by Category</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {Object.entries(byCategory).map(([cat, count]) => (
            <Link
              key={cat}
              href={`/continuous-compliance/checks?category=${cat}`}
              className="flex flex-col items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-4 hover:border-[var(--color-blue)]/40 hover:bg-[var(--color-blue)]/[0.04] transition-colors"
            >
              <CategoryIcon category={cat} />
              <span className="text-xs font-medium uppercase tracking-wide">{cat.replace(/_/g, " ")}</span>
              <span className="text-lg font-bold text-[var(--color-blue)]">{count}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Module Nav */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-[var(--color-ink-dim)] uppercase tracking-wider">Platform Modules</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {NAV.map(({ href, icon: Icon, label, description }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-start gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5 transition-colors hover:border-[var(--color-blue)]/40 hover:bg-[var(--color-blue)]/[0.04]"
            >
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.06]">
                <Icon className="h-5 w-5 text-[var(--color-blue)]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm">{label}</span>
                  <ArrowRight className="h-4 w-4 text-[var(--color-ink-faint)] transition-transform group-hover:translate-x-0.5" />
                </div>
                <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
