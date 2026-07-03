import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getFilingById, FilingNotFoundError } from "@/lib/filing-service";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  console.log("[cases/[id]] GET", { id, userId: session.user.id });

  try {
    const result = await getFilingById(id, session.user.id);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof FilingNotFoundError) {
      return NextResponse.json({ error: "Draft not found." }, { status: 404 });
    }
    console.error("[cases/[id]]", err);
    return NextResponse.json({ error: "Failed to load draft" }, { status: 500 });
  }
}
