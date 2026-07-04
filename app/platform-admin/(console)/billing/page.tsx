export const dynamic = "force-dynamic";

import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { getBillingOverviewAction } from "@/lib/platform-admin/actions";
import { Receipt, IndianRupee } from "lucide-react";
import { MarkPaidButton } from "@/components/platform-admin/invoice-actions";

const STATUS_STYLE: Record<string, string> = {
  paid:    "bg-emerald-500/20 text-emerald-300",
  pending: "bg-amber-500/20 text-amber-300",
  overdue: "bg-red-500/20 text-red-300",
  draft:   "bg-white/10 text-white/40",
  cancelled:"bg-white/10 text-white/30",
};

export default async function BillingPage() {
  await requirePlatformUser();
  const { data } = await getBillingOverviewAction();
  const invoices = data?.invoices ?? [];
  const stats = (data?.stats ?? {}) as Record<string, unknown>;
  const revenueInr = Math.round(Number(stats.revenue_cents ?? 0) / 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Billing & Invoices</h1>
        <p className="mt-0.5 text-sm text-white/40">Platform-wide invoice history and revenue metrics.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Invoices", value: String(stats.total ?? 0),   color: "text-white" },
          { label: "Paid",           value: String(stats.paid ?? 0),    color: "text-emerald-400" },
          { label: "Pending",        value: String(stats.pending ?? 0), color: "text-amber-400" },
          { label: "Overdue",        value: String(stats.overdue ?? 0), color: "text-red-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="mt-0.5 text-xs text-white/40">{s.label}</div>
          </div>
        ))}
      </div>

      {revenueInr > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
          <IndianRupee className="h-5 w-5 text-emerald-400" />
          <div>
            <div className="text-sm text-white/40">Total Collected Revenue</div>
            <div className="text-xl font-bold text-emerald-400">
              &#x20B9;{revenueInr.toLocaleString("en-IN")}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-[#30363d] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#30363d] px-5 py-3 bg-white/[0.02]">
          <Receipt className="h-4 w-4 text-white/40" />
          <h2 className="text-sm font-semibold text-white">Recent Invoices</h2>
        </div>
        {invoices.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-white/30">No invoices yet.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#30363d] bg-white/[0.01]">
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Invoice #</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Organization</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Amount</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Issued</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-white/40 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {invoices.map((inv) => (
                <tr key={inv.id as string} className="hover:bg-white/[0.015] transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-white/60">{(inv.invoice_number as string) ?? "—"}</td>
                  <td className="px-5 py-3 text-sm text-white">{inv.org_name as string}</td>
                  <td className="px-5 py-3 text-sm text-white">
                    {inv.amount_cents ? `${(inv.currency as string) ?? "INR"} ${Math.round(Number(inv.amount_cents) / 100).toLocaleString()}` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[inv.status as string] ?? "bg-white/5 text-white/40"}`}>
                      {inv.status as string}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-white/30">
                    {inv.issued_at ? new Date(inv.issued_at as string).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {(inv.status === "pending" || inv.status === "overdue") && (
                      <MarkPaidButton invoiceId={inv.id as string} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
