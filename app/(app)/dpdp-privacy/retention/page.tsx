export const dynamic = "force-dynamic";

import { Clock, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listRetentionPolicies } from "@/lib/services/privacy/privacy-service";

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
        <form action="/api/v1/privacy/retention" method="POST" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-xs font-medium mb-1.5">Policy Name</label>
            <input
              name="name"
              required
              placeholder="e.g. Customer Data Retention"
              className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Data Category</label>
            <select
              name="dataCategory"
              className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
              {["customer", "employee", "vendor", "marketing", "financial", "health", "biometric", "custom"].map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Retention Days</label>
            <input
              name="retentionDays"
              type="number"
              min={1}
              required
              placeholder="e.g. 730"
              className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Legal Basis</label>
            <input
              name="legalBasis"
              placeholder="e.g. Contractual obligation, statutory requirement"
              className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5">Action on Expiry</label>
            <select
              name="actionOnExpiry"
              className="w-full rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
              <option value="delete">Delete</option>
              <option value="anonymize">Anonymize</option>
              <option value="archive">Archive</option>
              <option value="review">Flag for Review</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full">
              <Plus className="h-4 w-4" /> Add Policy
            </Button>
          </div>
        </form>
        <p className="text-xs text-[var(--color-ink-dim)] mt-3">
          Note: Saving requires the retention policy API endpoint. Use the server action for form submissions.
        </p>
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
                    className="border-b border-[var(--color-line)]/50 hover:bg-white/[0.02] transition-colors"
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
