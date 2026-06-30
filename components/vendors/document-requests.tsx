"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Send, ChevronDown } from "lucide-react";
import { createDocumentRequest, updateRequestStatus, type RequestState } from "@/lib/requests/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { DOCUMENT_TYPES } from "@/lib/constants/vendor-options";
import type { DocumentRequest } from "@/lib/db/schema";

const STATUS_COLORS: Record<string, string> = {
  requested:  "text-[var(--color-blue)] border-[var(--color-blue)]/30 bg-[var(--color-blue)]/10",
  submitted:  "text-amber-400 border-amber-500/30 bg-amber-500/10",
  approved:   "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
  rejected:   "text-red-400 border-red-500/30 bg-red-500/10",
  expired:    "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-[#F8F9FB]",
};

function RequestRow({ req, vendorId }: { req: DocumentRequest; vendorId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);

  const nextStatuses = req.status === "requested" ? ["submitted", "expired"]
    : req.status === "submitted" ? ["approved", "rejected"]
    : [];

  return (
    <div className="flex items-start gap-3 py-3 border-b border-[var(--color-line)] last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{req.documentType}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[req.status] ?? ""}`}>
            {req.status}
          </span>
          {req.priority === "high" && <span className="text-xs text-red-400 font-semibold">· High priority</span>}
        </div>
        {req.message && <p className="text-xs text-[var(--color-ink-dim)] mt-0.5">{req.message}</p>}
        {req.dueDate && <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">Due: {req.dueDate}</p>}
      </div>
      {nextStatuses.length > 0 && (
        <div className="relative">
          <button onClick={() => setOpen(!open)} disabled={pending}
            className="flex items-center gap-1 text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] border border-[var(--color-line)] rounded-lg px-2 py-1.5 transition-colors">
            Update <ChevronDown className="h-3 w-3" />
          </button>
          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-8 z-20 min-w-[120px] rounded-xl border border-[var(--color-line-strong)] bg-[#0d0f1a] shadow-xl overflow-hidden">
                {nextStatuses.map((s) => (
                  <button key={s} onClick={() => { setOpen(false); start(async () => { await updateRequestStatus(req.id, vendorId, s); router.refresh(); }); }}
                    className="w-full text-left px-3 py-2.5 text-sm capitalize text-[var(--color-ink-dim)] hover:bg-[#F8F9FB] hover:text-[var(--color-ink)] transition-colors">
                    Mark {s}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function NewRequestForm({ vendorId }: { vendorId: string }) {
  const [state, action, pending] = useActionState<RequestState, FormData>(createDocumentRequest, undefined);
  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState("");
  const isOther = docType === "Other";

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-sm text-[var(--color-blue)] hover:underline mt-2">
        <Send className="h-3.5 w-3.5" /> Request a document
      </button>
    );
  }

  return (
    <form action={action} className="mt-3 space-y-3 rounded-xl border border-[var(--color-line)] p-4">
      <input type="hidden" name="vendorId" value={vendorId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="reqDocType">Document type</Label>
          <Select id="reqDocType" name="documentType" value={docType} onChange={(e) => setDocType(e.target.value)}>
            <SelectOption value="">Select type…</SelectOption>
            {DOCUMENT_TYPES.map((g) => (
              <optgroup key={g.group} label={g.group} style={{ background: "#0d0f1a", color: "#9aa0b5" }}>
                {g.items.map((item) => <SelectOption key={item} value={item}>{item}</SelectOption>)}
              </optgroup>
            ))}
            <SelectOption value="Other">Other / Custom</SelectOption>
          </Select>
          {isOther && <Input name="documentType" className="mt-1.5" placeholder="Custom document name" autoFocus />}
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select id="priority" name="priority" defaultValue="medium">
            <SelectOption value="low">Low</SelectOption>
            <SelectOption value="medium">Medium</SelectOption>
            <SelectOption value="high">High</SelectOption>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="dueDate">Due date</Label>
          <Input id="dueDate" name="dueDate" type="date" />
        </div>
        <div>
          <Label htmlFor="message">Message to vendor</Label>
          <Input id="message" name="message" placeholder="Please provide the latest certificate…" />
        </div>
      </div>

      {state?.error && <p className="text-xs text-red-400">{state.error}</p>}
      {state?.ok && <p className="text-xs text-emerald-400">Request created.</p>}

      <div className="flex gap-2 pt-1">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          <Send className="h-3.5 w-3.5" /> {pending ? "Sending…" : "Send request"}
        </Button>
        <Button type="button" variant="subtle" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}

export function DocumentRequests({ requests, vendorId }: { requests: DocumentRequest[]; vendorId: string }) {
  const open = requests.filter((r) => r.status === "requested" || r.status === "submitted");
  const closed = requests.filter((r) => r.status === "approved" || r.status === "rejected" || r.status === "expired");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--color-ink)]">Document requests ({requests.length})</span>
      </div>

      {open.length > 0 && (
        <div>
          {open.map((r) => <RequestRow key={r.id} req={r} vendorId={vendorId} />)}
        </div>
      )}

      {closed.length > 0 && (
        <details>
          <summary className="cursor-pointer text-xs text-[var(--color-ink-faint)] hover:text-[var(--color-ink-dim)] py-1">
            {closed.length} closed request{closed.length > 1 ? "s" : ""}
          </summary>
          <div className="mt-1 opacity-70">
            {closed.map((r) => <RequestRow key={r.id} req={r} vendorId={vendorId} />)}
          </div>
        </details>
      )}

      {requests.length === 0 && (
        <p className="text-xs text-[var(--color-ink-faint)]">No document requests yet.</p>
      )}

      <NewRequestForm vendorId={vendorId} />
    </div>
  );
}
