"use client";

import {
  ArrowLeft,
  Info,
  Clock,
  ChevronDown,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { Step } from "@/src/data/steps";

interface SidebarProps {
  steps: Step[];
  activeStepId: string;
  activeSubId: string | null;
  openSteps: Record<string, boolean>;
  done: Record<string, boolean>;
  onToggle: (stepId: string) => void;
  onPick: (stepId: string, subId: string) => void;
  onHome: () => void;
  toastTitle?: string;
  toastDesc?: string;
}

export function Sidebar({
  steps,
  activeStepId,
  activeSubId,
  openSteps,
  done,
  onToggle,
  onPick,
  onHome,
  toastTitle = "You are filing a case",
  toastDesc = "Under S-138, Negotiable Instruments Act in the 24×7 ON Court, Chandigarh",
}: SidebarProps) {
  const openValues = Object.entries(openSteps)
    .filter(([, open]) => open)
    .map(([id]) => id);

  return (
    <aside className="w-[288px] h-full flex flex-col gap-5 px-5 py-6 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
      <Button
        variant="ghost"
        className="justify-start gap-2 text-teal hover:text-teal-dark hover:bg-teal-soft dark:hover:bg-slate-800 px-0"
        onClick={onHome}
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Go to Home</span>
      </Button>

      <div className="rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 p-4 flex gap-3">
        <span className="inline-flex shrink-0 items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white">
          <Info className="w-3 h-3" />
        </span>
        <div className="flex flex-col gap-1">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {toastTitle}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {toastDesc}
          </div>
        </div>
      </div>

      <Accordion
        multiple
        value={openValues}
        onValueChange={(values) => {
          steps.forEach((s) => {
            const shouldBeOpen = values.includes(s.id);
            const isOpen = !!openSteps[s.id];
            if (shouldBeOpen !== isOpen) onToggle(s.id);
          });
        }}
        className="flex flex-col gap-1"
      >
        {steps.map((step, i) => {
          const isActive = step.id === activeStepId;
          const hasSubs = step.subs.length > 0;

          return (
            <AccordionItem
              key={step.id}
              value={step.id}
              className={cn(
                "border-0 rounded-lg overflow-hidden",
                isActive && "bg-teal-soft dark:bg-teal/10"
              )}
            >
              {hasSubs ? (
                <AccordionTrigger
                  className={cn(
                    "py-3 px-3 hover:no-underline hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg [&[data-state=open]]:rounded-b-none [&_[data-slot=accordion-trigger-icon]]:hidden",
                    isActive && "hover:bg-teal-soft/50 dark:hover:bg-teal/10"
                  )}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {i + 1}.
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {step.title}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mr-2">
                    <Clock className="w-3.5 h-3.5" />
                    {step.time}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-5 h-5 text-slate-900 dark:text-slate-100 transition-transform duration-200 shrink-0",
                      openSteps[step.id] && "rotate-180"
                    )}
                  />
                </AccordionTrigger>
              ) : (
                <button
                  type="button"
                  onClick={() => onPick(step.id, step.subs[0]?.id ?? "")}
                  className={cn(
                    "w-full flex items-center justify-between py-3 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left",
                    isActive && "bg-teal-soft dark:bg-teal/10"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {i + 1}.
                    </span>
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {step.title}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    {step.time}
                  </span>
                </button>
              )}

              {hasSubs && (
                <AccordionContent className="pb-0">
                  <div className="flex flex-col py-1">
                    {step.subs.map((sub) => {
                      const subDone = done[`${step.id}/${sub.id}`];
                      const subActive =
                        step.id === activeStepId && sub.id === activeSubId;

                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => onPick(step.id, sub.id)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm text-left rounded-md transition-colors",
                            subActive
                              ? "text-teal font-semibold bg-teal/5 dark:bg-teal/10"
                              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
                            subDone && !subActive && "text-slate-500 dark:text-slate-500"
                          )}
                        >
                          <span
                            className={cn(
                              "inline-flex shrink-0 items-center justify-center w-4 h-4 rounded-full border",
                              subActive
                                ? "border-teal bg-teal text-white"
                                : subDone
                                ? "border-teal bg-teal text-white"
                                : "border-slate-300 dark:border-slate-600"
                            )}
                          >
                            {subDone && (
                              <Check className="w-2.5 h-2.5 text-white" />
                            )}
                          </span>
                          <span>{sub.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </AccordionContent>
              )}
            </AccordionItem>
          );
        })}
      </Accordion>
    </aside>
  );
}
