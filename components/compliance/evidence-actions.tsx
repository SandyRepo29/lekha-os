"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectOption } from "@/components/ui/select";
import {
  updateEvidenceStatusAction,
  deleteEvidenceAction,
} from "@/backend/src/modules/compliance/actions";

// ---- Inline status selector ----------------------------------

export function EvidenceStatusSelect({
  evidenceId,
  currentStatus,
}: {
  evidenceId: string;
  currentStatus: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Select
      defaultValue={currentStatus}
      disabled={pending}
      onChange={(e) => {
        const status = e.target.value as
          | "draft"
          | "pending_review"
          | "approved"
          | "expired"
          | "archived";
        startTransition(async () => {
          await updateEvidenceStatusAction(evidenceId, status);
          router.refresh();
        });
      }}
    >
      <SelectOption value="draft">Draft</SelectOption>
      <SelectOption value="pending_review">Pending Review</SelectOption>
      <SelectOption value="approved">Approved</SelectOption>
      <SelectOption value="expired">Expired</SelectOption>
      <SelectOption value="archived">Archived</SelectOption>
    </Select>
  );
}

// ---- Delete evidence ----------------------------------------

export function DeleteEvidence({
  evidenceId,
  evidenceTitle,
}: {
  evidenceId: string;
  evidenceTitle: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-ink-dim)]">
          Delete &ldquo;{evidenceTitle.slice(0, 40)}{evidenceTitle.length > 40 ? "…" : ""}&rdquo;?
        </span>
        <Button
          variant="danger"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await deleteEvidenceAction(evidenceId);
              if (res?.error) setError(res.error);
            })
          }
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </Button>
        <Button variant="subtle" size="sm" onClick={() => setConfirming(false)}>
          Cancel
        </Button>
        {error && <span className="text-xs text-red-700">{error}</span>}
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
      <Trash2 className="h-4 w-4" />
      Delete
    </Button>
  );
}
