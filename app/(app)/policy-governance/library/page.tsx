export const dynamic = "force-dynamic";

import Link from "next/link";
import { FileText, Plus, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listPolicies } from "@/backend/src/modules/policy-governance/policy-governance-service";
import { PolicyHealthBadge } from "@/components/policy-governance/policy-health-badge";
import { PolicyStatusBadge } from "@/components/policy-governance/policy-status-badge";
import { NewPolicyForm } from "@/components/policy-governance/new-policy-form";

const POLICY_TYPE_LABELS: Record<string, string> = {
  information_security: "Information Security",
  privacy: "Privacy",
  vendor_management: "Vendor Management",
  data_retention: "Data Retention",
  access_control: "Access Control",
  acceptable_use: "Acceptable Use",
  business_continuity: "Business Continuity",
  incident_response: "Incident Response",
  hr: "Human Resources",
  finance: "Finance",
  custom: "Custom",
};

export default async function PolicyLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; policyType?: string; search?: string; new?: string }>;
}) {
  const session = await requireUser();
  const sp = await searchParams;

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={FileText} title="Policy Library" description="Connect Supabase to manage policies." />
      </Card>
    );
  }

  const policies = await listPolicies(session.org.id, {
    status: sp.status,
    policyType: sp.policyType,
    search: sp.search,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Policy Library</h2>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            {policies.length} polic{policies.length === 1 ? "y" : "ies"}
          </p>
        </div>
        <Link href="/policy-governance/library?new=1">
          <Button><Plus className="h-4 w-4" /> New Policy</Button>
        </Link>
      </div>

      {/* New policy form */}
      {sp.new === "1" && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Create New Policy</h3>
          <NewPolicyForm />
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <form className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-ink-dim)]" />
            <input
              name="search"
              defaultValue={sp.search}
              placeholder="Search policies…"
              className="pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <select name="status" defaultValue={sp.status ?? ""} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none">
            <option value="">All Statuses</option>
            {["draft","review","approved","published","expired","archived","retired"].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select name="policyType" defaultValue={sp.policyType ?? ""} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none">
            <option value="">All Types</option>
            {Object.entries(POLICY_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <Button type="submit" variant="outline" size="sm">Filter</Button>
        </form>
      </div>

      {/* Table */}
      {policies.length === 0 ? (
        <Card>
          <EmptyState icon={FileText} title="No policies found" description="Create your first policy to get started." />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] bg-white">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Policy Name</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Owner</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Version</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Next Review</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {policies.map((p) => (
                  <tr key={p.id} className="hover:bg-white transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/policy-governance/${p.id}`} className="font-medium hover:text-indigo-400 transition-colors">
                        {p.name}
                      </Link>
                      {p.description && (
                        <p className="text-xs text-[var(--color-ink-dim)] truncate max-w-xs mt-0.5">{p.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-dim)]">
                      {p.policyType ? (POLICY_TYPE_LABELS[p.policyType] ?? p.policyType) : "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-dim)]">
                      {p.ownerName ?? p.owner ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <PolicyStatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-dim)]">{p.version}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-dim)]">
                      {p.nextReviewDate ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <PolicyHealthBadge score={p.healthScore ? p.healthScore : null} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
