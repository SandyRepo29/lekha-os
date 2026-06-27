"use client";

import { useActionState } from "react";
import Link from "next/link";
import { resetPasswordAction, type PasswordResetState } from "@/lib/auth/password-reset-actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<PasswordResetState, FormData>(
    resetPasswordAction,
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
            Password updated
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            Your password has been changed successfully. You can now sign in with your new password.
          </p>
        </div>
        <div className="mt-6">
          <Link href="/login">
            <Button variant="primary" size="lg" className="w-full">
              Sign in
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-7">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
        Set new password
      </h1>
      <p className="mt-1.5 text-sm text-[var(--color-ink-dim)]">
        Choose a strong password for your AUDT account.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            placeholder="Repeat your new password"
            autoComplete="new-password"
          />
        </div>

        {state?.error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {state.error}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
          {pending ? "Updating&#8230;" : "Update password"}
        </Button>
      </form>
    </Card>
  );
}
