"use client";

import { useActionState } from "react";
import { inviteMember, type TeamState } from "@/backend/src/modules/team/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Select, SelectOption } from "@/components/ui/select";
import { CheckCircle2, Send } from "lucide-react";

export function InviteForm() {
  const [state, action, pending] = useActionState<TeamState, FormData>(inviteMember, undefined);

  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <Label htmlFor="inviteEmail">Email address</Label>
          <Input id="inviteEmail" name="email" type="email" required placeholder="colleague@company.com" />
        </div>
        <div>
          <Label htmlFor="inviteRole">Role</Label>
          <Select id="inviteRole" name="role" defaultValue="member">
            <SelectOption value="admin">Admin</SelectOption>
            <SelectOption value="member">Member</SelectOption>
            <SelectOption value="viewer">Viewer</SelectOption>
          </Select>
        </div>
      </div>

      {state?.error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{state.error}</p>
      )}
      {state?.ok && (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" /> Invite sent — they'll receive an email to join.
        </p>
      )}

      <Button type="submit" variant="primary" disabled={pending}>
        <Send className="h-4 w-4" /> {pending ? "Sending…" : "Send invite"}
      </Button>
    </form>
  );
}
