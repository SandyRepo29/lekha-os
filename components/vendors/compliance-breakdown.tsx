import { CheckCircle2, XCircle, AlertTriangle, Circle } from "lucide-react";
import type { VendorDocument } from "@/lib/db/schema";
import { DOCS_TO_SCORE_90, DOCUMENT_TYPES } from "@/lib/constants/vendor-options";
import { computeScore, type DocCounts, type Risk } from "@/backend/src/modules/vendor-hub/scoring";

type Props = {
  risk: string;
  currentScore: number;
  docs: VendorDocument[];
};

type CheckItem = {
  label: string;
  status: "done" | "warn" | "fail" | "missing";
  detail: string;
};

function aggregate(docs: VendorDocument[]): DocCounts {
  const c: DocCounts = { total: docs.length, valid: 0, expiring: 0, expired: 0 };
  for (const d of docs) {
    if (d.status === "valid") c.valid++;
    else if (d.status === "expiring") c.expiring++;
    else if (d.status === "expired") c.expired++;
  }
  return c;
}

/** Documents considered "key" for any vendor in the GRC context. */
const KEY_DOCS = [
  "ISO/IEC 27001",
  "SOC 2 Type II",
  "Master Service Agreement (MSA)",
  "Data Processing Agreement (DPA)",
];

export function ComplianceBreakdown({ risk, currentScore, docs }: Props) {
  const c = aggregate(docs);
  const target90 = DOCS_TO_SCORE_90[risk] ?? 7;

  const checks: CheckItem[] = [];

  // 1. Valid document volume
  const validNeed = Math.max(0, 8 - c.valid); // 8 valid docs = full +40 bonus
  if (c.valid >= 8) {
    checks.push({ label: "Document coverage", status: "done", detail: `${c.valid} valid documents — maximum coverage bonus reached.` });
  } else if (c.valid > 0) {
    checks.push({ label: "Document coverage", status: "warn", detail: `${c.valid} valid doc${c.valid > 1 ? "s" : ""}. Add ${validNeed} more to maximise the coverage bonus (+${validNeed * 5} pts).` });
  } else {
    checks.push({ label: "Document coverage", status: "missing", detail: "No valid documents uploaded yet. Each valid document adds up to 5 points." });
  }

  // 2. Expiring documents
  if (c.expiring > 0) {
    checks.push({ label: "Expiring documents", status: "warn", detail: `${c.expiring} document${c.expiring > 1 ? "s" : ""} expire within 30 days (−${c.expiring * 10} pts). Renew to recover score.` });
  } else {
    checks.push({ label: "Expiring documents", status: "done", detail: "No documents expiring soon." });
  }

  // 3. Expired documents
  if (c.expired > 0) {
    checks.push({ label: "Expired documents", status: "fail", detail: `${c.expired} expired document${c.expired > 1 ? "s" : ""} (−${c.expired * 20} pts). Replace or remove immediately.` });
  } else {
    checks.push({ label: "Expired documents", status: "done", detail: "No expired documents." });
  }

  // 4. Key document presence
  const uploadedTypes = new Set(docs.map((d) => d.documentType));
  KEY_DOCS.forEach((key) => {
    const present = [...uploadedTypes].some((t) => t.toLowerCase().includes(key.toLowerCase().split(" ")[0]));
    if (present) {
      checks.push({ label: key, status: "done", detail: "Present and tracked." });
    } else {
      checks.push({ label: key, status: "missing", detail: "Not uploaded — recommended for full governance coverage." });
    }
  });

  // What would the max possible score be?
  const maxScore = computeScore(risk as Risk, { total: 8, valid: 8, expiring: 0, expired: 0 });

  const doneCount = checks.filter((c) => c.status === "done").length;
  const pct = Math.round((doneCount / checks.length) * 100);

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--color-ink)]">
            Score breakdown
          </div>
          <div className="mt-0.5 text-xs text-[var(--color-ink-faint)]">
            Current: <span className="font-bold text-[var(--color-ink)]">{currentScore}</span>
            {" · "}Max achievable: <span className="font-bold text-[var(--color-ink)]">{maxScore}</span>
            {currentScore < maxScore && (
              <span className="ml-1 text-[var(--color-blue)]">(+{maxScore - currentScore} possible)</span>
            )}
          </div>
        </div>
        <div className="text-right text-xs text-[var(--color-ink-faint)]">
          {doneCount}/{checks.length} checks passed
        </div>
      </div>

      {/* Progress to max */}
      <div>
        <div className="mb-1.5 flex justify-between text-xs text-[var(--color-ink-faint)]">
          <span>Progress to max score ({maxScore})</span>
          <span>{currentScore} / {maxScore}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${Math.round((currentScore / maxScore) * 100)}%`,
              background: currentScore >= maxScore
                ? "linear-gradient(90deg, #28c840, #34d058)"
                : currentScore >= 70
                ? "linear-gradient(90deg, #6366f1, #8b5cf6)"
                : currentScore >= 45
                ? "linear-gradient(90deg, #f59e0b, #fbbf24)"
                : "linear-gradient(90deg, #ef4444, #f87171)",
            }}
          />
        </div>
      </div>

      {/* Scoring formula */}
      <div className="rounded-lg border border-[var(--color-line)] bg-white px-4 py-3 text-xs text-[var(--color-ink-faint)]">
        <span className="font-semibold text-[var(--color-ink-dim)]">How it's calculated: </span>
        Risk base ({riskBase(risk)}) + valid docs (×5, max +40) − expiring (×10) − expired (×20)
      </div>

      {/* Check list */}
      <ul className="space-y-2">
        {checks.map((item) => (
          <li key={item.label} className="flex items-start gap-3">
            <span className="mt-0.5 shrink-0">{statusIcon(item.status)}</span>
            <div className="min-w-0">
              <div className={`text-sm font-medium ${item.status === "done" ? "text-[var(--color-ink-dim)]" : "text-[var(--color-ink)]"}`}>
                {item.label}
              </div>
              <div className="text-xs text-[var(--color-ink-faint)]">{item.detail}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function riskBase(risk: string): number {
  return ({ low: 70, medium: 60, high: 45, critical: 30 } as Record<string, number>)[risk] ?? 60;
}

function statusIcon(status: CheckItem["status"]) {
  switch (status) {
    case "done":    return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case "warn":    return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    case "fail":    return <XCircle className="h-4 w-4 text-red-400" />;
    case "missing": return <Circle className="h-4 w-4 text-[var(--color-ink-faint)]" />;
  }
}
