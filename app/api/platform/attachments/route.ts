import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import * as attachmentService from "@/backend/src/modules/platform/attachment-service";

export async function POST(request: NextRequest) {
  try {
    const session = await requireUser();
    const orgId = session.org!.id;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const entityType = formData.get("entityType") as string;
    const entityId = formData.get("entityId") as string;
    const entityName = formData.get("entityName") as string | undefined;
    const description = formData.get("description") as string | undefined;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await attachmentService.uploadAttachment({
      orgId,
      uploadedBy: session.id,
      fileBuffer: buffer,
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size,
      entityType,
      entityId,
      entityName: entityName ?? undefined,
      description: description ?? undefined,
    });

    return NextResponse.json({ id: result.id, storagePath: result.storagePath });
  } catch (error) {
    console.error("Attachment upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
