export const dynamic = "force-dynamic";

import Link from "next/link";
import { RefreshCw, Calendar, Building2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listContracts } from "@/lib/services/contract-governance/contract-service";

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(d: string | null | undefined) {
  if (!d) return null;
  return Math.floor((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function RenewalsPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={RefreshCw} title="Renewals" description="Connect Supabase to track contract renewals." />
      </Card>
    );
  }

  const allContracts = await listContracts(session.org.id);
  const today = new Date().toISOString().split("T")[0];

  // Sort by expiry date ascending, filter out archived/terminated
  const renewableContracts = allContracts
    .filter((c) => !["archived", "terminated"].includes(c.status))
    .sort((a, b) => {
      const da = a.expiryDate ?? "9999-12-31";
      const db = b.expiryDate ?? "9999-12-31";
      return da < db ? -1 : 1;
    });

  const expiredCount = renewableContracts.filter((c) => c.expiryDate && c.expiryDate < today).length;
  const expiringCount = renewableContracts.filter((c) => {
    const d = daysUntil(c.expiryDate);
    return d !== null && d >= 0 && d <= 90;
  }).length;
  const healthyCount = renewableContracts.filter((c) => {
    const d = daysUntil(c.expiryDate);
    return d === null || d > 90;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Contract Renewals</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">Sorted by expiry date — act before notice period expires</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div>
            <p className="text-xl font-bold text-red-400">{expiredCount}</p>
            <p className="text-xs text-[var(--color-ink-dim)]">Expired</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <Calendar className="h-5 w-5 text-yellow-400" />
          <div>
            <p className="text-xl font-bold text-yellow-400">{expiringCount}</p>
            <p className="text-xs text-[var(--color-ink-dim)]">Expiring (90d)</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-400" />
          <div>
            <p className="text-xl font-bold text-green-400">{healthyCount}</p>
            <p className="text-xs text-[var(--color-ink-dim)]">Healthy</p>
          </div>
        </Card>
      </div>

      {renewableContracts.length === 0 ? (
        <Card>
          <EmptyState icon={RefreshCw} title="No contracts" description="Add contracts to track renewal timelines." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Contract</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Vendor</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Expiry</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Notice Period</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Action Deadline</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Auto-Renew</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {renewableContracts.map((c) => {
                  const days = daysUntil(c.expiryDate);
                  const isExpired = days !== null && days < 0;
                  const isExpiring = days !== null && days >= 0 && days <= 90;

                  // Action deadline = expiry - notice period
                  let actionDeadline: string | null = null;
                  if (c.expiryDate) {
                    const d = new Date(c.expiryDate);
                    d.setDate(d.getDate() - c.noticePeriodDays);
                    actionDeadline = d.toISOString().split("T")[0];
                  }
                  const actionDays = daysUntil(actionDeadline);

                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/contract-governance/${c.id}`} className="font-medium hover:text-indigo-400 transition-colors">
                          {c.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-ink-dim)]">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          {c.vendorName ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={isExpired ? "text-red-400" : isExpiring ? "text-yellow-400" : ""}>
                          {formatDate(c.expiryDate)}
                        </span>
                        {days !== null && (
                          <span className={`ml-1 text-xs ${isExpired ? "text-red-400" : isExpiring ? "text-yellow-400" : "text-[var(--color-ink-dim)]"}`}>
                            {isExpired ? `(${Math.abs(days)}d ago)` : `(${days}d)`}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-ink-dim)]">
                        {c.noticePeriodDays} days
                      </td>
                      <td className="px-4 py-3">
                        <span className={actionDays !== null && actionDays <= 0 ? "text-red-400" : actionDays !== null && actionDays <= 14 ? "text-orange-400" : ""}>
                          {formatDate(actionDeadline)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {c.autoRenewal ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">Auto</span>
                        ) : (
                          <span className="text-xs text-[var(--color-ink-dim)]">Manual</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
