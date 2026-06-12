"use client";

import { useState, useTransition } from "react";
import { createScheduleAction } from "@/lib/executive-reporting/actions";
import { Plus, X, Loader2 } from "lucide-react";

const REPORT_TYPES = [
  { key: "board_governance", label: "Board Governance" },
  { key: "risk_committee", label: "Risk Committee" },
  { key: "audit_committee", label: "Audit Committee" },
  { key: "executive_governance", label: "Executive Governance" },
];

export function CreateScheduleButton() {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    reportType: "board_governance",
    frequency: "monthly",
    deliveryMethod: "email",
    recipientEmail: "",
  });

  function submit() {
    const recipients = form.recipientEmail ? [form.recipientEmail] : [];
    startTransition(async () => {
      await createScheduleAction({ ...form, recipients });
      setOpen(false);
      setForm({ name: "", reportType: "board_governance", frequency: "monthly", deliveryMethod: "email", recipientEmail: "" });
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        New Schedule
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold">New Scheduled Report</h2>
              <button onClick={() => setOpen(false)} className="text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Schedule Name</label>
                <input
                  className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]"
                  placeholder="e.g. Monthly Board Pack"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Report Type</label>
                <select
                  className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none"
                  value={form.reportType}
                  onChange={(e) => setForm({ ...form, reportType: e.target.value })}
                >
                  {REPORT_TYPES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Frequency</label>
                <select
                  className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none"
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                >
                  {["daily", "weekly", "monthly", "quarterly", "annually"].map((f) => (
                    <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Recipient Email</label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]"
                  placeholder="board@company.com"
                  value={form.recipientEmail}
                  onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-medium hover:bg-[var(--color-bg-2)]">
                Cancel
              </button>
              <button
                disabled={!form.name || pending}
                onClick={submit}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
