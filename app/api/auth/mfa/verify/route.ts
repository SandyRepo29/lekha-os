export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyTotpCode, useRecoveryCode } from "@/backend/src/modules/enterprise-security/mfa-service";
import { trustDevice, buildDeviceFingerprint } from "@/backend/src/modules/enterprise-security/device-trust-service";
import { updateSessionMfaVerified } from "@/backend/src/modules/security-command-center/security-command-center-repo";
import * as orgRepo from "@/backend/src/modules/orgs/org-repo";

/**
 * POST /api/auth/mfa/verify
 * Body: { code: string; type?: "totp" | "recovery"; rememberDevice?: boolean; sessionId?: string }
 * On success: sets mfa_verified on session + sets audt-mfa cookie.
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await orgRepo.findActiveOrgByUser(user.id);
  if (!org) return NextResponse.json({ error: "No active organization." }, { status: 400 });

  const body = await req.json().catch(() => ({})) as {
    code?: string; type?: string; rememberDevice?: boolean; sessionId?: string;
  };
  const { code = "", type = "totp", rememberDevice = false, sessionId } = body;

  if (!code) return NextResponse.json({ error: "Verification code is required." }, { status: 400 });

  let verified = false;
  if (type === "recovery") {
    verified = await useRecoveryCode(user.id, org.id, code);
  } else {
    verified = await verifyTotpCode(user.id, org.id, code);
  }

  if (!verified) {
    return NextResponse.json({ error: "Invalid code. Please try again." }, { status: 400 });
  }

  // Mark session as MFA-verified
  if (sessionId) {
    await updateSessionMfaVerified(sessionId, true).catch(() => {});
  }

  // Set audt-mfa cookie (8h default; longer if remember device)
  const maxAge = rememberDevice ? 30 * 24 * 3600 : 8 * 3600;
  const res = NextResponse.json({ ok: true });
  res.cookies.set("audt-mfa", "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });

  // Trust the device if requested
  if (rememberDevice) {
    const fingerprint = buildDeviceFingerprint({
      userAgent: req.headers.get("user-agent"),
      acceptLanguage: req.headers.get("accept-language"),
    });
    await trustDevice({
      userId: user.id,
      orgId: org.id,
      fingerprint,
      browser: req.headers.get("user-agent") ?? undefined,
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0].trim(),
    }).catch(() => {});
  }

  return res;
}
