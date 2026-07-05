export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Shield } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getAsset } from "@/lib/services/asset-intelligence/asset-service";
import {
  AssetSubNav,
  CriticalityBadge,
  AssetStatusBadge,
  AssetTypeBadge,
  AssetStat,
} from "@/components/asset-intelligence/asset-ui";
import { scoreBarGradient, scoreTextColor } from "@/lib/ui/colors";

function fmt(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const SCORE_COMPONENTS: { key: string; label: string; weight: string }[] = [
  { key: "securityControls",   label: "Security Controls",   weight: "25%" },
  { key: "complianceCoverage", label: "Compliance Coverage", weight: "20%" },
  { key: "riskPosture",        label: "Risk Posture",        weight: "20%" },
  { key: "dataProtection",     label: "Data Protection",     weight: "15%" },
  { key: "operationalHealth",  label: "Operational Health",  weight: "10%" },
  { key: "monitoringCoverage", label: "Monitoring Coverage", weight: "10%" },
];

const REL_LABEL = (t: string) => t.replace(/_/g, " ");

export default async function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireUser();
  const orgId = session.org?.id ?? "";

  const data = await getAsset(orgId, id).catch(() => null);
  if (!data) notFound();

  const { asset, risks, controls, vendors, regulations, reviews, score, relationships } = data;

  const detail: { label: string; value: string }[] = [
    { label: "Category", value: asset.category ?? "—" },
    { label: "Business Unit", value: asset.businessUnit ?? "—" },
    { label: "Location", value: asset.location ?? "—" },
    { label: "Cloud Provider", value: asset.cloudProvider ?? "—" },
    { label: "Technology Stack", value: asset.technologyStack ?? "—" },
    { label: "Data Classification", value: asset.dataClass ?? "unclassified" },
    { label: "Encryption", value: asset.encryptionStatus ?? "—" },
    { label: "Recovery Time Objective", value: asset.recoveryTimeObjective ?? "—" },
    { label: "Recovery Point Objective", value: asset.recoveryPointObjective ?? "—" },
    { label: "Compliance Scope", value: asset.complianceScope?.length ? asset.complianceScope.join(", ") : "—" },
    { label: "Created", value: fmt(asset.createdAt) },
    { label: "Last Reviewed", value: fmt(asset.lastReviewAt) },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <Link href="/asset-intelligence/registry"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
          <ArrowLeft className="h-4 w-4" /> Asset Registry™
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">{asset.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <AssetTypeBadge type={asset.assetType} />
              <CriticalityBadge level={asset.criticality} />
              <AssetStatusBadge status={asset.status} />
              {asset.containsPii && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <Shield className="h-3 w-3" /> PII
                </span>
              )}
              {asset.isCrossB && (
                <span className="inline-flex items-center rounded-full border border-[var(--color-line)] px-2 py-0.5 text-xs font-medium text-[var(--color-ink-dim)]">
                  Cross-border
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <AssetSubNav />

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <AssetStat label="Trust Score" value={asset.trustScore ?? "–"} accent={asset.trustScore != null && asset.trustScore >= 90 ? "good" : asset.trustScore != null && asset.trustScore >= 70 ? "warn" : "danger"} />
        <AssetStat label="Linked Risks" value={risks.length} accent={risks.length ? "warn" : "neutral"} />
        <AssetStat label="Controls" value={controls.length} accent={controls.length ? "good" : "neutral"} />
        <AssetStat label="Vendors" value={vendors.length} accent="neutral" />
        <AssetStat label="Regulations" value={regulations.length} accent="purple" />
        <AssetStat label="Relationships" value={relationships.length} accent="neutral" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <h2 className="font-semibold text-sm mb-3">Overview</h2>
            {asset.description && <p className="text-sm text-[var(--color-ink-dim)] mb-4">{asset.description}</p>}
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {detail.map((d) => (
                <div key={d.label} className="flex flex-col">
                  <dt className="text-xs text-[var(--color-ink-dim)]">{d.label}</dt>
                  <dd className="text-sm capitalize">{d.value}</dd>
                </div>
              ))}
            </dl>
            {asset.notes && (
              <div className="mt-4 border-t border-[var(--color-line)] pt-3">
                <p className="text-xs text-[var(--color-ink-dim)] mb-1">Notes</p>
                <p className="text-sm">{asset.notes}</p>
              </div>
            )}
          </div>

          {/* Relationships */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-sm">Relationships</h2>
              <Link href="/asset-intelligence/relationships" className="text-xs text-[var(--color-blue)] hover:underline">View all →</Link>
            </div>
            {relationships.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-dim)]">No dependencies mapped for this asset.</p>
            ) : (
              <div className="space-y-2">
                {relationships.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl border border-[var(--color-line)] p-3">
                    <span className="text-xs font-medium capitalize text-[var(--color-ink)]">{REL_LABEL(r.relationshipType)}</span>
                    <span className="text-xs text-[var(--color-ink-dim)] truncate flex-1">
                      {r.targetEntityType ? `${r.targetEntityType} entity` : r.description || "Linked asset"}
                    </span>
                    {r.isCritical && <span className="text-xs font-medium text-red-500 shrink-0">Critical</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <h2 className="font-semibold text-sm mb-3">Review History</h2>
            {reviews.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-dim)]">No reviews recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {reviews.map((rv) => (
                  <div key={rv.id} className="border-b border-[var(--color-line)] last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{rv.reviewType.replace(/_/g, " ")}</span>
                      <span className="text-xs text-[var(--color-ink-dim)]">{fmt(rv.reviewedAt)}</span>
                    </div>
                    <p className="text-xs text-[var(--color-ink-dim)] mt-0.5 capitalize">Outcome: {rv.outcome.replace(/_/g, " ")}</p>
                    {rv.findings && <p className="text-sm mt-1">{rv.findings}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Trust Score breakdown */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <h2 className="font-semibold text-sm mb-1">Asset Trust Score™</h2>
            {score ? (
              <>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className={`text-3xl font-bold ${scoreTextColor(score.trustScore)}`}>{score.trustScore}</span>
                  <span className="text-xs text-[var(--color-ink-dim)]">/ 100 · updated {fmt(score.computedAt)}</span>
                </div>
                <div className="space-y-3">
                  {SCORE_COMPONENTS.map((c) => {
                    const v = (score as Record<string, unknown>)[c.key] as number ?? 0;
                    return (
                      <div key={c.key}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-[var(--color-ink-dim)]">{c.label} <span className="opacity-60">({c.weight})</span></span>
                          <span className="font-medium">{v}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#EEF2F7]">
                          <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, v))}%`, background: scoreBarGradient(v) }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-sm text-[var(--color-ink-dim)] mt-2">No score computed yet for this asset.</p>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5">
            <h2 className="font-semibold text-sm mb-2">Impact Analysis</h2>
            <p className="text-xs text-[var(--color-ink-dim)] mb-3">See how a failure of this asset propagates through dependent systems.</p>
            <Link href="/asset-intelligence/impact-analysis" className="text-sm text-[var(--color-blue)] hover:underline">Open Impact Analysis →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
