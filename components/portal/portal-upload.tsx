"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { VENDOR_DOCS_BUCKET, buildVendorDocPath } from "@/lib/storage/paths";
import { registerDocument } from "@/lib/documents/actions";
import { DOCUMENT_TYPES } from "@/lib/constants/vendor-options";
import { Select, SelectOption } from "@/components/ui/select";

export function PortalUpload({ orgId, vendorId, token }: { orgId: string; vendorId: string; token: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Choose a file."); return; }
    if (!docType) { setError("Select a document type."); return; }
    setBusy(true);
    try {
      const supabase = createClient();
      const path = buildVendorDocPath(orgId, vendorId, file.name);
      const { error: upErr } = await supabase.storage
        .from(VENDOR_DOCS_BUCKET)
        .upload(path, file, { upsert: false });
      if (upErr) throw new Error(upErr.message);

      const fd = new FormData();
      fd.set("vendorId", vendorId);
      fd.set("storagePath", path);
      fd.set("fileName", file.name);
      fd.set("documentType", docType);
      const res = await registerDocument(undefined, fd);
      if (res?.error) throw new Error(res.error);

      setDone(true);
      setDocType("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-8">
        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        <p className="font-semibold text-emerald-300">Document uploaded successfully!</p>
        <button onClick={() => setDone(false)} className="text-sm text-white/50 hover:text-white/80 underline">Upload another</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5">Document type *</label>
          <Select value={docType} onChange={(e) => setDocType(e.target.value)}>
            <SelectOption value="">Select type…</SelectOption>
            {DOCUMENT_TYPES.map((g) => (
              <optgroup key={g.group} label={g.group} style={{ background: "#0d0f1a", color: "#9aa0b5" }}>
                {g.items.map((item) => <SelectOption key={item} value={item}>{item}</SelectOption>)}
              </optgroup>
            ))}
          </Select>
        </div>
        <div>
          <label className="block text-xs font-medium text-white/60 mb-1.5">File (PDF, PNG, JPG) *</label>
          <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white/60 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-white/80" />
        </div>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button type="submit" disabled={busy}
        className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        style={{ background: "linear-gradient(120deg, #6366f1, #8b5cf6)" }}>
        <UploadCloud className="h-4 w-4" /> {busy ? "Uploading…" : "Upload document"}
      </button>
    </form>
  );
}
