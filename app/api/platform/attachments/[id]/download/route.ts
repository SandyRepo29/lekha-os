import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import * as attachmentService from "@/lib/services/platform/attachment-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireUser();
    const orgId = session.org!.id;
    const { id } = await params;

    const url = await attachmentService.getAttachmentDownloadUrl(orgId, id);

    if (!url) {
      return NextResponse.json({ error: "Attachment not found" }, { status: 404 });
    }

    return NextResponse.redirect(url);
  } catch (error) {
    console.error("Attachment download error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Download failed" },
      { status: 500 }
    );
  }
}
