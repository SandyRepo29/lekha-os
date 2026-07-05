export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, ArrowLeft, Shield, Users, BookOpen, Activity, GitBranch, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getPolicyDetail } from "@/lib/services/policy-governance/policy-governance-service";
import { PolicyHealthBadge } from "@/components/policy-governance/policy-health-badge";
import { PolicyStatusBadge, AttestationStatusBadge } from "@/components/policy-governance/policy-status-badge";
import { PolicyDetailActions } from "@/components/policy-governance/policy-detail-actions";
import {
  POLICY_HEALTH_COMPONENT_LABELS,
  POLICY_HEALTH_COMPONENT_WEIGHTS,
} from "@/lib/services/policy-health";

export default async function PolicyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const activeTab = sp.tab ?? "overview";

  if (!session.org) return notFound();

  const policy = await getPolicyDetail(session.org.id, id);
  if (!policy) return notFound();

  const tabs = [
    { key: "overview", label: "Overview", icon: FileText },
    { key: "versions", label: "Versions", icon: GitBranch },
    { key: "controls", label: "Controls", icon: Shield },
    { key: "frameworks", label: "Frameworks", icon: BookOpen },
    { key: "risks", label: "Risks", icon: AlertTriangle },
    { key: "attestations", label: "Attestations", icon: Users },
    { key: "reviews", label: "Reviews", icon: CheckCircle2 },
    { key: "activity", label: "Activity", icon: Activity },
  ];

  const healthComponents = policy.healthScore
    ? Object.entries(POLICY_HEALTH_COMPONENT_LABELS).map(([key, label]) => {
        const weight = POLICY_HEALTH_COMPONENT_WEIGHTS[key as keyof typeof POLICY_HEALTH_COMPONENT_WEIGHTS];
        return { key, label, weight: Math.round(weight * 100) };
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/policy-governance/library" className="text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Library
          </Link>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">{policy.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <PolicyStatusBadge status={policy.status} />
            <PolicyHealthBadge score={policy.healthScore ?? null} />
            <span className="text-xs text-[var(--color-ink-dim)]">v{policy.version}</span>
            {policy.policyType && (
              <span className="text-xs text-[var(--color-ink-dim)]">· {policy.policyType}</span>
            )}
          </div>
        </div>
        <PolicyDetailActions policyId={id} status={policy.status} />
      </div>

      {/* AI Summary panel — always visible above tabs */}
      {policy.description && (
        <Card className="p-5 border-l-2 border-l-indigo-500/40 bg-indigo-500/[0.03]">
          <h3 className="font-semibold text-sm text-indigo-300 mb-1">Policy Summary</h3>
          <p className="text-sm text-[var(--color-ink-dim)] whitespace-pre-wrap">{policy.description}</p>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-line)]">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/policy-governance/${id}?tab=${tab.key}`}
            className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-indigo-500 text-[var(--color-ink)]"
                : "text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Coverage numbers */}
          <Card className="p-5 sm:col-span-2">
            <h3 className="font-semibold mb-3">Coverage</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-400">{policy.controlCount}</p>
                <p className="text-xs text-[var(--color-ink-dim)]">Controls Linked</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-400">{policy.frameworkCount}</p>
                <p className="text-xs text-[var(--color-ink-dim)]">Frameworks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-400">{policy.linkedRisks.length}</p>
                <p className="text-xs text-[var(--color-ink-dim)]">Linked Risks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">{policy.attestations.length}</p>
                <p className="text-xs text-[var(--color-ink-dim)]">Attestations</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="font-semibold">Policy Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-dim)]">Status</dt>
                <dd><PolicyStatusBadge status={policy.status} /></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-dim)]">Version</dt>
                <dd className="font-medium">{policy.version}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-dim)]">Owner</dt>
                <dd>{policy.ownerName ?? policy.owner ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-dim)]">Effective Date</dt>
                <dd>{policy.effectiveDate ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-dim)]">Last Review</dt>
                <dd>{policy.reviewDate ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-dim)]">Next Review</dt>
                <dd>{policy.nextReviewDate ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-dim)]">Audience</dt>
                <dd className="capitalize">{policy.audience ?? "everyone"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[var(--color-ink-dim)]">Attestation Required</dt>
                <dd>{policy.attestationRequired ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-5 space-y-3">
            <h3 className="font-semibold">Policy Health™</h3>
            <div className="flex items-center justify-between mb-2">
              <PolicyHealthBadge score={policy.healthScore ?? null} showScore />
            </div>
            <div className="space-y-2">
              {healthComponents.map(({ key, label, weight }) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[var(--color-ink-dim)]">{label}</span>
                    <span className="text-[var(--color-ink-dim)]">{weight}% weight</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-indigo-500/60"
                      style={{ width: `${policy.healthScore ?? 0}%` }}
                    />
                  </div>
                </div>
              ))}
              {!policy.healthScore && (
                <p className="text-xs text-[var(--color-ink-dim)]">Run health computation to see breakdown.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "versions" && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Version History</h3>
          {policy.versions.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No version snapshots yet.</p>
          ) : (
            <div className="space-y-3">
              {policy.versions.map((v) => (
                <div key={v.id} className="flex items-start justify-between rounded-xl border border-[var(--color-line)] p-3">
                  <div>
                    <p className="font-medium text-sm">v{v.version}</p>
                    {v.notes && <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">{v.notes}</p>}
                    <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">
                      By {v.creatorName ?? "Unknown"} · {v.createdAt ? new Date(v.createdAt).toLocaleDateString() : ""}
                    </p>
                  </div>
                  {v.approvedAt && (
                    <span className="text-xs text-emerald-400">Approved {new Date(v.approvedAt).toLocaleDateString()}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "controls" && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Linked Controls ({policy.linkedControls.length})</h3>
          {policy.linkedControls.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No controls linked.</p>
          ) : (
            <div className="space-y-2">
              {policy.linkedControls.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-xl border border-[var(--color-line)] p-3">
                  <div>
                    <span className="text-xs text-[var(--color-ink-dim)] font-mono mr-2">{c.controlRef}</span>
                    <span className="text-sm font-medium">{c.name}</span>
                  </div>
                  <span className="text-xs text-[var(--color-ink-dim)] capitalize">{c.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "frameworks" && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Linked Frameworks ({policy.linkedFrameworks.length})</h3>
          {policy.linkedFrameworks.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No frameworks linked.</p>
          ) : (
            <div className="space-y-2">
              {policy.linkedFrameworks.map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded-xl border border-[var(--color-line)] p-3">
                  <span className="text-sm font-medium">{f.name}</span>
                  <span className="text-xs text-[var(--color-ink-dim)] capitalize">{f.status.replace("_", " ")}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "risks" && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Linked Risks ({policy.linkedRisks.length})</h3>
          {policy.linkedRisks.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No risks linked.</p>
          ) : (
            <div className="space-y-2">
              {policy.linkedRisks.map((r) => (
                <Link key={r.id} href={`/risks/${r.id}`} className="flex items-center justify-between rounded-xl border border-[var(--color-line)] p-3 hover:bg-white transition-colors">
                  <span className="text-sm font-medium">{r.title}</span>
                  <span className="text-xs text-[var(--color-ink-dim)] capitalize">{r.status}</span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "attestations" && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Attestations ({policy.attestations.length})</h3>
          {policy.attestations.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No attestations assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {policy.attestations.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-xl border border-[var(--color-line)] p-3">
                  <div>
                    <p className="text-sm font-medium">{a.userName ?? a.userEmail ?? "Unknown User"}</p>
                    {a.dueDate && <p className="text-xs text-[var(--color-ink-dim)]">Due: {a.dueDate}</p>}
                  </div>
                  <AttestationStatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "reviews" && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Review History ({policy.reviews.length})</h3>
          {policy.reviews.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No reviews recorded.</p>
          ) : (
            <div className="space-y-2">
              {policy.reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-[var(--color-line)] p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium capitalize">{r.outcome.replace("_", " ")}</span>
                    <span className="text-xs text-[var(--color-ink-dim)]">{r.reviewDate}</span>
                  </div>
                  {r.notes && <p className="text-xs text-[var(--color-ink-dim)]">{r.notes}</p>}
                  <p className="text-xs text-[var(--color-ink-dim)] mt-1">
                    By {r.reviewerName ?? "Unknown"}{r.nextReviewDate ? ` · Next review: ${r.nextReviewDate}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === "activity" && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Activity</h3>
          <p className="text-sm text-[var(--color-ink-dim)]">Policy activity is tracked in the org audit log.</p>
          <Link href="/settings/audit-logs" className="text-sm text-indigo-400 hover:underline mt-2 inline-block">
            View Audit Logs →
          </Link>
        </Card>
      )}
    </div>
  );
}
