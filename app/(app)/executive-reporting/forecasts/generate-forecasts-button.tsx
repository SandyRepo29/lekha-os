"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateForecastsAction } from "@/backend/src/modules/executive-reporting/actions";
import { RefreshCw, Loader2 } from "lucide-react";

export function GenerateForecastsButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await generateForecastsAction(); router.refresh(); })}
      className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-4 py-2 text-sm font-semibold hover:border-[var(--color-blue)]/40 disabled:opacity-50"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
      Generate Forecasts
    </button>
  );
}
