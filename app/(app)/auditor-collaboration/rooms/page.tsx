export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/auth/session";
import { findAllRooms } from "@/lib/repositories/auditor-collaboration-repo";
import Link from "next/link";
import { DoorOpen, Plus, ArrowRight } from "lucide-react";
import { AuditRoomStatusBadge } from "@/components/auditor-collaboration/auditor-ui";

const TYPE_LABEL: Record<string, string> = {
  audit: "Audit", assessment: "Assessment", due_diligence: "Due Diligence",
  review: "Review", consulting: "Consulting", custom: "Custom",
};

export default async function AuditRoomsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await requireUser();
  const params = await searchParams;
  const oid = session.org?.id ?? "";
  const rooms = await findAllRooms(oid, { status: params.status }).catch(() => []);

  const statuses = ["planning", "active", "under_review", "completed", "archived"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <DoorOpen className="h-5 w-5 text-[var(--color-blue)]" /> Audit Rooms™
          </h1>
          <p className="text-sm text-[var(--color-ink-dim)] mt-0.5">Dedicated workspaces for each audit or assessment engagement.</p>
        </div>
        <Link href="/auditor-collaboration/rooms/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Plus className="h-4 w-4" /> New Room
        </Link>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        <Link href="/auditor-collaboration/rooms"
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${!params.status ? "bg-[var(--color-blue)] text-white" : "bg-white/5 text-[var(--color-ink-dim)] hover:bg-white/10"}`}>
          All
        </Link>
        {statuses.map(s => (
          <Link key={s} href={`/auditor-collaboration/rooms?status=${s}`}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${params.status === s ? "bg-[var(--color-blue)] text-white" : "bg-white/5 text-[var(--color-ink-dim)] hover:bg-white/10"}`}>
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      {rooms.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-12 text-center">
          <DoorOpen className="mx-auto h-10 w-10 text-[var(--color-ink-faint)]" />
          <p className="mt-3 font-semibold">No audit rooms yet</p>
          <p className="mt-1 text-sm text-[var(--color-ink-dim)]">Create a room to kick off your first external engagement.</p>
          <Link href="/auditor-collaboration/rooms/new"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--color-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
            <Plus className="h-4 w-4" /> Create Audit Room
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <Link key={room.id} href={`/auditor-collaboration/rooms/${room.id}`}
              className="group rounded-xl border border-[var(--color-line)] bg-[var(--color-bg-2)] p-5 transition-colors hover:border-[var(--color-blue)]/40">
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-sm truncate flex-1">{room.name}</div>
                <AuditRoomStatusBadge status={room.status} />
              </div>

              {room.description && (
                <p className="mt-2 text-xs text-[var(--color-ink-dim)] line-clamp-2">{room.description}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--color-ink-dim)]">
                <span>{TYPE_LABEL[room.roomType] ?? room.roomType}</span>
                {room.framework && <span>· {room.framework}</span>}
                {room.startDate && <span>· From {room.startDate}</span>}
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-[var(--color-ink-dim)] mb-1">
                  <span>Progress</span><span>{room.completionPct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-[var(--color-blue)]" style={{ width: `${room.completionPct}%` }} />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end text-xs text-[var(--color-blue)] opacity-0 group-hover:opacity-100 transition-opacity">
                Open room <ArrowRight className="ml-1 h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
