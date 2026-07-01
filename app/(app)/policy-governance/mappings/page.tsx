export const dynamic = "force-dynamic";

import Link from "next/link";
import { Network, Shield, GitBranch, FileText, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { findPoliciesByOrg } from "@/lib/repositories/policy-governance-repo";
import { PolicyStatusBadge } from "@/components/policy-governance/policy-status-badge";

export default async function PolicyMappingsPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={Network} title="Policy Mapping Engine™" description="Connect Supabase to view policy mappings." />
      </Card>
    );
  }

  const policies = await findPoliciesByOrg(session.org.id);

  const activePolicies = policies.filter(
    (p) => !["retired", "archived"].includes(p.status)
  );

  const mapped = activePolicies.filter((p) => p.controlCount > 0 || p.frameworkCount > 0);
  const unmapped = activePolicies.filter((p) => p.controlCount === 0 && p.frameworkCount === 0);

  const totalControlLinks = activePolicies.reduce((s, p) => s + p.controlCount, 0);
  const totalFrameworkLinks = activePolicies.reduce((s, p) => s + p.frameworkCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
          Policy Mapping Engine™
        </h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
          View how policies connect to controls, frameworks, and other governance entities
        </p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Active Policies", value: activePolicies.length, color: "text-[var(--color-ink)]" },
          { label: "Mapped Policies", value: mapped.length, color: "text-emerald-400" },
          { label: "Control Links", value: totalControlLinks, color: "text-indigo-400" },
          { label: "Framework Links", value: totalFrameworkLinks, color: "text-blue-400" },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs text-[var(--color-ink-dim)] mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Unmapped alert */}
      {unmapped.length > 0 && (
        <Card className="p-4 border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-400">
                {unmapped.length} {unmapped.length === 1 ? "policy" : "policies"} not mapped to any control or framework
              </p>
              <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">
                Unmapped policies have no direct governance linkage. Open each policy to add control or framework mappings.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Mapping table */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-[var(--color-line)]">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Network className="h-4 w-4 text-indigo-400" />
            Policy — Entity Mapping
          </h2>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">
            All active policies with their linked controls and frameworks
          </p>
        </div>

        {activePolicies.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={FileText} title="No policies yet" description="Create your first policy to start building governance mappings." />
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {activePolicies.map((policy) => (
              <div key={policy.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/policy-governance/${policy.id}`}
                    className="text-sm font-medium hover:text-[var(--color-blue)] transition-colors truncate block"
                  >
                    {policy.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <PolicyStatusBadge status={policy.status} />
                    {policy.policyType && (
                      <span className="text-xs text-[var(--color-ink-faint)]">{policy.policyType}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Controls */}
                  <div className="flex items-center gap-1.5 text-sm">
                    <Shield className="h-3.5 w-3.5 text-indigo-400" />
                    <span className={policy.controlCount > 0 ? "font-semibold text-indigo-400" : "text-[var(--color-ink-faint)]"}>
                      {policy.controlCount}
                    </span>
                    <span className="text-xs text-[var(--color-ink-faint)]">controls</span>
                  </div>

                  {/* Frameworks */}
                  <div className="flex items-center gap-1.5 text-sm">
                    <GitBranch className="h-3.5 w-3.5 text-blue-400" />
                    <span className={policy.frameworkCount > 0 ? "font-semibold text-blue-400" : "text-[var(--color-ink-faint)]"}>
                      {policy.frameworkCount}
                    </span>
                    <span className="text-xs text-[var(--color-ink-faint)]">frameworks</span>
                  </div>

                  {/* Coverage indicator */}
                  {policy.controlCount === 0 && policy.frameworkCount === 0 ? (
                    <span className="text-xs bg-amber-500/10 text-amber-400 rounded-full px-2 py-0.5 font-medium">
                      Unmapped
                    </span>
                  ) : (
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 rounded-full px-2 py-0.5 font-medium">
                      Mapped
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Unmapped section */}
      {unmapped.length > 0 && (
        <Card className="p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Unmapped Policies
          </h2>
          <div className="space-y-2">
            {unmapped.map((policy) => (
              <div key={policy.id} className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-white">
                <div className="min-w-0">
                  <Link
                    href={`/policy-governance/${policy.id}`}
                    className="text-sm font-medium hover:text-[var(--color-blue)] transition-colors"
                  >
                    {policy.name}
                  </Link>
                  <PolicyStatusBadge status={policy.status} className="mt-0.5" />
                </div>
                <Link href={`/policy-governance/${policy.id}`}>
                  <span className="text-xs text-[var(--color-blue)] hover:underline">Add mappings →</span>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
