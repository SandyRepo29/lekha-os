"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { computeBenchmarkAction } from "@/backend/src/modules/benchmarking/actions";

export function ComputeBenchmarkButton({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      await computeBenchmarkAction();
      router.refresh();
    });
  }

  return (
    <Button onClick={handleClick} disabled={isPending} size="sm" className={className}>
      <RefreshCw className={`h-4 w-4 mr-1.5 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Computing..." : "Run Benchmark"}
    </Button>
  );
}
