"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, Upload, Download, Trash2, FileText, File, Image, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type AttachmentRow = {
  id: string;
  file_name: string;
  file_size: number | null;
  content_type: string | null;
  version: number;
  uploaded_by_name: string | null;
  description: string | null;
  created_at: Date | string;
};

interface Props {
  entityType: string;
  entityId: string;
  entityName?: string;
  attachments: AttachmentRow[];
  canUpload?: boolean;
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(val: Date | string): string {
  const d = typeof val === "string" ? new Date(val) : val;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function FileIcon({ contentType }: { contentType: string | null }) {
  if (!contentType) return <File className="w-4 h-4 text-[var(--color-ink-dim)]" />;
  if (contentType === "application/pdf") return <FileText className="w-4 h-4 text-red-400" />;
  if (contentType.startsWith("image/")) return <Image className="w-4 h-4 text-blue-400" />;
  return <File className="w-4 h-4 text-[var(--color-ink-dim)]" />;
}

export function AttachmentPanel({ entityType, entityId, entityName, attachments, canUpload = false }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleUpload(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("entityType", entityType);
      fd.append("entityId", entityId);
      const res = await fetch("/api/platform/attachments", { method: "POST", body: fd });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Upload failed");
      }
      startTransition(() => router.refresh());
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && canUpload) handleUpload(file);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/platform/attachments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      startTransition(() => router.refresh());
    } catch {
      // silently ignore — refresh will show current state
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card className="bg-white border border-[var(--color-line)] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-[var(--color-ink-dim)]" />
          <span className="text-sm font-semibold text-[var(--color-ink)]">
            Attachments ({attachments.length})
          </span>
        </div>
        {canUpload && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            {uploading ? "Uploading..." : "Upload file"}
          </Button>
        )}
      </div>

      <input ref={fileInputRef} type="file" className="hidden" onChange={onFileChange} />

      {canUpload && (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
            ${isDragging
              ? "border-[var(--color-blue)] bg-[var(--color-blue)]/10"
              : "border-[var(--color-line)] hover:border-[var(--color-blue)]/50 hover:bg-white"}
          `}
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-[var(--color-ink-dim)] text-sm">
              <div className="w-4 h-4 border-2 border-[var(--color-blue)] border-t-transparent rounded-full animate-spin" />
              Uploading...
            </div>
          ) : (
            <div className="space-y-1">
              <Upload className="w-5 h-5 text-[var(--color-ink-dim)] mx-auto" />
              <p className="text-xs text-[var(--color-ink-dim)]">
                Drag and drop a file, or <span className="text-[var(--color-blue)]">click to browse</span>
              </p>
            </div>
          )}
        </div>
      )}

      {uploadError && (
        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <X className="w-3.5 h-3.5 shrink-0" />
          {uploadError}
          <button onClick={() => setUploadError(null)} className="ml-auto">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {attachments.length === 0 ? (
        <p className="text-xs text-[var(--color-ink-dim)] text-center py-2">
          No attachments yet{entityName ? ` for ${entityName}` : ""}.
        </p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white border border-[var(--color-line)] hover:bg-[#F8F9FB] transition-colors"
            >
              <FileIcon contentType={a.content_type} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-[var(--color-ink)] truncate max-w-[180px]">
                    {a.file_name}
                  </span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#F8F9FB] text-[var(--color-ink-dim)] border border-[var(--color-line)] shrink-0">
                    v{a.version}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--color-ink-dim)]">
                  <span>{formatBytes(a.file_size)}</span>
                  <span>—</span>
                  <span>{formatDate(a.created_at)}</span>
                  {a.uploaded_by_name && (
                    <>
                      <span>—</span>
                      <span>{a.uploaded_by_name}</span>
                    </>
                  )}
                </div>
                {a.description && (
                  <p className="text-[11px] text-[var(--color-ink-dim)] mt-0.5 truncate">{a.description}</p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => window.open(`/api/platform/attachments/${a.id}/download`, "_blank")}
                  className="p-1.5 rounded-lg hover:bg-[#EEF2F7] text-[var(--color-ink-dim)] hover:text-[var(--color-ink)] transition-colors"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                {canUpload && (
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={deletingId === a.id}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--color-ink-dim)] hover:text-red-400 transition-colors disabled:opacity-40"
                    title="Delete"
                  >
                    {deletingId === a.id ? (
                      <div className="w-3.5 h-3.5 border border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
