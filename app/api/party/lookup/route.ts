import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { individual, address } from "@/db/schema/individual";
import { eq, and } from "drizzle-orm";

function calcAge(dob: string | null): string | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  const age = today.getFullYear() - birth.getFullYear();
  const hadBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  return String(hadBirthday ? age : age - 1);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get("phone")?.trim();
  const tenantId = searchParams.get("tenantId") ?? "kl";

  if (!phone || phone.length < 10) {
    return NextResponse.json({ found: false });
  }

  const rows = await db
    .select({
      given_name: individual.given_name,
      family_name: individual.family_name,
      date_of_birth: individual.date_of_birth,
      email: individual.email,
      address_line: address.address_line,
      pincode: address.pincode,
      district: address.district,
      state: address.state,
      country: address.country,
    })
    .from(individual)
    .leftJoin(address, eq(address.individual_id, individual.id))
    .where(
      and(eq(individual.mobile_number, phone), eq(individual.tenant_id, tenantId))
    )
    .limit(10);

  if (rows.length === 0) {
    return NextResponse.json({ found: false });
  }

  const first = rows[0];
  const name = [first.given_name, first.family_name].filter(Boolean).join(" ");
  const age = calcAge(first.date_of_birth);

  const addresses = rows
    .filter((r) => r.address_line || r.pincode || r.district)
    .map((r) => ({
      address: r.address_line ?? "",
      pincode: r.pincode ?? "",
      district: r.district ?? "",
      state: r.state ?? "",
      country: r.country ?? "India",
    }));

  return NextResponse.json({
    found: true,
    name,
    age,
    email: first.email ?? null,
    addresses,
  });
}
