export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, AlertTriangle, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUser } from "@/lib/auth/session";
import { canCreate, canEdit, canDelete } from "@/lib/ui/role-guard";
import { listRisks } from "@/lib/services/risk/risk-service";
import { RiskFilterChip } from "@/components/risk/risk-ui";
import { RISK_CATEGORY_LABELS, RISK_STATUS_LABELS } from "@/lib/services/risk-scoring";
import { RiskListTable } from "@/components/risks/risk-list-table";

const STATUS_FILTERS = [
  "all", "identified", "under_assessment", "open", "mitigating", "accepted", "transferred", "closed",
];

export default async function RiskListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; q?: string }>;
}) {
  const session = await requireUser();
  const sp = await searchParams;

  if (session.demo || !session.org) {
    return <Card><EmptyState icon={AlertTriangle} title="Risk Register" description="Connect Supabase to view risks." /></Card>;
  }

  const statusFilter = sp.status && sp.status !== "all" ? sp.status : undefined;
  const categoryFilter = sp.category && sp.category !== "all" ? sp.category : undefined;
  const q = sp.q?.toLowerCase() ?? "";

  let risks = await listRisks(session.org.id, { status: statusFilter, category: categoryFilter });
  if (q) risks = risks.filter((r) => r.title.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q));

  const buildHref = (key: string, val: string) => {
    const p = new URLSearchParams({ status: sp.status ?? "all", category: sp.category ?? "all" });
    p.set(key, val);
    return `/risks/list?${p.toString()}`;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Risk Register</h1>
          <p className="text-sm text-[var(--color-ink-dim)]">{risks.length} risk{risks.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/reports/risks/csv">
            <Button variant="ghost" size="sm"><Download className="h-4 w-4" /> CSV</Button>
          </Link>
          {canCreate(session.org?.role ?? "viewer") && (
            <Link href="/risks/new">
              <Button variant="primary" size="sm"><Plus className="h-4 w-4" /> New Risk</Button>
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map((s) => (
            <RiskFilterChip
              key={s}
              label={s === "all" ? "All Status" : RISK_STATUS_LABELS[s] ?? s}
              active={(sp.status ?? "all") === s}
              href={buildHref("status", s)}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {["all", "operational", "cyber_security", "compliance", "vendor", "financial", "regulatory"].map((c) => (
            <RiskFilterChip
              key={c}
              label={c === "all" ? "All Categories" : RISK_CATEGORY_LABELS[c] ?? c}
              active={(sp.category ?? "all") === c}
              href={buildHref("category", c)}
            />
          ))}
        </div>
      </div>

      {risks.length === 0 ? (
        <Card>
          <EmptyState
            icon={AlertTriangle}
            title="No risks found"
            description="Adjust your filters or create a new risk."
            action={canCreate(session.org?.role ?? "viewer") ? <Link href="/risks/new"><Button variant="primary" size="sm"><Plus className="h-4 w-4" /> New Risk</Button></Link> : undefined}
          />
        </Card>
      ) : (
        <RiskListTable
          risks={risks}
          canEdit={canEdit(session.org?.role ?? "viewer")}
          canDelete={canDelete(session.org?.role ?? "viewer")}
        />
      )}
    </div>
  );
}
