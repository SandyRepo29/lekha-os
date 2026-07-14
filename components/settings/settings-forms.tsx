"use client";

import { useActionState } from "react";
import { updateProfile, type SettingsState } from "@/backend/src/modules/settings/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";
import type { Profile } from "@/lib/db/schema";

const TIMEZONES = [
  "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo",
  "Europe/London", "Europe/Paris", "America/New_York", "America/Los_Angeles",
  "UTC",
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
  { value: "te", label: "Telugu" },
  { value: "mr", label: "Marathi" },
];

/* ---- Profile form ---- */
export function ProfileForm({ profile, email }: { profile: Profile | null; email: string }) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(updateProfile, undefined);

  return (
    <Card>
      <CardHeader><CardTitle>Your profile</CardTitle></CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" defaultValue={profile?.fullName ?? ""} placeholder="Asha Sharma" />
            </div>
            <div>
              <Label htmlFor="jobTitle">Job title</Label>
              <Input id="jobTitle" name="jobTitle" defaultValue={profile?.jobTitle ?? ""} placeholder="Head of Compliance" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="department">Department</Label>
              <Input id="department" name="department" defaultValue={profile?.department ?? ""} placeholder="Legal & Compliance" />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={profile?.phone ?? ""} placeholder="+91 98765 43210" />
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <div className="flex h-11 items-center rounded-xl border border-[var(--color-line)] bg-white px-4 text-sm text-[var(--color-ink-faint)]">
              {email}
            </div>
            <p className="mt-1 text-xs text-[var(--color-ink-faint)]">Email cannot be changed here.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <select
                id="timezone"
                name="timezone"
                defaultValue={profile?.timezone ?? "Asia/Kolkata"}
                className="flex h-11 w-full rounded-xl border border-[var(--color-line)] bg-white px-4 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]/40"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz} className="bg-[#0f0f14] text-[var(--color-ink)]">{tz}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="language">Language</Label>
              <select
                id="language"
                name="language"
                defaultValue={profile?.language ?? "en"}
                className="flex h-11 w-full rounded-xl border border-[var(--color-line)] bg-white px-4 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]/40"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value} className="bg-[#0f0f14] text-[var(--color-ink)]">{l.label}</option>
                ))}
              </select>
            </div>
          </div>
          {state?.error && <ErrorMsg msg={state.error} />}
          {state?.ok && <SuccessMsg msg="Profile updated." />}
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

/* ---- Shared ---- */
function ErrorMsg({ msg }: { msg: string }) {
  return (
    <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{msg}</p>
  );
}
function SuccessMsg({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
      <CheckCircle2 className="h-4 w-4 shrink-0" /> {msg}
    </p>
  );
}
