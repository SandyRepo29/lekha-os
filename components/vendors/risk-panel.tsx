import { ShieldAlert, ShieldCheck, AlertTriangle, TrendingUp } from "lucide-react";
import type { RiskScore } from "@/backend/src/modules/risk-lens/risk-engine";

const LEVEL_STYLES = {
  low:      { bar: "#10b981", badge: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30", label: "Low Risk" },
  medium:   { bar: "#f59e0b", badge: "text-amber-400 bg-amber-500/10 border-amber-500/30", label: "Medium Risk" },
  high:     { bar: "#ef4444", badge: "text-red-400 bg-red-500/10 border-red-500/30", label: "High Risk" },
  critical: { bar: "#dc2626", badge: "text-red-300 bg-red-500/15 border-red-500/40", label: "Critical Risk" },
};

export function RiskPanel({ risk }: { risk: RiskScore }) {
  const st = LEVEL_STYLES[risk.level];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-[var(--color-ink-faint)]" />
          <span className="text-sm font-semibold text-[var(--color-ink)]">Risk assessment</span>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${st.badge}`}>{st.label}</span>
      </div>

      {/* Risk score bar */}
      <div>
        <div className="mb-1.5 flex justify-between text-xs text-[var(--color-ink-faint)]">
          <span>Risk score</span>
          <span className="font-bold" style={{ color: st.bar }}>{risk.score} / 100</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${risk.score}%`, background: st.bar }} />
        </div>
      </div>

      {/* Risk factors */}
      <ul className="space-y-2">
        {risk.factors.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5">
            {f.impact === "positive" ? <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
              : f.impact === "warn" ? <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
              : <TrendingUp className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />}
            <div className="min-w-0">
              <div className="text-sm font-medium text-[var(--color-ink)]">{f.label}</div>
              <div className="text-xs text-[var(--color-ink-faint)]">{f.detail}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
