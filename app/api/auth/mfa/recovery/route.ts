export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { regenerateRecoveryCodes } from "@/lib/services/auth/mfa-service";
import * as orgRepo from "@/lib/repositories/org-repo";

/** POST /api/auth/mfa/recovery — Regenerate recovery codes. Returns plaintext codes once. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await orgRepo.findActiveOrgByUser(user.id);
  if (!org) return NextResponse.json({ error: "No active organization." }, { status: 400 });

  try {
    const codes = await regenerateRecoveryCodes(user.id, org.id);
    return NextResponse.json({ codes });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to generate recovery codes.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
