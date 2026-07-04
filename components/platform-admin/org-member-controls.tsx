"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { changeOrgMemberRoleAction, removeOrgMemberAction } from "@/lib/platform-admin/actions";
import { Trash2 } from "lucide-react";

const ROLES = [
  "owner", "admin", "member", "viewer",
  "compliance_manager", "security_manager", "procurement_manager",
];

export function RoleDropdown({
  userId, orgId, currentRole, isOwnerRole,
}: {
  userId: string; orgId: string; currentRole: string; isOwnerRole: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState("");
  const router = useRouter();

  return (
    <div>
      <select
        defaultValue={currentRole}
        disabled={pending || isOwnerRole}
        onChange={(e) => {
          const role = e.target.value;
          setErr("");
          startTransition(async () => {
            const res = await changeOrgMemberRoleAction(userId, orgId, role);
            if (res.error) setErr(res.error);
            else router.refresh();
          });
        }}
        className="rounded border border-[#30363d] bg-[#161b22] px-2 py-1 text-[12px] text-white disabled:opacity-40 cursor-pointer"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
        ))}
      </select>
      {pending && <span className="ml-1 text-[10px] text-white/30">saving…</span>}
      {err && <div className="mt-0.5 text-[10px] text-red-400">{err}</div>}
    </div>
  );
}

export function RemoveMemberButton({
  userId, orgId, name, isOwnerRole,
}: {
  userId: string; orgId: string; name: string; isOwnerRole: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [err, setErr] = useState("");
  const router = useRouter();

  if (isOwnerRole) return <span className="text-xs text-white/20">—</span>;

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-red-300">Remove {name.split(" ")[0]}?</span>
        <button
          onClick={() =>
            startTransition(async () => {
              const res = await removeOrgMemberAction(userId, orgId);
              if (res.error) { setErr(res.error); setConfirming(false); }
              else router.refresh();
            })
          }
          disabled={pending}
          className="rounded bg-red-500/20 px-2 py-0.5 text-[11px] text-red-300 hover:bg-red-500/30 disabled:opacity-50"
        >
          {pending ? "…" : "Yes"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-[11px] text-white/30 hover:text-white/60"
        >
          No
        </button>
        {err && <span className="text-[10px] text-red-400">{err}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title="Remove from org"
      className="flex h-7 w-7 items-center justify-center rounded-lg text-white/20 hover:bg-red-500/10 hover:text-red-400 transition-colors"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}
