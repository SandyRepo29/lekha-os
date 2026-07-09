/**
 * AI provider — lazy singleton for Google Gemini.
 *
 * This is the ONLY place that imports @google/genai and reads GEMINI_API_KEY.
 * All AI services import generateText/generateJSON from here instead of
 * constructing GoogleGenAI inline.
 *
 * To swap AI providers (Bedrock, OpenAI, etc.) change only this file and
 * its implementation modules.
 */

import { GoogleGenAI } from "@google/genai";

export const AI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

// ---- Singleton --------------------------------------------------------------

let _ai: GoogleGenAI | null = null;

export function getAI(): GoogleGenAI {
  if (!_ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key.length < 20) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    _ai = new GoogleGenAI({ apiKey: key });
  }
  return _ai;
}

export function isAIConfigured(): boolean {
  const key = process.env.GEMINI_API_KEY || "";
  return key.length > 20 && !key.startsWith("paste-");
}

// ---- Shared generation helpers ----------------------------------------------

export interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
}

/** Plain-text generation. Falls back to "" on any error. */
export async function generateText(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const res = await getAI().models.generateContent({
    model: AI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      temperature: options.temperature ?? 0.4,
      maxOutputTokens: options.maxTokens ?? 400,
      // Without this, gemini-2.5-flash's default "thinking" mode can consume
      // nearly the entire maxOutputTokens budget on internal reasoning,
      // truncating the visible answer to a few words (finishReason: MAX_TOKENS).
      thinkingConfig: { thinkingBudget: 0 },
    },
  });
  return res.text?.trim() ?? "";
}

/** Structured JSON generation using Gemini response schema. */
export async function generateJSON<T>(
  prompt: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: any,
  options: GenerateOptions = {}
): Promise<T> {
  const res = await getAI().models.generateContent({
    model: AI_MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      temperature: options.temperature ?? 0.2,
      maxOutputTokens: options.maxTokens ?? 1000,
      responseMimeType: "application/json",
      responseSchema: schema,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });
  const raw = res.text?.trim() ?? "{}";
  return JSON.parse(raw) as T;
}
