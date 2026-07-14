import {
  insertAttachment,
  findEntityAttachments,
  findAttachmentById,
  deleteAttachment as repoDeleteAttachment,
  addAttachmentVersion,
  findAttachmentVersions,
  updateAttachmentLatest,
  countEntityAttachments,
} from "@/backend/src/modules/platform/attachment-repo";
import {
  uploadFile,
  removeObjects,
  createSignedUrl,
} from "@/lib/storage/server";
import { publishActivity } from "@/backend/src/modules/platform/activity-service";
import { DomainError } from "@/lib/services/errors";

export async function uploadAttachment(params: {
  orgId: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  fileName: string;
  fileSize?: number;
  contentType?: string;
  fileBuffer: Buffer;
  uploadedBy?: string;
  uploadedByName?: string;
  description?: string;
}): Promise<{ id: string; storagePath: string }> {
  const {
    orgId,
    entityType,
    entityId,
    entityName,
    fileName,
    fileSize,
    contentType,
    fileBuffer,
    uploadedBy,
    uploadedByName,
    description,
  } = params;

  const storagePath = `attachments/${orgId}/${entityType}/${entityId}/${Date.now()}_${fileName}`;

  await uploadFile(storagePath, fileBuffer, contentType ?? "application/octet-stream");

  const record = await insertAttachment({
    orgId,
    entityType,
    entityId,
    fileName,
    storagePath,
    fileSize,
    contentType,
    uploadedBy,
    description,
  });

  await publishActivity({
    orgId,
    entityType,
    entityId,
    entityName: entityName ?? entityId,
    eventType: "attachment_added",
    title: `Attachment uploaded: ${fileName}`,
    actorId: uploadedBy,
    actorName: uploadedByName,
    metadata: { fileName, attachmentId: record.id },
  }).catch(() => {});

  return { id: record.id, storagePath };
}

export async function getEntityAttachments(
  orgId: string,
  entityType: string,
  entityId: string
) {
  return findEntityAttachments(orgId, entityType, entityId);
}

export async function getAttachment(orgId: string, attachmentId: string) {
  const attachment = await findAttachmentById(orgId, attachmentId);
  if (!attachment) {
    throw new DomainError("Attachment not found");
  }
  return attachment;
}

export async function getAttachmentDownloadUrl(
  orgId: string,
  attachmentId: string
): Promise<string> {
  const attachment = await findAttachmentById(orgId, attachmentId);
  if (!attachment) {
    throw new DomainError("Attachment not found");
  }

  const url = await createSignedUrl(attachment.storage_path, 15 * 60);
  if (!url) throw new DomainError("Could not generate download URL");
  return url;
}

export async function addVersion(params: {
  orgId: string;
  attachmentId: string;
  fileBuffer: Buffer;
  fileName: string;
  uploadedBy?: string;
  changeNote?: string;
}): Promise<void> {
  const { orgId, attachmentId, fileBuffer, fileName, uploadedBy, changeNote } = params;

  const attachment = await findAttachmentById(orgId, attachmentId);
  if (!attachment) {
    throw new DomainError("Attachment not found");
  }

  const newVersion = (attachment.version ?? 1) + 1;
  const storagePath = `attachments/${orgId}/${attachment.entity_type}/${attachment.entity_id}/${Date.now()}_${fileName}`;

  await uploadFile(
    storagePath,
    fileBuffer,
    attachment.content_type ?? "application/octet-stream"
  );

  await addAttachmentVersion({
    attachmentId,
    version: newVersion,
    storagePath,
    uploadedBy,
    changeNote,
  });

  await updateAttachmentLatest(orgId, attachmentId);
}

export async function deleteAttachmentById(
  orgId: string,
  attachmentId: string,
  actorName?: string
): Promise<void> {
  const attachment = await findAttachmentById(orgId, attachmentId);
  if (!attachment) {
    throw new DomainError("Attachment not found");
  }

  await removeObjects([attachment.storage_path]).catch(() => {});

  await repoDeleteAttachment(orgId, attachmentId);

  await publishActivity({
    orgId,
    entityType: attachment.entity_type,
    entityId: attachment.entity_id,
    entityName: attachment.entity_id,
    eventType: "attachment_removed",
    title: `Attachment removed: ${attachment.file_name}`,
    actorName,
    metadata: { fileName: attachment.file_name, attachmentId },
  }).catch(() => {});
}

export async function getAttachmentVersions(orgId: string, attachmentId: string) {
  return findAttachmentVersions(orgId, attachmentId);
}

export async function getAttachmentCount(
  orgId: string,
  entityType: string,
  entityId: string
): Promise<number> {
  return countEntityAttachments(orgId, entityType, entityId);
}
