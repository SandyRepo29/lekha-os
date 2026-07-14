"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import * as tagService from "@/backend/src/modules/platform/tag-service";

export type TagActionState = { error?: string; ok?: boolean };

export async function createTagAction(
  _prev: TagActionState | undefined,
  formData: FormData
): Promise<TagActionState> {
  try {
    const session = await requireUser();
    if (!session.org) return { error: "No organization context" };

    const name = formData.get("name") as string;
    const color = (formData.get("color") as string) || undefined;
    const description = (formData.get("description") as string) || undefined;

    if (!name?.trim()) return { error: "Tag name is required" };

    await tagService.createTag(session.org.id, { name: name.trim(), color, description });
    revalidatePath("/settings");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Failed to create tag" };
  }
}

export async function updateTagAction(
  _prev: TagActionState | undefined,
  formData: FormData
): Promise<TagActionState> {
  try {
    const session = await requireUser();
    if (!session.org) return { error: "No organization context" };

    const tagId = formData.get("tagId") as string;
    const name = (formData.get("name") as string) || undefined;
    const color = (formData.get("color") as string) || undefined;
    const description = (formData.get("description") as string) || undefined;

    if (!tagId) return { error: "Tag ID is required" };

    await tagService.updateTag(session.org.id, tagId, { name: name?.trim(), color, description });
    revalidatePath("/settings");
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Failed to update tag" };
  }
}

export async function deleteTagAction(tagId: string): Promise<{ error?: string }> {
  try {
    const session = await requireUser();
    if (!session.org) return { error: "No organization context" };

    if (!tagId) return { error: "Tag ID is required" };

    await tagService.deleteTag(session.org.id, tagId);
    revalidatePath("/settings");
    return {};
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Failed to delete tag" };
  }
}

export async function tagEntityAction(
  tagId: string,
  entityType: string,
  entityId: string
): Promise<{ error?: string }> {
  try {
    const session = await requireUser();
    if (!session.org) return { error: "No organization context" };

    if (!tagId || !entityType || !entityId) return { error: "tagId, entityType, and entityId are required" };

    await tagService.tagEntity(session.org.id, session.id, tagId, entityType, entityId);
    return {};
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Failed to tag entity" };
  }
}

export async function untagEntityAction(
  tagId: string,
  entityType: string,
  entityId: string
): Promise<{ error?: string }> {
  try {
    const session = await requireUser();
    if (!session.org) return { error: "No organization context" };

    if (!tagId || !entityType || !entityId) return { error: "tagId, entityType, and entityId are required" };

    await tagService.untagEntity(session.org.id, tagId, entityType, entityId);
    return {};
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Failed to untag entity" };
  }
}

export async function findOrCreateTagAction(
  name: string,
  color?: string
): Promise<{ id?: string; error?: string }> {
  try {
    const session = await requireUser();
    if (!session.org) return { error: "No organization context" };

    if (!name?.trim()) return { error: "Tag name is required" };

    const tag = await tagService.findOrCreateTag(session.org.id, name.trim(), color);
    return { id: tag.id };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Failed to find or create tag" };
  }
}
