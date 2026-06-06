"use client";

import { useState } from "react";
import Link from "next/link";
import { closeFindingAction } from "@/lib/audit/actions";
import { Button } from "@/components/ui/button";
import type { AuditFinding } from "@/lib/db/schema";

export function FindingActions({
  finding,
  auditId,
}: {
  finding: AuditFinding;
  auditId: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClose() {
    setBusy(true);
    setError(null);
    const res = await closeFindingAction(finding.id, auditId);
    if (res?.error) setError(res.error);
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-400">{error}</span>}
      {finding.status !== "closed" && (
        <Button variant="ghost" size="sm" disabled={busy} onClick={handleClose}>
          {busy ? "Closing…" : "Close"}
        </Button>
      )}
      <Link href={`/audits/${auditId}/capas?findingId=${finding.id}`}>
        <Button variant="ghost" size="sm">Add CAPA</Button>
      </Link>
    </div>
  );
}
