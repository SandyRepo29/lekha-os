import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import * as svc from "@/lib/services/trust-exchange/trust-exchange-service";

export async function GET(req: NextRequest) {
  let ctx;
  try { ctx = await validateApiKey(req); } catch (e) { return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401); }
  const docs = await svc.listDocuments(ctx.orgId);
  return ok({ documents: docs, total: docs.length });
}

export async function POST(req: NextRequest) {
  let ctx;
  try { ctx = await validateApiKey(req); } catch (e) { return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401); }
  if (ctx.permissions === "read_only") return err("read_write permission required", 403);
  try {
    const body = await req.json();
    const doc = await svc.addDocument(ctx.orgId, ctx.keyId, body);
    return ok({ document: doc }, 201);
  } catch (e: any) {
    return err(e.message, 400);
  }
}
