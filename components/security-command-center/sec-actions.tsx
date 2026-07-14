"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  revokeSessionAction, revokeAllSessionsAction,
  deleteIpRuleAction, toggleSsoAction, deleteSsoAction,
  revokeShareAction, acknowledgeAlertAction, resolveAlertAction,
  removeEncryptionProviderAction,
} from "@/backend/src/modules/security-command-center/actions";

// ─── Revoke Session Button ────────────────────────────────────────────────────

export function RevokeSessionButton({ sessionId }: { sessionId: string }) {
  const [isPending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={isPending}
      onClick={() => start(async () => { await revokeSessionAction(sessionId); router.refresh(); })}
      className="rounded-lg border border-red-500/30 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
    >
      {isPending ? "Revoking…" : "Revoke"}
    </button>
  );
}

// ─── Revoke All Sessions Button ───────────────────────────────────────────────

export function RevokeAllSessionsButton({ userId }: { userId: string }) {
  const [isPending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={isPending}
      onClick={() => start(async () => { await revokeAllSessionsAction(userId); router.refresh(); })}
      className="rounded-lg border border-red-500/30 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
    >
      {isPending ? "Revoking…" : "Revoke All"}
    </button>
  );
}

// ─── Delete IP Rule Button ────────────────────────────────────────────────────

export function DeleteIpRuleButton({ id }: { id: string }) {
  const [isPending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={isPending}
      onClick={() => start(async () => { await deleteIpRuleAction(id); router.refresh(); })}
      className="rounded-lg px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
    >
      {isPending ? "…" : "Delete"}
    </button>
  );
}

// ─── SSO Toggle Button ────────────────────────────────────────────────────────

export function SsoToggleButton({ id, enabled }: { id: string; enabled: boolean }) {
  const [isPending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={isPending}
      onClick={() => start(async () => { await toggleSsoAction(id, !enabled); router.refresh(); })}
      className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
        enabled ? "border border-amber-500/30 text-amber-400 hover:bg-amber-500/10" : "border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
      }`}
    >
      {isPending ? "…" : enabled ? "Disable" : "Enable"}
    </button>
  );
}

// ─── Delete SSO Button ────────────────────────────────────────────────────────

export function DeleteSsoButton({ id }: { id: string }) {
  const [isPending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={isPending}
      onClick={() => start(async () => { await deleteSsoAction(id); router.refresh(); })}
      className="rounded-lg px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
    >
      {isPending ? "…" : "Delete"}
    </button>
  );
}

// ─── Revoke Share Button ──────────────────────────────────────────────────────

export function RevokeShareButton({ id }: { id: string }) {
  const [isPending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={isPending}
      onClick={() => start(async () => { await revokeShareAction(id); router.refresh(); })}
      className="rounded-lg border border-red-500/30 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
    >
      {isPending ? "…" : "Revoke"}
    </button>
  );
}

// ─── Alert Action Buttons ─────────────────────────────────────────────────────

export function AcknowledgeAlertButton({ id }: { id: string }) {
  const [isPending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={isPending}
      onClick={() => start(async () => { await acknowledgeAlertAction(id); router.refresh(); })}
      className="rounded-lg border border-amber-500/30 px-3 py-1 text-xs text-amber-400 hover:bg-amber-500/10 disabled:opacity-50 transition-colors"
    >
      {isPending ? "…" : "Acknowledge"}
    </button>
  );
}

export function ResolveMonAlertButton({ id }: { id: string }) {
  const [isPending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={isPending}
      onClick={() => start(async () => { await resolveAlertAction(id); router.refresh(); })}
      className="rounded-lg border border-emerald-500/30 px-3 py-1 text-xs text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50 transition-colors"
    >
      {isPending ? "…" : "Resolve"}
    </button>
  );
}

// ─── Remove Encryption Provider Button ───────────────────────────────────────

export function RemoveEncProviderButton({ id }: { id: string }) {
  const [isPending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      disabled={isPending}
      onClick={() => start(async () => { await removeEncryptionProviderAction(id); router.refresh(); })}
      className="rounded-lg px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
    >
      {isPending ? "…" : "Remove"}
    </button>
  );
}
