export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { NextResponse } from "next/server";
import { runBillingCron } from "@/backend/src/modules/billing/billing-service";

/** Daily billing cron — expire trials, send warnings, process cancellations. */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runBillingCron();
    console.log("[cron/billing]", result);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/billing] fatal:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
