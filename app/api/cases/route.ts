import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDraftCases, getFiledCases } from "@/lib/cases-query";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") ?? "0", 10);

  if (status === "draft") {
    const cases = await getDraftCases(session.user.id, limit || 10);
    return NextResponse.json({ cases, total: cases.length });
  }

  if (status === "filed") {
    const cases = await getFiledCases(session.user.id, limit || 20);
    return NextResponse.json({ cases, total: cases.length });
  }

  return NextResponse.json({ error: "status param must be 'draft' or 'filed'" }, { status: 400 });
}
