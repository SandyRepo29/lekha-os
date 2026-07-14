export const dynamic = "force-dynamic";

export const metadata = { title: 'Regulatory Intelligence™ — AUDT' };

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/backend/src/modules/regulatory-intelligence/regulatory-service";
import {
  RegSubNav, RegStat, SeverityBadge, ChangeStatusBadge,
  AlertIcon, ReadinessBar, ReadinessLabel,
} from "@/components/regulatory-intelligence/reg-ui";
import { Scale, BookOpen, Bell, ClipboardList, Bot, RefreshCw, TrendingUp, Download } from "lucide-react";

export default async function RegulatoryIntelligencePage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const data = await getDashboardData(orgId).catch(() => null);
  const m = data?.metrics;
  const changes = data?.recentChanges ?? [];
  const alerts = data?.openAlerts ?? [];
  const tasks = data?.openTasks ?? [];
  const updates = data?.updates ?? [];
  const readiness = data?.readiness;

  return (
    <div className="space-y-6 p-6">
      <RegSubNav />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
              Regulatory Intelligence™
            </h1>
            <span className="text-xs text-[var(--color-ink-dim)] border border-[var(--color-line)] rounded px-2 py-0.5">REST API available</span>
          </div>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Track regulations, monitor changes, manage obligations, and assess regulatory exposure.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/api/v1/regulations/export/csv"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-[#F8F9FB]"
          >
            <Download className="h-3.5 w-3.5" />
            Export Regulations CSV
          </a>
          <a
            href="/api/v1/obligations/export/csv"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-[#F8F9FB]"
          >
            <Download className="h-3.5 w-3.5" />
            Export Obligations CSV
          </a>
          <Link
            href="/regulatory-intelligence/changes"
            className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-2 text-sm font-medium hover:bg-[#F8F9FB] transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Monitor
          </Link>
          <Link
            href="/regulatory-intelligence/ai"
            className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
          >
            <Bot className="h-4 w-4" /> AI Advisor™
          </Link>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <RegStat label="Applicable Regulations" value={m?.totalRegulations ?? 0}  accent="neutral" href="/regulatory-intelligence/library" />
        <RegStat label="Regulatory Changes"      value={m?.totalChanges ?? 0}      accent="neutral" href="/regulatory-intelligence/changes" />
        <RegStat label="New Unreviewed"          value={m?.newChanges ?? 0}        accent={(m?.newChanges ?? 0) > 0 ? "warn" : "neutral"} href="/regulatory-intelligence/changes" />
        <RegStat label="Open Alerts"             value={m?.openAlerts ?? 0}        accent={(m?.openAlerts ?? 0) > 0 ? "danger" : "good"} href="/regulatory-intelligence/changes" />
        <RegStat label="Total Obligations"       value={m?.totalObligations ?? 0}  accent="neutral" href="/regulatory-intelligence/obligations" />
        <RegStat label="Open Obligations"        value={m?.openObligations ?? 0}   accent={(m?.openObligations ?? 0) > 0 ? "warn" : "good"} href="/regulatory-intelligence/obligations" />
        <RegStat label="Open Tasks"              value={m?.openTasks ?? 0}         accent={(m?.openTasks ?? 0) > 0 ? "warn" : "neutral"} />
        <RegStat label="Readiness Score"         value={`${readiness?.score ?? 0}%`} accent={(readiness?.score ?? 0) >= 60 ? "good" : "danger"} />
      </div>

      {/* Strategic Banner */}
      <div className="rounded-2xl border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.05] p-5">
        <div className="flex items-start gap-4">
          <Scale className="mt-0.5 h-8 w-8 shrink-0 text-[var(--color-blue)]" />
          <div>
            <div className="font-semibold text-sm text-[var(--color-blue)]">
              Regulatory Intelligence — Governance Built on Proof
            </div>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)] leading-relaxed">
              AUDT tracks regulations across jurisdictions, monitors changes in real-time, and maps
              obligations to controls — turning regulatory complexity into actionable governance.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["DPDP", "GDPR", "ISO 27001", "NIST", "DORA", "NIS2", "EU AI Act", "SOC 2", "RBI"].map(t => (
                <span key={t} className="rounded-full border border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.08] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-blue)]">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Readiness */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Regulatory Readiness™</h3>
          </div>
          {readiness ? (
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{readiness.score}%</span>
                <ReadinessLabel score={readiness.score} />
              </div>
              <ReadinessBar score={readiness.score} />
              <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                <div className="rounded-lg bg-[#F8F9FB] px-2.5 py-2 flex justify-between">
                  <span className="text-[var(--color-ink-dim)]">Total</span>
                  <span className="font-medium">{readiness.total}</span>
                </div>
                <div className="rounded-lg bg-[#F8F9FB] px-2.5 py-2 flex justify-between">
                  <span className="text-[var(--color-ink-dim)]">Implemented</span>
                  <span className="font-medium text-emerald-400">{readiness.implemented}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-xs py-8 text-[var(--color-ink-faint)]">Add obligations to compute readiness.</p>
          )}
        </div>

        {/* Open Alerts */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" /> Open Alerts
            </h3>
            <Link href="/regulatory-intelligence/changes" className="text-xs text-[var(--color-blue)] hover:underline">All →</Link>
          </div>
          {alerts.length > 0 ? (
            <div className="space-y-2">
              {alerts.slice(0, 4).map(a => (
                <div key={a.id} className="flex items-start gap-2 rounded-xl border border-[var(--color-line)]/60 bg-white px-3 py-2.5">
                  <AlertIcon severity={a.severity} />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium">{a.title}</div>
                    <div className="mt-0.5">
                      <SeverityBadge severity={a.severity} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 gap-2">
              <Bell className="h-8 w-8 text-emerald-400 opacity-40" />
              <p className="text-xs text-[var(--color-ink-faint)]">No open alerts. All clear!</p>
            </div>
          )}
        </div>

        {/* Open Tasks */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-violet-400" /> Open Tasks
            </h3>
            <Link href="/regulatory-intelligence/obligations" className="text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">View all →</Link>
          </div>
          {tasks.length > 0 ? (
            <div className="space-y-2">
              {tasks.slice(0, 4).map(t => (
                <div key={t.id} className="flex items-start gap-2 rounded-xl border border-[var(--color-line)]/60 bg-white px-3 py-2.5">
                  <ClipboardList className="h-4 w-4 shrink-0 text-violet-400 mt-0.5" />
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium">{t.title}</div>
                    <div className="mt-0.5 text-[10px] text-[var(--color-ink-faint)] capitalize">{t.taskType?.replace(/_/g, " ")}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs py-8 text-[var(--color-ink-faint)]">No open tasks.</p>
          )}
        </div>
      </div>

      {/* Recent Changes */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Recent Regulatory Changes</h3>
          <Link href="/regulatory-intelligence/changes" className="text-xs text-[var(--color-blue)] hover:underline">All Changes →</Link>
        </div>
        {changes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-[var(--color-ink-faint)]">
                  <th className="pb-2 text-left font-medium">Change</th>
                  <th className="pb-2 text-left font-medium">Type</th>
                  <th className="pb-2 text-left font-medium">Severity</th>
                  <th className="pb-2 text-left font-medium">Status</th>
                  <th className="pb-2 text-left font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]/40">
                {changes.map(c => (
                  <tr key={c.id}>
                    <td className="py-2 font-medium">{c.title}</td>
                    <td className="py-2 capitalize text-[var(--color-ink-dim)]">{c.changeType?.replace(/_/g, " ")}</td>
                    <td className="py-2"><SeverityBadge severity={c.severity} /></td>
                    <td className="py-2"><ChangeStatusBadge status={c.status} /></td>
                    <td className="py-2 text-[var(--color-ink-faint)]">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-[var(--color-ink-faint)]">
            No changes logged yet.{" "}
            <Link href="/regulatory-intelligence/changes" className="text-[var(--color-blue)] hover:underline">
              Log a change →
            </Link>
          </p>
        )}
      </div>

      {/* Module Nav */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h3 className="mb-4 font-semibold text-sm">Regulatory Intelligence™ Modules</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: "/regulatory-intelligence/library",     icon: BookOpen,     label: "Regulation Library™",    desc: "18 regulations" },
            { href: "/regulatory-intelligence/changes",     icon: RefreshCw,    label: "Change Monitor™",        desc: "Track updates" },
            { href: "/regulatory-intelligence/obligations", icon: ClipboardList, label: "Obligations™",          desc: "Manage requirements" },
            { href: "/regulatory-intelligence/assessments", icon: Scale,        label: "Impact Assessments™",    desc: "Analyze exposure" },
            { href: "/regulatory-intelligence/watchlists",  icon: Bell,         label: "Watchlists™",            desc: "Monitor topics" },
            { href: "/regulatory-intelligence/horizon",     icon: TrendingUp,   label: "Compliance Horizon™",    desc: "Predict exposure" },
            { href: "/regulatory-intelligence/ai",          icon: Bot,          label: "AI Advisor™",            desc: "Regulatory intelligence" },
          ].map(({ href, icon: Icon, label, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col gap-2 rounded-xl border border-[var(--color-line)] bg-white p-4 hover:border-[var(--color-blue)]/40 hover:bg-[var(--color-blue)]/[0.04] transition-colors"
            >
              <Icon className="h-5 w-5 text-[var(--color-blue)]" />
              <div>
                <div className="text-xs font-semibold">{label}</div>
                <div className="text-[11px] text-[var(--color-ink-faint)] mt-0.5">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
