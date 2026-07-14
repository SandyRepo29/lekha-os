import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getFinanceDashboardAction } from "@/backend/src/modules/billing/actions";

export const dynamic = "force-dynamic";

function fmtINR(cents: number): string {
  const rupees = cents / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees);
}

function fmtDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtActionLabel(action: string): string {
  const map: Record<string, string> = {
    "billing.invoice_created": "Invoice Created",
    "billing.invoice_paid": "Invoice Paid",
    "billing.invoice_sent": "Invoice Sent",
    "billing.invoice_cancelled": "Invoice Cancelled",
    "billing.payment_recorded": "Payment Recorded",
    "billing.payment_verified": "Payment Verified",
    "billing.payment_rejected": "Payment Rejected",
    "billing.payment_proof_uploaded": "Proof Uploaded",
    "billing.refund_issued": "Refund Issued",
    "billing.invoice_pending_verification": "Pending Verification",
    "billing.invoice_refunded": "Refunded",
    "billing.invoice_partially_refunded": "Partially Refunded",
  };
  return map[action] ?? action.replace("billing.", "").replace(/_/g, " ");
}

function ActionBadge({ action }: { action: string }) {
  const label = fmtActionLabel(action);
  let cls = "text-[var(--color-ink-dim)] bg-[#F8F9FB]";
  if (action.includes("verified") || action.includes("paid")) {
    cls = "text-emerald-400 bg-emerald-400/10";
  } else if (action.includes("rejected") || action.includes("cancelled")) {
    cls = "text-red-400 bg-red-400/10";
  } else if (action.includes("pending") || action.includes("recorded") || action.includes("proof")) {
    cls = "text-amber-400 bg-amber-400/10";
  } else if (action.includes("refund")) {
    cls = "text-purple-400 bg-purple-400/10";
  }
  return (
    <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium capitalize ${cls}`}>
      {label}
    </span>
  );
}

function PaymentMethodBadge({ method }: { method: string | null }) {
  if (!method) return <span className="text-[var(--color-ink-dim)] text-xs">—</span>;
  const labels: Record<string, string> = {
    bank_transfer: "Bank Transfer",
    upi: "UPI",
    neft: "NEFT",
    rtgs: "RTGS",
    imps: "IMPS",
    cheque: "Cheque",
    card: "Card",
  };
  return (
    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-[var(--color-blue)]/10 text-[var(--color-blue)]">
      {labels[method] ?? method}
    </span>
  );
}

export default async function FinanceConsolePage() {
  const session = await requireUser();

  if (!["admin", "owner"].includes(session.org?.role ?? "")) {
    redirect("/dashboard");
  }

  const data = await getFinanceDashboardAction();

  const pendingCount = data.revenueStats.pendingCount;
  const paidCount = data.revenueStats.paidCount;
  const revenueThisMonth = data.revenueStats.totalPaidCents;
  const pendingTransactions = data.pendingTransactions.slice(0, 5);
  const recentActions = data.recentActions.slice(0, 10);

  // Active subscriptions placeholder — billing-repo doesn't expose cross-org count for AUDT Finance view
  // We derive from paidCount as a proxy (each paid invoice activates a subscription)
  const activeSubscriptions = paidCount;

  return (
    <div className="space-y-6">
      {/* ── Page heading ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
          Finance Console
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
          Payment verification and billing management
        </p>
      </div>

      {/* ── Stats strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Pending Verification */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5 border-l-2 border-l-amber-500">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-dim)]">
            Pending Verification
          </p>
          <p className="mt-2 text-2xl font-bold text-amber-400">{pendingCount}</p>
          <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">Awaiting review</p>
        </div>

        {/* Invoices This Month */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5 border-l-2 border-l-[var(--color-line)]">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-dim)]">
            Invoices This Month
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--color-ink)]">
            {data.recentActions.length}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">Total issued</p>
        </div>

        {/* Revenue This Month */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5 border-l-2 border-l-emerald-500">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-dim)]">
            Revenue This Month
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-400">
            {fmtINR(revenueThisMonth)}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">Paid invoices</p>
        </div>

        {/* Active Subscriptions */}
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5 border-l-2 border-l-[var(--color-blue)]">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-dim)]">
            Active Subscriptions
          </p>
          <p className="mt-2 text-2xl font-bold text-[var(--color-blue)]">
            {activeSubscriptions}
          </p>
          <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">Paid &#38; active</p>
        </div>
      </div>

      {/* ── Pending Transactions ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">
              Pending Verification
            </h2>
            <p className="text-xs text-[var(--color-ink-dim)]">
              Transactions waiting for payment confirmation
            </p>
          </div>
          <Link
            href="/finance/pending"
            className="text-xs text-[var(--color-blue)] hover:underline"
          >
            View All Pending →
          </Link>
        </div>

        {pendingTransactions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-[var(--color-ink-dim)]">
              No transactions pending verification.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {pendingTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-[var(--color-ink)] truncate">
                      {tx.billingName ?? tx.orgId}
                    </span>
                    <span className="text-xs text-[var(--color-ink-dim)]">
                      #{tx.invoiceNumber}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold text-amber-400">
                      {fmtINR(tx.amountCents)}
                    </span>
                    <PaymentMethodBadge method={tx.paymentMethod} />
                    <span className="text-xs text-[var(--color-ink-dim)]">
                      Received {fmtDate(tx.recordedAt)}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/finance/transactions/${tx.id}`}
                  className="shrink-0 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 hover:bg-amber-500/20 transition-colors"
                >
                  Verify Payment
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Recent Finance Actions ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white">
        <div className="border-b border-[var(--color-line)] px-5 py-4">
          <h2 className="text-sm font-semibold text-[var(--color-ink)]">
            Recent Finance Actions
          </h2>
          <p className="text-xs text-[var(--color-ink-dim)]">Last 10 billing events</p>
        </div>

        {recentActions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm text-[var(--color-ink-dim)]">No recent finance actions.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-line)]">
            {recentActions.map((act) => {
              const meta = act.metadata ?? {};
              const invoiceNumber = meta.invoiceNumber as string | undefined;
              const amountCents = meta.amountCents as number | undefined;
              return (
                <div
                  key={act.id}
                  className="flex items-center justify-between gap-4 px-5 py-3"
                >
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                    <ActionBadge action={act.action} />
                    {invoiceNumber && (
                      <span className="text-xs text-[var(--color-ink-dim)]">
                        #{invoiceNumber}
                      </span>
                    )}
                    {amountCents !== undefined && (
                      <span className="text-xs font-medium text-[var(--color-ink)]">
                        {fmtINR(amountCents)}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 text-xs text-[var(--color-ink-dim)]">
                    {fmtDate(act.createdAt)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────────── */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-ink)]">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Link
            href="/finance/pending"
            className="group rounded-2xl border border-[var(--color-line)] bg-white p-5 hover:bg-[#F8F9FB] transition-colors"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 text-lg">
              &#9201;
            </div>
            <p className="text-sm font-semibold text-[var(--color-ink)] group-hover:text-white transition-colors">
              Pending Transfers
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">
              Review awaiting payments
            </p>
          </Link>

          <Link
            href="/finance/invoices"
            className="group rounded-2xl border border-[var(--color-line)] bg-white p-5 hover:bg-[#F8F9FB] transition-colors"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--color-blue)]/10 text-[var(--color-blue)] text-lg">
              &#128196;
            </div>
            <p className="text-sm font-semibold text-[var(--color-ink)] group-hover:text-white transition-colors">
              All Invoices
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">
              Browse invoice history
            </p>
          </Link>

          <Link
            href="/finance/transactions"
            className="group rounded-2xl border border-[var(--color-line)] bg-white p-5 hover:bg-[#F8F9FB] transition-colors"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 text-lg">
              &#128179;
            </div>
            <p className="text-sm font-semibold text-[var(--color-ink)] group-hover:text-white transition-colors">
              Payment Transactions
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">
              All payment records
            </p>
          </Link>

          <Link
            href="/finance/reports"
            className="group rounded-2xl border border-[var(--color-line)] bg-white p-5 hover:bg-[#F8F9FB] transition-colors"
          >
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 text-lg">
              &#128202;
            </div>
            <p className="text-sm font-semibold text-[var(--color-ink)] group-hover:text-white transition-colors">
              Export Reports
            </p>
            <p className="mt-0.5 text-xs text-[var(--color-ink-dim)]">
              Download finance data
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
