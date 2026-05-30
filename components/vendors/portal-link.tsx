"use client";

import { useState, useTransition } from "react";
import { Link2, Copy, CheckCheck } from "lucide-react";
import { generatePortalLink } from "@/lib/vendors/portal-actions";
import { Button } from "@/components/ui/button";

export function PortalLink({ vendorId }: { vendorId: string }) {
  const [pending, start] = useTransition();
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function generate() {
    start(async () => {
      const res = await generatePortalLink(vendorId);
      if ("error" in res) { setError(res.error); return; }
      setUrl(res.url);
    });
  }

  function copy() {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
          <Link2 className="h-4 w-4 text-[var(--color-ink-faint)]" /> Vendor portal
        </div>
        <Button variant="outline" size="sm" onClick={generate} disabled={pending}>
          <Link2 className="h-3.5 w-3.5" /> {pending ? "Generating…" : "Generate link"}
        </Button>
      </div>
      {url && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-3 py-2.5">
          <span className="flex-1 min-w-0 truncate text-xs text-[var(--color-blue)] font-mono">{url}</span>
          <button onClick={copy} className="shrink-0 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]">
            {copied ? <CheckCheck className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      )}
      <p className="text-xs text-[var(--color-ink-faint)]">
        Share this link with your vendor. They can upload documents without creating an account. Valid 30 days.
      </p>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
