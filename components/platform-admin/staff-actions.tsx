"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deactivatePlatformUserAction,
  activatePlatformUserAction,
  updatePlatformUserRoleAction,
} from "@/lib/platform-admin/actions";

export function StaffStatusButton({ userId, isActive, isSelf }: { userId: string; isActive: boolean; isSelf: boolean }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const router = useRouter();

  if (isSelf) return <span className="text-xs text-white/20">—</span>;

  function handle() {
    setErr("");
    startTransition(async () => {
      const res = isActive
        ? await deactivatePlatformUserAction(userId)
        : await activatePlatformUserAction(userId);
      if (res.error) setErr(res.error);
      else router.refresh();
    });
  }

  return (
    <div>
      <button
        onClick={handle}
        disabled={pending}
        className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
          isActive
            ? "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
        }`}
      >
        {pending ? "…" : isActive ? "Deactivate" : "Activate"}
      </button>
      {err && <div className="mt-0.5 text-[10px] text-red-400">{err}</div>}
    </div>
  );
}

export function RoleSelect({ userId, currentRole, isSelf }: { userId: string; currentRole: string; isSelf: boolean }) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const router = useRouter();

  if (isSelf) return (
    <span className="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium bg-purple-500/20 text-purple-300">
      {currentRole.replace("platform_", "")}
    </span>
  );

  function handle(role: string) {
    if (role === currentRole) return;
    setErr("");
    startTransition(async () => {
      const res = await updatePlatformUserRoleAction(userId, role);
      if (res.error) setErr(res.error);
      else router.refresh();
    });
  }

  return (
    <div>
      <select
        defaultValue={currentRole}
        onChange={(e) => handle(e.target.value)}
        disabled={pending}
        className="rounded-lg border border-[#30363d] bg-[#161b22] px-2 py-1 text-xs text-white disabled:opacity-50"
      >
        <option value="platform_owner">Platform Owner</option>
        <option value="platform_admin">Platform Admin</option>
        <option value="platform_support">Platform Support</option>
      </select>
      {err && <div className="mt-0.5 text-[10px] text-red-400">{err}</div>}
    </div>
  );
}
