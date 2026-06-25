interface SkeletonCardProps {
  className?: string;
  lines?: number;
  showHeader?: boolean;
}

export function SkeletonCard({
  className = "",
  lines = 3,
  showHeader = false,
}: SkeletonCardProps) {
  return (
    <div
      className={`rounded-2xl border border-[var(--color-line)] bg-white/[0.03] p-5 ${className}`}
    >
      <div className="space-y-3">
        {showHeader && (
          <div className="h-4 w-2/5 rounded-lg bg-white/[0.08] animate-pulse" />
        )}
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded-lg bg-white/[0.06] animate-pulse"
            style={{ width: `${90 - i * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}
