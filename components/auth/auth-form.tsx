"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, signUp, type AuthState } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function AuthForm({
  mode,
  redirectTo,
}: {
  mode: "signin" | "signup";
  redirectTo?: string;
}) {
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    undefined
  );

  const isSignup = mode === "signup";

  return (
    <Card className="p-7">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
        {isSignup ? "Request a demo" : "Welcome back"}
      </h1>
      <p className="mt-1.5 text-sm text-[var(--color-ink-dim)]">
        {isSignup
          ? "Create your workspace and explore Lekha OS."
          : "Sign in to your Lekha OS workspace."}
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        {redirectTo && <input type="hidden" name="redirect" value={redirectTo} />}

        {isSignup && (
          <div>
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" name="fullName" type="text" placeholder="Asha Sharma" autoComplete="name" />
          </div>
        )}

        <div>
          <Label htmlFor="email">Work email</Label>
          <Input id="email" name="email" type="email" required placeholder="you@company.in" autoComplete="email" />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder={isSignup ? "At least 8 characters" : "••••••••"}
            autoComplete={isSignup ? "new-password" : "current-password"}
          />
        </div>

        {state?.error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {state.error}
          </p>
        )}

        <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
          {pending ? "Please wait…" : isSignup ? "Create workspace" : "Sign in"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-[var(--color-ink-dim)]">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[var(--color-blue)] hover:underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to Lekha OS?{" "}
            <Link href="/signup" className="font-semibold text-[var(--color-blue)] hover:underline">
              Request a demo
            </Link>
          </>
        )}
      </p>
    </Card>
  );
}
