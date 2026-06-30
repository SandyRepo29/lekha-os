"use client";

import { useState, useEffect, useTransition } from "react";
import { Shield, ShieldCheck, ShieldOff, Copy, RefreshCw, Smartphone } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Step = "idle" | "enrolling" | "confirming" | "codes" | "enabled" | "regen";

interface MfaStatus {
  enabled: boolean;
  enrolledAt?: string | null;
  recoveryCodesCount?: number;
}

export function MfaPanel() {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  // Load current MFA status
  useEffect(() => {
    fetch("/api/auth/mfa/status")
      .then(r => r.json())
      .then(d => {
        setStatus(d);
        setStep(d.enabled ? "enabled" : "idle");
      })
      .catch(() => setStatus({ enabled: false }));
  }, []);

  const startEnrollment = () => {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/auth/mfa/enroll", { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setQrDataUrl(data.qrDataUrl);
      setStep("enrolling");
    });
  };

  const confirmEnrollment = () => {
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/auth/mfa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: confirmCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setRecoveryCodes(data.codes ?? []);
      setStep("codes");
    });
  };

  const disableMfa = () => {
    if (!confirm("Disable two-factor authentication? This reduces your account security.")) return;
    startTransition(async () => {
      const res = await fetch("/api/auth/mfa/disable", { method: "POST" });
      if (res.ok) { setStatus({ enabled: false }); setStep("idle"); }
    });
  };

  const regenCodes = () => {
    startTransition(async () => {
      const res = await fetch("/api/auth/mfa/recovery", { method: "POST" });
      const data = await res.json();
      if (res.ok) { setRecoveryCodes(data.codes ?? []); setStep("regen"); }
    });
  };

  const copyCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const finishSetup = () => {
    setStatus({ enabled: true });
    setStep("enabled");
    setRecoveryCodes([]);
    setQrDataUrl(null);
    setConfirmCode("");
  };

  if (status === null) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-[var(--color-ink-dim)]">Loading&#8230;</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status.enabled
            ? <ShieldCheck className="h-4 w-4 text-emerald-400" />
            : <Shield className="h-4 w-4 text-[var(--color-blue)]" />}
          Two-Factor Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* IDLE — not enrolled */}
        {step === "idle" && (
          <>
            <div className="flex items-start gap-3 rounded-xl border border-[var(--color-line)] bg-white p-4">
              <ShieldOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-[var(--color-ink)]">MFA not enabled</p>
                <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
                  Add an authenticator app (Google Authenticator, Authy, 1Password) to protect your account.
                </p>
              </div>
            </div>
            <button
              onClick={startEnrollment}
              disabled={isPending}
              className="rounded-xl bg-[var(--color-blue)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isPending ? "Starting&#8230;" : "Enable Authenticator App"}
            </button>
          </>
        )}

        {/* ENROLLING — show QR code */}
        {step === "enrolling" && qrDataUrl && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-ink-dim)]">
              Scan the QR code with your authenticator app, then enter the 6-digit code to confirm.
            </p>
            <div className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="TOTP QR Code" className="h-48 w-48 rounded-xl border border-[var(--color-line)]" />
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={confirmCode}
                onChange={e => setConfirmCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="6-digit code"
                maxLength={6}
                className="flex-1 rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-4 py-2.5 text-center font-mono text-lg tracking-widest text-[var(--color-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]/40"
              />
              <button
                onClick={confirmEnrollment}
                disabled={isPending || confirmCode.length < 6}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? "Verifying&#8230;" : "Confirm"}
              </button>
            </div>
            <button onClick={() => setStep("idle")} className="text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)]">
              Cancel
            </button>
          </div>
        )}

        {/* CODES — show recovery codes */}
        {(step === "codes" || step === "regen") && recoveryCodes.length > 0 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <p className="text-sm font-semibold text-amber-400">Save your recovery codes now</p>
              <p className="mt-1 text-xs text-amber-400/80">
                Each code can only be used once. Store them somewhere safe &#8212; you cannot view them again.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {recoveryCodes.map((c, i) => (
                <code key={i} className="rounded-lg border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-center text-sm font-mono text-[var(--color-ink)]">
                  {c}
                </code>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyCodes}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] px-3 py-2 text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copied!" : "Copy all"}
              </button>
              {step === "codes" && (
                <button
                  onClick={finishSetup}
                  className="ml-auto rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Done &#8212; I&#8217;ve saved these
                </button>
              )}
              {step === "regen" && (
                <button
                  onClick={() => { setStep("enabled"); setRecoveryCodes([]); }}
                  className="ml-auto rounded-xl bg-[var(--color-blue)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        )}

        {/* ENABLED — MFA is on */}
        {step === "enabled" && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" />
              <div>
                <p className="text-sm font-medium text-[var(--color-ink)]">MFA enabled</p>
                <p className="mt-1 text-xs text-[var(--color-ink-faint)]">
                  Your account is protected with a TOTP authenticator app.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={regenCodes}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] px-3 py-2 text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Regenerate recovery codes
              </button>
              <button
                onClick={disableMfa}
                disabled={isPending}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/20 px-3 py-2 text-xs text-red-400 hover:border-red-500/40 transition-colors"
              >
                <ShieldOff className="h-3.5 w-3.5" />
                Disable MFA
              </button>
            </div>
          </div>
        )}

        {/* Authenticator app hints */}
        {step === "idle" && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: "Google Authenticator", icon: <Smartphone className="h-5 w-5" /> },
              { name: "Microsoft Authenticator", icon: <Smartphone className="h-5 w-5" /> },
              { name: "Authy / 1Password", icon: <Smartphone className="h-5 w-5" /> },
            ].map((app) => (
              <div key={app.name} className="rounded-xl border border-[var(--color-line)] bg-white p-3 text-center">
                <div className="flex justify-center text-[var(--color-ink-faint)]">{app.icon}</div>
                <div className="mt-1 text-xs text-[var(--color-ink-faint)]">{app.name}</div>
              </div>
            ))}
          </div>
        )}

      </CardContent>
    </Card>
  );
}
