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
      className={`rounded-2xl border border-[var(--color-line)] bg-white p-5 ${className}`}
    >
      <div className="space-y-3">
        {showHeader && (
          <div className="h-4 w-2/5 rounded-lg bg-[#EEF2F7] animate-pulse" />
        )}
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded-lg bg-[#F8F9FB] animate-pulse"
            style={{ width: `${90 - i * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}
