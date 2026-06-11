export const dynamic = "force-dynamic";

import Link from "next/link";
import { Users, Network, ArrowRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getTrustRelationships } from "@/lib/services/trust-network/trust-network-service";

const STATUS_STYLES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  active: { label: "Active", icon: CheckCircle2, color: "text-green-400" },
  pending: { label: "Pending", icon: Clock, color: "text-yellow-400" },
  terminated: { label: "Terminated", icon: XCircle, color: "text-red-400" },
};

const TYPE_COLORS: Record<string, string> = {
  customer: "bg-blue-500/10 text-blue-400",
  vendor: "bg-purple-500/10 text-purple-400",
  partner: "bg-emerald-500/10 text-emerald-400",
  processor: "bg-orange-500/10 text-orange-400",
  auditor: "bg-yellow-500/10 text-yellow-400",
  consultant: "bg-pink-500/10 text-pink-400",
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
    <div className="space-y-8">
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
        <Card className="p-5 text-center">
          <p className="text-3xl font-black text-[var(--color-blue)]">{relationships.length}</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-1">Total Relationships</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-3xl font-black text-green-400">{active}</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-1">Active</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-3xl font-black text-yellow-400">{pending}</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-1">Pending</p>
        </Card>
        <Card className="p-5 text-center">
          <p className="text-3xl font-black text-purple-400">{Object.keys(byType).length}</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-1">Relationship Types</p>
        </Card>
      </div>

      {/* By type breakdown */}
      {Object.keys(byType).length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3">Relationship Distribution</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {Object.entries(byType).map(([type, cnt]) => (
              <Card key={type} className="p-4 text-center">
                <p className="text-2xl font-bold">{cnt}</p>
                <span className={`inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TYPE_COLORS[type] ?? "bg-white/5 text-[var(--color-ink-dim)]"}`}>
                  {type}
                </span>
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
              const s = STATUS_STYLES[r.status] ?? STATUS_STYLES.pending;
              const SIcon = s.icon;
              return (
                <div key={r.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Users className="h-4 w-4 text-[var(--color-ink-dim)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{r.targetOrgId}</p>
                    <span className={`inline-block mt-0.5 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${TYPE_COLORS[r.relationshipType] ?? "bg-white/5 text-[var(--color-ink-dim)]"}`}>
                      {r.relationshipType}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-sm font-medium ${s.color}`}>
                    <SIcon className="h-4 w-4" />
                    {s.label}
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
