"use client";

import { useTransition, useState } from "react";
import { toggleFeatureFlagAction } from "@/lib/platform-admin/actions";

export function FlagToggle({ flagKey, enabled: initialEnabled }: { flagKey: string; enabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    startTransition(async () => {
      const result = await toggleFeatureFlagAction(flagKey, next);
      if (result.error) setEnabled(!next); // revert on error
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={pending}
      aria-label={enabled ? "Disable flag" : "Enable flag"}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
        enabled ? "bg-[#00B8D9]" : "bg-white/[0.1]"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
