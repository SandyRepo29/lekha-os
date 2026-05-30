import type { ActivityItem } from "@/lib/repositories/activity-repo";

const ACTION_LABELS: Record<string, { icon: string; label: (m: any) => string }> = {
  "organization.created":   { icon: "🏢", label: (m) => `Created workspace "${m?.name ?? ""}"` },
  "organization.renamed":   { icon: "✏️",  label: (m) => `Renamed organization to "${m?.name ?? ""}"` },
  "vendor.created":         { icon: "➕", label: (m) => `Added vendor "${m?.name ?? ""}"` },
  "vendor.updated":         { icon: "✏️",  label: (m) => `Updated vendor "${m?.name ?? ""}"` },
  "vendor.status_changed":  { icon: "🔄", label: (m) => `Changed vendor status: ${m?.from ?? ""} → ${m?.to ?? ""}` },
  "vendor.notes_updated":   { icon: "📝", label: (_) => "Updated vendor notes" },
  "vendor.deleted":         { icon: "🗑️",  label: (m) => `Deleted vendor "${m?.name ?? ""}"` },
  "document.uploaded":      { icon: "📄", label: (m) => `Uploaded ${m?.documentType ?? "document"}` },
  "document.deleted":       { icon: "🗑️",  label: (m) => `Deleted ${m?.documentType ?? "document"}` },
  "team.member_invited":    { icon: "📧", label: (m) => `Invited ${m?.email ?? "member"} as ${m?.role ?? "member"}` },
  "team.role_changed":      { icon: "🔑", label: (m) => `Changed role to ${m?.role ?? ""}` },
  "team.member_deactivated":{ icon: "🚫", label: (_) => "Deactivated team member" },
  "team.member_reactivated":{ icon: "✅", label: (_) => "Reactivated team member" },
};

function fmt(date: Date) {
  const d = new Date(date);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function ActivityFeed({ items, emptyMessage = "No activity yet." }: { items: ActivityItem[]; emptyMessage?: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-[var(--color-ink-dim)] text-center py-6">{emptyMessage}</p>;
  }

  return (
    <ol className="space-y-0 relative">
      {items.map((item, i) => {
        const def = ACTION_LABELS[item.action] ?? { icon: "◦", label: () => item.action };
        const label = def.label(item.metadata);
        const actor = item.actorName || item.actorEmail || "System";

        return (
          <li key={item.id} className="flex gap-3 py-2.5 relative">
            {/* Vertical line */}
            {i < items.length - 1 && (
              <div className="absolute left-[17px] top-[32px] bottom-0 w-px bg-[var(--color-line)]" />
            )}
            <span className="h-9 w-9 shrink-0 grid place-items-center rounded-full bg-white/[0.04] border border-[var(--color-line)] text-base z-10">
              {def.icon}
            </span>
            <div className="min-w-0 pt-1.5">
              <p className="text-sm text-[var(--color-ink)] leading-snug">{label}</p>
              <p className="text-xs text-[var(--color-ink-faint)] mt-0.5">
                {actor} · {fmt(item.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
