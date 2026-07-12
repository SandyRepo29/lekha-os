import { cn } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Info, ShieldAlert, Zap } from "lucide-react";

type Severity = "info" | "low" | "medium" | "high" | "critical";

const SEVERITY_CONFIG: Record<Severity, { label: string; icon: React.ElementType; className: string }> = {
  info:     { label: "Info",     icon: Info,          className: "bg-blue-100 text-blue-700 border-blue-200" },
  low:      { label: "Low",      icon: AlertCircle,   className: "bg-slate-100 text-slate-700 border-slate-200" },
  medium:   { label: "Medium",   icon: AlertTriangle, className: "bg-amber-100 text-amber-700 border-amber-200" },
  high:     { label: "High",     icon: ShieldAlert,   className: "bg-orange-100 text-orange-700 border-orange-200" },
  critical: { label: "Critical", icon: Zap,           className: "bg-red-100 text-red-700 border-red-200" },
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
