import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { saveFiling, type SaveFilingPayload } from "@/lib/filing-service";
import type { FilingData } from "@/src/types";

const bodySchema = z.object({
  filingId: z.string().optional(),
  tenantId: z.string().min(1),
  courtId: z.string().min(1),
  data: z.record(z.string(), z.unknown()),
});

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.issues }, { status: 400 });
  }

  const payload: SaveFilingPayload = {
    filingId: parsed.data.filingId,
    tenantId: parsed.data.tenantId,
    courtId: parsed.data.courtId,
    userId: session.user.id,
    data: parsed.data.data as unknown as FilingData,
  };

  try {
    const result = await saveFiling(payload, true);
    return NextResponse.json({ filingId: result.caseId, filingNumber: result.filingNumber, status: "DRAFT" });
  } catch (err) {
    console.error("[save-draft]", err);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }
}
