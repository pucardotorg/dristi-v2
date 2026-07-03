import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { filestore } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getPresignedUrl, remove } from "@/lib/storage";

// GET /api/upload/:filestoreId — get a fresh presigned download URL
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filestoreId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filestoreId } = await params;

  const [row] = await db
    .select({ file_source: filestore.file_source, filename: filestore.filename, content_type: filestore.content_type })
    .from(filestore)
    .where(eq(filestore.id, filestoreId));

  if (!row || !row.file_source) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const downloadUrl = await getPresignedUrl(row.file_source);

  return NextResponse.json({
    filestoreId,
    filename: row.filename,
    contentType: row.content_type,
    downloadUrl,
  });
}

// DELETE /api/upload/:filestoreId — soft-delete file
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ filestoreId: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { filestoreId } = await params;

  const [row] = await db
    .select({ file_source: filestore.file_source })
    .from(filestore)
    .where(eq(filestore.id, filestoreId));

  if (!row || !row.file_source) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Delete from S3
  await remove(row.file_source);

  // Soft-delete in DB
  await db
    .update(filestore)
    .set({ is_deleted: true, updated_at: Date.now() })
    .where(eq(filestore.id, filestoreId));

  return NextResponse.json({ ok: true });
}
