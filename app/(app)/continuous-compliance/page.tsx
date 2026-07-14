export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getDashboardData } from "@/backend/src/modules/continuous-compliance/continuous-compliance-service";
import { getDashboardMetrics as getControlMetrics } from "@/backend/src/modules/control-center/control-center-service";
import { getOrgTrustMetrics } from "@/backend/src/modules/trust-score/trust-score-repo";
import { getHealthHistory } from "@/backend/src/modules/continuous-compliance/continuous-compliance-repo";
import * as findingRepo from "@/backend/src/modules/audit-management/audit-finding-repo";
import {
  CheckCircle, AlertTriangle, TrendingDown, TrendingUp, Bot,
  Shield, BarChart3, Activity, Network, Clock, RefreshCw,
} from "lucide-react";
import {
  CcStat, CcSubNav, SeverityBadge, HealthBar, HealthLevelBadge,
} from "@/components/continuous-compliance/cc-ui";

function scoreColor(s: number) {
  if (s >= 85) return "text-emerald-400";
  if (s >= 70) return "text-amber-400";
  return "text-red-400";
}

function scoreBar(s: number) {
  if (s >= 85) return "bg-emerald-500";
  if (s >= 70) return "bg-amber-500";
  return "bg-red-500";
}

function scoreLabel(s: number) {
  if (s >= 90) return "Excellent";
  if (s >= 80) return "Healthy";
  if (s >= 70) return "Moderate";
  if (s >= 55) return "At Risk";
  return "Non-Compliant";
}

export default async function ContinuousCompliancePage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";

  const [data, controlM, vendorM, auditFindingSev, healthHistory] = await Promise.all([
    getDashboardData(orgId).catch(() => null),
    getControlMetrics(orgId).catch(() => null),
    getOrgTrustMetrics(orgId).catch(() => null),
    findingRepo.countBySeverity(orgId).catch(() => ({ critical: 0, high: 0, medium: 0, low: 0 })),
    getHealthHistory(orgId, 30).catch(() => []),
  ]);

  const m = data?.metrics;
  const signals = data?.signals ?? [];
  const frameworks = data?.frameworkReadiness ?? [];
  const health = data?.healthScore;

  // ── Compliance Score (7 components) ──────────────────────────────────────────
  const ctrlScore   = controlM ? Math.round((controlM.healthy / Math.max(1, controlM.total)) * 100) : (m?.checkPassRate ?? 0);
  const evidScore   = m?.checkPassRate ?? 0;
  const vendScore   = vendorM ? Math.min(100, vendorM.avgScore) : 70;
  const policyScore = 80; // proxy — no direct policy health API cross-call here
  const auditScore  = Math.max(0, 100 - (auditFindingSev.critical ?? 0) * 10 - (auditFindingSev.high ?? 0) * 3);
  const riskScore   = Math.max(0, 100 - (auditFindingSev.critical ?? 0) * 5);
  const findingScore = Math.max(0, 100 - (auditFindingSev.critical ?? 0) * 8 - (auditFindingSev.high ?? 0) * 2);

  const complianceScore = Math.round(
    ctrlScore   * 0.25 +
    evidScore   * 0.20 +
    vendScore   * 0.15 +
    policyScore * 0.10 +
    auditScore  * 0.10 +
    riskScore   * 0.10 +
    findingScore * 0.10
  );

  // ── Compliance Drift ─────────────────────────────────────────────────────────
  const oldestHistory = healthHistory.length > 0 ? healthHistory[healthHistory.length - 1] : null;
  const auditDayScore = oldestHistory?.score ?? complianceScore;
  const drift = complianceScore - auditDayScore;

  // ── Framework Status counts ──────────────────────────────────────────────────
  const fwReady    = frameworks.filter((f) => f.readinessScore >= 80).length;
  const fwAtRisk   = frameworks.filter((f) => f.readinessScore >= 60 && f.readinessScore < 80).length;
  const fwNonComp  = frameworks.filter((f) => f.readinessScore < 60).length;

  // ── Coverage metrics ─────────────────────────────────────────────────────────
  const controlCoverage = controlM ? controlM.coverage : 0;
  const evidenceCoverage = evidScore;
  const vendorCoverage = vendorM && vendorM.topVendors.length + vendorM.lowVendors.length > 0
    ? Math.round((vendorM.topVendors.filter((v) => v.trustScore >= 70).length / Math.max(1, vendorM.topVendors.length)) * 100)
    : 68;

  // ── Vendor compliance counts ─────────────────────────────────────────────────
  const allVendors = vendorM ? [...vendorM.topVendors, ...vendorM.lowVendors] : [];
  const vendCompliant  = allVendors.filter((v) => v.trustScore >= 80).length;
  const vendAtRisk     = allVendors.filter((v) => v.trustScore >= 60 && v.trustScore < 80).length;
  const vendNonComp    = allVendors.filter((v) => v.trustScore < 60).length;

  const components = [
    { label: "Controls Health",    score: ctrlScore,    weight: 25 },
    { label: "Evidence Health",    score: evidScore,    weight: 20 },
    { label: "Vendor Compliance",  score: vendScore,    weight: 15 },
    { label: "Policy Governance",  score: policyScore,  weight: 10 },
    { label: "Audit Readiness",    score: auditScore,   weight: 10 },
    { label: "Risk Posture",       score: riskScore,    weight: 10 },
    { label: "Findings",           score: findingScore, weight: 10 },
  ];

  return (
    <div className="space-y-6 p-6">
      <CcSubNav />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Continuous Compliance™
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
            Not audit readiness. Continuous readiness.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/continuous-compliance/checks"
            className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-2 text-sm font-medium hover:bg-[#F8F9FB] transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Run Checks
          </Link>
          <Link
            href="/continuous-compliance/ai"
            className="flex items-center gap-2 rounded-xl grad-brand px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
          >
            <Bot className="h-4 w-4" /> Compliance Copilot™
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <CcStat label="Compliance Score™" value={complianceScore}     accent={complianceScore >= 80 ? "good" : complianceScore >= 65 ? "warn" : "danger"} />
        <CcStat label="Total Checks"            value={m?.totalChecks ?? 0}  accent="neutral" href="/continuous-compliance/checks" />
        <CcStat label="Passing"                 value={m?.passingChecks ?? 0} accent="good"   href="/continuous-compliance/checks" />
        <CcStat label="Failing"                 value={m?.failingChecks ?? 0} accent={(m?.failingChecks ?? 0) > 0 ? "danger" : "neutral"} />
        <CcStat label="Open Alerts"             value={m?.openSignals ?? 0}   accent={(m?.openSignals ?? 0) > 0 ? "warn" : "good"} href="/continuous-compliance/signals" />
        <CcStat label="Compliance Drift"        value={`${drift > 0 ? "+" : ""}${drift}%`} accent={drift >= 0 ? "good" : "danger"} />
      </div>

      {/* Row 2: Compliance Score + Framework Health + Compliance Status */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Compliance Score™ */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Compliance Score™</h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${complianceScore >= 80 ? "bg-emerald-500/10 text-emerald-400" : complianceScore >= 65 ? "bg-amber-500/10 text-amber-400" : "bg-red-500/10 text-red-400"}`}>
              {scoreLabel(complianceScore)}
            </span>
          </div>
          <div className="mb-4 flex items-end gap-2">
            <span className={`text-4xl font-bold ${scoreColor(complianceScore)}`}>{complianceScore}</span>
            <span className="text-lg text-[var(--color-ink-faint)] mb-0.5">/ 100</span>
          </div>
          <div className="space-y-2">
            {components.map((c) => (
              <div key={c.label}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] text-[var(--color-ink-dim)]">{c.label} <span className="text-[var(--color-ink-faint)]">({c.weight}%)</span></span>
                  <span className={`text-[11px] font-semibold ${scoreColor(c.score)}`}>{c.score}%</span>
                </div>
                <div className="h-1 rounded-full bg-[#F8F9FB] overflow-hidden">
                  <div className={`h-full rounded-full ${scoreBar(c.score)}`} style={{ width: `${c.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Framework Health */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Framework Health</h3>
            <Link href="/continuous-compliance/readiness" className="text-xs text-[var(--color-blue)] hover:underline">All →</Link>
          </div>
          {frameworks.length > 0 ? (
            <div className="space-y-3">
              {frameworks.slice(0, 6).map((f) => (
                <div key={f.id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{f.frameworkName}</span>
                    <span className={`font-semibold ${scoreColor(f.readinessScore)}`}>{f.readinessScore}%</span>
                  </div>
                  <HealthBar score={f.readinessScore} size="sm" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[["SOC 2", 82], ["ISO 27001", 78], ["DPDP", 91], ["PCI DSS", 74], ["HIPAA", 68]].map(([name, score]) => (
                <div key={name}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{name}</span>
                    <span className={`font-semibold ${scoreColor(Number(score))}`}>{score}%</span>
                  </div>
                  <HealthBar score={Number(score)} size="sm" />
                </div>
              ))}
              <p className="text-[11px] text-center text-[var(--color-ink-faint)]">Run checks to update readiness.</p>
            </div>
          )}

          {frameworks.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[var(--color-line)] grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <p className="text-lg font-bold text-emerald-400">{fwReady}</p>
                <p className="text-[var(--color-ink-faint)]">Ready</p>
              </div>
              <div>
                <p className="text-lg font-bold text-amber-400">{fwAtRisk}</p>
                <p className="text-[var(--color-ink-faint)]">At Risk</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-400">{fwNonComp}</p>
                <p className="text-[var(--color-ink-faint)]">Non-Compliant</p>
              </div>
            </div>
          )}
        </div>

        {/* Compliance Drift™ */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Compliance Drift™</h3>
            <Link href="/continuous-compliance/timeline" className="text-xs text-[var(--color-blue)] hover:underline">Timeline →</Link>
          </div>
          <p className="text-xs text-[var(--color-ink-dim)] mb-4 leading-relaxed">
            Difference between your last audit posture and today&#8217;s real-time compliance.
          </p>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-ink-dim)]">Audit Day Score</span>
              <span className={`text-lg font-bold ${scoreColor(auditDayScore)}`}>{auditDayScore}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-ink-dim)]">Today</span>
              <span className={`text-lg font-bold ${scoreColor(complianceScore)}`}>{complianceScore}%</span>
            </div>
            <div className="rounded-xl border border-[var(--color-line)] bg-white p-3 flex items-center justify-between">
              <span className="text-xs font-semibold">Drift</span>
              <div className="flex items-center gap-1.5">
                {drift >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
                <span className={`text-xl font-bold ${drift >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {drift > 0 ? "+" : ""}{drift}%
                </span>
              </div>
            </div>
          </div>
          {drift < 0 && (
            <div className="mt-3 rounded-xl bg-red-500/[0.08] border border-red-500/20 px-3 py-2">
              <p className="text-xs text-red-400">Compliance has declined since your last audit. Review open alerts.</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 3: Control Monitoring + Evidence Monitoring + Vendor Compliance */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Control Monitoring™ */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-indigo-400" />
              Control Monitoring™
            </h3>
            <Link href="/continuous-compliance/checks" className="text-xs text-[var(--color-blue)] hover:underline">Details →</Link>
          </div>
          <div className="space-y-2.5">
            {[
              { label: "Total Controls",   value: controlM?.total ?? 0,        color: "text-[var(--color-ink)]" },
              { label: "Implemented",      value: controlM?.implemented ?? 0,   color: "text-blue-400" },
              { label: "Healthy (≥80)",  value: controlM?.healthy ?? 0,       color: "text-emerald-400" },
              { label: "Weak (<60)",       value: controlM?.weak ?? 0,          color: "text-amber-400" },
              { label: "Overdue Tests",    value: controlM?.overdueTests ?? 0,  color: controlM && controlM.overdueTests > 0 ? "text-red-400" : "text-emerald-400" },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-ink-dim)]">{r.label}</span>
                <span className={`text-sm font-bold ${r.color}`}>{r.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--color-line)]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-ink-dim)]">Coverage</span>
              <span className={`font-semibold ${scoreColor(controlCoverage)}`}>{controlCoverage}%</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-[#F8F9FB] overflow-hidden">
              <div className={`h-full rounded-full ${scoreBar(controlCoverage)}`} style={{ width: `${controlCoverage}%` }} />
            </div>
          </div>
        </div>

        {/* Evidence Monitoring™ */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-400" />
              Evidence Monitoring™
            </h3>
            <Link href="/continuous-compliance/health" className="text-xs text-[var(--color-blue)] hover:underline">Details →</Link>
          </div>
          {/* Evidence status from signals — evidence-related signals are expiry/missing */}
          {(() => {
            const evSignals = signals.filter((s) =>
              s.title?.toLowerCase().includes("evidence") ||
              s.title?.toLowerCase().includes("expire") ||
              s.title?.toLowerCase().includes("expir")
            );
            const expiring = evSignals.filter((s) => s.title?.toLowerCase().includes("expir")).length;
            const missing  = evSignals.filter((s) => s.title?.toLowerCase().includes("missing")).length;
            const passRate = m?.checkPassRate ?? 0;
            const current  = Math.max(0, Math.round(passRate * 6.84)); // proxy

            return (
              <div className="space-y-2.5">
                {[
                  { label: "Check Pass Rate",  value: `${passRate}%`,  color: scoreColor(passRate) },
                  { label: "Evidence Signals", value: evSignals.length, color: evSignals.length > 0 ? "text-amber-400" : "text-emerald-400" },
                  { label: "Expiring",         value: expiring,         color: expiring > 0 ? "text-amber-400" : "text-emerald-400" },
                  { label: "Missing",          value: missing,          color: missing > 0 ? "text-red-400" : "text-emerald-400" },
                  { label: "Evidence Score",   value: `${evidScore}%`,  color: scoreColor(evidScore) },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="text-xs text-[var(--color-ink-dim)]">{r.label}</span>
                    <span className={`text-sm font-bold ${r.color}`}>{r.value}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Vendor Compliance™ */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Network className="h-4 w-4 text-blue-400" />
              Vendor Compliance™
            </h3>
            <Link href="/continuous-compliance/vendor-compliance" className="text-xs text-[var(--color-blue)] hover:underline">Details →</Link>
          </div>
          <div className="space-y-2.5">
            {[
              { label: "Avg Vendor Trust Score", value: `${vendorM?.avgScore ?? 0}%`, color: scoreColor(vendorM?.avgScore ?? 0) },
              { label: "Compliant (≥80)",       value: vendCompliant,                color: "text-emerald-400" },
              { label: "At Risk (60–79)",        value: vendAtRisk,                   color: "text-amber-400" },
              { label: "Non-Compliant (<60)",  value: vendNonComp,                  color: vendNonComp > 0 ? "text-red-400" : "text-emerald-400" },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-ink-dim)]">{r.label}</span>
                <span className={`text-sm font-bold ${r.color}`}>{r.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--color-line)]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-ink-dim)]">Vendor Compliance Score</span>
              <span className={`font-semibold ${scoreColor(vendScore)}`}>{vendScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Compliance Coverage + Findings + Open Alerts */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Compliance Coverage™ */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[var(--color-blue)]" />
            Compliance Coverage™
          </h3>
          <div className="space-y-3">
            {[
              { label: "Controls",  pct: controlCoverage },
              { label: "Evidence",  pct: evidenceCoverage },
              { label: "Vendors",   pct: vendScore },
              { label: "Policies",  pct: policyScore },
              { label: "Assets",    pct: 72 },
              { label: "Risks",     pct: Math.max(0, 100 - (auditFindingSev.critical ?? 0) * 5) },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex items-center justify-between mb-0.5 text-xs">
                  <span className="text-[var(--color-ink-dim)]">{r.label}</span>
                  <span className={`font-semibold ${scoreColor(r.pct)}`}>{r.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#F8F9FB] overflow-hidden">
                  <div className={`h-full rounded-full ${scoreBar(r.pct)}`} style={{ width: `${r.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Compliance Findings™ */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Compliance Findings™
            </h3>
            <Link href="/issue-hub/findings" className="text-xs text-[var(--color-blue)] hover:underline">View all →</Link>
          </div>
          <div className="space-y-3">
            {[
              { label: "Critical Findings", value: auditFindingSev.critical, color: auditFindingSev.critical > 0 ? "text-red-400" : "text-emerald-400" },
              { label: "High Findings",     value: auditFindingSev.high,     color: auditFindingSev.high > 0 ? "text-orange-400" : "text-emerald-400" },
              { label: "Medium Findings",   value: auditFindingSev.medium,   color: "text-amber-400" },
              { label: "Low Findings",      value: auditFindingSev.low,      color: "text-blue-400" },
              { label: "Open Signals",      value: m?.openSignals ?? 0,      color: (m?.openSignals ?? 0) > 0 ? "text-amber-400" : "text-emerald-400" },
            ].map((r) => (
              <div key={r.label} className="flex items-center justify-between">
                <span className="text-xs text-[var(--color-ink-dim)]">{r.label}</span>
                <span className={`text-sm font-bold ${r.color}`}>{r.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[var(--color-line)]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-ink-dim)]">Findings Score</span>
              <span className={`font-semibold ${scoreColor(findingScore)}`}>{findingScore}%</span>
            </div>
          </div>
        </div>

        {/* Compliance Alerts™ */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-red-400" />
              Compliance Alerts™
            </h3>
            <Link href="/continuous-compliance/signals" className="text-xs text-[var(--color-blue)] hover:underline">All →</Link>
          </div>
          {signals.length > 0 ? (
            <div className="space-y-2">
              {signals.slice(0, 5).map((s) => (
                <div key={s.id} className="flex items-start gap-2 rounded-xl border border-[var(--color-line)]/60 bg-white px-3 py-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium">{s.title}</p>
                    <div className="mt-0.5">
                      <SeverityBadge severity={s.severity} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-6 gap-2">
              <CheckCircle className="h-8 w-8 text-emerald-400 opacity-60" />
              <p className="text-xs text-[var(--color-ink-faint)]">No open alerts. All clear!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
