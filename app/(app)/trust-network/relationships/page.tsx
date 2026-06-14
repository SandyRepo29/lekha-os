export const dynamic = "force-dynamic";

import Link from "next/link";
import { Users, Network, ArrowRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getTrustRelationships } from "@/lib/services/trust-network/trust-network-service";
import { RelationshipTypeBadge, NetworkStatusBadge, TrustNetworkStat } from "@/components/trust-network/trust-network-ui";

const STATUS_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  active:     { icon: CheckCircle2, color: "text-emerald-400" },
  pending:    { icon: Clock,        color: "text-amber-400"   },
  terminated: { icon: XCircle,      color: "text-red-400"     },
};

export default async function TrustRelationshipsPage() {
  const session = await requireUser();
  if (!session.org) return null;
  const orgId = session.org.id;

  const relationships = await getTrustRelationships(orgId);

  const byType = relationships.reduce<Record<string, number>>((acc, r) => {
    acc[r.relationshipType] = (acc[r.relationshipType] ?? 0) + 1;
    return acc;
  }, {});

  const active = relationships.filter((r) => r.status === "active").length;
  const pending = relationships.filter((r) => r.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Trust Relationships™</h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">
            Manage your organization&apos;s trust network connections.
          </p>
        </div>
        <Link href="/trust-exchange" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-blue)] text-white text-sm font-semibold hover:opacity-90">
          Manage via Trust Exchange <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <TrustNetworkStat label="Total Relationships" value={relationships.length}          accent="neutral" />
        <TrustNetworkStat label="Active"              value={active}                        accent={active > 0 ? "good" : "neutral"} />
        <TrustNetworkStat label="Pending"             value={pending}                       accent={pending > 0 ? "warn" : "neutral"} />
        <TrustNetworkStat label="Relationship Types"  value={Object.keys(byType).length}    accent="neutral" />
      </div>

      {/* By type breakdown */}
      {Object.keys(byType).length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3">Relationship Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {Object.entries(byType).map(([type, cnt]) => (
              <Card key={type} className="p-4 text-center">
                <p className="text-2xl font-bold">{cnt}</p>
                <div className="mt-1.5 flex justify-center">
                  <RelationshipTypeBadge type={type} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Relationship list */}
      <div>
        <h2 className="text-base font-semibold mb-3">All Relationships</h2>
        {relationships.length === 0 ? (
          <Card className="p-10 text-center">
            <Network className="h-10 w-10 mx-auto text-[var(--color-ink-faint)] mb-3" />
            <p className="font-semibold text-[var(--color-ink-dim)]">No trust relationships yet</p>
            <p className="text-sm text-[var(--color-ink-faint)] mt-1">Build your trust network by connecting with vendors and partners.</p>
            <Link href="/trust-exchange" className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-blue)] text-white text-sm font-semibold hover:opacity-90">
              Go to Trust Exchange
            </Link>
          </Card>
        ) : (
          <Card className="divide-y divide-[var(--color-line)]">
            {relationships.map((r) => {
              const si = STATUS_ICONS[r.status] ?? STATUS_ICONS.pending;
              const SIcon = si.icon;
              return (
                <div key={r.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-[var(--color-ink-dim)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.targetOrgId}</p>
                    <div className="mt-0.5">
                      <RelationshipTypeBadge type={r.relationshipType} />
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 text-sm font-medium ${si.color}`}>
                    <SIcon className="h-4 w-4" />
                    <NetworkStatusBadge status={r.status} />
                  </div>
                  <p className="text-xs text-[var(--color-ink-faint)] flex-shrink-0">
                    {new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              );
            })}
          </Card>
        )}
      </div>
    </div>
  );
}
