"use client";

import { useActionState } from "react";
import { Bell, Send, CheckCircle2 } from "lucide-react";
import { updateNotificationPreferences, sendTestEmail, type NotifState } from "@/backend/src/modules/settings/notification-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/input";
import type { NotificationPreferences } from "@/lib/db/schema";

function Toggle({ name, checked, label, description }: { name: string; checked: boolean; label: string; description: string }) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer group">
      <div>
        <div className="text-sm font-semibold text-[var(--color-ink)]">{label}</div>
        <div className="text-xs text-[var(--color-ink-faint)] mt-0.5">{description}</div>
      </div>
      <div className="relative shrink-0 mt-0.5">
        <input type="checkbox" name={name} value="1" defaultChecked={checked} className="sr-only peer" />
        <div className="w-10 h-6 rounded-full border border-[var(--color-line-strong)] bg-[#F8F9FB] peer-checked:bg-indigo-600 peer-checked:border-indigo-500 transition-all" />
        <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white/50 peer-checked:bg-white peer-checked:translate-x-4 transition-all" />
      </div>
    </label>
  );
}

export function NotificationForm({ prefs }: { prefs: NotificationPreferences | null }) {
  const [state, action, pending] = useActionState<NotifState, FormData>(updateNotificationPreferences, undefined);
  const [testResult, testAction] = useActionState<NotifState, FormData>(sendTestEmail, undefined);

  const defaultDays = ((prefs?.alertDaysBefore as number[] | null) ?? [90, 60, 30, 15, 7]).join(", ");
  const defaultEmails = ((prefs?.recipientEmails as string[] | null) ?? []).join("\n");

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-6">
        {/* Toggles */}
        <div className="space-y-4">
          <Toggle
            name="expiryAlertsEnabled"
            checked={prefs?.expiryAlertsEnabled ?? true}
            label="Document expiry alerts"
            description="Receive email alerts when vendor documents are approaching expiry or have expired."
          />
          <Toggle
            name="weeklyDigestEnabled"
            checked={prefs?.weeklyDigestEnabled ?? true}
            label="Weekly compliance digest"
            description="Every Monday morning — summary of expiring docs, high-risk vendors and compliance posture."
          />
        </div>

        {/* Alert schedule */}
        <div>
          <Label htmlFor="alertDaysBefore">Alert me at (days before expiry)</Label>
          <input
            id="alertDaysBefore"
            name="alertDaysBefore"
            defaultValue={defaultDays}
            placeholder="90, 60, 30, 15, 7"
            className="h-11 w-full rounded-xl border border-[var(--color-line-strong)] bg-white px-4 text-[15px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]/30"
          />
          <p className="mt-1 text-xs text-[var(--color-ink-faint)]">Comma-separated numbers. Default: 90, 60, 30, 15, 7</p>
        </div>

        {/* Extra recipients */}
        <div>
          <Label htmlFor="recipientEmails">Additional recipients (optional)</Label>
          <textarea
            id="recipientEmails"
            name="recipientEmails"
            defaultValue={defaultEmails}
            rows={3}
            placeholder="finance@company.com&#10;ciso@company.com"
            className="w-full rounded-xl border border-[var(--color-line-strong)] bg-white px-4 py-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:border-[var(--color-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]/30 resize-none"
          />
          <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
            One email per line. Org owners and admins are always notified.
          </p>
        </div>

        {state?.error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{state.error}</p>}
        {state?.ok && (
          <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
            <CheckCircle2 className="h-4 w-4" /> Notification preferences saved.
          </p>
        )}

        <Button type="submit" variant="primary" disabled={pending}>
          <Bell className="h-4 w-4" /> {pending ? "Saving…" : "Save preferences"}
        </Button>
      </form>

      {/* Test email */}
      <div className="border-t border-[var(--color-line)] pt-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-[var(--color-ink)]">Send test email</div>
            <div className="text-xs text-[var(--color-ink-faint)] mt-0.5">
              Sends a sample expiry alert to your email address to verify delivery.
            </div>
          </div>
          <form action={testAction}>
            <Button type="submit" variant="outline" size="sm">
              <Send className="h-3.5 w-3.5" /> Send test
            </Button>
          </form>
        </div>
        {testResult?.ok && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Test email sent — check your inbox.
          </p>
        )}
        {testResult?.error && (
          <p className="mt-2 text-xs text-red-400">{testResult.error}</p>
        )}
      </div>
    </div>
  );
}
