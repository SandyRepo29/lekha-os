const STATUS_STYLES: Record<string, string> = {
  connected: "bg-green-500/10 text-green-400",
  disconnected: "bg-white/5 text-[var(--color-ink-faint)]",
  error: "bg-red-500/10 text-red-400",
  available: "bg-blue-500/10 text-blue-400",
  deprecated: "bg-white/5 text-[var(--color-ink-faint)]",
  coming_soon: "bg-white/5 text-[var(--color-ink-faint)]",
};

const STATUS_LABELS: Record<string, string> = {
  connected: "Connected",
  disconnected: "Disconnected",
  error: "Error",
  available: "Available",
  deprecated: "Deprecated",
  coming_soon: "Coming Soon",
};

export function ConnectorStatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[status] ?? "bg-white/5 text-[var(--color-ink-faint)]"}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
