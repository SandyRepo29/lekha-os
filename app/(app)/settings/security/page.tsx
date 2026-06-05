export const dynamic = "force-dynamic";

import { Shield, KeyRound, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { listByUser } from "@/lib/repositories/login-history-repo";
import { PasswordForm } from "@/components/settings/password-form";
import { MfaPanel } from "@/components/settings/mfa-panel";

export default async function SecurityPage() {
  const session = await requireUser();

  const loginHistory = session.demo || !session.org
    ? []
    : await listByUser(session.id, 20);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">Security</h1>
        <p className="text-sm text-[var(--color-ink-dim)]">Manage your account security and authentication settings.</p>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <KeyRound className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Password</span>
        </div>
        {session.demo ? (
          <DemoNote />
        ) : (
          <PasswordForm />
        )}
      </div>

      {/* MFA */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <Shield className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Multi-Factor Authentication</span>
        </div>
        {session.demo ? (
          <DemoNote />
        ) : (
          <MfaPanel />
        )}
      </div>

      {/* Login history */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-1">
          <Clock className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-[var(--color-ink-faint)]">Login history</span>
        </div>
        <Card>
          <CardHeader><CardTitle>Recent sign-ins</CardTitle></CardHeader>
          <CardContent>
            {loginHistory.length === 0 ? (
              <p className="text-sm text-[var(--color-ink-dim)]">No login history recorded yet. History is tracked from now on.</p>
            ) : (
              <div className="divide-y divide-[var(--color-line)]">
                {loginHistory.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 py-3">
                    <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${entry.status === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[var(--color-ink)]">
                        {entry.status === "success" ? "Successful sign-in" : "Failed sign-in"}
                      </div>
                      <div className="mt-0.5 text-xs text-[var(--color-ink-faint)]">
                        {new Date(entry.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                        {entry.ipAddress && <span className="ml-3">IP: {entry.ipAddress}</span>}
                        {entry.location && <span className="ml-3">{entry.location}</span>}
                      </div>
                      {entry.userAgent && (
                        <div className="mt-0.5 truncate text-xs text-[var(--color-ink-faint)]">{entry.userAgent}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DemoNote() {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-300/90">
      Connect Supabase to manage security settings.
    </div>
  );
}
