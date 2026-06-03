"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, CheckCircle2, Clock, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  updatePolicyStatusAction,
  deletePolicyAction,
} from "@/lib/compliance/actions";

// ---- Workflow buttons (Draft → Review → Approved) -----------

export function PolicyWorkflowButtons({
  policyId,
  currentStatus,
}: {
  policyId: string;
  currentStatus: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const act = (status: "draft" | "review" | "approved" | "archived" | "expired") => {
    startTransition(async () => {
      const res = await updatePolicyStatusAction(policyId, status);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {currentStatus === "draft" && (
        <Button variant="ghost" size="sm" disabled={pending} onClick={() => act("review")}>
          <Clock className="h-4 w-4" /> Submit for review
        </Button>
      )}
      {currentStatus === "review" && (
        <>
          <Button variant="ghost" size="sm" disabled={pending} onClick={() => act("approved")}>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Approve
          </Button>
          <Button variant="subtle" size="sm" disabled={pending} onClick={() => act("draft")}>
            Back to draft
          </Button>
        </>
      )}
      {currentStatus === "approved" && (
        <Button variant="subtle" size="sm" disabled={pending} onClick={() => act("archived")}>
          <Archive className="h-4 w-4" /> Archive
        </Button>
      )}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}

// ---- Delete policy ------------------------------------------

export function DeletePolicy({
  policyId,
  policyName,
}: {
  policyId: string;
  policyName: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--color-ink-dim)]">
          Delete &ldquo;{policyName.slice(0, 40)}{policyName.length > 40 ? "…" : ""}&rdquo;?
        </span>
        <Button
          variant="danger"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await deletePolicyAction(policyId);
              if (res?.error) setError(res.error);
            })
          }
        >
          {pending ? "Deleting…" : "Yes, delete"}
        </Button>
        <Button variant="subtle" size="sm" onClick={() => setConfirming(false)}>Cancel</Button>
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
      <Trash2 className="h-4 w-4" /> Delete
    </Button>
  );
}
