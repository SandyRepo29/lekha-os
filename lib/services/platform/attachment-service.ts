import {
  insertAttachment,
  findAttachmentsByEntity,
  findAttachmentById,
  deleteAttachmentById,
  insertAttachmentVersion,
  getAttachmentVersions,
  bumpAttachmentVersion,
  countAttachmentsByEntity,
} from "@/lib/repositories/platform/attachment-repo";
import { getStorageProvider } from "@/lib/providers/storage";
import publishActivity from "@/lib/services/platform/activity-service";
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

  const storage = getStorageProvider();
  await storage.uploadFile(storagePath, fileBuffer, {
    contentType: contentType ?? "application/octet-stream",
  });

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
  return findAttachmentsByEntity(orgId, entityType, entityId);
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

  const storage = getStorageProvider();
  const url = await storage.generateSignedUrl(attachment.storagePath, 15 * 60);
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
  const { orgId, attachmentId, fileBuffer, fileName, uploadedBy, changeNote } =
    params;

  const attachment = await findAttachmentById(orgId, attachmentId);
  if (!attachment) {
    throw new DomainError("Attachment not found");
  }

  const newVersionNumber = (attachment.versionNumber ?? 1) + 1;
  const storagePath = `attachments/${orgId}/${attachment.entityType}/${attachment.entityId}/${Date.now()}_${fileName}`;

  const storage = getStorageProvider();
  await storage.uploadFile(storagePath, fileBuffer, {
    contentType: attachment.contentType ?? "application/octet-stream",
  });

  await insertAttachmentVersion({
    attachmentId,
    orgId,
    versionNumber: newVersionNumber,
    storagePath,
    fileName,
    uploadedBy,
    changeNote,
  });

  await bumpAttachmentVersion(orgId, attachmentId, newVersionNumber, storagePath, fileName);
}

export async function deleteAttachment(
  orgId: string,
  attachmentId: string,
  actorName?: string
): Promise<void> {
  const attachment = await findAttachmentById(orgId, attachmentId);
  if (!attachment) {
    throw new DomainError("Attachment not found");
  }

  const storage = getStorageProvider();
  await storage.deleteFile(attachment.storagePath).catch(() => {});

  await deleteAttachmentById(orgId, attachmentId);

  await publishActivity({
    orgId,
    entityType: attachment.entityType,
    entityId: attachment.entityId,
    entityName: attachment.entityId,
    eventType: "attachment_removed",
    actorName,
    metadata: { fileName: attachment.fileName, attachmentId },
  }).catch(() => {});
}

export async function getAttachmentCount(
  orgId: string,
  entityType: string,
  entityId: string
): Promise<number> {
  return countAttachmentsByEntity(orgId, entityType, entityId);
}
