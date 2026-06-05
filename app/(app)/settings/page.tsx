export const dynamic = "force-dynamic";

import { User, Bell, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { findProfile } from "@/lib/services/settings-service";
import { getPreferences } from "@/lib/repositories/notification-repo";
import { ProfileForm } from "@/components/settings/settings-forms";
import { NotificationForm } from "@/components/settings/notification-form";
import { SignOutButton } from "@/components/settings/sign-out-button";

export default async function SettingsPage() {
  const session = await requireUser();

  const [profile, prefs] = await Promise.all([
    session.demo ? null : findProfile(session.id),
    session.demo || !session.org ? null : getPreferences(session.org.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Profile</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Manage your personal settings and notification preferences.</p>
      </div>

      {/* Profile section */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <User className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Your profile</span>
        </div>
        {session.demo ? (
          <DemoNote text="Connect Supabase to edit your profile." />
        ) : (
          <ProfileForm profile={profile} email={session.email} />
        )}
      </div>

      {/* Notifications section */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <Bell className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Notifications</span>
        </div>
        <Card>
          <CardHeader><CardTitle>Email alert preferences</CardTitle></CardHeader>
          <CardContent>
            {session.demo ? (
              <p className="text-sm text-[var(--color-ink-dim)]">Connect Supabase to configure notifications.</p>
            ) : (
              <NotificationForm prefs={prefs} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Account section */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <KeyRound className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Account</span>
        </div>
        <Card>
          <CardHeader><CardTitle>Sign out</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-[var(--color-ink-dim)]">
              Sign out of Lekha OS on this device.
            </p>
            <SignOutButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DemoNote({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-300/90">
      {text}
    </div>
  );
}
