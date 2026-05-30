export const dynamic = "force-dynamic";

import Link from "next/link";
import { Plus, Building2, Download } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { listVendorsPaged, getMetrics, type VendorRow } from "@/lib/services/vendor-service";
import { demoVendors } from "@/lib/demo-data";
import { VendorFilters } from "@/components/vendors/vendor-filters";

const PAGE_SIZE = 20;

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await requireUser();
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));

  let vendors: VendorRow[];
  let total = 0;
  let totalPages = 1;
  let avgScore = 0;
  let highRisk = 0;
  let expiring = 0;
  let totalDocs = 0;

  if (session.demo || !session.org) {
    vendors = demoVendors.map((v, i) => ({ id: String(i), name: v.name, category: v.category, status: v.status, risk: v.risk, score: v.score, docs: v.docs, expiring: v.expiring }));
    total = vendors.length; totalPages = 1;
  } else {
    const result = await listVendorsPaged(session.org.id, page, PAGE_SIZE);
    vendors = result.vendors; total = result.total; totalPages = result.totalPages;
  }

  totalDocs = vendors.reduce((n, v) => n + v.docs, 0);
  highRisk = vendors.filter((v) => v.risk === "high" || v.risk === "critical").length;
  expiring = vendors.reduce((n, v) => n + v.expiring, 0);
  avgScore = vendors.length ? Math.round(vendors.reduce((n, v) => n + v.score, 0) / vendors.length) : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Vendors</h1>
          <p className="text-sm text-[var(--color-ink-dim)]">{total} vendors · {totalDocs} documents tracked</p>
        </div>
        <div className="flex items-center gap-2">
          {!session.demo && session.org && (
            <a href="/vendors/export" download="vendors.csv">
              <Button variant="outline" size="sm"><Download className="h-4 w-4" /> Export CSV</Button>
            </a>
          )}
          <Link href="/vendors/new">
            <Button variant="primary" size="md"><Plus className="h-4 w-4" /> Add vendor</Button>
          </Link>
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
        <Card className="flex flex-col items-center gap-3 px-5 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-[var(--color-ink-faint)]">
            <Building2 className="h-7 w-7" />
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">No vendors yet</h2>
          <p className="max-w-sm text-sm text-[var(--color-ink-dim)]">Register your first vendor to start tracking documents, certifications, expiry and risk.</p>
          <Link href="/vendors/new" className="mt-1">
            <Button variant="primary" size="md"><Plus className="h-4 w-4" /> Add your first vendor</Button>
          </Link>
        </Card>
      ) : (
        <>
          <VendorFilters vendors={vendors} />
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
  return (
    <div className={`rounded-xl border px-4 py-3 ${border} ${bg}`}>
      <div className="text-xs text-[var(--color-ink-faint)]">{label}</div>
      <div className={`mt-1 font-[family-name:var(--font-display)] text-xl font-bold ${valColor}`}>
        {value}{suffix && <span className="ml-1 text-sm font-normal text-[var(--color-ink-faint)]">{suffix}</span>}
      </div>
    </div>
  );
}
