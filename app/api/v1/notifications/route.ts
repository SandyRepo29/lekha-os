import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { ok, err } from "@/lib/api/response";
import { findAlerts } from "@/lib/repositories/governance-alerts-repo";

function severityToType(severity: string): "alert" | "warning" | "info" | "success" {
  if (severity === "critical" || severity === "high") return "alert";
  if (severity === "medium") return "warning";
  return "info";
}

function alertToModule(alertType: string): string {
  if (alertType.startsWith("vendor")) return "Vendor Hub&#8482;";
  if (alertType.startsWith("risk") || alertType.startsWith("open_critical")) return "Risk Lens&#8482;";
  if (alertType.startsWith("control")) return "Control Center&#8482;";
  if (alertType.startsWith("evidence") || alertType.startsWith("expir")) return "Evidence Vault&#8482;";
  if (alertType.startsWith("capa") || alertType.startsWith("overdue")) return "Audit Management&#8482;";
  if (alertType.startsWith("issue")) return "Issue Hub&#8482;";
  return "Trust Intelligence&#8482;";
}

function alertToHref(alertType: string, entityType?: string | null): string {
  if (alertType.startsWith("vendor")) return "/vendors";
  if (alertType.startsWith("risk") || alertType.startsWith("open_critical_risk")) return "/risks";
  if (alertType.startsWith("control")) return "/controls";
  if (alertType.startsWith("evidence") || alertType.startsWith("expir")) return "/compliance/evidence";
  if (alertType.startsWith("capa") || alertType.startsWith("overdue_capa")) return "/audits/capas";
  if (alertType.startsWith("issue")) return "/issue-hub";
  return "/trust-intelligence/monitoring";
}

export async function GET(_req: NextRequest) {
  try {
    const user = await requireUser();
    const alerts = await findAlerts(user.org?.id ?? "", { status: "open", limit: 20 });

    const notifications = alerts.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.description ?? "",
      type: severityToType(a.severity),
      module: alertToModule(a.type),
      href: alertToHref(a.type, a.entityType),
      createdAt: a.createdAt,
      read: false,
    }));

    return ok({ notifications });
  } catch {
    return err("Unauthorized", 401);
  }
}
