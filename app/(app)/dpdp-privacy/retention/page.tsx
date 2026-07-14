export const dynamic = "force-dynamic";

import { Clock, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listRetentionPolicies } from "@/backend/src/modules/privacy/privacy-service";
import { NewRetentionForm } from "@/components/privacy/new-retention-form";

export default async function RetentionPage() {
  const session = await requireUser();
  if (session.demo || !session.org) {
    return <EmptyState icon={Clock} title="Retention Management™" description="Connect Supabase to manage retention policies." />;
  }

  const policies = await listRetentionPolicies(session.org.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Retention Management™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            Data retention policies — storage limitation under DPDP Act 2023
          </p>
        </div>
      </div>

      {/* Add Policy Form inline */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4 text-indigo-400" /> Add Retention Policy
        </h2>
        <NewRetentionForm />
      </Card>

      {/* Policies list */}
      {policies.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No retention policies"
          description="Define retention policies for each data category to comply with DPDP Act 2023 storage limitation obligations."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-xs text-[var(--color-ink-dim)]">
                  <th className="px-4 py-3 text-left font-medium">Policy Name</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Retention</th>
                  <th className="px-4 py-3 text-left font-medium">Legal Basis</th>
                  <th className="px-4 py-3 text-left font-medium">On Expiry</th>
                  <th className="px-4 py-3 text-left font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {policies.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-[var(--color-line)]/50 hover:bg-white transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 capitalize text-[var(--color-ink-dim)]">
                      {p.dataCategory}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-dim)]">
                      {p.retentionDays} days ({Math.round(p.retentionDays / 365 * 10) / 10}y)
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)] max-w-[200px] truncate">
                      {p.legalBasis ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs capitalize text-[var(--color-ink-dim)]">
                      {p.actionOnExpiry}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${p.isActive ? "text-green-400" : "text-slate-400"}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
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
