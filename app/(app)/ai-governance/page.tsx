export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/services/ai-governance/ai-governance-service";
import Link from "next/link";
import {
  Bot, Shield, AlertTriangle, Bug, Building2, ShieldCheck,
  Brain, Layers, ArrowUpRight,
} from "lucide-react";
import { AIGovStat } from "@/components/ai-governance/ai-governance-ui";

const NAV = [
  { href: "/ai-governance/inventory", icon: Layers, label: "AI Inventory™", desc: "All AI systems in use" },
  { href: "/ai-governance/risks", icon: AlertTriangle, label: "AI Risk Register™", desc: "Risks by category" },
  { href: "/ai-governance/controls", icon: Shield, label: "AI Controls™", desc: "Governance controls" },
  { href: "/ai-governance/vendors", icon: Building2, label: "AI Vendors™", desc: "Vendor governance" },
  { href: "/ai-governance/compliance", icon: ShieldCheck, label: "AI Compliance™", desc: "Framework readiness" },
  { href: "/ai-governance/ai", icon: Brain, label: "AI Copilot™", desc: "Governance intelligence" },
];

const RISK_COLORS: Record<string, string> = {
  low: "text-emerald-400", moderate: "text-yellow-400",
  high: "text-orange-400", critical: "text-red-400", prohibited: "text-purple-400",
};

export default async function AiGovernancePage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const dash = await getDashboardData(orgId).catch(() => null);
  const m = dash?.metrics;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-[var(--color-blue)]" /> AI Governance™
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Govern every AI system, risk, control, and vendor across your organization.
          </p>
        </div>
        <Link href="/ai-governance/ai"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Brain className="h-4 w-4" /> AI Copilot™
        </Link>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <AIGovStat label="AI Systems" value={m?.totalSystems ?? 0} accent="neutral" href="/ai-governance/inventory" />
        <AIGovStat label="Approved" value={m?.approvedSystems ?? 0} accent="good" />
        <AIGovStat label="High Risk" value={m?.highRiskSystems ?? 0} accent={(m?.highRiskSystems ?? 0) > 0 ? "warn" : "neutral"} href="/ai-governance/risks" />
        <AIGovStat label="Pending Review" value={m?.pendingReview ?? 0} accent={(m?.pendingReview ?? 0) > 0 ? "warn" : "neutral"} />
        <AIGovStat label="Avg Trust Score" value={m?.avgTrustScore ? m.avgTrustScore.toFixed(0) : "—"} accent="neutral" />
      </div>

      {/* Module Nav */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {NAV.map(({ href, icon: Icon, label, desc }) => (
          <Link key={href} href={href}
            className="group flex items-start gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4 hover:border-[var(--color-blue)]/40 hover:bg-white/[0.03] transition-colors">
            <div className="rounded-lg bg-[var(--color-blue)]/10 p-2">
              <Icon className="h-5 w-5 text-[var(--color-blue)]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 font-semibold text-sm">
                {label}
                <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-xs text-[var(--color-ink-dim)] mt-0.5">{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Systems */}
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><Layers className="h-4 w-4" /> Recent AI Systems</h2>
            <Link href="/ai-governance/inventory" className="text-xs text-[var(--color-blue)] hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {(dash?.systems ?? []).slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-[var(--color-ink-dim)]">{s.vendorName ?? "Internal"} · {s.systemType}</div>
                </div>
                <span className={`text-xs font-medium ${RISK_COLORS[s.riskClassification] ?? "text-[var(--color-ink-dim)]"}`}>
                  {s.riskClassification}
                </span>
              </div>
            ))}
            {(!dash?.systems || dash.systems.length === 0) && (
              <p className="text-sm text-[var(--color-ink-dim)]">No AI systems registered yet.</p>
            )}
          </div>
        </div>

        {/* Open Incidents */}
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><Bug className="h-4 w-4" /> Open Incidents</h2>
            <Link href="/ai-governance/incidents" className="text-xs text-[var(--color-blue)] hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {(dash?.incidents ?? []).slice(0, 5).map((i) => (
              <div key={i.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{i.title}</div>
                  <div className="text-xs text-[var(--color-ink-dim)]">{i.incidentType?.replace(/_/g, " ")}</div>
                </div>
                <span className={`text-xs font-medium ${i.severity === "critical" ? "text-red-400" : i.severity === "high" ? "text-orange-400" : "text-yellow-400"}`}>
                  {i.severity}
                </span>
              </div>
            ))}
            {(!dash?.incidents || dash.incidents.length === 0) && (
              <p className="text-sm text-[var(--color-ink-dim)]">No open incidents.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
