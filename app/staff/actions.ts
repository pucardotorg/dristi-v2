"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getCasesByStatus, getStaffCaseCounts } from "@/lib/cases-query";

export async function getStaffData(status: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");

  const courtId = session.user.court_id ?? "default-court";

  const [cases, counts] = await Promise.all([
    getCasesByStatus(courtId, status),
    getStaffCaseCounts(courtId),
  ]);

  return { cases, counts };
}
