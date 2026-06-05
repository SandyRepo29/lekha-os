"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Shield, ShieldCheck } from "lucide-react";

export function MfaPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[var(--color-blue)]" />
          Two-Factor Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-4">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm font-medium text-[var(--color-ink)]">MFA not enabled</p>
            <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
              Add an extra layer of security to your account with a TOTP authenticator app (Google Authenticator, Microsoft Authenticator, etc.).
            </p>
          </div>
        </div>
        <p className="text-xs text-[var(--color-ink-faint)]">
          TOTP-based MFA requires Supabase MFA to be enabled in your project settings. Once enabled, you can enroll devices here.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { name: "Google Authenticator", icon: "🔐" },
            { name: "Microsoft Authenticator", icon: "🛡️" },
            { name: "Authy", icon: "📱" },
          ].map((app) => (
            <div key={app.name} className="rounded-xl border border-[var(--color-line)] bg-white/[0.02] p-3 text-center">
              <div className="text-2xl">{app.icon}</div>
              <div className="mt-1 text-xs text-[var(--color-ink-faint)]">{app.name}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[var(--color-blue)]/20 bg-[var(--color-blue)]/[0.06] px-4 py-3">
          <p className="text-xs text-[var(--color-blue)]">
            MFA enrollment will be available once MFA is enabled in Supabase project settings → Authentication → MFA.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
