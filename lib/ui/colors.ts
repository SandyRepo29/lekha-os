/**
 * Single source of truth for all score/risk/status color calculations.
 * Import these functions everywhere instead of inline ternaries.
 */

export function scoreTextColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-[var(--color-blue)]";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

export function scoreBarGradient(score: number): string {
  if (score >= 80) return "linear-gradient(90deg, #10b981, #34d058)";
  if (score >= 60) return "linear-gradient(90deg, #6366f1, #8b5cf6)";
  if (score >= 40) return "linear-gradient(90deg, #f59e0b, #fbbf24)";
  return "linear-gradient(90deg, #ef4444, #f87171)";
}

export function scoreLabel(score: number): string {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "Improving";
  if (score >= 40) return "Needs Attention";
  return "Critical";
}

export function scoreLabelColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-[var(--color-blue)]";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

export function riskBadgeStyles(level: string): string {
  switch (level) {
    case "low":      return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    case "medium":   return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    case "high":     return "text-red-400 border-red-500/30 bg-red-500/10";
    case "critical": return "text-red-300 border-red-500/40 bg-red-500/15";
    default:         return "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-white/[0.04]";
  }
}

export function statusBadgeStyles(status: string): string {
  switch (status) {
    case "active":    return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    case "pending":   return "text-[var(--color-blue)] border-[var(--color-blue)]/30 bg-[var(--color-blue)]/10";
    case "inactive":  return "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-white/[0.04]";
    case "approved":  return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    case "rejected":  return "text-red-400 border-red-500/30 bg-red-500/10";
    case "submitted": return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    case "requested": return "text-[var(--color-blue)] border-[var(--color-blue)]/30 bg-[var(--color-blue)]/10";
    case "expired":   return "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-white/[0.04]";
    case "needs_followup": return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    case "valid":     return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    case "expiring":  return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    case "missing":   return "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-white/[0.04]";
    default:          return "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-white/[0.04]";
  }
}
