import { GoogleGenAI, Type } from "@google/genai";
import { isGeminiConfigured } from "@/lib/ai/gemini";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

export type NLSearchFilters = {
  /** Free-text search within vendor name or category */
  query?: string;
  /** Risk levels to include */
  risk?: ("low" | "medium" | "high" | "critical")[];
  /** Vendor statuses to include */
  status?: ("active" | "pending" | "inactive")[];
  /** Minimum compliance score */
  minScore?: number;
  /** Maximum compliance score */
  maxScore?: number;
  /** Only show vendors with expiring documents */
  hasExpiring?: boolean;
  /** Only show vendors with expired documents */
  hasExpired?: boolean;
  /** Only show vendors missing this specific document type */
  missingDocType?: string;
  /** Filter by owner name or department */
  ownerSearch?: string;
  /** Filter by vendor category keyword */
  category?: string;
  /** Human-readable summary of what was understood */
  summary: string;
};

const PROMPT = `You are a search query parser for a vendor compliance management system used by Indian businesses.
Parse the user's natural language search query into structured filter parameters.

Available filter fields:
- query: text to search within vendor name or category (for direct name searches only)
- risk: array of ["low","medium","high","critical"] risk levels to include
- status: array of ["active","pending","inactive"] statuses to include
- minScore: minimum compliance score (0-100)
- maxScore: maximum compliance score (0-100)
- hasExpiring: true = only vendors with documents expiring within 30 days
- hasExpired: true = only vendors with expired documents
- missingDocType: name of a document type the vendor should have but doesn't (e.g. "ISO/IEC 27001", "Data Processing Agreement (DPA)", "Cyber Liability Insurance")
- ownerSearch: filter by internal owner name or department keyword
- category: vendor category keyword (e.g. "SaaS", "Payments", "IT Services", "Staffing")
- summary: a short human-readable phrase summarising what filters were applied (max 8 words)

Rules:
- Only include fields that are clearly implied by the query
- Risk "high" usually means include both high AND critical
- "missing DPA" → missingDocType: "Data Processing Agreement (DPA)"
- "missing ISO" → missingDocType: "ISO/IEC 27001"
- "score below 60" → maxScore: 60
- "payments vendors" → category: "Payments"
- "who owns" or "owner" → set showOwnerColumn in summary hint
- Do NOT add filters the query doesn't mention
- summary must be 3-8 words describing the filter

Return valid JSON only. No other text.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    query:         { type: Type.STRING,  nullable: true },
    risk:          { type: Type.ARRAY,   items: { type: Type.STRING }, nullable: true },
    status:        { type: Type.ARRAY,   items: { type: Type.STRING }, nullable: true },
    minScore:      { type: Type.NUMBER,  nullable: true },
    maxScore:      { type: Type.NUMBER,  nullable: true },
    hasExpiring:   { type: Type.BOOLEAN, nullable: true },
    hasExpired:    { type: Type.BOOLEAN, nullable: true },
    missingDocType:{ type: Type.STRING,  nullable: true },
    ownerSearch:   { type: Type.STRING,  nullable: true },
    category:      { type: Type.STRING,  nullable: true },
    summary:       { type: Type.STRING },
  },
  required: ["summary"],
};

export async function parseNaturalLanguageSearch(query: string): Promise<NLSearchFilters> {
  if (!isGeminiConfigured()) {
    return { query, summary: `Search: "${query}"` };
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: `${PROMPT}\n\nUser query: "${query}"` }] }],
    config: { responseMimeType: "application/json", responseSchema, temperature: 0 },
  });

  const parsed = JSON.parse(res.text ?? "{}") as NLSearchFilters;
  return parsed;
}

/** Heuristic: detect whether a query looks like natural language vs a simple name search */
export function isNaturalLanguageQuery(query: string): boolean {
  if (query.length < 15) return false;
  const nlTriggers = [
    "with", "without", "missing", "expired", "expiring", "risk", "score",
    "below", "above", "less than", "more than", "show", "find", "vendors",
    "who", "high", "low", "critical", "medium", "pending", "inactive",
    "insurance", "certificate", "dpa", "iso", "soc", "owner", "department",
    "payment", "saas", "cloud", "staffing", "it services",
  ];
  const lower = query.toLowerCase();
  return nlTriggers.some((t) => lower.includes(t));
}
