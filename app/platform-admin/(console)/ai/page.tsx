export const dynamic = "force-dynamic";

import { requirePlatformUser } from "@/lib/platform-admin/auth";
import { getAiCenterAction } from "@/lib/platform-admin/actions";
import { Brain, ShieldAlert, Clock, Activity } from "lucide-react";

const SENSITIVITY_STYLE: Record<string, string> = {
  clean:  "bg-emerald-500/20 text-emerald-300",
  low:    "bg-blue-500/20 text-blue-300",
  medium: "bg-amber-500/20 text-amber-300",
  high:   "bg-red-500/20 text-red-300",
};

export default async function AiPage() {
  await requirePlatformUser();
  const { data } = await getAiCenterAction();

  const promptStats = (data?.promptStats ?? {}) as Record<string, unknown>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">AI Center</h1>
        <p className="mt-0.5 text-sm text-white/40">Gemini usage stats, cached insights, and AI prompt security audit.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Cached AI Insights",   value: String(data?.totalCachedInsights ?? 0), icon: Brain,       color: "text-violet-400" },
          { label: "Total Prompts",         value: String(promptStats.total ?? 0),          icon: Activity,   color: "text-[#00B8D9]" },
          { label: "Blocked Prompts",       value: String(promptStats.blocked ?? 0),        icon: ShieldAlert,color: "text-red-400" },
          { label: "Prompts (Last 24h)",    value: String(promptStats.last_24h ?? 0),       icon: Clock,      color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[#30363d] bg-white/[0.02] p-5">
            <s.icon className={`h-4 w-4 ${s.color} mb-3`} />
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="mt-0.5 text-xs text-white/40">{s.label}</div>
          </div>
        ))}
      </div>

      {(data?.recentInsights?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-[#30363d] bg-white/[0.02] overflow-hidden">
          <div className="border-b border-[#30363d] px-5 py-3">
            <h2 className="text-sm font-semibold text-white">Recent Cached Insights</h2>
          </div>
          <div className="divide-y divide-[#30363d]">
            {data!.recentInsights.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm text-white">{r.insight_type as string}</div>
                  <div className="font-mono text-[10px] text-white/25">{r.target_id as string}</div>
                </div>
                <span className="text-xs text-white/30">
                  {new Date(r.generated_at as string).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(data?.recentPrompts?.length ?? 0) > 0 && (
        <div className="rounded-xl border border-[#30363d] bg-white/[0.02] overflow-hidden">
          <div className="border-b border-[#30363d] px-5 py-3">
            <h2 className="text-sm font-semibold text-white">Recent AI Prompts</h2>
          </div>
          <div className="divide-y divide-[#30363d]">
            {data!.recentPrompts.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  {!!(r.is_blocked) && <ShieldAlert className="h-4 w-4 text-red-400 shrink-0" />}
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${SENSITIVITY_STYLE[r.sensitivity as string] ?? "bg-white/5 text-white/40"}`}>
                    {(r.sensitivity as string) || "unknown"}
                  </span>
                  {!!(r.is_blocked) && <span className="text-xs text-red-400">Blocked</span>}
                </div>
                <span className="text-xs text-white/25">
                  {new Date(r.created_at as string).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(data?.recentPrompts?.length ?? 0) === 0 && (data?.totalCachedInsights ?? 0) === 0 && (
        <div className="rounded-xl border border-[#30363d] bg-white/[0.02] px-5 py-12 text-center">
          <Brain className="h-8 w-8 text-white/20 mx-auto mb-3" />
          <div className="text-sm text-white/30">No AI activity recorded yet.</div>
        </div>
      )}
    </div>
  );
}
