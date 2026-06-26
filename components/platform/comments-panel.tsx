"use client";

import { useActionState, useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Reply, ThumbsUp, Check, Trash2, Edit2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  addCommentAction,
  editCommentAction,
  resolveCommentAction,
  deleteCommentAction,
  addReactionAction,
} from "@/lib/platform/comment-actions";
import type { CommentActionState, CommentRow } from "@/lib/platform/comment-actions";

interface Props {
  entityType: string;
  entityId: string;
  entityName?: string;
  currentUserId?: string;
  currentUserName?: string;
  canComment?: boolean;
  initialComments?: CommentRow[];
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const EMOJIS = ["👍", "❤️", "🎉"] as const;

function ReactionBar({
  comment,
  onReact,
}: {
  comment: CommentRow;
  onReact: (emoji: string) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "0.375rem", alignItems: "center", flexWrap: "wrap" }}>
      {EMOJIS.map((emoji) => {
        const count = comment.reactions?.[emoji] ?? 0;
        return (
          <button
            key={emoji}
            onClick={() => onReact(emoji)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              padding: "0.125rem 0.5rem",
              borderRadius: "9999px",
              border: "1px solid var(--color-line)",
              background: count > 0 ? "rgba(255,255,255,0.06)" : "transparent",
              color: "var(--color-ink-dim)",
              fontSize: "0.75rem",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            <span>{emoji}</span>
            {count > 0 && <span>{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

function CommentItem({
  comment,
  depth,
  currentUserId,
  canComment,
  entityType,
  entityId,
  entityName,
  onRefresh,
}: {
  comment: CommentRow;
  depth: number;
  currentUserId?: string;
  canComment?: boolean;
  entityType: string;
  entityId: string;
  entityName?: string;
  onRefresh: () => void;
}) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editBody, setEditBody] = useState(comment.body);
  const [isPending, startTransition] = useTransition();

  const [addState, addDispatch] = useActionState<CommentActionState | undefined, FormData>(
    addCommentAction as any,
    undefined
  );

  const isAuthor = currentUserId === comment.author_id;

  async function handleReact(emoji: string) {
    await addReactionAction(comment.id, emoji);
    onRefresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this comment?")) return;
    await deleteCommentAction(comment.id);
    onRefresh();
  }

  async function handleResolve() {
    await resolveCommentAction(comment.id);
    onRefresh();
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    await editCommentAction(comment.id, editBody);
    setEditing(false);
    onRefresh();
  }

  return (
    <div style={{ marginLeft: depth > 0 ? "1.5rem" : "0", marginBottom: "1rem" }}>
      <div
        style={{
          borderRadius: "0.75rem",
          border: "1px solid var(--color-line)",
          background: "rgba(255,255,255,0.02)",
          padding: "0.875rem 1rem",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.625rem", marginBottom: "0.5rem" }}>
          <div
            style={{
              width: "2rem",
              height: "2rem",
              borderRadius: "9999px",
              background: "var(--color-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {initials(comment.author_name ?? "?")}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--color-ink)" }}>
                {comment.author_name ?? "Unknown"}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-ink-faint)" }}>
                {new Date(comment.created_at).toLocaleDateString()}
              </span>
              {comment.is_resolved && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: "#4ade80",
                    background: "rgba(74,222,128,0.1)",
                    borderRadius: "9999px",
                    padding: "0.125rem 0.5rem",
                  }}
                >
                  <Check size={10} />
                  Resolved
                </span>
              )}
            </div>
          </div>
          {/* Actions */}
          <div style={{ display: "flex", gap: "0.25rem", flexShrink: 0 }}>
            {isAuthor && !comment.is_resolved && (
              <button
                onClick={handleResolve}
                title="Mark resolved"
                style={{ padding: "0.25rem", color: "var(--color-ink-faint)", cursor: "pointer", background: "none", border: "none" }}
              >
                <Check size={14} />
              </button>
            )}
            {isAuthor && (
              <button
                onClick={() => setEditing(!editing)}
                title="Edit"
                style={{ padding: "0.25rem", color: "var(--color-ink-faint)", cursor: "pointer", background: "none", border: "none" }}
              >
                {editing ? <X size={14} /> : <Edit2 size={14} />}
              </button>
            )}
            {isAuthor && (
              <button
                onClick={handleDelete}
                title="Delete"
                style={{ padding: "0.25rem", color: "#f87171", cursor: "pointer", background: "none", border: "none" }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Body or edit form */}
        {editing ? (
          <form onSubmit={handleEdit} style={{ marginBottom: "0.5rem" }}>
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={2}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--color-line)",
                borderRadius: "0.5rem",
                padding: "0.5rem 0.625rem",
                color: "var(--color-ink)",
                fontSize: "0.8125rem",
                resize: "vertical",
                marginBottom: "0.375rem",
              }}
            />
            <Button type="submit" size="sm">Save</Button>
          </form>
        ) : (
          <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-dim)", marginBottom: "0.5rem", whiteSpace: "pre-wrap" }}>
            {comment.body}
          </p>
        )}

        {/* Reactions + Reply */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <ReactionBar comment={comment} onReact={handleReact} />
          {canComment && depth === 0 && (
            <button
              onClick={() => setReplying(!replying)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.75rem",
                color: "var(--color-ink-faint)",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Reply size={12} />
              Reply
            </button>
          )}
        </div>
      </div>

      {/* Reply form */}
      {replying && (
        <form
          action={addDispatch}
          onSubmit={() => { setReplying(false); setTimeout(onRefresh, 300); }}
          style={{ marginTop: "0.5rem", marginLeft: "1.5rem" }}
        >
          <input type="hidden" name="entityType" value={entityType} />
          <input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="entityName" value={entityName ?? ""} />
          <input type="hidden" name="parentId" value={comment.id} />
          <textarea
            name="body"
            rows={2}
            placeholder="Write a reply&#8230;"
            required
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--color-line)",
              borderRadius: "0.5rem",
              padding: "0.5rem 0.625rem",
              color: "var(--color-ink)",
              fontSize: "0.8125rem",
              resize: "vertical",
              marginBottom: "0.375rem",
            }}
          />
          {addState?.error && (
            <p style={{ fontSize: "0.75rem", color: "#f87171", marginBottom: "0.375rem" }}>{addState.error}</p>
          )}
          <div style={{ display: "flex", gap: "0.375rem" }}>
            <Button type="submit" size="sm">Post reply</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setReplying(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginTop: "0.5rem" }}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              currentUserId={currentUserId}
              canComment={false}
              entityType={entityType}
              entityId={entityId}
              entityName={entityName}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommentsPanel({
  entityType,
  entityId,
  entityName,
  currentUserId,
  currentUserName,
  canComment = true,
  initialComments = [],
}: Props) {
  const router = useRouter();
  const [addState, addDispatch] = useActionState<CommentActionState | undefined, FormData>(
    addCommentAction as any,
    undefined
  );

  function refresh() {
    router.refresh();
  }

  const rootComments = initialComments.filter((c) => !c.parent_id);

  return (
    <Card style={{ padding: "1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid var(--color-line)", borderRadius: "1rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
        <MessageSquare size={16} style={{ color: "var(--color-blue)" }} />
        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--color-ink)" }}>
          Comments ({initialComments.length})
        </span>
      </div>

      {/* New comment form */}
      {canComment && (
        <form
          action={addDispatch}
          onSubmit={() => setTimeout(refresh, 300)}
          style={{ marginBottom: "1.25rem" }}
        >
          <input type="hidden" name="entityType" value={entityType} />
          <input type="hidden" name="entityId" value={entityId} />
          <input type="hidden" name="entityName" value={entityName ?? ""} />
          <textarea
            name="body"
            rows={3}
            placeholder="Add a comment&#8230;"
            required
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--color-line)",
              borderRadius: "0.625rem",
              padding: "0.625rem 0.75rem",
              color: "var(--color-ink)",
              fontSize: "0.8125rem",
              resize: "vertical",
              marginBottom: "0.5rem",
            }}
          />
          {addState?.error && (
            <p style={{ fontSize: "0.75rem", color: "#f87171", marginBottom: "0.375rem" }}>{addState.error}</p>
          )}
          <Button type="submit" size="sm">Post comment</Button>
        </form>
      )}

      {/* Comment list */}
      {rootComments.length === 0 ? (
        <p style={{ fontSize: "0.8125rem", color: "var(--color-ink-faint)", textAlign: "center", padding: "1.5rem 0" }}>
          No comments yet. Be the first to comment.
        </p>
      ) : (
        <div>
          {rootComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              depth={0}
              currentUserId={currentUserId}
              canComment={canComment}
              entityType={entityType}
              entityId={entityId}
              entityName={entityName}
              onRefresh={refresh}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
