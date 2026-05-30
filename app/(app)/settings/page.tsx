export const dynamic = "force-dynamic";

import { User, Building2, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { findProfile, getOrgWithMemberCount } from "@/lib/services/settings-service";
import { ProfileForm, OrgForm } from "@/components/settings/settings-forms";
import { SignOutButton } from "@/components/settings/sign-out-button";

export default async function SettingsPage() {
  const session = await requireUser();

  const [profile, org] = await Promise.all([
    session.demo ? null : findProfile(session.id),
    session.demo || !session.org ? null : getOrgWithMemberCount(session.org.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Settings</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Manage your profile and organization.</p>
      </div>

      {/* Profile section */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <User className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Profile</span>
        </div>
        {session.demo ? (
          <DemoNote text="Connect Supabase to edit your profile." />
        ) : (
          <ProfileForm fullName={profile?.fullName ?? null} email={session.email} />
        )}
      </div>

      {/* Organization section */}
      {org && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <Building2 className="h-4 w-4 text-[var(--color-ink-faint)]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Organization</span>
          </div>
          <OrgForm
            orgName={org.name}
            orgSlug={org.slug}
            role={org.role}
            memberCount={org.memberCount}
          />
        </div>
      )}

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
