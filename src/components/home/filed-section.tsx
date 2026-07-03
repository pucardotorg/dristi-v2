import Link from "next/link";
import { ExternalLink, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FiledCaseRow } from "@/lib/cases-query";

export function FiledSection({ filed }: { filed: FiledCaseRow[] }) {
  return (
    <div className="px-6 sm:px-14 py-7">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">Recently filed cases</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track scrutiny, listing and disposal status of cases you&apos;ve filed.
          </p>
        </div>
        <Link
          href="/cases"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-teal hover:text-teal-dark no-underline"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {filed.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">
          No cases filed in the last 12 months.
        </p>
      ) : (
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Case No.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Filed on</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Next date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filed.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{c.caseNo}</td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{c.title}</td>
                  <td className="px-4 py-3 text-slate-400 dark:text-slate-500">{c.type}</td>
                  <td className="px-4 py-3 text-slate-400 dark:text-slate-500">{c.filedOn}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center h-[22px] px-2 rounded-full text-[11px] font-semibold",
                      c.statusKind === "success"
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                    )}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{c.nextDate}</td>
                  <td className="px-4 py-3">
                    <button
                      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 transition-colors"
                      aria-label="Open case"
                    >
                      <ExternalLink size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
