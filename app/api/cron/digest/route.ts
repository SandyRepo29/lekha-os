export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { NextResponse } from "next/server";
import { runWeeklyDigest } from "@/lib/services/notification-service";

/** Secured with CRON_SECRET. Called weekly by Vercel Cron (Monday 9am IST). */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runWeeklyDigest();
    console.log("[cron/digest]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/digest] fatal:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
