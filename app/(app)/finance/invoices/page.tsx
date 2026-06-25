"use server";

export const dynamic = "force-dynamic";

import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { invoices, organizations, billingPlans } from "@/lib/db/schema";
import { eq, ilike, or, and, gte, lte, count, sum, desc, sql } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";

// ─── Types ───────────────────────────────────────────────────────────────────

type InvoiceStatus =
  | "draft"
  | "issued"
  | "awaiting_payment"
  | "pending_verification"
  | "paid"
  | "cancelled"
  | "refunded";

const ALL_STATUSES: InvoiceStatus[] = [
  "draft",
  "issued",
  "awaiting_payment",
  "pending_verification",
  "paid",
  "cancelled",
  "refunded",
];

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  issued: "Issued",
  awaiting_payment: "Awaiting Payment",
  pending_verification: "Pending Verification",
  paid: "Paid",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_BADGE_CLASSES: Record<InvoiceStatus, string> = {
  draft: "bg-white/[0.06] text-[var(--color-ink-dim)] border border-white/[0.08]",
  issued: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  awaiting_payment: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
  pending_verification: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  paid: "bg-green-500/10 text-green-400 border border-green-500/20",
  cancelled: "bg-red-500/10 text-red-400 border border-red-500/20",
  refunded: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
};

const PAGE_SIZE = 20;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtCurrency(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function fmtDate(d: Date | string | null) {
  if (!d) return "&#8212;";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function isOverdue(dueAt: Date | string | null, status: string) {
  if (!dueAt || status === "paid" || status === "cancelled" || status === "refunded") return false;
  return new Date(dueAt) < new Date();
}

function paymentMethodLabel(pm: string) {
  const map: Record<string, string> = {
    bank_transfer: "Bank Transfer",
    razorpay: "Razorpay",
    stripe: "Stripe",
    manual: "Manual",
  };
  return map[pm] ?? pm;
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchInvoices({
  status,
  search,
  month,
  page,
}: {
  status: string;
  search: string;
  month: string;
  page: number;
}) {
  const offset = (page - 1) * PAGE_SIZE;

  // Build date range from month param (YYYY-MM)
  let fromDate: Date | undefined;
  let toDate: Date | undefined;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const [y, m] = month.split("-").map(Number);
    fromDate = new Date(y, m - 1, 1);
    toDate = new Date(y, m, 0, 23, 59, 59);
  }

  const conditions: ReturnType<typeof eq>[] = [];

  if (status && status !== "all") {
    conditions.push(eq(invoices.status, status));
  }

  if (fromDate) {
    conditions.push(gte(invoices.createdAt, fromDate));
  }
  if (toDate) {
    conditions.push(lte(invoices.createdAt, toDate));
  }

  const whereClause =
    conditions.length > 0
      ? and(...conditions)
      : undefined;

  // Fetch rows with org + plan join
  const rows = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      amountCents: invoices.amountCents,
      currency: invoices.currency,
      paymentMethod: invoices.paymentMethod,
      paymentReference: invoices.paymentReference,
      dueAt: invoices.dueAt,
      paidAt: invoices.paidAt,
      pdfUrl: invoices.pdfUrl,
      createdAt: invoices.createdAt,
      orgName: organizations.name,
      planName: billingPlans.name,
    })
    .from(invoices)
    .leftJoin(organizations, eq(invoices.organizationId, organizations.id))
    .leftJoin(billingPlans, eq(invoices.planId, billingPlans.id))
    .where(
      search
        ? and(
            whereClause,
            or(
              ilike(invoices.invoiceNumber, `%${search}%`),
              ilike(organizations.name, `%${search}%`)
            )
          )
        : whereClause
    )
    .orderBy(desc(invoices.createdAt))
    .limit(PAGE_SIZE)
    .offset(offset);

  // Count total for pagination
  const [{ total }] = await db
    .select({ total: count() })
    .from(invoices)
    .leftJoin(organizations, eq(invoices.organizationId, organizations.id))
    .where(
      search
        ? and(
            whereClause,
            or(
              ilike(invoices.invoiceNumber, `%${search}%`),
              ilike(organizations.name, `%${search}%`)
            )
          )
        : whereClause
    );

  return { rows, total: Number(total) };
}

async function fetchSummary() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [thisMonth] = await db
    .select({
      totalCents: sum(invoices.amountCents),
      paidCents: sql<number>`SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.amountCents} ELSE 0 END)`,
      outstandingCents: sql<number>`SUM(CASE WHEN ${invoices.status} NOT IN ('paid','cancelled','refunded') THEN ${invoices.amountCents} ELSE 0 END)`,
    })
    .from(invoices)
    .where(and(gte(invoices.createdAt, monthStart), lte(invoices.createdAt, monthEnd)));

  const [overdue] = await db
    .select({
      overdueCents: sum(invoices.amountCents),
    })
    .from(invoices)
    .where(
      and(
        lte(invoices.dueAt, now),
        sql`${invoices.status} NOT IN ('paid','cancelled','refunded')`
      )
    );

  return {
    totalCents: Number(thisMonth?.totalCents ?? 0),
    paidCents: Number(thisMonth?.paidCents ?? 0),
    outstandingCents: Number(thisMonth?.outstandingCents ?? 0),
    overdueCents: Number(overdue?.overdueCents ?? 0),
  };
}

// ─── Sub-components (server JSX) ──────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = status as InvoiceStatus;
  const classes = STATUS_BADGE_CLASSES[s] ?? STATUS_BADGE_CLASSES.draft;
  const label = STATUS_LABELS[s] ?? status;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${classes}`}>
      {label}
    </span>
  );
}

function SummaryStat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className={`rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-4 flex flex-col gap-1 border-l-2 ${accent ?? "border-l-[var(--color-line)]"}`}>
      <p className="text-xs text-[var(--color-ink-dim)]">{label}</p>
      <p className="text-lg font-semibold text-[var(--color-ink)]">{value}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireUser();

  const sp = await searchParams;
  const statusFilter = sp.status ?? "all";
  const search = sp.search ?? "";
  const month = sp.month ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const [{ rows, total }, summary] = await Promise.all([
    fetchInvoices({ status: statusFilter, search, month, page }),
    fetchSummary(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Build query string helper
  function qs(overrides: Record<string, string>) {
    const params = new URLSearchParams({
      ...(statusFilter !== "all" ? { status: statusFilter } : {}),
      ...(search ? { search } : {}),
      ...(month ? { month } : {}),
      ...(page > 1 ? { page: String(page) } : {}),
      ...overrides,
    });
    const str = params.toString();
    return str ? `?${str}` : "";
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Invoices"
        description="Manage and track all billing invoices across organizations."
        actions={
          <Link
            href="/finance/invoices/new"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Invoice
          </Link>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat
          label="Total Invoiced (this month)"
          value={fmtCurrency(summary.totalCents)}
          accent="border-l-indigo-500"
        />
        <SummaryStat
          label="Total Paid"
          value={fmtCurrency(summary.paidCents)}
          accent="border-l-green-500"
        />
        <SummaryStat
          label="Outstanding"
          value={fmtCurrency(summary.outstandingCents)}
          accent="border-l-yellow-500"
        />
        <SummaryStat
          label="Overdue"
          value={fmtCurrency(summary.overdueCents)}
          accent="border-l-red-500"
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status pills */}
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={qs({ status: "all", page: "1" })}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === "all"
                ? "bg-white/[0.08] text-[var(--color-ink)]"
                : "text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
            }`}
          >
            All
          </Link>
          {ALL_STATUSES.map((s) => (
            <Link
              key={s}
              href={qs({ status: s, page: "1" })}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-white/[0.08] text-[var(--color-ink)]"
                  : "text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
              }`}
            >
              {STATUS_LABELS[s]}
            </Link>
          ))}
        </div>

        <div className="flex-1" />

        {/* Month selector */}
        <form method="GET" action="/finance/invoices" className="flex items-center gap-2">
          {statusFilter !== "all" && <input type="hidden" name="status" value={statusFilter} />}
          {search && <input type="hidden" name="search" value={search} />}
          <input
            type="month"
            name="month"
            defaultValue={month}
            className="rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-1.5 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-1.5 text-xs text-[var(--color-ink-dim)] hover:bg-white/[0.08] hover:text-[var(--color-ink)] transition-colors"
          >
            Filter
          </button>
          {month && (
            <Link
              href={qs({ month: "", page: "1" })}
              className="rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-1.5 text-xs text-[var(--color-ink-dim)] hover:bg-white/[0.08] hover:text-[var(--color-ink)] transition-colors"
            >
              Clear
            </Link>
          )}
        </form>

        {/* Search */}
        <form method="GET" action="/finance/invoices" className="flex items-center gap-2">
          {statusFilter !== "all" && <input type="hidden" name="status" value={statusFilter} />}
          {month && <input type="hidden" name="month" value={month} />}
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-ink-dim)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Invoice # or org name&#8230;"
              className="rounded-lg border border-[var(--color-line)] bg-white/[0.04] pl-8 pr-3 py-1.5 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:ring-1 focus:ring-indigo-500 w-52"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-1.5 text-xs text-[var(--color-ink-dim)] hover:bg-white/[0.08] hover:text-[var(--color-ink)] transition-colors"
          >
            Search
          </button>
          {search && (
            <Link
              href={qs({ search: "", page: "1" })}
              className="rounded-lg border border-[var(--color-line)] bg-white/[0.04] px-3 py-1.5 text-xs text-[var(--color-ink-dim)] hover:bg-white/[0.08] hover:text-[var(--color-ink)] transition-colors"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.02] overflow-hidden">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-10 h-10 text-[var(--color-ink-dim)] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
            </svg>
            <p className="text-sm text-[var(--color-ink-dim)]">No invoices found.</p>
            {(search || statusFilter !== "all" || month) && (
              <Link href="/finance/invoices" className="mt-2 text-xs text-indigo-400 hover:text-indigo-300">
                Clear filters
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-line)] bg-white/[0.02]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)] whitespace-nowrap">Invoice #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Organization</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Plan</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-ink-dim)]">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)]">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)] whitespace-nowrap">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-ink-dim)] whitespace-nowrap">Payment Method</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-[var(--color-ink-dim)]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {rows.map((row) => {
                  const overdue = isOverdue(row.dueAt, row.status);
                  return (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Invoice # */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          href={`/finance/invoices/${row.id}`}
                          className="font-mono text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
                        >
                          {row.invoiceNumber}
                        </Link>
                      </td>

                      {/* Organization */}
                      <td className="px-4 py-3 text-[var(--color-ink)] max-w-[160px] truncate">
                        {row.orgName ?? <span className="text-[var(--color-ink-dim)]">&#8212;</span>}
                      </td>

                      {/* Plan */}
                      <td className="px-4 py-3 text-[var(--color-ink-dim)] whitespace-nowrap">
                        {row.planName ?? <span>&#8212;</span>}
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 text-right font-medium text-[var(--color-ink)] whitespace-nowrap tabular-nums">
                        {fmtCurrency(row.amountCents, row.currency)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {row.dueAt ? (
                          <span className={`text-xs ${overdue ? "text-red-400 font-medium" : "text-[var(--color-ink-dim)]"}`}>
                            {overdue && (
                              <span className="mr-1 inline-block w-1.5 h-1.5 rounded-full bg-red-500 align-middle" />
                            )}
                            {fmtDate(row.dueAt)}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--color-ink-dim)]">&#8212;</span>
                        )}
                      </td>

                      {/* Payment Method */}
                      <td className="px-4 py-3 text-xs text-[var(--color-ink-dim)] whitespace-nowrap">
                        {paymentMethodLabel(row.paymentMethod)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/finance/invoices/${row.id}`}
                            className="rounded-lg px-2.5 py-1 text-xs font-medium text-[var(--color-ink-dim)] border border-[var(--color-line)] hover:bg-white/[0.06] hover:text-[var(--color-ink)] transition-colors"
                          >
                            View
                          </Link>

                          {row.status === "pending_verification" && row.paymentReference && (
                            <Link
                              href={`/finance/transactions/${row.paymentReference}`}
                              className="rounded-lg px-2.5 py-1 text-xs font-medium text-amber-400 border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                            >
                              Verify
                            </Link>
                          )}

                          {row.pdfUrl ? (
                            <a
                              href={row.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg px-2.5 py-1 text-xs font-medium text-[var(--color-ink-dim)] border border-[var(--color-line)] hover:bg-white/[0.06] hover:text-[var(--color-ink)] transition-colors"
                            >
                              PDF
                            </a>
                          ) : (
                            <span
                              title="PDF not yet generated"
                              className="rounded-lg px-2.5 py-1 text-xs font-medium text-[var(--color-ink-dim)]/40 border border-[var(--color-line)]/40 cursor-not-allowed"
                            >
                              PDF
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[var(--color-ink-dim)]">
          <span>
            Showing {(page - 1) * PAGE_SIZE + 1}&#8211;{Math.min(page * PAGE_SIZE, total)} of {total} invoices
          </span>
          <div className="flex items-center gap-1">
            {page > 1 && (
              <Link
                href={qs({ page: String(page - 1) })}
                className="rounded-lg border border-[var(--color-line)] bg-white/[0.02] px-3 py-1.5 hover:bg-white/[0.06] hover:text-[var(--color-ink)] transition-colors"
              >
                &#8592; Previous
              </Link>
            )}
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              // Show pages around current
              let p: number;
              if (totalPages <= 7) {
                p = i + 1;
              } else if (page <= 4) {
                p = i + 1;
              } else if (page >= totalPages - 3) {
                p = totalPages - 6 + i;
              } else {
                p = page - 3 + i;
              }
              return (
                <Link
                  key={p}
                  href={qs({ page: String(p) })}
                  className={`rounded-lg border px-3 py-1.5 transition-colors ${
                    p === page
                      ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-400"
                      : "border-[var(--color-line)] bg-white/[0.02] hover:bg-white/[0.06] hover:text-[var(--color-ink)]"
                  }`}
                >
                  {p}
                </Link>
              );
            })}
            {page < totalPages && (
              <Link
                href={qs({ page: String(page + 1) })}
                className="rounded-lg border border-[var(--color-line)] bg-white/[0.02] px-3 py-1.5 hover:bg-white/[0.06] hover:text-[var(--color-ink)] transition-colors"
              >
                Next &#8594;
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
