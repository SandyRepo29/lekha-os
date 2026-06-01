import { GoogleGenAI, Type } from "@google/genai";

export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY || "";
  return key.length > 20 && !key.startsWith("paste-");
}

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export const EXTRACTABLE_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
]);

// ─── Document category taxonomy ──────────────────────────────────────────────

export const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  security:    "Security",
  privacy:     "Privacy",
  legal:       "Legal",
  financial:   "Financial",
  quality:     "Quality",
  operational: "Operational",
  other:       "Other",
};

export const DOCUMENT_CATEGORY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  security:    { text: "text-indigo-400",  bg: "bg-indigo-500/10",  border: "border-indigo-500/25" },
  privacy:     { text: "text-purple-400",  bg: "bg-purple-500/10",  border: "border-purple-500/25" },
  legal:       { text: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/25" },
  financial:   { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25" },
  quality:     { text: "text-blue-400",    bg: "bg-blue-500/10",    border: "border-blue-500/25" },
  operational: { text: "text-orange-400",  bg: "bg-orange-500/10",  border: "border-orange-500/25" },
  other:       { text: "text-[var(--color-ink-faint)]", bg: "bg-white/[0.04]", border: "border-[var(--color-line)]" },
};

// ─── Extracted document types (v2) ───────────────────────────────────────────

export type ExtractedDoc = {
  // Core (v1)
  documentType: string | null;
  issuer: string | null;
  issuedOn: string | null;
  expiresOn: string | null;
  summary: string | null;
  // Classification (v2 new)
  category: "security" | "privacy" | "legal" | "financial" | "quality" | "operational" | "other" | null;
  // Rich metadata (v2 new)
  certificationNumber: string | null;
  standardVersion: string | null;
  certificationScope: string | null;
  certificationBody: string | null;
  applicableRegions: string[] | null;
};

const PROMPT = `You are a compliance document analyst for a vendor governance platform serving Indian businesses.
Analyse the attached vendor document and extract ALL available metadata.

CATEGORY CLASSIFICATION — pick exactly one:
- security: ISO 27001, SOC 2, VAPT, Cyber Essentials, ISMS, penetration test
- privacy: DPDP, ISO 27701, Data Processing Agreement, consent records, privacy notice
- legal: MSA, NDA, SLA, OLA, contract, agreement, terms of service
- financial: GST, PAN, RBI authorisation, FSSAI, insurance certificate, indemnity
- quality: ISO 9001, ISO 22301, BCP, audit report (internal or external)
- operational: MCA incorporation, MSME registration, staffing licence, trade licence
- other: anything that does not fit the above

FIELDS TO EXTRACT (return null if genuinely not present — do NOT guess):
- documentType: exact standard/document name (e.g. "ISO/IEC 27001:2022", "GST Registration Certificate")
- issuer: issuing authority or signatory organisation
- issuedOn: issue/effective date (YYYY-MM-DD)
- expiresOn: expiry/valid-until date (YYYY-MM-DD) — null for documents with no expiry
- summary: one precise sentence describing what this document certifies or covers
- category: one of the seven above
- certificationNumber: unique certificate/registration ID (e.g. "IS 12345678", "07AAABC1234D1Z5")
- standardVersion: specific standard version if applicable (e.g. "ISO 27001:2022", "SOC 2 TSC 2017")
- certificationScope: what is certified/covered — use the scope text from the document
- certificationBody: accreditation body (e.g. "UKAS", "DAkkS") — may differ from issuer
- applicableRegions: array of countries/regions mentioned (e.g. ["India", "Global"])

All dates in YYYY-MM-DD. Never fabricate data.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    documentType:        { type: Type.STRING, nullable: true },
    issuer:              { type: Type.STRING, nullable: true },
    issuedOn:            { type: Type.STRING, nullable: true },
    expiresOn:           { type: Type.STRING, nullable: true },
    summary:             { type: Type.STRING, nullable: true },
    category:            { type: Type.STRING, nullable: true },
    certificationNumber: { type: Type.STRING, nullable: true },
    standardVersion:     { type: Type.STRING, nullable: true },
    certificationScope:  { type: Type.STRING, nullable: true },
    certificationBody:   { type: Type.STRING, nullable: true },
    applicableRegions:   { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
  },
  required: [
    "documentType", "issuer", "issuedOn", "expiresOn", "summary",
    "category", "certificationNumber", "standardVersion",
    "certificationScope", "certificationBody", "applicableRegions",
  ],
};

const VALID_CATEGORIES = ["security", "privacy", "legal", "financial", "quality", "operational", "other"];

export async function extractDocumentFields(params: {
  bytes: Buffer;
  mimeType: string;
}): Promise<ExtractedDoc> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [{
      role: "user",
      parts: [
        { text: PROMPT },
        { inlineData: { mimeType: params.mimeType, data: params.bytes.toString("base64") } },
      ],
    }],
    config: { responseMimeType: "application/json", responseSchema, temperature: 0 },
  });

  const text = res.text ?? "{}";
  const p = JSON.parse(text) as Partial<ExtractedDoc & { applicableRegions: unknown }>;

  const category = VALID_CATEGORIES.includes(String(p.category))
    ? (p.category as ExtractedDoc["category"])
    : "other";

  return {
    documentType:        p.documentType ?? null,
    issuer:              p.issuer ?? null,
    issuedOn:            normalizeDate(p.issuedOn),
    expiresOn:           normalizeDate(p.expiresOn),
    summary:             p.summary ?? null,
    category,
    certificationNumber: p.certificationNumber ?? null,
    standardVersion:     p.standardVersion ?? null,
    certificationScope:  p.certificationScope ?? null,
    certificationBody:   p.certificationBody ?? null,
    applicableRegions:   Array.isArray(p.applicableRegions) ? (p.applicableRegions as string[]) : null,
  };
}

function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = /^\d{4}-\d{2}-\d{2}/.exec(value.trim());
  return m ? m[0] : null;
}
