"use client";

import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateExecutiveSummaryAction } from "@/backend/src/modules/risk-lens/actions";
import { useRouter } from "next/navigation";

export function ExecutiveSummaryPanel() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    const result = await generateExecutiveSummaryAction();
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-400">{error}</span>}
      <Button type="button" variant="ghost" size="sm" disabled={loading} onClick={handleGenerate}>
        {loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generating…</> : <><Sparkles className="h-3.5 w-3.5" /> Generate</>}
      </Button>
    </div>
  );
}
