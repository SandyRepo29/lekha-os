export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Database } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listAssets } from "@/lib/services/privacy/privacy-service";
import {
  SensitivityBadge,
  AssetStatusBadge,
} from "@/components/privacy/privacy-badges";

export default async function DataInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; sensitivity?: string }>;
}) {
  const session = await requireUser();
  if (session.demo || !session.org) {
    return (
      <EmptyState
        icon={Database}
        title="Data Inventory™"
        description="Connect Supabase to view your data assets."
      />
    );
  }

  const params = await searchParams;
  const assets = await listAssets(session.org.id, {
    status: params.status,
    category: params.category,
    sensitivity: params.sensitivity,
  });

  const categories = [
    "customer",
    "employee",
    "vendor",
    "marketing",
    "financial",
    "health",
    "biometric",
    "custom",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Data Inventory™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            Personal data assets under DPDP Act 2023 obligations
          </p>
        </div>
        <Link href="/dpdp-privacy/inventory/new">
          <Button>
            <Plus className="h-4 w-4" /> New Asset
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: "All", href: "/dpdp-privacy/inventory" },
          { label: "Active", href: "/dpdp-privacy/inventory?status=active" },
          { label: "Under Review", href: "/dpdp-privacy/inventory?status=under_review" },
        ].map((f) => (
          <Link
            key={f.label}
            href={f.href}
            className="rounded-full border border-[var(--color-line)] bg-white/[0.03] px-3 py-1 text-xs hover:bg-white/[0.07] transition-colors"
          >
            {f.label}
          </Link>
        ))}
        <span className="text-xs text-[var(--color-ink-dim)] self-center ml-2">
          Category:
        </span>
        {categories.map((cat) => (
          <Link
            key={cat}
            href={`/dpdp-privacy/inventory?category=${cat}`}
            className="rounded-full border border-[var(--color-line)] bg-white/[0.03] px-3 py-1 text-xs capitalize hover:bg-white/[0.07] transition-colors"
          >
            {cat}
          </Link>
        ))}
      </div>

      {assets.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No data assets yet"
          description="Add your first data asset to begin your DPDP data inventory."
          action={
            <Link href="/dpdp-privacy/inventory/new">
              <Button>
                <Plus className="h-4 w-4" /> Add Asset
              </Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-xs text-[var(--color-ink-dim)]">
                  <th className="px-4 py-3 text-left font-medium">Asset</th>
                  <th className="px-4 py-3 text-left font-medium">Category</th>
                  <th className="px-4 py-3 text-left font-medium">Sensitivity</th>
                  <th className="px-4 py-3 text-left font-medium">Department</th>
                  <th className="px-4 py-3 text-left font-medium">Retention</th>
                  <th className="px-4 py-3 text-left font-medium">Cross-Border</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="border-b border-[var(--color-line)]/50 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dpdp-privacy/inventory/${asset.id}`}
                        className="font-medium text-[var(--color-ink)] hover:text-indigo-400 transition-colors"
                      >
                        {asset.name}
                      </Link>
                      {asset.description && (
                        <p className="text-xs text-[var(--color-ink-dim)] truncate max-w-[200px] mt-0.5">
                          {asset.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize text-[var(--color-ink-dim)]">
                      {asset.dataCategory}
                    </td>
                    <td className="px-4 py-3">
                      <SensitivityBadge sensitivity={asset.sensitivity} />
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-dim)]">
                      {asset.department ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-dim)]">
                      {asset.retentionPeriod ? `${asset.retentionPeriod}d` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {asset.crossBorder ? (
                        <span className="text-amber-400 font-medium text-xs">Yes</span>
                      ) : (
                        <span className="text-[var(--color-ink-dim)] text-xs">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <AssetStatusBadge status={asset.status} />
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
