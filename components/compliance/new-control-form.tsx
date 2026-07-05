"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createControlAction, type ComplianceState } from "@/lib/compliance/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";

export function NewControlForm({ frameworkId }: { frameworkId: string }) {
  const [state, formAction, pending] = useActionState<ComplianceState, FormData>(
    createControlAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="frameworkId" value={frameworkId} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="controlRef">Control reference *</Label>
          <Input id="controlRef" name="controlRef" required autoFocus placeholder="A.5.1" />
          <p className="mt-1 text-xs text-[var(--color-ink-faint)]">e.g. A.5.1, CC1.2, Req 1</p>
        </div>
        <div>
          <Label htmlFor="name">Control name *</Label>
          <Input id="name" name="name" required placeholder="Information Security Policies" />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" placeholder="What this control requires" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="category">Category</Label>
          <Input id="category" name="category" placeholder="e.g. Access Control, Cryptography" />
        </div>
        <div>
          <Label htmlFor="owner">Owner</Label>
          <Input id="owner" name="owner" placeholder="Name or team" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue="not_implemented">
            <SelectOption value="not_implemented">Not Implemented</SelectOption>
            <SelectOption value="partial">Partial</SelectOption>
            <SelectOption value="implemented">Implemented</SelectOption>
            <SelectOption value="not_applicable">N/A</SelectOption>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select id="priority" name="priority" defaultValue="medium">
            <SelectOption value="critical">Critical</SelectOption>
            <SelectOption value="high">High</SelectOption>
            <SelectOption value="medium">Medium</SelectOption>
            <SelectOption value="low">Low</SelectOption>
          </Select>
        </div>
        <div>
          <Label htmlFor="reviewDate">Review date</Label>
          <Input id="reviewDate" name="reviewDate" type="date" />
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg border border-red-200 bg-red-100 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Adding…" : "Add control"}
        </Button>
        <Link href={`/compliance/frameworks/${frameworkId}`}>
          <Button type="button" variant="subtle">Cancel</Button>
        </Link>
      </div>
    </form>
  );
}
