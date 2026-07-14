import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { getAssets, createAsset } from "@/backend/src/modules/asset-intelligence/asset-service";

export async function GET(req: NextRequest) {
  let ctx;
  try { ctx = await validateApiKey(req); }
  catch (e) { return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401); }

  const { searchParams } = new URL(req.url);
  const assets = await getAssets(ctx.orgId, {
    type:        searchParams.get("type") ?? undefined,
    criticality: searchParams.get("criticality") ?? undefined,
    status:      searchParams.get("status") ?? undefined,
    environment: searchParams.get("environment") ?? undefined,
  });

  return ok({ assets, total: assets.length });
}

export async function POST(req: NextRequest) {
  let ctx;
  try { ctx = await validateApiKey(req); }
  catch (e) { return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401); }

  if (!ctx.permissions.includes("read_write")) return err("read_write permission required", 403);

  const body = await req.json().catch(() => null);
  if (!body?.name) return err("name is required", 400);

  // API keys have no associated user; created_by must be null (FK → profiles), not the key id.
  const asset = await createAsset(ctx.orgId, null, body);
  return ok({ asset }, 201);
}
