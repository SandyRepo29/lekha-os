"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { DomainError } from "@/lib/services/errors";
import * as commentService from "@/lib/services/platform/comment-service";

export type CommentActionState = { error?: string; ok?: boolean };

function getEntityPath(entityType: string, entityId: string): string {
  switch (entityType) {
    case "vendor":
      return `/vendors/${entityId}`;
    case "risk":
      return `/risks/${entityId}`;
    case "audit":
      return `/audits/${entityId}`;
    case "contract":
      return `/contract-governance/${entityId}`;
    case "issue":
      return `/issue-hub/${entityId}`;
    default:
      return "/";
  }
}

export async function addCommentAction(
  _prev: CommentActionState | undefined,
  formData: FormData
): Promise<CommentActionState> {
  try {
    const session = await requireUser();
    const orgId = session.org!.id;
    const userId = session.id;

    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string;
    const entityName = formData.get("entityName") as string | undefined;
    const body = formData.get("body") as string;
    const parentId = formData.get("parentId") as string | undefined;

    if (!entityType || !entityId || !body?.trim()) {
      return { error: "Entity type, entity ID, and comment body are required." };
    }

    await commentService.addComment({
      orgId,
      userId,
      entityType,
      entityId,
      entityName: entityName ?? undefined,
      body: body.trim(),
      parentId: parentId ?? undefined,
    });

    revalidatePath(getEntityPath(entityType, entityId));
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Failed to add comment." };
  }
}

export async function editCommentAction(
  _prev: CommentActionState | undefined,
  formData: FormData
): Promise<CommentActionState> {
  try {
    const session = await requireUser();
    const userId = session.id;

    const commentId = formData.get("commentId") as string;
    const body = formData.get("body") as string;
    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string;

    if (!commentId || !body?.trim()) {
      return { error: "Comment ID and body are required." };
    }

    await commentService.editComment({ commentId, userId, body: body.trim() });

    revalidatePath(getEntityPath(entityType, entityId));
    return { ok: true };
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Failed to edit comment." };
  }
}

export async function resolveCommentAction(
  commentId: string,
  entityType: string,
  entityId: string
): Promise<{ error?: string }> {
  try {
    const session = await requireUser();
    const userId = session.id;

    await commentService.resolveComment({ commentId, userId });

    revalidatePath(getEntityPath(entityType, entityId));
    return {};
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Failed to resolve comment." };
  }
}

export async function deleteCommentAction(
  commentId: string,
  entityType: string,
  entityId: string
): Promise<{ error?: string }> {
  try {
    const session = await requireUser();
    const userId = session.id;

    await commentService.deleteComment({ commentId, userId });

    revalidatePath(getEntityPath(entityType, entityId));
    return {};
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Failed to delete comment." };
  }
}

export async function addReactionAction(
  commentId: string,
  emoji: string
): Promise<{ error?: string }> {
  try {
    const session = await requireUser();
    const userId = session.id;

    await commentService.addReaction({ commentId, userId, emoji });
    return {};
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Failed to add reaction." };
  }
}

export async function removeReactionAction(
  commentId: string,
  emoji: string
): Promise<{ error?: string }> {
  try {
    const session = await requireUser();
    const userId = session.id;

    await commentService.removeReaction({ commentId, userId, emoji });
    return {};
  } catch (err) {
    if (err instanceof DomainError) return { error: err.message };
    return { error: "Failed to remove reaction." };
  }
}
