"use client";

import { useTransition } from "react";
import { generateReportAction } from "@/lib/executive-reporting/actions";
import { Loader2, Plus } from "lucide-react";

export function GenerateReportButton({ reportType, label = "Generate" }: { reportType: string; label?: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => generateReportAction(reportType))}
      className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--color-blue)]/40 disabled:opacity-50 transition-all"
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
      {label}
    </button>
  );
}
