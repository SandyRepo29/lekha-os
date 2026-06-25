export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startTotpEnrollment } from "@/lib/services/auth/mfa-service";
import * as orgRepo from "@/lib/repositories/org-repo";

/** POST /api/auth/mfa/enroll — Begin TOTP enrollment. Returns QR code data URL. */
export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await orgRepo.findActiveOrgByUser(user.id);
  if (!org) return NextResponse.json({ error: "No active organization." }, { status: 400 });

  try {
    const result = await startTotpEnrollment(user.id, org.id, user.email ?? "", org.name);
    return NextResponse.json({
      qrDataUrl: result.qrDataUrl,
      otpAuthUrl: result.otpAuthUrl,
      // Never return the raw secret to the client — only the QR code
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Enrollment failed.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
