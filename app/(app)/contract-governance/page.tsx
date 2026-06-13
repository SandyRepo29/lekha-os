export const dynamic = "force-dynamic";

import Link from "next/link";
import {
  FileSignature,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  DollarSign,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { getDashboardMetrics } from "@/lib/services/contract-governance/contract-service";
import { ContractStat } from "@/components/contract-governance/contract-ui";

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(d: string | null | undefined) {
  if (!d) return null;
  return Math.floor((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function ContractGovernanceDashboardPage() {
  const session = await requireUser();

  if (session.demo || !session.org) {
    return (
      <Card>
        <EmptyState
          icon={FileSignature}
          title="Contract Governance™"
          description="Connect Supabase to manage your contract portfolio."
        />
      </Card>
    );
  }

  const metrics = await getDashboardMetrics(session.org.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Contract Governance™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">
            Contract lifecycle, obligations, renewals and AI analysis
          </p>
        </div>
        <Link href="/contract-governance/new">
          <Button>
            <Plus className="h-4 w-4" /> New Contract
          </Button>
        </Link>
      </div>

      {/* Metrics strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <ContractStat
          label="Total Contracts"
          value={metrics.total}
          accent="neutral"
          href="/contract-governance/library"
        />
        <ContractStat
          label="Active"
          value={metrics.active}
          accent="good"
          href="/contract-governance/library?status=active"
        />
        <ContractStat
          label="Expiring (90d)"
          value={metrics.expiring}
          accent={metrics.expiring > 0 ? "warn" : "neutral"}
          href="/contract-governance/renewals"
        />
        <ContractStat
          label="Expired"
          value={metrics.expired}
          accent={metrics.expired > 0 ? "danger" : "neutral"}
          href="/contract-governance/library?status=expired"
        />
        <ContractStat
          label="Renewals Due"
          value={metrics.renewalsDue}
          accent={metrics.renewalsDue > 0 ? "warn" : "neutral"}
          href="/contract-governance/renewals"
        />
      </div>

      {/* Value strip */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-blue)]/20 text-[var(--color-blue)] flex-shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              ${metrics.totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-[var(--color-ink-dim)]">Total Portfolio Value</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/20 text-purple-400 flex-shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">
              ${metrics.activeValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </p>
            <p className="text-xs text-[var(--color-ink-dim)]">Active Contract Value</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Expiring contracts */}
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-400" />
            Expiring Contracts
          </h2>
          {metrics.expiringContracts.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              No contracts expiring within 90 days.
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.expiringContracts.map((c) => {
                const days = daysUntil(c.expiryDate);
                return (
                  <Link
                    key={c.id}
                    href={`/contract-governance/${c.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl p-2 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <p className="text-xs text-[var(--color-ink-dim)]">
                        {c.vendorName ?? "No vendor"} · Expires {formatDate(c.expiryDate)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        days !== null && days <= 30
                          ? "bg-red-500/20 text-red-400"
                          : "bg-amber-500/20 text-amber-400"
                      }`}
                    >
                      {days !== null ? `${days}d` : "—"}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {/* Open obligations */}
        <Card className="p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-400" />
            Open Obligations
          </h2>
          {metrics.recentObligations.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              No open obligations.
            </div>
          ) : (
            <div className="space-y-2">
              {metrics.recentObligations.slice(0, 6).map((o) => {
                const days = daysUntil(o.dueDate);
                const isOverdue = days !== null && days < 0;
                const isDueSoon = !isOverdue && days !== null && days <= 7;
                return (
                  <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl p-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{o.title}</p>
                      <p className="text-xs text-[var(--color-ink-dim)] truncate">{o.contractTitle}</p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                        isOverdue
                          ? "bg-red-500/20 text-red-400"
                          : isDueSoon
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-[var(--color-blue)]/20 text-[var(--color-blue)]"
                      }`}
                    >
                      {o.dueDate ? formatDate(o.dueDate) : "No due date"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <Card className="p-5">
        <h2 className="font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/contract-governance/library">
            <Button variant="outline" size="sm">
              <FileSignature className="h-4 w-4" /> Contract Library
            </Button>
          </Link>
          <Link href="/contract-governance/obligations">
            <Button variant="outline" size="sm">
              <CheckCircle2 className="h-4 w-4" /> All Obligations
            </Button>
          </Link>
          <Link href="/contract-governance/renewals">
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" /> Renewals
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
