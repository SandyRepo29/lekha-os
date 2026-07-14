"use client";

import { useState } from "react";
import { completeCapaAction } from "@/backend/src/modules/audit-management/actions";
import { Button } from "@/components/ui/button";
import type { CorrectiveAction } from "@/lib/db/schema";

export function CapaActions({
  capa,
  auditId,
}: {
  capa: CorrectiveAction;
  auditId: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    setBusy(true);
    setError(null);
    const res = await completeCapaAction(capa.id, auditId);
    if (res?.error) setError(res.error);
    setBusy(false);
  }

  if (capa.status === "completed") return null;

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-400">{error}</span>}
      <Button variant="ghost" size="sm" disabled={busy} onClick={handleComplete}>
        {busy ? "Completing…" : "Mark Complete"}
      </Button>
    </div>
  );
}
