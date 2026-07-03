"use client";

import { useRouter } from "next/navigation";
import { MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DraftCard } from "@/lib/cases-query";

export function DraftsSection({ drafts }: { drafts: DraftCard[] }) {
  const router = useRouter();

  return (
    <div className="px-6 sm:px-14 py-7 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">Continue a draft</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Pick up where you left off. Drafts are auto-saved.</p>
        </div>
      </div>

      {drafts.length === 0 ? (
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">No drafts yet. Start a new filing below.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {drafts.map((d) => (
            <div
              key={d.id}
              className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm hover:border-teal dark:hover:border-teal transition-colors"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="inline-flex items-center h-5 px-2 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[11px] font-semibold">
                  {d.badge}
                </span>
                <span className="text-xs text-slate-400">{d.savedAgo}</span>
              </div>
              <div className="text-[17px] font-semibold text-slate-900 dark:text-slate-50 mb-1">{d.title}</div>
              <div className="flex items-center gap-1 text-[13px] text-slate-500 dark:text-slate-400 mb-3.5">
                <MapPin size={13} />
                {d.court}
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal to-teal"
                  style={{ width: `${d.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mb-3.5">
                <span className="text-slate-400">In progress · {d.stepLabel}</span>
                <span className="font-semibold text-teal">{d.progress}%</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="gap-1.5 bg-teal text-white hover:bg-teal-dark"
                  onClick={() => router.push(`/cases/new?id=${d.id}`)}
                >
                  Continue <ArrowRight className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" className="text-slate-500">
                  Discard
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
