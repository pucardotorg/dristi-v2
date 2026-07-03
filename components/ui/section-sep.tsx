import { Info } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface SectionSepProps {
  label: string;
  info?: boolean;
  strong?: boolean;
}

export function SectionSep({ label, info, strong }: SectionSepProps) {
  return (
    <div className="section-sep">
      <span className={strong ? "section-sep-label-strong" : "section-sep-label"}>
        {label}
        {info && (
          <Info className="inline w-3.5 h-3.5 ml-1 align-middle text-slate-400 hover:text-blue-600 cursor-help" />
        )}
      </span>
      <Separator className="flex-1" />
    </div>
  );
}
