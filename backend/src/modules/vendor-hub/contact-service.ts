import { DomainError } from "@/lib/services/errors";
import * as contactRepo from "@/backend/src/modules/vendor-hub/vendor-contacts-repo";
import * as timelineRepo from "@/backend/src/modules/vendor-hub/vendor-timeline-repo";
import type { ContactType, VendorContact } from "@/backend/src/modules/vendor-hub/vendor-contacts-repo";

export type { ContactType, VendorContact };
export { CONTACT_TYPE_LABELS } from "@/backend/src/modules/vendor-hub/vendor-contacts-repo";

export async function getContacts(orgId: string, vendorId: string): Promise<VendorContact[]> {
  return contactRepo.findContactsByVendor(orgId, vendorId);
}

export async function addContact(params: {
  orgId: string;
  vendorId: string;
  actorId: string;
  actorName?: string;
  contactType: ContactType;
  name: string;
  email?: string;
  phone?: string;
  title?: string;
  department?: string;
  isPrimary?: boolean;
  linkedinUrl?: string;
  notes?: string;
}): Promise<{ id: string }> {
  if (!params.name?.trim()) throw new DomainError("Contact name is required.");

  const contact = await contactRepo.insertContact({
    orgId:       params.orgId,
    vendorId:    params.vendorId,
    contactType: params.contactType,
    name:        params.name.trim(),
    email:       params.email,
    phone:       params.phone,
    title:       params.title,
    department:  params.department,
    isPrimary:   params.isPrimary,
    linkedinUrl: params.linkedinUrl,
    notes:       params.notes,
  });

  await timelineRepo.insertTimelineEvent({
    orgId:      params.orgId,
    vendorId:   params.vendorId,
    eventType:  "contact_added",
    title:      `Contact added: ${params.name}`,
    description: params.contactType.replace(/_/g, " "),
    actorId:    params.actorId,
    actorName:  params.actorName,
    entityType: "contact",
    entityId:   contact.id,
    severity:   "info",
  });

  return contact;
}

export async function updateContact(params: {
  orgId: string;
  vendorId: string;
  contactId: string;
  actorId: string;
  actorName?: string;
  values: Partial<{
    contactType: ContactType;
    name: string;
    email: string;
    phone: string;
    title: string;
    department: string;
    isPrimary: boolean;
    linkedinUrl: string;
    notes: string;
  }>;
}): Promise<void> {
  await contactRepo.updateContact(params.orgId, params.contactId, params.values);
  await timelineRepo.insertTimelineEvent({
    orgId:      params.orgId,
    vendorId:   params.vendorId,
    eventType:  "contact_updated",
    title:      "Contact updated",
    actorId:    params.actorId,
    actorName:  params.actorName,
    entityType: "contact",
    entityId:   params.contactId,
    severity:   "info",
  });
}

export async function removeContact(params: {
  orgId: string;
  vendorId: string;
  contactId: string;
  actorId: string;
  actorName?: string;
}): Promise<void> {
  await contactRepo.deleteContact(params.orgId, params.contactId);
  await timelineRepo.insertTimelineEvent({
    orgId:      params.orgId,
    vendorId:   params.vendorId,
    eventType:  "contact_updated",
    title:      "Contact removed",
    actorId:    params.actorId,
    actorName:  params.actorName,
    severity:   "warn",
  });
}
