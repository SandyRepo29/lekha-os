"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { VENDOR_DOCS_BUCKET, buildVendorDocPath } from "@/lib/storage/paths";
import { registerDocument } from "@/backend/src/modules/vendor-hub/documents-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectGroup, SelectOption } from "@/components/ui/select";
import { DOCUMENT_TYPES } from "@/lib/constants/vendor-options";

export function DocumentUpload({ orgId, vendorId }: { orgId: string; vendorId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Choose a file to upload."); return; }
    setBusy(true);
    try {
      const supabase = createClient();
      const path = buildVendorDocPath(orgId, vendorId, file.name);
      const { error: upErr } = await supabase.storage
        .from(VENDOR_DOCS_BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type || undefined });
      if (upErr) throw new Error(upErr.message);

      const fd = new FormData();
      fd.set("vendorId", vendorId);
      fd.set("storagePath", path);
      fd.set("fileName", file.name);
      fd.set("documentType", docType || file.name);
      const res = await registerDocument(undefined, fd);
      if (res?.error) throw new Error(res.error);

      setDocType("");
      if (fileRef.current) fileRef.current.value = "";
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  const isOther = docType === "Other";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">Upload document</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="docType">Document type</Label>
          <Select id="docType" value={docType} onChange={(e) => setDocType(e.target.value)}>
            <SelectOption value="">Select type…</SelectOption>
            {DOCUMENT_TYPES.map((g) => (
              <SelectGroup key={g.group} label={g.group}>
                {g.items.map((item) => (
                  <SelectOption key={item} value={item}>{item}</SelectOption>
                ))}
              </SelectGroup>
            ))}
            <SelectOption value="Other">Other / Custom</SelectOption>
          </Select>
          {isOther && (
            <Input
              className="mt-2"
              placeholder="e.g. CERT-IN Audit Report"
              onChange={(e) => setDocType(e.target.value === "" ? "Other" : e.target.value)}
              autoFocus
            />
          )}
        </div>

        <div>
          <Label htmlFor="file">File <span className="text-[var(--color-ink-faint)]">(PDF, PNG, JPG)</span></Label>
          <input
            id="file"
            ref={fileRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
            className="h-11 w-full rounded-xl border border-[var(--color-line-strong)] bg-white px-3 py-2 text-sm text-[var(--color-ink-dim)] file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-sm file:text-[var(--color-ink)]"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <Button type="submit" variant="primary" disabled={busy}>
        <UploadCloud className="h-4 w-4" />
        {busy ? "Uploading & analyzing…" : "Upload document"}
      </Button>
    </form>
  );
}
