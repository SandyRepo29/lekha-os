"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import * as templateService from "@/backend/src/modules/vendor-hub/template-service";

export async function assignVendorTemplate(vendorId: string, vendorTypeId: string | null) {
  const session = await requireUser();
  if (session.demo || !session.org) return;
  await templateService.assignTemplate(session.org.id, vendorId, vendorTypeId);
  revalidatePath(`/vendors/${vendorId}`);
}
