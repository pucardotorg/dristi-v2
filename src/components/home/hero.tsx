import type { HomeStats } from "@/src/data/home";

export function HeroSection({ stats }: { stats: HomeStats }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 sm:gap-10 px-6 sm:px-14 pt-8 sm:pt-10 pb-7 sm:pb-8 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-teal dark:text-teal mb-2">
          Welcome back
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2 tracking-tight">
          Your e-Filing dashboard
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          File new cases, continue drafts, and track the status of cases you&apos;ve already filed — all in one place.
        </p>
      </div>
      <div className="flex gap-3.5 shrink-0">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 min-w-[150px] shadow-sm">
          <div className="text-[28px] font-bold text-slate-900 dark:text-slate-50 leading-none">{stats.draftCount}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Drafts in progress</div>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 min-w-[150px] shadow-sm">
          <div className="text-[28px] font-bold text-slate-900 dark:text-slate-50 leading-none">{stats.filedCount}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Cases filed (12 months)</div>
        </div>
      </div>
    </div>
  );
}
