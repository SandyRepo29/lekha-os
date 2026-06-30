export const dynamic = "force-dynamic";

import { Globe, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { listTransfers } from "@/lib/services/privacy/privacy-service";
import { TransferStatusBadge } from "@/components/privacy/privacy-badges";
import { approveTransferAction } from "@/lib/privacy/actions";

function formatDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function ApproveButton({ transferId }: { transferId: string }) {
  return (
    <form
      action={async () => {
        "use server";
        await approveTransferAction(transferId);
      }}
    >
      <Button type="submit" size="sm" variant="outline">
        Approve
      </Button>
    </form>
  );
}

export default async function TransfersPage() {
  const session = await requireUser();
  if (session.demo || !session.org) {
    return <EmptyState icon={Globe} title="Cross-Border Transfers™" description="Connect Supabase to manage data transfers." />;
  }

  const transfers = await listTransfers(session.org.id);
  const pendingTransfers = transfers.filter((t) => t.status === "pending_approval");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">
            Cross-Border Transfers™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            Personal data transfers outside India — require approval under DPDP Act 2023
          </p>
        </div>
      </div>

      {pendingTransfers.length > 0 && (
        <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 flex items-center gap-3 px-4 py-3">
          <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
          <p className="text-sm text-yellow-300">
            <strong>{pendingTransfers.length} transfer{pendingTransfers.length > 1 ? "s" : ""}</strong> pending approval. Review and approve or reject.
          </p>
        </div>
      )}

      {transfers.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No cross-border transfers"
          description="Register cross-border data transfers to track DPDP Act compliance."
        />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] text-xs text-[var(--color-ink-dim)]">
                  <th className="px-4 py-3 text-left font-medium">Destination</th>
                  <th className="px-4 py-3 text-left font-medium">Recipient</th>
                  <th className="px-4 py-3 text-left font-medium">Transfer Basis</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Approved</th>
                  <th className="px-4 py-3 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[var(--color-line)]/50 hover:bg-white transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-[var(--color-ink-dim)]" />
                        <span className="font-medium">{t.destinationCountry}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[var(--color-ink-dim)]">{t.recipientName}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)] max-w-[180px] truncate">
                      {t.transferBasis}
                    </td>
                    <td className="px-4 py-3">
                      <TransferStatusBadge status={t.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)]">
                      {formatDate(t.approvedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {t.status === "pending_approval" && (
                        <ApproveButton transferId={t.id} />
                      )}
                      {t.status === "approved" && (
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                      )}
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
