export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Building2, Download, FileText } from "lucide-react";
import { CoachMark } from "@/components/onboarding/coach-mark";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { requireUser } from "@/lib/auth/session";
import { listVendorsPaged, type VendorRow } from "@/lib/services/vendor-service";
import { demoVendors } from "@/lib/demo-data";
import { VendorFilters } from "@/components/vendors/vendor-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { parseNaturalLanguageSearch, isNaturalLanguageQuery, type NLSearchFilters } from "@/lib/services/nl-search-service";

const PAGE_SIZE = 20;

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
  let avgScore = 0;
  let highRisk = 0;
  let expiring = 0;
  let totalDocs = 0;

  if (session.demo || !session.org) {
    vendors = demoVendors.map((v, i) => ({ id: String(i), name: v.name, category: v.category, status: v.status, risk: v.risk, score: v.score, docs: v.docs, expiring: v.expiring, expired: v.expired, ownerName: v.ownerName, ownerEmail: v.ownerEmail, ownerDepartment: v.ownerDepartment }));
    total = vendors.length; totalPages = 1;
  } else {
    const result = await listVendorsPaged(session.org.id, page, PAGE_SIZE);
    vendors = result.vendors; total = result.total; totalPages = result.totalPages;
  }

  totalDocs = vendors.reduce((n, v) => n + v.docs, 0);
  highRisk = vendors.filter((v) => v.risk === "high" || v.risk === "critical").length;
  expiring = vendors.reduce((n, v) => n + v.expiring, 0);
  avgScore = vendors.length ? Math.round(vendors.reduce((n, v) => n + v.score, 0) / vendors.length) : 0;

  // Parse natural language query if present
  let nlFilters: NLSearchFilters | null = null;
  const rawNlQuery = nlq ?? (q && isNaturalLanguageQuery(q) ? q : null);
  if (rawNlQuery && !session.demo && session.org) {
    try {
      nlFilters = await parseNaturalLanguageSearch(rawNlQuery);
    } catch {
      // Fall back to simple text search
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Vendor Hub™</h1>
          <p className="text-sm text-[var(--color-ink-dim)]">{total} vendors · {totalDocs} documents tracked</p>
        </div>
        <div className="flex items-center gap-2">
          {!session.demo && session.org && (
            <div className="flex items-center gap-1 rounded-xl border border-[var(--color-line)] bg-white/[0.03] p-1">
              <a
                href="/reports/compliance"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 text-xs")}
                title="Compliance PDF Report"
              >
                <FileText className="h-3.5 w-3.5" /> PDF
              </a>
              <span className="h-4 w-px bg-[var(--color-line)]" />
              <a
                href="/reports/expiry"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 text-xs")}
                title="Expiry PDF Report"
              >
                <FileText className="h-3.5 w-3.5" /> Expiry
              </a>
              <span className="h-4 w-px bg-[var(--color-line)]" />
              <a
                href="/vendors/export"
                download="vendors.csv"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5 text-xs")}
                title="Export CSV"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </a>
            </div>
          )}
          <CoachMark
            id="vendor_add_btn"
            title="Start here"
            body="Add your first vendor to begin building your supplier governance registry."
            position="bottom"
            disabled={vendors.length > 0 || session.demo || !session.org}
          >
            <Link href="/vendors/new">
              <Button variant="primary" size="md"><Plus className="h-4 w-4" /> Add vendor</Button>
            </Link>
          </CoachMark>
        </div>
      </div>

      {/* Summary strip */}
      {vendors.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MiniStat label="Total vendors" value={String(total)} accent="neutral" />
          <MiniStat label="Avg compliance" value={String(avgScore)} accent={avgScore >= 70 ? "good" : avgScore >= 50 ? "warn" : "danger"} suffix="/ 100" />
          <MiniStat label="Expiring soon" value={String(expiring)} accent={expiring > 0 ? "warn" : "neutral"} />
          <MiniStat label="High / critical risk" value={String(highRisk)} accent={highRisk > 0 ? "danger" : "neutral"} />
        </div>
      )}

      {vendors.length === 0 ? (
        <Card>
          <EmptyState
            icon={Building2}
            title="No vendors yet"
            description="Your supplier registry is empty. Add your first vendor to start building your governance posture — assess risk, track documents, and generate Trust Scores™."
            action={
              <div className="flex flex-col items-center gap-2">
                <Link href="/vendors/new">
                  <Button variant="primary" size="md">
                    <Plus className="h-4 w-4" /> Add your first vendor
                  </Button>
                </Link>
                <p className="text-xs text-[var(--color-ink-faint)]">Takes 2 minutes · AI extracts document fields automatically</p>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          <Suspense><VendorFilters vendors={vendors} nlFilters={nlFilters} rawNlQuery={rawNlQuery ?? undefined} /></Suspense>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              {page > 1 && (
                <Link href={`?page=${page - 1}`} className="rounded-xl border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">← Previous</Link>
              )}
              <span className="text-sm text-[var(--color-ink-faint)]">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`?page=${page + 1}`} className="rounded-xl border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors">Next →</Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value, accent, suffix }: { label: string; value: string; accent: "neutral" | "good" | "warn" | "danger"; suffix?: string }) {
  const border = accent === "danger" ? "border-red-500/25" : accent === "warn" ? "border-amber-500/25" : accent === "good" ? "border-emerald-500/25" : "border-[var(--color-line)]";
  const bg = accent === "danger" ? "bg-red-500/[0.05]" : accent === "warn" ? "bg-amber-500/[0.05]" : accent === "good" ? "bg-emerald-500/[0.05]" : "";
  const valColor = accent === "danger" ? "text-red-400" : accent === "warn" ? "text-amber-400" : accent === "good" ? "text-emerald-400" : "text-[var(--color-ink)]";
  const accentBar = accent === "danger" ? "border-l-red-500/60" : accent === "warn" ? "border-l-amber-500/60" : accent === "good" ? "border-l-emerald-500/60" : "border-l-[var(--color-line-strong)]";
  return (
    <div className={`rounded-xl border border-l-2 px-4 py-3 ${border} ${accentBar} ${bg}`}>
      <div className="text-xs text-[var(--color-ink-faint)]">{label}</div>
      <div className={`mt-1 font-[family-name:var(--font-display)] text-xl font-bold ${valColor}`}>
        {value}{suffix && <span className="ml-1 text-sm font-normal text-[var(--color-ink-faint)]">{suffix}</span>}
      </div>
    </div>
  );
}
