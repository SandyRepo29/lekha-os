import { Resend } from "resend";

export function isResendConfigured(): boolean {
  const key = process.env.RESEND_API_KEY ?? "";
  return key.startsWith("re_") && key.length > 10;
}

export function getResend(): Resend {
  if (!isResendConfigured()) throw new Error("RESEND_API_KEY not configured.");
  return new Resend(process.env.RESEND_API_KEY);
}

export const FROM = process.env.RESEND_FROM ?? "Lekha OS <notifications@resend.dev>";
