export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, FileSignature, Building2, Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listContracts } from "@/lib/services/contract-governance/contract-service";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-slate-500/20 text-slate-400",
  review: "bg-yellow-500/20 text-yellow-400",
  negotiation: "bg-orange-500/20 text-orange-400",
  active: "bg-green-500/20 text-green-400",
  expiring: "bg-amber-500/20 text-amber-400",
  expired: "bg-red-500/20 text-red-400",
  renewed: "bg-blue-500/20 text-blue-400",
  terminated: "bg-red-700/20 text-red-600",
  archived: "bg-gray-500/20 text-gray-400",
};

const TYPE_LABELS: Record<string, string> = {
  vendor_agreement: "Vendor Agreement",
  msa: "MSA",
  sow: "SOW",
  nda: "NDA",
  dpa: "DPA",
  employment: "Employment",
  partner_agreement: "Partner Agreement",
  procurement: "Procurement",
  custom: "Custom",
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(d: string | null | undefined) {
  if (!d) return null;
  return Math.floor((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function ContractLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; contractType?: string; search?: string }>;
}) {
  const session = await requireUser();
  const sp = await searchParams;

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState icon={FileSignature} title="Contract Library" description="Connect Supabase to view contracts." />
      </Card>
    );
  }

  const contracts = await listContracts(session.org.id, {
    status: sp.status,
    contractType: sp.contractType,
    search: sp.search,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Contract Library</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">{contracts.length} contract{contracts.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/contract-governance/new">
          <Button><Plus className="h-4 w-4" /> New Contract</Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="p-4 flex flex-wrap gap-3">
        {["", "active", "expiring", "expired", "draft", "review"].map((s) => (
          <Link
            key={s}
            href={`/contract-governance/library${s ? `?status=${s}` : ""}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              (sp.status ?? "") === s
                ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/40"
                : "bg-white/5 text-[var(--color-ink-dim)] hover:bg-white/10"
            }`}
          >
            {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </Card>

      {contracts.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileSignature}
            title="No contracts found"
            description="Add your first contract to start tracking your portfolio."
          />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Vendor</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Expiry</th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--color-ink-dim)]">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {contracts.map((c) => {
                  const days = daysUntil(c.expiryDate);
                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/contract-governance/${c.id}`} className="font-medium hover:text-indigo-400 transition-colors">
                          {c.title}
                        </Link>
                        {c.ownerName && (
                          <p className="text-xs text-[var(--color-ink-dim)]">{c.ownerName}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-[var(--color-ink-dim)]">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>{c.vendorName ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--color-ink-dim)]">
                        {TYPE_LABELS[c.contractType] ?? c.contractType}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] ?? "bg-slate-500/20 text-slate-400"}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-[var(--color-ink-dim)]" />
                          <span className={days !== null && days <= 30 && days >= 0 ? "text-red-400" : ""}>
                            {formatDate(c.expiryDate)}
                          </span>
                          {days !== null && days >= 0 && days <= 90 && (
                            <span className="text-xs text-yellow-400">({days}d)</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {c.trustScore !== null && c.trustScore !== undefined ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              c.trustScore >= 80
                                ? "bg-green-500/20 text-green-400"
                                : c.trustScore >= 60
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {c.trustScore}/100
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--color-ink-dim)]">—</span>
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
