"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runMonitoringAction, resolveAlertAction } from "@/backend/src/modules/trust-intelligence/actions";

type Props = {
  alertId?: string;
  variant?: "run" | "resolve";
};

export function MonitoringActions({ alertId, variant }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (variant === "resolve" && alertId) {
    if (done) return <span className="text-xs text-emerald-700">Resolved</span>;
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await resolveAlertAction(alertId);
            setDone(true);
            router.refresh();
          })
        }
      >
        {pending ? (
          <RefreshCw className="h-3 w-3 animate-spin" />
        ) : (
          <CheckCircle className="h-3 w-3" />
        )}
        <span className="ml-1 text-xs">Resolve</span>
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await runMonitoringAction();
          router.refresh();
        })
      }
    >
      <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
      <span className="ml-1.5 text-sm">{pending ? "Running..." : "Run Monitoring"}</span>
    </Button>
  );
}
