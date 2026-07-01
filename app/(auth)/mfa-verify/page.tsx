"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function MfaVerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const sessionId = document.cookie.match(/audt-sid=([^;]+)/)?.[1];
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.replace(/\s/g, ""),
          type: useRecovery ? "recovery" : "totp",
          rememberDevice,
          sessionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed. Please try again.");
        setCode("");
        inputRef.current?.focus();
        return;
      }
      router.push(redirect);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-extrabold tracking-tight text-[var(--color-ink)]">
            AUDT
          </span>
          <p className="text-sm text-[var(--color-ink-dim)] mt-1">Governance Built on Proof.™</p>
        </div>

        <div className="rounded-2xl border border-[var(--color-line)] bg-white/[0.03] p-8">
          <h1 className="text-lg font-bold text-[var(--color-ink)] mb-1">
            {useRecovery ? "Recovery Code" : "Two-Factor Authentication"}
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)] mb-6">
            {useRecovery
              ? "Enter one of your 10-character recovery codes."
              : "Enter the 6-digit code from your authenticator app."}
          </p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-ink-dim)] mb-1.5">
                {useRecovery ? "Recovery Code" : "Verification Code"}
              </label>
              <input
                ref={inputRef}
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder={useRecovery ? "XXXXX-XXXXX" : "000000"}
                autoComplete="one-time-code"
                autoFocus
                required
                maxLength={useRecovery ? 11 : 6}
                className="w-full rounded-xl border border-[var(--color-line)] bg-white/[0.04] px-4 py-3 text-center text-2xl font-mono tracking-[0.3em] text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]/40"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={e => setRememberDevice(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-[var(--color-ink-dim)]">Trust this device for 30 days</span>
            </label>

            <button
              type="submit"
              disabled={loading || code.length < (useRecovery ? 11 : 6)}
              className="w-full rounded-xl bg-[var(--color-blue)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => { setUseRecovery(!useRecovery); setCode(""); setError(null); }}
              className="text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
            >
              {useRecovery ? "← Use authenticator app instead" : "Use a recovery code instead"}
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-[var(--color-ink-faint)]">
          Having trouble?{" "}
          <Link href="/login" className="text-[var(--color-blue)] hover:underline">
            Sign out and try again
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function MfaVerifyPage() {
  return (
    <Suspense>
      <MfaVerifyForm />
    </Suspense>
  );
}
