export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min — Vercel Pro max

import { NextResponse } from "next/server";
import { runExpiryAlerts } from "@/lib/services/notification-service";

/** Secured with CRON_SECRET. Called daily by Vercel Cron. */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runExpiryAlerts();
    console.log("[cron/expiry]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/expiry] fatal:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
