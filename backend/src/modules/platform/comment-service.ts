import {
  insertComment,
  findComments,
  updateComment as repoUpdateComment,
  resolveComment as repoResolveComment,
  deleteComment as repoDeleteComment,
  addReaction as repoAddReaction,
  removeReaction as repoRemoveReaction,
  countComments,
} from "@/backend/src/modules/platform/comment-repo";
import { DomainError } from "@/lib/services/errors";
import { publishActivity } from "@/backend/src/modules/platform/activity-service";

const ALLOWED_EMOJIS = new Set(["👍", "👎", "❤️", "🎉", "😮", "😢"]);

function validateBody(body: string): void {
  if (!body || body.trim().length === 0) {
    throw new DomainError("Comment body cannot be empty.");
  }
}

function validateEmoji(emoji: string): void {
  if (!ALLOWED_EMOJIS.has(emoji) && [...emoji].length !== 1) {
    throw new DomainError(`Invalid emoji: ${emoji}`);
  }
}

export async function addComment(params: {
  orgId: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  authorId?: string;
  authorName?: string;
  body: string;
  parentId?: string;
}): Promise<{ id: string }> {
  validateBody(params.body);

  const result = await insertComment({
    orgId: params.orgId,
    entityType: params.entityType,
    entityId: params.entityId,
    authorId: params.authorId,
    body: params.body.trim(),
    parentId: params.parentId,
  });

  await publishActivity({
    orgId: params.orgId,
    entityType: params.entityType,
    entityId: params.entityId,
    entityName: params.entityName,
    actorId: params.authorId,
    actorName: params.authorName,
    eventType: "commented",
    title: `Comment added${params.entityName ? ` on ${params.entityName}` : ""}`,
    metadata: { commentId: result.id },
  }).catch(() => {});

  return result;
}

export async function getComments(
  orgId: string,
  entityType: string,
  entityId: string
) {
  return findComments(orgId, entityType, entityId);
}

export async function editComment(
  orgId: string,
  commentId: string,
  body: string
): Promise<void> {
  validateBody(body);
  await repoUpdateComment(orgId, commentId, body.trim());
}

export async function resolveComment(
  orgId: string,
  commentId: string,
  resolvedBy: string
): Promise<void> {
  await repoResolveComment(orgId, commentId, resolvedBy);
}

export async function deleteComment(
  orgId: string,
  commentId: string
): Promise<void> {
  await repoDeleteComment(orgId, commentId);
}

export async function addReaction(
  commentId: string,
  userId: string,
  emoji: string
): Promise<void> {
  validateEmoji(emoji);
  await repoAddReaction(commentId, userId, emoji);
}

export async function removeReaction(
  commentId: string,
  userId: string,
  emoji: string
): Promise<void> {
  validateEmoji(emoji);
  await repoRemoveReaction(commentId, userId, emoji);
}

export async function getCommentCount(
  orgId: string,
  entityType: string,
  entityId: string
): Promise<number> {
  return countComments(orgId, entityType, entityId);
}
