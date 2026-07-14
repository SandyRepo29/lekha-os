export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getAiSecurityOverview } from "@/backend/src/modules/security-command-center/security-service";
import { SecSubNav, SecStat, StatusBadge } from "@/components/security-command-center/sec-ui";
import SecAiChat from "@/components/security-command-center/sec-ai-chat";
import { generateSecuritySummaryAction } from "@/backend/src/modules/security-command-center/actions";
import { Cpu, AlertTriangle, Bot } from "lucide-react";

export default async function AiSecurityPage() {
  const session = await requireUser();
  const orgId = session.org?.id ?? "";
  const data = await getAiSecurityOverview(orgId).catch(() => null);
  const stats = (data?.stats ?? {}) as Record<string, unknown>;
  const logs = (data?.logs ?? []) as Record<string, unknown>[];

  const PII_TYPES = ["api_key", "password", "pan", "aadhaar", "passport", "credit_card"];

  return (
    <div className="space-y-6 p-6">
      <SecSubNav />
      <div className="pt-2">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-bold">AI Security™</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Prompt audit trail, PII detection, sensitive data masking, and AI usage analytics.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SecStat label="Total Prompts (30d)"    value={Number(stats.total_30d ?? 0)}      accent="neutral" />
        <SecStat label="Sensitive Prompts"       value={Number(stats.sensitive_30d ?? 0)}   accent={(Number(stats.sensitive_30d ?? 0)) > 0 ? "warn" : "good"} />
        <SecStat label="Blocked Prompts"         value={Number(stats.blocked_30d ?? 0)}     accent={(Number(stats.blocked_30d ?? 0)) > 0 ? "danger" : "good"} />
        <SecStat label="Total Tokens (30d)"      value={Number(stats.total_tokens_30d ?? 0).toLocaleString()} accent="neutral" />
        <SecStat label="Unique Users"            value={Number(stats.unique_users ?? 0)}    accent="neutral" />
        <SecStat label="Modules Using AI"        value={Number(stats.modules_used ?? 0)}    accent="neutral" />
      </div>

      {/* PII Detection Banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5">
        <div className="flex items-start gap-4">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-400" />
          <div>
            <div className="font-semibold text-sm text-amber-400">Prompt Security — PII Detection Active</div>
            <p className="mt-1 text-xs text-[var(--color-ink-dim)] leading-relaxed">
              AUDT scans all AI prompts for sensitive data patterns. Detected PII types are flagged, logged, and optionally blocked before being sent to the AI model.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PII_TYPES.map(t => (
                <span key={t} className="rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-amber-400 uppercase">{t.replace("_", " ")}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI Advisor */}
      <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-violet-400" />
          <h2 className="font-semibold">AI Security Advisor™</h2>
        </div>
        <SecAiChat />
      </div>

      {/* Prompt Log */}
      {logs.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><Cpu className="h-4 w-4 text-[var(--color-ink-dim)]" /> Recent AI Prompts</h2>
          <div className="rounded-2xl border border-[var(--color-line)] divide-y divide-[var(--color-line)] overflow-hidden">
            {logs.map(log => (
              <div key={String(log.id)} className="px-4 py-3 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{String(log.full_name ?? "Unknown user")}</span>
                    <span className="text-[10px] text-[var(--color-ink-dim)] capitalize">{String(log.module ?? "—")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={String(log.sensitivity ?? "clean")} />
                    {!!log.blocked && <StatusBadge status="blocked" />}
                    <span className="text-[10px] text-[var(--color-ink-dim)]">{new Date(String(log.created_at)).toLocaleString()}</span>
                  </div>
                </div>
                {!!log.prompt_preview && (
                  <p className="text-xs text-[var(--color-ink-dim)] truncate">{String(log.prompt_preview)}</p>
                )}
                {Array.isArray(log.detected_pii_types) && (log.detected_pii_types as string[]).length > 0 && (
                  <div className="mt-1 flex gap-1">
                    {(log.detected_pii_types as string[]).map(t => (
                      <span key={t} className="rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {logs.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--color-line)] p-12 text-center">
          <Cpu className="mx-auto h-10 w-10 text-[var(--color-ink-muted)]" />
          <p className="mt-3 text-sm text-[var(--color-ink-dim)]">No AI prompt logs yet.</p>
          <p className="mt-1 text-xs text-[var(--color-ink-muted)]">Prompt logs will appear here once your team uses AI features.</p>
        </div>
      )}
    </div>
  );
}

