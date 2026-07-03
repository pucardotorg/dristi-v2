import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { exportReadyCasesForCIS } from "@/lib/cis-export";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const courtId = session.user.court_id ?? "default-court";

  const payload = await exportReadyCasesForCIS(courtId);

  return NextResponse.json(payload);
}
