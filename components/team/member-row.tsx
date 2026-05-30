"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateRole, deactivateMember, reactivateMember } from "@/lib/team/actions";
import { Select, SelectOption } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { TeamMember } from "@/lib/services/team-service";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner", admin: "Admin", member: "Member", viewer: "Viewer",
};

export function MemberRow({ member, currentUserId, currentRole }: {
  member: TeamMember;
  currentUserId: string;
  currentRole: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isSelf = member.userId === currentUserId;
  const canManage = (currentRole === "owner" || currentRole === "admin") && !isSelf;
  const initials = (member.fullName || member.email)[0].toUpperCase();

  function onRoleChange(role: string) {
    start(async () => {
      const res = await updateRole(member.membershipId, role);
      if (res?.error) setError(res.error); else router.refresh();
    });
  }

  function onToggleActive() {
    start(async () => {
      const res = member.isActive
        ? await deactivateMember(member.membershipId, member.userId)
        : await reactivateMember(member.membershipId);
      if (res?.error) setError(res.error); else router.refresh();
    });
  }

  return (
    <div className={`flex items-center gap-4 px-5 py-4 transition-colors ${!member.isActive ? "opacity-50" : ""}`}>
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-sm font-bold text-[var(--color-ink-dim)]">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[var(--color-ink)]">
          {member.fullName || member.email}
          {isSelf && <span className="ml-2 text-xs text-[var(--color-ink-faint)]">(you)</span>}
          {!member.isActive && <span className="ml-2 text-xs text-[var(--color-ink-faint)]">· deactivated</span>}
        </div>
        <div className="text-xs text-[var(--color-ink-faint)]">{member.email}</div>
      </div>

      {canManage ? (
        <Select
          value={member.role}
          onChange={(e) => onRoleChange(e.target.value)}
          disabled={pending}
          className="w-28 text-sm"
        >
          <SelectOption value="owner">Owner</SelectOption>
          <SelectOption value="admin">Admin</SelectOption>
          <SelectOption value="member">Member</SelectOption>
          <SelectOption value="viewer">Viewer</SelectOption>
        </Select>
      ) : (
        <span className="rounded-full border border-[var(--color-line)] bg-white/[0.04] px-3 py-1 text-xs font-semibold text-[var(--color-ink-dim)]">
          {ROLE_LABELS[member.role] ?? member.role}
        </span>
      )}

      {canManage && (
        <Button
          variant={member.isActive ? "subtle" : "outline"}
          size="sm"
          onClick={onToggleActive}
          disabled={pending}
        >
          {member.isActive ? "Deactivate" : "Reactivate"}
        </Button>
      )}

      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
