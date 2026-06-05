import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  vendors,
  vendorDocuments,
  assessments,
  auditLogs,
  memberships,
  profiles,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v).replace(/"/g, '""');
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

async function buildZip(parts: { name: string; content: string }[]): Promise<Buffer> {
  // Minimal ZIP builder — no compression, just stored entries.
  const enc = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const centralDir: { name: Uint8Array; offset: number; size: number }[] = [];

  for (const { name, content } of parts) {
    const nameBytes = enc.encode(name);
    const dataBytes = enc.encode(content);
    const offset = chunks.reduce((s, c) => s + c.length, 0);

    // Local file header
    const header = new DataView(new ArrayBuffer(30 + nameBytes.length));
    header.setUint32(0, 0x04034b50, true);   // signature
    header.setUint16(4, 20, true);            // version needed
    header.setUint16(6, 0, true);             // flags
    header.setUint16(8, 0, true);             // compression (stored)
    header.setUint16(10, 0, true);            // mod time
    header.setUint16(12, 0, true);            // mod date
    header.setUint32(14, 0, true);            // crc-32 (omitted)
    header.setUint32(18, dataBytes.length, true); // compressed size
    header.setUint32(22, dataBytes.length, true); // uncompressed size
    header.setUint16(26, nameBytes.length, true); // name length
    header.setUint16(28, 0, true);            // extra length
    new Uint8Array(header.buffer).set(nameBytes, 30);
    chunks.push(new Uint8Array(header.buffer));
    chunks.push(dataBytes);

    centralDir.push({ name: nameBytes, offset, size: dataBytes.length });
  }

  const cdOffset = chunks.reduce((s, c) => s + c.length, 0);
  let cdSize = 0;

  for (const { name, offset, size } of centralDir) {
    const cd = new DataView(new ArrayBuffer(46 + name.length));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0, true);
    cd.setUint16(10, 0, true);
    cd.setUint16(12, 0, true);
    cd.setUint16(14, 0, true);
    cd.setUint32(16, 0, true);
    cd.setUint32(20, size, true);
    cd.setUint32(24, size, true);
    cd.setUint16(28, name.length, true);
    cd.setUint16(30, 0, true);
    cd.setUint16(32, 0, true);
    cd.setUint16(34, 0, true);
    cd.setUint16(36, 0, true);
    cd.setUint32(38, 0, true);
    cd.setUint32(42, offset, true);
    new Uint8Array(cd.buffer).set(name, 46);
    chunks.push(new Uint8Array(cd.buffer));
    cdSize += cd.buffer.byteLength;
  }

  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(4, 0, true);
  eocd.setUint16(6, 0, true);
  eocd.setUint16(8, centralDir.length, true);
  eocd.setUint16(10, centralDir.length, true);
  eocd.setUint32(12, cdSize, true);
  eocd.setUint32(16, cdOffset, true);
  eocd.setUint16(20, 0, true);
  chunks.push(new Uint8Array(eocd.buffer));

  const total = chunks.reduce((s, c) => s + c.length, 0);
  const out = new Uint8Array(total);
  let pos = 0;
  for (const c of chunks) { out.set(c, pos); pos += c.length; }
  return Buffer.from(out);
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await requireUser();
  if (!session.org) {
    return NextResponse.json({ error: "No organization." }, { status: 403 });
  }
  const orgId = session.org.id;

  const [vendorRows, docRows, assessRows, memberRows, auditRows] = await Promise.all([
    db.select().from(vendors).where(eq(vendors.organizationId, orgId)),
    db.select({
      id: vendorDocuments.id,
      vendorId: vendorDocuments.vendorId,
      documentType: vendorDocuments.documentType,
      filename: vendorDocuments.filename,
      contentType: vendorDocuments.contentType,
      fileSize: vendorDocuments.fileSize,
      storageBucket: vendorDocuments.storageBucket,
      status: vendorDocuments.status,
      category: vendorDocuments.category,
      issuedOn: vendorDocuments.issuedOn,
      expiresOn: vendorDocuments.expiresOn,
      createdAt: vendorDocuments.createdAt,
    }).from(vendorDocuments).where(eq(vendorDocuments.organizationId, orgId)),
    db.select({
      id: assessments.id,
      vendorId: assessments.vendorId,
      title: assessments.title,
      score: assessments.score,
      status: assessments.status,
      completedAt: assessments.completedAt,
    }).from(assessments).where(eq(assessments.organizationId, orgId)),
    db.select({
      userId: memberships.userId,
      role: memberships.role,
      department: memberships.department,
      isActive: memberships.isActive,
      createdAt: memberships.createdAt,
    }).from(memberships).where(eq(memberships.organizationId, orgId)),
    db.select({
      id: auditLogs.id,
      actorId: auditLogs.actorId,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      createdAt: auditLogs.createdAt,
    }).from(auditLogs).where(eq(auditLogs.organizationId, orgId)),
  ]);

  const zip = await buildZip([
    { name: "vendors.csv", content: toCsv(vendorRows as Record<string, unknown>[]) },
    { name: "documents_metadata.csv", content: toCsv(docRows as Record<string, unknown>[]) },
    { name: "assessments.csv", content: toCsv(assessRows as Record<string, unknown>[]) },
    { name: "team_members.csv", content: toCsv(memberRows as Record<string, unknown>[]) },
    { name: "audit_logs.csv", content: toCsv(auditRows as Record<string, unknown>[]) },
    {
      name: "README.txt",
      content: [
        `Lekha OS — Tenant Data Export`,
        `Organisation: ${session.org.name}`,
        `Exported at: ${new Date().toISOString()}`,
        ``,
        `Files in this archive:`,
        `  vendors.csv              — All vendor records`,
        `  documents_metadata.csv  — Document metadata (no file content)`,
        `  assessments.csv         — Security assessment records`,
        `  team_members.csv        — Team membership records`,
        `  audit_logs.csv          — Audit event history`,
        ``,
        `Note: Actual document files are not included in Phase 1 export.`,
        `Contact support to request a full document archive.`,
      ].join("\n"),
    },
  ]);

  return new NextResponse(new Uint8Array(zip), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="tenant_data_export.zip"`,
      "Content-Length": String(zip.length),
    },
  });
}
