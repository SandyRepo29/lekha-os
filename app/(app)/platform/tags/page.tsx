export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getOrgTags } from "@/backend/src/modules/platform/tag-service";
import {
  createTagAction,
  updateTagAction,
  deleteTagAction,
} from "@/backend/src/modules/platform/tag-actions";
import { isAdminOrOwner } from "@/lib/ui/role-guard";
import { Card } from "@/components/ui/card";
import { Tag, Plus, Trash2, Edit2 } from "lucide-react";

const PRESET_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#64748b",
];

export default async function TagsPage() {
  const session = await requireUser();

  const tags = session.org ? await getOrgTags(session.org.id) : [];
  const canManage = !!session.org && isAdminOrOwner(session.org.role);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boundCreate = createTagAction.bind(null, undefined) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boundUpdate = updateTagAction.bind(null, undefined) as any;

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-ink-dim)]">
        <span>Platform</span>
        <span>/</span>
        <span className="text-[var(--color-ink)]">Tags</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-[#F8F9FB] p-2">
          <Tag className="h-5 w-5 text-[var(--color-blue)]" />
        </div>
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--color-ink)]">
            Tag Library
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)]">
            Create and manage tags to categorize entities across all modules.
          </p>
        </div>
      </div>

      {/* Create tag form — admin/owner only */}
      {canManage && (
        <Card className="rounded-2xl border border-[var(--color-line)] bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-[var(--color-line)]">
            <Plus className="h-4 w-4 text-[var(--color-blue)]" />
            <span className="text-sm font-semibold text-[var(--color-ink)]">
              New Tag
            </span>
          </div>
          <form action={boundCreate} className="px-5 py-4 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Name */}
              <div className="space-y-1.5">
                <label
                  htmlFor="name"
                  className="block text-xs font-medium text-[var(--color-ink-dim)]"
                >
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  maxLength={50}
                  placeholder="e.g. Critical, SOC 2, Vendor A"
                  className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label
                  htmlFor="description"
                  className="block text-xs font-medium text-[var(--color-ink-dim)]"
                >
                  Description
                </label>
                <input
                  id="description"
                  name="description"
                  type="text"
                  maxLength={200}
                  placeholder="Optional description"
                  className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-dim)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]"
                />
              </div>
            </div>

            {/* Color picker */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-[var(--color-ink-dim)]">Color</p>
              <div className="flex items-center gap-2 flex-wrap">
                {PRESET_COLORS.map((hex) => (
                  <label key={hex} className="cursor-pointer">
                    <input
                      type="radio"
                      name="color"
                      value={hex}
                      defaultChecked={hex === PRESET_COLORS[0]}
                      className="sr-only peer"
                    />
                    <span
                      className="block h-7 w-7 rounded-full ring-2 ring-transparent peer-checked:ring-white peer-checked:ring-offset-2 peer-checked:ring-offset-[var(--color-canvas)] transition-all"
                      style={{ backgroundColor: hex }}
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--color-blue)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                <Plus className="h-4 w-4" />
                Create Tag
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Tags grid */}
      {tags.length === 0 ? (
        <Card className="rounded-2xl border border-[var(--color-line)] bg-white p-12 text-center">
          <Tag className="h-8 w-8 text-[var(--color-ink-dim)] mx-auto mb-3" />
          <p className="text-sm font-medium text-[var(--color-ink)]">No tags yet</p>
          <p className="text-xs text-[var(--color-ink-dim)] mt-1">
            {canManage
              ? "Use the form above to create your first tag."
              : "No tags have been created for this organisation."}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <Card
              key={tag.id}
              className="rounded-2xl border border-[var(--color-line)] bg-white overflow-hidden"
            >
              {/* Tag header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-line)]">
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: tag.color ?? "#6366f1" }}
                >
                  <Tag className="h-3 w-3" />
                  {tag.name}
                </span>
                {canManage && (
                  <div className="flex items-center gap-1">
                    {/* Delete form */}
                    <form
                      action={async () => {
                        "use server";
                        await deleteTagAction(tag.id);
                      }}
                    >
                      <button
                        type="submit"
                        title="Delete tag"
                        className="rounded-lg p-1.5 text-[var(--color-ink-dim)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Tag body */}
              <div className="px-4 py-3 space-y-2">
                {tag.description && (
                  <p className="text-xs text-[var(--color-ink-dim)] leading-relaxed">
                    {tag.description}
                  </p>
                )}
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: tag.color ?? "#6366f1" }}
                  />
                  <span className="text-[11px] font-mono text-[var(--color-ink-dim)]">
                    {tag.color ?? "#6366f1"}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--color-ink-dim)]">
                  Created {new Date(tag.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>

              {/* Inline edit form — admin/owner only */}
              {canManage && (
                <details className="group">
                  <summary className="flex cursor-pointer items-center gap-1.5 px-4 py-2 border-t border-[var(--color-line)] text-xs text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors list-none">
                    <Edit2 className="h-3 w-3" />
                    Edit
                  </summary>
                  <form
                    action={boundUpdate}
                    className="px-4 py-3 border-t border-[var(--color-line)] space-y-3 bg-white"
                  >
                    <input type="hidden" name="tagId" value={tag.id} />

                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-[var(--color-ink-dim)]">
                        Name
                      </label>
                      <input
                        name="name"
                        type="text"
                        defaultValue={tag.name}
                        maxLength={50}
                        className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-1.5 text-xs text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-medium text-[var(--color-ink-dim)]">
                        Description
                      </label>
                      <input
                        name="description"
                        type="text"
                        defaultValue={tag.description ?? ""}
                        maxLength={200}
                        className="w-full rounded-xl border border-[var(--color-line)] bg-[#F8F9FB] px-3 py-1.5 text-xs text-[var(--color-ink)] focus:outline-none focus:ring-1 focus:ring-[var(--color-blue)]"
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-[11px] font-medium text-[var(--color-ink-dim)]">Color</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {PRESET_COLORS.map((hex) => (
                          <label key={hex} className="cursor-pointer">
                            <input
                              type="radio"
                              name="color"
                              value={hex}
                              defaultChecked={hex === (tag.color ?? PRESET_COLORS[0])}
                              className="sr-only peer"
                            />
                            <span
                              className="block h-5 w-5 rounded-full ring-2 ring-transparent peer-checked:ring-white peer-checked:ring-offset-1 peer-checked:ring-offset-[var(--color-canvas)] transition-all"
                              style={{ backgroundColor: hex }}
                            />
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-xl bg-[#F8F9FB] border border-[var(--color-line)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink)] hover:bg-[#EEF2F7] transition-colors"
                      >
                        Save changes
                      </button>
                    </div>
                  </form>
                </details>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
