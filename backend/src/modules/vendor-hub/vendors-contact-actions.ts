"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import { addContact, updateContact, removeContact } from "@/backend/src/modules/vendor-hub/contact-service";
import type { ContactType } from "@/lib/constants/vendor-contacts";

export type ContactActionState = { error?: string; ok?: boolean };

export async function addContactAction(
  _prev: ContactActionState | undefined,
  formData: FormData
): Promise<ContactActionState> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  const vendorId    = String(formData.get("vendorId") ?? "");
  const contactType = String(formData.get("contactType") ?? "primary") as ContactType;
  const name        = String(formData.get("name") ?? "").trim();
  const email       = String(formData.get("email") ?? "").trim() || undefined;
  const phone       = String(formData.get("phone") ?? "").trim() || undefined;
  const title       = String(formData.get("title") ?? "").trim() || undefined;
  const department  = String(formData.get("department") ?? "").trim() || undefined;
  const isPrimary   = formData.get("isPrimary") === "true";
  const notes       = String(formData.get("notes") ?? "").trim() || undefined;

  if (!vendorId || !name) return { error: "Vendor ID and contact name are required." };

  try {
    await addContact({
      orgId:       session.org.id,
      vendorId,
      actorId:     session.id,
      actorName:   session.email ?? undefined,
      contactType,
      name,
      email,
      phone,
      title,
      department,
      isPrimary,
      notes,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not add contact." };
  }

  revalidatePath(`/vendors/${vendorId}`);
  return { ok: true };
}

export async function removeContactAction(contactId: string, vendorId: string): Promise<{ error?: string }> {
  const session = await requireUser();
  if (session.demo || !session.org) return { error: "Not available in demo mode." };

  try {
    await removeContact({
      orgId:     session.org.id,
      vendorId,
      contactId,
      actorId:   session.id,
      actorName: session.email ?? undefined,
    });
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Could not remove contact." };
  }

  revalidatePath(`/vendors/${vendorId}`);
  return {};
}
