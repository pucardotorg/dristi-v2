import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { upload, caseDocKey, getPresignedUrl } from "@/lib/storage";
import { db } from "@/lib/db";
import { filestore } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function POST(req: NextRequest) {
  // Auth check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const caseId = formData.get("caseId") as string | null;
  const docType = formData.get("docType") as string | null;
  const tenantId = formData.get("tenantId") as string | null;

  if (!file || !caseId || !docType || !tenantId) {
    return NextResponse.json(
      { error: "Missing required fields: file, caseId, docType, tenantId" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: `File type not allowed: ${file.type}. Allowed: ${[...ALLOWED_TYPES].join(", ")}` },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const key = caseDocKey(caseId, docType, file.name);
  const ts = Date.now();
  const filestoreId = crypto.randomUUID();

  // Upload to S3
  await upload({
    key,
    body: buffer,
    contentType: file.type,
    metadata: {
      caseId,
      docType,
      uploadedBy: session.user.id,
    },
  });

  // Upsert filestore row — if a file with the same case+docType combo already
  // exists (re-upload), update it instead of creating a duplicate.
  const [existing] = await db
    .select({ id: filestore.id })
    .from(filestore)
    .where(
      and(
        eq(filestore.tenant_id, tenantId),
        eq(filestore.module, `${caseId}/${docType}`)
      )
    );

  if (existing) {
    await db
      .update(filestore)
      .set({
        filename: file.name,
        content_type: file.type,
        file_source: key,
        is_deleted: false,
        updated_at: ts,
      })
      .where(eq(filestore.id, existing.id));
  } else {
    await db.insert(filestore).values({
      id: filestoreId,
      tenant_id: tenantId,
      filename: file.name,
      content_type: file.type,
      module: `${caseId}/${docType}`,
      file_source: key,
      is_deleted: false,
      created_at: ts,
      updated_at: ts,
    });
  }

  const id = existing?.id ?? filestoreId;
  const downloadUrl = await getPresignedUrl(key);

  return NextResponse.json({
    filestoreId: id,
    key,
    filename: file.name,
    contentType: file.type,
    downloadUrl,
  });
}
