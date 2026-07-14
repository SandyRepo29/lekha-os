import { NextRequest } from "next/server";
import { ok, err } from "@/lib/api/response";
import { getPrograms } from "@/backend/src/modules/trust-verification/trust-verification-service";

// Public endpoint — returns all built-in programs; org-specific if Bearer supplied
export async function GET(req: NextRequest) {
  const programs = await getPrograms(undefined as any);
  return ok({ programs, count: programs.length });
}
