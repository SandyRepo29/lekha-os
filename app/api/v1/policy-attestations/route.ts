import { NextRequest } from "next/server";
import { validateApiKey, ApiAuthError } from "@/lib/auth/api-key-auth";
import { ok, err } from "@/lib/api/response";
import { findAttestationsByOrg, addAttestation } from "@/backend/src/modules/policy-governance/policy-governance-repo";

export async function GET(req: NextRequest) {
  let ctx;
  try { ctx = await validateApiKey(req); }
  catch (e) { return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401); }

  const sp = req.nextUrl.searchParams;
  const attestations = await findAttestationsByOrg(ctx.orgId, {
    status: sp.get("status") ?? undefined,
    policyId: sp.get("policyId") ?? undefined,
  });

  return ok({ attestations, total: attestations.length });
}

export async function POST(req: NextRequest) {
  let ctx;
  try { ctx = await validateApiKey(req); }
  catch (e) { return err(e instanceof ApiAuthError ? e.message : "Unauthorized", 401); }
  if (ctx.permissions === "read_only") return err("read_write permission required", 403);

  const body = await req.json().catch(() => null);
  if (!body?.policyId || !body?.userId) return err("policyId and userId are required", 400);

  try {
    const attestation = await addAttestation({
      policyId: body.policyId,
      organizationId: ctx.orgId,
      userId: body.userId,
      policyVersion: body.policyVersion,
      dueDate: body.dueDate,
    });
    return ok({ attestation }, 201);
  } catch (e: unknown) {
    return err(e instanceof Error ? e.message : "Failed to create attestation", 400);
  }
}
