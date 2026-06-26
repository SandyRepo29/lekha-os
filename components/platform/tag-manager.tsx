"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TagRow } from "@/lib/services/platform/tag-service";
import {
  tagEntityAction,
  untagEntityAction,
  findOrCreateTagAction,
} from "@/lib/platform/tag-actions";

interface Props {
  entityType: string;
  entityId: string;
  orgTags: TagRow[];
  entityTags: TagRow[];
  canEdit?: boolean;
}

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b",
  "#10b981", "#3b82f6", "#ef4444", "#64748b",
];

export function TagManager({ entityType, entityId, orgTags, entityTags, canEdit }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [busy, setBusy] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setSearch("");
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const entityTagIds = new Set(entityTags.map((t) => t.id));
  const available = orgTags.filter(
    (t) => !entityTagIds.has(t.id) && t.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd(tagId: string) {
    setBusy(tagId);
    await tagEntityAction(tagId, entityType, entityId);
    router.refresh();
    setBusy(null);
  }

  async function handleRemove(tagId: string) {
    setBusy(tagId);
    await untagEntityAction(tagId, entityType, entityId);
    router.refresh();
    setBusy(null);
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setBusy("create");
    const tag = await findOrCreateTagAction(newName.trim(), newColor);
    if (tag?.id) await tagEntityAction(tag.id, entityType, entityId);
    router.refresh();
    setNewName("");
    setNewColor(PRESET_COLORS[0]);
    setCreating(false);
    setOpen(false);
    setBusy(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 relative">
      {entityTags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{ backgroundColor: `${tag.color}22`, color: tag.color, border: `1px solid ${tag.color}44` }}
        >
          {tag.name}
          {canEdit && (
            <button
              onClick={() => handleRemove(tag.id)}
              disabled={busy === tag.id}
              className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity leading-none"
              aria-label={`Remove tag ${tag.name}`}
            >
              &#215;
            </button>
          )}
        </span>
      ))}

      {canEdit && (
        <div ref={popoverRef} className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-xs font-medium transition-colors"
            style={{
              borderColor: "var(--color-line)",
              color: "var(--color-ink-dim)",
            }}
          >
            &#43; Add tag
          </button>

          {open && (
            <div
              className="absolute left-0 top-8 z-50 w-56 rounded-xl border p-2 shadow-xl"
              style={{
                background: "var(--color-surface)",
                borderColor: "var(--color-line)",
              }}
            >
              {!creating ? (
                <>
                  <input
                    autoFocus
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tags&#8230;"
                    className="mb-2 w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                    style={{
                      background: "var(--color-bg)",
                      borderColor: "var(--color-line)",
                      color: "var(--color-ink)",
                    }}
                  />
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {available.length === 0 && (
                      <p className="text-xs w-full text-center py-2" style={{ color: "var(--color-ink-dim)" }}>
                        No tags found
                      </p>
                    )}
                    {available.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => { handleAdd(tag.id); setOpen(false); setSearch(""); }}
                        disabled={busy === tag.id}
                        className="rounded-full px-2.5 py-0.5 text-xs font-medium transition-opacity hover:opacity-80"
                        style={{ backgroundColor: `${tag.color}22`, color: tag.color, border: `1px solid ${tag.color}44` }}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCreating(true)}
                    className="mt-2 w-full rounded-lg py-1.5 text-xs font-medium transition-colors hover:bg-white/[0.06]"
                    style={{ color: "var(--color-ink-dim)" }}
                  >
                    &#43; Create new tag
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <input
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Tag name"
                    className="w-full rounded-lg border px-2.5 py-1.5 text-xs outline-none"
                    style={{
                      background: "var(--color-bg)",
                      borderColor: "var(--color-line)",
                      color: "var(--color-ink)",
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setNewColor(c)}
                        className="h-5 w-5 rounded-full transition-transform hover:scale-110"
                        style={{
                          backgroundColor: c,
                          outline: newColor === c ? `2px solid ${c}` : "none",
                          outlineOffset: "2px",
                        }}
                        aria-label={`Color ${c}`}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleCreate}
                      disabled={!newName.trim() || busy === "create"}
                      className="flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                      style={{ background: "var(--color-blue)", color: "#fff" }}
                    >
                      {busy === "create" ? "Creating&#8230;" : "Create"}
                    </button>
                    <button
                      onClick={() => setCreating(false)}
                      className="flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors hover:bg-white/[0.06]"
                      style={{ color: "var(--color-ink-dim)" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
