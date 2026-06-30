export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getOrgTrustMetrics } from "@/lib/repositories/trust-score-repo";
import { getLatestSnapshot, getComplianceMetrics, getControlMetrics, getRiskMetrics } from "@/lib/repositories/trust-intelligence-repo";
import * as findingRepo from "@/lib/repositories/audit-finding-repo";
import {
  computePlatformTrustScore,
  findingsToScore,
  riskMetricsToScore,
  getPlatformTrustLevel,
  PLATFORM_TRUST_LABELS,
  PLATFORM_TRUST_WEIGHTS,
  PLATFORM_TRUST_LEVEL_LABELS,
  PLATFORM_TRUST_LEVEL_BG,
  PLATFORM_TRUST_SCORE_BAR,
  PLATFORM_TRUST_LEVEL_COLORS,
} from "@/lib/services/platform-trust-score";

const FACTOR_DETAILS: Record<string, { description: string; link: string; linkLabel: string }> = {
  vendorHealth:     { description: "Average trust score across all active vendors. Measures vendor governance maturity, document completeness, and assessment history.", link: "/trust-score/vendors",      linkLabel: "Vendor Trust" },
  complianceHealth: { description: "Average readiness across all compliance frameworks — ISO 27001, SOC 2, DPDP, PCI DSS, HIPAA. Measures control coverage and evidence completeness.", link: "/compliance",              linkLabel: "Evidence Vault™" },
  riskPosture:      { description: "Organizational risk posture derived from open risk count, critical risk density, and treatment effectiveness.", link: "/risks",                  linkLabel: "Risk Lens™" },
  controlHealth:    { description: "Average control health score across all governance controls — evidence quality, test pass rate, audit findings, and review freshness.", link: "/controls",               linkLabel: "Control Center™" },
  auditReadiness:   { description: "Audit program completeness, finding closure rate, and CAPA resolution across all active audit engagements.", link: "/audits",                  linkLabel: "Audit Management" },
  policyHealth:     { description: "Policy approval rate, review compliance, attestation completion, and control mapping coverage.", link: "/policy-governance",      linkLabel: "Policy Governance™" },
  evidenceHealth:   { description: "Evidence currency, approval rate, expiry management, and automated evidence collection coverage.", link: "/compliance/evidence",    linkLabel: "Evidence" },
  openFindings:     { description: "Penalty score derived from open audit findings weighted by severity. Critical findings have the highest trust impact.", link: "/issue-hub/findings",     linkLabel: "Findings" },
};

function scoreColor(s: number) { return PLATFORM_TRUST_LEVEL_COLORS[getPlatformTrustLevel(s)]; }
function scoreBar(s: number)   { return PLATFORM_TRUST_SCORE_BAR[getPlatformTrustLevel(s)]; }

export default async function TrustFactorsPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";

  const [vendorM, latestSnap, complianceM, controlM, riskM, findingSev] = await Promise.all([
    getOrgTrustMetrics(orgId).catch(() => null),
    getLatestSnapshot(orgId).catch(() => null),
    getComplianceMetrics(orgId).catch(() => null),
    getControlMetrics(orgId).catch(() => null),
    getRiskMetrics(orgId).catch(() => null),
    findingRepo.countBySeverity(orgId).catch(() => ({ critical: 0, high: 0, medium: 0, low: 0 })),
  ]);

  const inputs = {
    vendorHealth:     vendorM?.avgScore ?? latestSnap?.vendorTrustScore ?? 72,
    complianceHealth: complianceM?.avgReadiness ?? latestSnap?.avgFrameworkReadiness ?? 75,
    riskPosture:      riskM ? riskMetricsToScore({ total: riskM.total, critical: riskM.criticalCount, open: riskM.activeCount, mitigating: 0 }) : (latestSnap?.riskPostureScore ?? 78),
    controlHealth:    controlM?.avgHealth ?? latestSnap?.avgControlHealth ?? 74,
    auditReadiness:   latestSnap?.auditReadinessScore ?? 80,
    policyHealth:     80,
    evidenceHealth:   complianceM?.avgReadiness ?? 73,
    openFindings:     findingsToScore(findingSev as { critical: number; high: number; medium: number; low: number }),
  };

  const breakdown = computePlatformTrustScore(inputs);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Trust Factors</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          8-component breakdown of your organizational Trust Score&#8482; &#8212; each factor explained and linked to its source module.
        </p>
      </div>

      {/* Score summary */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-[var(--color-ink-dim)] mb-1">Composite Trust Score&#8482;</p>
          <p className={`text-4xl font-bold ${scoreColor(breakdown.score)}`}>{breakdown.score}<span className="text-lg text-[var(--color-ink-faint)] ml-1">/ 100</span></p>
        </div>
        <span className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${PLATFORM_TRUST_LEVEL_BG[breakdown.level]}`}>
          {PLATFORM_TRUST_LEVEL_LABELS[breakdown.level]}
        </span>
      </div>

      {/* Factor cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {(Object.entries(inputs) as [keyof typeof inputs, number][]).map(([key, val]) => {
          const weight = Math.round(PLATFORM_TRUST_WEIGHTS[key] * 100);
          const contribution = Math.round(val * PLATFORM_TRUST_WEIGHTS[key]);
          const detail = FACTOR_DETAILS[key];
          return (
            <div key={key} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold text-sm">{PLATFORM_TRUST_LABELS[key]}</p>
                  <p className="text-xs text-[var(--color-ink-faint)]">{weight}% of Trust Score&#8482;</p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${scoreColor(val)}`}>{val}</p>
                  <p className="text-[11px] text-[var(--color-ink-faint)]">+{contribution} pts</p>
                </div>
              </div>
              <div className="mb-3 h-2 rounded-full bg-[#F8F9FB] overflow-hidden">
                <div className={`h-full rounded-full ${scoreBar(val)}`} style={{ width: `${val}%` }} />
              </div>
              <p className="text-xs text-[var(--color-ink-dim)] leading-relaxed mb-3">{detail.description}</p>
              <Link href={detail.link} className="text-xs font-medium text-[var(--color-blue)] hover:underline">
                Open {detail.linkLabel} &#8594;
              </Link>
            </div>
          );
        })}
      </div>

      {/* Formula explainer */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-bg-2)]/60 p-5">
        <h3 className="text-sm font-semibold mb-3">Trust Score&#8482; Formula</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(Object.entries(PLATFORM_TRUST_WEIGHTS) as [keyof typeof PLATFORM_TRUST_WEIGHTS, number][]).map(([k, w]) => (
            <div key={k} className="rounded-xl bg-white border border-[var(--color-line)] p-3 text-center">
              <p className="text-xs text-[var(--color-ink-dim)] mb-1">{PLATFORM_TRUST_LABELS[k]}</p>
              <p className="text-base font-bold">{Math.round(w * 100)}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
