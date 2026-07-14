import { sql } from "drizzle-orm";
import { db, type Executor } from "@/lib/db";

export type ReactionSummary = { emoji: string; count: number; user_ids: string[] };

export type CommentRow = {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  parent_id: string | null;
  author_id: string | null;
  author_name: string | null;
  body: string;
  is_edited: boolean;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
  reactions?: ReactionSummary[];
  replies?: CommentRow[];
};

type RawCommentRow = {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  parent_id: string | null;
  author_id: string | null;
  author_name: string | null;
  body: string;
  is_edited: boolean;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type RawReactionRow = {
  comment_id: string;
  emoji: string;
  user_id: string;
};

export async function insertComment(
  params: {
    orgId: string;
    entityType: string;
    entityId: string;
    authorId?: string;
    authorName?: string;
    body: string;
    parentId?: string;
  },
  exec?: Executor
): Promise<{ id: string }> {
  const runner = exec ?? db;
  const rows = await (runner as typeof db).execute<{ id: string }>(sql`
    INSERT INTO platform_comments (
      organization_id,
      entity_type,
      entity_id,
      parent_id,
      author_id,
      author_name,
      body
    ) VALUES (
      ${params.orgId},
      ${params.entityType},
      ${params.entityId},
      ${params.parentId ?? null},
      ${params.authorId ?? null},
      ${params.authorName ?? null},
      ${params.body}
    )
    RETURNING id
  `);
  return rows[0];
}

export async function findComments(
  orgId: string,
  entityType: string,
  entityId: string
): Promise<CommentRow[]> {
  const commentRows = await db.execute<RawCommentRow>(sql`
    SELECT
      id, organization_id, entity_type, entity_id, parent_id,
      author_id, author_name, body, is_edited, is_resolved,
      resolved_by, resolved_at, created_at, updated_at
    FROM platform_comments
    WHERE organization_id = ${orgId}
      AND entity_type = ${entityType}
      AND entity_id = ${entityId}
    ORDER BY created_at ASC
  `);

  const allComments = Array.from(commentRows) as RawCommentRow[];

  if (allComments.length === 0) return [];

  const commentIds = allComments.map((c) => c.id);

  const reactionRows = await db.execute<RawReactionRow>(sql`
    SELECT comment_id, emoji, user_id
    FROM comment_reactions
    WHERE comment_id = ANY(${commentIds}::uuid[])
  `);

  const reactionsByComment = new Map<string, RawReactionRow[]>();
  for (const r of Array.from(reactionRows) as RawReactionRow[]) {
    if (!reactionsByComment.has(r.comment_id)) {
      reactionsByComment.set(r.comment_id, []);
    }
    reactionsByComment.get(r.comment_id)!.push(r);
  }

  function buildReactions(commentId: string): ReactionSummary[] {
    const raw = reactionsByComment.get(commentId) ?? [];
    const byEmoji = new Map<string, string[]>();
    for (const r of raw) {
      if (!byEmoji.has(r.emoji)) byEmoji.set(r.emoji, []);
      byEmoji.get(r.emoji)!.push(r.user_id);
    }
    return Array.from(byEmoji.entries()).map(([emoji, user_ids]) => ({
      emoji,
      count: user_ids.length,
      user_ids,
    }));
  }

  const commentMap = new Map<string, CommentRow>();
  for (const raw of allComments) {
    commentMap.set(raw.id, {
      ...raw,
      reactions: buildReactions(raw.id),
      replies: [],
    });
  }

  const topLevel: CommentRow[] = [];
  for (const comment of commentMap.values()) {
    if (comment.parent_id && commentMap.has(comment.parent_id)) {
      commentMap.get(comment.parent_id)!.replies!.push(comment);
    } else if (!comment.parent_id) {
      topLevel.push(comment);
    }
  }

  return topLevel;
}

export async function updateComment(
  orgId: string,
  commentId: string,
  body: string
): Promise<void> {
  await db.execute(sql`
    UPDATE platform_comments
    SET body = ${body}, is_edited = true, updated_at = now()
    WHERE id = ${commentId}
      AND organization_id = ${orgId}
  `);
}

export async function resolveComment(
  orgId: string,
  commentId: string,
  resolvedBy: string
): Promise<void> {
  await db.execute(sql`
    UPDATE platform_comments
    SET is_resolved = true, resolved_by = ${resolvedBy}, resolved_at = now(), updated_at = now()
    WHERE id = ${commentId}
      AND organization_id = ${orgId}
  `);
}

export async function deleteComment(
  orgId: string,
  commentId: string
): Promise<void> {
  await db.execute(sql`
    DELETE FROM platform_comments
    WHERE id = ${commentId}
      AND organization_id = ${orgId}
  `);
}

export async function addReaction(
  commentId: string,
  userId: string,
  emoji: string
): Promise<void> {
  await db.execute(sql`
    INSERT INTO comment_reactions (comment_id, user_id, emoji)
    VALUES (${commentId}, ${userId}, ${emoji})
    ON CONFLICT (comment_id, user_id, emoji) DO NOTHING
  `);
}

export async function removeReaction(
  commentId: string,
  userId: string,
  emoji: string
): Promise<void> {
  await db.execute(sql`
    DELETE FROM comment_reactions
    WHERE comment_id = ${commentId}
      AND user_id = ${userId}
      AND emoji = ${emoji}
  `);
}

export async function countComments(
  orgId: string,
  entityType: string,
  entityId: string
): Promise<number> {
  const rows = await db.execute<{ count: string }>(sql`
    SELECT COUNT(*)::text AS count
    FROM platform_comments
    WHERE organization_id = ${orgId}
      AND entity_type = ${entityType}
      AND entity_id = ${entityId}
  `);
  return parseInt(rows[0]?.count ?? "0", 10);
}
