import { Button } from "@/components/ui/button";
import { Info, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumStepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  info?: boolean;
  className?: string;
}

export function NumStepper({
  label,
  value,
  onChange,
  min = 1,
  info = false,
  className,
}: NumStepperProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
        {label}
        {info && (
          <Info className="inline w-3.5 h-3.5 ml-1 align-middle text-slate-400" />
        )}
        :
      </span>
      <Button
        variant="outline"
        size="icon-xs"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label="Decrease"
      >
        <Minus className="w-3.5 h-3.5" />
      </Button>
      <span className="w-7 text-center text-sm font-medium tabular-nums text-slate-800 dark:text-slate-200">
        {value}
      </span>
      <Button
        variant="outline"
        size="icon-xs"
        onClick={() => onChange(value + 1)}
        aria-label="Increase"
      >
        <Plus className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
