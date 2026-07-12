export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { getRoomDetail } from "@/lib/services/auditor-collaboration/auditor-collaboration-service";
import { updateRoomAction, createEvidenceRequestAction, createExternalFindingAction } from "@/lib/auditor-collaboration/actions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileCheck, AlertTriangle, ClipboardList, Activity, FileText, CheckCircle2, Clock } from "lucide-react";
import { revalidatePath } from "next/cache";

const STATUS_BADGE: Record<string, string> = {
  planning: "bg-slate-100 text-slate-600", active: "bg-emerald-100 text-emerald-700",
  under_review: "bg-yellow-100 text-yellow-700", completed: "bg-blue-100 text-blue-700",
  archived: "bg-slate-600/20 text-slate-500", cancelled: "bg-red-100 text-red-700",
};
const SEV_COLORS: Record<string, string> = {
  low: "text-emerald-700", medium: "text-yellow-700", high: "text-orange-700", critical: "text-red-700",
};
const REQ_STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700", submitted: "bg-blue-100 text-blue-700",
  under_review: "bg-purple-100 text-purple-700", accepted: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700", expired: "bg-slate-100 text-slate-600",
};

export default async function AuditRoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;
  const oid = session.org?.id ?? "";

  const detail = await getRoomDetail(oid, id).catch(() => null);
  if (!detail) notFound();
  const { room, documents, activities, evidenceReqs, findings, assessments } = detail;

  const statusOptions = ["planning", "active", "under_review", "completed", "archived", "cancelled"];

  async function updateStatus(fd: FormData) {
    "use server";
    await updateRoomAction(id, { status: fd.get("status") as string });
    revalidatePath(`/auditor-collaboration/rooms/${id}`);
  }

  async function addEvidenceRequest(fd: FormData) {
    "use server";
    const data: Record<string, unknown> = {};
    for (const [k, v] of fd.entries()) { if (v) data[k] = v; }
    await createEvidenceRequestAction(id, data);
    revalidatePath(`/auditor-collaboration/rooms/${id}`);
  }

  async function addFinding(fd: FormData) {
    "use server";
    const data: Record<string, unknown> = {};
    for (const [k, v] of fd.entries()) { if (v) data[k] = v; }
    await createExternalFindingAction(id, data);
    revalidatePath(`/auditor-collaboration/rooms/${id}`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/auditor-collaboration/rooms" className="mt-1 rounded-lg p-1.5 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold truncate">{room.name}</h1>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[room.status] ?? ""}`}>
              {room.status.replace("_", " ")}
            </span>
          </div>
          {room.description && <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">{room.description}</p>}
          <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-[var(--color-ink-dim)]">
            {room.framework && <span>{room.framework}</span>}
            {room.scope && <span>· {room.scope}</span>}
            {room.startDate && <span>· {room.startDate} → {room.endDate ?? "TBD"}</span>}
          </div>
        </div>

        {/* Status change */}
        <form action={updateStatus} className="shrink-0">
          <select name="status" defaultValue={room.status} onChange={() => {}}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-3 py-1.5 text-xs focus:border-[var(--color-blue)] focus:outline-none">
            {statusOptions.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
          <button type="submit" className="ml-2 rounded-lg bg-[var(--color-blue)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
            Update
          </button>
        </form>
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium">Overall Progress</span>
          <span className="font-bold text-[var(--color-blue)]">{room.completionPct}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[var(--color-blue)] transition-all" style={{ width: `${room.completionPct}%` }} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center text-xs">
          <div>
            <div className="text-lg font-bold text-yellow-700">{evidenceReqs.filter(r => r.status === "pending").length}</div>
            <div className="text-[var(--color-ink-dim)]">Pending Evidence</div>
          </div>
          <div>
            <div className="text-lg font-bold text-orange-700">{findings.filter(f => f.status === "open").length}</div>
            <div className="text-[var(--color-ink-dim)]">Open Findings</div>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-700">{documents.length}</div>
            <div className="text-[var(--color-ink-dim)]">Documents</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Evidence Requests */}
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <FileCheck className="h-4 w-4 text-[var(--color-blue)]" /> Evidence Requests ({evidenceReqs.length})
          </h2>

          {/* Add request form */}
          <form action={addEvidenceRequest} className="flex gap-2">
            <input name="title" required placeholder="Request title..." className="flex-1 rounded-lg border border-[var(--color-line)] bg-slate-100 px-3 py-1.5 text-xs focus:border-[var(--color-blue)] focus:outline-none" />
            <select name="priority" className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-2 py-1.5 text-xs focus:border-[var(--color-blue)] focus:outline-none">
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
              <option value="low">Low</option>
            </select>
            <button type="submit" className="rounded-lg bg-[var(--color-blue)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">Add</button>
          </form>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {evidenceReqs.length === 0 ? (
              <p className="text-xs text-[var(--color-ink-dim)]">No evidence requests yet.</p>
            ) : evidenceReqs.map(r => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-[var(--color-line)] p-2.5">
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{r.title}</div>
                  {r.dueDate && <div className="text-[10px] text-[var(--color-ink-dim)]">Due {r.dueDate}</div>}
                </div>
                <span className={`ml-2 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${REQ_STATUS_BADGE[r.status] ?? ""}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Findings */}
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5 space-y-4">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-orange-700" /> Findings ({findings.length})
          </h2>

          <form action={addFinding} className="flex gap-2">
            <input name="title" required placeholder="Finding title..." className="flex-1 rounded-lg border border-[var(--color-line)] bg-slate-100 px-3 py-1.5 text-xs focus:border-[var(--color-blue)] focus:outline-none" />
            <select name="severity" className="rounded-lg border border-[var(--color-line)] bg-[var(--color-bg-2)] px-2 py-1.5 text-xs focus:border-[var(--color-blue)] focus:outline-none">
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
              <option value="low">Low</option>
            </select>
            <button type="submit" className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">Add</button>
          </form>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {findings.length === 0 ? (
              <p className="text-xs text-[var(--color-ink-dim)]">No findings raised yet.</p>
            ) : findings.map(f => (
              <div key={f.id} className="flex items-center justify-between rounded-lg border border-[var(--color-line)] p-2.5">
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{f.title}</div>
                  <div className="text-[10px] text-[var(--color-ink-dim)]">{f.findingType?.replace("_", " ")} · {f.status.replace("_", " ")}</div>
                </div>
                <span className={`ml-2 shrink-0 text-xs font-semibold ${SEV_COLORS[f.severity] ?? ""}`}>{f.severity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assessments */}
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <ClipboardList className="h-4 w-4 text-sky-700" /> Assessments ({assessments.length})
          </h2>
          {assessments.length === 0 ? (
            <p className="text-xs text-[var(--color-ink-dim)]">No assessments in this room yet.</p>
          ) : assessments.map(a => (
            <div key={a.id} className="rounded-lg border border-[var(--color-line)] p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium">{a.name}</div>
                <span className="text-xs text-[var(--color-ink-dim)]">{a.completionPct}%</span>
              </div>
              <div className="mt-1.5 h-1 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-sky-500" style={{ width: `${a.completionPct}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Activity Timeline */}
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5 space-y-3">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <Activity className="h-4 w-4 text-purple-700" /> Activity
          </h2>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {activities.length === 0 ? (
              <p className="text-xs text-[var(--color-ink-dim)]">No activity yet.</p>
            ) : activities.map(a => (
              <div key={a.id} className="flex items-start gap-2 text-xs">
                <Clock className="h-3 w-3 mt-0.5 shrink-0 text-[var(--color-ink-faint)]" />
                <div>
                  <span>{a.description}</span>
                  <span className="ml-1 text-[var(--color-ink-faint)]">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Documents */}
      {documents.length > 0 && (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5">
          <h2 className="font-semibold flex items-center gap-2 text-sm mb-3">
            <FileText className="h-4 w-4 text-[var(--color-blue)]" /> Shared Documents ({documents.length})
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center gap-2 rounded-lg border border-[var(--color-line)] p-3">
                <FileText className="h-4 w-4 shrink-0 text-[var(--color-ink-dim)]" />
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{doc.documentName}</div>
                  <div className="text-[10px] text-[var(--color-ink-dim)]">{doc.documentType}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
