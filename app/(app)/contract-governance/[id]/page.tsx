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
import { getContractDetail, computeAndSaveScore } from "@/backend/src/modules/contract-governance/contract-service";
import { getLinkedRisks, getLinkedControls, getLinkedPolicies } from "@/backend/src/modules/contract-governance/contract-repo";
import {
  ContractStatusBadge,
  ObligationStatusBadge,
  ClauseRiskBadge,
} from "@/components/contract-governance/contract-ui";
import { scoreTextColor, scoreBarGradient } from "@/lib/ui/colors";

import { formatDate, daysUntil } from "@/backend/src/modules/contract-governance/date-utils";

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
  const aiSummary = contract.aiSummary;

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
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">{contract.title}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <ContractStatusBadge status={contract.status} />
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

      {/* Key dates + value grid */}
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
          <p className={`font-semibold ${daysExp !== null && daysExp <= 30 && daysExp >= 0 ? "text-red-700" : ""}`}>
            {formatDate(contract.expiryDate)}
            {daysExp !== null && daysExp >= 0 && daysExp <= 90 && (
              <span className="ml-1 text-xs text-amber-700">({daysExp}d)</span>
            )}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[var(--color-ink-dim)] mb-1 flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Renewal Date
          </p>
          <p className="font-semibold">{formatDate(contract.renewalDate)}</p>
          {contract.autoRenewal && (
            <span className="text-xs text-[var(--color-blue)]">Auto-renews</span>
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

      {/* Contract Score™ */}
      {contract.trustScore !== null && contract.trustScore !== undefined && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--color-blue)]" />
              Contract Score™
            </h2>
            <span className={`text-2xl font-bold ${scoreTextColor(contract.trustScore)}`}>
              {contract.trustScore}/100
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-2 rounded-full"
              style={{
                width: `${contract.trustScore}%`,
                background: scoreBarGradient(contract.trustScore),
              }}
            />
          </div>
        </Card>
      )}

      {/* AI Summary — surfaced above clauses */}
      {aiSummary && (
        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-700" />
            AI Contract Summary
          </h2>
          <p className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Clauses */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-[var(--color-blue)]" />
              Clauses ({contract.clauses.length})
            </h2>
          </div>
          {contract.clauses.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No clauses added yet.</p>
          ) : (
            <div className="space-y-2">
              {contract.clauses.slice(0, 5).map((cl) => (
                <div key={cl.id} className="flex items-center justify-between gap-3">
                  <p className="text-sm truncate">{cl.title}</p>
                  <ClauseRiskBadge level={cl.riskLevel} />
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
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              Obligations ({contract.obligations.length})
            </h2>
          </div>
          {contract.obligations.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No obligations tracked.</p>
          ) : (
            <div className="space-y-2">
              {contract.obligations.slice(0, 5).map((o) => {
                const days = daysUntil(o.dueDate);
                const isOverdue = days !== null && days < 0 && !["completed", "waived"].includes(o.status);
                return (
                  <div key={o.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${isOverdue ? "text-red-700" : ""}`}>{o.title}</p>
                      {o.dueDate && (
                        <p className={`text-xs ${isOverdue ? "text-red-700/80" : "text-[var(--color-ink-dim)]"}`}>
                          Due {formatDate(o.dueDate)}
                          {isOverdue && days !== null && ` (${Math.abs(days)}d overdue)`}
                        </p>
                      )}
                    </div>
                    <ObligationStatusBadge status={o.status} />
                  </div>
                );
              })}
              {contract.obligations.length > 5 && (
                <p className="text-xs text-[var(--color-ink-dim)]">+{contract.obligations.length - 5} more</p>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Linked entities */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-700" />
            Linked Risks ({linkedRisks.length})
          </h2>
          {linkedRisks.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No risks linked.</p>
          ) : (
            <div className="space-y-1">
              {linkedRisks.map((r) => (
                <Link key={r.id} href={`/risks/${r.id}`} className="block text-sm hover:text-[var(--color-blue)] truncate">
                  {r.title}
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Shield className="h-4 w-4 text-[var(--color-blue)]" />
            Linked Controls ({linkedControls.length})
          </h2>
          {linkedControls.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No controls linked.</p>
          ) : (
            <div className="space-y-1">
              {linkedControls.map((c) => (
                <Link key={c.id} href={`/controls/${c.id}`} className="block text-sm hover:text-[var(--color-blue)] truncate">
                  {c.name}
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-purple-700" />
            Linked Policies ({linkedPolicies.length})
          </h2>
          {linkedPolicies.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-dim)]">No policies linked.</p>
          ) : (
            <div className="space-y-1">
              {linkedPolicies.map((p) => (
                <Link key={p.id} href={`/policy-governance/${p.id}`} className="block text-sm hover:text-[var(--color-blue)] truncate">
                  {p.name}
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* AI Advisor link */}
      <Card className="p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-100 text-purple-700 flex-shrink-0">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">AI Contract Advisor™</p>
          <p className="text-sm text-[var(--color-ink-dim)]">Extract clauses, analyse risk, and get AI recommendations</p>
        </div>
        <Link href="/contract-governance/ai">
          <Button variant="outline" size="sm">AI Advisor</Button>
        </Link>
      </Card>
    </div>
  );
}
