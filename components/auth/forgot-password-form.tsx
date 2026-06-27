"use client";

import { useActionState } from "react";
import Link from "next/link";
import { sendPasswordResetAction, type PasswordResetState } from "@/lib/auth/password-reset-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<PasswordResetState, FormData>(
    sendPasswordResetAction,
    undefined
  );

  if (state?.ok) {
    return (
      <Card className="p-7">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15 text-2xl">
            &#10003;
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
            Check your email
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            If an account exists for that address, we&#8217;ve sent a password reset link.
            Check your inbox and spam folder.
          </p>
        </div>
        <p className="mt-6 text-center text-sm text-[var(--color-ink-dim)]">
          <Link href="/login" className="font-semibold text-[var(--color-blue)] hover:underline">
            Back to sign in
          </Link>
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-7">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
        Reset your password
      </h1>
      <p className="mt-1.5 text-sm text-[var(--color-ink-dim)]">
        Enter your work email and we&#8217;ll send a reset link.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Work email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@company.in"
            autoComplete="email"
          />
        </div>

        {state?.error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {state.error}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
          {pending ? "Sending&#8230;" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-[var(--color-ink-dim)]">
        <Link href="/login" className="font-semibold text-[var(--color-blue)] hover:underline">
          Back to sign in
        </Link>
      </p>
    </Card>
  );
}
