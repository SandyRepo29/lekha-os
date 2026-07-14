export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { validateApiKey } from "@/lib/auth/api-key-auth";
import { checkRateLimit } from "@/lib/providers/rate-limit";
import { ok, err, withRateLimitHeaders, buildMeta } from "@/lib/api/response";
import * as repo from "@/backend/src/modules/governance-agents/agents-repo";

export async function GET(request: NextRequest) {
  const ctx = await validateApiKey(request).catch(() => null);
  if (!ctx) return err("Unauthorized — provide a valid Bearer API key.", 401);

  const rl = checkRateLimit(ctx.keyId, ctx.permissions);
  if (!rl.allowed) {
    return withRateLimitHeaders(
      err(`Rate limit exceeded. Retry after ${new Date(rl.resetAt).toISOString()}.`, 429),
      rl
    );
  }

  const { searchParams } = request.nextUrl;
  const severityFilter = searchParams.get("severity") ?? undefined;
  const statusFilter   = searchParams.get("status") ?? undefined;
  const agentId        = searchParams.get("agentId") ?? undefined;
  const page           = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const pageSize       = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10)));

  let observations = await repo.findObservationsByOrg(ctx.orgId, { agentId });

  if (severityFilter) observations = observations.filter((o) => o.severity === severityFilter);
  if (statusFilter)   observations = observations.filter((o) => o.status   === statusFilter);

  const total = observations.length;
  const paged = observations.slice((page - 1) * pageSize, page * pageSize);

  return withRateLimitHeaders(ok(paged, 200, buildMeta(total, page, pageSize)), rl);
}
