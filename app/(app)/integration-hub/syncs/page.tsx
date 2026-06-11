export const dynamic = "force-dynamic";

import { RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getSyncs } from "@/lib/services/integration-hub/integration-service";

const STATUS_ICONS = {
  completed: CheckCircle2,
  failed: XCircle,
  running: RefreshCw,
  pending: Clock,
  cancelled: Clock,
};

const STATUS_COLORS: Record<string, string> = {
  completed: "text-green-400",
  failed: "text-red-400",
  running: "text-blue-400",
  pending: "text-[var(--color-ink-dim)]",
  cancelled: "text-[var(--color-ink-dim)]",
};

function duration(start: Date, end: Date | null) {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  return `${Math.round(ms / 60000)}m`;
}

export default async function SyncsPage() {
  const session = await requireUser();
  if (!session.org) return null;

  const syncs = await getSyncs(session.org.id);

  const totalCompleted = syncs.filter((s) => s.sync.status === "completed").length;
  const totalFailed = syncs.filter((s) => s.sync.status === "failed").length;
  const totalRecords = syncs.reduce((n, s) => n + s.sync.recordsFetched, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Sync Engine™</h1>
        <p className="text-sm text-[var(--color-ink-dim)] mt-1">History of all integration sync runs across your connected systems.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold">{syncs.length}</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">Total Runs</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{totalCompleted}</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">Completed</p>
        </Card>
        <Card className="p-4 text-center">
          <p className={`text-2xl font-bold ${totalFailed > 0 ? "text-red-400" : ""}`}>{totalFailed}</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">Failed</p>
        </Card>
      </div>

      {syncs.length === 0 ? (
        <Card className="p-12 text-center">
          <RefreshCw className="h-10 w-10 text-[var(--color-ink-faint)] mx-auto mb-3" />
          <p className="font-semibold">No sync history yet</p>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">Connect an integration and trigger a sync to see history here.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] bg-white/[0.02]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-ink-dim)]">Connector</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-ink-dim)]">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-ink-dim)]">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-ink-dim)]">Fetched</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-ink-dim)]">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-ink-dim)]">Updated</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-ink-dim)]">Failed</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-ink-dim)]">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-ink-dim)]">Started</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {syncs.map(({ sync, connectorName }) => {
                  const StatusIcon = STATUS_ICONS[sync.status] ?? Clock;
                  const color = STATUS_COLORS[sync.status] ?? "";
                  return (
                    <tr key={sync.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-medium">{connectorName}</td>
                      <td className="px-4 py-3 text-[var(--color-ink-dim)]">{sync.syncType}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1.5 text-xs font-semibold ${color}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {sync.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-[var(--color-ink-dim)]">{sync.recordsFetched}</td>
                      <td className="px-4 py-3 text-right text-green-400">{sync.recordsCreated}</td>
                      <td className="px-4 py-3 text-right text-blue-400">{sync.recordsUpdated}</td>
                      <td className="px-4 py-3 text-right text-red-400">{sync.recordsFailed > 0 ? sync.recordsFailed : "—"}</td>
                      <td className="px-4 py-3 text-[var(--color-ink-dim)]">{duration(sync.startedAt, sync.completedAt)}</td>
                      <td className="px-4 py-3 text-xs text-[var(--color-ink-faint)]">
                        {new Date(sync.startedAt).toLocaleString()}
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
