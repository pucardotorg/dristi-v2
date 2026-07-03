import { eq, and, ne, gte, sql } from "drizzle-orm";
import { db } from "./db";
import {
  caseTable,
  caseLitigant,
  caseRepresentative,
  caseDocument,
  individual,
  court,
} from "@/db/schema";

export interface StaffCaseRow {
  id: string;
  filingNumber: string;
  title: string;
  date: string;
  status: string;
  statusLabel: string;
  statusKind: "warn" | "success";
}

export interface StaffTabCounts {
  DRAFT: number;
  READY_FOR_CIS: number;
  EXPORTED_FOR_CIS: number;
  FILED_IN_CIS: number;
  CIS_FAILED: number;
}

export interface DraftCard {
  id: string;
  badge: string;
  savedAgo: string;
  title: string;
  court: string;
  progress: number;
  stepLabel: string;
}

export interface FiledCaseRow {
  id: string;
  caseNo: string;
  title: string;
  type: string;
  filedOn: string;
  status: string;
  statusKind: "warn" | "success";
  nextDate: string;
}

export interface HomeStats {
  draftCount: number;
  filedCount: number;
}

const CASE_TYPE_LABEL: Record<string, string> = {
  NI_ACT_138: "S-138, NI Act",
};

const STATUS_MAP: Record<string, { label: string; kind: "warn" | "success" }> = {
  DRAFT:            { label: "Draft",              kind: "warn" },
  READY_FOR_CIS:    { label: "Ready for CIS",      kind: "warn" },
  EXPORTED_FOR_CIS: { label: "Exported for CIS",   kind: "warn" },
  FILED_IN_CIS:     { label: "Filed in CIS",       kind: "success" },
  CIS_FAILED:       { label: "CIS Failed",         kind: "warn" },
  UNDER_SCRUTINY:   { label: "Under Scrutiny",     kind: "warn" },
  LISTED:           { label: "Listed",              kind: "success" },
  DISPOSED:         { label: "Disposed",            kind: "success" },
};

const STEP_LABELS = [
  "Complainant details",
  "Advocate details",
  "Accused details",
  "Cheque details",
  "Demand notice",
  "Jurisdiction",
  "ADR & Prayer",
  "Documents",
];

function timeAgo(epochMs: number): string {
  const diff = Date.now() - epochMs;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

function formatDate(epochMs: number): string {
  const d = new Date(epochMs);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function scoreProgress(row: {
  hasComplainant: boolean;
  hasAdvocate: boolean;
  hasAccused: boolean;
  docCount: number;
  caseDetails: unknown;
}): { progress: number; stepLabel: string } {
  const cd = (row.caseDetails ?? {}) as Record<string, unknown>;
  const cheques = cd.cheques as Record<string, unknown> | undefined;
  const demands = cd.demands as Record<string, unknown> | undefined;
  const jurisdiction = cd.jurisdiction as Record<string, unknown> | undefined;
  const adr = cd.adr as Record<string, unknown> | undefined;

  const checks = [
    row.hasComplainant,
    row.hasAdvocate,
    row.hasAccused,
    !!(cheques && Object.keys(cheques).length > 0),
    !!(demands && Object.keys(demands).length > 0),
    !!(jurisdiction && jurisdiction.court),
    !!(adr),
    row.docCount > 0,
  ];

  const passed = checks.filter(Boolean).length;
  const progress = Math.round((passed / checks.length) * 100);

  let lastLabel = "Not started";
  for (let i = checks.length - 1; i >= 0; i--) {
    if (checks[i]) { lastLabel = STEP_LABELS[i]; break; }
  }

  return { progress, stepLabel: lastLabel };
}

type CaseQueryRow = {
  id: string;
  filing_number: string | null;
  case_type: string | null;
  status: string;
  updated_at: number;
  case_details: unknown;
  court_name: string | null;
  complainant_name: string | null;
  accused_name: string | null;
  has_advocate: boolean;
  doc_count: number;
};

async function queryCases(userId: string, statusFilter: "DRAFT" | "NOT_DRAFT", limit: number): Promise<CaseQueryRow[]> {
  const twelveMonthsAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;

  // Alias the individual table for complainant and accused joins
  const complainantInd = individual;
  // We need two aliases — use raw SQL subquery approach for the two individual joins
  // since Drizzle doesn't support table aliasing in joins directly.
  // Use a simpler approach: fetch cases first, then enrich with litigant names.

  const statusCondition =
    statusFilter === "DRAFT"
      ? eq(caseTable.status, "DRAFT")
      : and(ne(caseTable.status, "DRAFT"), gte(caseTable.created_at, twelveMonthsAgo));

  const cases = await db
    .select({
      id: caseTable.id,
      filing_number: caseTable.filing_number,
      case_type: caseTable.case_type,
      status: caseTable.status,
      updated_at: caseTable.updated_at,
      case_details: caseTable.case_details,
      court_name: court.name,
    })
    .from(caseTable)
    .leftJoin(court, eq(court.id, caseTable.court_id))
    .where(
      and(
        eq(caseTable.created_by, userId),
        eq(caseTable.lifecycle_status, "ACTIVE"),
        statusCondition
      )
    )
    .orderBy(sql`${caseTable.updated_at} DESC`)
    .limit(limit);

  if (cases.length === 0) return [];

  const caseIds = cases.map((c) => c.id);

  // Fetch first complainant name per case
  const complainantRows = await db
    .select({
      case_id: caseLitigant.case_id,
      name: complainantInd.given_name,
      family_name: complainantInd.family_name,
    })
    .from(caseLitigant)
    .innerJoin(complainantInd, eq(complainantInd.id, caseLitigant.individual_id))
    .where(
      and(
        sql`${caseLitigant.case_id} = ANY(ARRAY[${sql.join(caseIds.map(id => sql`${id}`), sql`, `)}]::varchar[])`,
        eq(caseLitigant.party_type, "COMPLAINANT"),
        eq(caseLitigant.is_active, true)
      )
    );

  // Fetch first accused name per case
  const accusedRows = await db
    .select({
      case_id: caseLitigant.case_id,
      name: complainantInd.given_name,
      family_name: complainantInd.family_name,
    })
    .from(caseLitigant)
    .innerJoin(complainantInd, eq(complainantInd.id, caseLitigant.individual_id))
    .where(
      and(
        sql`${caseLitigant.case_id} = ANY(ARRAY[${sql.join(caseIds.map(id => sql`${id}`), sql`, `)}]::varchar[])`,
        eq(caseLitigant.party_type, "ACCUSED"),
        eq(caseLitigant.is_active, true)
      )
    );

  // Fetch advocate presence per case
  const repRows = await db
    .select({ case_id: caseRepresentative.case_id })
    .from(caseRepresentative)
    .where(
      and(
        sql`${caseRepresentative.case_id} = ANY(ARRAY[${sql.join(caseIds.map(id => sql`${id}`), sql`, `)}]::varchar[])`,
        eq(caseRepresentative.is_active, true)
      )
    );

  // Fetch document counts per case
  const docRows = await db
    .select({
      case_id: caseDocument.case_id,
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(caseDocument)
    .where(
      and(
        sql`${caseDocument.case_id} = ANY(ARRAY[${sql.join(caseIds.map(id => sql`${id}`), sql`, `)}]::varchar[])`,
        eq(caseDocument.is_active, true)
      )
    )
    .groupBy(caseDocument.case_id);

  // Build lookup maps
  const complainantMap = new Map<string, string>();
  for (const r of complainantRows) {
    if (!complainantMap.has(r.case_id)) {
      const full = [r.name, r.family_name].filter(Boolean).join(" ");
      complainantMap.set(r.case_id, full);
    }
  }

  const accusedMap = new Map<string, string>();
  for (const r of accusedRows) {
    if (!accusedMap.has(r.case_id)) {
      const full = [r.name, r.family_name].filter(Boolean).join(" ");
      accusedMap.set(r.case_id, full);
    }
  }

  const repSet = new Set(repRows.map((r) => r.case_id));
  const docCountMap = new Map(docRows.map((r) => [r.case_id, Number(r.count)]));

  return cases.map((c) => ({
    ...c,
    court_name: c.court_name ?? null,
    complainant_name: complainantMap.get(c.id) ?? null,
    accused_name: accusedMap.get(c.id) ?? null,
    has_advocate: repSet.has(c.id),
    doc_count: docCountMap.get(c.id) ?? 0,
  }));
}

export async function getDraftCases(userId: string, limit = 10): Promise<DraftCard[]> {
  const rows = await queryCases(userId, "DRAFT", limit);

  return rows.map((row) => {
    const title =
      row.complainant_name && row.accused_name
        ? `${row.complainant_name} vs ${row.accused_name}`
        : row.complainant_name
        ? `${row.complainant_name} vs (accused)`
        : row.filing_number ?? "Untitled draft";

    const { progress, stepLabel } = scoreProgress({
      hasComplainant: !!row.complainant_name,
      hasAdvocate: row.has_advocate,
      hasAccused: !!row.accused_name,
      docCount: row.doc_count,
      caseDetails: row.case_details,
    });

    return {
      id: row.id,
      badge: CASE_TYPE_LABEL[row.case_type ?? ""] ?? row.case_type ?? "Case",
      savedAgo: timeAgo(row.updated_at),
      title,
      court: row.court_name ?? "Court not selected",
      progress,
      stepLabel,
    };
  });
}

export async function getFiledCases(userId: string, limit = 20): Promise<FiledCaseRow[]> {
  const rows = await queryCases(userId, "NOT_DRAFT", limit);

  return rows.map((row) => {
    const title =
      row.complainant_name && row.accused_name
        ? `${row.complainant_name} vs ${row.accused_name}`
        : row.filing_number ?? "Untitled";

    const mapped = STATUS_MAP[row.status];

    return {
      id: row.id,
      caseNo: row.filing_number ?? "—",
      title,
      type: CASE_TYPE_LABEL[row.case_type ?? ""] ?? row.case_type ?? "—",
      filedOn: formatDate(row.updated_at),
      status: mapped?.label ?? row.status,
      statusKind: mapped?.kind ?? "warn",
      nextDate: "—",
    };
  });
}

export async function getCasesByStatus(
  courtId: string,
  status: string
): Promise<StaffCaseRow[]> {
  const rows = await db
    .select({
      id: caseTable.id,
      filing_number: caseTable.filing_number,
      case_type: caseTable.case_type,
      status: caseTable.status,
      updated_at: caseTable.updated_at,
    })
    .from(caseTable)
    .where(
      and(
        eq(caseTable.court_id, courtId),
        eq(caseTable.lifecycle_status, "ACTIVE"),
        eq(caseTable.case_type, "NI_ACT_138"),
        eq(caseTable.status, status)
      )
    )
    .orderBy(sql`${caseTable.updated_at} DESC`);

  if (rows.length === 0) return [];

  const caseIds = rows.map((c) => c.id);

  // Fetch first complainant name per case
  const complainantRows = await db
    .select({
      case_id: caseLitigant.case_id,
      name: individual.given_name,
      family_name: individual.family_name,
    })
    .from(caseLitigant)
    .innerJoin(individual, eq(individual.id, caseLitigant.individual_id))
    .where(
      and(
        sql`${caseLitigant.case_id} = ANY(ARRAY[${sql.join(caseIds.map(id => sql`${id}`), sql`, `)}]::varchar[])`,
        eq(caseLitigant.party_type, "COMPLAINANT"),
        eq(caseLitigant.is_active, true)
      )
    );

  // Fetch first accused name per case
  const accusedRows = await db
    .select({
      case_id: caseLitigant.case_id,
      name: individual.given_name,
      family_name: individual.family_name,
    })
    .from(caseLitigant)
    .innerJoin(individual, eq(individual.id, caseLitigant.individual_id))
    .where(
      and(
        sql`${caseLitigant.case_id} = ANY(ARRAY[${sql.join(caseIds.map(id => sql`${id}`), sql`, `)}]::varchar[])`,
        eq(caseLitigant.party_type, "ACCUSED"),
        eq(caseLitigant.is_active, true)
      )
    );

  const complainantMap = new Map<string, string>();
  for (const r of complainantRows) {
    if (!complainantMap.has(r.case_id)) {
      const full = [r.name, r.family_name].filter(Boolean).join(" ");
      complainantMap.set(r.case_id, full);
    }
  }

  const accusedMap = new Map<string, string>();
  for (const r of accusedRows) {
    if (!accusedMap.has(r.case_id)) {
      const full = [r.name, r.family_name].filter(Boolean).join(" ");
      accusedMap.set(r.case_id, full);
    }
  }

  return rows.map((row) => {
    const title =
      complainantMap.get(row.id) && accusedMap.get(row.id)
        ? `${complainantMap.get(row.id)} vs ${accusedMap.get(row.id)}`
        : complainantMap.get(row.id)
        ? `${complainantMap.get(row.id)} vs (accused)`
        : row.filing_number ?? "Untitled";

    const mapped = STATUS_MAP[row.status];
    return {
      id: row.id,
      filingNumber: row.filing_number ?? "—",
      title,
      date: formatDate(row.updated_at),
      status: row.status,
      statusLabel: mapped?.label ?? row.status,
      statusKind: mapped?.kind ?? "warn",
    };
  });
}

export async function getStaffCaseCounts(courtId: string): Promise<StaffTabCounts> {
  const statuses = ["DRAFT", "READY_FOR_CIS", "EXPORTED_FOR_CIS", "FILED_IN_CIS", "CIS_FAILED"] as const;

  const results = await Promise.all(
    statuses.map((status) =>
      db
        .select({ count: sql<number>`COUNT(*)`.as("count") })
        .from(caseTable)
        .where(
          and(
            eq(caseTable.court_id, courtId),
            eq(caseTable.lifecycle_status, "ACTIVE"),
            eq(caseTable.case_type, "NI_ACT_138"),
            eq(caseTable.status, status)
          )
        )
    )
  );

  return {
    DRAFT: Number(results[0][0]?.count ?? 0),
    READY_FOR_CIS: Number(results[1][0]?.count ?? 0),
    EXPORTED_FOR_CIS: Number(results[2][0]?.count ?? 0),
    FILED_IN_CIS: Number(results[3][0]?.count ?? 0),
    CIS_FAILED: Number(results[4][0]?.count ?? 0),
  };
}

export async function getCaseStats(userId: string): Promise<HomeStats> {
  const twelveMonthsAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;

  const [draftResult, filedResult] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(*)`.as("count") })
      .from(caseTable)
      .where(
        and(
          eq(caseTable.created_by, userId),
          eq(caseTable.status, "DRAFT"),
          eq(caseTable.lifecycle_status, "ACTIVE")
        )
      ),
    db
      .select({ count: sql<number>`COUNT(*)`.as("count") })
      .from(caseTable)
      .where(
        and(
          eq(caseTable.created_by, userId),
          ne(caseTable.status, "DRAFT"),
          eq(caseTable.lifecycle_status, "ACTIVE"),
          gte(caseTable.created_at, twelveMonthsAgo)
        )
      ),
  ]);

  return {
    draftCount: Number(draftResult[0]?.count ?? 0),
    filedCount: Number(filedResult[0]?.count ?? 0),
  };
}
