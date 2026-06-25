export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getMfaStatusForUser } from "@/lib/repositories/security-command-center-repo";
import * as orgRepo from "@/lib/repositories/org-repo";

/** GET /api/auth/mfa/status — Returns current MFA status for the authenticated user. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await orgRepo.findActiveOrgByUser(user.id);
  if (!org) return NextResponse.json({ enabled: false });

  const mfaStatus = await getMfaStatusForUser(user.id, org.id);
  return NextResponse.json({
    enabled: mfaStatus?.enabled ?? false,
    enrolledAt: mfaStatus?.enabledAt ?? null,
    recoveryCodesCount: mfaStatus?.recoveryCodes?.length ?? 0,
  });
}
