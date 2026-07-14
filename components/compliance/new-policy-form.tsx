"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createPolicyAction, type ComplianceState } from "@/backend/src/modules/compliance/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";

const POLICY_TYPES = [
  "Information Security Policy",
  "Vendor Management Policy",
  "Access Control Policy",
  "Incident Response Policy",
  "Privacy Policy",
  "Business Continuity Policy",
  "Data Retention Policy",
  "Acceptable Use Policy",
  "Change Management Policy",
  "Risk Management Policy",
];

export function NewPolicyForm() {
  const [state, formAction, pending] = useActionState<ComplianceState, FormData>(
    createPolicyAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="name">Policy name *</Label>
        <Input
          id="name"
          name="name"
          required
          autoFocus
          placeholder="e.g. Information Security Policy"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="policyType">Policy type</Label>
          <Select id="policyType" name="policyType" defaultValue="">
            <SelectOption value="">Custom / Other</SelectOption>
            {POLICY_TYPES.map((t) => (
              <SelectOption key={t} value={t}>{t}</SelectOption>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="owner">Owner</Label>
          <Input id="owner" name="owner" placeholder="Name or team responsible" />
        </div>
      </div>

      <div>
        <Label htmlFor="reviewDate">Next review date</Label>
        <Input id="reviewDate" name="reviewDate" type="date" />
      </div>

      {state?.error && (
        <p className="rounded-lg border border-red-200 bg-red-100 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Creating…" : "Create policy"}
        </Button>
        <Link href="/compliance/policies">
          <Button type="button" variant="subtle">Cancel</Button>
        </Link>
      </div>
    </form>
  );
}
