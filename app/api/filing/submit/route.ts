import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { filingSubmitSchema } from "@/lib/filing-validation";
import { saveFiling, type SaveFilingPayload } from "@/lib/filing-service";
import type { FilingData } from "@/src/types";

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = filingSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.issues }, { status: 422 });
  }

  const payload: SaveFilingPayload = {
    filingId: parsed.data.filingId,
    tenantId: parsed.data.tenantId,
    courtId: parsed.data.courtId,
    userId: session.user.id,
    data: parsed.data.data as unknown as FilingData,
  };

  try {
    const result = await saveFiling(payload, false);
    return NextResponse.json({
      filingId: result.caseId,
      filingNumber: result.filingNumber,
      status: "READY_FOR_CIS",
    });
  } catch (err) {
    console.error("[submit]", err);
    return NextResponse.json({ error: "Failed to submit filing" }, { status: 500 });
  }
}
