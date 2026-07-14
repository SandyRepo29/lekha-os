export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { disableMfa } from "@/backend/src/modules/enterprise-security/mfa-service";
import * as orgRepo from "@/backend/src/modules/orgs/org-repo";

/** POST /api/auth/mfa/disable — Disable MFA for the current user. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await orgRepo.findActiveOrgByUser(user.id);
  if (!org) return NextResponse.json({ error: "No active organization." }, { status: 400 });

  try {
    await disableMfa(user.id, org.id);
    const res = NextResponse.json({ ok: true });
    res.cookies.delete("audt-mfa");
    return res;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to disable MFA.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
