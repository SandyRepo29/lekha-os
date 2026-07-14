"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createEvidenceAction, type ComplianceState } from "@/backend/src/modules/compliance/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";

export function NewEvidenceForm() {
  const [state, formAction, pending] = useActionState<ComplianceState, FormData>(
    createEvidenceAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          name="title"
          required
          autoFocus
          placeholder="e.g. Razorpay SOC 2 Type II Report 2024"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          placeholder="Brief description of what this evidence demonstrates"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="source">Source type</Label>
          <Select id="source" name="source" defaultValue="manual">
            <SelectOption value="manual">Manual upload</SelectOption>
            <SelectOption value="policy">Policy document</SelectOption>
            <SelectOption value="vendor_document">Vendor document</SelectOption>
            <SelectOption value="vendor_assessment">Vendor assessment</SelectOption>
            <SelectOption value="vendor_review">Vendor review</SelectOption>
          </Select>
        </div>
        <div>
          <Label htmlFor="owner">Owner</Label>
          <Input id="owner" name="owner" placeholder="Name or team responsible" />
        </div>
      </div>

      <div>
        <Label htmlFor="expiresOn">Expiry date</Label>
        <Input id="expiresOn" name="expiresOn" type="date" />
        <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
          Leave blank if this evidence doesn&apos;t expire.
        </p>
      </div>

      {state?.error && (
        <p className="rounded-lg border border-red-200 bg-red-100 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Creating…" : "Create evidence"}
        </Button>
        <Link href="/compliance/evidence">
          <Button type="button" variant="subtle">Cancel</Button>
        </Link>
      </div>
    </form>
  );
}
