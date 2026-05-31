export const dynamic = "force-dynamic";

import { Bell } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { getPreferences } from "@/lib/repositories/notification-repo";
import { NotificationForm } from "@/components/settings/notification-form";

export default async function NotificationsPage() {
  const session = await requireUser();
  const prefs = session.demo || !session.org ? null : await getPreferences(session.org.id);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Notifications</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Configure email alerts for {session.orgName}.</p>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <Bell className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Email notifications</span>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Alert preferences</CardTitle>
          </CardHeader>
          <CardContent>
            {session.demo ? (
              <p className="text-sm text-[var(--color-ink-dim)]">Connect Supabase to configure notifications.</p>
            ) : (
              <NotificationForm prefs={prefs} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info card */}
      <Card className="p-5">
        <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-3">How notifications work</h3>
        <ul className="space-y-2 text-sm text-[var(--color-ink-dim)]">
          <li className="flex gap-2"><span className="text-[var(--color-blue)]">·</span>Expiry alerts run daily at 8:00am IST and check all vendor documents.</li>
          <li className="flex gap-2"><span className="text-[var(--color-blue)]">·</span>Each alert is sent only once per day per document to prevent spam.</li>
          <li className="flex gap-2"><span className="text-[var(--color-blue)]">·</span>The weekly digest runs every Monday at 9:00am IST.</li>
          <li className="flex gap-2"><span className="text-[var(--color-blue)]">·</span>All org owners and admins always receive notifications.</li>
          <li className="flex gap-2"><span className="text-[var(--color-blue)]">·</span>Add extra recipients above for finance, legal or compliance teams.</li>
        </ul>
      </Card>
    </div>
  );
}
