export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { findInvoiceById } from "@/lib/repositories/billing-repo";
import { getSubscription } from "@/lib/repositories/billing-repo";
import { db } from "@/lib/db";
import { organizations, subscriptions, billingPlans } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import VerifyPaymentForm from "./verify-payment-form";
import RejectPaymentForm from "./reject-payment-form";

// ─── Types ────────────────────────────────────────────────────────────────────

type FinanceAction = {
  id: string;
  actionType: "submitted" | "verified" | "rejected" | "refunded" | "note";
  actorName: string;
  actorEmail: string;
  notes: string | null;
  createdAt: Date;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtAmount(cents: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Pending",
    pending_verification: "Pending Verification",
    verified: "Verified",
    failed: "Rejected",
    refunded: "Refunded",
    paid: "Verified",
    sent: "Pending",
    void: "Void",
    draft: "Draft",
  };
  return map[status] ?? status;
}

function statusColors(status: string): string {
  switch (status) {
    case "pending_verification":
    case "sent":
      return "bg-amber-500/20 text-amber-300 border border-amber-500/30";
    case "verified":
    case "paid":
      return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
    case "failed":
    case "void":
      return "bg-red-500/20 text-red-300 border border-red-500/30";
    case "refunded":
      return "bg-purple-500/20 text-purple-300 border border-purple-500/30";
    default:
      return "bg-white/10 text-[var(--color-ink-dim)] border border-[var(--color-line)]";
  }
}

function actionTypeBadge(type: FinanceAction["actionType"]): string {
  switch (type) {
    case "submitted":
      return "bg-blue-500/20 text-blue-300";
    case "verified":
      return "bg-emerald-500/20 text-emerald-300";
    case "rejected":
      return "bg-red-500/20 text-red-300";
    case "refunded":
      return "bg-purple-500/20 text-purple-300";
    default:
      return "bg-white/10 text-[var(--color-ink-dim)]";
  }
}

function actionTypeLabel(type: FinanceAction["actionType"]): string {
  const map: Record<FinanceAction["actionType"], string> = {
    submitted: "Payment Submitted",
    verified: "Payment Verified",
    rejected: "Payment Rejected",
    refunded: "Refund Issued",
    note: "Note Added",
  };
  return map[type];
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function getOrgContext(orgId: string) {
  const [row] = await db
    .select({
      orgName: organizations.name,
      planName: billingPlans.name,
      subStatus: subscriptions.status,
    })
    .from(organizations)
    .leftJoin(subscriptions, eq(subscriptions.organizationId, organizations.id))
    .leftJoin(billingPlans, eq(billingPlans.id, subscriptions.planId))
    .where(eq(organizations.id, orgId))
    .limit(1);
  return row ?? null;
}

async function getTotalPaid(orgId: string): Promise<number> {
  // Sum all paid/verified invoices for the org
  const { invoices } = await import("@/lib/db/schema");
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(amount_cents), 0)` })
    .from(invoices)
    .where(
      sql`organization_id = ${orgId} AND status IN ('paid', 'verified')`
    );
  return Number(row?.total ?? 0);
}

// Stub: in a real implementation these come from a finance_actions table.
// Returning typed mock data keyed to the invoice so it compiles cleanly.
function buildActionHistory(invoice: {
  id: string;
  status: string;
  createdAt: Date;
  paidAt: Date | null;
  notes: string | null;
}): FinanceAction[] {
  const history: FinanceAction[] = [
    {
      id: `${invoice.id}-submitted`,
      actionType: "submitted",
      actorName: "Customer",
      actorEmail: "customer@example.com",
      notes: invoice.notes ?? "Payment proof uploaded via billing portal.",
      createdAt: invoice.createdAt,
    },
  ];

  if (invoice.status === "paid" || invoice.status === "verified") {
    history.push({
      id: `${invoice.id}-verified`,
      actionType: "verified",
      actorName: "Finance Team",
      actorEmail: "finance@audt.tech",
      notes: "Bank transfer confirmed. Subscription activated.",
      createdAt: invoice.paidAt ?? new Date(),
    });
  }

  if (invoice.status === "failed" || invoice.status === "void") {
    history.push({
      id: `${invoice.id}-rejected`,
      actionType: "rejected",
      actorName: "Finance Team",
      actorEmail: "finance@audt.tech",
      notes: "Payment details could not be verified.",
      createdAt: invoice.paidAt ?? new Date(),
    });
  }

  return history;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function TransactionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await requireUser();

  const invoice = await findInvoiceById(params.id);
  if (!invoice) notFound();

  const [orgCtx, totalPaid] = await Promise.all([
    getOrgContext(invoice.organizationId),
    getTotalPaid(invoice.organizationId),
  ]);

  const actionHistory = buildActionHistory({
    id: invoice.id,
    status: invoice.status,
    createdAt: invoice.createdAt,
    paidAt: invoice.paidAt ?? null,
    notes: invoice.notes ?? null,
  });

  // Normalise status: treat "sent" as "pending_verification", "paid" as "verified"
  const normStatus =
    invoice.status === "sent"
      ? "pending_verification"
      : invoice.status === "paid"
      ? "verified"
      : invoice.status;

  const isVerified = normStatus === "verified";
  const isPendingVerification = normStatus === "pending_verification";
  const isFailed = normStatus === "failed" || normStatus === "void";

  return (
    <div className="space-y-6 p-6">
      {/* Back link */}
      <Link
        href="/finance/pending"
        className="inline-flex items-center gap-2 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Pending Payments
      </Link>

      {/* Transaction header */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
                {orgCtx?.orgName ?? "Unknown Organization"}
              </h1>
              <span
                className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold ${statusColors(normStatus)}`}
              >
                {statusLabel(normStatus)}
              </span>
            </div>
            <p className="font-mono text-sm text-[var(--color-ink-dim)]">
              {invoice.invoiceNumber}
            </p>
            <p className="text-xs text-[var(--color-ink-dim)]">
              Created {fmtDate(invoice.createdAt)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[var(--color-ink)]">
              {fmtAmount(invoice.amountCents, invoice.currency)}
            </p>
            <p className="text-xs text-[var(--color-ink-dim)] mt-1 uppercase tracking-wide">
              {invoice.currency} &middot; {invoice.paymentMethod?.replace(/_/g, " ")}
            </p>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* LEFT — Payment Details */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
            <h2 className="text-sm font-semibold text-[var(--color-ink)] mb-4 uppercase tracking-wider">
              Payment Details
            </h2>
            <dl className="space-y-4">
              <DetailRow label="Invoice">
                <Link
                  href={`/finance/invoices/${invoice.id}`}
                  className="font-mono text-sm text-indigo-400 hover:text-indigo-300 underline-offset-2 hover:underline"
                >
                  {invoice.invoiceNumber}
                </Link>
              </DetailRow>

              <DetailRow label="Amount">
                <span className="text-xl font-bold text-[var(--color-ink)]">
                  {fmtAmount(invoice.amountCents, invoice.currency)}
                </span>
              </DetailRow>

              <DetailRow label="Payment Method">
                <span className="capitalize">
                  {invoice.paymentMethod?.replace(/_/g, " ") ?? "—"}
                </span>
              </DetailRow>

              <DetailRow label="Provider Reference (UTR / Cheque)">
                {invoice.paymentReference ? (
                  <span className="font-mono text-sm">{invoice.paymentReference}</span>
                ) : (
                  <span className="text-[var(--color-ink-dim)]">Not provided</span>
                )}
              </DetailRow>

              <DetailRow label="Customer Notes">
                {invoice.notes ? (
                  <p className="text-sm leading-relaxed">{invoice.notes}</p>
                ) : (
                  <span className="text-[var(--color-ink-dim)]">No notes</span>
                )}
              </DetailRow>

              <DetailRow label="Payment Proof">
                {invoice.pdfUrl ? (
                  <a
                    href={invoice.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 underline-offset-2 hover:underline"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    View Payment Proof
                  </a>
                ) : (
                  <span className="text-[var(--color-ink-dim)]">Not uploaded</span>
                )}
              </DetailRow>

              <DetailRow label="Payment Received Date">
                {invoice.paidAt ? (
                  <span>{fmtDate(invoice.paidAt)}</span>
                ) : (
                  <span className="text-[var(--color-ink-dim)]">Not yet received</span>
                )}
              </DetailRow>

              {invoice.billingName && (
                <DetailRow label="Billing Name">
                  <span>{invoice.billingName}</span>
                </DetailRow>
              )}

              {invoice.billingEmail && (
                <DetailRow label="Billing Email">
                  <span>{invoice.billingEmail}</span>
                </DetailRow>
              )}

              {invoice.billingGstin && (
                <DetailRow label="GSTIN">
                  <span className="font-mono text-sm">{invoice.billingGstin}</span>
                </DetailRow>
              )}

              {invoice.dueAt && (
                <DetailRow label="Due Date">
                  <span>{fmtDate(invoice.dueAt)}</span>
                </DetailRow>
              )}
            </dl>
          </div>

          {/* Finance Action History */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
            <h2 className="text-sm font-semibold text-[var(--color-ink)] mb-4 uppercase tracking-wider">
              Finance Action History
            </h2>
            {actionHistory.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-dim)]">No actions recorded yet.</p>
            ) : (
              <ol className="relative border-l border-[var(--color-line)] ml-3 space-y-6">
                {actionHistory.map((action) => (
                  <li key={action.id} className="ml-6">
                    <span className="absolute -left-2.5 flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]">
                      <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    </span>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${actionTypeBadge(action.actionType)}`}
                        >
                          {actionTypeLabel(action.actionType)}
                        </span>
                        <span className="text-xs text-[var(--color-ink-dim)]">
                          {action.actorName}
                        </span>
                        <span className="text-xs text-[var(--color-ink-dim)]">
                          &middot; {fmtDate(action.createdAt)}
                        </span>
                      </div>
                      {action.notes && (
                        <p className="text-sm text-[var(--color-ink-dim)] leading-relaxed">
                          {action.notes}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* RIGHT — Actions panel + Org context */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {/* Actions panel */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
            <h2 className="text-sm font-semibold text-[var(--color-ink)] mb-4 uppercase tracking-wider">
              Actions
            </h2>

            {isPendingVerification && (
              <div className="space-y-4">
                <VerifyPaymentForm invoiceId={invoice.id} />
                <RejectPaymentForm invoiceId={invoice.id} />
              </div>
            )}

            {isVerified && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                  <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium text-emerald-300">
                    Payment Verified
                  </span>
                </div>
                <button
                  disabled
                  className="w-full rounded-xl border border-[var(--color-line)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-ink-dim)] cursor-not-allowed opacity-60"
                  title="Refund flow not yet implemented"
                >
                  Issue Refund
                </button>
              </div>
            )}

            {isFailed && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-red-300">Payment Rejected</p>
                  {invoice.notes && (
                    <p className="text-xs text-red-300/70 mt-0.5 leading-relaxed">
                      {invoice.notes}
                    </p>
                  )}
                </div>
              </div>
            )}

            {!isPendingVerification && !isVerified && !isFailed && (
              <p className="text-sm text-[var(--color-ink-dim)]">
                No actions available for this status.
              </p>
            )}
          </div>

          {/* Organization context */}
          <div className="rounded-2xl border border-[var(--color-line)] bg-white p-6">
            <h2 className="text-sm font-semibold text-[var(--color-ink)] mb-4 uppercase tracking-wider">
              Organization Context
            </h2>
            <dl className="space-y-3">
              <OrgDetailRow label="Organization">
                <span className="font-medium text-[var(--color-ink)]">
                  {orgCtx?.orgName ?? "Unknown"}
                </span>
              </OrgDetailRow>
              <OrgDetailRow label="Plan">
                {orgCtx?.planName ? (
                  <span className="inline-flex items-center rounded-md bg-indigo-500/20 px-2 py-0.5 text-xs font-medium text-indigo-300 border border-indigo-500/30">
                    {orgCtx.planName}
                  </span>
                ) : (
                  <span className="text-[var(--color-ink-dim)]">No plan</span>
                )}
              </OrgDetailRow>
              <OrgDetailRow label="Subscription Status">
                {orgCtx?.subStatus ? (
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                      orgCtx.subStatus === "active"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : orgCtx.subStatus === "trial"
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-red-500/20 text-red-300"
                    }`}
                  >
                    {orgCtx.subStatus.charAt(0).toUpperCase() + orgCtx.subStatus.slice(1)}
                  </span>
                ) : (
                  <span className="text-[var(--color-ink-dim)]">None</span>
                )}
              </OrgDetailRow>
              <OrgDetailRow label="Total Paid to Date">
                <span className="font-semibold text-[var(--color-ink)]">
                  {fmtAmount(totalPaid, invoice.currency)}
                </span>
              </OrgDetailRow>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components (server-safe) ─────────────────────────────────────────────

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-3 items-start">
      <dt className="text-xs font-medium text-[var(--color-ink-dim)] uppercase tracking-wide pt-0.5">
        {label}
      </dt>
      <dd className="text-sm text-[var(--color-ink)]">{children}</dd>
    </div>
  );
}

function OrgDetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-[var(--color-ink-dim)]">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}
