/**
 * Policy status badge — server-renderable.
 */

const POLICY_STATUS: Record<string, { label: string; cls: string }> = {
  draft:    { label: "Draft",    cls: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-white/[0.04]" },
  review:   { label: "Review",   cls: "text-[var(--color-blue)] border-[var(--color-blue)]/30 bg-[var(--color-blue)]/10" },
  approved: { label: "Approved", cls: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  archived: { label: "Archived", cls: "text-[var(--color-ink-faint)] border-[var(--color-line)] bg-white/[0.02]" },
  expired:  { label: "Expired",  cls: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
};

export function PolicyStatusBadge({ status }: { status: string }) {
  const { label, cls } = POLICY_STATUS[status] ?? POLICY_STATUS.draft;
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}
