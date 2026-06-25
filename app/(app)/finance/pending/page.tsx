export const dynamic = "force-dynamic";

// ─── Server page: Pending Verification ───────────────────────────────────────
// Finance team verifies incoming bank transfers / UPI payments.
// Client sub-components (VerifyButton, RejectButton) are defined inline below.

import Link from "next/link";
import { ArrowLeft, Clock, AlertCircle, CheckCircle2, XCircle, FileText, StickyNote, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { VerifyButton, RejectButton, AddNotesButton } from "./client-actions";

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMethod = "bank_transfer" | "manual_invoice" | "upi";
type PaymentStatus = "awaiting_payment" | "pending_verification" | "verified" | "rejected";

interface PendingTransaction {
  id: string;
  organizationName: string;
  invoiceNumber: string;
  invoiceAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  utrReference?: string;
  receivedDate?: string;
  customerNotes?: string;
  paymentProofUrl?: string;
  status: PaymentStatus;
  createdAt: string;
}

// ─── Mock data (replace with DB query when finance tables exist) ───────────────

function getMockTransactions(): PendingTransaction[] {
  return [
    {
      id: "txn-001",
      organizationName: "Infosys Limited",
      invoiceNumber: "INV-2026-0041",
      invoiceAmount: 249000,
      currency: "INR",
      paymentMethod: "bank_transfer",
      utrReference: "HDFC2026061200123456",
      receivedDate: "2026-06-12",
      customerNotes: "Payment transferred from our HDFC current account. Please verify and activate Enterprise plan.",
      paymentProofUrl: "https://example.com/proof/txn-001.pdf",
      status: "pending_verification",
      createdAt: "2026-06-12T09:15:00Z",
    },
    {
      id: "txn-002",
      organizationName: "Tata Consultancy Services",
      invoiceNumber: "INV-2026-0038",
      invoiceAmount: 99000,
      currency: "INR",
      paymentMethod: "upi",
      utrReference: "UPI2026061109876543",
      receivedDate: "2026-06-11",
      customerNotes: "Paid via UPI — UPI ID: finance@tcs",
      status: "pending_verification",
      createdAt: "2026-06-11T14:30:00Z",
    },
    {
      id: "txn-003",
      organizationName: "Wipro Technologies",
      invoiceNumber: "INV-2026-0035",
      invoiceAmount: 249000,
      currency: "INR",
      paymentMethod: "manual_invoice",
      receivedDate: undefined,
      customerNotes: "PO raised internally. Payment will be processed within 30 days per our procurement policy.",
      status: "awaiting_payment",
      createdAt: "2026-06-08T11:00:00Z",
    },
    {
      id: "txn-004",
      organizationName: "HCL Technologies",
      invoiceNumber: "INV-2026-0033",
      invoiceAmount: 49000,
      currency: "INR",
      paymentMethod: "bank_transfer",
      utrReference: "ICIC2026060567891234",
      receivedDate: "2026-06-05",
      customerNotes: "Transferred from ICICI account. Kindly acknowledge.",
      paymentProofUrl: "https://example.com/proof/txn-004.pdf",
      status: "pending_verification",
      createdAt: "2026-06-05T16:45:00Z",
    },
    {
      id: "txn-005",
      organizationName: "Mahindra & Mahindra",
      invoiceNumber: "INV-2026-0029",
      invoiceAmount: 99000,
      currency: "INR",
      paymentMethod: "bank_transfer",
      receivedDate: "2026-06-02",
      customerNotes: "",
      status: "pending_verification",
      createdAt: "2026-06-02T10:20:00Z",
    },
  ];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isThisWeek(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  return date >= weekAgo && date <= now;
}

function isThisMonth(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PaymentMethodBadge({ method }: { method: PaymentMethod }) {
  const config: Record<PaymentMethod, { label: string; className: string }> = {
    bank_transfer: {
      label: "Bank Transfer",
      className: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    },
    manual_invoice: {
      label: "Manual Invoice",
      className: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    },
    upi: {
      label: "UPI",
      className: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    },
  };
  const { label, className } = config[method];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  if (status === "pending_verification") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-400">
        <Clock className="h-3 w-3" />
        Pending Verification
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 border border-sky-500/20 px-2.5 py-0.5 text-xs font-medium text-sky-400">
      <Clock className="h-3 w-3" />
      Awaiting Payment
    </span>
  );
}

function TransactionCard({ txn }: { txn: PendingTransaction }) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: core info */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Org name + status */}
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-ink)] truncate">
              {txn.organizationName}
            </h3>
            <StatusBadge status={txn.status} />
          </div>

          {/* Invoice row */}
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--color-ink)]">
              {formatCurrency(txn.invoiceAmount, txn.currency)}
            </span>
            <span className="flex items-center gap-1 text-sm text-[var(--color-ink-dim)]">
              <FileText className="h-3.5 w-3.5" />
              {txn.invoiceNumber}
            </span>
            <PaymentMethodBadge method={txn.paymentMethod} />
          </div>

          {/* UTR / Reference */}
          {txn.utrReference && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--color-ink-dim)]">UTR / Ref:</span>
              <code className="rounded bg-white/[0.06] px-2 py-0.5 font-mono text-xs text-[var(--color-ink)]">
                {txn.utrReference}
              </code>
            </div>
          )}

          {/* Received date */}
          {txn.receivedDate && (
            <div className="flex items-center gap-2 text-sm text-[var(--color-ink-dim)]">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                Received on{" "}
                <span className="text-[var(--color-ink)]">{formatDate(txn.receivedDate)}</span>
              </span>
            </div>
          )}

          {/* Customer notes */}
          {txn.customerNotes && (
            <div className="rounded-lg border border-[var(--color-line)] bg-white/[0.02] p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[var(--color-ink-dim)]">
                <StickyNote className="h-3 w-3" />
                Customer Notes
              </div>
              <p className="text-sm text-[var(--color-ink)]">{txn.customerNotes}</p>
            </div>
          )}

          {/* Payment proof */}
          {txn.paymentProofUrl && (
            <a
              href={txn.paymentProofUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--color-blue)] hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Payment Proof
            </a>
          )}
        </div>

        {/* Right: actions */}
        {txn.status !== "awaiting_payment" && (
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <VerifyButton transactionId={txn.id} orgName={txn.organizationName} />
            <RejectButton transactionId={txn.id} orgName={txn.organizationName} />
            <AddNotesButton transactionId={txn.id} />
          </div>
        )}
        {txn.status === "awaiting_payment" && (
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <AddNotesButton transactionId={txn.id} />
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Filter tab type ──────────────────────────────────────────────────────────

type FilterTab = "all" | "awaiting_payment" | "pending_verification" | "this_week" | "this_month";

const TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "awaiting_payment", label: "Awaiting Payment" },
  { id: "pending_verification", label: "Pending Verification" },
  { id: "this_week", label: "This Week" },
  { id: "this_month", label: "This Month" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PendingPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  await requireUser();

  const params = await searchParams;
  const activeTab = ((params.tab as string) ?? "all") as FilterTab;

  const allTransactions = getMockTransactions();

  // Apply filter
  const transactions = allTransactions.filter((txn) => {
    switch (activeTab) {
      case "awaiting_payment":
        return txn.status === "awaiting_payment";
      case "pending_verification":
        return txn.status === "pending_verification";
      case "this_week":
        return isThisWeek(txn.createdAt);
      case "this_month":
        return isThisMonth(txn.createdAt);
      default:
        return true;
    }
  });

  // Summary counts
  const totalPending = allTransactions.filter((t) => t.status === "pending_verification").length;
  const totalAwaiting = allTransactions.filter((t) => t.status === "awaiting_payment").length;
  const totalAmount = allTransactions
    .filter((t) => t.status === "pending_verification")
    .reduce((sum, t) => sum + t.invoiceAmount, 0);

  return (
    <div className="space-y-6 p-6">
      {/* Back link + heading */}
      <div>
        <Link
          href="/finance"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Finance
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
              Pending Verification
            </h1>
            <p className="mt-1 text-sm text-[var(--color-ink-dim)]">
              Review incoming bank transfers and approve or reject payments.
            </p>
          </div>
          {/* Summary strip */}
          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl border border-[var(--color-line)] bg-amber-500/5 px-4 py-2.5 text-center">
              <p className="text-xs text-[var(--color-ink-dim)]">Needs Verification</p>
              <p className="font-[family-name:var(--font-display)] text-lg font-bold text-amber-400">
                {totalPending}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--color-line)] bg-sky-500/5 px-4 py-2.5 text-center">
              <p className="text-xs text-[var(--color-ink-dim)]">Awaiting Payment</p>
              <p className="font-[family-name:var(--font-display)] text-lg font-bold text-sky-400">
                {totalAwaiting}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--color-line)] bg-emerald-500/5 px-4 py-2.5 text-center">
              <p className="text-xs text-[var(--color-ink-dim)]">Pending Amount</p>
              <p className="font-[family-name:var(--font-display)] text-lg font-bold text-emerald-400">
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: "INR",
                  maximumFractionDigits: 0,
                }).format(totalAmount)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 rounded-2xl border border-[var(--color-line)] bg-white/[0.02] p-1">
        {TABS.map((tab) => {
          const count = allTransactions.filter((txn) => {
            switch (tab.id) {
              case "awaiting_payment":
                return txn.status === "awaiting_payment";
              case "pending_verification":
                return txn.status === "pending_verification";
              case "this_week":
                return isThisWeek(txn.createdAt);
              case "this_month":
                return isThisMonth(txn.createdAt);
              default:
                return true;
            }
          }).length;

          const isActive = activeTab === tab.id;
          return (
            <Link
              key={tab.id}
              href={`/finance/pending?tab=${tab.id}`}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/[0.08] text-[var(--color-ink)]"
                  : "text-[var(--color-ink-dim)] hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                  isActive
                    ? "bg-white/[0.12] text-[var(--color-ink)]"
                    : "bg-white/[0.05] text-[var(--color-ink-dim)]"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Transaction list */}
      {transactions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
          </div>
          <h3 className="font-[family-name:var(--font-display)] text-base font-semibold text-[var(--color-ink)]">
            No pending payments
          </h3>
          <p className="mt-1 max-w-xs text-sm text-[var(--color-ink-dim)]">
            {activeTab === "all"
              ? "All payments have been verified. New transactions will appear here when customers submit payment details."
              : "No transactions match this filter. Try switching to All to see everything."}
          </p>
          {activeTab !== "all" && (
            <Link href="/finance/pending?tab=all" className="mt-4">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((txn) => (
            <TransactionCard key={txn.id} txn={txn} />
          ))}
        </div>
      )}
    </div>
  );
}
