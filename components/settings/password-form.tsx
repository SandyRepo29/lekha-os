"use client";

import { useActionState, useState } from "react";
import { changePassword, type SettingsState } from "@/lib/settings/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 3) return { score, label: "Fair", color: "bg-amber-500" };
  return { score, label: "Strong", color: "bg-emerald-500" };
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<SettingsState, FormData>(changePassword, undefined);
  const [pw, setPw] = useState("");
  const strength = passwordStrength(pw);

  return (
    <Card>
      <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div>
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
            />
            {pw && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : "bg-white/10"}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-[var(--color-ink-faint)]">{strength.label}</p>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="confirm">Confirm new password</Label>
            <Input id="confirm" name="confirm" type="password" placeholder="Repeat new password" autoComplete="new-password" />
          </div>
          {state?.error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{state.error}</p>
          )}
          {state?.ok && (
            <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Password changed successfully.
            </p>
          )}
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Updating…" : "Update password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
