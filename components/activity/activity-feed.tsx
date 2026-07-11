import {
  Building2, Pencil, Plus, Trash2, FileText, RefreshCw,
  Mail, Key, UserX, UserCheck, StickyNote, ArrowRightLeft,
  ClipboardCheck, Shield, Link2, Send,
} from "lucide-react";
import type { ActivityItem } from "@/lib/repositories/activity-repo";
import type { LucideIcon } from "lucide-react";

type ActionDef = { icon: LucideIcon; color: string; label: (m: any) => string };

const ACTION_MAP: Record<string, ActionDef> = {
  "organization.created":        { icon: Building2, color: "text-indigo-400", label: (m) => `Created workspace "${m?.name ?? ""}"` },
  "organization.renamed":        { icon: Pencil,    color: "text-indigo-400", label: (m) => `Renamed organization to "${m?.name ?? ""}"` },
  "vendor.created":              { icon: Plus,      color: "text-emerald-400", label: (m) => `Added vendor "${m?.name ?? ""}"` },
  "vendor.updated":              { icon: Pencil,    color: "text-[var(--color-blue)]", label: (m) => `Updated vendor "${m?.name ?? ""}"` },
  "vendor.status_changed":       { icon: ArrowRightLeft, color: "text-amber-400", label: (m) => `Vendor status: ${m?.from ?? ""} → ${m?.to ?? ""}` },
  "vendor.notes_updated":        { icon: StickyNote, color: "text-[var(--color-ink-faint)]", label: () => "Updated vendor notes" },
  "vendor.deleted":              { icon: Trash2,    color: "text-red-400", label: (m) => `Deleted vendor "${m?.name ?? ""}"` },
  "document.uploaded":           { icon: FileText,  color: "text-[var(--color-blue)]", label: (m) => `Uploaded ${m?.documentType ?? "document"}` },
  "document.deleted":            { icon: Trash2,    color: "text-red-400", label: (m) => `Deleted ${m?.documentType ?? "document"}` },
  "document_request.created":    { icon: Send,      color: "text-amber-400", label: (m) => `Requested ${m?.documentType ?? "document"}` },
  "document_request.status_changed": { icon: RefreshCw, color: "text-[var(--color-blue)]", label: (m) => `Request status: ${m?.to ?? ""}` },
  "assessment.created":          { icon: ClipboardCheck, color: "text-[var(--color-blue)]", label: () => "Started security assessment" },
  "assessment.completed":        { icon: Shield,    color: "text-emerald-400", label: (m) => `Assessment completed: ${m?.score ?? "—"}/100` },
  "review.created":              { icon: ClipboardCheck, color: "text-indigo-400", label: (m) => `Logged ${m?.type ?? ""} review` },
  "review.status_changed":       { icon: RefreshCw, color: "text-[var(--color-blue)]", label: (m) => `Review status: ${m?.status ?? ""}` },
  "portal.link_generated":       { icon: Link2,     color: "text-[var(--color-blue)]", label: () => "Generated vendor portal link" },
  "team.member_invited":         { icon: Mail,      color: "text-emerald-400", label: (m) => `Invited ${m?.email ?? "member"} as ${m?.role ?? "member"}` },
  "team.role_changed":           { icon: Key,       color: "text-amber-400", label: (m) => `Changed role to ${m?.role ?? ""}` },
  "team.member_deactivated":     { icon: UserX,     color: "text-red-400", label: () => "Deactivated team member" },
  "team.member_reactivated":     { icon: UserCheck, color: "text-emerald-400", label: () => "Reactivated team member" },
  "risk.created":                { icon: Plus,      color: "text-emerald-400", label: (m) => `Created risk "${m?.title ?? ""}"` },
  "risk.updated":                { icon: Pencil,    color: "text-[var(--color-blue)]", label: (m) => (m?.status ? `Risk status changed to ${m.status}` : "Updated risk details") },
  "risk.deleted":                { icon: Trash2,    color: "text-red-400", label: (m) => `Deleted risk "${m?.title ?? ""}"` },
  "risk.closed":                 { icon: ArrowRightLeft, color: "text-emerald-400", label: () => "Risk closed" },
  "risk.accepted":               { icon: ArrowRightLeft, color: "text-amber-400", label: () => "Risk accepted" },
  "risk.transferred":            { icon: ArrowRightLeft, color: "text-amber-400", label: () => "Risk transferred" },
  "risk.reviewed":                { icon: ClipboardCheck, color: "text-indigo-400", label: (m) => `Logged risk review: ${m?.outcome ?? ""}` },
  "risk.treatment_created":      { icon: Plus,      color: "text-[var(--color-blue)]", label: (m) => `Added treatment: "${m?.action ?? ""}"` },
  "risk.treatment_completed":    { icon: Shield,    color: "text-emerald-400", label: () => "Completed a treatment action" },
};

const FALLBACK: ActionDef = {
  icon: RefreshCw, color: "text-[var(--color-ink-faint)]", label: () => "Action logged",
};

function fmt(date: Date) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function ActivityFeed({
  items,
  emptyMessage = "No activity yet.",
}: {
  items: ActivityItem[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-[var(--color-ink-dim)]">{emptyMessage}</p>;
  }

  return (
    <ol className="relative space-y-0">
      {items.map((item, i) => {
        const def = ACTION_MAP[item.action] ?? FALLBACK;
        const Icon = def.icon;
        const label = def.label(item.metadata);
        const actor = item.actorName || item.actorEmail || "System";

        return (
          <li key={item.id} className="relative flex gap-3 py-2.5">
            {i < items.length - 1 && (
              <div className="absolute left-[17px] top-[34px] bottom-0 w-px bg-[var(--color-line)]" />
            )}
            <span className={`z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--color-line)] bg-white ${def.color}`}>
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 pt-1.5">
              <p className="text-sm text-[var(--color-ink)] leading-snug">{label}</p>
              <p className="mt-0.5 text-xs text-[var(--color-ink-faint)]">
                {actor} · {fmt(item.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
