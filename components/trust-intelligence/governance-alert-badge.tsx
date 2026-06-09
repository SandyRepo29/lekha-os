import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Info, ShieldAlert, Zap } from "lucide-react";

type Severity = "info" | "low" | "medium" | "high" | "critical";

const SEVERITY_CONFIG: Record<Severity, { label: string; icon: React.ElementType; className: string }> = {
  info:     { label: "Info",     icon: Info,          className: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
  low:      { label: "Low",      icon: AlertCircle,   className: "bg-slate-500/10 text-slate-300 border-slate-500/20" },
  medium:   { label: "Medium",   icon: AlertTriangle, className: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  high:     { label: "High",     icon: ShieldAlert,   className: "bg-orange-500/10 text-orange-300 border-orange-500/20" },
  critical: { label: "Critical", icon: Zap,           className: "bg-red-500/10 text-red-300 border-red-500/20" },
};

export function GovernanceAlertBadge({ severity }: { severity: Severity }) {
  const { label, icon: Icon, className } = SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.medium;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

export function AlertTypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = {
    evidence_expired:       "Evidence Expired",
    evidence_expiring_soon: "Evidence Expiring",
    control_critical_health:"Control Critical",
    critical_risk_open:     "Critical Risk",
    critical_finding_open:  "Critical Finding",
    capas_overdue:          "CAPAs Overdue",
    vendor_trust_critical:  "Vendor Trust Low",
  };
  return <span className="text-xs text-[var(--color-ink-dim)]">{labels[type] ?? type}</span>;
}
