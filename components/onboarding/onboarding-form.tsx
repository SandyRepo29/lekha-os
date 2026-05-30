"use client";

import { useActionState } from "react";
import { createOrganization, type OrgState } from "@/lib/orgs/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState<OrgState, FormData>(
    createOrganization,
    undefined
  );

  return (
    <Card className="p-7">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
        Create your workspace
      </h1>
      <p className="mt-1.5 text-sm text-[var(--color-ink-dim)]">
        This is your organization in Lekha OS. You can invite your team later.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="name">Organization name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            autoFocus
            placeholder="Acme Technologies Pvt Ltd"
            autoComplete="organization"
          />
        </div>

        {state?.error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {state.error}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
          {pending ? "Creating…" : "Create workspace"}
        </Button>
      </form>

      <p className="mt-5 text-center text-xs text-[var(--color-ink-faint)]">
        You&apos;ll be the owner of this workspace.
      </p>
    </Card>
  );
}
