import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * GET /api/auth/seed
 *
 * Creates a demo user for testing. Hit this once after first deploy,
 * then delete this file or protect it behind an env flag.
 *
 * Credentials:
 *   email:    demo@pucar.in
 *   password: demo1234
 */
export async function GET() {
  if (process.env.ALLOW_SEED !== "true") {
    return NextResponse.json(
      { error: "Seed disabled. Set ALLOW_SEED=true to enable." },
      { status: 403 }
    );
  }

  try {
    const ctx = await auth.api.signUpEmail({
      body: {
        email: "demo@pucar.in",
        password: "demo1234",
        name: "Demo User",
        tenant_id: "kl",
        court_id: "klcourt001",
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Demo user created",
      email: "demo@pucar.in",
      password: "demo1234",
      user: ctx.user,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
