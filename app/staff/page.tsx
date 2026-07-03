import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getCasesByStatus, getStaffCaseCounts } from "@/lib/cases-query";
import { StaffDashboard } from "@/src/components/staff/staff-dashboard";

const STATUSES = [
  { key: "DRAFT", label: "Drafts" },
  { key: "READY_FOR_CIS", label: "Ready for CIS" },
  { key: "EXPORTED_FOR_CIS", label: "Exported" },
  { key: "FILED_IN_CIS", label: "Filed in CIS" },
  { key: "CIS_FAILED", label: "CIS Failed" },
] as const;

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: activeStatus } = await searchParams;
  const currentStatus = activeStatus ?? "READY_FOR_CIS";

  const session = await auth.api.getSession({ headers: await headers() });
  const courtId = session!.user.court_id ?? "default-court";

  const [cases, counts] = await Promise.all([
    getCasesByStatus(courtId, currentStatus),
    getStaffCaseCounts(courtId),
  ]);

  return (
    <StaffDashboard
      cases={cases}
      counts={counts}
      activeStatus={currentStatus}
      statuses={STATUSES.map((s) => s)}
    />
  );
}
