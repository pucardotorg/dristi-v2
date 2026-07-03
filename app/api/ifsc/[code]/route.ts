import { NextRequest, NextResponse } from "next/server";

const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const ifsc = code.toUpperCase();

  if (!IFSC_RE.test(ifsc)) {
    return NextResponse.json(
      { error: "Invalid IFSC format. Expected 11 characters like ABCD0123456." },
      { status: 400 }
    );
  }

  try {
    const upstream = await fetch(`https://ifsc.razorpay.com/${ifsc}`, {
      next: { revalidate: 86400 }, // cache for 24h — IFSC data is static
    });

    if (upstream.status === 404) {
      return NextResponse.json({ error: "IFSC not found" }, { status: 404 });
    }

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Upstream lookup failed" },
        { status: 502 }
      );
    }

    const data = await upstream.json();

    return NextResponse.json({
      bank: data.BANK ?? "",
      branch: data.BRANCH ?? "",
      address: data.ADDRESS ?? "",
      city: data.CITY ?? "",
      state: data.STATE ?? "",
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach IFSC service" },
      { status: 502 }
    );
  }
}
