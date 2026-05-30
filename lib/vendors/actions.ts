"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import * as vendorService from "@/lib/services/vendor-service";
import * as documentService from "@/lib/services/document-service";

export type VendorState = { error?: string } | undefined;
export type DeleteState = { error?: string; ok?: boolean };

/**
 * Transport adapter: authenticate + scope to the active org, delegate to the
 * vendor service, then handle navigation. No business logic lives here.
 */
export async function createVendor(
  _prev: VendorState,
  formData: FormData
): Promise<VendorState> {
  const session = await requireUser();
  if (session.demo) return { error: "Connect Supabase to add real vendors." };
  if (!session.org) redirect("/onboarding");

  try {
    const categoryRaw = String(formData.get("category") || "");
    const categoryOther = String(formData.get("categoryOther") || "");
    const category = categoryRaw === "Other" ? categoryOther : categoryRaw;

    await vendorService.createVendor({
      orgId: session.org.id,
      actorId: session.id,
      input: {
        name: String(formData.get("name") || ""),
        category,
        contactEmail: String(formData.get("contactEmail") || ""),
        risk: String(formData.get("risk") || ""),
      },
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("createVendor failed:", err);
    return { error: "Could not add vendor. Please try again." };
  }

  revalidatePath("/vendors");
  revalidatePath("/dashboard");
  redirect("/vendors");
}

export async function updateVendor(
  _prev: VendorState,
  formData: FormData
): Promise<VendorState> {
  const session = await requireUser();
  if (session.demo) return { error: "Not available in demo mode." };
  if (!session.org) redirect("/onboarding");

  const vendorId = String(formData.get("vendorId") || "");
  if (!vendorId) return { error: "Missing vendor ID." };

  const categoryRaw = String(formData.get("category") || "");
  const categoryOther = String(formData.get("categoryOther") || "");
  const category = categoryRaw === "Other" ? categoryOther : categoryRaw;

  try {
    await vendorService.updateVendor({
      orgId: session.org.id,
      actorId: session.id,
      vendorId,
      input: {
        name: String(formData.get("name") || ""),
        category,
        contactEmail: String(formData.get("contactEmail") || ""),
        risk: String(formData.get("risk") || ""),
      },
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("updateVendor failed:", err);
    return { error: "Could not update vendor." };
  }

  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath("/vendors");
  revalidatePath("/dashboard");
  redirect(`/vendors/${vendorId}`);
}

export async function updateVendorStatus(vendorId: string, status: string): Promise<DeleteState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  const s = status as "active" | "pending" | "inactive";
  if (!["active", "pending", "inactive"].includes(s)) return { error: "Invalid status." };
  try {
    await vendorService.updateVendorStatus({ orgId: session.org.id, actorId: session.id, vendorId, status: s });
    revalidatePath(`/vendors/${vendorId}`); revalidatePath("/vendors"); revalidatePath("/dashboard");
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not update status." };
  }
  return { ok: true };
}

export async function updateVendorNotes(vendorId: string, notes: string): Promise<DeleteState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };
  try {
    await vendorService.updateVendorNotes({ orgId: session.org.id, vendorId, notes });
    revalidatePath(`/vendors/${vendorId}`);
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not save notes." };
  }
  return { ok: true };
}

export async function deleteVendor(vendorId: string): Promise<DeleteState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    // Purge stored files first, then delete the vendor (docs cascade in DB).
    await documentService.purgeVendorStorage(session.org.id, vendorId);
    await vendorService.deleteVendor({
      orgId: session.org.id,
      actorId: session.id,
      vendorId,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    console.error("deleteVendor failed:", err);
    return { error: "Could not delete the vendor." };
  }

  revalidatePath("/vendors");
  revalidatePath("/dashboard");
  return { ok: true };
}
