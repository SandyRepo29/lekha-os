import { GoogleGenAI, Type } from "@google/genai";

/** True when a real Gemini API key is configured. */
export function isGeminiConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY || "";
  return key.length > 20 && !key.startsWith("paste-");
}

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/** Document content types Gemini can read inline. */
export const EXTRACTABLE_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
]);

export type ExtractedDoc = {
  documentType: string | null;
  issuer: string | null;
  issuedOn: string | null; // YYYY-MM-DD
  expiresOn: string | null; // YYYY-MM-DD
  summary: string | null;
};

const PROMPT = `You are a compliance document analyst for a vendor governance platform.
Extract metadata from the attached vendor document (e.g. ISO 27001, SOC 2 report,
GST certificate, insurance certificate, MSA, DPA).

Return:
- documentType: the standard or document title (e.g. "ISO/IEC 27001:2022", "SOC 2 Type II")
- issuer: the issuing authority or certification body
- issuedOn: the issue / effective date
- expiresOn: the expiry / valid-until date
- summary: one short sentence describing the document

Use ISO format YYYY-MM-DD for all dates. If a field is not present, return null.
Do not guess or fabricate values.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    documentType: { type: Type.STRING, nullable: true },
    issuer: { type: Type.STRING, nullable: true },
    issuedOn: { type: Type.STRING, nullable: true, description: "ISO date YYYY-MM-DD or null" },
    expiresOn: { type: Type.STRING, nullable: true, description: "ISO date YYYY-MM-DD or null" },
    summary: { type: Type.STRING, nullable: true },
  },
  required: ["documentType", "issuer", "issuedOn", "expiresOn", "summary"],
};

/** Extract structured fields from a document's bytes using Gemini. */
export async function extractDocumentFields(params: {
  bytes: Buffer;
  mimeType: string;
}): Promise<ExtractedDoc> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [
          { text: PROMPT },
          { inlineData: { mimeType: params.mimeType, data: params.bytes.toString("base64") } },
        ],
      },
    ],
    config: { responseMimeType: "application/json", responseSchema, temperature: 0 },
  });

  const text = res.text ?? "{}";
  const parsed = JSON.parse(text) as Partial<ExtractedDoc>;
  return {
    documentType: parsed.documentType ?? null,
    issuer: parsed.issuer ?? null,
    issuedOn: normalizeDate(parsed.issuedOn),
    expiresOn: normalizeDate(parsed.expiresOn),
    summary: parsed.summary ?? null,
  };
}

function normalizeDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const m = /^\d{4}-\d{2}-\d{2}/.exec(value.trim());
  return m ? m[0] : null;
}
