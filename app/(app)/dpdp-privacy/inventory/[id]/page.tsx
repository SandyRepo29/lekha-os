export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Globe, Calendar, User, Building2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getAssetDetail } from "@/backend/src/modules/privacy/privacy-service";
import { SensitivityBadge } from "@/components/privacy/privacy-badges";

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;

  if (session.demo || !session.org) return notFound();

  const asset = await getAssetDetail(session.org.id, id);
  if (!asset) return notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/dpdp-privacy/inventory"
          className="flex items-center gap-2 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Inventory
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
              {asset.name}
            </h1>
            {asset.description && (
              <p className="text-sm text-[var(--color-ink-dim)] mt-1">{asset.description}</p>
            )}
          </div>
          <SensitivityBadge sensitivity={asset.sensitivity} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Details */}
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold text-sm">Asset Details</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-xs text-[var(--color-ink-dim)]">Category</dt>
              <dd className="text-xs font-medium capitalize">{asset.dataCategory}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-xs text-[var(--color-ink-dim)]">Sensitivity</dt>
              <dd>
                <SensitivityBadge sensitivity={asset.sensitivity} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-xs text-[var(--color-ink-dim)]">Status</dt>
              <dd className="text-xs font-medium capitalize">{asset.status.replace("_", " ")}</dd>
            </div>
            {asset.department && (
              <div className="flex justify-between">
                <dt className="text-xs text-[var(--color-ink-dim)]">Department</dt>
                <dd className="text-xs font-medium">{asset.department}</dd>
              </div>
            )}
            {asset.ownerName && (
              <div className="flex justify-between">
                <dt className="text-xs text-[var(--color-ink-dim)]">Owner</dt>
                <dd className="text-xs font-medium">{asset.ownerName}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Processing Info */}
        <Card className="p-5 space-y-4">
          <h2 className="font-semibold text-sm">Processing Information</h2>
          <dl className="space-y-3">
            {asset.purpose && (
              <div>
                <dt className="text-xs text-[var(--color-ink-dim)] mb-1">Purpose</dt>
                <dd className="text-xs">{asset.purpose}</dd>
              </div>
            )}
            {asset.storageLocation && (
              <div className="flex justify-between">
                <dt className="text-xs text-[var(--color-ink-dim)]">Storage Location</dt>
                <dd className="text-xs font-medium">{asset.storageLocation}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-xs text-[var(--color-ink-dim)]">Retention Period</dt>
              <dd className="text-xs font-medium">
                {asset.retentionPeriod ? `${asset.retentionPeriod} days` : "Not defined"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-xs text-[var(--color-ink-dim)]">Cross-Border Transfer</dt>
              <dd className={`text-xs font-medium ${asset.crossBorder ? "text-orange-400" : "text-green-400"}`}>
                {asset.crossBorder ? "Yes — requires approval" : "No"}
              </dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* DPDP Obligations */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">DPDP Act Obligations</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              label: "Consent Required",
              value: asset.sensitivity === "high" || asset.sensitivity === "critical" ? "Yes" : "Likely",
              ok: true,
            },
            {
              label: "Retention Policy",
              value: asset.retentionPeriod ? "Defined" : "Missing",
              ok: !!asset.retentionPeriod,
            },
            {
              label: "Cross-Border Approval",
              value: asset.crossBorder ? "Required" : "N/A",
              ok: !asset.crossBorder,
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-xl border p-3 ${item.ok ? "border-green-500/20 bg-green-500/5" : "border-red-500/20 bg-red-500/5"}`}
            >
              <p className="text-xs text-[var(--color-ink-dim)]">{item.label}</p>
              <p className={`text-sm font-semibold mt-1 ${item.ok ? "text-green-400" : "text-red-400"}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
