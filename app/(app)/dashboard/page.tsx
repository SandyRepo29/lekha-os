export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  Building2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Plus,
  ShieldCheck,
  ClipboardCheck,
  FileText,
  Clock,
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
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
import { getTrustIntelligenceOverview } from "@/lib/services/trust-intelligence/trust-intelligence-service";
import { listOrgActivity } from "@/lib/repositories/activity-repo";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { demoMetrics, demoVendors } from "@/lib/demo-data";
import { riskTone } from "@/lib/ui-maps";
import { scoreBarGradient } from "@/lib/ui/colors";
import { getOrgTrustLevel } from "@/lib/services/org-trust-score";
import { Suspense } from "react";
import { WelcomeBanner } from "@/components/onboarding/welcome-banner";
import { OnboardingChecklist } from "@/components/onboarding/onboarding-checklist";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await requireUser();

  let metrics: VendorMetrics;
  let allVendors: VendorRow[];

  if (session.demo || !session.org) {
    metrics = demoMetrics;
    allVendors = demoVendors.slice(0, 5).map((v, i) => ({
      id: String(i), name: v.name, category: v.category,
      status: v.status, risk: v.risk, score: v.score,
      docs: v.docs, expiring: v.expiring,
      ownerName: v.ownerName, ownerEmail: v.ownerEmail,
      ownerDepartment: v.ownerDepartment, expired: v.expired,
    }));
  } else {
    [metrics, allVendors] = await Promise.all([
      getMetrics(session.org.id),
      listVendors(session.org.id),
    ]);
  }

  const recent = allVendors.slice(0, 6);
  const insights = deriveInsights(metrics);
  const empty = metrics.totalVendors === 0;

  const activity = (!session.demo && session.org)
    ? await listOrgActivity(session.org.id, 8)
    : [];

  let trustOverview: Awaited<ReturnType<typeof getTrustIntelligenceOverview>> | null = null;
  if (!session.demo && session.org) {
    try {
      trustOverview = await getTrustIntelligenceOverview(session.org.id);
    } catch {
      // graceful fallback
    }
  }

  const orgScore = trustOverview?.orgTrustScore.overall ?? metrics.complianceScore;
  const trustLevel = getOrgTrustLevel(orgScore);

  const trustLevelColor =
    orgScore >= 90 ? "text-emerald-400"
    : orgScore >= 80 ? "text-blue-400"
    : orgScore >= 70 ? "text-indigo-400"
    : orgScore >= 60 ? "text-amber-400"
    : "text-red-400";

  // Vendor health breakdown from trust scores
  const scoredVendors = trustOverview?.vendors.allScored ?? [];
  const healthyCount  = scoredVendors.filter((v) => v.trustScore >= 80).length;
  const atRiskCount   = scoredVendors.filter((v) => v.trustScore >= 50 && v.trustScore < 80).length;
  const criticalCount = scoredVendors.filter((v) => v.trustScore < 50).length;
  const unscoredCount = metrics.totalVendors - scoredVendors.length;

  // Expired docs count derived from vendor list
  const expiredDocs = allVendors.reduce((sum, v) => sum + ((v as any).expired ?? 0), 0);

  // Lifecycle funnel — derived from vendor list
  const withDocs      = allVendors.filter((v) => (v.docs ?? 0) > 0).length;
  const lowRisk       = allVendors.filter((v) => v.risk !== "high" && v.risk !== "critical").length;
  const compliant     = allVendors.filter((v) => (v.score ?? 0) >= 70).length;
  const monitored     = healthyCount;

  // Action Center — items needing attention
  const actionItems = [
    { label: "Expired documents",    value: expiredDocs,                                  href: "/vendors",          tone: "danger" as const,  icon: XCircle },
    { label: "Expiring soon",        value: metrics.expiringSoon,                                 href: "/vendors?expiring=1", tone: "warn" as const,   icon: Clock },
    { label: "Critical risks",       value: trustOverview?.risks.criticalCount ?? 0,              href: "/risks",            tone: "danger" as const,  icon: AlertTriangle },
    { label: "Open critical findings", value: trustOverview?.audits.openCriticalFindings ?? 0,   href: "/audits/findings",  tone: "danger" as const,  icon: ClipboardCheck },
    { label: "Weak controls",        value: trustOverview?.controls.weakCount ?? 0,               href: "/controls",         tone: "warn" as const,    icon: ShieldCheck },
    { label: "High-risk vendors",    value: metrics.highRisk,                                     href: "/vendors?risk=high", tone: "warn" as const,  icon: Building2 },
  ].filter((a) => a.value > 0);

  // Governance status scores
  const govStatus = [
    { label: "Compliance",     value: trustOverview?.orgTrustScore.complianceCoverage ?? metrics.complianceScore, href: "/compliance" },
    { label: "Risk Posture",   value: trustOverview?.orgTrustScore.riskPosture ?? 0,                              href: "/risks" },
    { label: "Audit Readiness", value: trustOverview?.orgTrustScore.auditReadiness ?? 0,                          href: "/audits" },
    { label: "Control Health", value: trustOverview?.orgTrustScore.controlHealth ?? 0,                            href: "/controls" },
    { label: "Vendor Trust",   value: trustOverview?.orgTrustScore.vendorTrust ?? 0,                              href: "/vendors" },
  ];

  return (
    <div className="space-y-6">

      <Suspense fallback={null}>
        <WelcomeBanner />
      </Suspense>
      <OnboardingChecklist />

      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Vendor Governance Platform
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            {session.orgName} · {metrics.totalVendors} vendor{metrics.totalVendors !== 1 ? "s" : ""} tracked
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/trust-intelligence">
            <Button variant="ghost" size="sm">
              <TrendingUp className="h-4 w-4" /> Trust Score™
            </Button>
          </Link>
          <Link href="/vendors/new">
            <Button variant="primary" size="md"><Plus className="h-4 w-4" /> Add vendor</Button>
          </Link>
        </div>
      </div>

      {/* ── Section 1: Trust Overview ── */}
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">

        {/* Trust Score™ ring */}
        <Card className="relative flex flex-col items-center justify-center overflow-hidden p-6">
          <div className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse at 50% 110%, rgba(99,102,241,.22), transparent 65%)" }} />
          <div className="relative flex flex-col items-center text-center">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
              Trust Score™
            </div>
            <ScoreRing value={orgScore} size={112} />
            <div className={`mt-2 text-sm font-bold ${trustLevelColor}`}>{trustLevel}</div>
            <div className="mt-0.5 text-[11px] text-[var(--color-ink-faint)]">
              {empty ? "Add vendors to begin" : "organizational trust"}
            </div>
            <Link href="/trust-intelligence" className="mt-3 text-xs text-[var(--color-blue)] hover:underline flex items-center gap-1">
              Full breakdown <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </Card>

        {/* Vendor Health */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <HealthCard label="Total Vendors"  value={metrics.totalVendors} color="indigo" href="/vendors" />
          <HealthCard label="Healthy"        value={healthyCount}         color="emerald" href="/vendors" />
          <HealthCard label="At Risk"        value={atRiskCount}          color="amber"   href="/vendors?risk=medium" />
          <HealthCard label="Critical"       value={criticalCount}        color="red"     href="/vendors?risk=high" alert={criticalCount > 0} />
        </div>
      </div>

      {/* ── Section 2: Governance Status ── */}
      <div>
        <SectionLabel>Governance Status</SectionLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {govStatus.map((s) => (
            <Link key={s.label} href={s.href}>
              <Card className="p-4 hover:bg-white/[0.04] transition-colors cursor-pointer">
                <div className="mb-2 text-xs text-[var(--color-ink-faint)]">{s.label}</div>
                <div className={`font-[family-name:var(--font-display)] text-2xl font-extrabold ${scoreColor(s.value)}`}>
                  {s.value}<span className="text-xs font-normal text-[var(--color-ink-faint)]">%</span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${s.value}%`, background: scoreBarGradient(s.value) }} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Section 3: Vendor Lifecycle ── */}
      <div>
        <SectionLabel>Vendor Lifecycle</SectionLabel>
        <Card className="p-5">
          <div className="flex items-center gap-0 overflow-x-auto">
            {[
              { stage: "Onboarded",  count: metrics.totalVendors, href: "/vendors",           active: true },
              { stage: "Documented", count: withDocs,             href: "/vendors",           active: withDocs > 0 },
              { stage: "Low Risk",   count: lowRisk,              href: "/risks",             active: lowRisk > 0 },
              { stage: "Compliant",  count: compliant,            href: "/compliance",        active: compliant > 0 },
              { stage: "Monitored",  count: monitored,            href: "/trust-intelligence", active: monitored > 0 },
            ].map((step, i, arr) => (
              <div key={step.stage} className="flex shrink-0 items-center">
                <Link href={step.href}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border px-5 py-4 text-center transition-colors hover:bg-white/[0.04]",
                    step.active && step.count > 0
                      ? "border-[var(--color-blue)]/30 bg-[var(--color-blue)]/[0.05]"
                      : "border-[var(--color-line)] opacity-50"
                  )}>
                  <div className={cn(
                    "font-[family-name:var(--font-display)] text-2xl font-extrabold",
                    step.active && step.count > 0 ? "text-[var(--color-ink)]" : "text-[var(--color-ink-faint)]"
                  )}>
                    {step.count}
                  </div>
                  <div className="text-[11px] font-medium text-[var(--color-ink-dim)] whitespace-nowrap">
                    {step.stage}
                  </div>
                </Link>
                {i < arr.length - 1 && (
                  <ChevronRight className="mx-1 h-4 w-4 shrink-0 text-[var(--color-ink-faint)]" />
                )}
              </div>
            ))}
            {/* Future stages */}
            {["Audited", "Renewed", "Offboarded"].map((stage, i) => (
              <div key={stage} className="flex shrink-0 items-center">
                <ChevronRight className="mx-1 h-4 w-4 shrink-0 text-[var(--color-ink-faint)]/40" />
                <div className="flex flex-col items-center gap-1.5 rounded-xl border border-dashed border-[var(--color-line)]/50 px-5 py-4 text-center opacity-30">
                  <div className="font-[family-name:var(--font-display)] text-2xl font-extrabold text-[var(--color-ink-faint)]">—</div>
                  <div className="text-[11px] font-medium text-[var(--color-ink-faint)] whitespace-nowrap">{stage}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Section 4: Action Center ── */}
      {actionItems.length > 0 && (
        <div>
          <SectionLabel>Action Center</SectionLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {actionItems.map((item) => (
              <Link key={item.label} href={item.href}>
                <Card className={cn(
                  "p-4 transition-colors hover:bg-white/[0.04] cursor-pointer border-l-2",
                  item.tone === "danger" ? "border-l-red-500 bg-red-500/[0.04]" : "border-l-amber-500 bg-amber-500/[0.04]"
                )}>
                  <item.icon className={cn("mb-2 h-4 w-4", item.tone === "danger" ? "text-red-400" : "text-amber-400")} />
                  <div className={cn(
                    "font-[family-name:var(--font-display)] text-xl font-extrabold",
                    item.tone === "danger" ? "text-red-400" : "text-amber-400"
                  )}>
                    {item.value}
                  </div>
                  <div className="mt-0.5 text-[11px] text-[var(--color-ink-faint)] leading-snug">{item.label}</div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Section 5: Executive Insights ── */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-blue)]/10">
              <Sparkles className="h-4 w-4 text-[var(--color-blue)]" />
            </div>
            <h2 className="font-[family-name:var(--font-display)] font-semibold">Governance Copilot™</h2>
          </div>
          <Link href="/trust-intelligence/executive"
            className="flex items-center gap-1 text-xs font-medium text-[var(--color-blue)] hover:underline">
            Ask a question <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.map((insight, i) => (
            <div key={i} className={cn(
              "flex items-start gap-3 rounded-xl border p-3.5",
              insight.tone === "danger" ? "border-red-500/20 bg-red-500/[0.06]"
              : insight.tone === "warn"  ? "border-amber-500/20 bg-amber-500/[0.06]"
              : insight.tone === "live"  ? "border-emerald-500/20 bg-emerald-500/[0.06]"
              : "border-[var(--color-line)] bg-white/[0.02]"
            )}>
              <span className={cn("mt-0.5 shrink-0 text-base",
                insight.tone === "danger" ? "text-red-400"
                : insight.tone === "warn" ? "text-amber-400"
                : insight.tone === "live" ? "text-emerald-400"
                : "text-[var(--color-blue)]"
              )}>
                {insight.tone === "danger" ? "⚠" : insight.tone === "warn" ? "◔" : insight.tone === "live" ? "✓" : "✦"}
              </span>
              <span className="text-sm leading-relaxed text-[var(--color-ink)]">{insight.text}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Bottom row: recent vendors + activity ── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Recent vendors */}
        <Card>
          <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[var(--color-ink-faint)]" />
              <h2 className="font-[family-name:var(--font-display)] font-semibold">Recent Vendors</h2>
            </div>
            {!empty && (
              <Link href="/vendors" className="flex items-center gap-1 text-xs font-medium text-[var(--color-blue)] hover:underline">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {empty ? (
            <div className="flex flex-col items-center gap-3 px-5 py-12 text-center">
              <Building2 className="h-8 w-8 text-[var(--color-ink-faint)]" />
              <p className="font-semibold text-[var(--color-ink)]">No vendors yet</p>
              <p className="max-w-xs text-sm text-[var(--color-ink-dim)]">Add your first vendor to start tracking documents, risk and compliance.</p>
              <Link href="/vendors/new" className="mt-1">
                <Button variant="primary" size="sm"><Plus className="h-4 w-4" /> Add first vendor</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-line)]">
              {recent.map((v) => (
                <Link key={v.id} href={`/vendors/${v.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.02]">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.05] text-xs font-bold text-[var(--color-ink-dim)]">
                    {v.name[0].toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{v.name}</div>
                    <div className="text-xs text-[var(--color-ink-faint)]">{v.category ?? "—"}</div>
                  </div>
                  <Badge tone={riskTone(v.risk)} className="hidden sm:inline-flex">{v.risk}</Badge>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${v.score}%`, background: scoreBarGradient(v.score) }} />
                    </div>
                    <span className="w-7 text-right text-xs font-bold">{v.score}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* Activity feed */}
        <Card>
          <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--color-ink-faint)]" />
              <h2 className="font-[family-name:var(--font-display)] font-semibold">Recent Activity</h2>
            </div>
          </div>
          {activity.length > 0 ? (
            <div className="px-5 py-3">
              <ActivityFeed items={activity} />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
              <Activity className="h-8 w-8 text-[var(--color-ink-faint)]" />
              <p className="text-sm text-[var(--color-ink-dim)]">Activity will appear here as your team uses AUDT.</p>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(v: number) {
  return v >= 80 ? "text-emerald-400" : v >= 65 ? "text-blue-400" : v >= 50 ? "text-amber-400" : "text-red-400";
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">
      {children}
    </div>
  );
}

function HealthCard({ label, value, color, href, alert }: {
  label: string; value: number; color: string; href: string; alert?: boolean;
}) {
  const colorMap: Record<string, { text: string; bg: string; border: string; bar: string }> = {
    indigo:  { text: "text-indigo-400",  bg: "bg-indigo-500/[0.06]",  border: "border-indigo-500/20",  bar: "#818cf8" },
    emerald: { text: "text-emerald-400", bg: "bg-emerald-500/[0.06]", border: "border-emerald-500/20", bar: "#34d399" },
    amber:   { text: "text-amber-400",   bg: "bg-amber-500/[0.06]",   border: "border-amber-500/20",   bar: "#fbbf24" },
    red:     { text: "text-red-400",     bg: "bg-red-500/[0.06]",     border: "border-red-500/20",     bar: "#f87171" },
  };
  const c = colorMap[color] ?? colorMap.indigo;

  return (
    <Link href={href}>
      <Card className={cn(
        "p-4 transition-colors hover:bg-white/[0.04] cursor-pointer border-l-2",
        c.border, alert ? c.bg : ""
      )} style={{ borderLeftColor: c.bar }}>
        <div className={cn("font-[family-name:var(--font-display)] text-2xl font-extrabold", c.text)}>
          {value}
        </div>
        <div className="mt-1 text-xs text-[var(--color-ink-faint)]">{label}</div>
      </Card>
    </Link>
  );
}
