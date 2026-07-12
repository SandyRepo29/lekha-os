export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { createRoomAction } from "@/lib/auditor-collaboration/actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, DoorOpen } from "lucide-react";

export default async function NewAuditRoomPage() {
  await requireUser();

  async function handleSubmit(fd: FormData) {
    "use server";
    const data: Record<string, unknown> = {};
    for (const [k, v] of fd.entries()) { if (v) data[k] = v; }
    const result = await createRoomAction(data);
    if (result.data) redirect(`/auditor-collaboration/rooms/${result.data.id}`);
  }

  const frameworks = ["ISO 27001", "SOC 2 Type II", "DPDP", "PCI DSS", "HIPAA", "ISO 42001", "EU AI Act", "NIST CSF", "Custom"];
  const roomTypes = ["audit", "assessment", "due_diligence", "review", "consulting", "custom"];

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/auditor-collaboration/rooms" className="rounded-lg p-1.5 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <DoorOpen className="h-5 w-5 text-[var(--color-blue)]" /> New Audit Room
        </h1>
      </div>

      <form action={handleSubmit} className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1.5">Room Name *</label>
            <input name="name" required placeholder="e.g. ISO 27001 Audit 2026"
              className="w-full rounded-lg border border-[var(--color-line)] bg-slate-100 px-3 py-2 text-sm focus:border-[var(--color-blue)] focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1.5">Room Type</label>
            <select name="roomType" className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:border-[var(--color-blue)] focus:outline-none">
              {roomTypes.map(t => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1.5">Framework</label>
            <select name="framework" className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-2 text-sm focus:border-[var(--color-blue)] focus:outline-none">
              <option value="">— Select framework —</option>
              {frameworks.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1.5">Description</label>
            <textarea name="description" rows={3} placeholder="Brief description of this audit engagement..."
              className="w-full rounded-lg border border-[var(--color-line)] bg-slate-100 px-3 py-2 text-sm focus:border-[var(--color-blue)] focus:outline-none resize-none" />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1.5">Scope</label>
            <textarea name="scope" rows={2} placeholder="Define the audit scope..."
              className="w-full rounded-lg border border-[var(--color-line)] bg-slate-100 px-3 py-2 text-sm focus:border-[var(--color-blue)] focus:outline-none resize-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1.5">Start Date</label>
            <input type="date" name="startDate"
              className="w-full rounded-lg border border-[var(--color-line)] bg-slate-100 px-3 py-2 text-sm focus:border-[var(--color-blue)] focus:outline-none" />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1.5">End Date</label>
            <input type="date" name="endDate"
              className="w-full rounded-lg border border-[var(--color-line)] bg-slate-100 px-3 py-2 text-sm focus:border-[var(--color-blue)] focus:outline-none" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/auditor-collaboration/rooms"
            className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm hover:bg-slate-100">
            Cancel
          </Link>
          <button type="submit"
            className="rounded-lg bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            Create Audit Room
          </button>
        </div>
      </form>
    </div>
  );
}
