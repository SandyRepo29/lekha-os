import { NextRequest } from "next/server";
import { ok, err } from "@/lib/api/response";
import { getPublicRegistry } from "@/lib/services/trust-verification/trust-verification-service";

// Public endpoint — no auth required
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const minScore = searchParams.get("minScore") ? Number(searchParams.get("minScore")) : undefined;
  const industry = searchParams.get("industry") ?? undefined;
  const country  = searchParams.get("country") ?? undefined;
  const data = await getPublicRegistry({ minScore, industry, country });
  return ok({ registry: data, count: data.length });
}
