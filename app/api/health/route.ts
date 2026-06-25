export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

type CheckStatus = "ok" | "degraded" | "down";

type HealthResponse = {
  status: CheckStatus;
  version: string;
  timestamp: string;
  region: string;
  checks: {
    database: { status: CheckStatus; latencyMs?: number; error?: string };
    ai: { status: CheckStatus; configured: boolean };
    email: { status: CheckStatus; configured: boolean };
    storage: { status: CheckStatus; configured: boolean };
    encryption: { status: CheckStatus; configured: boolean };
  };
};

export async function GET() {
  const start = Date.now();

  // Database check
  let dbStatus: CheckStatus = "down";
  let dbLatency: number | undefined;
  let dbError: string | undefined;
  try {
    await db.execute(sql`SELECT 1`);
    dbLatency = Date.now() - start;
    dbStatus = "ok";
  } catch (err) {
    dbError = err instanceof Error ? err.message : "DB unreachable";
  }

  // Configuration checks (no network calls — just env var presence)
  const aiConfigured = !!(
    process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 10
  );
  const emailConfigured = !!(
    process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.startsWith("re_")
  );
  const storageConfigured = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const encryptionConfigured = !!(
    process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length >= 64
  );

  const overallStatus: CheckStatus =
    dbStatus === "down" ? "down" :
    (!emailConfigured || !encryptionConfigured) ? "degraded" : "ok";

  const body: HealthResponse = {
    status: overallStatus,
    version: process.env.npm_package_version ?? "unknown",
    timestamp: new Date().toISOString(),
    region: process.env.VERCEL_REGION ?? process.env.NEXT_PUBLIC_VERCEL_REGION ?? "local",
    checks: {
      database: {
        status: dbStatus,
        ...(dbLatency !== undefined && { latencyMs: dbLatency }),
        ...(dbError && { error: dbError }),
      },
      ai: {
        status: aiConfigured ? "ok" : "degraded",
        configured: aiConfigured,
      },
      email: {
        status: emailConfigured ? "ok" : "degraded",
        configured: emailConfigured,
      },
      storage: {
        status: storageConfigured ? "ok" : "down",
        configured: storageConfigured,
      },
      encryption: {
        status: encryptionConfigured ? "ok" : "degraded",
        configured: encryptionConfigured,
      },
    },
  };

  const httpStatus = overallStatus === "down" ? 503 : 200;
  return NextResponse.json(body, { status: httpStatus });
}
