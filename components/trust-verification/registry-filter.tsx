"use client";

export function RegistryMinScoreFilter({ defaultValue }: { defaultValue: string }) {
  return (
    <form>
      <select
        name="minScore"
        defaultValue={defaultValue}
        onChange={(e) => e.target.form?.submit()}
        className="rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2.5 text-sm focus:outline-none"
      >
        <option value="">All scores</option>
        <option value="80">Score ≥ 80</option>
        <option value="85">Score ≥ 85</option>
        <option value="90">Score ≥ 90</option>
      </select>
    </form>
  );
}
