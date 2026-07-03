"use client";

import { useActionState } from "react";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useState } from "react";

type ActionFn = (formData: FormData) => Promise<{ error?: string }>;

export function LoginForm({ action }: { action: ActionFn }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: { error?: string } | undefined, fd: FormData) => action(fd),
    undefined
  );
  const [showPw, setShowPw] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {state.error}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-white/60">Email</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:border-[#00B8D9]/50 focus:outline-none focus:ring-1 focus:ring-[#00B8D9]/30"
          placeholder="you@audt.tech"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-white/60">Password</label>
        <div className="relative">
          <input
            name="password"
            type={showPw ? "text" : "password"}
            required
            autoComplete="current-password"
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-2.5 pr-10 text-sm text-white placeholder:text-white/25 focus:border-[#00B8D9]/50 focus:outline-none focus:ring-1 focus:ring-[#00B8D9]/30"
            placeholder="••••••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#007A94] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        <LogIn className="h-4 w-4" />
        {pending ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
