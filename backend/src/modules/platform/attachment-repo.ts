import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

type AttachmentRow = {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  file_name: string;
  file_size: number | null;
  content_type: string | null;
  storage_path: string;
  storage_bucket: string;
  version: number;
  is_latest: boolean;
  checksum: string | null;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  description: string | null;
  created_at: Date;
};

type AttachmentVersionRow = {
  id: string;
  attachment_id: string;
  version: number;
  storage_path: string;
  file_size: number | null;
  checksum: string | null;
  uploaded_by: string | null;
  change_note: string | null;
  created_at: Date;
};

export async function insertAttachment(params: {
  orgId: string;
  entityType: string;
  entityId: string;
  fileName: string;
  fileSize?: number | null;
  contentType?: string | null;
  storagePath: string;
  storageBucket?: string;
  version?: number;
  checksum?: string | null;
  uploadedBy?: string | null;
  uploadedByName?: string | null;
  description?: string | null;
}): Promise<{ id: string }> {
  const rows = await db.execute<{ id: string }>(sql`
    INSERT INTO platform_attachments (
      organization_id, entity_type, entity_id, file_name, file_size,
      content_type, storage_path, storage_bucket, version, is_latest,
      checksum, uploaded_by, uploaded_by_name, description
    ) VALUES (
      ${params.orgId}, ${params.entityType}, ${params.entityId},
      ${params.fileName}, ${params.fileSize ?? null},
      ${params.contentType ?? null}, ${params.storagePath},
      ${params.storageBucket ?? "vendor-documents"}, ${params.version ?? 1},
      true, ${params.checksum ?? null}, ${params.uploadedBy ?? null},
      ${params.uploadedByName ?? null}, ${params.description ?? null}
    )
    RETURNING id
  `);
  return rows[0];
}

export async function findEntityAttachments(
  orgId: string,
  entityType: string,
  entityId: string
): Promise<AttachmentRow[]> {
  const rows = await db.execute<AttachmentRow>(sql`
    SELECT
      id, organization_id, entity_type, entity_id, file_name, file_size,
      content_type, storage_path, storage_bucket, version, is_latest,
      checksum, uploaded_by, uploaded_by_name, description, created_at
    FROM platform_attachments
    WHERE organization_id = ${orgId}
      AND entity_type = ${entityType}
      AND entity_id = ${entityId}
    ORDER BY created_at DESC
  `);
  return Array.from(rows);
}

export async function findAttachmentById(
  orgId: string,
  attachmentId: string
): Promise<AttachmentRow | null> {
  const rows = await db.execute<AttachmentRow>(sql`
    SELECT
      id, organization_id, entity_type, entity_id, file_name, file_size,
      content_type, storage_path, storage_bucket, version, is_latest,
      checksum, uploaded_by, uploaded_by_name, description, created_at
    FROM platform_attachments
    WHERE organization_id = ${orgId}
      AND id = ${attachmentId}
    LIMIT 1
  `);
  return rows[0] ?? null;
}

export async function findAttachmentVersions(
  orgId: string,
  attachmentId: string
): Promise<AttachmentVersionRow[]> {
  const rows = await db.execute<AttachmentVersionRow>(sql`
    SELECT
      av.id, av.attachment_id, av.version, av.storage_path, av.file_size,
      av.checksum, av.uploaded_by, av.change_note, av.created_at
    FROM attachment_versions av
    JOIN platform_attachments pa ON pa.id = av.attachment_id
    WHERE pa.organization_id = ${orgId}
      AND av.attachment_id = ${attachmentId}
    ORDER BY av.version DESC
  `);
  return Array.from(rows);
}

export async function addAttachmentVersion(params: {
  attachmentId: string;
  version: number;
  storagePath: string;
  fileSize?: number | null;
  checksum?: string | null;
  uploadedBy?: string | null;
  changeNote?: string | null;
}): Promise<{ id: string }> {
  const rows = await db.execute<{ id: string }>(sql`
    INSERT INTO attachment_versions (
      attachment_id, version, storage_path, file_size,
      checksum, uploaded_by, change_note
    ) VALUES (
      ${params.attachmentId}, ${params.version}, ${params.storagePath},
      ${params.fileSize ?? null}, ${params.checksum ?? null},
      ${params.uploadedBy ?? null}, ${params.changeNote ?? null}
    )
    RETURNING id
  `);
  return rows[0];
}

export async function updateAttachmentLatest(
  orgId: string,
  attachmentId: string
): Promise<void> {
  await db.execute(sql`
    UPDATE platform_attachments
    SET is_latest = true
    WHERE organization_id = ${orgId}
      AND id = ${attachmentId}
  `);
}

export async function deleteAttachment(
  orgId: string,
  attachmentId: string
): Promise<void> {
  await db.execute(sql`
    DELETE FROM platform_attachments
    WHERE organization_id = ${orgId}
      AND id = ${attachmentId}
  `);
}

export async function countEntityAttachments(
  orgId: string,
  entityType: string,
  entityId: string
): Promise<number> {
  const rows = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*)::text AS count
    FROM platform_attachments
    WHERE organization_id = ${orgId}
      AND entity_type = ${entityType}
      AND entity_id = ${entityId}
  `);
  return parseInt(rows[0]?.count ?? "0", 10);
}
