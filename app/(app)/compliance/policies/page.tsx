export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listPolicies } from "@/lib/services/compliance/policy-service";
import { PolicyStatusBadge } from "@/components/compliance/compliance-badges";
import { ComplianceStat } from "@/components/compliance/compliance-ui";

export default async function PoliciesPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState
          icon={FileText}
          title="Policies"
          description="Connect Supabase to manage compliance policies."
        />
      </Card>
    );
  }

  const policies = await listPolicies(session.org.id);

  const approved = policies.filter((p) => p.status === "approved").length;
  const draft    = policies.filter((p) => p.status === "draft").length;
  const expired  = policies.filter((p) => p.status === "expired").length;
  const review   = policies.filter((p) => p.status === "review").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Policies</h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            {policies.length} polic{policies.length !== 1 ? "ies" : "y"} · {approved} approved
          </p>
        </div>
        <Link href="/compliance/policies/new">
          <Button variant="primary" size="sm">
            <Plus className="h-4 w-4" /> Add policy
          </Button>
        </Link>
      </div>

      {/* Stat strip */}
      {policies.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ComplianceStat label="Approved"  value={approved} color="text-emerald-400" accent={approved > 0 ? "good" : undefined} />
          <ComplianceStat label="In Review" value={review}   color="text-[var(--color-blue)]" />
          <ComplianceStat label="Draft"     value={draft} />
          <ComplianceStat label="Expired"   value={expired}  color={expired > 0 ? "text-amber-400" : undefined} accent={expired > 0 ? "warn" : undefined} />
        </div>
      )}

      {/* List */}
      {policies.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="No policies yet"
            description="Add your first compliance policy — information security, vendor management, access control and more."
            action={
              <Link href="/compliance/policies/new">
                <Button variant="primary" size="sm">
                  <Plus className="h-4 w-4" /> Add policy
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <Card>
          <div className="divide-y divide-[var(--color-line)]">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_160px_80px_100px_120px_40px] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
              <span>Policy</span>
              <span>Type</span>
              <span>Version</span>
              <span>Status</span>
              <span>Review due</span>
              <span />
            </div>

            {policies.map((p) => {
              const overdue =
                p.reviewDate &&
                new Date(p.reviewDate) < new Date() &&
                p.status !== "archived";

              return (
                <div
                  key={p.id}
                  className="grid grid-cols-[1fr_160px_80px_100px_120px_40px] items-center gap-4 px-5 py-4 transition-colors hover:bg-white"
                >
                  <div>
                    <Link
                      href={`/compliance/policies/${p.id}`}
                      className="text-sm font-medium transition-colors hover:text-[var(--color-blue)]"
                    >
                      {p.name}
                    </Link>
                    {p.owner && (
                      <p className="mt-0.5 text-xs text-[var(--color-ink-faint)]">{p.owner}</p>
                    )}
                  </div>

                  <span className="truncate text-xs text-[var(--color-ink-dim)]">
                    {p.policyType ?? "—"}
                  </span>

                  <span className="text-xs text-[var(--color-ink-dim)]">v{p.version}</span>

                  <PolicyStatusBadge status={p.status} />

                  <span
                    className={`text-xs ${
                      overdue ? "font-medium text-amber-400" : "text-[var(--color-ink-dim)]"
                    }`}
                  >
                    {p.reviewDate
                      ? new Date(p.reviewDate).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </span>

                  <Link
                    href={`/compliance/policies/${p.id}`}
                    className="text-xs text-[var(--color-ink-faint)] transition-colors hover:text-[var(--color-ink)]"
                  >
                    →
                  </Link>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
