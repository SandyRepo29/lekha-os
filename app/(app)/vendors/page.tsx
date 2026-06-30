export const dynamic = "force-dynamic";

export const metadata = { title: 'Vendor Hub&#8482; — AUDT' };

import Link from "next/link";
import { Plus, Building2, Download, FileText, AlertTriangle, TrendingUp, ClipboardCheck, Sparkles } from "lucide-react";
import { CoachMark } from "@/components/onboarding/coach-mark";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireUser } from "@/lib/auth/session";
import { canCreate } from "@/lib/ui/role-guard";
import { listVendorsPaged, type VendorRow } from "@/lib/services/vendor-service";
import { type VendorLifecycleStage } from "@/lib/constants/vendor-lifecycle";
import { demoVendors } from "@/lib/demo-data";
import { VendorFilters } from "@/components/vendors/vendor-filters";
import { VendorImportButton } from "@/components/vendors/vendor-import-button";
import { EmptyState } from "@/components/ui/empty-state";
import { parseNaturalLanguageSearch, isNaturalLanguageQuery, type NLSearchFilters } from "@/lib/services/nl-search-service";
import { getUsageWarnings } from "@/lib/billing/usage";
import { UsageWarningBanner } from "@/components/billing/usage-warning-banner";
import { db } from "@/lib/db";
import { contracts, auditFindings } from "@/lib/db/schema";
import { eq, and, lt, gte, sql } from "drizzle-orm";

const PAGE_SIZE = 20;

async function getExtraMetrics(orgId: string) {
  try {
    const in30 = new Date(); in30.setDate(in30.getDate() + 30);
    const [expiring, findings] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` })
        .from(contracts)
        .where(and(eq(contracts.organizationId, orgId), lt(contracts.expiryDate, in30.toISOString().split("T")[0]))),
      db.select({ count: sql<number>`count(*)::int` })
        .from(auditFindings)
        .where(and(eq(auditFindings.organizationId, orgId), eq(auditFindings.status, "open"))),
    ]);
    return {
      contractsExpiring: expiring[0]?.count ?? 0,
      openFindings: findings[0]?.count ?? 0,
    };
  } catch {
    return { contractsExpiring: 0, openFindings: 0 };
  }
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; nlq?: string; q?: string }>;
}) {
  const session = await requireUser();
  const { page: pageStr, nlq, q } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  let vendors: VendorRow[];
  let total = 0;
  let totalPages = 1;
  let contractsExpiring = 0;
  let openFindings = 0;
  let usageWarnings: Awaited<ReturnType<typeof getUsageWarnings>> = [];

  if (session.demo || !session.org) {
    vendors = demoVendors.map((v, i) => ({
      id: String(i), name: v.name, category: v.category, status: v.status,
      risk: v.risk, score: v.score, docs: v.docs, expiring: v.expiring,
      expired: v.expired, ownerName: v.ownerName, ownerEmail: v.ownerEmail,
      ownerDepartment: v.ownerDepartment, lifecycleStage: "inventory" as VendorLifecycleStage,
    }));
    total = vendors.length; totalPages = 1;
  } else {
    const [result, extra, warnings] = await Promise.all([
      listVendorsPaged(session.org.id, page, PAGE_SIZE),
      getExtraMetrics(session.org.id),
      getUsageWarnings(session.org.id),
    ]);
    vendors = result.vendors; total = result.total; totalPages = result.totalPages;
    contractsExpiring = extra.contractsExpiring;
    openFindings = extra.openFindings;
    usageWarnings = warnings;
  }

  const avgScore = vendors.length ? Math.round(vendors.reduce((n, v) => n + v.score, 0) / vendors.length) : 0;
  const atRisk   = vendors.filter((v) => v.risk === "critical" || v.risk === "high").length;
  const expiring = vendors.reduce((n, v) => n + v.expiring, 0);
  const unowned  = vendors.filter((v) => !v.ownerName).length;

  // Parse NL query
  let nlFilters: NLSearchFilters | null = null;
  const rawNlQuery = nlq ?? (q && isNaturalLanguageQuery(q) ? q : null);
  if (rawNlQuery && !session.demo && session.org) {
    try { nlFilters = await parseNaturalLanguageSearch(rawNlQuery); } catch { /* fallback */ }
  }

  return (
    <div className="space-y-5">
      <UsageWarningBanner warnings={usageWarnings} />
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Vendor Hub&#8482;</h1>
          <p className="text-sm text-[var(--color-ink-dim)]">{total} vendor{total !== 1 ? "s" : ""} &middot; governance workspace</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/trust-intelligence/vendors" className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] px-3 py-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] hover:bg-[#F8F9FB] transition-colors">
            <Sparkles className="h-3.5 w-3.5" />
            AI Insights&#8482;
          </Link>
          {!session.demo && session.org && (
            <div className="flex items-center gap-1 rounded-xl border border-[var(--color-line)] bg-white p-1">
              <a href="/reports/compliance" target="_blank" rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 text-xs")} title="Compliance PDF">
                <FileText className="h-3.5 w-3.5" /> PDF
              </a>
              <span className="h-4 w-px bg-[var(--color-line)]" />
              <a href="/reports/expiry" target="_blank" rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 text-xs")} title="Expiry Report">
                <FileText className="h-3.5 w-3.5" /> Expiry
              </a>
              <span className="h-4 w-px bg-[var(--color-line)]" />
              <a href="/vendors/export" download="vendors.csv"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 text-xs")} title="Export CSV">
                <Download className="h-3.5 w-3.5" /> CSV
              </a>
            </div>
          )}
          {canCreate(session.org?.role ?? "viewer") && !session.demo && session.org && (
            <VendorImportButton />
          )}
          {canCreate(session.org?.role ?? "viewer") && (
            <CoachMark
              id="vendor_add_btn"
              title="Start here"
              body="Add your first vendor to begin building your supplier governance registry."
              position="bottom"
              disabled={vendors.length > 0 || session.demo || !session.org}
            >
              <Link href="/vendors/new">
                <Button variant="primary" size="md"><Plus className="h-4 w-4" /> Add Vendor</Button>
              </Link>
            </CoachMark>
          )}
        </div>
      </div>

      {/* 6-card summary strip */}
      {vendors.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="Total Vendors" value={String(total)}
            icon={Building2} accent="neutral"
          />
          <StatCard
            label="Avg Trust Score" value={String(avgScore)}
            suffix="/ 100" icon={TrendingUp}
            accent={avgScore >= 70 ? "good" : avgScore >= 50 ? "warn" : "danger"}
          />
          <StatCard
            label="Vendors At Risk" value={String(atRisk)}
            icon={AlertTriangle}
            accent={atRisk > 0 ? "danger" : "neutral"}
            href="/vendors?risk=high"
          />
          <StatCard
            label="Docs Expiring" value={String(expiring)}
            icon={FileText}
            accent={expiring > 0 ? "warn" : "neutral"}
            href="/vendors?expiring=1"
          />
          <StatCard
            label="Contracts Due" value={String(contractsExpiring)}
            icon={ClipboardCheck}
            accent={contractsExpiring > 0 ? "warn" : "neutral"}
            href="/contract-governance/renewals"
          />
          <StatCard
            label="Open Findings" value={String(openFindings)}
            icon={AlertTriangle}
            accent={openFindings > 0 ? "danger" : "neutral"}
            href="/audits/findings"
          />
        </div>
      )}

      {vendors.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="No vendors yet"
            description="Your supplier registry is empty. Add your first vendor to start building your governance posture."
            action={
              <div className="flex flex-col items-center gap-2">
                {canCreate(session.org?.role ?? "viewer") && (
                  <Link href="/vendors/new">
                    <Button variant="primary" size="md">
                      <Plus className="h-4 w-4" /> Add your first vendor
                    </Button>
                  </Link>
                )}
                <p className="text-xs text-[var(--color-ink-faint)]">Takes 2 minutes &middot; AI extracts document fields automatically</p>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          <Suspense><VendorFilters vendors={vendors} nlFilters={nlFilters} rawNlQuery={rawNlQuery ?? undefined} /></Suspense>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              {page > 1 && (
                <Link href={`?page=${page - 1}`} className="rounded-xl border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
                  &larr; Previous
                </Link>
              )}
              <span className="text-sm text-[var(--color-ink-faint)]">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`?page=${page + 1}`} className="rounded-xl border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">
                  Next &rarr;
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label, value, suffix, icon: Icon, accent, href,
}: {
  label: string; value: string; suffix?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "neutral" | "good" | "warn" | "danger";
  href?: string;
}) {
  const border = accent === "danger" ? "border-red-500/25" : accent === "warn" ? "border-amber-500/25" : accent === "good" ? "border-emerald-500/25" : "border-[var(--color-line)]";
  const bg     = accent === "danger" ? "bg-red-500/[0.05]" : accent === "warn" ? "bg-amber-500/[0.05]" : accent === "good" ? "bg-emerald-500/[0.05]" : "";
  const val    = accent === "danger" ? "text-red-400" : accent === "warn" ? "text-amber-400" : accent === "good" ? "text-emerald-400" : "text-[var(--color-ink)]";
  const bar    = accent === "danger" ? "border-l-red-500/60" : accent === "warn" ? "border-l-amber-500/60" : accent === "good" ? "border-l-emerald-500/60" : "border-l-[var(--color-line-strong)]";
  const iconCl = accent === "danger" ? "text-red-400/60" : accent === "warn" ? "text-amber-400/60" : accent === "good" ? "text-emerald-400/60" : "text-[var(--color-ink-faint)]";

  const inner = (
    <div className={`rounded-xl border border-l-2 px-4 py-3 transition-colors ${border} ${bar} ${bg} ${href ? "hover:bg-[#F8F9FB]" : ""}`}>
      <div className="flex items-center justify-between gap-1">
        <div className="text-[11px] text-[var(--color-ink-faint)]">{label}</div>
        <Icon className={`h-3.5 w-3.5 shrink-0 ${iconCl}`} />
      </div>
      <div className={`mt-1 font-[family-name:var(--font-display)] text-xl font-bold ${val}`}>
        {value}{suffix && <span className="ml-1 text-xs font-normal text-[var(--color-ink-faint)]">{suffix}</span>}
      </div>
    </div>
  );

  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}
