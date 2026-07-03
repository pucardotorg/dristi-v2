"use client";

import { useRouter } from "next/navigation";
import { Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useFilingStore } from "@/src/stores/filing-store";
import type { DocItem } from "@/src/data/home";

interface DocsModalProps {
  open: boolean;
  caseTypeName: string;
  docs: DocItem[];
  onClose: () => void;
}

export function DocsModal({ open, caseTypeName, docs, onClose }: DocsModalProps) {
  const router = useRouter();

  function handleStart() {
    useFilingStore.getState().resetToNew();
    router.push("/cases/new");
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Documents required ({docs.length})</DialogTitle>
          <DialogDescription>
            Have these ready before you start. You can also save and come back later.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800 py-1 max-h-[60vh] overflow-y-auto">
          {docs.map((d) => (
            <div key={d.num} className="flex items-start gap-3 py-3.5">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-teal-soft text-teal text-[11px] font-bold shrink-0 mt-0.5">
                {d.num}
              </span>
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-50">{d.title}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{d.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button variant="ghost" disabled className="gap-1.5 text-slate-400">
            <Download className="w-3.5 h-3.5" />
            Download checklist
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Back</Button>
            <Button className="gap-1.5 bg-teal text-white hover:bg-teal-dark" onClick={handleStart}>
              Start Filing <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
