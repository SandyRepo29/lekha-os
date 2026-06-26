import { sql } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";

// Re-export from client-safe constants module
export type { ContactType } from "@/lib/constants/vendor-contacts";
export { CONTACT_TYPE_LABELS } from "@/lib/constants/vendor-contacts";

export type VendorContact = {
  id: string;
  organization_id: string;
  vendor_id: string;
  contact_type: ContactType;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  department: string | null;
  is_primary: boolean;
  linkedin_url: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
};

export async function findContactsByVendor(orgId: string, vendorId: string): Promise<VendorContact[]> {
  const rows = await db.execute<VendorContact>(
    sql`SELECT * FROM vendor_contacts
        WHERE organization_id = ${orgId} AND vendor_id = ${vendorId}
        ORDER BY is_primary DESC, contact_type ASC, name ASC`
  );
  return Array.from(rows);
}

export async function insertContact(
  params: {
    orgId: string;
    vendorId: string;
    contactType: ContactType;
    name: string;
    email?: string;
    phone?: string;
    title?: string;
    department?: string;
    isPrimary?: boolean;
    linkedinUrl?: string;
    notes?: string;
  },
  exec: Executor = db
): Promise<{ id: string }> {
  const rows = await exec.execute<{ id: string }>(
    sql`INSERT INTO vendor_contacts
          (organization_id, vendor_id, contact_type, name, email, phone, title, department, is_primary, linkedin_url, notes)
        VALUES
          (${params.orgId}, ${params.vendorId}, ${params.contactType}::contact_type,
           ${params.name}, ${params.email ?? null}, ${params.phone ?? null},
           ${params.title ?? null}, ${params.department ?? null},
           ${params.isPrimary ?? false}, ${params.linkedinUrl ?? null}, ${params.notes ?? null})
        RETURNING id`
  );
  return rows[0]!;
}

export async function updateContact(
  orgId: string,
  contactId: string,
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
  }>,
  exec: Executor = db
): Promise<void> {
  const sets: string[] = ["updated_at = NOW()"];
  if (values.name        !== undefined) sets.push(`name = '${values.name.replace(/'/g, "''")}'`);
  if (values.email       !== undefined) sets.push(`email = ${values.email ? `'${values.email}'` : "NULL"}`);
  if (values.phone       !== undefined) sets.push(`phone = ${values.phone ? `'${values.phone}'` : "NULL"}`);
  if (values.title       !== undefined) sets.push(`title = ${values.title ? `'${values.title}'` : "NULL"}`);
  if (values.department  !== undefined) sets.push(`department = ${values.department ? `'${values.department}'` : "NULL"}`);
  if (values.isPrimary   !== undefined) sets.push(`is_primary = ${values.isPrimary}`);
  if (values.linkedinUrl !== undefined) sets.push(`linkedin_url = ${values.linkedinUrl ? `'${values.linkedinUrl}'` : "NULL"}`);
  if (values.notes       !== undefined) sets.push(`notes = ${values.notes ? `'${values.notes}'` : "NULL"}`);
  if (values.contactType !== undefined) sets.push(`contact_type = '${values.contactType}'::contact_type`);

  await exec.execute(
    sql`UPDATE vendor_contacts SET ${sql.raw(sets.join(", "))}
        WHERE id = ${contactId} AND organization_id = ${orgId}`
  );
}

export async function deleteContact(orgId: string, contactId: string, exec: Executor = db): Promise<void> {
  await exec.execute(
    sql`DELETE FROM vendor_contacts WHERE id = ${contactId} AND organization_id = ${orgId}`
  );
}
