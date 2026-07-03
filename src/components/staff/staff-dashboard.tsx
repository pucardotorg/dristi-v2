"use client";

import Link from "next/link";
import type { StaffCaseRow, StaffTabCounts } from "@/lib/cases-query";
import { ExportButton } from "@/src/components/staff/export-button";
import { ImportForm } from "@/src/components/staff/import-form";

interface StatusDef {
  key: string;
  label: string;
}

interface Props {
  cases: StaffCaseRow[];
  counts: StaffTabCounts;
  activeStatus: string;
  statuses: StatusDef[];
}

export function StaffDashboard({ cases, counts, activeStatus, statuses }: Props) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto px-10 py-8">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-6">
          Staff Dashboard
        </h1>

        {/* Action bar */}
        <div className="flex items-center justify-between mb-6">
          <ExportButton />
          <ImportForm />
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 mb-6">
          {statuses.map((s) => {
            const count = counts[s.key as keyof StaffTabCounts] ?? 0;
            const isActive = s.key === activeStatus;
            return (
              <Link
                key={s.key}
                href={`/staff?status=${s.key}`}
                className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  isActive
                    ? "border-teal text-teal"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                {s.label}
                <span
                  className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium ${
                    isActive
                      ? "bg-teal text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Data table */}
        {cases.length === 0 ? (
          <div className="text-center py-16 text-sm text-slate-400 dark:text-slate-500">
            No cases in this status.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <th className="pb-3 font-medium">Filing No</th>
                  <th className="pb-3 font-medium">Title</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {cases.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-3 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {c.filingNumber}
                    </td>
                    <td className="py-3 text-slate-800 dark:text-slate-200">
                      {c.title}
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">
                      {c.date}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.statusKind === "success"
                            ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {c.statusLabel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
