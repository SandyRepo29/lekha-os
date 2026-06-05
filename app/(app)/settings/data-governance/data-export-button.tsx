"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export function DataExportButton({ orgId, orgName }: { orgId: string; orgName: string }) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/export/tenant-data?orgId=${orgId}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${orgName.replace(/\s+/g, "_")}_data_export.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Export failed. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 rounded-xl border border-[var(--color-line)] bg-white/[0.03] px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      {loading ? "Preparing export…" : "Export Tenant Data"}
    </button>
  );
}
