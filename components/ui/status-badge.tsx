import { statusBadgeStyles, riskBadgeStyles } from "@/lib/ui/colors";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  type?: "status" | "risk" | "doc";
  className?: string;
}

const LABELS: Record<string, string> = {
  active: "Active", pending: "Pending", inactive: "Inactive",
  approved: "Approved", rejected: "Rejected", submitted: "Submitted",
  requested: "Requested", expired: "Expired", needs_followup: "Needs Follow-up",
  valid: "Valid", expiring: "Expiring", missing: "Missing",
  low: "Low", medium: "Medium", high: "High", critical: "Critical",
};

export function StatusBadge({ value, type = "status", className }: Props) {
  const styles = type === "risk" ? riskBadgeStyles(value) : statusBadgeStyles(value);
  const label = LABELS[value] ?? value.replace(/_/g, " ");
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", styles, className)}>
      {label}
    </span>
  );
}
