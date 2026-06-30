"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Hash, Globe, Building2, Tag } from "lucide-react";

type RichMeta = {
  issuer?: string | null;
  summary?: string | null;
  certificationNumber?: string | null;
  standardVersion?: string | null;
  certificationScope?: string | null;
  certificationBody?: string | null;
  applicableRegions?: string[] | null;
  source?: string;
};

interface Props {
  extracted: Record<string, unknown> | null;
  issuedOn: string | null;
  expiresOn: string | null;
}

export function DocumentMetadata({ extracted, issuedOn, expiresOn }: Props) {
  const [open, setOpen] = useState(false);
  const meta = (extracted ?? {}) as RichMeta;
  const isV2 = meta.source === "gemini-v2";

  // Basic metadata row (always visible)
  const basicParts: string[] = [];
  if (meta.issuer) basicParts.push(meta.issuer);
  if (issuedOn) basicParts.push(`Issued ${issuedOn}`);
  if (expiresOn) basicParts.push(`Expires ${expiresOn}`);

  // Determine if there's rich data worth expanding
  const hasRich = isV2 && (
    meta.certificationNumber || meta.standardVersion ||
    meta.certificationScope || meta.certificationBody ||
    (meta.applicableRegions && meta.applicableRegions.length > 0)
  );

  return (
    <div className="space-y-1">
      {/* Basic metadata line + expand toggle */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-[var(--color-ink-faint)]">
          {basicParts.join(" · ") || "No metadata"}
        </span>
        {hasRich && (
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-0.5 text-[10px] font-medium text-[var(--color-blue)] hover:underline"
          >
            {open ? <><ChevronUp className="h-3 w-3" /> Less</> : <><ChevronDown className="h-3 w-3" /> More</>}
          </button>
        )}
      </div>

      {/* AI summary */}
      {meta.summary && (
        <p className="text-xs italic text-[var(--color-ink-faint)]">{meta.summary}</p>
      )}

      {/* Rich metadata — expanded */}
      {open && hasRich && (
        <div className="mt-2 space-y-1.5 rounded-lg border border-[var(--color-line)] bg-white p-2.5">
          {meta.standardVersion && (
            <MetaRow icon={Tag} label="Version" value={meta.standardVersion} />
          )}
          {meta.certificationNumber && (
            <MetaRow icon={Hash} label="Cert no." value={meta.certificationNumber} />
          )}
          {meta.certificationBody && meta.certificationBody !== meta.issuer && (
            <MetaRow icon={Building2} label="Accreditation" value={meta.certificationBody} />
          )}
          {meta.applicableRegions && meta.applicableRegions.length > 0 && (
            <MetaRow icon={Globe} label="Regions" value={meta.applicableRegions.join(", ")} />
          )}
          {meta.certificationScope && (
            <div className="flex items-start gap-1.5">
              <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)] w-14 shrink-0">Scope</span>
              <p className="text-[10px] text-[var(--color-ink-dim)] leading-relaxed">{meta.certificationScope}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetaRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3 w-3 shrink-0 text-[var(--color-ink-faint)]" />
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)] w-14 shrink-0">{label}</span>
      <span className="text-[10px] text-[var(--color-ink-dim)] truncate">{value}</span>
    </div>
  );
}
