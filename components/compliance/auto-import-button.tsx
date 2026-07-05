"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { autoImportFromVendorsAction } from "@/lib/compliance/actions";

export function AutoImportButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ imported?: number; error?: string } | null>(null);
  const router = useRouter();

  const handleClick = () => {
    startTransition(async () => {
      const res = await autoImportFromVendorsAction();
      setResult(res);
      if (!res.error) router.refresh();
    });
  };

  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" disabled={pending} onClick={handleClick}>
        <Download className={`h-4 w-4 ${pending ? "animate-bounce" : ""}`} />
        {pending ? "Importing…" : "Import from vendors"}
      </Button>

      {result?.imported !== undefined && (
        <span className="flex items-center gap-1.5 text-xs text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {result.imported === 0
            ? "Already up to date"
            : `${result.imported} item${result.imported !== 1 ? "s" : ""} imported`}
        </span>
      )}
      {result?.error && (
        <span className="text-xs text-red-700">{result.error}</span>
      )}
    </div>
  );
}
