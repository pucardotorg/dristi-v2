"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Landmark, Users, ShoppingCart, Clock, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CASE_TYPES, S138_DOCS, type CaseType } from "@/src/data/home";
import { DocsModal } from "@/src/components/home/docs-modal";

const ICONS = {
  s138: Banknote,
  civil: Landmark,
  matrimonial: Users,
  consumer: ShoppingCart,
} as const;

const ICON_COLORS: Record<string, string> = {
  teal: "bg-teal-soft text-teal",
  blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
  amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
  purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400",
};

export function CaseTypesSection() {
  const router = useRouter();
  const [modalCase, setModalCase] = useState<CaseType | null>(null);

  function handleStartFiling(c: CaseType) {
    if (c.id === "s138") {
      setModalCase(c);
    } else {
      router.push("/cases/new");
    }
  }

  return (
    <div className="px-6 sm:px-14 py-7 border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">Start a new case</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Choose the type of case you want to file. We&apos;ll guide you through the rest.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CASE_TYPES.map((c) => {
          const Icon = ICONS[c.id];
          return (
            <div
              key={c.id}
              className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5 flex flex-col shadow-sm hover:border-teal dark:hover:border-teal hover:shadow-md transition-all"
            >
              <div className={cn("w-11 h-11 rounded-[10px] inline-flex items-center justify-center mb-3.5", ICON_COLORS[c.iconColor])}>
                <Icon size={22} />
              </div>
              <div className="text-[15px] font-semibold text-slate-900 dark:text-slate-50 mb-1.5 leading-snug">{c.name}</div>
              <div className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed mb-3 flex-1">{c.desc}</div>
              <div className="flex gap-3.5 text-xs text-slate-400 py-2 border-t border-dashed border-slate-200 dark:border-slate-700 mb-3.5">
                <span className="flex items-center gap-1"><Clock size={12} />{c.timeLabel}</span>
                <span className="flex items-center gap-1"><FileText size={12} />{c.docCount} documents</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="gap-1 bg-teal text-white hover:bg-teal-dark"
                  onClick={() => handleStartFiling(c)}
                >
                  Start Filing <ArrowRight className="w-3 h-3" />
                </Button>
                <Button variant="outline" size="sm" className="text-slate-500 text-xs">
                  Learn more
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <DocsModal
        open={modalCase !== null}
        caseTypeName={modalCase?.name ?? ""}
        docs={S138_DOCS}
        onClose={() => setModalCase(null)}
      />
    </div>
  );
}
