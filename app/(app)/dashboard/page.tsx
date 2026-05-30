export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Building2,
  FileText,
  CalendarClock,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Plus,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/app-shell/score-ring";
import { requireUser } from "@/lib/auth/session";
import {
  getMetrics,
  listVendors,
  deriveInsights,
  type VendorRow,
  type VendorMetrics,
} from "@/lib/services/vendor-service";
import { listOrgActivity } from "@/lib/repositories/activity-repo";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { demoMetrics, demoVendors } from "@/lib/demo-data";
import { riskTone } from "@/lib/ui-maps";

export default async function DashboardPage() {
  const session = await requireUser();

  let metrics: VendorMetrics;
  let recent: VendorRow[];

  if (session.demo || !session.org) {
    metrics = demoMetrics;
    recent = demoVendors.slice(0, 5).map((v, i) => ({
      id: String(i), name: v.name, category: v.category,
      status: v.status, risk: v.risk, score: v.score,
      docs: v.docs, expiring: v.expiring,
      ownerName: v.ownerName, ownerEmail: v.ownerEmail, ownerDepartment: v.ownerDepartment,
    }));
  } else {
    [metrics, recent] = await Promise.all([
      getMetrics(session.org.id),
      listVendors(session.org.id).then((v) => v.slice(0, 5)),
    ]);
  }

  const insights = deriveInsights(metrics);
  const empty = metrics.totalVendors === 0;
  const activity = (!session.demo && session.org)
    ? await listOrgActivity(session.org.id, 10)
    : [];
  const scoreColor = metrics.complianceScore >= 80 ? "text-emerald-400"
    : metrics.complianceScore >= 60 ? "text-[var(--color-blue)]"
    : metrics.complianceScore >= 40 ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-[var(--color-ink-dim)]">{session.orgName} · governance posture at a glance.</p>
        </div>
        <Link href="/vendors/new">
          <Button variant="primary" size="md"><Plus className="h-4 w-4" /> Add vendor</Button>
        </Link>
      </div>

      {/* Top row: score banner + 4 stats */}
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">

        {/* Compliance score banner */}
        <Card className="relative flex flex-col items-center justify-center overflow-hidden p-6">
          <div className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(99,102,241,.18), transparent 70%)" }} />
          <div className="relative text-center">
            <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
              Compliance Score
            </div>
            <ScoreRing value={metrics.complianceScore} size={120} />
            <div className={`mt-2 text-sm font-semibold ${scoreColor}`}>
              {metrics.complianceScore >= 80 ? "Healthy" : metrics.complianceScore >= 60 ? "Improving" : metrics.complianceScore >= 40 ? "Needs Attention" : "Critical"}
            </div>
            <div className="mt-0.5 text-xs text-[var(--color-ink-faint)]">
              {empty ? "Add vendors to begin" : `Across ${metrics.totalVendors} vendor${metrics.totalVendors !== 1 ? "s" : ""}`}
            </div>
          </div>
        </Card>

        {/* 4 stat cards */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            label="Vendors Tracked"
            value={metrics.totalVendors}
            icon={Building2}
            accent="indigo"
            href="/vendors"
          />
          <StatCard
            label="Documents Managed"
            value={metrics.totalDocuments}
            icon={FileText}
            accent="blue"
          />
          <StatCard
            label="Expiring Soon"
            value={metrics.expiringSoon}
            icon={CalendarClock}
            accent={metrics.expiringSoon > 0 ? "warn" : "neutral"}
            alert={metrics.expiringSoon > 0}
            href={metrics.expiringSoon > 0 ? "/vendors?expiring=1" : undefined}
          />
          <StatCard
            label="High Risk"
            value={metrics.highRisk}
            icon={AlertTriangle}
            accent={metrics.highRisk > 0 ? "danger" : "neutral"}
            alert={metrics.highRisk > 0}
            href={metrics.highRisk > 0 ? "/vendors?risk=high" : undefined}
          />
        </div>
      </div>

      {/* AI Insights */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-blue)]/10">
              <Sparkles className="h-4 w-4 text-[var(--color-blue)]" />
            </div>
            <h2 className="font-[family-name:var(--font-display)] font-semibold">Lekha AI Insights</h2>
          </div>
          <span className="text-xs text-[var(--color-ink-faint)]">Based on your current data</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map((insight, i) => (
            <div key={i} className={`flex items-start gap-3 rounded-xl border p-3.5 ${
              insight.tone === "danger" ? "border-red-500/20 bg-red-500/[0.06]"
              : insight.tone === "warn" ? "border-amber-500/20 bg-amber-500/[0.06]"
              : insight.tone === "live" ? "border-emerald-500/20 bg-emerald-500/[0.06]"
              : "border-[var(--color-line)] bg-white/[0.02]"
            }`}>
              <span className={`mt-0.5 shrink-0 text-base ${
                insight.tone === "danger" ? "text-red-400"
                : insight.tone === "warn" ? "text-amber-400"
                : insight.tone === "live" ? "text-emerald-400"
                : "text-[var(--color-blue)]"
              }`}>
                {insight.tone === "danger" ? "⚠" : insight.tone === "warn" ? "◔" : insight.tone === "live" ? "✓" : "✦"}
              </span>
              <span className="text-sm leading-relaxed text-[var(--color-ink)]">{insight.text}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent vendors */}
      <Card>
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[var(--color-ink-faint)]" />
            <h2 className="font-[family-name:var(--font-display)] font-semibold">Recent vendors</h2>
          </div>
          {!empty && (
            <Link href="/vendors" className="flex items-center gap-1 text-sm font-medium text-[var(--color-blue)] hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {empty ? (
          <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-[var(--color-ink-faint)]">
              <Building2 className="h-7 w-7" />
            </div>
            <p className="font-semibold text-[var(--color-ink)]">No vendors yet</p>
            <p className="max-w-xs text-sm text-[var(--color-ink-dim)]">Add your first vendor to start tracking documents, risk and compliance.</p>
            <Link href="/vendors/new" className="mt-1">
              <Button variant="primary" size="sm"><Plus className="h-4 w-4" /> Add your first vendor</Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {recent.map((v) => (
              <Link key={v.id} href={`/vendors/${v.id}`}
                className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-sm font-bold text-[var(--color-ink-dim)]">
                  {v.name[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{v.name}</div>
                  <div className="text-xs text-[var(--color-ink-faint)]">{v.category ?? "—"}</div>
                </div>
                <Badge tone={riskTone(v.risk)} className="hidden sm:inline-flex">{v.risk}</Badge>
                <div className="hidden items-center gap-2.5 md:flex">
                  <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full transition-all" style={{ width: `${v.score}%`, background: scoreBarColor(v.score) }} />
                  </div>
                  <span className="w-8 text-right text-sm font-bold font-[family-name:var(--font-display)]">{v.score}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Activity feed */}
      {activity.length > 0 && (
        <Card>
          <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
            <h2 className="font-[family-name:var(--font-display)] font-semibold">Recent activity</h2>
          </div>
          <div className="px-5 py-3">
            <ActivityFeed items={activity} />
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent, alert, href }: {
  label: string; value: number; icon: React.ComponentType<{ className?: string }>;
  accent: "indigo" | "blue" | "warn" | "danger" | "neutral"; alert?: boolean; href?: string;
}) {
  const borderColor = accent === "danger" ? "border-red-500/30" : accent === "warn" ? "border-amber-500/30" : accent === "indigo" ? "border-indigo-500/20" : accent === "blue" ? "border-blue-500/20" : "border-[var(--color-line)]";
  const bgColor = accent === "danger" && alert ? "bg-red-500/[0.06]" : accent === "warn" && alert ? "bg-amber-500/[0.06]" : "";
  const iconColor = accent === "danger" ? "text-red-400" : accent === "warn" ? "text-amber-400" : accent === "indigo" ? "text-indigo-400" : accent === "blue" ? "text-[var(--color-blue)]" : "text-[var(--color-ink-faint)]";
  const valColor = accent === "danger" && alert ? "text-red-400" : accent === "warn" && alert ? "text-amber-400" : "text-[var(--color-ink)]";
  const leftBar = accent === "danger" && alert ? "border-l-2 border-l-red-500" : accent === "warn" && alert ? "border-l-2 border-l-amber-500" : accent === "indigo" ? "border-l-2 border-l-indigo-500" : accent === "blue" ? "border-l-2 border-l-blue-400" : "";

  const inner = (
    <Card className={`p-5 ${borderColor} ${bgColor} ${leftBar} transition-colors ${href ? "hover:bg-white/[0.05]" : ""}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-ink-dim)]">{label}</span>
        <span className={`rounded-lg bg-white/[0.04] p-1.5 ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className={`mt-3 font-[family-name:var(--font-display)] text-3xl font-extrabold ${valColor}`}>
        {value}
      </div>
    </Card>
  );

  return href ? <Link href={href}>{inner}</Link> : inner;
}

function scoreBarColor(score: number) {
  if (score >= 80) return "linear-gradient(90deg, #10b981, #34d058)";
  if (score >= 60) return "linear-gradient(90deg, #6366f1, #8b5cf6)";
  if (score >= 40) return "linear-gradient(90deg, #f59e0b, #fbbf24)";
  return "linear-gradient(90deg, #ef4444, #f87171)";
}
