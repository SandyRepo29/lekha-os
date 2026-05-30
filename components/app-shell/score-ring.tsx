export function ScoreRing({ value, size = 132 }: { value: number; size?: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="-rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="9" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="var(--color-blue)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ filter: "drop-shadow(0 0 6px rgba(45,212,255,.6))" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="font-[family-name:var(--font-display)] text-3xl font-bold">{value}</span>
        <span className="text-xs text-[var(--color-ink-dim)]">/ 100</span>
      </div>
    </div>
  );
}
