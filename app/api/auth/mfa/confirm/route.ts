export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { confirmTotpEnrollment } from "@/lib/services/auth/mfa-service";
import * as orgRepo from "@/lib/repositories/org-repo";

/** POST /api/auth/mfa/confirm — Confirm TOTP enrollment with the first token. Returns recovery codes. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await orgRepo.findActiveOrgByUser(user.id);
  if (!org) return NextResponse.json({ error: "No active organization." }, { status: 400 });

  const body = await req.json().catch(() => ({})) as { token?: string };
  if (!body.token) return NextResponse.json({ error: "Token is required." }, { status: 400 });

  try {
    const codes = await confirmTotpEnrollment(user.id, org.id, body.token);
    return NextResponse.json({ codes });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Enrollment confirmation failed.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
