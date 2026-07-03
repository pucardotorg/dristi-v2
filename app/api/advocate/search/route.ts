import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { advocate } from "@/db/schema/advocate";
import { individual } from "@/db/schema/individual";
import { eq, ilike, or, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const tenantId = searchParams.get("tenantId") ?? "kl";

  if (!q || q.length < 2) {
    return NextResponse.json({ advocates: [] });
  }

  const pattern = `%${q}%`;

  const rows = await db
    .select({
      barNumber: advocate.bar_registration_number,
      name: individual.given_name,
      mobile: individual.mobile_number,
      status: advocate.status,
    })
    .from(advocate)
    .innerJoin(individual, eq(advocate.individual_id, individual.id))
    .where(
      and(
        eq(advocate.tenant_id, tenantId),
        eq(advocate.status, "ACTIVE"),
        or(
          ilike(advocate.bar_registration_number, pattern),
          ilike(individual.given_name, pattern)
        )
      )
    )
    .limit(10);

  return NextResponse.json({ advocates: rows });
}
