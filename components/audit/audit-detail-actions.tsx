"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArchiveDialog } from "@/components/ui/archive-dialog";
import { updateAuditStatusAction, deleteAuditAction } from "@/lib/audit/actions";
import type { Audit } from "@/lib/db/schema";

export function AuditDetailActions({ audit }: { audit: Audit }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [archiveOpen, setArchiveOpen] = useState(false);

  async function handleStatus(
    status: "planned" | "in_progress" | "completed" | "cancelled"
  ) {
    setBusy(true);
    setError(null);
    const res = await updateAuditStatusAction(audit.id, status);
    if (res?.error) setError(res.error);
    setBusy(false);
  }

  const nextStatus =
    audit.status === "planned"
      ? "in_progress"
      : audit.status === "in_progress"
      ? "completed"
      : null;

  const nextLabel =
    nextStatus === "in_progress"
      ? "Start Audit"
      : nextStatus === "completed"
      ? "Complete Audit"
      : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {error && (
        <span className="text-xs text-red-400">{error}</span>
      )}
      {nextStatus && nextLabel && (
        <Button
          variant="primary"
          size="sm"
          disabled={busy}
          onClick={() => handleStatus(nextStatus)}
        >
          {busy ? "Updating…" : nextLabel}
        </Button>
      )}
      {audit.status !== "cancelled" && audit.status !== "completed" && (
        <Button
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => handleStatus("cancelled")}
        >
          Cancel
        </Button>
      )}
      <Link href={`/audits/${audit.id}/edit`}>
        <Button variant="ghost" size="sm">Edit</Button>
      </Link>
      <Button
        variant="ghost"
        size="sm"
        disabled={busy}
        onClick={() => setArchiveOpen(true)}
        className="text-red-400 hover:text-red-300"
      >
        Delete
      </Button>
      <ArchiveDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        itemName={audit.name}
        itemType="audit"
        onArchive={async () => {
          setArchiveOpen(false);
          setBusy(true);
          await deleteAuditAction(audit.id);
          setBusy(false);
        }}
        onDelete={async () => {
          setArchiveOpen(false);
          setBusy(true);
          await deleteAuditAction(audit.id);
          setBusy(false);
        }}
      />
    </div>
  );
}
