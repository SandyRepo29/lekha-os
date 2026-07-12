import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { ok, err } from "@/lib/api/response";

export async function POST(req: NextRequest) {
  const session = await requireUser().catch(() => null);
  if (!session) return err("Unauthorized", 401);

  try {
    const body = await req.json();
    const { invoiceId, reason } = body;

    if (!invoiceId) {
      return err("invoiceId is required", 400);
    }
    if (!reason?.trim()) {
      return err("rejection reason is required", 400);
    }

    // Mark invoice as rejected
    const { db } = await import("@/lib/db");
    const { invoices } = await import("@/lib/db/schema");
    const { eq } = await import("drizzle-orm");

    await db
      .update(invoices)
      .set({
        status: "rejected",
        notes: reason.trim(),
      })
      .where(eq(invoices.id, invoiceId));

    return ok({ success: true }, 200);
  } catch (error) {
    console.error("Payment rejection error:", error);
    return err("Failed to reject payment", 500);
  }
}
