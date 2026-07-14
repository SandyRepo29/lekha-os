export const dynamic = "force-dynamic";

import { Building2, Palette } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getOrgWithMemberCount, getOrgSettings } from "@/backend/src/modules/settings/settings-service";
import { OrgProfileForm, BrandingForm } from "@/components/settings/org-settings-form";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function OrganizationPage() {
  const session = await requireUser();
  if (!session.org) return <div className="text-[var(--color-ink-dim)]">No organization found.</div>;

  const [org, orgSettings, fullOrg] = await Promise.all([
    getOrgWithMemberCount(session.org.id),
    getOrgSettings(session.org.id),
    db.select().from(organizations).where(eq(organizations.id, session.org.id)).limit(1),
  ]);

  const orgData = fullOrg[0] ?? null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">Organization</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Manage your organization profile and branding.</p>
      </div>

      {/* Organization profile */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <Building2 className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Organization profile</span>
        </div>
        {session.demo ? (
          <DemoNote />
        ) : (
          <OrgProfileForm org={orgData} role={org?.role ?? "member"} />
        )}
      </div>

      {/* Branding */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <Palette className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Branding</span>
        </div>
        {session.demo ? (
          <DemoNote />
        ) : (
          <BrandingForm settings={orgSettings} role={org?.role ?? "member"} />
        )}
      </div>
    </div>
  );
}

function DemoNote() {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-300/90">
      Connect Supabase to manage organization settings.
    </div>
  );
}
