export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, History } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getPolicy } from "@/lib/services/compliance/policy-service";
import { PolicyStatusBadge } from "@/components/compliance/policy-status-badge";
import { PolicyWorkflowButtons, DeletePolicy } from "@/components/compliance/policy-actions";

export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireUser();
  if (session.demo || !session.org) notFound();

  const policy = await getPolicy(session.org.id, id);
  if (!policy) notFound();

  const fmt = (d: string | null) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "—";

  const isOverdue =
    policy.reviewDate &&
    new Date(policy.reviewDate) < new Date() &&
    policy.status !== "archived" &&
    policy.status !== "expired";

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link
        href="/compliance/policies"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Policies
      </Link>

      {/* Header */}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
                {policy.name}
              </h1>
              <PolicyStatusBadge status={policy.status} />
              <span className="text-sm text-[var(--color-ink-faint)]">v{policy.version}</span>
            </div>
            {policy.policyType && (
              <p className="text-sm text-[var(--color-ink-dim)]">{policy.policyType}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PolicyWorkflowButtons policyId={id} currentStatus={policy.status} />
            <DeletePolicy policyId={id} policyName={policy.name} />
          </div>
        </div>

        {/* Metadata grid */}
        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4 border-t border-[var(--color-line)] pt-4">
          <MetaField label="Owner" value={policy.owner ?? "—"} />
          <MetaField
            label="Review due"
            value={fmt(policy.reviewDate)}
            warn={!!isOverdue}
          />
          <MetaField label="Approved on" value={fmt(policy.approvalDate)} />
          <MetaField label="Approver" value={policy.approver ?? "—"} />
        </div>
      </Card>

      {/* Workflow hint */}
      {policy.status !== "approved" && policy.status !== "archived" && (
        <div className="rounded-xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/[0.04] p-4 text-sm text-[var(--color-ink-dim)]">
          <span className="font-medium text-[var(--color-ink)]">Workflow: </span>
          Draft → Submit for review → Approve → Archive
          {policy.status === "draft" && " · Currently in Draft — submit for review when ready."}
          {policy.status === "review" && " · Currently in Review — approve or return to draft."}
        </div>
      )}

      {/* Version history */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <History className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <h2 className="font-[family-name:var(--font-display)] text-base font-semibold">
            Version history
            <span className="ml-2 text-sm font-normal text-[var(--color-ink-faint)]">
              ({policy.versions.length})
            </span>
          </h2>
        </div>

        {policy.versions.length === 0 ? (
          <Card className="p-5">
            <p className="text-sm text-[var(--color-ink-dim)]">
              No version records yet. Versions are created automatically when you upload
              a new document.
            </p>
          </Card>
        ) : (
          <Card>
            <div className="divide-y divide-[var(--color-line)]">
              <div className="grid grid-cols-[80px_1fr_140px_140px] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
                <span>Version</span>
                <span>Notes</span>
                <span>Approved</span>
                <span>Created</span>
              </div>
              {policy.versions.map((v) => (
                <div
                  key={v.id}
                  className="grid grid-cols-[80px_1fr_140px_140px] items-center gap-4 px-5 py-3"
                >
                  <span className="font-mono text-sm text-[var(--color-ink)]">v{v.version}</span>
                  <span className="text-sm text-[var(--color-ink-dim)]">{v.notes ?? "—"}</span>
                  <span className="text-xs text-[var(--color-ink-dim)]">
                    {v.approvedAt ? fmt(v.approvedAt.toString().split("T")[0]) : "—"}
                  </span>
                  <span className="text-xs text-[var(--color-ink-faint)]">
                    {fmt(v.createdAt.toString().split("T")[0])}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function MetaField({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-[var(--color-ink-faint)]">{label}</p>
      <p className={`mt-0.5 text-sm font-medium ${warn ? "text-amber-400" : "text-[var(--color-ink)]"}`}>
        {value}
        {warn && " ⚠"}
      </p>
    </div>
  );
}
