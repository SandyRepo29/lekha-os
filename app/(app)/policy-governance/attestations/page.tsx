export const dynamic = "force-dynamic";

import Link from "next/link";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { findAttestationsByOrg } from "@/lib/repositories/policy-governance-repo";
import { AttestationStatusBadge } from "@/components/policy-governance/policy-status-badge";

export default async function PolicyAttestationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; policyId?: string }>;
}) {
  const session = await requireUser();
  const sp = await searchParams;

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={Users} title="Attestations" description="Connect Supabase to view attestations." />
      </Card>
    );
  }

  const attestations = await findAttestationsByOrg(session.org.id, {
    status: sp.status,
    policyId: sp.policyId,
  });

  const pending = attestations.filter((a) => a.attestation.status === "pending").length;
  const acknowledged = attestations.filter((a) => a.attestation.status === "acknowledged").length;
  const overdue = attestations.filter((a) => a.attestation.status === "overdue").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold">Policy Attestations</h2>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            {attestations.length} attestation{attestations.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-4 text-sm">
          <span className="text-yellow-400">{pending} Pending</span>
          <span className="text-green-400">{acknowledged} Acknowledged</span>
          {overdue > 0 && <span className="text-red-400">{overdue} Overdue</span>}
        </div>
      </div>

      {/* Filter */}
      <form className="flex flex-wrap gap-3">
        <select name="status" defaultValue={sp.status ?? ""} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none">
          <option value="">All Statuses</option>
          {["pending", "acknowledged", "rejected", "overdue"].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <button type="submit" className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] px-4 py-2 text-sm hover:bg-white/[0.04]">
          Filter
        </button>
      </form>

      {attestations.length === 0 ? (
        <Card>
          <EmptyState icon={Users} title="No attestations" description="Assign attestations from a policy detail page." />
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] bg-white/[0.02]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Policy</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">User</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Due Date</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Acknowledged</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Version</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {attestations.map(({ attestation, userName, userEmail, policyName }) => (
                  <tr key={attestation.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/policy-governance/${attestation.policyId}?tab=attestations`} className="font-medium hover:text-indigo-400 transition-colors">
                        {policyName ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{userName ?? "—"}</p>
                      {userEmail && <p className="text-xs text-[var(--color-ink-dim)]">{userEmail}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <AttestationStatusBadge status={attestation.status} />
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-dim)]">{attestation.dueDate ?? "—"}</td>
                    <td className="px-4 py-3 text-[var(--color-ink-dim)]">
                      {attestation.acknowledgedAt ? new Date(attestation.acknowledgedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-dim)]">{attestation.policyVersion ?? "—"}</td>
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
