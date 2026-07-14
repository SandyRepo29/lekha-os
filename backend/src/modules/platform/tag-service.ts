import {
  insertTag as repoCreateTag,
  updateTag as repoUpdateTag,
  deleteTag as repoDeleteTag,
  findOrgTags as repoGetOrgTags,
  addTagToEntity as repoTagEntity,
  removeTagFromEntity as repoUntagEntity,
  findEntityTags as repoGetEntityTags,
  searchTags as repoSearchTags,
  type TagRow,
} from "@/backend/src/modules/platform/tag-repo";
import { DomainError } from "@/lib/services/errors";

export type { TagRow };

function validateName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw new DomainError("Tag name must not be empty.");
  }
  if (name.trim().length > 50) {
    throw new DomainError("Tag name must be 50 characters or fewer.");
  }
}

function validateColor(color: string): void {
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    throw new DomainError("Color must be a valid hex color in the format #xxxxxx.");
  }
}

export async function createTag(
  orgId: string,
  params: { name: string; color?: string; description?: string; createdBy?: string }
): Promise<{ id: string }> {
  validateName(params.name);
  if (params.color !== undefined) {
    validateColor(params.color);
  }
  return repoCreateTag({
    orgId,
    name: params.name.trim(),
    color: params.color,
    description: params.description,
    createdBy: params.createdBy,
  });
}

export async function updateTag(
  orgId: string,
  tagId: string,
  values: { name?: string; color?: string; description?: string }
): Promise<void> {
  if (values.name !== undefined) {
    validateName(values.name);
    values = { ...values, name: values.name.trim() };
  }
  if (values.color !== undefined) {
    validateColor(values.color);
  }
  await repoUpdateTag(orgId, tagId, values);
}

export async function deleteTag(orgId: string, tagId: string): Promise<void> {
  await repoDeleteTag(orgId, tagId);
}

export async function getOrgTags(orgId: string): Promise<TagRow[]> {
  return repoGetOrgTags(orgId);
}

export async function tagEntity(
  orgId: string,
  taggedBy: string,
  tagId: string,
  entityType: string,
  entityId: string
): Promise<void> {
  await repoTagEntity({ orgId, tagId, entityType, entityId, taggedBy });
}

export async function untagEntity(
  orgId: string,
  tagId: string,
  entityType: string,
  entityId: string
): Promise<void> {
  await repoUntagEntity({ orgId, tagId, entityType, entityId });
}

export async function getEntityTags(
  orgId: string,
  entityType: string,
  entityId: string
): Promise<TagRow[]> {
  return repoGetEntityTags(orgId, entityType, entityId);
}

export async function searchTags(orgId: string, query: string): Promise<TagRow[]> {
  return repoSearchTags(orgId, query);
}

export async function findOrCreateTag(
  orgId: string,
  name: string,
  color?: string,
  createdBy?: string
): Promise<{ id: string }> {
  validateName(name);
  if (color !== undefined) {
    validateColor(color);
  }
  const trimmed = name.trim();
  const matches = await repoSearchTags(orgId, trimmed);
  const existing = matches.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) {
    return { id: existing.id };
  }
  return repoCreateTag({ orgId, name: trimmed, color, createdBy });
}
