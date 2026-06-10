export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  FileSignature,
  Building2,
  Calendar,
  DollarSign,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Sparkles,
  Activity,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { getContractDetail, computeAndSaveScore } from "@/lib/services/contract-governance/contract-service";
import { getLinkedRisks, getLinkedControls, getLinkedPolicies } from "@/lib/repositories/contract-repo";

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

const RISK_COLORS: Record<string, string> = {
  low: "bg-green-500/20 text-green-400",
  medium: "bg-yellow-500/20 text-yellow-400",
  high: "bg-orange-500/20 text-orange-400",
  critical: "bg-red-500/20 text-red-400",
};

const OBLIGATION_STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400",
  in_progress: "bg-blue-500/20 text-blue-400",
  completed: "bg-green-500/20 text-green-400",
  overdue: "bg-red-500/20 text-red-400",
  waived: "bg-gray-500/20 text-gray-400",
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(d: string | null | undefined) {
  if (!d) return null;
  return Math.floor((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;

  if (session.demo || !session.org) notFound();

  const contract = await getContractDetail(session.org.id, id);
  if (!contract) notFound();

  // Auto-compute score if stale
  const scoreStale =
    !contract.trustScoreAt ||
    Date.now() - new Date(contract.trustScoreAt).getTime() > 60 * 60 * 1000;
  if (scoreStale) {
    computeAndSaveScore(session.org.id, id).catch(() => {});
  }

  const [linkedRisks, linkedControls, linkedPolicies] = await Promise.all([
    getLinkedRisks(id),
    getLinkedControls(id),
    getLinkedPolicies(id),
  ]);

  const daysExp = daysUntil(contract.expiryDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/contract-governance/library" className="text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">
              Contracts
            </Link>
            <span className="text-[var(--color-ink-dim)]">/</span>
            <span className="text-sm">{contract.title}</span>
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">{contract.title}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[contract.status] ?? "bg-slate-500/20 text-slate-400"}`}>
              {contract.status}
            </span>
            <span className="text-xs text-[var(--color-ink-dim)]">{contract.contractType.replace(/_/g, " ")}</span>
            {contract.vendorName && (
              <span className="text-xs text-[var(--color-ink-dim)] flex items-center gap-1">
                <Building2 className="h-3 w-3" /> {contract.vendorName}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/contract-governance/${id}/edit`}>
            <Button variant="outline" size="sm">Edit</Button>
          </Link>
        </div>
      </div>

      {/* Overview grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-[var(--color-ink-dim)] mb-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Effective Date
          </p>
          <p className="font-semibold">{formatDate(contract.effectiveDate)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--color-ink-dim)] mb-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Expiry Date
          </p>
          <p className={`font-semibold ${daysExp !== null && daysExp <= 30 && daysExp >= 0 ? "text-red-400" : ""}`}>
            {formatDate(contract.expiryDate)}
            {daysExp !== null && daysExp >= 0 && daysExp <= 90 && (
              <span className="ml-1 text-xs text-yellow-400">({daysExp}d)</span>
            )}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--color-ink-dim)] mb-1 flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Renewal Date
          </p>
          <p className="font-semibold">{formatDate(contract.renewalDate)}</p>
          {contract.autoRenewal && (
            <span className="text-xs text-blue-400">Auto-renews</span>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--color-ink-dim)] mb-1 flex items-center gap-1">
            <DollarSign className="h-3 w-3" /> Value
          </p>
          <p className="font-semibold">
            {contract.value
              ? `${contract.currency} ${Number(contract.value).toLocaleString()}`
              : "—"}
          </p>
        </Card>
      </div>

      {/* Score */}
      {contract.trustScore !== null && contract.trustScore !== undefined && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-indigo-400" />
              Contract Score™
            </h2>
            <span
              className={`text-2xl font-bold ${
                contract.trustScore >= 80
                  ? "text-green-400"
                  : contract.trustScore >= 60
                  ? "text-yellow-400"
                  : "text-red-400"
              }`}
            >
              {contract.trustScore}/100
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-2 rounded-full ${
                contract.trustScore >= 80
                  ? "bg-green-500"
                  : contract.trustScore >= 60
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${contract.trustScore}%` }}
            />
          </div>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Clauses */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-400" />
              Clauses ({contract.clauses.length})
            </h2>
            <Link href={`/contract-governance/${id}#clauses`}>
              <Button variant="outline" size="sm">Manage</Button>
            </Link>
          </div>
          {contract.clauses.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No clauses added yet.</p>
          ) : (
            <div className="space-y-2">
              {contract.clauses.slice(0, 5).map((cl) => (
                <div key={cl.id} className="flex items-center justify-between gap-3">
                  <p className="text-sm truncate">{cl.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${RISK_COLORS[cl.riskLevel] ?? "bg-slate-500/20 text-slate-400"}`}>
                    {cl.riskLevel}
                  </span>
                </div>
              ))}
              {contract.clauses.length > 5 && (
                <p className="text-xs text-[var(--color-ink-dim)]">+{contract.clauses.length - 5} more</p>
              )}
            </div>
          )}
        </Card>

        {/* Obligations */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              Obligations ({contract.obligations.length})
            </h2>
          </div>
          {contract.obligations.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No obligations tracked.</p>
          ) : (
            <div className="space-y-2">
              {contract.obligations.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm truncate">{o.title}</p>
                    {o.dueDate && (
                      <p className="text-xs text-[var(--color-ink-dim)]">Due {formatDate(o.dueDate)}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${OBLIGATION_STATUS_COLORS[o.status] ?? "bg-slate-500/20 text-slate-400"}`}>
                    {o.status.replace("_", " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Linked entities */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            Linked Risks ({linkedRisks.length})
          </h2>
          {linkedRisks.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No risks linked.</p>
          ) : (
            <div className="space-y-1">
              {linkedRisks.map((r) => (
                <Link key={r.id} href={`/risks/${r.id}`} className="block text-sm hover:text-indigo-400 truncate">
                  {r.title}
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-400" />
            Linked Controls ({linkedControls.length})
          </h2>
          {linkedControls.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No controls linked.</p>
          ) : (
            <div className="space-y-1">
              {linkedControls.map((c) => (
                <Link key={c.id} href={`/controls/${c.id}`} className="block text-sm hover:text-indigo-400 truncate">
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-purple-400" />
            Linked Policies ({linkedPolicies.length})
          </h2>
          {linkedPolicies.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No policies linked.</p>
          ) : (
            <div className="space-y-1">
              {linkedPolicies.map((p) => (
                <Link key={p.id} href={`/policy-governance/${p.id}`} className="block text-sm hover:text-indigo-400 truncate">
                  {p.name}
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* AI analysis link */}
      <Card className="p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/20 text-purple-400">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">AI Contract Analysis</p>
          <p className="text-sm text-[var(--color-ink-dim)]">Extract clauses, analyse risk, and get AI recommendations</p>
        </div>
        <Link href="/contract-governance/ai">
          <Button variant="outline" size="sm">AI Advisor</Button>
        </Link>
      </Card>
    </div>
  );
}
